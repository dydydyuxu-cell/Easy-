import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  X,
  Sparkles,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { GeminiLinkStatus } from '../types/tts';
import { linkGeminiCredential, unlinkGeminiCredential } from '../services/apiClient';
import { useAuth, formatAuthError } from '../firebase/authContext';

interface GeminiLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  idToken: string | null;
  linkStatus: GeminiLinkStatus | null;
  onStatusUpdated: (status: GeminiLinkStatus) => void;
}

export const GeminiLinkModal: React.FC<GeminiLinkModalProps> = ({
  isOpen,
  onClose,
  idToken,
  linkStatus,
  onStatusUpdated,
}) => {
  const { user, relinkGoogle, signInAndLinkGoogle } = useAuth();

  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isUnlinking, setIsUnlinking] = useState(false);

  if (!isOpen) return null;

  const isLinked = Boolean(linkStatus?.isLinked);

  // 1-Click Seamless Google Sign-in & Link
  const handleSeamlessGoogleLink = async () => {
    setIsLinkingGoogle(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSuccess(false);

    try {
      // 1. Google account picker popup + permission approval
      const authResult = user ? await relinkGoogle() : await signInAndLinkGoogle();
      const googleAccessToken = authResult.accessToken;

      if (!googleAccessToken) {
        throw new Error('لم يتم استلام رمز اعتماد من Google. يرجى المحاولة مرة أخرى.');
      }

      // 2. Automatically store OAuth credential in user vault
      const currentIdToken = await authResult.user.getIdToken();
      const res = await linkGeminiCredential(currentIdToken, {
        credential: googleAccessToken,
        type: 'oauth',
        testBeforeSave: false,
      });

      // 3. Show success state
      setIsSuccess(true);
      setSuccessMsg('✓ تم ربط حساب Google بنجاح');
      onStatusUpdated({
        isLinked: true,
        maskedKey: res.maskedKey,
        type: 'oauth',
        updatedAt: new Date().toISOString(),
      });

      // 4. Return to site automatically after 1.3s
      setTimeout(() => {
        setIsSuccess(false);
        setSuccessMsg(null);
        onClose();
      }, 1300);
    } catch (err: any) {
      console.error('Google linking error:', err);
      setErrorMsg(formatAuthError(err));
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  const handleUnlink = async () => {
    if (!idToken) return;
    if (!window.confirm('هل أنت متأكد من إلغاء ربط Google؟ لن تتمكن من توليد الصوت حتى تعيد الربط.')) {
      return;
    }

    setIsUnlinking(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSuccess(false);

    try {
      await unlinkGeminiCredential(idToken);
      setSuccessMsg('تم إلغاء الربط بنجاح.');
      onStatusUpdated({
        isLinked: false,
      });
      setTimeout(() => {
        setSuccessMsg(null);
      }, 1400);
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل إلغاء الربط.');
    } finally {
      setIsUnlinking(false);
    }
  };

  return (
    <div
      id="gemini-link-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      dir="rtl"
    >
      <div
        id="gemini-link-modal-card"
        className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6"
      >
        {/* Close Button */}
        <button
          id="gemini-link-close-btn"
          onClick={onClose}
          className="absolute top-5 left-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">
              ربط حساب Google وGemini
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              ربط مباشر بحسابك لاحتساب الحصة والفوترة على مشروعك بدون أي إدخال يدوي
            </p>
          </div>
        </div>

        {/* Status Indicator Banner */}
        <div
          id="gemini-link-status-banner"
          className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
            isLinked
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {isLinked ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold text-sm sm:text-base">
                {isLinked ? 'تم ربط Google ✓' : 'Google غير متصل — اضغط للربط'}
              </div>
              <div className="text-xs opacity-90 mt-1">
                {isLinked ? (
                  <span>
                    حساب Google مرتبط بنجاح واستهلاك الصوت يُحسب على حسابك ومشروعك مباشرة.
                  </span>
                ) : (
                  'لتشغيل تحويل النص إلى صوت، اضغط على زر الربط أدناه للموافقة واحتساب الحصة على مشروعك.'
                )}
              </div>
            </div>
          </div>

          {isLinked && (
            <button
              id="unlink-gemini-btn"
              onClick={handleUnlink}
              disabled={isUnlinking}
              className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 px-3 py-1.5 rounded-xl border border-rose-500/20 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isUnlinking ? 'جاري الإلغاء...' : 'إلغاء الربط'}</span>
            </button>
          )}
        </div>

        {/* Success Alert */}
        {isSuccess && (
          <div
            id="gemini-link-success-alert"
            className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-sm flex items-center gap-3 animate-in zoom-in-95"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold">{successMsg || '✓ تم ربط حساب Google بنجاح'}</span>
              <p className="text-xs text-emerald-400/90 mt-0.5">جاري العودة للموقع تلقائياً...</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div
            id="gemini-link-error-alert"
            className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in"
          >
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* Primary Action Box: 1-Click Login & Link Google */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                {isLinked ? 'تحديث أو إعادة ربط حساب Google' : 'الربط التلقائي بضغطة واحدة'}
              </span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              يتم الربط وفق بروتوكول OAuth 2.0 الرسمي عبر Google. تختار حسابك وتمنح الصلاحية اللازمة دون كتابة أي مفاتيح أو معرّفات مشاريع تقنية.
            </p>
          </div>

          {/* Simple Arabic Permissions List */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-2 text-slate-300">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-[11px]">
              <span>✓ ما الذي يتم في هذه العملية:</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-400 pr-1 leading-relaxed">
              <li>• اختيار حساب Google الخاص بك بسهولة وأمان من حسابات جهازك.</li>
              <li>• ربط استهلاك Gemini بحسابك ومشروعك لتخصيص الحصة والفوترة لك مباشرة.</li>
              <li>• أمان تام: لا يطلب الموقع أي كلمة مرور أو API Key أو Project ID.</li>
            </ul>
          </div>

          <button
            id="primary-google-link-action-btn"
            onClick={handleSeamlessGoogleLink}
            disabled={isLinkingGoogle}
            className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-lg cursor-pointer ${
              isLinked
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                : 'bg-white hover:bg-slate-100 text-slate-900 shadow-white/10'
            }`}
          >
            {isLinkingGoogle ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري فتح Google وتأكيد الربط...</span>
              </>
            ) : (
              <>
                {/* Official Google Icon */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>{isLinked ? 'إعادة ربط Google' : 'تسجيل الدخول وربط Google'}</span>
              </>
            )}
          </button>
        </div>

        {/* Security Footer */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>بروتوكول OAuth 2.0 الرسمي • تشفير كامل AES-256-GCM</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
