"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import type { Photo } from "@/lib/photos";
import { Frame } from "./Frame";
import { Cursor, useMouseParallax, useReveal } from "./Cursor";
import Image from "next/image";

const DWELL = 4500;

function fmtFormat(r: number) {
  if (r >= 1.75) return "Panorama";
  if (r >= 1.2) return "Landscape";
  if (r <= 0.85) return "Portrait";
  return "Square";
}

export default function Gallery({ photos }: { photos: Photo[] }) {
  const [i, setI] = useState(0);
  const [prev, setPrev] = useState<{
    photo: Photo;
    key: number;
  } | null>(null);
  const [paused, setPaused] = useState(false);
  const [ratios, setRatios] = useState<Record<number, number>>({});
  const [failedIds, setFailedIds] = useState<Set<number>>(new Set());
  const [lightsOff, setLightsOff] = useState(true);
  const iRef = useRef(0);
  const heroVisible = useRef(true);
  const stageRef = useMouseParallax(0.55);
  const dotsRef = useRef<HTMLDivElement>(null);
  const collageWrapRef = useRef<HTMLDivElement>(null);
  useReveal();

  // Torch / spotlight: a warm, living light that follows the cursor over the
  // collage when the lights are off. Smoothed follow + organic flicker.
  useEffect(() => {
    if (!lightsOff) return;
    const wrap = collageWrapRef.current;
    if (!wrap) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const BASE_R = 460; // base throw radius (px)
    let raf: number;
    let started = false;
    let tx = wrap.clientWidth / 2;
    let ty = wrap.clientHeight * 0.3;
    let cx = tx;
    let cy = ty;

    const onMove = (e: MouseEvent) => {
      const rect = wrap.getBoundingClientRect();
      tx = e.clientX - rect.left;
      ty = e.clientY - rect.top;
      if (!started) {
        // Snap on first sighting so it doesn't slide in from the corner
        cx = tx;
        cy = ty;
        started = true;
      }
    };

    const t0 = performance.now();
    const tick = (now: number) => {
      // Weighted follow — a lantern has a little inertia
      cx += (tx - cx) * 0.22;
      cy += (ty - cy) * 0.22;

      let r = BASE_R;
      if (!reduceMotion) {
        const t = (now - t0) / 1000;
        // Layered sines → pseudo-random flame flicker, kept subtle
        const flicker =
          Math.sin(t * 6.7) * 0.02 +
          Math.sin(t * 11.3 + 1.1) * 0.013 +
          Math.sin(t * 19.7 + 2.7) * 0.008;
        r = BASE_R * (1 + flicker);
      }

      wrap.style.setProperty("--mx", `${cx.toFixed(1)}px`);
      wrap.style.setProperty("--my", `${cy.toFixed(1)}px`);
      wrap.style.setProperty("--torch-r", `${r.toFixed(1)}px`);
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [lightsOff]);

  // Dotted background scroll parallax (shift tile position so it always covers)
  useEffect(() => {
    let raf: number;
    const tick = () => {
      if (dotsRef.current) {
        const y = window.scrollY * 0.3;
        dotsRef.current.style.backgroundPositionY = `${y}px`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onHeroImageLoad = useCallback((photoId: number, ratio: number) => {
    setRatios((prev) => ({ ...prev, [photoId]: ratio }));
  }, []);

  const markFailed = useCallback((photoId: number) => {
    setFailedIds((prev) => new Set(prev).add(photoId));
  }, []);

  const goTo = useCallback(
    (n: number) => {
      let ni = ((n % photos.length) + photos.length) % photos.length;
      // Skip failed images
      let attempts = 0;
      while (failedIds.has(photos[ni].id) && attempts < photos.length) {
        ni = ((ni + 1) % photos.length);
        attempts++;
      }
      if (ni === iRef.current) return;
      setPrev({ photo: photos[iRef.current], key: Date.now() });
      iRef.current = ni;
      setI(ni);
    },
    [photos, failedIds]
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
      <div className="gal-dots" ref={dotsRef} aria-hidden="true" />
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
          <div className="eyebrow">ExposedByHG &middot; The&nbsp;Sequence</div>
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
                fit={{ vh: 74, vw: 56 }}
                eager
                kb
                animatedRatio={ratios[p.id]}
                onImageLoad={(r) => onHeroImageLoad(p.id, r)}
                onError={() => markFailed(p.id)}
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
                  fit={{ vh: 74, vw: 56 }}
                  eager
                  animatedRatio={ratios[prev.photo.id]}
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
            {photos.map((ph, k) =>
              failedIds.has(ph.id) ? null : (
                <button
                  key={ph.id}
                  className={"gal-thumb" + (k === i ? " on" : "")}
                  onClick={() => goTo(k)}
                  data-cursor=""
                  style={{ width: "58px", height: "44px" }}
                >
                  <Image
                    src={ph.src}
                    alt=""
                    width={58}
                    height={44}
                    loading="lazy"
                    quality={40}
                    draggable={false}
                    style={{ objectFit: "cover", width: "100%", height: "100%" }}
                    onError={() => markFailed(ph.id)}
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
              )
            )}
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
              The&nbsp;Collection <i>&middot;</i> Photographs{" "}
              <i>&middot;</i> ExposedByHG <i>&middot;</i>&nbsp;
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
            Each photograph, hung in its own measure of dark.
          </div>
          <button
            className={"gal-lights" + (lightsOff ? " off" : "")}
            onClick={() => setLightsOff((v) => !v)}
            data-cursor=""
          >
            <span className="bulb"></span>
            {lightsOff ? "Lights On" : "Lights Off"}
          </button>
        </header>

        <div
          className={"gal-collage-wrap" + (lightsOff ? " lights-off" : "")}
          ref={collageWrapRef}
        >
          <div className="gal-collage">
            {photos.map((ph) =>
              failedIds.has(ph.id) ? null : (
                <div className="cell reveal" key={ph.id}>
                  <Frame photo={ph} onError={() => markFailed(ph.id)} />
                </div>
              )
            )}
          </div>
          <div className="gal-torch" aria-hidden="true" />
          <div className="gal-torch-glow" aria-hidden="true" />
        </div>

        {/* closing colophon */}
        <footer className="gal-end">
          <div className="gal-endmark"></div>
          <div className="serif gal-endbrand">ExposedByHG</div>
          <div className="eyebrow gal-endsub">
            Edition&nbsp;I &middot; MMXXVI
          </div>
        </footer>
      </section>

      {/* overlays */}
      <div className="we-grain"></div>
      <div className="we-vignette"></div>
    </div>
  );
}
