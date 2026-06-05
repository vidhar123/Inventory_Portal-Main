"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { UploadIcon, TrashIcon, StarIcon } from "./icons";

const MAX_IMAGES = 5;

export interface SelectedImage {
  id: string;
  file: File;
  previewUrl: string;
}

export function ImageUploader({
  images,
  onChange,
}: {
  images: SelectedImage[];
  onChange: (images: SelectedImage[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = MAX_IMAGES - images.length;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    const incoming = Array.from(fileList).filter((f) =>
      f.type.startsWith("image/")
    );
    if (incoming.length === 0) {
      setError("Please choose image files only.");
      return;
    }

    const allowed = incoming.slice(0, remaining);
    if (incoming.length > remaining) {
      setError(`You can upload up to ${MAX_IMAGES} images.`);
    }

    const selected = allowed.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    onChange([...images, ...selected]);
  }

  function removeAt(index: number) {
    URL.revokeObjectURL(images[index].previewUrl);
    onChange(images.filter((_, i) => i !== index));
  }

  function makeCover(index: number) {
    if (index === 0) return;
    const next = [...images];
    const [chosen] = next.splice(index, 1);
    next.unshift(chosen);
    onChange(next);
  }

  return (
    <div>
      <div
        onClick={() => remaining > 0 && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (remaining > 0) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (remaining > 0) handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition",
          remaining <= 0 && "cursor-not-allowed opacity-60",
          dragging
            ? "border-brand-400 bg-brand-50"
            : "border-slate-300 bg-slate-50 hover:border-brand-300 hover:bg-brand-50/40"
        )}
      >
        <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-100 text-brand-600">
          <UploadIcon className="h-6 w-6" />
        </span>
        <p className="mt-3 text-sm font-medium text-slate-700">
          {remaining > 0
            ? "Drag & drop images here, or click to browse"
            : "Maximum of 5 images reached"}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          PNG, JPG or WEBP · {images.length}/{MAX_IMAGES} uploaded
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}

      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {images.map((src, i) => (
            <div
            key={src.id}
              className="group relative aspect-square overflow-hidden rounded-xl ring-1 ring-slate-200"
            >
              <img
                src={src.previewUrl}
                alt={`Upload ${i + 1}`}
                className="h-full w-full object-cover"
              />
              {i === 0 && (
                <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                  <StarIcon className="h-3 w-3" /> Cover
                </span>
              )}
              <div className="absolute inset-0 flex items-end justify-between gap-1 bg-gradient-to-t from-slate-900/70 to-transparent p-1.5 opacity-0 transition group-hover:opacity-100">
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={() => makeCover(i)}
                    className="rounded-md bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-white"
                  >
                    Set cover
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="ml-auto grid h-7 w-7 place-items-center rounded-md bg-white/90 text-rose-600 hover:bg-white"
                  aria-label="Remove image"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
