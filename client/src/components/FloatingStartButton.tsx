import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PenTool, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function FloatingStartButton() {
  const [isVisible, setIsVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setScrolled(scrollTop > 100);
      
      // Hide button when user scrolls down significantly
      if (scrollTop > window.innerHeight) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleStartJourney = () => {
    if (!isAuthenticated) {
      window.location.href = "/api/login";
    } else {
      // Scroll to journal editor or focus on it
      const journalEditor = document.querySelector('[data-component="journal-editor"]');
      if (journalEditor) {
        journalEditor.scrollIntoView({ behavior: 'smooth' });
        // Focus on the textarea if it exists
        const textarea = journalEditor.querySelector('textarea');
        if (textarea) {
          setTimeout(() => textarea.focus(), 500);
        }
      }
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ease-in-out ${
        scrolled 
          ? 'bottom-6 right-6 scale-90' 
          : 'bottom-8 right-8 scale-100'
      }`}
      style={{
        filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.15))',
      }}
    >
      <Button
        onClick={handleStartJourney}
        className={`group relative overflow-hidden transition-all duration-300 ease-in-out ${
          scrolled
            ? 'h-14 w-14 rounded-full px-0'
            : 'h-12 px-6 rounded-full'
        } bg-gradient-to-r from-serenity to-warmth hover:from-serenity/90 hover:to-warmth/90 text-white shadow-lg hover:shadow-xl border-0`}
      >
        <div className={`flex items-center space-x-2 transition-all duration-300 ${
          scrolled ? 'opacity-0 w-0' : 'opacity-100 w-auto'
        }`}>
          <PenTool className="w-4 h-4" />
          <span className="font-medium whitespace-nowrap">Start your journey</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
        
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
          scrolled ? 'opacity-100' : 'opacity-0'
        }`}>
          <PenTool className="w-5 h-5" />
        </div>

        {/* Ripple effect on hover */}
        <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 bg-white transition-opacity duration-300" />
        
        {/* Pulse animation */}
        <div className="absolute inset-0 rounded-full animate-pulse bg-gradient-to-r from-serenity/30 to-warmth/30" />
      </Button>
    </div>
  );
}