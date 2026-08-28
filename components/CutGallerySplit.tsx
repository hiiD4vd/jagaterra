'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { waLink } from '@/lib/site';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import { EASE_OUT } from '@/lib/motion';
import CowMap from '@/components/CowMap';

// produk -> bagian sapi (mapping final yang kamu setujui)
// satu produk boleh masuk beberapa section (value = array)
const CUT2SECS: Record<string, string[]> = {
  'Wagyu Sirloin': ['sirloin'],
  'Sirloin': ['sirloin'],
  'Sliced Sirloin': ['sirloin'],
  'Ground Sirloin': ['sirloin'],
  'Rib Eye': ['rib'],
  'Sliced Rib Eye': ['rib'],
  'Tenderloin': ['tenderloin'],
  'Ground Tenderloin': ['tenderloin'],
  'Sliced Beef Shortplate': ['short-plate'],
  'Brisket (Sandung Lamur)': ['brisket'],
  'Beef Fat Organic (Daging Tetelan)': ['brisket', 'flank'],
  'Hati (Liver)': ['brisket'],
  'Paru (Lungs)': ['brisket'],
  'Shank Chunk (Sengkel)': ['shank'],
  'Tunjang (Kikil Kaki Sapi)': ['tunjang'],
  'Ground Beef no Fats': ['chuck'],
  'Ground Beef with Fats': ['chuck'],
  'Sliced Beef Tongue Organic': ['tongue'],
  'Sliced Veal': ['round'],
  'Ground Veal': ['round'],
  'Veal Meat': ['round'],
};

const SEC_LABEL: Record<string, string> = {
  chuck: 'Chuck (Bahu)',
  tongue: 'Lidah (Kepala)',
  round: 'Round (Paha Belakang)',
  rib: 'Rib (Iga)',
  sirloin: 'Sirloin',
  brisket: 'Brisket (Sandung Lamur)',
  'short-plate': 'Short Plate',
  flank: 'Flank',
  tenderloin: 'Tenderloin (Has Dalam)',
  shank: 'Shank (Sengkel)',
  tunjang: 'Tunjang (Kikil Kaki)',
};

type Cut = {
  name: string;
  img: string;
  weight: string;
  character: string;
  bestFor: string;
};

const CUTS: readonly Cut[] = [
  { name: 'Wagyu Sirloin', img: '/cuts/wagyu-sirloin (2).png', weight: '200 gr', character: 'Marbling wagyu yang padat; lemaknya meleleh jadi juicy dan gurih mewah.', bestFor: 'Steak premium, teppanyaki, yakiniku' },
  { name: 'Rib Eye', img: '/cuts/rib-eye (2).png', weight: '200 gr', character: 'Mata iga dengan marbling kaya, empuk dan penuh rasa saat dibakar.', bestFor: 'Steak, grill, BBQ' },
  { name: 'Sirloin', img: '/cuts/sirloin (2).png', weight: '200 gr / 250 gr', character: 'Marbling merata dengan tepi lemak yang harum saat dipanggang.', bestFor: 'Steak, grill, yakiniku' },
  { name: 'Tenderloin', img: '/cuts/tenderloin (2).png', weight: '180 gr / 200 gr', character: 'Potongan paling empuk, nyaris tanpa lemak, lembut di lidah.', bestFor: 'Steak medium-rare, sauté' },
  { name: 'Sliced Beef Shortplate', img: '/cuts/sliced-beef-shortplate (2).png', weight: '500 gr', character: 'Irisan tipis short plate berlemak, gurih dan cepat matang.', bestFor: 'Shabu-shabu, yakiniku, hotpot' },
  { name: 'Sliced Rib Eye', img: '/cuts/sliced-rib-eye (2).png', weight: '250 gr', character: 'Irisan rib eye marbling, lumer dan juicy saat diseduh kuah panas.', bestFor: 'Shabu-shabu, sukiyaki, hotpot' },
  { name: 'Sliced Beef Tongue Organic', img: '/cuts/sliced-beef-tongue-organic (2).png', weight: '250 gr', character: 'Irisan lidah sapi organik, kenyal lembut dengan rasa yang dalam.', bestFor: 'Yakiniku, gyutan, panggang' },
  { name: 'Sliced Sirloin', img: '/cuts/sliced-sirloin (2).png', weight: '250 gr / 500 gr', character: 'Irisan sirloin tipis, empuk dengan sedikit lemak yang manis.', bestFor: 'Shabu-shabu, yakiniku, tumis' },
  { name: 'Sliced Veal', img: '/cuts/sliced-veal (2).png', weight: '500 gr', character: 'Irisan daging sapi muda, halus dan ringan, cepat empuk.', bestFor: 'Shabu-shabu, tumis cepat, sup' },
  { name: 'Ground Beef no Fats', img: '/cuts/ground-beef-no-fats (2).png', weight: '500 gr', character: 'Giling tanpa lemak, merah bersih dan padat protein.', bestFor: 'Patty sehat, bolognese, isian' },
  { name: 'Ground Beef with Fats', img: '/cuts/ground-beef-with-fats (2).png', weight: '500 gr', character: 'Giling dengan lemak, juicy dan kaya rasa saat dimasak.', bestFor: 'Burger, meatball, saus daging' },
  { name: 'Ground Sirloin', img: '/cuts/ground-sirloin (2).png', weight: '500 gr', character: 'Sirloin giling bertekstur premium dengan rasa steak.', bestFor: 'Burger gourmet, kofta, meatloaf' },
  { name: 'Ground Tenderloin', img: '/cuts/ground-tenderloin (2).png', weight: '250 gr', character: 'Tenderloin giling, super lembut dan rendah lemak.', bestFor: 'Patty premium, isian, MPASI' },
  { name: 'Ground Veal', img: '/cuts/ground-veal (2).png', weight: '500 gr', character: 'Sapi muda giling, halus dan lembut dengan rasa ringan.', bestFor: 'Meatball, isian pasta, sup' },
  { name: 'Shank Chunk (Sengkel)', img: '/cuts/shank-chunk (2).png', weight: '500 gr', character: 'Sengkel berserat dengan urat, empuk luar biasa saat direbus lama.', bestFor: 'Rawon, semur, sup, rendang' },
  { name: 'Brisket (Sandung Lamur)', img: '/cuts/brisket (2).png', weight: '500 gr', character: 'Sandung lamur berlapis lemak, juicy dan kaya saat dimasak perlahan.', bestFor: 'Corned beef, brisket asap, soto, rawon' },
  { name: 'Veal Meat', img: '/cuts/veal-meat (2).png', weight: '500 gr', character: 'Daging sapi muda utuh, lembut dengan rasa yang bersih.', bestFor: 'Semur, sup, tumis, steak lembut' },
  { name: 'Tunjang (Kikil Kaki Sapi)', img: '/cuts/tunjang (2).png', weight: '500 gr', character: 'Kikil kaki sapi kaya kolagen, kenyal dan bergelatin.', bestFor: 'Soto, gulai kikil, sup kaki' },
  { name: 'Beef Fat Organic (Daging Tetelan)', img: '/cuts/beef-fat-organic (2).png', weight: '500 gr', character: 'Tetelan berdaging dan berlemak, gurih untuk kuah yang kaya.', bestFor: 'Soto, bakso urat, kaldu' },
  { name: 'Hati (Liver)', img: '/cuts/hati-liver (2).png', weight: '500 gr', character: 'Hati sapi padat zat besi, lembut dan gurih bila dimasak pas.', bestFor: 'Sambal goreng ati, tumis, sate' },
  { name: 'Paru (Lungs)', img: '/cuts/paru-lungs (2).png', weight: '500 gr', character: 'Paru sapi bertekstur ringan, empuk dan menyerap bumbu.', bestFor: 'Paru goreng, sambal, keripik paru' },
] as const;

function ProductCard({ cut, onSelect }: { cut: Cut; onSelect: () => void }) {
  const reduced = usePrefersReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={reduced ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      className="group flex w-full cursor-pointer flex-col text-left"
    >
      {/* Image — abu muda polos, biar foto daging jadi fokus */}
      <div
        className="relative w-full overflow-hidden"
        style={{ background: '#f2f2f2' }}
      >
        <Image
          src={cut.img}
          alt={cut.name}
          width={640}
          height={640}
          sizes="(max-width: 768px) 50vw, 25vw"
          className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </div>

      {/* Text — left-aligned */}
      <div className="mt-3">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink/45">Jagaterra</p>
        <p className="mt-1 font-display text-base leading-tight text-ink transition-colors duration-200 group-hover:text-burgundy md:text-lg">
          {cut.name}
        </p>
        <p className="mt-1 text-sm text-ink/55">{cut.weight}</p>
      </div>
    </motion.button>
  );
}

export default function CutGallerySplit() {
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const cut = CUTS[active];
  const [sheetOpen, setSheetOpen] = useState(false);
  const [secFilter, setSecFilter] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);   // container scroll produk
  const pinnedRef = useRef(false);                // sedang dalam mode pinned?
  const sectionRef = useRef<HTMLElement>(null);
  const closeSheet = useCallback(() => setSheetOpen(false), []);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onMq = () => setIsDesktop(mq.matches);
    onMq();
    mq.addEventListener('change', onMq);
    return () => mq.removeEventListener('change', onMq);
  }, []);

  useEffect(() => {
    if (!sheetOpen || isDesktop) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSheet(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [sheetOpen, isDesktop, closeSheet]);

  const visible = secFilter ? CUTS.filter((c) => (CUT2SECS[c.name] ?? []).includes(secFilter)) : CUTS;

  // ---- Pin scroll: produk wajib discroll sebelum lanjut ke bawah ----
  // PENTING: tinggi wrap dikunci dari grid PENUH (tanpa filter) supaya
  // hover/klik filter TIDAK mengubah tinggi halaman (anti lompat/kedap-kedip).
  const fullHRef = useRef(0);
  useEffect(() => {
    const section = sectionRef.current;
    const grid = gridRef.current;
    const wrap = document.getElementById('pin-wrap');
    if (!section || !grid || !wrap || !isDesktop) return;

    const setWrapHeight = () => {
      // hanya update patokan saat TIDAK ada filter (grid versi lengkap)
      if (!secFilter) fullHRef.current = Math.max(fullHRef.current, grid.scrollHeight);
      const base = fullHRef.current || grid.scrollHeight;
      wrap.style.height = base + window.innerHeight * 0.35 + 'px';
    };
    setWrapHeight();
    const ro = new ResizeObserver(setWrapHeight);
    ro.observe(grid);

    // saat filter berubah: tampilkan kartu dari atas
    grid.scrollTop = 0;

    // Wheel di atas grid (overflow:hidden) tidak diteruskan browser ke halaman.
    // Teruskan manual: akumulasi deltaY, apply dengan behavior 'auto' —
    // TANPA smooth: smooth membuat tiap wheel baru membatalkan animasi
    // sebelumnya (scroll terasa mati saat rapid-fire).
    let wheelAcc = 0;
    let wheelRaf = 0;
    const onWheel = (e: WheelEvent) => {
      // SELALU forward: grid overflow:hidden menelan wheel di fase apapun
      // (pinned maupun sudah lepas tapi kursor masih di atas grid).
      // Halaman = satu-satunya sumber scroll di desktop.
      e.preventDefault();
      wheelAcc += e.deltaY;
      if (wheelRaf) return;
      wheelRaf = requestAnimationFrame(() => {
        window.scrollBy({ top: wheelAcc, behavior: 'auto' });
        wheelAcc = 0;
        wheelRaf = 0;
      });
    };
    grid.addEventListener('wheel', onWheel, { passive: false });

    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      if (rect.top <= 0 && rect.bottom >= window.innerHeight) {
        // matikan smooth saat pinned: wheel rapid tidak boleh dibatalkan animasinya
        if (!pinnedRef.current) document.documentElement.style.scrollBehavior = 'auto';
        pinnedRef.current = true;
        const progress = Math.min(Math.max(-rect.top, 0), total);
        const max = grid.scrollHeight - grid.clientHeight;
        grid.scrollTop = (progress / Math.max(total, 1)) * max;
      } else {
        if (pinnedRef.current) document.documentElement.style.scrollBehavior = '';
        pinnedRef.current = false;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      grid.removeEventListener('wheel', onWheel);
      ro.disconnect();
    };
  }, [isDesktop, secFilter]);

  return (
    <section
      ref={sectionRef}
      id="galeri"
      aria-label="Galeri potongan sapi"
      className="bg-bone text-ink"
    >
      {/* Header — same as before */}
      {/* Header dipindah ke panel kiri (lihat bawah) */}

      {/* Split layout — desktop: sticky pinned; wrapper tinggi sesuai panjang grid */}
      <div className="md:relative" id="pin-wrap">
      <div
        className="mt-12 flex w-full flex-col px-0 md:mt-16 md:h-screen md:flex-row md:sticky md:top-0"
        id="pin-stage"
      >
        {/* LEFT: Header + cow map — fixed, full height, ~50% width */}
        <div
          className="relative flex h-[50vh] w-full shrink-0 flex-col md:h-full md:w-1/2"
        >
          {/* Header — sekarang di panel kiri */}
          <div className="px-6 pt-10 md:px-10 md:pt-14">
            <p className="mb-3 text-label font-medium uppercase tracking-[0.28em] text-burgundy">
              Koleksi
            </p>
            <h2 className="font-display text-h2 text-ink">Pilih Potongan Sapi Premium Anda</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-ink/65 md:text-base">
              Steak, sliced, giling, sampai jeroan — semua grass-fed premium. Pilih dari daftar untuk melihat detail dan memesan.
            </p>
          </div>

          {/* Cow map mengisi sisa tinggi */}
          <div className="relative min-h-0 flex-1">
            <CowMap
              onHover={setSecFilter}
              onLock={setSecFilter}
            />
            {/* featured label */}
            <div className="pointer-events-none absolute bottom-6 left-6 z-10 md:left-10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">Peta Potongan</p>
              <p className="mt-1 font-display text-2xl text-ink md:text-3xl">
                {secFilter ? SEC_LABEL[secFilter] : 'Seluruh Sapi'}
              </p>
              <p className="mt-1 text-sm text-ink/60">
                {secFilter ? `${visible.length} produk` : 'Klik bagian sapi untuk filter'}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: Product grid — scrollable, 2 columns, ~50% width */}
        <div className="relative flex-1 overflow-hidden md:w-1/2">
          {/* Scrollable grid container */}
          <div
            ref={gridRef}
            className="h-full overflow-y-auto px-6 py-8 md:overflow-hidden md:px-10"
            style={{ overscrollBehavior: 'contain' }}
          >
            <div className="grid grid-cols-2 gap-6 md:gap-8">
              {visible.map((c) => (
                <ProductCard
                  key={c.name}
                  cut={c}
                  onSelect={() => {
                    setActive(CUTS.indexOf(c));
                    if (!isDesktop) setSheetOpen(true);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Scroll fade hint */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-bone to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-bone to-transparent" />
        </div>
      </div>
      </div>

      {/* Mobile detail sheet — slides up on tap */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-ink/60 backdrop-blur-sm md:hidden"
              onClick={closeSheet}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-[28px] bg-bone shadow-[0_-24px_60px_-24px_rgba(13,9,6,0.6)] md:hidden"
            >
              <div className="flex items-center justify-center pt-3">
                <span className="h-1.5 w-11 rounded-full bg-ink/20" />
              </div>
              <div className="flex-1 overflow-y-auto px-6 pb-8 pt-4">
                <div
                  className="relative mx-auto w-full max-w-sm overflow-hidden"
                  style={{ background: '#f2f2f2' }}
                >
                  <Image src={cut.img} alt={cut.name} width={640} height={640} sizes="(max-width: 768px) 100vw, 400px" className="h-auto w-full" />
                </div>
                <div className="mt-6 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-burgundy">Jagaterra</p>
                  <h3 className="mt-2 font-display text-2xl text-ink">{cut.name}</h3>
                  <p className="mt-1 text-sm text-ink/55">{cut.weight}</p>
                  <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-ink/70">{cut.character}</p>
                  <p className="mt-3 text-xs text-ink/50">Cocok untuk: {cut.bestFor}</p>
                  <a
                    href={waLink(`Halo, saya mau pesan ${cut.name} ${cut.weight}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-burgundy px-7 text-sm font-semibold text-bone shadow-lg shadow-burgundy/25 transition-colors duration-200 hover:bg-[#5a070a]"
                  >
                    Pesan via WhatsApp
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ruang napas sebelum footer — mengikuti rhythm section (py-32 = 128px) */}
      <div className="h-40 md:h-48" aria-hidden="true" />
    </section>
  );
}
