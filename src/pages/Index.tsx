import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { AboutSection } from "@/components/AboutSection";
import { TimelineSection } from "@/components/TimelineSection";
import { SocialSection } from "@/components/SocialSection";
import { RulesSection } from "@/components/RulesSection";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <AboutSection />
      <TimelineSection />
      <SocialSection />
      <RulesSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;
