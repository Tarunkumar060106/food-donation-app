export type Role = "DONOR" | "VOLUNTEER" | "NGO" | "ADMIN";
export type FoodCategory = "COOKED_MEAL" | "BAKERY" | "PRODUCE" | "PACKAGED" | "DAIRY" | "OTHER";
export type Dietary = "VEG" | "NON_VEG";
export type DonationStatus =
  | "AVAILABLE"
  | "CLAIMED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "EXPIRED"
  | "CANCELLED";
export type PickupStatus = "CLAIMED" | "ARRIVED" | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";
export type Urgency = "CRITICAL" | "HIGH" | "NORMAL";

export type Organization = { id: string; name: string; type: string; address: string | null };

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  capacityServings: number | null;
  acceptsNonVeg: boolean;
  organization: Organization | null;
  createdAt: string;
};

export type Person = { id: string; name: string; role: Role; organizationName: string | null };
export type Contact = Person & { phone: string | null };

export type ScoreComponent = { signal: "urgency" | "distance" | "capacity" | "food"; weight: number; points: number };
export type MatchResult = {
  score: number;
  distanceKm: number | null;
  minutesToExpiry: number;
  breakdown: ScoreComponent[];
  reason: string;
};

export type PickupSummary = { id: string; status: PickupStatus; collector: Person; claimedAt: string };

export type Donation = {
  id: string;
  foodName: string;
  category: FoodCategory;
  dietary: Dietary;
  quantityDescription: string | null;
  servings: number;
  description: string | null;
  imageUrl: string | null;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  pickupDeadline: string;
  expiryTime: string;
  status: DonationStatus;
  minutesToExpiry: number;
  urgency: Urgency | null;
  distanceKm: number | null;
  match: MatchResult | null;
  donor: Person;
  activePickup: PickupSummary | null;
  createdAt: string;
};

export type LocationPoint = { lat: number; lng: number; recordedAt: string };

export type Pickup = {
  id: string;
  donationId: string;
  foodName: string;
  servings: number;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  expiryTime: string;
  status: PickupStatus;
  nextStatuses: PickupStatus[];
  collector: Contact;
  donor: Contact;
  sharingLocation: boolean;
  lastLocation: LocationPoint | null;
  claimedAt: string;
  arrivedAt: string | null;
  pickedUpAt: string | null;
  inTransitAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
};

export type Tracking = { pickup: Pickup; path: LocationPoint[] };

export type DashboardSummary = {
  scope: "platform" | "donor" | "collector";
  totalDonations: number;
  activePickups: number;
  completedDeliveries: number;
  expiredDonations: number;
  servingsRescued: number;
  byStatus: Record<string, number>;
};

export type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
};

export type Session = { userId: string; role: Role; name: string; expiresAt: number };

/** RFC 9457 ProblemDetail body returned by the Spring API on errors. */
export type Problem = { status: number; title?: string; detail?: string; errors?: Record<string, string> };
