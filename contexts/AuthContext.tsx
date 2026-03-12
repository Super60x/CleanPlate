import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChange, login, signUp, logout, reauthenticate, deleteFirebaseAccount } from '../services/auth';
import { deleteAllUserData } from '../services/firestore';
import type { AppUser } from '../types';

interface AuthState {
  user: AppUser | null;
  isLoading: boolean;
  isInitialized: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapFirebaseUser(firebaseUser: FirebaseUser): AppUser {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email ?? '',
    displayName: firebaseUser.displayName ?? undefined,
    createdAt: new Date(firebaseUser.metadata.creationTime ?? Date.now()),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: false,
    isInitialized: false,
  });

  // Listen for auth state changes (fires on app start + login/logout)
  useEffect(() => {
    const unsubscribe = onAuthStateChange((firebaseUser) => {
      setState({
        user: firebaseUser ? mapFirebaseUser(firebaseUser) : null,
        isLoading: false,
        isInitialized: true,
      });
    });

    return unsubscribe;
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      await login(email, password);
      // Auth state listener will update user
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const handleSignUp = async (email: string, password: string, confirmPassword: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      await signUp(email, password, confirmPassword);
      // Auth state listener will update user
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const handleLogout = async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      await logout();
      // Auth state listener will update user
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const handleDeleteAccount = async (password: string) => {
    if (!state.user) throw new Error('No user signed in.');
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      await reauthenticate(password);
      await deleteAllUserData(state.user.id);
      await deleteFirebaseAccount();
      // onAuthStateChanged fires → sets user to null → redirects to login
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login: handleLogin,
        signUp: handleSignUp,
        logout: handleLogout,
        deleteAccount: handleDeleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
