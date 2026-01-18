import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Users, Heart, Vote, Building2, CheckCircle2 } from "lucide-react";
import communityImage from "@/assets/community-aerial.jpg";

const features = [
  {
    icon: Users,
    title: "União de Pessoas",
    description:
      "Cooperados se unem com o mesmo objetivo: conquistar a casa própria de forma acessível.",
    color: "from-primary to-primary/80",
  },
  {
    icon: Heart,
    title: "Sem Fins Lucrativos",
    description:
      "Todo valor arrecadado é investido diretamente na construção dos imóveis.",
    color: "from-secondary to-secondary/80",
  },
  {
    icon: Vote,
    title: "Autogestão",
    description:
      "Os próprios cooperados participam das decisões importantes do projeto.",
    color: "from-accent to-accent/80",
  },
  {
    icon: Building2,
    title: "Construção Coletiva",
    description:
      "Economia de escala permite construir mais por menos.",
    color: "from-primary to-secondary",
  },
];

const principles = [
  "Adesão voluntária e livre",
  "Gestão democrática",
  "Participação econômica dos membros",
  "Autonomia e independência",
  "Compromisso com a comunidade",
];

export const AboutSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="como-funciona"
      className="py-24 relative overflow-hidden"
      ref={ref}
      style={{ background: "var(--gradient-warm)" }}
    >
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute top-10 left-10 w-40 h-40 rounded-full border-2 border-foreground" />
        <div className="absolute bottom-20 right-20 w-60 h-60 rounded-full border-2 border-foreground" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm uppercase tracking-wider mb-6">
            Entenda o Modelo
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-4 mb-6">
            O que é uma{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Cooperativa Habitacional?
            </span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            É uma associação de pessoas que se unem voluntariamente para
            construir moradias de qualidade com custos reduzidos, eliminando
            intermediários e lucros excessivos.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <div
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}
              >
                <feature.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Image + Principles */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative"
          >
            <div className="absolute -inset-3 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur-xl" />
            <img
              src={communityImage}
              alt="Comunidade habitacional"
              className="relative rounded-2xl shadow-lg w-full object-cover aspect-video"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="p-8 rounded-2xl bg-card border border-border shadow-sm"
          >
            <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-accent-foreground" />
              </span>
              Princípios do Cooperativismo
            </h3>
            <div className="space-y-3">
              {principles.map((principle, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <span className="text-foreground font-medium">{principle}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
