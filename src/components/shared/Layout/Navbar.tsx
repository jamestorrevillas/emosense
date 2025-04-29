// src/components/shared/Layout/Navbar.tsx
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import Logo from "@/assets/images/logo.png";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<{ photoURL?: string } | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (doc) => {
      if (doc.exists()) {
        setUserData(doc.data());
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/signin');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-white">
      <div className="flex h-16 items-center px-4 gap-6 md:gap-8">
      <div className="flex items-center gap-2">
        <img 
          src={Logo}
          alt="EmoSense Logo" 
          className="h-8 w-auto"
        />
        <div className="flex flex-col">
          <Link to="/app" className="font-bold text-xl text-[#011BA1]">
            EmoSense
          </Link>
          <span className="text-xs text-slate-500">Emotion Analytics Platform</span>
        </div>
      </div>

        {user ? (
          <div className="ml-auto flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src={userData?.photoURL} />
                    <AvatarFallback className="bg-[#011BA1] text-white">
                      {getInitials(user.displayName || user.email || 'U')}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                    <p className="text-xs leading-none text-slate-500">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/app/settings" className="cursor-pointer w-full flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="ml-auto flex items-center space-x-4">
            <Button 
              variant="ghost" 
              asChild 
              className="text-slate-600 hover:text-[#011BA1]"
            >
              <Link to="/auth/signin">Sign In</Link>
            </Button>
            <Button asChild className="bg-[#011BA1] hover:bg-[#00008B]">
              <Link to="/auth/signup">Sign Up</Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};