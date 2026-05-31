"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });
  const [hot, setHot] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    pos.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    ringPos.current = { ...pos.current };

    let raf: number;
    const move = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (dot.current)
        dot.current.style.transform = `translate(${e.clientX}px,${e.clientY}px) translate(-50%,-50%)`;
      if (label.current)
        label.current.style.transform = `translate(${e.clientX}px,${e.clientY}px) translate(-50%,-50%)`;
      const t = (e.target as HTMLElement).closest("[data-cursor]");
      if (t) {
        setHot(true);
        setText(t.getAttribute("data-cursor") || "");
      } else {
        setHot(false);
        setText("");
      }
    };
    const tick = () => {
      ringPos.current.x += (pos.current.x - ringPos.current.x) * 0.16;
      ringPos.current.y += (pos.current.y - ringPos.current.y) * 0.16;
      if (ring.current)
        ring.current.style.transform = `translate(${ringPos.current.x}px,${ringPos.current.y}px) translate(-50%,-50%)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", move, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div
        ref={ring}
        className={"we-cursor-ring" + (hot ? " hot" : "")}
      ></div>
      <div ref={dot} className={"we-cursor" + (hot ? " hot" : "")}></div>
      <div
        ref={label}
        className={"we-cursor-label" + (hot && text ? " show" : "")}
      >
        {hot ? text : ""}
      </div>
    </>
  );
}

export function useMouseParallax(strength = 1): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf: number,
      tx = 0,
      ty = 0,
      cx = 0,
      cy = 0;
    const onMove = (e: MouseEvent) => {
      tx = e.clientX / innerWidth - 0.5;
      ty = e.clientY / innerHeight - 0.5;
    };
    const tick = () => {
      cx += (tx - cx) * 0.07;
      cy += (ty - cy) * 0.07;
      el.querySelectorAll<HTMLElement>("[data-depth]").forEach((n) => {
        const d = parseFloat(n.getAttribute("data-depth") || "0") * strength;
        n.style.transform = `translate3d(${(-cx * d * 40).toFixed(2)}px,${(-cy * d * 40).toFixed(2)}px,0)`;
      });
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [strength]);
  return ref;
}

export function useReveal() {
  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>(".reveal:not(.in)")];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            (en.target as HTMLElement).classList.add("anim");
            requestAnimationFrame(() =>
              (en.target as HTMLElement).classList.add("in")
            );
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((n) => {
      if (n.getBoundingClientRect().top < innerHeight * 0.92)
        n.classList.add("in");
      else io.observe(n);
    });
    return () => io.disconnect();
  });
}

export function useStreamDrift() {
  useEffect(() => {
    let raf: number;
    const tick = () => {
      const vh = innerHeight;
      document.querySelectorAll<HTMLElement>(".gal .drift").forEach((el) => {
        const r = el.getBoundingClientRect();
        const off = (r.top + r.height / 2 - vh / 2) / vh;
        const d = parseFloat(el.dataset.depth || "0.4");
        el.style.transform = `translate3d(0, ${(off * d * -52).toFixed(1)}px, 0)`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
}
