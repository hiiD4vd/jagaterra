'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { SEQUENCE } from '@/lib/sequence.config';
import { useImageSequence, type SequenceMode } from '@/lib/useImageSequence';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import { useCoarsePointer } from '@/lib/useCoarsePointer';
import HeroCopy from '@/components/HeroCopy';
import HeroLoop from '@/components/HeroLoop';
import SectionTwoCopy from '@/components/SectionTwoCopy';

// Below this scroll position (px) we treat the page as "at the very top" and
// show the looping hero; past it, the scrubbed film takes over.
const HANDOFF_PX = 6;

// Real mode uses HD assets from /public; dummy mode is the zero-asset fallback.
const IS_REAL = SEQUENCE.useRealFrames;

/**
 * Sections 1 & 2 — the scroll-scrubbed film.
 *
 * Layout: the <section> wrapper is SEQUENCE.scrollLengthVh tall (default
 * 400vh) and the film viewport is `sticky top-0 h-screen` inside it. The user
 * scrolls through ~3 extra screens while it stays put — that surplus scroll
 * distance *is* the scrubber. Taller wrapper ⇒ more scroll px per frame.
 *
 * One GSAP timeline drives everything; only the scrub SURFACE differs by device:
 *   • DESKTOP (fine pointer) — an HD <video>; scroll sets currentTime, so it
 *     plays frame-accurately at full resolution and native framerate.
 *   • TOUCH — a <canvas> drawing a preloaded JPEG sequence of the same film
 *     (the Apple technique). iOS Safari won't decode/paint seeks on a paused
 *     inline video, so this is how mobile gets the identical scroll-driven film.
 *   • DUMMY mode — the same <canvas> path with procedural frames.
 *
 * GSAP/ScrollTrigger owns everything tied to scroll progress (the scrub, hero
 * exit, section-2 in/out, hint fade, loop handoff). Framer Motion owns discrete
 * motion (hero stagger, counters, loader exit) inside the child components.
 */
export default function ScrollSequence() {
  const reduced = usePrefersReducedMotion();

  // Pick the scrub surface ONCE, when the pointer type first resolves, and never
  // swap it afterward: live-swapping <canvas>↔<video> races React's
  // reconciliation with Framer's loader exit ("insertBefore" crash). While the
  // device is unknown, no surface renders (the loader covers the page and
  // nothing heavy downloads). A desktop window later dragged narrow keeps the
  // video scrub (fine at any width); a phone keeps the canvas sequence.
  const coarse = useCoarsePointer();
  const [surface, setSurface] = useState<'video' | 'canvas' | null>(null);
  useEffect(() => {
    if (surface !== null || coarse === null) return;
    // dummy mode + touch → canvas; fine-pointer desktop → video.
    setSurface(!IS_REAL || coarse ? 'canvas' : 'video');
  }, [coarse, surface]);

  const videoScrub = surface === 'video'; // desktop: scrub the HD <video>
  const frameScrub = IS_REAL && surface === 'canvas'; // touch: scrub the JPEG sequence
  const canvasScrub = surface === 'canvas'; // <canvas> is the surface (dummy too)

  // Keep the scroll film running even under "Reduce Motion" on touch devices —
  // that OS setting (which a site can't disable) was replacing the film with a
  // static frame on iPhones. So motion is only disabled on desktop-with-reduce-
  // motion (and dummy dev mode); the mobile film always runs. Desktop behaviour
  // is unchanged: motionOff === reduced there.
  const motionOff = reduced && !frameScrub;

  // Image sequence: procedural in dummy mode, real frames on touch, none on desktop.
  const seqMode: SequenceMode =
    surface === null ? 'off' : !IS_REAL ? 'dummy' : frameScrub ? 'frames' : 'off';
  // Redraw the current frame when a windowed bitmap finishes decoding (frames mode).
  const redrawRef = useRef<() => void>(() => {});
  const seq = useImageSequence(SEQUENCE, seqMode, () => redrawRef.current());

  // Desktop video readiness (mirrors seq.ready/progress/failed shape).
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  const pending = surface === null; // device not measured yet
  const ready = !pending && (videoScrub ? videoReady : seq.ready);
  const failed = !pending && (videoScrub ? videoFailed : seq.failed);
  const progress = pending ? 0 : videoScrub ? videoProgress : seq.progress;

  // How many frames the canvas scrub spans (real mobile vs dummy).
  const scrubFrameCount = frameScrub ? SEQUENCE.mobileFrameCount : SEQUENCE.frameCount;

  const wrapperRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrubVideoRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const s2Ref = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const loopLayerRef = useRef<HTMLDivElement>(null);

  const lastFrameRef = useRef(0); // canvas: last drawn frame index
  const lastSeekRef = useRef(-1); // video: last sought currentTime (dedupe seeks)
  const countersOnceRef = useRef(false);
  const [countersOn, setCountersOn] = useState(false);

  // Hero-loop ↔ scrub handoff. The page opens at the top, so the loop starts
  // visible; a dedicated ScrollTrigger flips this on scroll (see useGSAP).
  const atTopRef = useRef(true);
  const [showLoop, setShowLoop] = useState(true);

  // ---- canvas drawing (dummy + mobile frames) ---------------------------
  /** Draw frame `index` in cover mode: fill the viewport, keep aspect, center-crop. */
  const drawFrame = useCallback(
    (index: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      // frameAt returns the exact frame, the nearest decoded neighbour, or null
      // (leave the last frame on screen until its bitmap decodes).
      const img = seq.frameAt(index);
      if (!img) return;

      const iw = img instanceof ImageBitmap ? img.width : img.naturalWidth;
      const ih = img instanceof ImageBitmap ? img.height : img.naturalHeight;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const scale = Math.max(w / iw, h / ih); // cover
      const dw = iw * scale;
      const dh = ih * scale;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    },
    [seq.frameAt],
  );

  // Expose the latest "redraw current frame" to the sequence hook's decode
  // callback, without re-running the loader effect.
  useEffect(() => {
    redrawRef.current = () => {
      if (canvasScrub) drawFrame(lastFrameRef.current);
    };
  }, [canvasScrub, drawFrame]);

  /** Match the backing store to CSS size × devicePixelRatio, capped at 2. */
  const sizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  /** Map scroll progress p (0→1) onto the active scrub surface. */
  const renderScrub = useCallback(
    (p: number) => {
      if (videoScrub) {
        const v = scrubVideoRef.current;
        if (!v || !v.duration) return;
        const t = gsap.utils.clamp(0, v.duration, p * v.duration);
        // Skip sub-frame seeks — they'd just thrash the decoder.
        if (Math.abs(t - lastSeekRef.current) > 0.01) {
          lastSeekRef.current = t;
          v.currentTime = t;
        }
      } else {
        const last = scrubFrameCount - 1;
        const idx = Math.round(gsap.utils.clamp(0, last, p * last));
        if (idx !== lastFrameRef.current) {
          lastFrameRef.current = idx;
          drawFrame(idx);
        }
      }
    },
    [videoScrub, scrubFrameCount, drawFrame],
  );

  // ---- desktop video preloading ------------------------------------------
  useEffect(() => {
    if (!videoScrub) return;

    let settled = false;
    let retryTimer: number | undefined;
    // Resolve the live <video> element via a getter so we don't capture a stale
    // ref (fixes a race where the effect runs before the video mounts and the
    // loader hangs at 0% forever even though the video is readyState 4).
    const v_ref = () => scrubVideoRef.current;

    const markReady = () => {
      if (settled) return;
      settled = true;
      setVideoProgress(1);
      setVideoReady(true);
    };
    const onProgress = () => {
      try {
        if (v_ref()?.duration && v_ref()?.buffered.length) {
          const frac = v_ref()!.buffered.end(v_ref()!.buffered.length - 1) / v_ref()!.duration;
          setVideoProgress((p) => Math.max(p, Math.min(0.99, frac)));
        }
      } catch {
        /* buffered can throw mid-load; ignore */
      }
    };
    const onLoaded = () => setVideoProgress((p) => Math.max(p, 0.2));
    const onError = () => setVideoFailed(true);

    function attach() {
      const v = v_ref();
      if (!v) return false;
      v.pause();
      v.addEventListener('loadeddata', onLoaded);
      v.addEventListener('progress', onProgress);
      v.addEventListener('canplaythrough', markReady);
      v.addEventListener('error', onError);
      if (v.readyState >= 4) markReady();      // HAVE_ENOUGH_DATA
      else if (v.readyState >= 2) setVideoProgress((p) => Math.max(p, 0.2));
      return true;
    }

    const fallback = window.setTimeout(markReady, 6000);

    // Attach immediately; if the video isn't mounted yet, retry over the next
    // ~1.5s. Without this the loader can stall at 0% despite a ready video.
    let tries = 0;
    const tryAttach = () => {
      if (settled) return;
      if (attach()) return;
      if (tries++ < 15) retryTimer = window.setTimeout(tryAttach, 100);
    };
    tryAttach();

    return () => {
      window.clearTimeout(fallback);
      if (retryTimer) window.clearTimeout(retryTimer);
      const v = v_ref();
      if (v) {
        v.removeEventListener('loadeddata', onLoaded);
        v.removeEventListener('progress', onProgress);
        v.removeEventListener('canplaythrough', markReady);
        v.removeEventListener('error', onError);
      }
    };
  }, [videoScrub]);

  // ---- canvas: first paint + redraw on resize ----------------------------
  useEffect(() => {
    if (!canvasScrub || !ready || failed) return;
    if (motionOff) {
      // Motion disabled (desktop/dummy reduce-motion) — park on frame 0.
      lastFrameRef.current = 0;
    }
    const paint = () => {
      sizeCanvas();
      drawFrame(lastFrameRef.current);
    };
    paint();
    window.addEventListener('resize', paint);
    return () => window.removeEventListener('resize', paint);
  }, [canvasScrub, ready, failed, motionOff, sizeCanvas, drawFrame]);

  // The scrubbed master timeline. Gated on `ready` so scrolling does nothing
  // until the film is decodable. useGSAP reverts it all on unmount/dep change.
  useGSAP(
    () => {
      if (!ready || failed || motionOff) return;
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      // GSAP tweens `p` (0→1); renderScrub maps it onto the video/canvas.
      const playhead = { p: 0 };

      const tl = gsap.timeline({
        defaults: { ease: 'none' }, // scroll owns the pacing — no easing on the master
        scrollTrigger: {
          trigger: wrapper,
          start: 'top top',
          end: 'bottom bottom', // the full wrapper == timeline progress 0 → 1
          scrub: 0.5, // playhead chases the scrollbar over ~0.5s — wheel steps become glide
          onUpdate: (self) => {
            // Section-2 counters fire exactly once, while that copy is on screen.
            if (!countersOnceRef.current && self.progress > 0.5 && self.progress < 0.9) {
              countersOnceRef.current = true;
              setCountersOn(true);
            }
          },
        },
      });

      tl.to(playhead, { p: 1, duration: 1, onUpdate: () => renderScrub(playhead.p) }, 0);

      // "Scroll" hint dies as soon as the story starts moving.
      tl.to(hintRef.current, { autoAlpha: 0, duration: 0.04, ease: 'power1.out' }, 0.01);

      // Hero copy exits — up and away — across the first quarter of the scrub.
      tl.to(heroRef.current, { autoAlpha: 0, y: -70, duration: 0.24, ease: 'power2.in' }, 0.02);

      // Section-2 copy: in around 45–62% of the film, out again before the end.
      tl.fromTo(
        s2Ref.current,
        { autoAlpha: 0, y: 60 },
        { autoAlpha: 1, y: 0, duration: 0.16, ease: 'power1.out' },
        0.46,
      ).to(s2Ref.current, { autoAlpha: 0, y: -50, duration: 0.14, ease: 'power1.in' }, 0.8);

      // --- Hero-loop handoff -------------------------------------------------
      // The idle video plays at the very top; the instant the user scrolls, we
      // cross-fade to the scrubbed film, and cross back on return to the top.
      //
      // This lives on its OWN ScrollTrigger with a single boundary at
      // HANDOFF_PX: onToggle fires reliably on BOTH crossings (an onUpdate on
      // the scrub trigger missed the return-to-top, since scrolling to exactly
      // 0 doesn't always re-fire it), and onRefresh re-syncs after preload and
      // after browser scroll-restoration on reload — so the loop can never get
      // stuck hidden at the top.
      const applyLoop = (showLoopNow: boolean) => {
        if (showLoopNow === atTopRef.current) return;
        atTopRef.current = showLoopNow;
        if (showLoopNow) {
          setShowLoop(true); // resume playback, then fade the loop back in
          gsap.to(loopLayerRef.current, { autoAlpha: 1, duration: 0.4, ease: 'power2.out', overwrite: true });
        } else {
          gsap.to(loopLayerRef.current, {
            autoAlpha: 0,
            duration: 0.4,
            ease: 'power2.out',
            overwrite: true,
            onComplete: () => {
              if (!atTopRef.current) setShowLoop(false);
            },
          });
        }
      };

      ScrollTrigger.create({
        trigger: wrapper,
        start: `top top-=${HANDOFF_PX}`,
        end: 'max',
        onToggle: (self) => applyLoop(!self.isActive),
        onRefresh: (self) => applyLoop(!self.isActive),
      });

      // Film is decodable (this effect is gated on `ready`) — re-measure now.
      ScrollTrigger.refresh();
    },
    {
      scope: wrapperRef,
      dependencies: [ready, failed, motionOff, videoScrub, frameScrub],
      revertOnUpdate: true,
    },
  );

  return (
    <>
      <section
        ref={wrapperRef}
        aria-label="Perjalanan dari padang ke piring"
        className="relative"
        style={motionOff ? undefined : { height: `${SEQUENCE.scrollLengthVh}vh` }}
      >
        {/* h-dvh (not vh): the film viewport tracks the REAL visible height as
            mobile browser chrome shows/hides — no strip of unpainted page. The
            scrub geometry is untouched (trigger start/end live on the wrapper,
            whose height stays scrollLengthVh); ScrollTrigger auto-refreshes on
            the resize this produces. */}
        <div className={`${motionOff ? 'relative' : 'sticky top-0'} h-dvh overflow-hidden bg-ink`}>
          {/* Scrub surface: HD video (desktop) or frame-sequence canvas
              (touch + dummy). Nothing renders until the device is known, so the
              element mounts once with the right type and never swaps (a live
              swap would crash React/Framer reconciliation). The loader covers
              the page meanwhile. */}
          {surface === 'video' && (
            <video
              ref={scrubVideoRef}
              aria-hidden="true"
              muted
              playsInline
              preload="auto"
              src={SEQUENCE.scrubVideoPath}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          {surface === 'canvas' && (
            <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />
          )}

          {/* Looping hero, above the scrub surface and below the legibility
              layers. Visible at the top; cross-faded on scroll. Skipped under
              reduced motion (the scrub surface's frame 0 shows). */}
          {!motionOff && (
            <div ref={loopLayerRef} className="pointer-events-none absolute inset-0 z-[5]">
              <HeroLoop active={showLoop && ready} />
            </div>
          )}

          {/* Legibility layers: soft vignette, a top scrim for the header, and a
              heavier floor gradient under the hero copy. Tuned so cream text
              stays readable even over the bright daylight footage. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(120%_90%_at_50%_30%,transparent_42%,rgba(13,9,6,0.8)_100%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-linear-to-b from-ink/60 to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[70vh] bg-linear-to-t from-ink/95 via-ink/55 to-transparent"
          />
          {/* Side wash — on desktop the copy sits left, so darken that edge a
              little more without dulling the herd on the right. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 hidden bg-linear-to-r from-ink/60 via-ink/10 to-transparent md:block"
          />

          {/* GSAP scrubs this wrapper's opacity/y; Framer staggers the children in on load. */}
          <div ref={heroRef} className="absolute inset-0 z-20">
            <HeroCopy play={ready && !failed} />
          </div>

          {!motionOff && (
            <div ref={s2Ref} className="absolute inset-0 z-20" style={{ opacity: 0, visibility: 'hidden' }}>
              <SectionTwoCopy countersOn={countersOn} variant="overlay" />
            </div>
          )}

          {!motionOff && (
            <div
              ref={hintRef}
              className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex flex-col items-center gap-2.5 text-bone/60"
            >
              <span className="text-xs font-medium uppercase tracking-[0.4em]">Scroll</span>
              <motion.span
                aria-hidden="true"
                animate={{ y: [0, 8, 0], opacity: [1, 0.4, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="block h-7 w-px bg-linear-to-b from-bone/80 to-transparent"
              />
            </div>
          )}
        </div>

        {/* Motion disabled (desktop reduce-motion): section-2 copy as a static block. */}
        {motionOff && <SectionTwoCopy countersOn variant="static" />}
      </section>

      {/* Preload screen — up until the film is decodable (or a fix-it hint if assets are missing). */}
      <AnimatePresence>
        {(!ready || failed) && (
          <motion.div
            key="loader"
            exit={{ opacity: 0, transition: { duration: 0.8, ease: 'easeInOut' } }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-7 bg-ink"
            role="status"
            aria-live="polite"
          >
            <Image
              src="/logo.png"
              alt="Jagaterra"
              width={226}
              height={320}
              priority
              className="h-28 w-auto rounded-2xl bg-bone object-contain p-3 shadow-xl ring-1 ring-bone/10"
            />
            <div className="h-0.5 w-56 overflow-hidden rounded-full bg-bone/10">
              <div
                className="h-full rounded-full bg-meat transition-[width] duration-300 ease-out"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <p className="text-xs tracking-widest text-bone/50 tabular-nums">
              {failed
                ? videoScrub
                  ? 'Video tidak ditemukan, cek public/hero-walk.mp4 & sequence.config.ts'
                  : 'Frame tidak ditemukan, cek public/frames/ & sequence.config.ts'
                : `Loading ${Math.round(progress * 100)}%`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
