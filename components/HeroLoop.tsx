'use client';

import { useEffect, useRef } from 'react';
import { SEQUENCE } from '@/lib/sequence.config';
import { paintIdleFrame, SCENE_SIZE } from '@/lib/dummyFrames';

/**
 * The looping hero shown at the very top of the page. ScrollSequence cross-fades
 * this layer out the instant the user scrolls, handing off to the scrubbed
 * canvas (which starts at frame 0 — the loop's resting frame), and fades it back
 * in on return to the top.
 *
 * `active` = "we're at the top and frames are ready" — it gates playback so the
 * video/rAF only runs while the layer is actually visible.
 *
 * Real mode → a real <video>. Dummy mode → a live canvas idle loop. The choice
 * is a build-time constant, so each branch is a stable component with its own
 * hooks (no conditional-hook hazard).
 */
export default function HeroLoop({ active }: { active: boolean }) {
  const useVideo = SEQUENCE.useRealFrames && SEQUENCE.loopVideoPath;
  return useVideo ? <HeroLoopVideo active={active} /> : <HeroLoopCanvas active={active} />;
}

function HeroLoopVideo({ active }: { active: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);

  // Play only while visible; pause when the layer is faded out to save decode.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active) {
      // play() can reject (autoplay policy / not yet loaded) — harmless here.
      void v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [active]);

  return (
    <video
      ref={ref}
      className="absolute inset-0 h-full w-full object-cover"
      src={SEQUENCE.loopVideoPath}
      muted
      loop
      playsInline
      autoPlay
      preload="auto"
      aria-hidden="true"
    />
  );
}

function HeroLoopCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Continuous phase; a ref so motion resumes smoothly across play/pause.
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Paint the scene at its native size, then cover-blit — the exact pipeline
    // the scrubbed frames use, so the loop and frame 0 line up at the cut.
    const off = document.createElement('canvas');
    off.width = SCENE_SIZE.w;
    off.height = SCENE_SIZE.h;
    const offCtx = off.getContext('2d');
    if (!offCtx) return;

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const blit = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const scale = Math.max(w / SCENE_SIZE.w, h / SCENE_SIZE.h); // cover
      const dw = SCENE_SIZE.w * scale;
      const dh = SCENE_SIZE.h * scale;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(off, (w - dw) / 2, (h - dh) / 2, dw, dh);
    };
    const draw = () => {
      paintIdleFrame(offCtx, phaseRef.current);
      blit();
    };

    size();
    draw(); // one frame up front so the layer is never blank

    const onResize = () => {
      size();
      draw();
    };
    window.addEventListener('resize', onResize);

    let raf = 0;
    let running = false;
    const tick = () => {
      phaseRef.current += 0.14; // slow, calm cadence
      draw();
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (running || document.visibilityState !== 'visible') return;
      running = true;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    // Background tabs throttle rAF; pause outright and resume on return.
    const onVis = () => (document.visibilityState === 'visible' && active ? start() : stop());
    document.addEventListener('visibilitychange', onVis);

    if (active) start();

    return () => {
      stop();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [active]);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />;
}
