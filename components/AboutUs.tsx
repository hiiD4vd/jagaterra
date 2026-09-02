'use client';

/**
 * Brand story for Jagaterra as an online shop — SATU paragraf rata tengah.
 * Semua kalimat mengalir kontinu dalam satu <p>; 4 gambar nyempil inline
 * (inline-block) di dalam aliran kalimat, jadi jarak antar baris konsisten.
 */

function InlineImage({ src, alt, h = 78 }: { src: string; alt: string; h?: number }) {
  const responsiveHeight = `clamp(40px, 10vw, ${h}px)`;

  return (
    <span className="mx-[0.1em] inline-block align-middle sm:mx-[0.18em]">
      <span className="mr-[0.16em] text-[0.8em] leading-none sm:mr-[0.3em]">(</span>
      <span className="inline-block overflow-hidden align-middle" style={{ height: responsiveHeight }}>
        <img
          src={src}
          alt={alt}
          className="h-full w-auto max-w-none object-cover"
        />
      </span>
      <span className="ml-[0.16em] text-[0.8em] leading-none sm:ml-[0.3em]">)</span>
    </span>
  );
}

export default function AboutUs() {
  return (
    <section
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-8 py-24 text-bone md:px-6 md:py-32"
      style={{
        background: `
          radial-gradient(80% 55% at 50% 0%, rgba(230,105,105,0.5) 0%, rgba(230,105,105,0) 62%),
          radial-gradient(140% 100% at 50% 115%, #450606 0%, rgba(69,6,6,0) 55%),
          linear-gradient(172deg, #b81f1f 0%, #8e1212 38%, #610b0b 72%, #4a0707 100%)
        `,
      }}
    >
      <div
        className="w-full text-center text-xl font-normal lowercase leading-[1.8] tracking-tight sm:text-2xl sm:leading-[1.65] md:text-[2.25rem] md:leading-[1.55]"
        style={{ maxWidth: '60rem' }}
      >
        <p className="text-center">
          jagaterra{' '}
          <InlineImage src="/logo 2.png" alt="Logo Jagaterra" h={64} />{' '}
          adalah toko online daging sapi grass-fed premium. sapi kami
          diternak bebas di padang rumput{' '}
          <InlineImage src="/frames/frame_0025.jpg" alt="Sapi di padang rumput luas Goulburn Valley" />{' '}
          di goulburn valley, australia, tanpa hormon atau antibiotik. daging
          premium{' '}
          <InlineImage src="/cuts/sirloin (2).png" alt="Potongan daging sapi premium Jagaterra" />{' '}
          siap dipesan. setiap pesanan dikemas dalam kemasan vacuum-sealed{' '}
          <InlineImage src="/about/vacuum-sealed-beef.png" alt="Daging sapi dalam kemasan vacuum-sealed" />{' '}
          untuk menjaga kualitas.
        </p>
      </div>
    </section>
  );
}
