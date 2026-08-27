/**
 * The one place that knows where the hero footage comes from.
 *
 * REAL mode (useRealFrames: true) — production. Three assets drive the hero:
 *
 *   • loopVideoPath  — seamless idle loop at the very top (plays as a video).
 *   • scrubVideoPath — the "walking" film, scroll-scrubbed on DESKTOP by
 *     setting <video>.currentTime (full HD, native framerate).
 *   • mobileFrame*   — the SAME film as an extracted JPEG sequence, scrubbed
 *     on a <canvas> for touch devices. iOS Safari won't decode/paint seeks on
 *     a paused inline video, so currentTime-scrubbing is desktop-only; the
 *     canvas image sequence gives mobile the identical scroll-driven film.
 *
 * DUMMY mode (useRealFrames: false) — zero-asset fallback so `npm run dev`
 * works with nothing in /public: a procedural day→dusk→night canvas sequence
 * is scrubbed, and the idle loop is generated live.
 *
 * Encoding / extraction (see README):
 *
 *   # desktop scrub film — HD, native fps, short GOP so seeking is smooth
 *   ffmpeg -i videoberjalan.mp4 -vf "scale=1920:-2" -c:v libx264 -crf 23 \
 *     -g 10 -keyint_min 10 -sc_threshold 0 -movflags +faststart -an public/hero-walk.mp4
 *
 *   # idle loop — HD, faststart
 *   ffmpeg -i videodiam.mp4 -vf "scale=1920:-2" -c:v libx264 -crf 24 \
 *     -movflags +faststart -an public/hero-loop.mp4
 *
 *   # mobile scrub frames — same film, 6fps JPEG sequence (decoded windowed, so
 *   # light on RAM; 1080px keeps the download small too)
 *   ffmpeg -i videoberjalan.mp4 -vf "fps=6,scale=1080:-2" -q:v 6 \
 *     public/frames/frame_%04d.jpg
 */
export const SEQUENCE = {
  /** true = real assets from /public; false = procedural placeholders (zero assets). */
  useRealFrames: true,

  // --- REAL mode -----------------------------------------------------------
  /** Desktop scrub surface: HD video driven by currentTime. */
  scrubVideoPath: '/hero-walk.mp4',

  /**
   * Seamless idle loop shown at the very top; cross-fades to the scrubbed film
   * on scroll (see the handoff in ScrollSequence). Author it so its resting
   * frame matches the film's first frame. '' skips the loop entirely.
   */
  loopVideoPath: '/hero-loop.mp4',

  /** Mobile scrub surface: frame count — keep in sync with /public/frames. */
  mobileFrameCount: 91,
  /** Mobile frame index (0-based) → URL. ffmpeg's %04d starts at 1, hence +1. */
  mobileFramePath: (i: number) => `/frames/frame_${String(i + 1).padStart(4, '0')}.jpg`,
  /**
   * How many decoded frames the mobile scrubber keeps in RAM at once (a sliding
   * window around the scroll position, via createImageBitmap + close). Bounds
   * mobile memory to ~window×frameArea×4 bytes regardless of frame count — the
   * fix for iOS Safari's per-tab memory ceiling. ~20 × 1080×604×4 ≈ 52MB.
   */
  mobileDecodeWindow: 20,

  // --- DUMMY mode ------------------------------------------------------------
  /** Procedural placeholder frame count (dummy mode only). */
  frameCount: 120,

  // --- shared ----------------------------------------------------------------
  /**
   * Height of the scroll wrapper in vh. The extra (scrollLengthVh − 100)vh is
   * the scrub distance mapped onto the film — taller = slower, smoother.
   */
  scrollLengthVh: 400,
};

export type SequenceConfig = typeof SEQUENCE;
