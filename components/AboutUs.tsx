'use client';

/**
 * Brand story Jagaterra — satu paragraf rata tengah.
 * Tahap 2: copy final lengkap (brand story grass-fed premium).
 */
export default function AboutUs() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bone px-6 py-24 text-ink md:px-6 md:py-32">
      <div
        className="w-full text-center text-xl font-normal lowercase leading-[1.55] tracking-tight sm:text-2xl md:text-[2.25rem]"
        style={{ maxWidth: '60rem' }}
      >
        <p className="text-center">
          jagaterra adalah toko online daging sapi grass-fed premium. sapi kami
          diternak bebas di padang rumput di goulburn valley, australia, tanpa
          hormon atau antibiotik. daging premium siap dipesan. setiap pesanan
          dikemas dalam kemasan vacuum-sealed untuk menjaga kualitas. rantai
          dingin membuat pesanan tetap segar hingga tiba.
        </p>
      </div>
    </section>
  );
}
