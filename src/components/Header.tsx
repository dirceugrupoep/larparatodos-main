import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Home, Sparkles, Layers, Phone, Heart, HelpCircle, HandHeart, LogIn, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const navItems = [
  { label: "Início", href: "/", icon: Home },
  { label: "Como Funciona", href: "#como-funciona", icon: HelpCircle },
  { label: "Etapas", href: "#etapas", icon: Layers },
  { label: "Social", href: "#social", icon: HandHeart },
  { label: "Contato", href: "#contato", icon: Phone },
];

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuFlash, setMenuFlash] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLightPage, setIsLightPage] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    // Verificar se estamos em uma página com fundo claro
    const lightPages = ['/associations', '/association'];
    setIsLightPage(lightPages.some(page => location.pathname.startsWith(page)));
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Listen for slide change events from HeroSection
  useEffect(() => {
    const handleSlideChange = () => {
      setMenuFlash(true);
      setTimeout(() => setMenuFlash(false), 600);
    };
    window.addEventListener("heroSlideChange", handleSlideChange);
    return () => window.removeEventListener("heroSlideChange", handleSlideChange);
  }, []);

  const scrollToSection = (href: string) => {
    const currentPath = window.location.pathname;
    
    // Se não estiver na página inicial, navegar para lá primeiro
    if (currentPath !== '/') {
      navigate('/');
      // Aguardar a navegação e depois fazer scroll
      setTimeout(() => {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else {
      // Se já estiver na página inicial, fazer scroll direto
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
    setIsOpen(false);
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || isLightPage
          ? "bg-background/95 backdrop-blur-lg shadow-lg border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.button
            className="flex items-center cursor-pointer"
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate('/')}
          >
            <img 
              src={logo} 
              alt="Lar Para Todos" 
              className="h-16 object-contain"
            />
          </motion.button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item, index) => (
              <motion.button
                key={item.label}
                onClick={() => {
                  if (item.href === '/') {
                    navigate('/');
                  } else {
                    scrollToSection(item.href);
                  }
                }}
                animate={menuFlash ? { 
                  scale: [1, 1.1, 1],
                  opacity: [1, 0.5, 1]
                } : {}}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className={`flex items-center gap-2 font-semibold transition-colors ${
                  scrolled || isLightPage
                    ? "text-muted-foreground hover:text-primary"
                    : "text-background/80 hover:text-secondary"
                }`}
              >
                <item.icon className={`w-4 h-4 ${scrolled || isLightPage ? "text-primary" : "text-secondary"}`} />
                {item.label}
              </motion.button>
            ))}
            <motion.button
              onClick={() => {
                navigate('/associations');
                setIsOpen(false);
              }}
              className={`flex items-center gap-2 font-semibold transition-colors ${
                scrolled || isLightPage
                  ? "text-muted-foreground hover:text-primary"
                  : "text-background/80 hover:text-secondary"
              }`}
            >
              <Building2 className={`w-4 h-4 ${scrolled || isLightPage ? "text-primary" : "text-secondary"}`} />
              Associações
            </motion.button>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="font-semibold"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Painel
              </Button>
            ) : (
              <Button
                onClick={() => navigate('/login')}
                variant="outline"
                className="font-semibold"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </Button>
            )}
            <Button
              onClick={() => scrollToSection("#contato")}
              className="bg-gradient-to-r from-primary to-coral hover:opacity-90 transition-opacity font-bold shadow-lg"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Quero Participar
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`md:hidden p-2 ${scrolled ? "text-foreground" : "text-background"}`}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-b border-border shadow-lg"
          >
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    if (item.href === '/') {
                      navigate('/');
                      setIsOpen(false);
                    } else {
                      scrollToSection(item.href);
                    }
                  }}
                  className="flex items-center gap-3 text-foreground hover:text-primary transition-colors font-medium py-2"
                >
                  <item.icon className="w-5 h-5 text-primary" />
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => {
                  navigate('/associations');
                  setIsOpen(false);
                }}
                className="flex items-center gap-3 text-foreground hover:text-primary transition-colors font-medium py-2"
              >
                <Building2 className="w-5 h-5 text-primary" />
                Associações
              </button>
              {isLoggedIn ? (
                <Button
                  onClick={() => {
                    navigate('/dashboard');
                    setIsOpen(false);
                  }}
                  variant="outline"
                  className="mt-2 font-semibold"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Painel
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    navigate('/login');
                    setIsOpen(false);
                  }}
                  variant="outline"
                  className="mt-2 font-semibold"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Button>
              )}
              <Button
                onClick={() => scrollToSection("#contato")}
                className="mt-2 bg-gradient-to-r from-primary to-coral font-bold"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Quero Participar
              </Button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};