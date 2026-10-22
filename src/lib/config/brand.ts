// Default brand values. Later phases load these from Firestore siteSettings (admin editable).
export const brand = {
  name: "Avoltix",
  tagline: "Power Your Next Innovation.",
  description: "Electronics components, development boards, sensors and robotics kits.",
  skuPrefix: "AVX",
  orderPrefix: "AVX",
  themeColor: "#020617",
  domain: "Avoltix.in",
} as const;
