'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SequenceConfig } from './sequence.config';
import { generateDummyFrames } from './dummyFrames';

/**
 * What the sequence hook should load:
 *  - 'dummy'  — procedurally generated placeholder frames, all held (dev mode)
 *  - 'frames' — real JPEGs; blobs held (compressed, cheap), decoded in a sliding
 *               WINDOW of ImageBitmaps so RAM stays bounded on mobile
 *  - 'off'    — nothing; the scrub surface is the desktop <video>
 */
export type SequenceMode = 'dummy' | 'frames' | 'off';

export type ImageSequence = {
  /** 0 → 1 across generation (dummy) / download (frames). */
  progress: number;
  /** True once the sequence can be scrubbed (frame 0 decoded). */
  ready: boolean;
  /** True when *no* frame loaded — e.g. /public/frames is empty or out of sync. */
  failed: boolean;
  /**
   * Best-available frame for `index`: the exact frame if decoded, else the
   * nearest decoded neighbour, else null. In 'frames' mode this also drives the
   * sliding window — decoding `index` + a look-ahead and closing frames that
   * fall outside the window. Returns HTMLImageElement (dummy) or ImageBitmap
   * (frames); both are valid drawImage sources.
   */
  frameAt: (index: number) => HTMLImageElement | ImageBitmap | null;
};

/**
 * Preloads / streams the scrub frames.
 *
 * Dummy mode renders frames procedurally and holds them all (dev only, desktop).
 * Frames mode downloads every JPEG as a Blob (all held — compressed bytes are
 * cheap) but only ever keeps ~config.mobileDecodeWindow decoded ImageBitmaps in
 * memory, closing the rest. That caps mobile RAM at roughly
 * window × frameArea × 4 bytes regardless of frame count — the fix for iOS
 * Safari's per-tab memory ceiling.
 *
 * `onFrameDecoded` fires when a windowed decode completes, so the caller can
 * redraw the current frame once its exact bitmap is ready (e.g. after the user
 * stops scrolling on a not-yet-decoded frame).
 */
export function useImageSequence(
  config: SequenceConfig,
  mode: SequenceMode,
  onFrameDecoded?: () => void,
): ImageSequence {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const imagesRef = useRef<(HTMLImageElement | null)[]>([]); // dummy: all decoded
  const blobsRef = useRef<(Blob | null)[]>([]); // frames: all compressed
  const bitmapsRef = useRef<Map<number, ImageBitmap>>(new Map()); // frames: windowed
  const decodingRef = useRef<Set<number>>(new Set());

  // Keep the decode callback current without re-running the load effect.
  const decodedCbRef = useRef(onFrameDecoded);
  decodedCbRef.current = onFrameDecoded;

  useEffect(() => {
    if (mode === 'off') {
      setProgress(1);
      setReady(true);
      setFailed(false);
      return;
    }

    let aborted = false;
    let objectUrls: string[] = [];

    // reset any prior state / free decoded bitmaps
    imagesRef.current = [];
    bitmapsRef.current.forEach((b) => b.close());
    bitmapsRef.current = new Map();
    decodingRef.current = new Set();
    blobsRef.current = [];
    setProgress(0);
    setReady(false);
    setFailed(false);

    if (mode === 'dummy') {
      const total = config.frameCount;
      const units = total * 2; // generate + decode
      let done = 0;
      const bump = () => {
        done++;
        if (!aborted) setProgress(done / units);
      };
      (async () => {
        const urls = await generateDummyFrames(total, bump, () => aborted);
        objectUrls = urls;
        if (aborted || urls.length === 0) return;
        const imgs: (HTMLImageElement | null)[] = new Array(total).fill(null);
        let failures = 0;
        await Promise.all(
          urls.map(
            (src, i) =>
              new Promise<void>((resolve) => {
                const img = new Image();
                img.onload = () => {
                  imgs[i] = img;
                  bump();
                  resolve();
                };
                img.onerror = () => {
                  failures++;
                  bump();
                  resolve();
                };
                img.src = src;
              }),
          ),
        );
        if (aborted) return;
        imagesRef.current = imgs;
        if (failures === total) setFailed(true);
        setReady(true);
      })();
    } else {
      // 'frames': download all blobs, then decode frame 0 and go.
      const total = config.mobileFrameCount;
      const blobs: (Blob | null)[] = new Array(total).fill(null);
      let done = 0;
      let failures = 0;
      (async () => {
        // Fetch with a small concurrency pool rather than 91 requests at once —
        // firing them all overwhelms the HTTP/1.1 connection cap (some never
        // settle → Promise.all hangs) and is rough on mobile networks.
        const CONCURRENCY = 8;
        let nextIndex = 0;
        const fetchWorker = async () => {
          while (!aborted) {
            const i = nextIndex++;
            if (i >= total) return;
            try {
              const res = await fetch(config.mobileFramePath(i));
              if (!res.ok) throw new Error(String(res.status));
              blobs[i] = await res.blob();
            } catch {
              failures++;
            } finally {
              done++;
              if (!aborted) setProgress(done / total);
            }
          }
        };
        await Promise.all(Array.from({ length: Math.min(CONCURRENCY, total) }, fetchWorker));
        if (aborted) return;
        if (failures === total) {
          console.error(
            `[useImageSequence] 0/${total} frames loaded. Check /public/frames/ and ` +
              'mobileFrameCount / mobileFramePath in lib/sequence.config.ts.',
          );
          setFailed(true);
          return;
        }
        blobsRef.current = blobs;
        // Enable scrolling as soon as the bytes are here. Do NOT block `ready` on
        // decoding frame 0 — createImageBitmap can stall indefinitely while the
        // tab is offscreen, which would hang the loader. Warm frame 0 in the
        // background instead; it redraws via onFrameDecoded once it lands.
        setReady(true);
        if (blobs[0]) {
          createImageBitmap(blobs[0])
            .then((bmp) => {
              if (aborted || !blobsRef.current[0]) {
                bmp.close();
                return;
              }
              bitmapsRef.current.set(0, bmp);
              decodedCbRef.current?.();
            })
            .catch(() => {});
        }
      })();
    }

    return () => {
      aborted = true;
      objectUrls.forEach((u) => URL.revokeObjectURL(u));
      imagesRef.current = [];
      bitmapsRef.current.forEach((b) => b.close());
      bitmapsRef.current.clear();
      decodingRef.current.clear();
      blobsRef.current = [];
    };
  }, [config, mode]);

  // Ensure [index-3 .. index+ahead] are decoded/decoding; close anything outside
  // a slightly larger keep-range. Runs on every frameAt (i.e. every scrub tick).
  const ensureWindow = useCallback(
    (index: number) => {
      const blobs = blobsRef.current;
      const total = blobs.length;
      if (total === 0) return;
      const W = config.mobileDecodeWindow;
      const ahead = Math.max(4, W - 6);
      const lo = Math.max(0, index - 3);
      const hi = Math.min(total - 1, index + ahead);
      const cache = bitmapsRef.current;
      const decoding = decodingRef.current;

      const keepLo = Math.max(0, lo - 2);
      const keepHi = Math.min(total - 1, hi + 2);
      for (const [k, bmp] of cache) {
        if (k < keepLo || k > keepHi) {
          bmp.close();
          cache.delete(k);
        }
      }
      for (let i = lo; i <= hi; i++) {
        if (cache.has(i) || decoding.has(i) || !blobs[i]) continue;
        decoding.add(i);
        createImageBitmap(blobs[i] as Blob)
          .then((bmp) => {
            decoding.delete(i);
            // dropped while decoding (reset, or scrolled far away) → free it
            if (!blobsRef.current[i] || i < keepLo || i > keepHi) {
              bmp.close();
              return;
            }
            cache.set(i, bmp);
            decodedCbRef.current?.();
          })
          .catch(() => decoding.delete(i));
      }
    },
    [config.mobileDecodeWindow],
  );

  const frameAt = useCallback(
    (index: number): HTMLImageElement | ImageBitmap | null => {
      if (mode === 'dummy') {
        const imgs = imagesRef.current;
        let img = imgs[index] ?? null;
        for (let j = index - 1; !img && j >= 0; j--) img = imgs[j];
        return img;
      }
      if (mode === 'frames') {
        ensureWindow(index);
        const cache = bitmapsRef.current;
        const exact = cache.get(index);
        if (exact) return exact;
        // nearest already-decoded frame, searching outward
        for (let d = 1; d <= cache.size + 8; d++) {
          const lo = cache.get(index - d);
          if (lo) return lo;
          const hi = cache.get(index + d);
          if (hi) return hi;
        }
        return null;
      }
      return null;
    },
    [mode, ensureWindow],
  );

  return { progress, ready, failed, frameAt };
}
