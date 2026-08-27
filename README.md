# Jagaterra — Premium Australian Grass-Fed Beef

Scroll-driven home page for a premium beef butcher: a looping hero that hands
off to a scroll-scrubbed HD film, a pinned 3D ring gallery of cuts, and a footer.

- **Next.js** (App Router, TypeScript) + **Tailwind CSS v4**
- **GSAP + ScrollTrigger** — everything tied to scroll progress (the film scrub,
  pinning, the rotating gallery, the loop↔scrub handoff)
- **Framer Motion** — discrete motion (hero stagger, counters, hovers, reveals)

## The hero: looping video → scroll-scrubbed film

At the very top the hero is a **seamless looping video** (the idle "diam" shot).
The instant you scroll down it cross-fades to the **scroll-scrubbed film** (the
"berjalan" shot), whose playback position tracks your scroll; scroll back to the
top and the loop fades in and takes over again.

In **real mode** the scrubbed film is an HD `<video>` driven directly by scroll
(we set `currentTime` from scroll progress). That keeps it **full resolution and
at its native framerate** — no frame extraction, no downsampling. Encode it with
a short keyframe interval so scroll-seeking stays smooth.

With **zero assets** the whole thing still runs on procedural placeholders: the
scrub is a day→dusk→night canvas sequence and the loop is a live-rendered,
gently grazing version of its first frame.

## Quickstart

```bash
npm install
npm run dev
```

## Swapping in real footage

You need two clips: an **idle loop** (`videodiam`) and the **scrubbed film**
(`videoberjalan`). Encode both to web-friendly MP4s in `public/`:

```bash
# scrubbed film — HD, native fps, short GOP (-g 10) so seeking is smooth
ffmpeg -i videoberjalan.mp4 -vf "scale=1920:-2" -c:v libx264 -crf 23 \
  -g 10 -keyint_min 10 -sc_threshold 0 -movflags +faststart -an public/hero-walk.mp4

# idle loop — HD, faststart
ffmpeg -i videodiam.mp4 -vf "scale=1920:-2" -c:v libx264 -crf 24 \
  -movflags +faststart -an public/hero-loop.mp4
```

Then edit **`lib/sequence.config.ts`** — the only file that needs to change:

```ts
export const SEQUENCE = {
  useRealFrames: true,              // ← true = HD videos; false = procedural placeholders
  scrubVideoPath: '/hero-walk.mp4', // the scroll-scrubbed film
  loopVideoPath: '/hero-loop.mp4',  // the idle loop ('' to skip it)
  scrollLengthVh: 400,              // taller = slower/smoother scrub
};
```

**Seamless-handoff contract:** the scrub starts at `t = 0` of the walking film,
so the loop's resting frame should match the walking film's first frame (export
both from the same shot). A quick cross-fade hides any tiny difference. Set
`loopVideoPath: ''` to open directly on the walking film's frame 0.

### Shooting / encoding guidance

- **Scrubbed film:** a few seconds up to ~15 s works; short keyframe interval
  (`-g 10`) is what keeps scroll-seeking smooth. HD (1080p) is a good balance of
  sharpness and weight — the file streams and buffers before scrolling unlocks.
- Keep the subject near the **horizontal center**: the video is `object-cover`,
  so portrait phones only see roughly the middle third of the width.
- If the film feels too fast/slow to scrub, tune `scrollLengthVh`.

## Project structure

```
app/
  layout.tsx            fonts (Marcellus/Figtree), MotionConfig, metadata
  page.tsx              header + <main> (sequence, gallery) + footer
  globals.css           brand tokens → Tailwind theme, focus styles
components/
  ScrollSequence.tsx    sticky scrub surface (video/canvas) + master timeline + loop handoff + loader
  HeroLoop.tsx          top-of-page looping hero (real <video> / dummy idle canvas)
  HeroCopy.tsx          hero overlay (Framer stagger on load)
  SectionTwoCopy.tsx    "Standar Kami" overlay + count-up stats
  CutGallery.tsx        pinned 3D ring carousel (6 cuts)
  SiteHeader/Footer.tsx brand header + footer with whileInView reveals
lib/
  sequence.config.ts    ← source of truth (mode flag + video paths)
  useImageSequence.ts   preloads procedural frames (dummy mode); stands down in real mode
  dummyFrames.ts        procedural placeholder frames + the idle-loop painter
  gsap.ts               single gsap/ScrollTrigger registration point
```

## Notes

- **Real vs dummy** is the single `useRealFrames` flag. Real mode scrubs the HD
  `<video>`; dummy mode scrubs a procedural canvas sequence so `npm run dev`
  works with nothing in `/public`.
- **Loader**: the page is covered until the scrub film is decodable
  (`canplaythrough`, with a safety timeout), showing buffered progress. If the
  video is missing, the loader says what to check.
- **Reduced motion**: with `prefers-reduced-motion: reduce`, the loop is skipped
  and scrubbing is disabled (frame 0 shows as a still), section-2 copy renders as
  a static block, and the gallery ring doesn't pin or spin.
- The `asset/` folder holds the original source clips; only the encoded files in
  `public/` are served.
