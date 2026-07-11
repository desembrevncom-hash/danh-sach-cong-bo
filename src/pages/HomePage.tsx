import { Link } from "react-router-dom";
import { SeoHead } from "@/features/seo/components/SeoHead";
import { HomeHeroBanner } from "@/features/public-layout/components/HomeHeroBanner";
import { HomeBrandCards } from "@/features/public-layout/components/HomeBrandCards";
import { HomeProcessSection } from "@/features/public-layout/components/HomeProcessSection";

export default function HomePage() {

  return (
    <>
      <SeoHead routePath="/" />
      
      <HomeHeroBanner />
      <HomeBrandCards />
      <HomeProcessSection />
    </>
  );
}
