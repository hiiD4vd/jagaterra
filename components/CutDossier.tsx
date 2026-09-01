'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { waLink } from '@/lib/site';
import { EASE_OUT, SPRING, DUR } from '@/lib/motion';

export type Cut = {
  name: string;
  img: string;
  character: string;
  bestFor: string;
};

/**
 * The "cut dossier" — a modal card opened by tapping a gallery card.
 * Rendered through a portal (see CutGallery) so it can never be clipped or
 * re-parented by the pinned, 3D-transformed gallery. Framer-only: mounts and
 * unmounts via AnimatePresence; GSAP's ring spin is untouched.
 *
 * NOT a shared-element (layoutId) morph on purpose: the source card lives in a
 * preserve-3d ring, and layout measurement through 3D transforms is unreliable.
 * A spring scale-from-center reads as "the card came forward" without the risk.
 */
export default function CutDossier({ cut, onClose }: { cut: Cut; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Scroll lock + focus management: focus moves to the close button on open;
  // Esc dismisses; Tab cycles inside the panel; scroll behind is frozen.
  useEffect(() => {
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: DUR.micro, ease: 'easeIn' } }}
      transition={{ duration: DUR.standard, ease: EASE_OUT }}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Detail potongan ${cut.name}`}
    >
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, y: 48, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 32, scale: 0.96, transition: { duration: DUR.micro, ease: 'easeIn' } }}
        transition={SPRING}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-t-3xl bg-bone text-ink shadow-2xl sm:rounded-3xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="relative aspect-[4/3] w-full">
          <Image
            src={cut.img}
            alt={`Potongan ${cut.name}`}
            fill
            sizes="(max-width: 640px) 100vw, 448px"
            className="object-cover"
          />
          {/* top scrim so the close button always reads over the photo */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-linear-to-b from-ink/50 to-transparent"
          />
        </div>

        <motion.button
          ref={closeRef}
          type="button"
          onClick={onClose}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          transition={SPRING}
          aria-label="Tutup detail"
          className="absolute right-3 top-3 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-ink/55 text-bone backdrop-blur-sm"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </motion.button>

        <div className="p-6 sm:p-7">
          <h3 className="font-display text-h3 text-ink">{cut.name}</h3>
          <p className="mt-2.5 text-sm leading-relaxed text-ink/70">{cut.character}</p>

          <p className="mt-5 text-label font-semibold uppercase text-ember">Cocok untuk</p>
          <p className="mt-1 text-sm text-ink/80">{cut.bestFor}</p>

          <motion.a
            href={waLink(`Halo Jagaterra, saya mau pesan ${cut.name}.`)}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={SPRING}
            className="mt-6 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-full bg-burgundy px-7 text-sm font-semibold text-bone shadow-lg"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4.5 w-4.5"
              fill="currentColor"
            >
              <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.4-3c-.3-.4 0-.5.2-.7l.4-.5c.1-.2.1-.3 0-.5-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2 0 1.3.9 2.5 1 2.7.1.2 1.8 2.8 4.4 3.9 2.6 1.1 2.6.7 3.1.7.5 0 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2 0-.1-.2-.2-.5-.3Z" />
            </svg>
            Pesan via WhatsApp
          </motion.a>
        </div>
      </motion.div>
    </motion.div>
  );
}
