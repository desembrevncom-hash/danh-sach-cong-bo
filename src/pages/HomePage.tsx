import { SeoHead } from "@/features/seo/components/SeoHead";
import { HomeHeroBanner } from "@/features/public-layout/components/HomeHeroBanner";
import { HomeProductGallery } from "@/features/public-layout/components/HomeProductGallery";

export default function HomePage() {

  return (
    <>
      <SeoHead routePath="/" />
      
      <HomeHeroBanner />
      <HomeProductGallery />
    </>
  );
}
