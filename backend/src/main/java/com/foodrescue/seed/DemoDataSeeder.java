package com.foodrescue.seed;

import com.foodrescue.config.AppProperties;
import com.foodrescue.entity.*;
import com.foodrescue.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalTime;

/**
 * Demo world (Chennai) so the full donation-to-delivery flow can be shown without manual database edits.
 * Seeds on first start when the users table is empty, and can be reset from the admin API while
 * SEED_DEMO_DATA=true. A reset keeps every account and re-creates all activity relative to "now".
 */
@Component
public class DemoDataSeeder implements ApplicationRunner {

    public static final String DEMO_PASSWORD = "demo12345";
    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    private final AppProperties props;
    private final UserRepository users;
    private final OrganizationRepository organizations;
    private final DonationRepository donations;
    private final PickupRepository pickups;
    private final LocationUpdateRepository locations;
    private final NotificationRepository notifications;
    private final MatchRequestRepository matchRequests;
    private final PasswordEncoder passwordEncoder;

    public DemoDataSeeder(AppProperties props, UserRepository users, OrganizationRepository organizations,
                          DonationRepository donations, PickupRepository pickups, LocationUpdateRepository locations,
                          NotificationRepository notifications, MatchRequestRepository matchRequests,
                          PasswordEncoder passwordEncoder) {
        this.props = props;
        this.users = users;
        this.organizations = organizations;
        this.donations = donations;
        this.pickups = pickups;
        this.locations = locations;
        this.notifications = notifications;
        this.matchRequests = matchRequests;
        this.passwordEncoder = passwordEncoder;
    }

    public record ResetResult(long donations, long pickups, long accounts) {
    }

    private record Cast(User restaurant, User hostel, User household, User arjun, User divya, User rahul,
                        User ngo, User shelterLead) {
    }

    public boolean isEnabled() {
        return props.seed().enabled();
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!isEnabled() || users.count() > 0) {
            return;
        }
        seedActivity(ensureDemoAccounts(), Instant.now());
        log.info("Seeded demo data. Sign in with donor@foodrescue.dev, volunteer@foodrescue.dev, ngo@foodrescue.dev "
                + "or admin@foodrescue.dev (password: {})", DEMO_PASSWORD);
    }

    /** Wipes all donations, pickups, locations and notifications, then re-creates the demo activity. */
    @Transactional
    public ResetResult reset() {
        matchRequests.deleteAllInBatch();
        locations.deleteAllInBatch();
        notifications.deleteAllInBatch();
        pickups.deleteAllInBatch();
        donations.deleteAllInBatch();
        seedActivity(ensureDemoAccounts(), Instant.now());
        log.info("Demo data reset");
        return new ResetResult(donations.count(), pickups.count(), users.count());
    }

    /** Creates any demo account that is missing (by email) and returns the cast used by the activity seed. */
    private Cast ensureDemoAccounts() {
        String hash = passwordEncoder.encode(DEMO_PASSWORD);
        account("Meera Iyer", "admin@foodrescue.dev", hash, Role.ADMIN, "+91 98400 11001", null, null, null, true, null);
        User restaurant = account("Annapoorna Kitchen", "donor@foodrescue.dev", hash, Role.DONOR, "+91 98400 22001", 13.0850, 80.2101, null, true, null);
        User hostel = account("Sunrise Hostel Mess", "hostel@foodrescue.dev", hash, Role.DONOR, "+91 98400 22002", 13.0067, 80.2206, null, true, null);
        User household = account("Karthik Raman", "karthik@foodrescue.dev", hash, Role.DONOR, "+91 98400 22003", 13.0339, 80.2619, null, true, null);
        User arjun = account("Arjun Nair", "volunteer@foodrescue.dev", hash, Role.VOLUNTEER, "+91 98400 33001", 13.0780, 80.2180, 40, true, null);
        User divya = account("Divya Menon", "divya@foodrescue.dev", hash, Role.VOLUNTEER, "+91 98400 33002", 13.0418, 80.2341, 25, false, null);
        User rahul = account("Rahul Verma", "rahul@foodrescue.dev", hash, Role.VOLUNTEER, "+91 98400 33003", 12.9815, 80.2180, 60, true, null);
        User ngo = account("Lakshmi Srinivasan", "ngo@foodrescue.dev", hash, Role.NGO, "+91 98400 44001", 13.0732, 80.2609, 200, true,
                new Organization("Chennai Community Food Bank", "Food bank", "Egmore, Chennai", "+91 44 2819 0001"));
        User shelterLead = account("Joseph Daniel", "shelter@foodrescue.dev", hash, Role.NGO, "+91 98400 44002", 13.0012, 80.2565, 80, false,
                new Organization("Hope Shelter", "Shelter", "Adyar, Chennai", "+91 44 2441 0002"));
        // Who can carry refrigerated food. Set every time so a reset restores the demo story.
        arjun.setHasCoolBox(true);
        rahul.setHasCoolBox(true);
        ngo.setHasCoolBox(true);
        divya.setHasCoolBox(false);
        shelterLead.setHasCoolBox(false);
        // Intake hours: the food bank works the day shift, the shelter takes food in the evening only.
        ngo.setOpeningHours(LocalTime.of(7, 0), LocalTime.of(23, 0));
        shelterLead.setOpeningHours(LocalTime.of(17, 0), LocalTime.of(23, 0));
        return new Cast(restaurant, hostel, household, arjun, divya, rahul, ngo, shelterLead);
    }

    private void seedActivity(Cast c, Instant now) {
        // Open donations at different urgencies, so the feed and match scores have something to show.
        Donation biryani = donation(c.restaurant(), "Vegetable biryani", FoodCategory.COOKED_MEAL, Dietary.VEG, "3 large trays", 80,
                "Freshly cooked for a cancelled catering order. Packed in foil trays.", now, 30, 42);
        Donation chapati = donation(c.hostel(), "Chapati and dal", FoodCategory.COOKED_MEAL, Dietary.VEG, "2 containers", 40,
                "Dinner surplus from the hostel mess.", now, 90, 150);
        Donation curry = donation(c.restaurant(), "Chicken curry and rice", FoodCategory.COOKED_MEAL, Dietary.NON_VEG, "4 containers", 35,
                "Lunch buffet surplus, kept refrigerated.", now, 60, 95);
        curry.setRequiresRefrigeration(true);

        // Open proposals, so every role has something waiting: the restaurant offered biryani to Arjun,
        // the food bank asked the restaurant for the curry, and Divya asked the hostel for chapati.
        matchRequests.save(new MatchRequest(biryani, c.arjun(), MatchDirection.OFFER,
                "You're closest and have space for all of it. Can you take it?", now.minus(Duration.ofMinutes(4))));
        matchRequests.save(new MatchRequest(curry, c.ngo(), MatchDirection.REQUEST,
                "We have cold storage and can collect within 30 minutes.", now.minus(Duration.ofMinutes(6))));
        matchRequests.save(new MatchRequest(chapati, c.divya(), MatchDirection.REQUEST,
                null, now.minus(Duration.ofMinutes(9))));
        donation(c.household(), "Assorted bread and buns", FoodCategory.BAKERY, Dietary.VEG, "1 carton", 25,
                "Unopened packs from a family event.", now, 300, 600);
        donation(c.hostel(), "Fresh fruit crates", FoodCategory.PRODUCE, Dietary.VEG, "3 crates", 60,
                "Bananas and apples, good for two days.", now, 1440, 2880);

        // An active pickup in transit with a short trail, so the live map has something to show immediately.
        Donation idli = donation(c.restaurant(), "Idli and sambar", FoodCategory.COOKED_MEAL, Dietary.VEG, "2 large tiffins", 50,
                "Breakfast surplus.", now, 45, 120);
        idli.setStatus(DonationStatus.IN_TRANSIT);
        Pickup active = pickups.save(new Pickup(idli, c.arjun(), now.minus(Duration.ofMinutes(25))));
        active.moveTo(PickupStatus.ARRIVED, now.minus(Duration.ofMinutes(15)));
        active.moveTo(PickupStatus.PICKED_UP, now.minus(Duration.ofMinutes(12)));
        active.moveTo(PickupStatus.IN_TRANSIT, now.minus(Duration.ofMinutes(10)));
        active.setSharingLocation(true);
        double[][] trail = {{13.0850, 80.2101}, {13.0829, 80.2178}, {13.0805, 80.2262}, {13.0781, 80.2355}, {13.0760, 80.2431}, {13.0746, 80.2502}};
        for (int i = 0; i < trail.length; i++) {
            Instant at = now.minus(Duration.ofMinutes(10 - i * 2L));
            locations.save(new LocationUpdate(active, trail[i][0], trail[i][1], at));
            active.recordLocation(trail[i][0], trail[i][1], at);
        }

        // Completed history for the impact dashboard.
        delivered(c.restaurant(), c.rahul(), "Paneer butter masala and rotis", 45, now, 2);
        delivered(c.hostel(), c.ngo(), "Lemon rice and curd rice", 70, now, 5);
        delivered(c.household(), c.divya(), "Birthday party snacks", 20, now, 26);
        delivered(c.restaurant(), c.shelterLead(), "Sambar rice", 55, now, 30);

        Donation expired = donation(c.household(), "Leftover pulao", FoodCategory.COOKED_MEAL, Dietary.VEG, "1 pot", 15,
                "Posted too late in the evening.", now.minus(Duration.ofHours(20)), 60, 120);
        expired.setStatus(DonationStatus.EXPIRED);
    }

    private User account(String name, String email, String hash, Role role, String phone,
                         Double lat, Double lng, Integer capacity, boolean acceptsNonVeg, Organization org) {
        return users.findByEmailIgnoreCase(email).orElseGet(() -> {
            User u = new User(name, email, hash, role);
            u.setPhone(phone);
            u.setLocation(lat, lng);
            u.setCapacityServings(capacity);
            u.setAcceptsNonVeg(acceptsNonVeg);
            if (org != null) u.setOrganization(organizations.save(org));
            return users.save(u);
        });
    }

    private Donation donation(User donor, String food, FoodCategory category, Dietary dietary, String quantity,
                              int servings, String description, Instant from, int deadlineMinutes, int expiryMinutes) {
        Donation d = new Donation(donor, food, category, dietary, quantity, servings, description, null,
                addressFor(donor), donor.getLatitude(), donor.getLongitude(),
                from.plus(Duration.ofMinutes(deadlineMinutes)), from.plus(Duration.ofMinutes(expiryMinutes)));
        if (category == FoodCategory.COOKED_MEAL || category == FoodCategory.BAKERY) {
            d.setPreparedAt(from.minus(Duration.ofMinutes(category == FoodCategory.BAKERY ? 180 : 75)));
        }
        return donations.save(d);
    }

    private void delivered(User donor, User collector, String food, int servings, Instant now, int hoursAgo) {
        Instant start = now.minus(Duration.ofHours(hoursAgo));
        Donation d = donation(donor, food, FoodCategory.COOKED_MEAL, Dietary.VEG, null, servings,
                "Delivered earlier.", start, 60, 180);
        d.setStatus(DonationStatus.DELIVERED);
        Pickup p = pickups.save(new Pickup(d, collector, start.plus(Duration.ofMinutes(5))));
        p.moveTo(PickupStatus.ARRIVED, start.plus(Duration.ofMinutes(20)));
        p.moveTo(PickupStatus.PICKED_UP, start.plus(Duration.ofMinutes(25)));
        p.moveTo(PickupStatus.IN_TRANSIT, start.plus(Duration.ofMinutes(26)));
        p.moveTo(PickupStatus.DELIVERED, start.plus(Duration.ofMinutes(48)));
    }

    private static String addressFor(User donor) {
        return switch (donor.getEmail()) {
            case "donor@foodrescue.dev" -> "2nd Avenue, Anna Nagar, Chennai";
            case "hostel@foodrescue.dev" -> "Guindy Hostel Road, Chennai";
            default -> "Luz Church Road, Mylapore, Chennai";
        };
    }
}
