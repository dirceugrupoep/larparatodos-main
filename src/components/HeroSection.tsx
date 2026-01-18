import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Shield, Users, Heart, Home, Sparkles, ChevronLeft, ChevronRight, Wallet, Clock, CheckCircle2, HandHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-families.jpg";
import communityImage from "@/assets/community-aerial.jpg";
import familyKeysImage from "@/assets/family-keys.jpg";

const slides = [
  {
    id: 1,
    badge: "Projeto Social de Habitação",
    title: "Seu sonho da",
    highlight: "casa própria",
    titleEnd: "começa aqui",
    subtitle: "Cooperativa habitacional com mensalidades que cabem no seu bolso.",
    subtitleHighlight: "Juntos, construímos o futuro.",
    image: heroImage,
    rightContent: {
      type: "price",
      value: "150",
      label: "A partir de apenas",
      suffix: "/mês",
      badges: ["Sem consulta SPC/SERASA", "Mesmo com restrição", "Sem fiador"],
    },
  },
  {
    id: 2,
    badge: "Como Funciona?",
    title: "Você paga",
    highlight: "mensalidades",
    titleEnd: "e nós construímos",
    subtitle: "É simples: você contribui todo mês e a cooperativa constrói sua casa.",
    subtitleHighlight: "Sem burocracia. Financiamento pronto.",
    image: communityImage,
    rightContent: {
      type: "steps",
      items: [
        { icon: Wallet, text: "Pague mensalidades entre dia 5 útil e dia 20" },
        { icon: Clock, text: "24 meses após liberação do seu projeto" },
        { icon: Home, text: "Receba sua casa pronta" },
      ],
    },
  },
  {
    id: 3,
    badge: "Por que escolher a Cooperativa?",
    title: "Aqui você é",
    highlight: "dono",
    titleEnd: ", não cliente",
    subtitle: "Na cooperativa, todos são donos. Você participa das decisões e fiscaliza tudo.",
    subtitleHighlight: "100% transparência garantida.",
    image: familyKeysImage,
    rightContent: {
      type: "benefits",
      items: [
        { icon: Shield, text: "Gestão transparente" },
        { icon: Users, text: "Você decide junto" },
        { icon: Heart, text: "Sem fins lucrativos" },
        { icon: CheckCircle2, text: "Fiscalização coletiva" },
      ],
    },
  },
  {
    id: 4,
    badge: "Compromisso Social",
    title: "5% das vagas para",
    highlight: "quem mais precisa",
    titleEnd: "",
    subtitle: "Idosos, pessoas com deficiência e mães solo têm prioridade especial.",
    subtitleHighlight: "Porque moradia é direito de todos.",
    image: heroImage,
    rightContent: {
      type: "priority",
      items: [
        { icon: HandHeart, text: "Idosos acima de 60 anos" },
        { icon: HandHeart, text: "Pessoas com deficiência" },
        { icon: HandHeart, text: "Mães chefes de família" },
      ],
    },
  },
];

export const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    window.dispatchEvent(new CustomEvent("heroSlideChange"));
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    window.dispatchEvent(new CustomEvent("heroSlideChange"));
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  const scrollToSection = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const slide = slides[currentSlide];

  const renderRightContent = () => {
    const content = slide.rightContent;

    if (content.type === "price") {
      return (
        <motion.div
          key={`price-${slide.id}`}
          initial={{ opacity: 0, x: 50, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -50, scale: 0.9 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative"
        >
          <div className="absolute -inset-2 bg-gradient-to-r from-secondary via-primary to-secondary rounded-2xl blur-lg opacity-40" />
          <div className="relative bg-background/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-secondary/20">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-secondary" />
              <span className="text-muted-foreground font-medium">{content.label}</span>
            </div>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-2xl font-bold text-foreground">R$</span>
              <span className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {content.value}
              </span>
              <span className="text-2xl font-bold text-foreground">{content.suffix}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {content.badges?.map((badge, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-secondary/20 to-primary/20 text-foreground text-sm font-medium"
                >
                  <Sparkles className="w-3.5 h-3.5 text-secondary" />
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      );
    }

    if (content.type === "steps" || content.type === "benefits" || content.type === "priority") {
      return (
        <motion.div
          key={`list-${slide.id}`}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          {content.items?.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
              className="flex items-center gap-4 bg-background/90 backdrop-blur-sm rounded-xl p-5 shadow-lg border border-secondary/20 group hover:bg-background transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <item.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-foreground font-semibold text-lg">{item.text}</span>
              {content.type === "steps" && (
                <div className="ml-auto flex items-center justify-center w-8 h-8 rounded-full bg-secondary/20 text-secondary font-bold">
                  {i + 1}
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      );
    }

    return null;
  };

  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Background Image with Overlay */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          <img
            src={slide.image}
            alt="Famílias felizes em suas casas"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/95 via-foreground/80 to-foreground/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Decorative Elements */}
      <motion.div
        className="absolute top-32 right-20 w-32 h-32 rounded-full bg-secondary/25 blur-3xl"
        animate={{ y: [0, -20, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-40 left-20 w-48 h-48 rounded-full bg-primary/20 blur-3xl"
        animate={{ y: [0, 20, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute top-1/3 right-1/4 hidden lg:block"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <Sparkles className="w-6 h-6 text-secondary/30" />
      </motion.div>
      <motion.div
        className="absolute bottom-1/3 left-1/4 hidden lg:block"
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      >
        <Sparkles className="w-8 h-8 text-primary/25" />
      </motion.div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-secondary/90 text-secondary-foreground mb-8 shadow-lg">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-semibold tracking-wide">{slide.badge}</span>
                </div>

                {/* Main Heading */}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                  <span className="text-background">{slide.title}</span>{" "}
                  <span className="bg-gradient-to-r from-secondary via-primary to-primary bg-clip-text text-transparent">
                    {slide.highlight}
                  </span>{" "}
                  <span className="text-background">{slide.titleEnd}</span>
                </h1>

                {/* Subtitle */}
                <p className="text-xl md:text-2xl text-background/85 max-w-xl mb-8 font-normal leading-relaxed">
                  {slide.subtitle}
                  <span className="text-secondary font-semibold block mt-2">{slide.subtitleHighlight}</span>
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mb-10">
                  <Button
                    size="lg"
                    onClick={() => scrollToSection("#contato")}
                    className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all text-lg px-8 py-6 font-semibold shadow-xl group"
                  >
                    <span>Quero Participar</span>
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => scrollToSection("#como-funciona")}
                    className="text-lg px-8 py-6 bg-background/10 backdrop-blur-sm text-background border-background/40 hover:bg-background/20 font-medium"
                  >
                    Saiba Mais
                  </Button>
                </div>

                {/* Trust Badges */}
                <div className="flex flex-wrap gap-3">
                  {[
                    { icon: Shield, label: "100% Transparente" },
                    { icon: Users, label: "Gestão Democrática" },
                    { icon: Heart, label: "Sem Fins Lucrativos" },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-background/10 backdrop-blur-sm border border-background/20"
                    >
                      <item.icon className="w-4 h-4 text-secondary" />
                      <span className="text-background/90 font-medium text-sm">{item.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Content */}
          <div className="hidden lg:block">
            <AnimatePresence mode="wait">
              {renderRightContent()}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Slide Navigation */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-6">
        <button
          onClick={prevSlide}
          className="w-10 h-10 rounded-full bg-background/20 backdrop-blur-sm border border-background/30 flex items-center justify-center text-background hover:bg-background/30 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-8 bg-secondary"
                  : "w-2 bg-background/40 hover:bg-background/60"
              }`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          className="w-10 h-10 rounded-full bg-background/20 backdrop-blur-sm border border-background/30 flex items-center justify-center text-background hover:bg-background/30 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-24 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-background/40 flex justify-center pt-2">
          <div className="w-1.5 h-3 rounded-full bg-secondary" />
        </div>
      </motion.div>
    </section>
  );
};
