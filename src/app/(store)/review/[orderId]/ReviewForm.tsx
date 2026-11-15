"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { CheckCircle2, ImagePlus, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { REVIEW_PHOTOS_BUCKET } from "@/lib/images";
import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { inputCls } from "@/components/ui/styles";
import { createReviewPhotoUpload, submitReview } from "./actions";

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

export function ReviewForm({ orderId }: { orderId: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function pickPhoto(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setError("Use a JPG, PNG or WebP photo.");
    if (file.size > 5 * 1024 * 1024) return setError("Photo must be under 5 MB.");
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!rating) return setError("Choose a star rating.");
    startTransition(async () => {
      let photoPath: string | null = null;
      if (photo) {
        const ticket = await createReviewPhotoUpload(orderId, photo.type);
        if ("error" in ticket) return setError(ticket.error);
        const { error: upErr } = await createClient()
          .storage.from(REVIEW_PHOTOS_BUCKET)
          .uploadToSignedUrl(ticket.path, ticket.token, photo, { contentType: photo.type });
        if (upErr) return setError("Photo upload failed. Try again, or submit without a photo.");
        photoPath = ticket.path;
      }
      const res = await submitReview(orderId, { rating, comment, photoPath });
      if (!res.ok) setError(res.error);
      else setDone(true);
    });
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-success" aria-hidden="true" />
        <h2 className="text-xl font-bold">Thank you for your review!</h2>
        <p className="text-slate-700">It&apos;ll appear on our site once we&apos;ve checked it. Enjoy your work. 🙏</p>
        <ButtonLink href="/" variant="secondary" className="mt-2">
          Back to the store
        </ButtonLink>
      </div>
    );
  }

  const shown = hover || rating;

  return (
    <form onSubmit={submit} className="space-y-6">
      <fieldset>
        <legend className="mb-2 font-medium text-slate-900">How would you rate your experience?</legend>
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer rounded p-0.5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500">
              <input
                type="radio"
                name="rating"
                value={n}
                checked={rating === n}
                onChange={() => setRating(n)}
                className="sr-only"
                aria-label={`${n} star${n > 1 ? "s" : ""} — ${LABELS[n]}`}
              />
              <Star
                onMouseEnter={() => setHover(n)}
                aria-hidden="true"
                className={`h-9 w-9 transition ${n <= shown ? "fill-brand-600 text-brand-600" : "fill-slate-200 text-slate-200"}`}
              />
            </label>
          ))}
          <span className="ml-2 text-sm text-slate-500" aria-live="polite">{LABELS[shown]}</span>
        </div>
      </fieldset>

      <label className="block space-y-1">
        <span className="font-medium text-slate-900">Tell us about it</span>
        <textarea
          required
          rows={5}
          maxLength={1000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="How was the laptop, the delivery and our service?"
          className={inputCls}
        />
        <span className="block text-right text-xs text-slate-500">{comment.length}/1000</span>
      </label>

      <div className="space-y-2">
        <span className="font-medium text-slate-900">Add a photo (optional)</span>
        <p className="text-sm text-slate-500">A picture of your gadget helps other buyers.</p>
        {preview ? (
          <div className="flex items-center gap-3">
            <div className="relative h-24 w-24 overflow-hidden rounded-md border border-slate-200">
              <Image src={preview} alt="Your photo" fill sizes="96px" className="object-cover" unoptimized />
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setPhoto(null); setPreview(null); }}>
              Remove
            </Button>
          </div>
        ) : (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-700 hover:border-brand-300 focus-within:ring-2 focus-within:ring-brand-500">
            <ImagePlus className="h-5 w-5 text-brand-600" aria-hidden="true" /> Choose photo
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => pickPhoto(e.target.files?.[0])} />
          </label>
        )}
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Sending…" : "Submit review"}
      </Button>
      <p className="text-xs text-slate-500">
        We show your first name and last initial, your area and what you bought. Reviews are checked before they appear.
      </p>
    </form>
  );
}
