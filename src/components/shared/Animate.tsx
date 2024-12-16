// src/components/shared/Animate.tsx
import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";

interface AnimateProps {
  children: React.ReactNode;
  className?: string;
}

export function Animate({ children, className }: AnimateProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay to ensure smooth animation
    const timeout = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div
      className={cn(
        "transition-all duration-300",
        isVisible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      {children}
    </div>
  );
}