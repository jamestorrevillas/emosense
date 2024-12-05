// src/components/shared/Layout/ReviewLayout.tsx
import { Outlet } from 'react-router-dom';

export const ReviewLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="h-full">
        <Outlet />
      </main>
    </div>
  );
};