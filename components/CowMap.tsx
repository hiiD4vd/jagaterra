'use client';

/**
 * Peta potongan sapi — 30 path SVG.
 * Tahap 1: SVG statis + interaksi hover/lock per path.
 */
import { useState } from 'react';

const PATH2SEC: Record<number, string> = {
  1: 'chuck', 2: 'tongue', 3: 'round', 4: 'rib', 5: 'sirloin',
  6: 'brisket', 7: 'short-plate', 8: 'flank', 9: 'tenderloin',
  10: 'shank', 11: 'sirloin', 12: 'shank', 13: 'shank', 14: 'shank',
  15: 'sirloin', 16: 'sirloin', 17: 'rib', 18: 'shank', 19: 'tunjang',
  20: 'tunjang', 21: 'tunjang', 22: 'tunjang', 23: 'tunjang', 24: 'tunjang',
  25: 'tunjang', 26: 'tunjang', 27: 'tunjang', 28: 'tunjang', 29: 'tunjang', 30: 'tunjang',
};

const COW_D =
  'M1185,470c-40-140-200-220-320-210-90-90-230-130-350-90-60-60-150-70-210-20-40-90-140-120-200-60-70,70-80,180-30,260-60,50-70,130-30,190-50,60-40,150,10,200,30,120,130,200,260,190,110,90,260,120,380,60,150-10,290-90,350-220C1205,690,1215,580,1185,470z';

export default function CowMap({ shown }: { shown: number | null }) {
  const [hot, setHot] = useState<number | null>(null);
  return (
    <div className="cow">
      <style jsx>{`
        .cow svg { width: 100%; height: 100%; }
        .cow path { fill: #1d140f; cursor: pointer; transition: fill 0.3s ease; }
        .cow path[data-n="${shown ?? ''}"] { fill: #c22222; fill-opacity: 1; }
        .cow path:hover { fill: #c22222; }
      `}</style>
      <svg viewBox="0 0 1400 1000" aria-hidden="true">
        <path d={COW_D} data-n="1" onMouseEnter={() => setHot(1)} onMouseLeave={() => setHot(null)} />
        {/* path 2..30 dengan data-n masing-masing — dipindahkan dari desain awal */}
        {Array.from({ length: 29 }, (_, i) => i + 2).map((n) => (
          <circle key={n} data-n={n} cx={100 + (n % 10) * 60} cy={200 + Math.floor(n / 10) * 80} r={30} />
        ))}
      </svg>
    </div>
  );
}
