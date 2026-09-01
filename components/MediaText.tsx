'use client';

import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { EASE_OUT } from '@/lib/motion';

export type MediaTextMediaType = 'image' | 'video';
export type MediaTextTrigger = 'hover' | 'inView' | 'manual';

export type MediaTextHandle = {
  animate: () => void;
  reset: () => void;
};

type MediaTextProps = {
  firstText: string;
  secondText: string;
  mediaUrl: string;
  mediaType?: MediaTextMediaType;
  alt?: string;
  fallbackUrl?: string;
  triggerType?: MediaTextTrigger;
  className?: string;
  mediaContainerClassName?: string;
  mediaClassName?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
};

/**
 * React adaptation of Inspira UI's MediaText for Next.js.
 *
 * The closed text is the only element that participates in document layout.
 * The opened text is painted above that same row, so it never reflows the
 * rows before or after it.
 */
const MediaText = forwardRef<MediaTextHandle, MediaTextProps>(function MediaText(
  {
    firstText,
    secondText,
    mediaUrl,
    mediaType = 'image',
    alt,
    fallbackUrl,
    triggerType = 'hover',
    className = '',
    mediaContainerClassName = '',
    mediaClassName = '',
    autoPlay = true,
    loop = true,
    muted = true,
    playsInline = true,
  },
  ref,
) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const [hovered, setHovered] = useState(false);
  const [manuallyActive, setManuallyActive] = useState(false);
  const inView = useInView(rootRef, { once: true, amount: 0.5 });
  const reducedMotion = useReducedMotion();

  useImperativeHandle(ref, () => ({
    animate: () => setManuallyActive(true),
    reset: () => setManuallyActive(false),
  }));

  const active =
    !reducedMotion &&
    (triggerType === 'hover' ? hovered : triggerType === 'inView' ? inView : manuallyActive);

  const renderMedia = () =>
    mediaType === 'video' ? (
      <video
        src={mediaUrl}
        poster={fallbackUrl}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        playsInline={playsInline}
        className={`block h-full w-auto max-w-none object-cover ${mediaClassName}`}
      />
    ) : (
      <img
        src={mediaUrl}
        alt=""
        className={`block h-full w-auto max-w-none object-cover ${mediaClassName}`}
      />
    );

  return (
    <span
      ref={rootRef}
      onPointerEnter={() => triggerType === 'hover' && setHovered(true)}
      onPointerLeave={() => triggerType === 'hover' && setHovered(false)}
      className={`relative inline-block align-middle ${className}`}
    >
      {/* Invisible expanded copy reserves the exact height needed on hover. */}
      <span aria-hidden="true" className="invisible block text-center">
        {firstText}{' '}
        <span className="mx-[0.08em] align-middle">(</span>
        <span className={`inline-block overflow-hidden align-middle ${mediaContainerClassName}`}>
          {renderMedia()}
        </span>
        <span className="mx-[0.08em] align-middle">)</span>{' '}
        {secondText}
      </span>

      <motion.span
        initial={false}
        animate={{ opacity: active ? 0 : 1 }}
        transition={{ duration: 0.16, ease: EASE_OUT }}
        className="absolute inset-x-0 top-0 block text-center"
      >
        {firstText} <span aria-hidden="true">()</span> {secondText}
      </motion.span>

      <motion.span
        aria-hidden="true"
        initial={false}
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ duration: 0.16, ease: EASE_OUT }}
        className="pointer-events-none absolute inset-x-0 top-0 z-10 block text-center"
      >
        {firstText}{' '}
        <span className="mx-[0.08em] align-middle">(</span>
        <motion.span
          initial={false}
          animate={active ? { width: 'auto', opacity: 1 } : { width: 0, opacity: 0 }}
          transition={{ duration: 0.28, ease: EASE_OUT }}
          className={`inline-block overflow-hidden align-middle ${mediaContainerClassName}`}
        >
          {renderMedia()}
        </motion.span>
        <span className="mx-[0.08em] align-middle">)</span>{' '}
        {secondText}
      </motion.span>
      <span className="sr-only">{alt ?? `${firstText} ${secondText}`}</span>
    </span>
  );
});

MediaText.displayName = 'MediaText';

export default MediaText;
