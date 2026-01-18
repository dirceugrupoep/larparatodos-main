import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import {
  MapPin,
  Calculator,
  Mountain,
  PenTool,
  Wrench,
  Zap,
  Droplets,
  Truck,
  HardHat,
  Search,
  Key,
  ArrowRight,
} from "lucide-react";

const phases = [
  {
    phase: "Fase 1",
    title: "Planejamento",
    gradient: "from-primary to-primary/80",
    bgGradient: "from-primary/15 to-primary/5",
    items: [
      {
        icon: MapPin,
        title: "Escolha do Terreno",
        description: "Análise de localização e infraestrutura urbana.",
      },
      {
        icon: Calculator,
        title: "Estudo de Viabilidade",
        description: "Análise técnica e financeira do projeto.",
      },
      {
        icon: Mountain,
        title: "Topografia",
        description: "Levantamento completo por profissionais.",
      },
    ],
  },
  {
    phase: "Fase 2",
    title: "Projetos",
    gradient: "from-secondary to-secondary/80",
    bgGradient: "from-secondary/15 to-secondary/5",
    items: [
      {
        icon: PenTool,
        title: "Projeto Arquitetônico",
        description: "Planta baixa, fachadas e layout.",
      },
      {
        icon: Wrench,
        title: "Projeto Estrutural",
        description: "Fundações, pilares, vigas e lajes.",
      },
      {
        icon: Zap,
        title: "Projeto Elétrico",
        description: "Instalações elétricas completas.",
      },
      {
        icon: Droplets,
        title: "Projeto Hidráulico",
        description: "Água, esgoto e águas pluviais.",
      },
    ],
  },
  {
    phase: "Fase 3",
    title: "Execução",
    gradient: "from-accent to-accent/80",
    bgGradient: "from-accent/15 to-accent/5",
    items: [
      {
        icon: Truck,
        title: "Terraplanagem",
        description: "Preparação e nivelamento do terreno.",
      },
      {
        icon: HardHat,
        title: "Construtora",
        description: "Execução com equipe qualificada.",
      },
      {
        icon: Search,
        title: "Fiscalização",
        description: "Acompanhamento de qualidade.",
      },
      {
        icon: Key,
        title: "Entrega das Chaves",
        description: "Realização do sonho.",
      },
    ],
  },
];

export const TimelineSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="etapas"
      className="py-24 relative overflow-hidden"
      ref={ref}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-foreground" />
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/20 text-secondary font-medium text-sm uppercase tracking-wider mb-6">
            Processo Transparente
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-background mt-4 mb-6">
            Fluxo de{" "}
            <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
              Construção
            </span>
          </h2>
          <p className="text-lg text-background/70 leading-relaxed">
            Conheça cada etapa do processo, desde a escolha do terreno até a
            entrega das chaves.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="space-y-6">
          {phases.map((phase, phaseIndex) => (
            <motion.div
              key={phaseIndex}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: phaseIndex * 0.2 }}
              className={`p-6 md:p-8 rounded-2xl bg-gradient-to-br ${phase.bgGradient} border border-background/10`}
            >
              {/* Phase Header */}
              <div className="flex items-center gap-4 mb-6">
                <div
                  className={`px-5 py-2.5 rounded-xl bg-gradient-to-r ${phase.gradient} text-primary-foreground font-semibold`}
                >
                  {phase.phase}
                </div>
                <h3 className="text-2xl font-semibold text-background">
                  {phase.title}
                </h3>
                <ArrowRight className="w-5 h-5 text-background/50 hidden md:block" />
              </div>

              {/* Phase Items Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {phase.items.map((item, itemIndex) => (
                  <motion.div
                    key={itemIndex}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{
                      duration: 0.4,
                      delay: phaseIndex * 0.2 + itemIndex * 0.1,
                    }}
                    className="group p-5 rounded-xl bg-background/5 backdrop-blur-sm border border-background/10 hover:bg-background/10 transition-all duration-300"
                  >
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-br ${phase.gradient} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}
                    >
                      <item.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h4 className="text-base font-semibold text-background mb-1">
                      {item.title}
                    </h4>
                    <p className="text-sm text-background/60">
                      {item.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
