"use server";
/**
 * Laptop finder submission. Public endpoint, so:
 *  - inputs validated with zod
 *  - hidden "website" field catches simple bots (humans never fill it)
 *  - max 3 requests per phone number per 24h (each one costs an AI call)
 */
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicClient } from "@/lib/supabase/public";
import { getLaptopAdvice } from "@/lib/laptop-advisor";
import {
  BRANDS,
  CONDITION_PREFS,
  RAM_OPTIONS,
  SCREEN_OPTIONS,
  STORAGE_OPTIONS,
  USE_CASES,
  type Brand,
  type ConditionPref,
  type LaptopAdvice,
  type UseCase,
} from "@/lib/laptop-finder";
import { normalizeNgPhone } from "@/lib/phone";
import { PRODUCT_COLUMNS, toProduct, type Product } from "@/lib/products";

const keysOf = <T extends object>(o: T) => Object.keys(o) as [keyof T & string, ...(keyof T & string)[]];
/** "Not sure" / unknown → null */
const optionalChoice = (options: readonly string[]) =>
  z
    .string()
    .optional()
    .transform((v) => (v && v !== options[0] && options.includes(v) ? v : null));

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  phone: z.string().transform((v, ctx) => {
    const p = normalizeNgPhone(v);
    if (!p) {
      ctx.addIssue({ code: "custom", message: "Enter a valid Nigerian phone number" });
      return z.NEVER;
    }
    return p;
  }),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .optional()
    .transform((v) => v || null)
    .pipe(z.email("Enter a valid email address").nullable()),
  useCase: z.enum(keysOf(USE_CASES)),
  conditionPref: z.enum(keysOf(CONDITION_PREFS)),
  brands: z.array(z.enum(keysOf(BRANDS))).max(4),
  budgetMax: z.number().int().positive().max(1_000_000_000),
  ram: optionalChoice(RAM_OPTIONS),
  storage: optionalChoice(STORAGE_OPTIONS),
  screen: optionalChoice(SCREEN_OPTIONS),
  notes: z.string().trim().max(500).optional().transform((v) => v || null),
  website: z.string().max(0).optional(), // honeypot
});

export type LaptopFinderInput = z.input<typeof schema>;
export type LaptopFinderResult =
  | {
      ok: true;
      advice: LaptopAdvice | null; // null = AI unavailable; we'll still call them
      products: Product[]; // in-store picks, same order as advice.inStore
    }
  | { ok: false; error: string };

export async function submitLaptopRequest(input: LaptopFinderInput): Promise<LaptopFinderResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    if (parsed.error.issues.some((i) => i.path[0] === "website")) return { ok: false, error: "Something went wrong." };
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const d = parsed.data;
  const admin = createAdminClient();

  // Simple abuse limit (each request costs an AI call).
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("laptop_requests")
    .select("id", { count: "exact", head: true })
    .eq("phone", d.phone)
    .gte("created_at", since);
  if ((count ?? 0) >= 3) {
    return {
      ok: false,
      error: "You've already sent us a few requests today — we'll be in touch soon. You can also chat with us on WhatsApp.",
    };
  }

  // In-stock laptops (public view → no cost prices or vendor details).
  const { data: rows } = await createPublicClient()
    .from("public_products")
    .select(PRODUCT_COLUMNS)
    .eq("category", "laptops")
    .eq("stock_status", "available")
    .order("created_at", { ascending: false })
    .limit(60);
  const inStock = (rows ?? []).map(toProduct);

  const advice = await getLaptopAdvice(
    {
      useCase: d.useCase as UseCase,
      conditionPref: d.conditionPref as ConditionPref,
      brands: d.brands as Brand[],
      budgetMax: d.budgetMax,
      ram: d.ram,
      storage: d.storage,
      screen: d.screen,
      notes: d.notes,
    },
    inStock,
  );

  const { error } = await admin.from("laptop_requests").insert({
    name: d.name,
    phone: d.phone,
    email: d.email,
    use_case: d.useCase,
    condition_pref: d.conditionPref,
    brands: d.brands,
    budget_max: d.budgetMax,
    ram: d.ram,
    storage: d.storage,
    screen: d.screen,
    notes: d.notes,
    ai_summary: advice?.summary ?? null,
    ai_suggestions: advice
      ? { in_store: advice.inStore, other_options: advice.otherOptions, questions_for_call: advice.questionsForCall }
      : null,
  });
  if (error) {
    console.error("[laptop finder] insert", error);
    return { ok: false, error: "We couldn't save your request. Please try again or chat with us on WhatsApp." };
  }

  const byId = new Map(inStock.map((p) => [p.id, p]));
  const products = (advice?.inStore ?? []).map((i) => byId.get(i.productId)!).filter(Boolean);
  return { ok: true, advice, products };
}
