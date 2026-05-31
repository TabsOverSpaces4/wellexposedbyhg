"use client";

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
}: FrameProps) {
  let plateStyle: React.CSSProperties;
  if (fit) {
    plateStyle = {
      aspectRatio: String(photo.ratio),
      height: `min(${fit.vh}vh, ${(fit.vw / photo.ratio).toFixed(2)}vw)`,
    };
  } else if (fill) {
    plateStyle = { width: "100%", height: "100%" };
  } else {
    plateStyle = { aspectRatio: String(photo.ratio), width: "100%" };
  }

  const isRemote = photo.src.startsWith("http");

  return (
    <div
      className={"we-frame " + className}
      style={
        fill ? { width: "100%", height: "100%", ...style } : style
      }
    >
      <div className="plate" style={plateStyle}>
        {isRemote ? (
          <Image
            className={kb ? "kb" : ""}
            src={photo.src}
            alt=""
            fill
            sizes="(max-width: 880px) 86vw, 50vw"
            loading={eager ? "eager" : "lazy"}
            quality={85}
            draggable={false}
          />
        ) : (
          <Image
            className={kb ? "kb" : ""}
            src={photo.src}
            alt=""
            width={photo.w}
            height={photo.h}
            sizes="(max-width: 880px) 86vw, 50vw"
            priority={eager}
            quality={85}
            draggable={false}
          />
        )}
        <div className="glow"></div>
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
