// src/components/shared/Layout/AnimatedLayout.tsx
import { Outlet, useLocation } from 'react-router-dom';
import { cn } from "@/lib/utils";

interface AnimatedLayoutProps {
  children?: React.ReactNode; // Add children prop
  className?: string;
}

export function AnimatedLayout({ children, className }: AnimatedLayoutProps) {
  const location = useLocation();

  return (
    <div
      key={location.pathname}
      className={cn(
        "animate-in fade-in-50 duration-300",
        className
      )}
    >
      {children || <Outlet />} {/* Render children if provided, otherwise render Outlet */}
    </div>
  );
}