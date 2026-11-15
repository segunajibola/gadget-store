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
import { btnSecondary } from "@/components/ui/styles";
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
      {images.length === 0 && <p className="text-sm text-gray-500">No images yet.</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((img, i) => (
          <div key={img.id} className="overflow-hidden rounded-md border border-gray-200 bg-white">
            <div className="relative aspect-square bg-gray-50">
              <Image src={img.url} alt="" fill sizes="200px" className="object-contain" />
              {i === 0 && (
                <span className="absolute left-1 top-1 rounded bg-blue-600 px-1.5 py-0.5 text-xs text-white">
                  Main
                </span>
              )}
            </div>
            <div className="flex justify-between gap-1 p-1 text-xs">
              {i !== 0 ? (
                <button
                  type="button"
                  disabled={busy}
                  className="text-blue-700 hover:underline"
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
                className="text-red-600 hover:underline"
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

      <label className={`${btnSecondary} cursor-pointer ${busy ? "pointer-events-none opacity-60" : ""}`}>
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
      <p className="text-xs text-gray-500">JPG, PNG, WebP or AVIF, up to 5 MB each. First image is the main one.</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
