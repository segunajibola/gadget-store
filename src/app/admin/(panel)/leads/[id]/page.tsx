import { notFound } from "next/navigation";
import Link from "next/link";
import { Phone } from "lucide-react";
import { z } from "zod";
import { adminDb } from "@/lib/auth";
import { formatLagosDateTime } from "@/lib/dates";
import { BRANDS, CONDITION_PREFS, USE_CASES, type Brand, type ConditionPref, type UseCase } from "@/lib/laptop-finder";
import { formatNaira } from "@/lib/money";
import { formatNgPhone, waLink } from "@/lib/phone";
import { ActionForm } from "@/components/admin/ActionForm";
import { PageHeader } from "@/components/admin/PageHeader";
import { Field } from "@/components/ui/Field";
import { cardCls, inputCls, linkCls } from "@/components/ui/styles";
import { WhatsAppIcon } from "@/components/store/WhatsApp";
import { saveLead } from "../actions";

type Suggestions = {
  in_store?: { productId: string; reason: string }[];
  other_options?: { model: string; specs: string; condition: string; reason: string }[];
  questions_for_call?: string[];
};

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const db = await adminDb();

  const [{ data: lead }, { data: settings }] = await Promise.all([
    db.from("laptop_requests").select("*").eq("id", id).maybeSingle(),
    db.from("settings").select("store_name").single(),
  ]);
  if (!lead) notFound();

  const s = (lead.ai_suggestions ?? {}) as Suggestions;
  const productIds = (s.in_store ?? []).map((i) => i.productId);
  const { data: products } = productIds.length
    ? await db.from("products").select("id, name, selling_price, cost_price").in("id", productIds)
    : { data: [] };
  const productById = new Map((products ?? []).map((p) => [p.id, p]));

  const firstName = lead.name.split(" ")[0];
  const wa = waLink(
    lead.phone,
    `Hi ${firstName}, this is ${settings?.store_name ?? "us"}. Thanks for using our laptop finder! I'd love to help you pick the right laptop for ${(USE_CASES[lead.use_case as UseCase] ?? "your work").toLowerCase()}. When is a good time for a quick call?`,
  );

  const rows: [string, string][] = [
    ["Main use", USE_CASES[lead.use_case as UseCase] ?? lead.use_case],
    ["Budget", `Up to ${formatNaira(lead.budget_max)}`],
    ["Condition", CONDITION_PREFS[lead.condition_pref as ConditionPref] ?? lead.condition_pref],
    ["Brands", lead.brands.length ? lead.brands.map((b) => BRANDS[b as Brand] ?? b).join(", ") : "Any"],
    ["RAM", lead.ram ?? "Not sure"],
    ["Storage", lead.storage ?? "Not sure"],
    ["Screen", lead.screen ?? "Not sure"],
  ];

  return (
    <>
      <PageHeader title={lead.name} back={{ href: "/admin/leads", label: "Leads" }} />
      <p className="-mt-4 mb-6 text-sm text-slate-500">Submitted {formatLagosDateTime(lead.created_at)}</p>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className={cardCls}>
            <h2 className="mb-3 font-semibold">What they want</h2>
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {rows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-slate-100 pb-1">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="text-right text-slate-900">{v}</dd>
                </div>
              ))}
            </dl>
            {lead.notes && (
              <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                <span className="font-medium text-slate-900">Their notes:</span> {lead.notes}
              </p>
            )}
          </section>

          <section className={cardCls}>
            <h2 className="mb-1 font-semibold">What the AI suggested (and the customer saw)</h2>
            {!lead.ai_summary ? (
              <p className="text-sm text-slate-500">No AI suggestions — the AI was unavailable. Recommend manually.</p>
            ) : (
              <div className="space-y-4 text-sm">
                <p className="text-slate-700">{lead.ai_summary}</p>
                <div>
                  <h3 className="font-medium text-slate-900">In-store picks</h3>
                  {(s.in_store ?? []).length === 0 ? (
                    <p className="text-slate-500">None matched — needs sourcing.</p>
                  ) : (
                    <ul className="mt-1 space-y-2">
                      {(s.in_store ?? []).map((i) => {
                        const p = productById.get(i.productId);
                        return (
                          <li key={i.productId}>
                            {p ? (
                              <Link href={`/admin/products/${p.id}`} className={`${linkCls} font-medium`}>{p.name}</Link>
                            ) : (
                              <span className="text-slate-500">(product removed)</span>
                            )}
                            {p && (
                              <span className="text-slate-500">
                                {" "}— {formatNaira(p.selling_price)} (margin {formatNaira(p.selling_price - p.cost_price)})
                              </span>
                            )}
                            <p className="text-slate-700">{i.reason}</p>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                {(s.other_options ?? []).length > 0 && (
                  <div>
                    <h3 className="font-medium text-slate-900">To source from vendors</h3>
                    <ul className="mt-1 space-y-2">
                      {s.other_options!.map((o) => (
                        <li key={o.model}>
                          <span className="font-medium text-slate-900">{o.model}</span>{" "}
                          <span className="text-slate-500">· {o.condition}</span>
                          <p className="text-slate-700">{o.specs} — {o.reason}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(s.questions_for_call ?? []).length > 0 && (
                  <div>
                    <h3 className="font-medium text-slate-900">Ask on the call</h3>
                    <ul className="mt-1 list-inside list-disc text-slate-700">
                      {s.questions_for_call!.map((q) => <li key={q}>{q}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className={cardCls}>
            <h2 className="mb-3 font-semibold">Contact</h2>
            <div className="space-y-1 text-sm">
              <p className="font-medium text-slate-900">{lead.name}</p>
              <a href={`tel:+${lead.phone}`} className={`${linkCls} inline-flex items-center gap-1`}>
                <Phone className="h-3.5 w-3.5" aria-hidden="true" /> {formatNgPhone(lead.phone)}
              </a>
              {lead.email && <p><a href={`mailto:${lead.email}`} className={linkCls}>{lead.email}</a></p>}
            </div>
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-md bg-whatsapp-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-whatsapp-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              <WhatsAppIcon className="h-4 w-4" /> Message on WhatsApp
            </a>
          </section>

          <section className={cardCls}>
            <h2 className="mb-3 font-semibold">Follow-up</h2>
            <ActionForm action={saveLead}>
              <input type="hidden" name="id" value={lead.id} />
              <Field label="Status">
                <select name="status" defaultValue={lead.status} className={inputCls}>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="closed">Closed</option>
                </select>
              </Field>
              <Field label="Notes (private)">
                <textarea name="admin_notes" rows={4} defaultValue={lead.admin_notes ?? ""} className={inputCls} />
              </Field>
            </ActionForm>
          </section>
        </div>
      </div>
    </>
  );
}
