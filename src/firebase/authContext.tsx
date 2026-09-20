import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
} from 'firebase/auth';
import { auth } from './config';

/**
 * Translates Firebase & Google Auth error codes into clear, user-friendly Arabic messages.
 */
export function formatAuthError(err: any): string {
  const code = err?.code || '';
  const message = err?.message || String(err || '');

  if (code === 'auth/popup-closed-by-user') {
    return 'تم إغلاق نافذة تسجيل الدخول من Google قبل اختيار الحساب.';
  }
  if (code === 'auth/popup-blocked') {
    return 'قام المتصفح بحظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة لـ Google في متصفحك.';
  }
  if (code === 'auth/cancelled-popup-request') {
    return 'تم إلغاء طلب تسجيل الدخول لوجود نافذة تسجيل دخول أخرى مفتوحة بالفعل.';
  }
  if (code === 'auth/network-request-failed') {
    return 'تعذر الاتصال بخوادم Google. يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'هذا النطاق غير مصرح به في إعدادات Firebase Authentication (Authorized Domains).';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'تسجيل الدخول عبر Google غير مفعّل في Firebase Authentication Console.';
  }
  if (code === 'auth/account-exists-with-different-credential') {
    return 'يوجد حساب مسجل بالفعل ببريد إلكتروني مطابق عبر وسيلة دخول أخرى.';
  }
  if (message.includes('403') || message.includes('access_denied')) {
    return 'تم رفض الوصول (403): تأكد من صحة حساب Google المختار.';
  }

  return message || 'فشل تسجيل الدخول بحساب Google. يرجى إعادة المحاولة.';
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
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getIdToken = async (): Promise<string> => {
    if (!user) {
      throw new Error('يرجى تسجيل الدخول بحساب Google أولاً');
    }
    return user.getIdToken();
  };

  /**
   * Standard Google Auth Provider:
   * Uses only standard identity scopes (openid, profile, email).
   * Does NOT request sensitive or restricted scopes (like cloud-platform)
   * which cause Google 403 access_denied / unverified app blocks.
   */
  const createGoogleProvider = () => {
    const provider = new GoogleAuthProvider();
    // Prompts user to choose an account on their device
    provider.setCustomParameters({ prompt: 'select_account' });
    return provider;
  };

  const signInWithGoogle = async (): Promise<{ user: User; accessToken?: string }> => {
    const provider = createGoogleProvider();
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    // Access token for Google identity APIs, or fallback to Firebase idToken
    const accessToken = credential?.accessToken || (await result.user.getIdToken());
    setUser(result.user);
    return { user: result.user, accessToken };
  };

  const signInAndLinkGoogle = async (): Promise<{ user: User; accessToken?: string }> => {
    return signInWithGoogle();
  };

  const relinkGoogle = async (): Promise<{ user: User; accessToken?: string }> => {
    return signInWithGoogle();
  };

  const signOut = async () => {
    if (auth.currentUser) {
      await fbSignOut(auth);
    }
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
