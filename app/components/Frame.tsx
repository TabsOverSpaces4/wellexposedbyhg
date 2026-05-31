"use client";

import { useState } from "react";
import Image from "next/image";
import type { Photo } from "@/lib/photos";

interface FrameProps {
  photo: Photo;
  brackets?: boolean;
  fit?: { vh: number; vw: number };
  fill?: boolean;
  eager?: boolean;
  kb?: boolean;
  className?: string;
  style?: React.CSSProperties;
  /** When provided, the hero frame animates to this ratio */
  animatedRatio?: number;
  onImageLoad?: (ratio: number) => void;
  onError?: () => void;
}

export function Frame({
  photo,
  brackets,
  fit,
  fill,
  className = "",
  style,
  eager,
  kb,
  animatedRatio,
  onImageLoad,
  onError,
}: FrameProps) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  const handleError = () => {
    setFailed(true);
    onError?.();
  };
  const isRemote =
    photo.src.startsWith("http") || photo.src.startsWith("/api/image");
  const isProxy = photo.src.startsWith("/api/image");

  let plateStyle: React.CSSProperties;
  let useFill = false;

  if (fit) {
    const ratio = animatedRatio || photo.ratio;
    // Compute dimensions that fit within viewport bounds while respecting ratio
    // maxW = fit.vw in vw units, maxH = fit.vh in vh units
    // We use CSS to pick the smaller constraint
    const w = `min(${fit.vw}vw, ${fit.vh * ratio}vh)`;
    const h = `min(${fit.vh}vh, ${fit.vw / ratio}vw)`;
    plateStyle = {
      width: w,
      height: h,
      transition: "width 0.8s cubic-bezier(0.22,0.61,0.36,1), height 0.8s cubic-bezier(0.22,0.61,0.36,1)",
    };
    useFill = true;
  } else if (fill) {
    plateStyle = { width: "100%", height: "100%" };
    useFill = true;
  } else {
    plateStyle = { lineHeight: 0 };
    useFill = false;
  }

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (onImageLoad) {
      const img = e.currentTarget;
      if (img.naturalWidth && img.naturalHeight) {
        onImageLoad(img.naturalWidth / img.naturalHeight);
      }
    }
  };

  return (
    <div
      className={"we-frame " + className}
      style={
        fill
          ? { width: "100%", height: "100%", ...style }
          : fit
            ? { transition: "all 0.8s cubic-bezier(0.22,0.61,0.36,1)", ...style }
            : style
      }
    >
      <div className="plate" style={plateStyle}>
        {useFill ? (
          <Image
            className={kb ? "kb" : ""}
            src={photo.src}
            alt=""
            fill
            sizes="(max-width: 880px) 90vw, 60vw"
            loading={eager ? "eager" : "lazy"}
            priority={eager}
            quality={85}
            unoptimized={isProxy}
            draggable={false}
            onLoad={handleLoad}
            onError={handleError}
          />
        ) : (
          <Image
            className={kb ? "kb" : ""}
            src={photo.src}
            alt=""
            width={isRemote ? 1600 : photo.w}
            height={isRemote ? 1600 : photo.h}
            sizes="(max-width: 880px) 90vw, 60vw"
            loading={eager ? "eager" : "lazy"}
            priority={eager}
            quality={85}
            unoptimized={isProxy}
            draggable={false}
            style={{ width: "100%", height: "auto" }}
            onLoad={handleLoad}
            onError={handleError}
          />
        )}
      </div>
      {brackets && (
        <div className="we-brackets">
          <b></b>
          <b></b>
          <b></b>
          <b></b>
        </div>
      )}
    </div>
  );
}
