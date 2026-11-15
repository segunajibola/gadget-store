"use client";

import { useState, useTransition } from "react";
import { CalendarDays, Loader2, Sparkles } from "lucide-react";
import {
  BRANDS,
  BUDGETS,
  CONDITION_PREFS,
  RAM_OPTIONS,
  SCREEN_OPTIONS,
  STORAGE_OPTIONS,
  USE_CASES,
  type Brand,
} from "@/lib/laptop-finder";
import { waLink } from "@/lib/phone";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { inputCls } from "@/components/ui/styles";
import { ProductCard } from "@/components/store/ProductCard";
import { WhatsAppIcon } from "@/components/store/WhatsApp";
import { submitLaptopRequest, type LaptopFinderResult } from "./actions";

type Ok = Extract<LaptopFinderResult, { ok: true }>;

export function LaptopFinder({
  calendlyUrl,
  whatsappNumber,
  storeName,
}: {
  calendlyUrl: string | null;
  whatsappNumber: string;
  storeName: string;
}) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    useCase: "",
    conditionPref: "any",
    budgetMax: "",
    ram: RAM_OPTIONS[0] as string,
    storage: STORAGE_OPTIONS[0] as string,
    screen: SCREEN_OPTIONS[0] as string,
    notes: "",
    website: "", // honeypot — hidden from humans
  });
  const [brands, setBrands] = useState<Brand[]>([]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Ok | null>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  const toggleBrand = (b: Brand) => setBrands((list) => (list.includes(b) ? list.filter((x) => x !== b) : [...list, b]));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await submitLaptopRequest({
        ...form,
        useCase: form.useCase as never,
        conditionPref: form.conditionPref as never,
        budgetMax: Number(form.budgetMax),
        brands,
      });
      if (!res.ok) setError(res.error);
      else {
        setResult(res);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  const chatLink = waLink(whatsappNumber, `Hi ${storeName}, I just used the laptop finder and I'd like some advice.`);
  const bookCall = calendlyUrl ? (
      <a
        href={calendlyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      >
        <CalendarDays className="h-5 w-5" aria-hidden="true" /> Book a free call
      </a>
    ) : null;
  const chat = (
    <a
      href={chatLink}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-md bg-whatsapp-700 px-5 py-2.5 font-medium text-white hover:bg-whatsapp-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
    >
      <WhatsAppIcon className="h-5 w-5" /> Chat on WhatsApp
    </a>
  );

  // ---------------- Results ----------------
  if (result) {
    const { advice, products } = result;
    const reasonFor = (id: string) => advice?.inStore.find((i) => i.productId === id)?.reason;
    return (
      <div className="space-y-8">
        <div className="rounded-lg border border-brand-200 bg-brand-50 p-5">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Sparkles className="h-5 w-5 text-brand-600" aria-hidden="true" />
            {advice ? "Here's what we recommend" : "Thanks — we've got your request"}
          </h2>
          <p className="mt-2 text-slate-700">
            {advice?.summary ??
              "We'll look at your needs and get back to you with the best options shortly."}
          </p>
          <p className="mt-3 text-sm text-slate-700">
            We&apos;ll reach out on <strong className="text-slate-900">{form.phone}</strong>{" "}
            to talk it through. Want to speak sooner?
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {bookCall}
            {chat}
          </div>
        </div>

        {products.length > 0 && (
          <section>
            <h3 className="mb-3 text-lg font-semibold">Available in our store now</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <div key={p.id} className="space-y-2">
                  <ProductCard product={p} />
                  {reasonFor(p.id) && <p className="text-sm text-slate-700">{reasonFor(p.id)}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {advice && advice.otherOptions.length > 0 && (
          <section>
            <h3 className="text-lg font-semibold">Other great options we can source for you</h3>
            <p className="mb-3 text-sm text-slate-500">
              Not in stock right now — we&apos;ll find one from our vetted vendors and send you a price.
            </p>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {advice.otherOptions.map((o) => (
                <li key={o.model} className="rounded-lg border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">{o.model}</p>
                  <p className="mt-1 text-sm text-slate-700">{o.specs}</p>
                  <p className="mt-1 text-xs font-medium text-brand-700">{o.condition}</p>
                  <p className="mt-2 text-sm text-slate-500">{o.reason}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {advice && advice.questionsForCall.length > 0 && (
          <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-semibold">On our call, we&apos;ll ask about</h3>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
              {advice.questionsForCall.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </section>
        )}

        <p className="text-xs text-slate-500">
          Suggestions are generated with AI from your answers and our current stock — we&apos;ll confirm everything with you
          before you buy.
        </p>
        <Button variant="secondary" onClick={() => setResult(null)}>
          Change my answers
        </Button>
      </div>
    );
  }

  // ---------------- Form ----------------
  return (
    <form onSubmit={submit} className="space-y-8">
      {/* Honeypot: visually hidden, skipped by keyboard & screen readers */}
      <div className="hidden" aria-hidden="true">
        <label>
          Website <input tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
        </label>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">What do you need it for?</h2>
        <fieldset className="grid gap-2 sm:grid-cols-2">
          <legend className="sr-only">Main use</legend>
          {Object.entries(USE_CASES).map(([value, label]) => (
            <label
              key={value}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500 ${
                form.useCase === value ? "border-brand-600 bg-brand-50 text-slate-900" : "border-slate-200 hover:border-brand-300"
              }`}
            >
              <input
                type="radio"
                name="useCase"
                required
                value={value}
                checked={form.useCase === value}
                onChange={set("useCase")}
                className="accent-brand-600"
              />
              {label}
            </label>
          ))}
        </fieldset>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Your preferences</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Budget">
            <select required value={form.budgetMax} onChange={set("budgetMax")} className={inputCls}>
              <option value="" disabled>
                Choose your budget…
              </option>
              {BUDGETS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="New or used?">
            <select value={form.conditionPref} onChange={set("conditionPref")} className={inputCls}>
              {Object.entries(CONDITION_PREFS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-700">Preferred brand (pick any, or none)</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(BRANDS) as [Brand, string][]).map(([value, label]) => {
              const on = brands.includes(value);
              return (
                <label
                  key={value}
                  className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500 ${
                    on ? "border-brand-200 bg-brand-100 font-medium text-brand-800" : "border-slate-200 text-slate-700 hover:border-brand-300"
                  }`}
                >
                  <input type="checkbox" className="sr-only" checked={on} onChange={() => toggleBrand(value)} />
                  {label}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="RAM">
            <select value={form.ram} onChange={set("ram")} className={inputCls}>
              {RAM_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Storage">
            <select value={form.storage} onChange={set("storage")} className={inputCls}>
              {STORAGE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Screen size">
            <select value={form.screen} onChange={set("screen")} className={inputCls}>
              {SCREEN_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Anything else? (optional)" hint="e.g. 'I code in Android Studio', 'needs a backlit keyboard', 'for my daughter at uni'">
          <textarea rows={3} maxLength={500} value={form.notes} onChange={set("notes")} className={inputCls} />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Where can we reach you?</h2>
        <p className="-mt-2 text-sm text-slate-500">
          We&apos;ll call or WhatsApp you to help you choose — and find it for you if it&apos;s not in our store.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Name">
            <input required autoComplete="name" value={form.name} onChange={set("name")} className={inputCls} />
          </Field>
          <Field label="Phone (WhatsApp)">
            <input required type="tel" autoComplete="tel" placeholder="0801 234 5678" value={form.phone} onChange={set("phone")} className={inputCls} />
          </Field>
          <Field label="Email (optional)">
            <input type="email" autoComplete="email" value={form.email} onChange={set("email")} className={inputCls} />
          </Field>
        </div>
      </section>

      {error && <Alert tone="danger">{error}</Alert>}

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Finding laptops for you…
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" aria-hidden="true" /> Get my recommendations
            </>
          )}
        </Button>
        {pending && <p className="text-sm text-slate-500" role="status">This can take up to 30 seconds.</p>}
      </div>
    </form>
  );
}

