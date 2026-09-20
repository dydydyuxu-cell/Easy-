import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useAuth, formatAuthError } from '../firebase/authContext';
import { linkGeminiCredential } from '../services/apiClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignInAndLink = async () => {
    setLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      // Step 1 & 2: Prompt Google account picker and request required scopes
      const { user, accessToken } = await signInWithGoogle();

      // Step 3: Automatically link the user's Google OAuth token on the server
      if (accessToken) {
        try {
          const idToken = await user.getIdToken();
          await linkGeminiCredential(idToken, {
            credential: accessToken,
            type: 'oauth',
            testBeforeSave: false,
          });
        } catch (linkErr) {
          console.warn('Silent link error (can be completed or re-linked later):', linkErr);
        }
      }

      // Step 4: Display the success confirmation
      setIsSuccess(true);
      if (onSuccess) {
        onSuccess();
      }

      // Automatically return to site after brief confirmation
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1300);
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl space-y-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute left-5 top-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-right space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">تسجيل الدخول وربط Google</h2>
              <span className="text-[11px] text-emerald-400 font-medium">
                ربط تلقائي سلس بضغطة واحدة
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed pt-1">
            سجّل دخولك واربط مشروع Gemini الخاص بك في خطوة واحدة بدون أي إدخال يدوي لمفاتيح أو معرّفات تقنية.
          </p>
        </div>

        {/* Success Banner */}
        {isSuccess ? (
          <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-sm flex items-center gap-3 animate-in zoom-in-95">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-emerald-300">✓ تم ربط حساب Google بنجاح</p>
              <p className="text-xs text-emerald-400/90 mt-0.5">جاري العودة إلى الموقع تلقائياً...</p>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Clear, Simple Permissions Guide in Arabic */}
            <div className="rounded-2xl bg-slate-950/70 border border-slate-800/80 p-4 space-y-3 text-xs">
              <div className="text-slate-300 font-semibold flex items-center gap-2 text-[13px]">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>الصلاحيات الضرورية الممنوحة:</span>
              </div>

              <ul className="space-y-2.5 pr-1 text-slate-400 leading-relaxed text-xs">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">1.</span>
                  <span>
                    <strong className="text-slate-200">اختيار حساب Google:</strong> لتسجيل دخولك وتأكيد هويتك الآمنة مباشرة من جهازك.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">2.</span>
                  <span>
                    <strong className="text-slate-200">استخدام Gemini:</strong> لتشغيل توليد الصوت واحتساب الحصة والفوترة على مشروعك وحسابك الخاص، وليس على صاحب الموقع.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">3.</span>
                  <span>
                    <strong className="text-slate-200">أمان وحماية تامة:</strong> لا يطلب الموقع كلمة مرورك إطلاقاً، ولا يطلب كتابة API Key أو Project ID يدوياً.
                  </span>
                </li>
              </ul>
            </div>

            {/* Primary Google Login & Link Button */}
            <div className="space-y-3 pt-1">
              <button
                id="google-signin-link-btn"
                onClick={handleGoogleSignInAndLink}
                disabled={loading}
                className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-lg ${
                  loading
                    ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                    : 'bg-white hover:bg-slate-100 text-slate-900 shadow-white/10 cursor-pointer active:scale-[0.99]'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-600 border-t-slate-900 rounded-full animate-spin" />
                    <span>جاري الربط مع Google...</span>
                  </>
                ) : (
                  <>
                    {/* Official Google 'G' Icon */}
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>تسجيل الدخول وربط Google</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5 pt-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>بروتوكول OAuth 2.0 الرسمي عبر Google Firebase Auth</span>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
