// src/components/shared/Layout/index.tsx
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const Layout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="fixed inset-y-16 inset-x-0">
        <Sidebar />
        <main className="md:pl-64 h-full overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};