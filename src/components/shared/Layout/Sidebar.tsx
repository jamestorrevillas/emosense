// src/components/shared/Layout/Sidebar.tsx
import { Link, useLocation } from 'react-router-dom';
import { Folder, Home, Settings, FlaskConical, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

type NavigationItem = {
  name: string;
  href: string;
  icon: React.ElementType;
};

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/app/dashboard', icon: Home },
  { name: 'Projects', href: '/app/projects', icon: Folder },
  { name: 'AudienceAI', href: '/app/audienceai', icon: Users },
  { name: 'Playground', href: '/app/playground', icon: FlaskConical },
  { name: 'Settings', href: '/app/settings', icon: Settings },
];

export const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  return (
    <aside className="fixed top-16 left-0 bottom-0 hidden md:flex flex-col w-64 border-r bg-white">
      <nav className="flex-1 space-y-2 p-4">
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors",
              location.pathname === item.href 
                ? "bg-[#011BA1] text-white" 
                : "text-slate-600 hover:bg-accent hover:text-[#011BA1]"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t bg-slate-50">
        <div className="px-4 py-3">
          <div className="text-sm font-medium text-slate-700">
            {user.displayName || 'User'}
          </div>
          <div className="text-xs text-slate-500">{user.email}</div>
        </div>
      </div>
    </aside>
  );
};