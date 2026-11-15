import { MoneyInput } from "@/components/admin/MoneyInput";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/auth";
import { CATEGORIES, CONDITIONS, STOCK_STATUSES } from "@/lib/constants";
import { productImageUrl } from "@/lib/images";
import { koboToNaira } from "@/lib/money";
import { Alert } from "@/components/ui/Alert";
import { ActionForm } from "@/components/admin/ActionForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { PageHeader } from "@/components/admin/PageHeader";
import { Checkbox, Field } from "@/components/ui/Field";
import { cardCls, inputCls } from "@/components/ui/styles";
import { deleteProduct, saveProduct } from "../actions";
import { ImageManager } from "../ImageManager";
import { SpecsEditor } from "../SpecsEditor";

type Spec = { label: string; value: string };

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  const isNew = id === "new";
  const db = await adminDb();

  // Load the product (with images) and the vendor list in parallel.
  const [productRes, vendorsRes] = await Promise.all([
    isNew
      ? Promise.resolve({ data: null })
      : db
          .from("products")
          .select("*, product_images(id, storage_path, sort_order)")
          .eq("id", id)
          .order("sort_order", { referencedTable: "product_images" })
          .maybeSingle(),
    db.from("vendors").select("id, name, is_active").order("name"),
  ]);
  const product = productRes.data;
  if (!isNew && !product) notFound();
  const vendors = vendorsRes.data ?? [];

  return (
    <>
      <PageHeader
        title={isNew ? "New product" : product!.name}
        back={{ href: "/admin/products", label: "Products" }}
      >
        {product && (
          <DeleteButton
            id={product.id}
            action={deleteProduct}
            confirmText="Delete this product and its images? Past orders keep their item details. Consider hiding it instead."
          />
        )}
      </PageHeader>

      {created && (
        <div className="mb-4">
          <Alert tone="success">Product created. Now add some images below.</Alert>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className={cardCls}>
          <ActionForm action={saveProduct} submitLabel={isNew ? "Create product" : "Save product"}>
            {product && <input type="hidden" name="id" value={product.id} />}

            <Field label="Name">
              <input name="name" required defaultValue={product?.name} className={inputCls} />
            </Field>
            <Field label="URL slug" hint="Leave blank to generate from the name. Changing it changes the product URL.">
              <input name="slug" defaultValue={product?.slug} className={inputCls} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Category">
                <select name="category" defaultValue={product?.category ?? "laptops"} className={inputCls}>
                  {Object.entries(CATEGORIES).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </Field>
              <Field label="Condition">
                <select name="condition" defaultValue={product?.condition ?? "new"} className={inputCls}>
                  {Object.entries(CONDITIONS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </Field>
              <Field label="Stock">
                <select name="stock_status" defaultValue={product?.stock_status ?? "available"} className={inputCls}>
                  {Object.entries(STOCK_STATUSES).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Description">
              <textarea name="description" rows={4} defaultValue={product?.description ?? ""} className={inputCls} />
            </Field>

            <SpecsEditor initial={(product?.specs as Spec[] | undefined) ?? []} />

            <Field label="Warranty" hint="e.g. 6 months vendor warranty">
              <input name="warranty" defaultValue={product?.warranty ?? ""} className={inputCls} />
            </Field>

            {/* Private section: never shown on the storefront */}
            <fieldset className="space-y-4 rounded-md border border-slate-200 bg-slate-50 p-4">
              <legend className="px-1 text-sm font-medium text-slate-900">
                🔒 Pricing &amp; sourcing <span className="font-normal text-slate-500">(private — admin only)</span>
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Selling price (₦)" hint="What customers pay">
                  <MoneyInput name="selling_price" required defaultValue={product ? koboToNaira(product.selling_price) : ""} />
                </Field>
                <Field label="Vendor cost (₦)" hint="Private — what you pay the vendor">
                  <MoneyInput name="cost_price" required defaultValue={product ? koboToNaira(product.cost_price) : ""} />
                </Field>
              </div>
              <Field label="Usual vendor" hint="Private — pre-fills the vendor on new orders">
                <select name="vendor_id" defaultValue={product?.vendor_id ?? ""} className={inputCls}>
                  <option value="">— None —</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                      {v.is_active ? "" : " (inactive)"}
                    </option>
                  ))}
                </select>
              </Field>
            </fieldset>

            <div className="flex flex-wrap gap-6">
              <Checkbox name="is_active" label="Live on store" defaultChecked={product?.is_active ?? true} />
              <Checkbox name="is_featured" label="Featured on home page" defaultChecked={product?.is_featured ?? false} />
            </div>
          </ActionForm>
        </div>

        <div className={`${cardCls} h-fit`}>
          <h2 className="mb-3 font-medium">Images</h2>
          {product ? (
            <ImageManager
              productId={product.id}
              images={product.product_images.map((i) => ({
                id: i.id,
                url: productImageUrl(i.storage_path),
              }))}
            />
          ) : (
            <p className="text-sm text-slate-500">Save the product first, then add images.</p>
          )}
        </div>
      </div>
    </>
  );
}
