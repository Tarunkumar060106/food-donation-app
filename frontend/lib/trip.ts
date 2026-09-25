import type { Pickup } from "./types";

/** One-line description of where a pickup stands, from the collector's or the donor/admin's point of view. */
export function tripSummary(p: Pickup, viewer: "collector" | "observer") {
  const donor = p.donor.name;
  const collector = p.collector.name;
  if (viewer === "collector") {
    switch (p.status) {
      case "CLAIMED":
        return `Head to ${donor} to collect it.`;
      case "ARRIVED":
        return `You're at ${donor}. Collect the food when it's handed over.`;
      case "PICKED_UP":
        return `Collected from ${donor}. Start the delivery when you set off.`;
      case "IN_TRANSIT":
        return `Collected from ${donor}. On the way to deliver.`;
      case "DELIVERED":
        return `Collected from ${donor} and delivered.`;
      case "CANCELLED":
        return `You released this pickup from ${donor}.`;
    }
  }
  switch (p.status) {
    case "CLAIMED":
      return `${collector} is on the way to collect it.`;
    case "ARRIVED":
      return `${collector} has arrived at the pickup spot.`;
    case "PICKED_UP":
      return `${collector} has collected the food.`;
    case "IN_TRANSIT":
      return `${collector} collected it and is on the way to deliver.`;
    case "DELIVERED":
      return `Delivered by ${collector}.`;
    case "CANCELLED":
      return `${collector} released this pickup.`;
  }
}

export function isCollected(p: Pickup) {
  return p.status === "PICKED_UP" || p.status === "IN_TRANSIT" || p.status === "DELIVERED";
}
