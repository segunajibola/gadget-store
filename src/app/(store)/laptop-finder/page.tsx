import type { Metadata } from "next";
import { getSettings } from "@/lib/store";
import { USE_CASES } from "@/lib/laptop-finder";
import { LaptopFinder } from "./LaptopFinder";

export const metadata: Metadata = {
  title: "Laptop finder — get free recommendations",
  description:
    "Tell us what you need a laptop for and your budget. We'll recommend the right one — new, UK-used or refurbished — and help you get it in Lagos.",
};

// Reads ?use=… (from the home page "Shop by need" tiles) to pre-select the use case.
export default async function LaptopFinderPage({ searchParams }: { searchParams: Promise<{ use?: string }> }) {
  const [settings, { use }] = await Promise.all([getSettings(), searchParams]);
  const initialUseCase = use && use in USE_CASES ? use : "";
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">Find the right laptop</h1>
      <p className="mt-2 max-w-2xl text-slate-700">
        Not sure which laptop to buy? Answer a few quick questions and we&apos;ll suggest laptops that fit your work and
        budget — then we&apos;ll reach out to help you choose, and source it for you if we don&apos;t have it in stock.
      </p>
      <div className="mt-8">
        <LaptopFinder
          calendlyUrl={settings.calendlyUrl}
          whatsappNumber={settings.whatsappNumber}
          storeName={settings.storeName}
          initialUseCase={initialUseCase}
        />
      </div>
    </div>
  );
}
