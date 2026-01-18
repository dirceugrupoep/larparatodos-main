import { motion } from "framer-motion";
import { Home, Heart, Facebook, Instagram, Youtube, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden">
      {/* Top Wave Decoration */}
      <div className="h-2 bg-gradient-to-r from-primary via-coral to-secondary" />

      <div className="bg-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Logo */}
            <motion.div
              className="flex items-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <img 
                src={logo} 
                alt="Lar Para Todos" 
                className="h-20 object-contain"
              />
            </motion.div>

            {/* Social Links */}
            <motion.div
              className="flex items-center gap-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {[Facebook, Instagram, Youtube].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-12 h-12 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors"
                >
                  <Icon className="w-5 h-5 text-background" />
                </a>
              ))}
            </motion.div>

            {/* Center text and buttons */}
            <motion.div
              className="flex flex-col items-center gap-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <p className="text-background/80 text-center flex items-center gap-2 text-lg">
                Feito com{" "}
                <Heart className="w-5 h-5 text-coral fill-current animate-pulse" />{" "}
                para o povo brasileiro
              </p>
              <Link to="/association/register">
                <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                  <Building2 className="w-4 h-4 mr-2" />
                  Cadastrar Associação
                </Button>
              </Link>
            </motion.div>

            {/* Copyright */}
            <motion.p
              className="text-background/50 text-sm"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              © {currentYear} Lar Para Todos. Todos os direitos reservados.
            </motion.p>
          </div>
        </div>
      </div>
    </footer>
  );
};
