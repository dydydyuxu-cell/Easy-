import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Server,
  Lock,
  Cpu,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../firebase/authContext';
import { UserSettings } from '../types/tts';

interface ByokSettingsProps {
  settings: UserSettings | null;
  isGeminiLinked?: boolean;
  onOpenGeminiLink?: () => void;
  onRefreshSettings: () => void;
  onOpenAuth?: () => void;
}

export function ByokSettings({
  isGeminiLinked,
  onOpenGeminiLink,
  onOpenAuth,
}: ByokSettingsProps) {
  const { user } = useAuth();

  const handleOpenLinkModal = () => {
    if (!user && onOpenAuth) {
      onOpenAuth();
    } else if (onOpenGeminiLink) {
      onOpenGeminiLink();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" dir="rtl">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-600/15 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">ربط حساب Google وGemini</h1>
            <p className="text-xs text-slate-400 mt-1">
              ربط مباشر وآمن بحساب Google الخاص بك لتخصيص الحصة والفوترة على مشروعك بدون أي إدخال يدوي تقني.
            </p>
          </div>
        </div>
      </div>

      {/* Main Connection Status Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-sm font-bold text-white">حالة ربط Google الرسمية</h2>
              <span className="text-[11px] text-slate-400">بروتوكول Google OAuth 2.0 المعتمد</span>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              isGeminiLinked
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
            }`}
          >
            {isGeminiLinked ? 'تم ربط Google ✓' : 'Google غير متصل — اضغط للربط'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-start gap-3.5">
            {isGeminiLinked ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1 text-xs">
              <p className="text-slate-200 font-bold text-sm">
                {isGeminiLinked
                  ? 'حساب Google الخاص بك مرتبط وجاهز لتوليد الصوت'
                  : 'لم يتم ربط حساب Google حتى الآن'}
              </p>
              <p className="text-slate-400 text-xs leading-relaxed max-w-xl">
                {isGeminiLinked
                  ? 'يتم توليد الصوت عبر Gemini بحسابك ومشروعك مباشرة، واحتساب الفوترة والحصة على حساب Google الخاص بك بأمان تام.'
                  : 'اضغط على الزر للربط بنقرة واحدة واختيار حساب Google من جهازك، دون إدخال أي مفاتيح API أو معرّفات مشاريع يدوياً.'}
              </p>
            </div>
          </div>

          <button
            id="byok-action-google-btn"
            onClick={handleOpenLinkModal}
            className={`px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2.5 transition shadow-md cursor-pointer shrink-0 ${
              isGeminiLinked
                ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                : 'bg-white hover:bg-slate-100 text-slate-900 shadow-white/10'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            <span>{isGeminiLinked ? 'إعادة ربط Google' : 'تسجيل الدخول وربط Google'}</span>
          </button>
        </div>
      </div>

      {/* Features & Privacy Guarantees */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
            <UserCheck className="w-4 h-4" />
            <h3>سهولة مطلقة بدون تعقيد تقني</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            لا يطلب منك النظام كتابة أي مفاتيح API أو معرّفات مشاريع أو كلمات مرور. كل ما عليك هو الضغط على زر الربط واختيار حساب Google الخاص بك.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <ShieldCheck className="w-4 h-4" />
            <h3>حسابك وحصتك الخاصة</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            استهلاك نماذج Gemini الصوتية يُحسب على مشروعك وحسابك الخاص في Google Cloud مباشرة، بما يضمن الاستقلالية التامة وعدم المشاركة مع أي مستخدم آخر.
          </p>
        </div>
      </div>

      {/* Security Architecture Visualization */}
      <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
        <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>مخطط العزل الأمني للحسابات (Zero Leakage Architecture)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-200 block">Google UID</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              هوية معزولة ومستقلة لكل مستخدم معتمدة وموثقة عبر Google OAuth 2.0.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
              <Server className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-200 block">Server Vault</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              تشفير AES-256-GCM. الاعتمادات لا تغادر السيرفر ولا تُعرض في المتصفح.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto">
              <Cpu className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-200 block">Gemini TTS</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              الاستدعاء يتم لحساب ومشروع المستخدم مباشرة، وحصته الخاصة فقط هي التي تُحتسب.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
