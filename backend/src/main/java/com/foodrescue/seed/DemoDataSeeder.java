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

/**
 * Seeds a demo world (Chennai) on first start so the full donation-to-delivery flow can be shown
 * without manual database edits. Runs only when the users table is empty and SEED_DEMO_DATA=true.
 * Every demo account uses the password below.
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
    private final PasswordEncoder passwordEncoder;

    public DemoDataSeeder(AppProperties props, UserRepository users, OrganizationRepository organizations,
                          DonationRepository donations, PickupRepository pickups,
                          LocationUpdateRepository locations, PasswordEncoder passwordEncoder) {
        this.props = props;
        this.users = users;
        this.organizations = organizations;
        this.donations = donations;
        this.pickups = pickups;
        this.locations = locations;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!props.seed().enabled() || users.count() > 0) {
            return;
        }
        Instant now = Instant.now();
        String hash = passwordEncoder.encode(DEMO_PASSWORD);

        user("Meera Iyer", "admin@foodrescue.dev", hash, Role.ADMIN, "+91 98400 11001", null, null, null, true);

        User restaurant = user("Annapoorna Kitchen", "donor@foodrescue.dev", hash, Role.DONOR, "+91 98400 22001", 13.0850, 80.2101, null, true);
        User hostel = user("Sunrise Hostel Mess", "hostel@foodrescue.dev", hash, Role.DONOR, "+91 98400 22002", 13.0067, 80.2206, null, true);
        User household = user("Karthik Raman", "karthik@foodrescue.dev", hash, Role.DONOR, "+91 98400 22003", 13.0339, 80.2619, null, true);

        User arjun = user("Arjun Nair", "volunteer@foodrescue.dev", hash, Role.VOLUNTEER, "+91 98400 33001", 13.0780, 80.2180, 40, true);
        User divya = user("Divya Menon", "divya@foodrescue.dev", hash, Role.VOLUNTEER, "+91 98400 33002", 13.0418, 80.2341, 25, false);
        User rahul = user("Rahul Verma", "rahul@foodrescue.dev", hash, Role.VOLUNTEER, "+91 98400 33003", 12.9815, 80.2180, 60, true);

        Organization foodBank = organizations.save(new Organization("Chennai Community Food Bank", "Food bank", "Egmore, Chennai", "+91 44 2819 0001"));
        Organization shelter = organizations.save(new Organization("Hope Shelter", "Shelter", "Adyar, Chennai", "+91 44 2441 0002"));
        User ngo = user("Lakshmi Srinivasan", "ngo@foodrescue.dev", hash, Role.NGO, "+91 98400 44001", 13.0732, 80.2609, 200, true);
        ngo.setOrganization(foodBank);
        User shelterLead = user("Joseph Daniel", "shelter@foodrescue.dev", hash, Role.NGO, "+91 98400 44002", 13.0012, 80.2565, 80, false);
        shelterLead.setOrganization(shelter);

        // Open donations at different urgencies, so the feed and match scores have something to show.
        donation(restaurant, "Vegetable biryani", FoodCategory.COOKED_MEAL, Dietary.VEG, "3 large trays", 80,
                "Freshly cooked for a cancelled catering order. Packed in foil trays.", now, 30, 42);
        donation(hostel, "Chapati and dal", FoodCategory.COOKED_MEAL, Dietary.VEG, "2 containers", 40,
                "Dinner surplus from the hostel mess.", now, 90, 150);
        donation(restaurant, "Chicken curry and rice", FoodCategory.COOKED_MEAL, Dietary.NON_VEG, "4 containers", 35,
                "Lunch buffet surplus, kept refrigerated.", now, 60, 95);
        donation(household, "Assorted bread and buns", FoodCategory.BAKERY, Dietary.VEG, "1 carton", 25,
                "Unopened packs from a family event.", now, 300, 600);
        donation(hostel, "Fresh fruit crates", FoodCategory.PRODUCE, Dietary.VEG, "3 crates", 60,
                "Bananas and apples, good for two days.", now, 1440, 2880);

        // An active pickup in transit with a short trail, so the live map has something to show immediately.
        Donation idli = donation(restaurant, "Idli and sambar", FoodCategory.COOKED_MEAL, Dietary.VEG, "2 large tiffins", 50,
                "Breakfast surplus.", now, 45, 120);
        idli.setStatus(DonationStatus.IN_TRANSIT);
        Pickup active = pickups.save(new Pickup(idli, arjun, now.minus(Duration.ofMinutes(25))));
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
        delivered(restaurant, rahul, "Paneer butter masala and rotis", 45, now, 2);
        delivered(hostel, ngo, "Lemon rice and curd rice", 70, now, 5);
        delivered(household, divya, "Birthday party snacks", 20, now, 26);
        delivered(restaurant, shelterLead, "Sambar rice", 55, now, 30);

        Donation expired = donation(household, "Leftover pulao", FoodCategory.COOKED_MEAL, Dietary.VEG, "1 pot", 15,
                "Posted too late in the evening.", now.minus(Duration.ofHours(20)), 60, 120);
        expired.setStatus(DonationStatus.EXPIRED);

        log.info("Seeded demo data. Sign in with donor@foodrescue.dev, volunteer@foodrescue.dev, ngo@foodrescue.dev "
                + "or admin@foodrescue.dev (password: {})", DEMO_PASSWORD);
    }

    private User user(String name, String email, String hash, Role role, String phone,
                      Double lat, Double lng, Integer capacity, boolean acceptsNonVeg) {
        User u = new User(name, email, hash, role);
        u.setPhone(phone);
        u.setLocation(lat, lng);
        u.setCapacityServings(capacity);
        u.setAcceptsNonVeg(acceptsNonVeg);
        return users.save(u);
    }

    private Donation donation(User donor, String food, FoodCategory category, Dietary dietary, String quantity,
                              int servings, String description, Instant from, int deadlineMinutes, int expiryMinutes) {
        return donations.save(new Donation(donor, food, category, dietary, quantity, servings, description, null,
                addressFor(donor), donor.getLatitude(), donor.getLongitude(),
                from.plus(Duration.ofMinutes(deadlineMinutes)), from.plus(Duration.ofMinutes(expiryMinutes))));
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
