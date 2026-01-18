import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Heart, UserCircle, Shield, Baby } from "lucide-react";
import familyImage from "@/assets/family-keys.jpg";

const priorities = [
  {
    icon: UserCircle,
    title: "Idosos",
    description:
      "Pessoas acima de 60 anos que buscam moradia digna e segura.",
    color: "from-primary to-primary/80",
  },
  {
    icon: Shield,
    title: "Mulheres com Medidas Protetivas",
    description:
      "Mulheres em situação de vulnerabilidade que necessitam de um recomeço seguro.",
    color: "from-secondary to-secondary/80",
  },
  {
    icon: Baby,
    title: "Mães de Crianças Atípicas",
    description:
      "Mães que cuidam de crianças com necessidades especiais.",
    color: "from-accent to-accent/80",
  },
];

export const SocialSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      className="py-24 relative overflow-hidden"
      ref={ref}
      style={{ background: "var(--gradient-warm)" }}
    >
      {/* Subtle Decorative Elements */}
      <div className="absolute top-20 right-10 w-40 h-40 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-20 left-10 w-60 h-60 rounded-full bg-secondary/5 blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Image */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="relative order-2 lg:order-1"
            >
              <div className="absolute -inset-3 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur-xl" />
              <img
                src={familyImage}
                alt="Família recebendo as chaves"
                className="relative rounded-2xl shadow-lg w-full object-cover aspect-square"
              />
              {/* Floating Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="absolute -bottom-4 -right-4 bg-gradient-to-r from-primary to-secondary p-5 rounded-xl shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <Heart className="w-8 h-8 text-primary-foreground" />
                  <div className="text-primary-foreground">
                    <div className="text-3xl font-bold">5%</div>
                    <div className="text-sm">das cotas</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Content */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="order-1 lg:order-2"
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm uppercase tracking-wider mb-6">
                Compromisso Social
              </span>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                Cotas para{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Público Especial
                </span>
              </h2>

              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Reservamos uma parcela dos apartamentos para pessoas em situação
                de vulnerabilidade, porque acreditamos que{" "}
                <strong className="text-foreground">
                  moradia digna é um direito de todos
                </strong>
                .
              </p>

              {/* Priority Cards */}
              <div className="space-y-4">
                {priorities.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 40 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.15 }}
                    className="group flex gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    <div
                      className={`w-14 h-14 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}
                    >
                      <item.icon className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Info Box */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="mt-8 p-5 rounded-xl bg-accent/10 border border-accent/20"
              >
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-accent" />
                  Prioridade para Quem Mais Precisa
                </h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  A seleção para as cotas especiais será feita em parceria com
                  entidades sociais do terceiro setor, garantindo que o benefício
                  chegue a quem realmente necessita.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
