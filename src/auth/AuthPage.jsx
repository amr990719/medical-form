import React, { useReducer, useState, useEffect, useRef } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

// ─── State machine ────────────────────────────────────────────────────────────
// States: 'choose' | 'emailSignup' | 'verifyEmail' | 'emailLogin' | 'forgotPassword'
const initialState = { screen: 'choose' };

function reducer(state, action) {
  switch (action.type) {
    case 'GO':        return { screen: action.screen };
    case 'RESET':     return initialState;
    default:          return state;
  }
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AuthPage({ onAuthSuccess }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [info, setInfo]         = useState('');

  // Email verification polling
  const [verifyUser, setVerifyUser]         = useState(null);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [resendDisabled, setResendDisabled]   = useState(true);
  const pollRef   = useRef(null);
  const timerRef  = useRef(null);

  const go    = (screen) => { setError(''); setInfo(''); dispatch({ type: 'GO', screen }); };
  const reset = ()       => { setError(''); setInfo(''); setEmail(''); setPassword(''); dispatch({ type: 'RESET' }); };

  // Clean up polling + timer on unmount or screen change
  useEffect(() => {
    return () => {
      clearInterval(pollRef.current);
      clearInterval(timerRef.current);
    };
  }, [state.screen]);

  // ─── Resend countdown timer ─────────────────────────────────────────────
  function startResendTimer() {
    setResendCountdown(60);
    setResendDisabled(true);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // ─── Email verification polling ─────────────────────────────────────────
  function startVerificationPolling(user) {
    let polls = 0;
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      polls++;
      try {
        await user.reload();
        if (auth.currentUser?.emailVerified) {
          clearInterval(pollRef.current);
          onAuthSuccess(auth.currentUser);
        }
      } catch (_) {}
      if (polls >= 10) {
        clearInterval(pollRef.current);
        setError('انتهت مهلة التحقق. يمكنك إعادة إرسال رابط التحقق.');
      }
    }, 3000);
  }

  // ─── Google Sign-In ─────────────────────────────────────────────────────
  async function handleGoogleSignIn() {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user   = result.user;
      const isNew  = user.metadata.creationTime === user.metadata.lastSignInTime;
      if (isNew) setInfo('مرحباً بك!');
      onAuthSuccess(user);
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('تم إغلاق نافذة تسجيل الدخول');
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        setError('هذا البريد مسجل بطريقة أخرى');
      } else {
        setError('حدث خطأ أثناء تسجيل الدخول بـ Google');
      }
    } finally {
      setLoading(false);
    }
  }

  // ─── Email Sign-Up ──────────────────────────────────────────────────────
  const pwdRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

  async function handleEmailSignup(e) {
    e.preventDefault();
    setError('');
    if (!pwdRegex.test(password)) {
      setError('كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل، وتشمل حرفاً ورقماً');
      return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(cred.user);
      setVerifyUser(cred.user);
      startResendTimer();
      startVerificationPolling(cred.user);
      go('verifyEmail');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('هذا البريد الإلكتروني مسجل بالفعل');
      } else if (err.code === 'auth/invalid-email') {
        setError('البريد الإلكتروني غير صحيح');
      } else if (err.code === 'auth/weak-password') {
        setError('كلمة المرور ضعيفة جداً');
      } else {
        setError('حدث خطأ أثناء إنشاء الحساب');
      }
    } finally {
      setLoading(false);
    }
  }

  // ─── Resend verification email ──────────────────────────────────────────
  async function handleResend() {
    if (!verifyUser || resendDisabled) return;
    setError('');
    try {
      await sendEmailVerification(verifyUser);
      startResendTimer();
      startVerificationPolling(verifyUser);
      setInfo('تم إعادة إرسال رابط التحقق');
    } catch (_) {
      setError('حدث خطأ أثناء إعادة الإرسال');
    }
  }

  // ─── Cancel verification (sign out + delete unverified account) ─────────
  async function handleCancelVerification() {
    clearInterval(pollRef.current);
    clearInterval(timerRef.current);
    try {
      if (verifyUser && !verifyUser.emailVerified) {
        await verifyUser.delete();
      }
    } catch (_) {}
    try { await signOut(auth); } catch (_) {}
    setVerifyUser(null);
    reset();
  }

  // ─── Email Sign-In ──────────────────────────────────────────────────────
  async function handleEmailLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      if (!cred.user.emailVerified) {
        await signOut(auth);
        setError('يرجى التحقق من بريدك الإلكتروني أولاً. هل تريد إعادة إرسال رابط التحقق؟');
        setLoading(false);
        return;
      }
      onAuthSuccess(cred.user);
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else if (err.code === 'auth/too-many-requests') {
        setError('تم تجاوز عدد المحاولات. يرجى المحاولة لاحقاً');
      } else {
        setError('حدث خطأ أثناء تسجيل الدخول');
      }
    } finally {
      setLoading(false);
    }
  }

  // ─── Resend verification from login screen ──────────────────────────────
  async function handleResendFromLogin() {
    if (!email) { setError('أدخل بريدك الإلكتروني أولاً'); return; }
    setLoading(true);
    try {
      // Sign in temporarily to get user object — we need to be signed in to send verification
      // Can't resend without the user object; prompt them to check spam or try signup
      setInfo('يرجى محاولة إنشاء حساب جديد أو التواصل مع الدعم الفني إذا كان البريد مسجلاً بالفعل');
    } finally {
      setLoading(false);
    }
  }

  // ─── Password Reset ─────────────────────────────────────────────────────
  async function handlePasswordReset(e) {
    e.preventDefault();
    setError('');
    if (!email) { setError('أدخل بريدك الإلكتروني أولاً'); return; }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setInfo('تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني');
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError('لا يوجد حساب مرتبط بهذا البريد الإلكتروني');
      } else {
        setError('حدث خطأ أثناء إرسال رابط الاستعادة');
      }
    } finally {
      setLoading(false);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  // Shared alert rendering
  const ErrorBox   = () => error ? <div data-auth-error role="alert">{error}</div> : null;
  const InfoBox    = () => info  ? <div data-auth-info  role="status">{info}</div>  : null;

  // ── CHOOSE screen ──────────────────────────────────────────────────────
  if (state.screen === 'choose') {
    return (
      <div dir="rtl" data-auth-screen="choose">
        <div data-auth-heading>
          <h1>تسجيل الدخول</h1>
          <p>اختر طريقة الدخول</p>
        </div>
        <ErrorBox />
        <InfoBox />
        <div data-auth-methods>
          <button
            type="button"
            data-auth-method="google"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.97 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            </svg>
            <span>المتابعة بحساب Google</span>
          </button>

          <button
            type="button"
            data-auth-method="email"
            onClick={() => go('emailLogin')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <polyline points="2,4 12,13 22,4"/>
            </svg>
            <span>البريد الإلكتروني وكلمة المرور</span>
          </button>
        </div>
      </div>
    );
  }

  // ── EMAIL SIGNUP screen ────────────────────────────────────────────────
  if (state.screen === 'emailSignup') {
    return (
      <div dir="rtl" data-auth-screen="emailSignup">
        <h2>إنشاء حساب جديد</h2>
        <ErrorBox />
        <InfoBox />
        <form onSubmit={handleEmailSignup}>
          <div data-field>
            <label htmlFor="signup-email">البريد الإلكتروني</label>
            <input
              id="signup-email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="example@domain.com"
              dir="ltr"
            />
          </div>
          <div data-field>
            <label htmlFor="signup-password">كلمة المرور</label>
            <input
              id="signup-password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="8 أحرف أو أكثر، تشمل حرفاً ورقماً"
              dir="ltr"
            />
          </div>
          <button type="submit" disabled={loading} data-auth-btn="primary">
            {loading ? <span data-spinner /> : 'إنشاء حساب'}
          </button>
          <button type="button" onClick={() => go('emailLogin')} data-auth-btn="ghost">
            لديك حساب بالفعل؟ سجل دخولك
          </button>
          <button type="button" onClick={reset} data-auth-btn="ghost">
            رجوع
          </button>
        </form>
      </div>
    );
  }

  // ── VERIFY EMAIL screen ───────────────────────────────────────────────
  if (state.screen === 'verifyEmail') {
    return (
      <div dir="rtl" data-auth-screen="verifyEmail">
        <h2>تحقق من بريدك الإلكتروني</h2>
        <p>أدخل كود التحقق المرسل إلى بريدك</p>
        <ErrorBox />
        <InfoBox />

        {/* 6-digit OTP display boxes (visual only — verification is via email link polling) */}
        <div data-otp-boxes>
          {[0,1,2,3,4,5].map(i => (
            <div key={i} data-otp-box />
          ))}
        </div>

        <p data-verify-hint>
          تم إرسال رابط التحقق إلى <strong>{email}</strong>. افتح بريدك وانقر على الرابط.
        </p>
        <p data-verify-polling>جارٍ التحقق تلقائياً...</p>

        <div data-resend-row>
          {resendDisabled ? (
            <span data-resend-countdown>إعادة الإرسال بعد {resendCountdown} ثانية</span>
          ) : (
            <button type="button" data-resend-btn onClick={handleResend}>
              إعادة إرسال كود التحقق
            </button>
          )}
        </div>

        <button type="button" onClick={handleCancelVerification} data-auth-btn="ghost">
          إلغاء
        </button>
      </div>
    );
  }

  // ── EMAIL LOGIN screen ────────────────────────────────────────────────
  if (state.screen === 'emailLogin') {
    return (
      <div dir="rtl" data-auth-screen="emailLogin">
        <h2>تسجيل الدخول</h2>
        <ErrorBox />
        <InfoBox />
        {/* Resend verification prompt shown inside error */}
        {error.includes('إعادة إرسال') && (
          <button type="button" data-auth-btn="ghost" onClick={handleResendFromLogin}>
            إعادة إرسال رابط التحقق
          </button>
        )}
        <form onSubmit={handleEmailLogin}>
          <div data-field>
            <label htmlFor="login-email">البريد الإلكتروني</label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="example@domain.com"
              dir="ltr"
            />
          </div>
          <div data-field>
            <label htmlFor="login-password">كلمة المرور</label>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              dir="ltr"
            />
          </div>
          <button type="button" data-forgot-link onClick={() => go('forgotPassword')}>
            نسيت كلمة المرور؟
          </button>
          <button type="submit" disabled={loading} data-auth-btn="primary">
            {loading ? <span data-spinner /> : 'تسجيل الدخول'}
          </button>
          <button type="button" onClick={() => go('emailSignup')} data-auth-btn="ghost">
            إنشاء حساب جديد
          </button>
          <button type="button" onClick={reset} data-auth-btn="ghost">
            رجوع
          </button>
        </form>
      </div>
    );
  }

  // ── FORGOT PASSWORD screen ────────────────────────────────────────────
  if (state.screen === 'forgotPassword') {
    return (
      <div dir="rtl" data-auth-screen="forgotPassword">
        <h2>استعادة كلمة المرور</h2>
        <p>أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين</p>
        <ErrorBox />
        <InfoBox />
        <form onSubmit={handlePasswordReset}>
          <div data-field>
            <label htmlFor="reset-email">البريد الإلكتروني</label>
            <input
              id="reset-email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="example@domain.com"
              dir="ltr"
            />
          </div>
          <button type="submit" disabled={loading} data-auth-btn="primary">
            {loading ? <span data-spinner /> : 'إرسال رابط الاستعادة'}
          </button>
          <button type="button" onClick={() => go('emailLogin')} data-auth-btn="ghost">
            رجوع لتسجيل الدخول
          </button>
        </form>
      </div>
    );
  }

  return null;
}
