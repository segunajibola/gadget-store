"use client";

/**
 * Upload / delete / reorder product images.
 * Client Components can call Server Actions directly like async functions.
 */
import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/constants";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/images";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { linkCls } from "@/components/ui/styles";
import {
  addProductImage,
  createImageUploadUrl,
  deleteProductImage,
  setMainImage,
} from "./actions";

type Img = { id: string; url: string };

export function ImageManager({ productId, images }: { productId: string; images: Img[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function upload(files: FileList) {
    setUploading(true);
    setError(null);
    const supabase = createClient();
    try {
      for (const file of Array.from(files)) {
        if (!ALLOWED_IMAGE_TYPES.includes(file.type))
          throw new Error(`${file.name}: use JPG, PNG, WebP or AVIF`);
        if (file.size > MAX_IMAGE_BYTES) throw new Error(`${file.name}: max size is 5 MB`);

        const ticket = await createImageUploadUrl(productId, file.type);
        if ("error" in ticket) throw new Error(ticket.error);

        const { error: upErr } = await supabase.storage
          .from(PRODUCT_IMAGES_BUCKET)
          .uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: file.type });
        if (upErr) throw new Error(upErr.message);

        const saved = await addProductImage(productId, ticket.path);
        if (saved?.error) throw new Error(saved.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh(); // re-run the Server Component to show new images
    }
  }

  const busy = uploading || pending;

  return (
    <div className="space-y-3">
      {images.length === 0 && <p className="text-sm text-slate-500">No images yet.</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((img, i) => (
          <div key={img.id} className="overflow-hidden rounded-md border border-slate-200 bg-white">
            <div className="relative aspect-square bg-slate-50">
              <Image src={img.url} alt="" fill sizes="200px" className="object-contain" />
              {i === 0 && (
                <span className="absolute left-1 top-1">
                  <Badge tone="brand">Main</Badge>
                </span>
              )}
            </div>
            <div className="flex justify-between gap-1 p-1 text-xs">
              {i !== 0 ? (
                <button
                  type="button"
                  disabled={busy}
                  className={linkCls}
                  onClick={() => startTransition(() => setMainImage(img.id))}
                >
                  Make main
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                disabled={busy}
                className="text-danger-700 hover:underline"
                onClick={() => {
                  if (confirm("Delete this image?"))
                    startTransition(() => deleteProductImage(img.id));
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* The real file input is visually hidden; focus-within keeps a visible focus ring */}
      <label
        className={buttonClasses(
          "secondary",
          "md",
          `cursor-pointer focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-2 ${busy ? "pointer-events-none opacity-60" : ""}`,
        )}
      >
        {uploading ? "Uploading…" : "+ Upload images"}
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          multiple
          className="sr-only"
          onChange={(e) => e.target.files?.length && upload(e.target.files)}
        />
      </label>
      <p className="text-xs text-slate-500">JPG, PNG, WebP or AVIF, up to 5 MB each. First image is the main one.</p>
      {error && <Alert tone="danger">{error}</Alert>}
    </div>
  );
}
