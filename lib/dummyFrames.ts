/**
 * Procedural placeholder frames — a stylized cow crossing a meadow while day
 * turns to dusk and then night — so the whole scroll backbone runs before the
 * real film exists.
 *
 * Each frame is painted to one reusable offscreen canvas, encoded to a JPEG
 * blob and returned as an object URL. That deliberately matches the shape of
 * real frames on disk: the preloader and the scrubber run the exact same code
 * path for both. (Keeping 120 raw canvases alive would pin ~350MB of bitmap
 * memory; compressed blobs let the browser manage decoded-image memory the
 * same way it does for ordinary <img> assets.)
 */

const FRAME_W = 1440;
const FRAME_H = 810;

type RGB = [number, number, number];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
const mix = (a: RGB, b: RGB, t: number): RGB => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];
const css = (c: RGB, a = 1) =>
  `rgba(${c[0] | 0}, ${c[1] | 0}, ${c[2] | 0}, ${a})`;

// Deterministic pseudo-random from an integer seed. Stars and grass tufts must
// land in the same spot on every frame or they'd flicker while scrubbing.
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// [day, dusk, night] keyframes; dusk sits at t = 0.5.
const SKY_TOP: [RGB, RGB, RGB] = [[116, 160, 199], [104, 78, 108], [8, 12, 26]];
const SKY_BOT: [RGB, RGB, RGB] = [[214, 222, 200], [232, 134, 74], [24, 26, 44]];
const HILL_FAR: [RGB, RGB, RGB] = [[132, 156, 102], [96, 88, 74], [26, 28, 30]];
const HILL_NEAR: [RGB, RGB, RGB] = [[112, 138, 86], [78, 72, 58], [20, 22, 24]];
const GRASS_TOP: [RGB, RGB, RGB] = [[104, 130, 74], [70, 66, 48], [16, 18, 16]];
const GRASS_BOT: [RGB, RGB, RGB] = [[74, 96, 54], [48, 46, 34], [10, 12, 11]];

const sample3 = ([day, dusk, night]: [RGB, RGB, RGB], t: number): RGB =>
  t < 0.5
    ? mix(day, dusk, smoothstep(0.12, 0.5, t))
    : mix(dusk, night, smoothstep(0.5, 0.88, t));

// roundRect with a plain-rect fallback for older engines.
const rr = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) => {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
};

type SceneOpts = {
  /** 0 → 1, day → dusk → night. Drives every color, the sun, and the walk position. */
  dayT: number;
  /** Phase for the sinusoidal idle motions (legs, grass, tail, gait bob). */
  motionPhase: number;
  /**
   * Standing-and-grazing pose (tiny leg shift + a slow head dip) instead of a
   * mid-stride walk. Used by the hero loop, which locks dayT to 0.
   */
  idle?: boolean;
};

function paintScene(
  ctx: CanvasRenderingContext2D,
  { dayT: t, motionPhase: m, idle = false }: SceneOpts,
) {
  const W = FRAME_W;
  const H = FRAME_H;
  const HORIZON = H * 0.66;
  const night = smoothstep(0.55, 0.9, t); // 0 by day, 1 once fully dark

  // --- sky -----------------------------------------------------------
  const skyTop = sample3(SKY_TOP, t);
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON);
  sky.addColorStop(0, css(skyTop));
  sky.addColorStop(1, css(sample3(SKY_BOT, t)));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, HORIZON);

  // --- sun: descends and fades over the first ~72% -------------------
  const sunAlpha = 1 - smoothstep(0.58, 0.74, t);
  if (sunAlpha > 0) {
    const sunX = W * lerp(0.76, 0.58, t);
    const sunY = lerp(H * 0.17, HORIZON + 60, smoothstep(0, 0.72, t));
    const disc = mix([255, 244, 214], [255, 122, 64], smoothstep(0.25, 0.6, t));
    const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 170);
    glow.addColorStop(0, css(disc, 0.55 * sunAlpha));
    glow.addColorStop(1, css(disc, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(sunX - 170, sunY - 170, 340, 340);
    ctx.fillStyle = css(disc, sunAlpha);
    ctx.beginPath();
    ctx.arc(sunX, sunY, 44, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- moon + stars, fading in with the night ------------------------
  if (night > 0.01) {
    ctx.fillStyle = css([234, 236, 244], night * 0.9);
    ctx.beginPath();
    ctx.arc(W * 0.24, H * 0.18, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = css(skyTop, night); // sky-colored bite → crescent
    ctx.beginPath();
    ctx.arc(W * 0.24 + 12, H * 0.18 - 6, 26, 0, Math.PI * 2);
    ctx.fill();

    for (let s = 0; s < 90; s++) {
      const twinkle = 0.5 + 0.5 * Math.sin(m * 0.3 + s * 12.9);
      ctx.fillStyle = css([240, 240, 250], night * (0.25 + 0.75 * twinkle) * 0.9);
      ctx.fillRect(hash(s) * W, hash(s + 500) * HORIZON * 0.85, 2, 2);
    }
  }

  // --- hills (tops peek above the horizon; meadow paints over the rest)
  ctx.fillStyle = css(sample3(HILL_FAR, t));
  ctx.beginPath();
  ctx.ellipse(W * 0.25, HORIZON + 55, W * 0.52, 120, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = css(sample3(HILL_NEAR, t));
  ctx.beginPath();
  ctx.ellipse(W * 0.85, HORIZON + 70, W * 0.45, 130, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- meadow ---------------------------------------------------------
  const gBot = sample3(GRASS_BOT, t);
  const ground = ctx.createLinearGradient(0, HORIZON, 0, H);
  ground.addColorStop(0, css(sample3(GRASS_TOP, t)));
  ground.addColorStop(1, css(gBot));
  ctx.fillStyle = ground;
  ctx.fillRect(0, HORIZON, W, H - HORIZON);

  // grass tufts — fixed positions, gentle sway driven by the frame index
  ctx.lineWidth = 2;
  for (let g = 0; g < 70; g++) {
    const gx = hash(g + 3000) * W;
    const gy = HORIZON + 14 + hash(g + 4000) * (H - HORIZON - 24);
    const sway = Math.sin(m * 0.16 + g) * 2.5;
    ctx.strokeStyle = css(mix(gBot, [10, 12, 8], 0.25 + night * 0.4), 0.8);
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.quadraticCurveTo(gx + sway, gy - 9, gx + sway * 1.6, gy - 16);
    ctx.stroke();
  }

  // --- the cow --------------------------------------------------------
  // Walks the center-safe band (0.3W → 0.7W) so portrait-phone cover-crops
  // still see it. Colors blend to a silhouette as night falls.
  // idle locks dayT to 0, so walk ≈ 0 and the cow rests at the start position.
  const walk = smoothstep(0.03, 0.97, t);
  const cx = W * lerp(0.3, 0.7, walk);
  const baseY = H * 0.84 + Math.sin(m * 0.85) * (idle ? 1.2 : 2.5); // hoof line + gait bob
  const sil = night * 0.94;
  const hide = mix([238, 230, 214], [15, 11, 9], sil); // main coat
  const hideDark = mix([104, 74, 56], [12, 9, 8], sil); // patches / far legs

  const bodyW = 200;
  const bodyH = 104;
  const bodyX = cx - bodyW / 2;
  const bodyY = baseY - 66 - bodyH;

  // soft contact shadow
  ctx.fillStyle = css([10, 8, 6], 0.28 - night * 0.16);
  ctx.beginPath();
  ctx.ellipse(cx, baseY + 6, bodyW * 0.62, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // legs pendulum around the hip; opposite phases give a diagonal gait
  const leg = (hipX: number, phase: number, shade: RGB) => {
    // idle = a barely-there weight shift; walking = a full pendulum stride
    const swing = Math.sin(m * 0.5 + phase) * (idle ? 0.08 : 0.22);
    ctx.save();
    ctx.translate(hipX, bodyY + bodyH - 14);
    ctx.rotate(swing);
    ctx.fillStyle = css(shade);
    rr(ctx, -9, 0, 18, 74, 8);
    ctx.fill();
    ctx.fillStyle = css(mix(shade, [8, 6, 5], 0.5));
    rr(ctx, -9, 60, 18, 14, 4);
    ctx.fill();
    ctx.restore();
  };

  // draw order = cheap depth: far legs, tail, body, patches, near legs, head
  leg(cx - bodyW * 0.3 + 6, Math.PI, hideDark);
  leg(cx + bodyW * 0.3 + 6, Math.PI * 1.5, hideDark);

  ctx.strokeStyle = css(hide);
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(bodyX + 6, bodyY + 18);
  ctx.quadraticCurveTo(
    bodyX - 18 + Math.sin(m * 0.3) * 4,
    bodyY + 60,
    bodyX - 10 + Math.sin(m * 0.3) * 6,
    bodyY + 96,
  );
  ctx.stroke();

  ctx.fillStyle = css(hide);
  rr(ctx, bodyX, bodyY, bodyW, bodyH, 46);
  ctx.fill();

  if (sil < 0.97) {
    // coat patches disappear into the silhouette
    ctx.fillStyle = css(hideDark, (1 - sil) * 0.85);
    ctx.beginPath();
    ctx.ellipse(bodyX + bodyW * 0.32, bodyY + bodyH * 0.42, 34, 24, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(bodyX + bodyW * 0.68, bodyY + bodyH * 0.6, 26, 18, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  leg(cx - bodyW * 0.3 - 6, 0, hide);
  leg(cx + bodyW * 0.3 - 6, Math.PI * 0.5, hide);

  // head leads the walk with a gentle bob; when idle it slowly dips to graze
  const hx = bodyX + bodyW - 8;
  const hy =
    bodyY -
    26 +
    (idle ? 4 + (0.5 + 0.5 * Math.sin(m * 0.5)) * 12 : Math.sin(m * 0.4) * 3);
  ctx.fillStyle = css(hide);
  rr(ctx, hx, hy, 58, 62, 18);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(hx + 6, hy + 6, 14, 7, -0.5, 0, Math.PI * 2); // ear
  ctx.fill();
  if (sil < 0.9) {
    ctx.fillStyle = css(mix([214, 190, 178], [20, 14, 12], sil), 1 - sil);
    rr(ctx, hx + 6, hy + 38, 46, 20, 10); // muzzle
    ctx.fill();
    ctx.fillStyle = css([26, 18, 14], 1 - sil);
    ctx.beginPath();
    ctx.arc(hx + 40, hy + 20, 3.5, 0, Math.PI * 2); // eye
    ctx.fill();
  }

  // --- subtle grade: darkened corners so the dummy reads "filmic" -----
  const vig = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.3, W / 2, H * 0.45, W * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(10,6,4,0.35)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}

/** One scrubbed sequence frame: dayT and motion both advance with the index. */
function paintFrame(ctx: CanvasRenderingContext2D, i: number, frameCount: number) {
  paintScene(ctx, { dayT: i / (frameCount - 1), motionPhase: i });
}

/**
 * One frame of the hero idle loop — the same meadow at full morning (dayT = 0,
 * matching sequence frame 0) with the cow standing and grazing in place.
 * `phase` advances continuously; every motion here is a pure sine of it, so the
 * loop is inherently seamless. Draws at the fixed scene size — the caller
 * cover-blits it, identical to how sequence frames are drawn.
 */
export function paintIdleFrame(ctx: CanvasRenderingContext2D, phase: number) {
  paintScene(ctx, { dayT: 0, motionPhase: phase, idle: true });
}

/** Native pixel size of every generated frame (frames and the idle loop share it). */
export const SCENE_SIZE = { w: FRAME_W, h: FRAME_H };

/**
 * Renders every placeholder frame and returns one URL per frame.
 * `onFrameDone` fires after each frame (drives the loader progress bar);
 * `isAborted` is polled so an unmounted component stops the work.
 */
export async function generateDummyFrames(
  frameCount: number,
  onFrameDone: () => void,
  isAborted: () => boolean,
): Promise<string[]> {
  const canvas = document.createElement('canvas');
  canvas.width = FRAME_W;
  canvas.height = FRAME_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  const urls: string[] = [];
  for (let i = 0; i < frameCount; i++) {
    if (isAborted()) {
      urls.forEach((u) => URL.revokeObjectURL(u));
      return [];
    }
    paintFrame(ctx, i, frameCount);
    if (document.visibilityState === 'hidden') {
      // Background tabs suspend toBlob (it needs a raster pass), which would
      // stall the preload forever. toDataURL is synchronous and immune.
      urls.push(canvas.toDataURL('image/jpeg', 0.72));
    } else {
      // toBlob is async — encoding stays off the critical path and the await
      // yields to the event loop, keeping the loader animation fluid.
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.72),
      );
      urls.push(blob ? URL.createObjectURL(blob) : canvas.toDataURL('image/jpeg', 0.72));
      // A tab hidden mid-loop leaves a pending toBlob hanging until the tab is
      // shown again — the visibility check above takes over on the next frame.
    }
    onFrameDone();
  }
  return urls;
}
