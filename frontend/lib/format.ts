import { istHour } from "./time";
import type { DonationStatus, FoodCategory, PickupStatus, Role } from "./types";

export const roleLabel: Record<Role, string> = {
  DONOR: "Donor",
  VOLUNTEER: "Volunteer",
  NGO: "NGO",
  ADMIN: "Admin",
};

export const categoryLabel: Record<FoodCategory, string> = {
  COOKED_MEAL: "Cooked meal",
  BAKERY: "Bakery",
  PRODUCE: "Fruit & veg",
  PACKAGED: "Packaged",
  DAIRY: "Dairy",
  OTHER: "Other",
};

export const statusLabel: Record<DonationStatus | PickupStatus, string> = {
  AVAILABLE: "Available",
  CLAIMED: "Claimed",
  ARRIVED: "Arrived",
  PICKED_UP: "Picked up",
  IN_TRANSIT: "In transit",
  DELIVERED: "Delivered",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

export function minutesLabel(minutes: number) {
  if (minutes <= 0) return "Expired";
  if (minutes < 60) return `${minutes} min left`;
  const h = Math.floor(minutes / 60);
  if (h < 24) {
    const m = minutes % 60;
    return m ? `${h} h ${m} min left` : `${h} h left`;
  }
  const d = Math.floor(h / 24);
  return `${d} day${d > 1 ? "s" : ""} left`;
}

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function timeAgo(iso: string, now = Date.now()) {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return rtf.format(seconds, "second");
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), "hour");
  return rtf.format(Math.round(seconds / 86400), "day");
}

export function greeting(date = new Date()) {
  const h = istHour(date);
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export const numberFormat = new Intl.NumberFormat("en-IN");
