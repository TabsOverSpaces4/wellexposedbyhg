"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import type { Photo } from "@/lib/photos";
import { Frame } from "./Frame";
import { Cursor, useMouseParallax, useReveal, useStreamDrift } from "./Cursor";
import Image from "next/image";

const DWELL = 6000;

function fmtFormat(r: number) {
  if (r >= 1.75) return "Panorama";
  if (r >= 1.2) return "Landscape";
  if (r <= 0.85) return "Portrait";
  return "Square";
}

function streamPlace(p: Photo, idx: number) {
  const pano = p.ratio >= 1.75,
    land = p.ratio >= 1.2,
    port = p.ratio <= 0.85;
  const cyc = idx % 4;
  if (pano)
    return { align: "center", w: "min(84vw,1220px)", depth: 0.35 };
  if (land)
    return {
      align: cyc < 2 ? "left" : "right",
      w: "min(54vw,800px)",
      depth: 0.5,
    };
  if (port)
    return {
      align: cyc === 1 ? "left" : "right",
      w: "min(32vw,430px)",
      depth: 0.85,
    };
  return { align: "center", w: "min(40vw,540px)", depth: 0.65 };
}

export default function Gallery({ photos }: { photos: Photo[] }) {
  const [i, setI] = useState(0);
  const [prev, setPrev] = useState<{
    photo: Photo;
    key: number;
  } | null>(null);
  const [paused, setPaused] = useState(false);
  const iRef = useRef(0);
  const heroVisible = useRef(true);
  const stageRef = useMouseParallax(0.55);
  useReveal();
  useStreamDrift();

  const goTo = useCallback(
    (n: number) => {
      const ni = ((n % photos.length) + photos.length) % photos.length;
      if (ni === iRef.current) return;
      setPrev({ photo: photos[iRef.current], key: Date.now() });
      iRef.current = ni;
      setI(ni);
    },
    [photos]
  );
  const next = useCallback(() => goTo(iRef.current + 1), [goTo]);
  const back = useCallback(() => goTo(iRef.current - 1), [goTo]);

  // auto-advance
  useEffect(() => {
    const id = setInterval(() => {
      if (!paused && heroVisible.current && !document.hidden) next();
    }, DWELL);
    return () => clearInterval(id);
  }, [paused, next]);

  // arrow keys
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!heroVisible.current) return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, back]);

  // hero visibility tracking
  const heroEl = useRef<HTMLElement>(null);
  const [heroOut, setHeroOut] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(
      ([en]) => {
        heroVisible.current = en.intersectionRatio > 0.45;
        setHeroOut(en.intersectionRatio < 0.25);
      },
      { threshold: [0, 0.25, 0.45, 1] }
    );
    if (heroEl.current) io.observe(heroEl.current);
    return () => io.disconnect();
  }, []);

  const p = photos[i];
  const num = String(i + 1).padStart(2, "0");
  const total = String(photos.length).padStart(2, "0");

  return (
    <div className="gal">
      <Cursor />

      {/* MASTHEAD */}
      <header className="we-mast">
        <div>
          <div className="brand">ExposedByHG</div>
          <div className="sub" style={{ marginTop: 6, paddingLeft: "0.5em" }}>
            Photographs
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section
        className="gal-hero"
        ref={heroEl}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="gal-romanbg" key={"r" + p.id}>
          {p.roman}
        </div>

        {/* left meta */}
        <div className="gal-meta">
          <div className="eyebrow">Well&nbsp;Exposed &middot; The&nbsp;Sequence</div>
          <div className="gal-roman">{p.roman}</div>
          <div className="gal-rule"></div>
          <div className="gal-fmt">{fmtFormat(p.ratio)}</div>
          <div className="gal-count">
            <b>{num}</b>
            <span>/</span>
            {total}
          </div>
        </div>

        {/* right edition */}
        <div className="gal-edition">Edition&nbsp;I &middot; MMXXVI</div>

        {/* stage */}
        <div className="gal-stage" ref={stageRef}>
          <div className="gal-stageInner" data-depth="0.5">
            <div className="gal-layer current" key={p.id}>
              <Frame
                photo={p}
                brackets
                fit={{ vh: 66, vw: 46 }}
                eager
                kb
              />
            </div>
            {prev && (
              <div
                className="gal-layer fading"
                key={prev.key}
                onAnimationEnd={() => setPrev(null)}
              >
                <Frame
                  photo={prev.photo}
                  brackets
                  fit={{ vh: 66, vw: 46 }}
                  eager
                />
              </div>
            )}
          </div>
        </div>

        {/* arrows */}
        <button
          className="gal-arrow left"
          onClick={back}
          aria-label="Previous"
          data-cursor=""
        >
          <svg viewBox="0 0 24 24">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <button
          className="gal-arrow right"
          onClick={next}
          aria-label="Next"
          data-cursor=""
        >
          <svg viewBox="0 0 24 24">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* filmstrip */}
        <div className="gal-strip">
          <div className="gal-thumbs">
            {photos.map((ph, k) => (
              <button
                key={ph.id}
                className={"gal-thumb" + (k === i ? " on" : "")}
                onClick={() => goTo(k)}
                data-cursor=""
                style={{ width: 44 * ph.ratio + "px" }}
              >
                <Image
                  src={ph.src}
                  alt=""
                  width={Math.round(44 * ph.ratio)}
                  height={44}
                  loading="lazy"
                  quality={40}
                  draggable={false}
                />
                {k === i && (
                  <span
                    className="prog"
                    key={"p" + i}
                    style={{
                      animationPlayState: paused ? "paused" : "running",
                    }}
                  ></span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* scroll cue */}
        <button
          className={"gal-cue" + (heroOut ? " hide" : "")}
          onClick={() =>
            scrollTo({ top: innerHeight, behavior: "smooth" })
          }
          data-cursor=""
        >
          <span className="eyebrow">Scroll &middot; The full collection</span>
          <span className="cueline"></span>
        </button>
      </section>

      {/* ===== MARQUEE ===== */}
      <div className="gal-marq" aria-hidden="true">
        <div className="row">
          {Array.from({ length: 4 }).map((_, r) => (
            <span key={r} className="seg">
              The&nbsp;Collection <i>&middot;</i> Ten&nbsp;Photographs{" "}
              <i>&middot;</i> Well&nbsp;Exposed <i>&middot;</i>&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ===== COLLECTION ===== */}
      <section className="gal-coll">
        <header className="gal-collhead">
          <div className="eyebrow reveal">Catalogue &middot; MMXXVI</div>
          <h2 className="reveal">
            The
            <br />
            <em>Collection.</em>
          </h2>
          <div className="gal-collsub reveal">
            Ten photographs, each hung in its own measure of dark.
          </div>
        </header>

        <div className="gal-stream">
          {photos.map((ph, idx) => {
            const pl = streamPlace(ph, idx);
            return (
              <div className={"gal-item " + pl.align} key={ph.id}>
                <div className="fig reveal" style={{ width: pl.w }}>
                  <div className="gal-idx">{ph.roman}</div>
                  <div className="drift" data-depth={pl.depth}>
                    <Frame photo={ph} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* closing colophon */}
        <footer className="gal-end">
          <div className="gal-endmark"></div>
          <div className="serif gal-endbrand">Well&nbsp;Exposed</div>
          <div className="eyebrow gal-endsub">
            Edition&nbsp;I &middot; MMXXVI &middot; Ten&nbsp;Works
          </div>
        </footer>
      </section>

      {/* overlays */}
      <div className="we-grain"></div>
      <div className="we-vignette"></div>
    </div>
  );
}
