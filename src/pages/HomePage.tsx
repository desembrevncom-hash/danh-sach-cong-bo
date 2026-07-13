import { Link } from "react-router-dom";
import { SeoHead } from "@/features/seo/components/SeoHead";
import { PublicLayout } from "@/features/public-layout/components/PublicLayout";
import { HomeHeroBanner } from "@/features/public-layout/components/HomeHeroBanner";
import { HomeBrandCards } from "@/features/public-layout/components/HomeBrandCards";
import { HomeProcessSection } from "@/features/public-layout/components/HomeProcessSection";

export default function HomePage() {

  return (
    <PublicLayout>
      <SeoHead routePath="/" />
      
      <HomeHeroBanner />
      <HomeBrandCards />
      <HomeProcessSection />
    </PublicLayout>
  );
}
