// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { initializeUserData } from '@/lib/firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  initSession: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);

      // Reset session if user exists
      if (user) {
        window.localStorage.setItem('lastActivity', Date.now().toString());
      } else {
        window.localStorage.removeItem('lastActivity');
      }
    });

    return unsubscribe;
  }, []);

  const initSession = () => {
    window.localStorage.setItem('lastActivity', Date.now().toString());
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    await signInWithEmailAndPassword(auth, email, password);
    initSession();
  };

  const signUp = async (email: string, password: string, name: string): Promise<void> => {
    try {
      // Create the user in Firebase Auth
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's profile with their name
      await updateProfile(user, { displayName: name });
      
      // Initialize the user's document in Firestore
      await initializeUserData(user.uid, {
        email: user.email!,
        displayName: name,
      });

      initSession();
      setUser(user);
    } catch (error) {
      console.error('Error in signup:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    await signOut(auth);
    setUser(null);
    window.localStorage.removeItem('lastActivity');
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    logout,
    initSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};