import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import {
  Wallet,
  Calendar,
  CheckCircle2,
  Building2,
} from "lucide-react";

const rules = [
  {
    icon: Wallet,
    title: "Mensalidade Acessível",
    highlight: "R$ 150/mês",
    color: "from-primary to-primary/80",
    items: [
      "Valor fixo durante o período",
      "Pagamento entre dia 5 útil e dia 20",
      "Pagamento via boleto ou PIX",
    ],
  },
  {
    icon: Calendar,
    title: "Prazo de Contemplação",
    highlight: "24 meses",
    color: "from-secondary to-secondary/80",
    items: [
      "24 meses após liberação do seu projeto",
      "Sem burocracia e financiamento pronto",
      "Acompanhamento em tempo real",
    ],
  },
  {
    icon: CheckCircle2,
    title: "Critérios de Participação",
    highlight: "Sem restrições",
    color: "from-accent to-accent/80",
    items: [
      "Sem consulta de SPC e SERASA",
      "Mesmo com restrição no nome, temos uma casa pra você",
      "Documentação simplificada",
    ],
  },
];

export const RulesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      className="py-24 relative overflow-hidden"
      ref={ref}
    >
      {/* Subtle Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted/50 via-background to-muted/30" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm uppercase tracking-wider mb-6">
            Condições Claras
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-4 mb-6">
            Regras de{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Participação
            </span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Conheça as condições para fazer parte da cooperativa e conquistar
            seu apartamento.
          </p>
        </motion.div>

        {/* Rules Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {rules.map((rule, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="relative group"
            >
              <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md h-full">
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${rule.color} flex items-center justify-center mb-5`}
                >
                  <rule.icon className="w-7 h-7 text-primary-foreground" />
                </div>

                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {rule.title}
                </h3>

                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${rule.color} text-primary-foreground font-semibold text-sm mb-5`}
                >
                  {rule.highlight}
                </div>

                <ul className="space-y-2.5">
                  {rule.items.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      className="flex items-start gap-2.5 text-muted-foreground text-sm"
                    >
                      <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Registration Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <div className="p-6 md:p-8 rounded-2xl bg-accent/10 border border-accent/20 text-center shadow-sm">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center mx-auto mb-5">
              <Building2 className="w-8 h-8 text-accent-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Cadastro através de Entidades Sociais
            </h3>
            <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
              O cadastro de cooperados é realizado exclusivamente através de
              entidades sociais do terceiro setor parceiras, garantindo que o
              benefício chegue a famílias que realmente necessitam.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
