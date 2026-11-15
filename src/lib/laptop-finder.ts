/**
 * Laptop finder options — shared by the form (browser) and the server action.
 * Values are stored in laptop_requests; labels are what customers see.
 */

export const USE_CASES = {
  programming: "Programming / software development",
  office: "Office work, school & browsing",
  design: "Graphic design / video editing",
  business: "Business on the go (light & long battery)",
  gaming: "Gaming",
  other: "Something else",
} as const;
export type UseCase = keyof typeof USE_CASES;

export const CONDITION_PREFS = {
  any: "No preference",
  new: "New only",
  uk_used: "UK-used is fine",
  refurbished: "Refurbished is fine",
} as const;
export type ConditionPref = keyof typeof CONDITION_PREFS;

export const BRANDS = {
  dell: "Dell",
  hp: "HP",
  lenovo: "Lenovo",
  apple: "Apple (MacBook)",
} as const;
export type Brand = keyof typeof BRANDS;

/** Budget options in kobo (₦ × 100). */
export const BUDGETS: { value: number; label: string }[] = [
  { value: 25_000_000, label: "Up to ₦250,000" },
  { value: 40_000_000, label: "Up to ₦400,000" },
  { value: 60_000_000, label: "Up to ₦600,000" },
  { value: 90_000_000, label: "Up to ₦900,000" },
  { value: 150_000_000, label: "Up to ₦1,500,000" },
  { value: 300_000_000, label: "Above ₦1,500,000" },
];

export const RAM_OPTIONS = ["Not sure", "8GB", "16GB", "32GB or more"] as const;
export const STORAGE_OPTIONS = ["Not sure", "256GB SSD", "512GB SSD", "1TB SSD or more"] as const;
export const SCREEN_OPTIONS = ["Not sure", '13–14 inch (portable)', '15–16 inch (bigger screen)'] as const;

/** What the AI returns (after we validate it). */
export type LaptopAdvice = {
  summary: string;
  inStore: { productId: string; reason: string }[];
  otherOptions: { model: string; specs: string; condition: string; reason: string }[];
  questionsForCall: string[];
};
