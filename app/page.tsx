import AboutUs from '@/components/AboutUs';
import CutGallerySplit from '@/components/CutGallerySplit';
import FreshMeatMarket from '@/components/FreshMeatMarket';
import ScrollSequence from '@/components/ScrollSequence';
import SiteHeader from '@/components/SiteHeader';

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <ScrollSequence />
        <AboutUs />
        <CutGallerySplit />
        <FreshMeatMarket />
      </main>
    </>
  );
}
