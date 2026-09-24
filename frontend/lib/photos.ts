const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}`;

export const photos = {
  hero: {
    src: unsplash("1694286068611-d0c24cbc2cd5"),
    alt: "Volunteers handing out plates of freshly served food",
  },
  donor: {
    src: unsplash("1577219492769-b63a779fac28"),
    alt: "A chef plating food in a warmly lit restaurant kitchen",
  },
  volunteer: {
    src: unsplash("1631210616910-329ab20668e8"),
    alt: "A cyclist with an orange delivery bag riding through the city",
  },
  ngo: {
    src: unsplash("1615897570286-da936a5dfb81"),
    alt: "A food bank worker standing among shelves of stocked jars",
  },
  admin: {
    src: unsplash("1593113598332-cd288d649433"),
    alt: "Volunteers loading boxes of fresh produce onto a truck",
  },
  tracking: {
    src: unsplash("1762334673166-5d1809c165aa"),
    alt: "A volunteer riding a bicycle loaded with bags of food",
  },
  closing: {
    src: unsplash("1777712156931-d0f1c41fd6ef"),
    alt: "Neighbours sharing a meal at long tables outdoors at dusk",
  },
} as const;
