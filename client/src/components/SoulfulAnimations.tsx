import { useEffect, useState } from "react";

export function BreathingOrb() {
  return (
    <div className="fixed top-4 right-4 z-10">
      <div className="w-4 h-4 bg-primary/30 rounded-full animate-pulse breathing-orb"></div>
    </div>
  );
}

export function ThinkingDelay({ isVisible, onComplete }: { isVisible: boolean; onComplete: () => void }) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);

    const timeout = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="flex items-center justify-center py-8 text-wisdom/60">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></div>
        <span className="ml-3 text-sm">Reflecting on your words{dots}</span>
      </div>
    </div>
  );
}

export function AffirmingMicrocopy({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center py-2 text-sm text-wisdom/70 font-light">
      {children}
    </div>
  );
}

export function GentleFadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timeout);
  }, [delay]);

  return (
    <div 
      className={`transition-all duration-1000 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {children}
    </div>
  );
}