import { useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageLightboxProps {
  className?: string;
  alt: string;
  src: string;
  thumbSrc?: string;
}

export function ImageLightbox({ alt, className, src, thumbSrc }: ImageLightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label={`Enlarge image: ${alt}`}
        className={cn(
          "mt-3 block w-full max-w-sm cursor-zoom-in overflow-hidden rounded-md border border-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
          className,
        )}
      >
        <img
          src={thumbSrc ?? src}
          alt={alt}
          loading="lazy"
          className="block h-auto w-full"
        />
      </button>

      <dialog
        ref={dialogRef}
        // Clicking the backdrop or image closes it.
        onClick={() => dialogRef.current?.close()}
        className="m-auto max-h-[92vh] max-w-[92vw] cursor-zoom-out border-0 bg-transparent p-0 backdrop:bg-black/85"
      >
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Close image"
          className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-zinc-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        <img
          src={src}
          alt={alt}
          className="block max-h-[92vh] max-w-[92vw] rounded-md object-contain"
        />
      </dialog>
    </>
  );
}

export default ImageLightbox;
