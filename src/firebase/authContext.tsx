import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
} from 'firebase/auth';
import { auth } from './config';

export function formatAuthError(err: any): string {
  const code = err?.code || '';
  const message = err?.message || String(err || '');

  if (code === 'auth/popup-closed-by-user') {
    return 'تم إغلاق نافذة Google قبل اختيار الحساب.';
  }

  if (code === 'auth/popup-blocked') {
    return 'المتصفح حظر نافذة Google. اسمح بالنوافذ المنبثقة ثم حاول مرة أخرى.';
  }

  if (code === 'auth/cancelled-popup-request') {
    return 'هناك نافذة تسجيل دخول Google مفتوحة بالفعل.';
  }

  if (code === 'auth/network-request-failed') {
    return 'تعذر الاتصال بخوادم Google. تحقق من الإنترنت.';
  }

  if (code === 'auth/unauthorized-domain') {
    return 'هذا النطاق غير مضاف إلى Authorized Domains في Firebase.';
  }

  if (code === 'auth/operation-not-allowed') {
    return 'تسجيل الدخول بواسطة Google غير مفعّل في Firebase.';
  }

  if (code === 'auth/account-exists-with-different-credential') {
    return 'يوجد حساب بنفس البريد باستخدام طريقة دخول أخرى.';
  }

  return message || 'فشل تسجيل الدخول بحساب Google.';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  getIdToken: () => Promise<string>;
  signInWithGoogle: () => Promise<{ user: User; accessToken?: string }>;
  signInAndLinkGoogle: () => Promise<{ user: User; accessToken?: string }>;
  relinkGoogle: () => Promise<{ user: User; accessToken?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getIdToken = async (): Promise<string> => {
    if (!auth.currentUser) {
      throw new Error('يرجى تسجيل الدخول بحساب Google أولاً');
    }

    return auth.currentUser.getIdToken();
  };

  const createGoogleProvider = () => {
    const provider = new GoogleAuthProvider();

    provider.setCustomParameters({
      prompt: 'select_account',
    });

    return provider;
  };

  const signInWithGoogle = async () => {
    const provider = createGoogleProvider();

    const result = await signInWithPopup(auth, provider);

    setUser(result.user);

    // مهم:
    // نستخدم Firebase ID Token للمصادقة مع السيرفر،
    // وليس Google OAuth access token كأنه مفتاح Gemini.
    const idToken = await result.user.getIdToken();

    return {
      user: result.user,
      accessToken: idToken,
    };
  };

  const signInAndLinkGoogle = async () => {
    return signInWithGoogle();
  };

  const relinkGoogle = async () => {
    return signInWithGoogle();
  };

  const signOut = async () => {
    await fbSignOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        getIdToken,
        signInWithGoogle,
        signInAndLinkGoogle,
        relinkGoogle,
        signOut,
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
