'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { waLink } from '@/lib/site';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import { EASE_OUT } from '@/lib/motion';

type Cut = {
  name: string;
  img: string;
  weight: string;
  character: string;
  bestFor: string;
};

// Full product catalogue — each a framed card image in /public/cuts/. Shown
// object-contain inside a matted frame so any resolution reads crisp and never
// stretched. Ordered by category: steak → sliced → ground → chunks → others.
const CUTS: readonly Cut[] = [
  // — Steak cut —
  {
    name: 'Wagyu Sirloin',
    img: '/cuts/wagyu-sirloin.png',
    weight: '200 gr',
    character: 'Marbling wagyu yang padat; lemaknya meleleh jadi juicy dan gurih mewah.',
    bestFor: 'Steak premium, teppanyaki, yakiniku',
  },
  {
    name: 'Rib Eye',
    img: '/cuts/rib-eye.png',
    weight: '200 gr',
    character: 'Mata iga dengan marbling kaya, empuk dan penuh rasa saat dibakar.',
    bestFor: 'Steak, grill, BBQ',
  },
  {
    name: 'Sirloin',
    img: '/cuts/sirloin.png',
    weight: '200 gr / 250 gr',
    character: 'Marbling merata dengan tepi lemak yang harum saat dipanggang.',
    bestFor: 'Steak, grill, yakiniku',
  },
  {
    name: 'Tenderloin',
    img: '/cuts/tenderloin.png',
    weight: '180 gr / 200 gr',
    character: 'Potongan paling empuk, nyaris tanpa lemak, lembut di lidah.',
    bestFor: 'Steak medium-rare, sauté',
  },
  // — Sliced —
  {
    name: 'Sliced Beef Shortplate',
    img: '/cuts/sliced-beef-shortplate.png',
    weight: '500 gr',
    character: 'Irisan tipis short plate berlemak, gurih dan cepat matang.',
    bestFor: 'Shabu-shabu, yakiniku, hotpot',
  },
  {
    name: 'Sliced Rib Eye',
    img: '/cuts/sliced-rib-eye.png',
    weight: '250 gr',
    character: 'Irisan rib eye marbling, lumer dan juicy saat diseduh kuah panas.',
    bestFor: 'Shabu-shabu, sukiyaki, hotpot',
  },
  {
    name: 'Sliced Beef Tongue Organic',
    img: '/cuts/sliced-beef-tongue-organic.png',
    weight: '250 gr',
    character: 'Irisan lidah sapi organik, kenyal lembut dengan rasa yang dalam.',
    bestFor: 'Yakiniku, gyutan, panggang',
  },
  {
    name: 'Sliced Sirloin',
    img: '/cuts/sliced-sirloin.png',
    weight: '250 gr / 500 gr',
    character: 'Irisan sirloin tipis, empuk dengan sedikit lemak yang manis.',
    bestFor: 'Shabu-shabu, yakiniku, tumis',
  },
  {
    name: 'Sliced Veal',
    img: '/cuts/sliced-veal.png',
    weight: '500 gr',
    character: 'Irisan daging sapi muda, halus dan ringan, cepat empuk.',
    bestFor: 'Shabu-shabu, tumis cepat, sup',
  },
  // — Ground —
  {
    name: 'Ground Beef no Fats',
    img: '/cuts/ground-beef-no-fats.png',
    weight: '500 gr',
    character: 'Giling tanpa lemak, merah bersih dan padat protein.',
    bestFor: 'Patty sehat, bolognese, isian',
  },
  {
    name: 'Ground Beef with Fats',
    img: '/cuts/ground-beef-with-fats.png',
    weight: '500 gr',
    character: 'Giling dengan lemak, juicy dan kaya rasa saat dimasak.',
    bestFor: 'Burger, meatball, saus daging',
  },
  {
    name: 'Ground Sirloin',
    img: '/cuts/ground-sirloin.png',
    weight: '500 gr',
    character: 'Sirloin giling bertekstur premium dengan rasa steak.',
    bestFor: 'Burger gourmet, kofta, meatloaf',
  },
  {
    name: 'Ground Tenderloin',
    img: '/cuts/ground-tenderloin.png',
    weight: '250 gr',
    character: 'Tenderloin giling, super lembut dan rendah lemak.',
    bestFor: 'Patty premium, isian, MPASI',
  },
  {
    name: 'Ground Veal',
    img: '/cuts/ground-veal.png',
    weight: '500 gr',
    character: 'Sapi muda giling, halus dan lembut dengan rasa ringan.',
    bestFor: 'Meatball, isian pasta, sup',
  },
  // — Chunks —
  {
    name: 'Shank Chunk (Sengkel)',
    img: '/cuts/shank-chunk.png',
    weight: '500 gr',
    character: 'Sengkel berserat dengan urat, empuk luar biasa saat direbus lama.',
    bestFor: 'Rawon, semur, sup, rendang',
  },
  {
    name: 'Brisket (Sandung Lamur)',
    img: '/cuts/brisket.png',
    weight: '500 gr',
    character: 'Sandung lamur berlapis lemak, juicy dan kaya saat dimasak perlahan.',
    bestFor: 'Corned beef, brisket asap, soto, rawon',
  },
  {
    name: 'Veal Meat',
    img: '/cuts/veal-meat.png',
    weight: '500 gr',
    character: 'Daging sapi muda utuh, lembut dengan rasa yang bersih.',
    bestFor: 'Semur, sup, tumis, steak lembut',
  },
  // — Others —
  {
    name: 'Tunjang (Kikil Kaki Sapi)',
    img: '/cuts/tunjang.png',
    weight: '500 gr',
    character: 'Kikil kaki sapi kaya kolagen, kenyal dan bergelatin.',
    bestFor: 'Soto, gulai kikil, sup kaki',
  },
  {
    name: 'Beef Fat Organic (Daging Tetelan)',
    img: '/cuts/beef-fat-organic.png',
    weight: '500 gr',
    character: 'Tetelan berdaging dan berlemak, gurih untuk kuah yang kaya.',
    bestFor: 'Soto, bakso urat, kaldu',
  },
  {
    name: 'Hati (Liver)',
    img: '/cuts/hati-liver.png',
    weight: '500 gr',
    character: 'Hati sapi padat zat besi, lembut dan gurih bila dimasak pas.',
    bestFor: 'Sambal goreng ati, tumis, sate',
  },
  {
    name: 'Paru (Lungs)',
    img: '/cuts/paru-lungs.png',
    weight: '500 gr',
    character: 'Paru sapi bertekstur ringan, empuk dan menyerap bumbu.',
    bestFor: 'Paru goreng, sambal, keripik paru',
  },
] as const;

/**
 * Section 3 — master/detail product browser.
 *
 * RIGHT (desktop) / BOTTOM (mobile): a scrollable list of cuts you can click.
 * LEFT / TOP: the selected cut's detail — a framed image (matted, object-contain
 * so replacement photos of any size stay crisp) plus its description and a
 * WhatsApp order button. Selecting a row crossfades the detail panel.
 */
export default function CutGallery() {
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const cut = CUTS[active];

  // Mobile detail is a bottom sheet (desktop uses the sticky side panel). A row
  // tap opens it; scrim tap, drag-down, the close button, or Escape close it.
  const [sheetOpen, setSheetOpen] = useState(false);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  // Match the list column's height to the detail card (desktop only) so the two
  // sides line up and rows scroll away *under* the fixed footer. The detail card
  // height changes with copy length, so track it live.
  const detailRef = useRef<HTMLDivElement>(null);
  const [detailH, setDetailH] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onMq = () => setIsDesktop(mq.matches);
    onMq();
    mq.addEventListener('change', onMq);
    const el = detailRef.current;
    const ro = el ? new ResizeObserver(() => setDetailH(el.offsetHeight)) : null;
    if (el && ro) ro.observe(el);
    return () => {
      mq.removeEventListener('change', onMq);
      ro?.disconnect();
    };
  }, []);

  // While the mobile sheet is open: lock body scroll and let Escape close it.
  // Desktop never opens the sheet (it's md:hidden), so this is a no-op there.
  useEffect(() => {
    if (!sheetOpen || isDesktop) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSheet();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [sheetOpen, isDesktop, closeSheet]);

  return (
    <section
      id="galeri"
      aria-label="Galeri potongan sapi"
      className="bg-bone py-24 text-ink md:py-32"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, ease: EASE_OUT }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="mb-3 text-label font-medium uppercase tracking-[0.28em] text-burgundy">
            Koleksi
          </p>
          <h2 className="font-display text-h2 text-ink">Pilih Potongan Sapi Segar Anda</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ink/65 md:text-base">
            Steak, sliced, giling, sampai jeroan — semua grass-fed segar. Pilih
            dari daftar untuk melihat detail dan memesan.
          </p>
        </motion.div>

        {/* Framed wrapper — a thin border rings the whole gallery. Transparent
            fill so the list's edge fades still blend into the section. */}
        <div className="mt-12 rounded-3xl border border-burgundy/25 p-4 sm:p-5 md:mt-16 md:rounded-[32px] md:p-7 lg:p-9">
          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[0.95fr_1.05fr] md:gap-10">
          {/* LIST — desktop left column, full list on mobile. Scrolls inside a
              capped frame (~5 rows on mobile) with the scrollbar hidden; top/bottom
              fades hint there's more. Tapping a row opens the detail. */}
          <div
            className="order-2 flex flex-col gap-2.5 md:order-1 md:min-h-0"
            style={isDesktop && detailH ? { height: detailH } : undefined}
          >
            {/* TOP card — fixed header of the list frame */}
            <div className="flex shrink-0 items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-ink/[0.07]">
              <span className="text-label font-semibold uppercase tracking-[0.16em] text-burgundy">
                Daftar Potongan
              </span>
              <span className="rounded-full bg-bone px-2.5 py-1 text-label font-semibold tabular-nums text-ink/70 ring-1 ring-ink/[0.06]">
                {CUTS.length} jenis
              </span>
            </div>

            {/* SCROLL region — items scroll between the top & bottom cards.
                MOBILE: capped to ~5 rows (max-h-[30rem]). DESKTOP: capped to the
                detail card's height instead (md:h-full inside the sized column). */}
            <div className="relative min-h-0 flex-1">
              <ul
                aria-label="Daftar potongan"
                className="flex max-h-[30rem] flex-col gap-2.5 overflow-y-auto px-1.5 py-1 md:h-full md:max-h-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
            {CUTS.map((c, i) => {
              const selected = i === active;
              return (
                <li key={c.name}>
                  <button
                    type="button"
                    onClick={() => {
                      setActive(i);
                      if (!isDesktop) setSheetOpen(true); // mobile only: open the detail sheet
                    }}
                    aria-pressed={selected}
                    aria-current={selected ? 'true' : undefined}
                    className={`group relative flex w-full cursor-pointer items-center gap-4 overflow-hidden rounded-2xl p-2.5 pr-4 text-left ring-1 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy ${
                      selected
                        ? 'bg-white shadow-[0_14px_34px_-18px_rgba(29,20,15,0.5)] ring-burgundy/30'
                        : 'bg-white/55 ring-ink/[0.07] hover:bg-white hover:ring-ink/15'
                    }`}
                  >
                    {/* left accent bar — appears on the selected row */}
                    <span
                      aria-hidden="true"
                      className={`absolute inset-y-2 left-0 w-1 rounded-full bg-burgundy transition-opacity duration-200 ${
                        selected ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                    {/* Thumbnail — framed to match the detail look. */}
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-linear-to-b from-[#f3ecdf] to-[#e7dcc8] ring-1 ring-ink/[0.06]">
                      <Image src={c.img} alt="" fill sizes="64px" className="object-contain p-1.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`font-display text-lg leading-tight transition-colors duration-200 ${
                          selected ? 'text-burgundy' : 'text-ink'
                        }`}
                      >
                        {c.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-ink/55">{c.bestFor}</p>
                    </div>
                    <ChevronIcon
                      className={`transition-transform duration-200 ${
                        selected
                          ? 'translate-x-0 text-burgundy'
                          : 'text-ink/25 group-hover:translate-x-0.5 group-hover:text-ink/40'
                      }`}
                    />
                  </button>
                </li>
              );
            })}
              </ul>

              {/* top edge fade — hint there are more items above */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-linear-to-b from-bone to-transparent"
              />
              {/* bottom fade — dissolves rows as they sink into the footer card */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-bone to-transparent"
              />
            </div>

            {/* BOTTOM card — plain fixed footer; rows scroll away under it. A
                crisp hairline border (no shadow) makes the boundary firm. */}
            <div className="relative z-10 -mt-2 h-12 shrink-0 rounded-2xl border border-ink/15 bg-white" />
          </div>

          {/* DETAIL — desktop sticky panel on the right; crossfades as you pick
              rows. On mobile tapping a row opens the detail as a bottom sheet
              instead (rendered at the end of the section, md:hidden). */}
          <div
            ref={detailRef}
            className="hidden md:order-2 md:sticky md:top-6 md:block md:max-h-[calc(100dvh-3rem)] md:overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-live="polite"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={cut.name}
                initial={reduced ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: EASE_OUT }}
              >
                <CutDetailCard cut={cut} index={active} />
              </motion.div>
            </AnimatePresence>
          </div>
          </div>
        </div>
      </div>

      {/* MOBILE bottom sheet — the tapped row's detail slides up over a scrim.
          Dismiss by scrim tap, dragging the sheet down, the close button, or
          Escape. Hidden on desktop (md:hidden), where the sticky panel is used. */}
      <AnimatePresence>
        {sheetOpen && (
          <div
            className="fixed inset-0 z-[60] md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label={`Detail ${cut.name}`}
          >
            {/* scrim */}
            <motion.button
              type="button"
              aria-label="Tutup"
              onClick={closeSheet}
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduced ? undefined : { opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 h-full w-full bg-ink/60 backdrop-blur-sm"
            />

            {/* sheet */}
            <motion.div
              initial={reduced ? false : { y: '100%' }}
              animate={{ y: 0 }}
              exit={reduced ? undefined : { y: '100%' }}
              transition={{ type: 'spring', damping: 34, stiffness: 340 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 120 || info.velocity.y > 600) closeSheet();
              }}
              className="absolute inset-x-0 bottom-0 flex max-h-[92vh] flex-col rounded-t-[28px] bg-bone shadow-[0_-24px_60px_-24px_rgba(13,9,6,0.6)]"
            >
              {/* grab handle + close — the draggable header of the sheet */}
              <div className="relative flex shrink-0 items-center justify-center pb-1 pt-3">
                <span aria-hidden="true" className="h-1.5 w-11 rounded-full bg-ink/20" />
                <button
                  type="button"
                  onClick={closeSheet}
                  aria-label="Tutup"
                  className="absolute right-3 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-ink/5 text-ink/60 transition-colors hover:bg-ink/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy"
                >
                  <CloseIcon />
                </button>
              </div>

              {/* scrollable body — the shared detail card */}
              <div className="overflow-y-auto px-4 pb-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <CutDetailCard cut={cut} index={active} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

/**
 * The product detail card — framed image + price/copy + WhatsApp CTA.
 * Shared by the desktop sticky panel and the mobile bottom sheet, so both
 * surfaces stay identical. `index` drives the corner "NN / TT" badge.
 */
function CutDetailCard({ cut, index }: { cut: Cut; index: number }) {
  return (
    <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_28px_70px_-30px_rgba(29,20,15,0.5)] ring-1 ring-ink/[0.06]">
      {/* Framed image — matted on a warm cream, object-contain so a replacement
          photo of any size stays crisp and un-stretched. */}
      <div className="p-4 md:p-5">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-linear-to-b from-[#f3ecdf] to-[#e7dcc8] ring-1 ring-ink/[0.06] md:aspect-auto md:h-[clamp(220px,40vh,440px)]">
          <Image
            src={cut.img}
            alt={`Potongan ${cut.name} grass-fed segar`}
            fill
            sizes="(max-width: 767px) 90vw, 45vw"
            className="object-contain p-4"
          />
          {/* corner index badge */}
          <span className="absolute left-3 top-3 rounded-full bg-ink/75 px-3 py-1 text-label font-semibold tabular-nums text-bone backdrop-blur-sm">
            {String(index + 1).padStart(2, '0')} / {String(CUTS.length).padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="px-6 pb-6 md:px-7 md:pb-7">
        <h3 className="font-display text-h3 leading-tight text-ink">{cut.name}</h3>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-ink/45">
            {cut.weight}
          </span>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-ink/70 md:text-base">{cut.character}</p>

        <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-bone/70 px-4 py-3 ring-1 ring-ink/[0.05]">
          <span className="mt-px text-label font-semibold uppercase tracking-[0.14em] text-ember">
            Cocok untuk
          </span>
          <span className="text-sm font-medium text-ink/85">{cut.bestFor}</span>
        </div>

        <a
          href={waLink(`Halo Jagaterra, saya mau pesan ${cut.name} (${cut.weight}).`)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-full bg-burgundy px-7 text-sm font-semibold text-bone shadow-lg shadow-burgundy/25 transition-colors duration-200 hover:bg-[#5a070a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy"
        >
          <WhatsAppIcon />
          Pesan via WhatsApp
        </a>
      </div>
    </div>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-5 w-5 shrink-0 ${className ?? ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.4-3c-.3-.4 0-.5.2-.7l.4-.5c.1-.2.1-.3 0-.5-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2 0 1.3.9 2.5 1 2.7.1.2 1.8 2.8 4.4 3.9 2.6 1.1 2.6.7 3.1.7.5 0 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2 0-.1-.2-.2-.5-.3Z" />
    </svg>
  );
}
