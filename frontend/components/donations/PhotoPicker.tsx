"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { CameraIcon, TrashIcon } from "@phosphor-icons/react";
import { ApiError, upload } from "@/lib/api";
import { secondaryButton } from "@/components/ui/form";

const MAX_EDGE = 1600;
const QUALITY = 0.82;

/** Shrinks a camera photo to at most 1600px on its long edge and re-encodes it as JPEG. */
async function downscale(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("encode failed"))), "image/jpeg", QUALITY),
  );
}

export function PhotoPicker({
  value,
  onChange,
  onBusyChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setBusy(true);
    onBusyChange(true);
    try {
      let blob: Blob;
      try {
        blob = await downscale(file);
      } catch {
        throw new Error("Couldn't read that image. Try a JPEG or PNG photo.");
      }
      const form = new FormData();
      form.append("file", blob, "photo.jpg");
      const { url } = await upload<{ url: string }>("/uploads/photo", form);
      onChange(url);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setBusy(false);
      onBusyChange(false);
    }
  }

  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium">
        Photo <span className="font-normal text-muted">(optional)</span>
      </p>
      {value ? (
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-line bg-sage">
          <Image src={value} alt="Your food photo" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-bg/90 px-3 py-1.5 text-sm backdrop-blur transition hover:bg-bg"
          >
            <TrashIcon size={14} aria-hidden />
            Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className="flex aspect-[16/7] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-surface text-muted transition hover:border-forest hover:text-ink disabled:opacity-60"
        >
          <CameraIcon size={28} weight="duotone" aria-hidden />
          <span className="text-sm">{busy ? "Uploading..." : "Add a photo so collectors know what to expect"}</span>
        </button>
      )}
      {value && (
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className={`${secondaryButton} w-fit px-4 py-2 text-sm`}>
          <CameraIcon size={16} aria-hidden />
          {busy ? "Uploading..." : "Replace photo"}
        </button>
      )}
      <input ref={input} type="file" accept="image/*" onChange={pick} className="sr-only" tabIndex={-1} aria-label="Food photo" />
      {error && <p className="text-sm text-accent">{error}</p>}
    </div>
  );
}
