import React, { useState, useRef, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// ─── Service & component imports added during refactoring ─────────────────────
import { calculateTotal } from './services/CalculationService';
import SmartUpload from './components/SmartUpload';
import CheckoutPage from './components/CheckoutPage';


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBjLg-ApttwXWzH_NtVSloJLzkYcIGi61o",
  authDomain: "medical-form-fe913.firebaseapp.com",
  projectId: "medical-form-fe913",
  storageBucket: "medical-form-fe913.firebasestorage.app",
  messagingSenderId: "671661093717",
  appId: "1:671661093717:web:dfb7365268dbe6d02f75dc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- Icons ---
const PrinterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <polyline points="6 9 6 2 18 2 18 9"></polyline>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
    <rect width="12" height="8" x="6" y="14"></rect>
  </svg>
);

const SaveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
    <polyline points="17 21 17 13 7 13 7 21"></polyline>
    <polyline points="7 3 7 8 15 8"></polyline>
  </svg>
);

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

const LoaderIcon = () => (
  <svg className="animate-spin w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const PaperclipIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

// --- Auth Component ---
const AuthScreen = ({ auth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (username.trim().length < 4) {
      setError('اسم المستخدم يجب أن يكون 4 أحرف على الأقل');
      return;
    }

    setLoading(true);
    const email = `${username.trim().toLowerCase()}@system.local`;

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('بيانات الدخول غير صحيحة');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('اسم المستخدم مسجل بالفعل');
      } else if (err.code === 'auth/weak-password') {
        setError('كلمة المرور ضعيفة جداً');
      } else {
        setError('حدث خطأ أثناء الاتصال بالخادم');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-200 flex items-center justify-center p-4 font-sans text-gray-900">
      <div className="bg-white p-8 shadow-2xl border border-gray-300 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">مشروع علاج الأعضاء وأسرهم</h1>
          <h2 className="text-xl font-bold text-gray-600">
            {isLogin ? 'تسجيل الدخول للأعضاء' : 'إنشاء حساب عضو جديد'}
          </h2>
        </div>

        {error && (
          <div className="bg-red-100 border-r-4 border-red-600 text-red-800 p-3 mb-6 font-bold text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-bold mb-2 text-gray-800">اسم المستخدم</label>
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full border-2 border-gray-300 p-3 outline-none focus:border-blue-600 text-left"
              dir="ltr"
              placeholder="username"
            />
          </div>
          <div>
            <label className="block font-bold mb-2 text-gray-800">كلمة المرور</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border-2 border-gray-300 p-3 outline-none focus:border-blue-600 text-left"
              dir="ltr"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 hover:bg-blue-700 transition-colors flex justify-center"
          >
            {loading ? <LoaderIcon /> : (isLogin ? 'دخول' : 'إنشاء حساب')}
          </button>
        </form>

        <div className="mt-6 text-center border-t pt-4">
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-blue-700 hover:underline font-bold text-sm"
          >
            {isLogin ? 'ليس لديك حساب؟ قم بإنشاء حساب جديد' : 'لديك حساب بالفعل؟ سجل دخولك الآن'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Form Fields Components ---

// Component for 14-digit National ID boxes
const NidInput = ({ value, onChange, size = "large" }) => {
  const inputRefs = useRef([]);

  const handleInput = (e, index) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (!val) {
      const newVal = value.split('');
      newVal[index] = ' ';
      onChange(newVal.join('').trimEnd());
      return;
    }

    const newVal = value.padEnd(14, ' ').split('');
    newVal[index] = val[val.length - 1];
    onChange(newVal.join('').trimEnd());

    if (index < 13 && val) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && (!value[index] || value[index] === ' ') && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 14);
    onChange(pastedData);
  };

  const paddedValue = value.padEnd(14, ' ');
  const boxClass = size === "large"
    ? "w-[24px] h-[32px] text-base"
    : "w-[18px] h-[26px] text-sm";

  return (
    <div dir="ltr" className="flex items-center gap-[2px]">
      {Array.from({ length: 14 }).map((_, i) => (
        <input
          key={i}
          ref={el => inputRefs.current[i] = el}
          className={`${boxClass} border-[1.5px] border-black bg-white text-center text-blue-700 font-bold outline-none focus:border-blue-500 focus:bg-blue-50 transition-colors`}
          maxLength={1}
          value={paddedValue[i] !== ' ' ? paddedValue[i] : ''}
          onChange={(e) => handleInput(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  );
};

// Component for String Boxes (like Email)
const BoxStringInput = ({ value, onChange, length = 25 }) => {
  const inputRefs = useRef([]);
  const paddedValue = (value || '').padEnd(length, ' ');

  const handleInput = (e, index) => {
    const val = e.target.value;
    if (!val) {
      const newVal = (value || '').split('');
      newVal[index] = ' ';
      onChange(newVal.join('').trimEnd());
      return;
    }
    const newVal = paddedValue.split('');
    newVal[index] = val[val.length - 1];
    onChange(newVal.join('').trimEnd());

    if (index < length - 1 && val) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && (!value[index] || value[index] === ' ') && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length);
    onChange(pastedData);
  };

  return (
    <div dir="ltr" className="flex items-center justify-start flex-wrap gap-[2px] flex-1">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={el => inputRefs.current[i] = el}
          className="w-[20px] h-[30px] text-sm border-[1.5px] border-black bg-white text-center text-blue-700 font-bold outline-none focus:border-blue-500 focus:bg-blue-50 transition-colors"
          maxLength={1}
          value={paddedValue[i] !== ' ' ? paddedValue[i] : ''}
          onChange={(e) => handleInput(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  );
};

// Component for Dashed Lines
const DashedField = ({ label, value, onChange, labelWidth, containerClass = "flex-1" }) => (
  <div className={`flex items-end ${containerClass}`}>
    <span className={`whitespace-nowrap font-bold text-gray-900 inline-block shrink-0 ${labelWidth || ''}`}>
      {label}
    </span>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex-1 ml-1 border-b-[2px] border-dashed border-gray-600 outline-none bg-transparent px-1 text-center text-blue-700 font-bold focus:border-blue-600 min-w-0 h-6 leading-none"
    />
  </div>
);

// Component for Square check-like Radio buttons
const RadioBoxGroup = ({ label, options, name, value, onChange, labelWidth, containerClass = "" }) => (
  <div className={`flex items-end ${containerClass}`}>
    <span className={`whitespace-nowrap font-bold text-gray-900 inline-block shrink-0 ${labelWidth || ''}`}>
      {label}
    </span>
    <div className="flex items-center justify-start gap-1">
      {options.map((opt) => (
        <label
          key={opt}
          className={`flex items-center justify-center px-1.5 h-[26px] border-[1.5px] border-black cursor-pointer transition-colors ${value === opt ? 'bg-gray-300 shadow-inner' : 'bg-white hover:bg-gray-100'
            }`}
        >
          <span className={`text-[13px] font-bold leading-none mt-0.5 ${value === opt ? 'text-black' : 'text-gray-800'}`}>
            {opt}
          </span>
          <input
            type="radio"
            name={name}
            value={opt}
            checked={value === opt}
            onChange={() => onChange(opt)}
            className="hidden"
          />
        </label>
      ))}
    </div>
  </div>
);

// --- Documents Modal Component ---
const DocumentModal = ({ isOpen, onClose, beneficiary, index, onUpdateDocs, memberGender, onUpdateData }) => {
  if (!isOpen || !beneficiary) return null;

  let requiredDocs = [];

  if (['زوج', 'زوجة'].includes(beneficiary.kinship)) {
    requiredDocs = [
      { id: 'nationalId', label: 'بطاقة الرقم القومي' },
      { id: 'marriageCertificate', label: 'شهادة الزواج' },
      { id: 'insurancePrint', label: 'برينت تأميني' }
    ];
  } else if (['أم', 'أب'].includes(beneficiary.kinship)) {
    requiredDocs = [
      { id: 'nationalId', label: 'بطاقة الرقم القومي' }
    ];
  } else if (['ابن (18 سنة أو أقل)', 'ابن (طالب جامعي)', 'ابن (خريج)', 'ابنة'].includes(beneficiary.kinship)) {
    // Child categories
    const isSon = beneficiary.kinship.startsWith('ابن');

    // Add birth certificate (emphasize if the main member is female)
    if (memberGender === 'أنثى') {
      requiredDocs.push({ id: 'birthCertificate', label: 'شهادة الميلاد (إلزامي)' });
    } else {
      if (isSon) {
        requiredDocs.push({ id: 'birthCertificate', label: 'شهادة الميلاد (فقط لمن هم دون 16 سنة)' });
      } else {
        requiredDocs.push({ id: 'birthCertificate', label: 'شهادة الميلاد' });
      }
    }

    // Add national ID
    if (isSon) {
      requiredDocs.push({ id: 'nationalId', label: 'بطاقة الرقم القومي (إلزامي لمن أتم 16 سنة)' });
    } else {
      requiredDocs.push({ id: 'nationalId', label: 'بطاقة الرقم القومي (إن وجدت لمن هم دون 16)' });
    }

    // Category specific documents
    if (beneficiary.kinship === 'ابن (طالب جامعي)') {
      requiredDocs.push({ id: 'universityId', label: 'كارنيه جامعة (للطلاب)' });
    } else if (beneficiary.kinship === 'ابن (خريج)') {
      requiredDocs.push({ id: 'insurancePrint', label: 'برينت تأميني' });
    }
  }

  const handleFileChange = (docId, file) => {
    onUpdateDocs(index, { ...beneficiary.documents, [docId]: file || null });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 print:hidden">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-blue-700 text-white p-4 flex justify-between items-center">
          <h3 className="font-bold text-lg">
            مستندات المستفيد: {beneficiary.name || `(مستفيد رقم ${index + 1})`}
          </h3>
          <button onClick={onClose} className="hover:text-red-300 transition-colors">
            <CloseIcon />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {requiredDocs.length === 0 ? (
            <p className="text-gray-500 text-center font-bold">يرجى اختيار درجة القرابة أولاً لتحديد المستندات المطلوبة.</p>
          ) : (
            requiredDocs.map(doc => {
              // Use SmartUpload for OCR-supported documents
              const isOcrSupported = ['nationalId', 'birthCertificate'].includes(doc.id);

              return (
                <div key={doc.id} className="border border-gray-200 p-4 rounded-lg bg-gray-50">
                  <label className="block font-bold text-gray-800 mb-2">{doc.label}</label>

                  {isOcrSupported ? (
                    <SmartUpload
                      label=""
                      docType="beneficiaryDoc"
                      currentFile={beneficiary.documents ? beneficiary.documents[doc.id] : null}
                      onFileChange={(file) => handleFileChange(doc.id, file)}
                      onExtracted={(fields) => {
                        if (onUpdateData) onUpdateData(index, fields);
                      }}
                    />
                  ) : (
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        onChange={(e) => handleFileChange(doc.id, e.target.files[0])}
                        className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100 cursor-pointer"
                      />
                    </div>
                  )}

                  {beneficiary.documents && beneficiary.documents[doc.id] && !isOcrSupported && (
                    <p className="mt-2 text-xs text-green-600 font-bold flex items-center gap-1">
                      ✓ تم إرفاق: {beneficiary.documents[doc.id].name}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="bg-gray-100 p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
          >
            حفظ وإغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * FeeSummaryPanel — shown inside the form when registrationYear is filled.
 * Displays the calculated tier, per-item breakdown, and total due.
 */
const FeeSummaryPanel = ({ result }) => {
  if (!result || !result.isValid) return null;
  return (
    <div className="mt-6 border border-emerald-300 rounded-xl bg-emerald-50 p-4 print:hidden">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-extrabold text-emerald-800 text-base">ملخص الاشتراك — السنة المالية 2026</h3>
        <span className="text-xs font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
          الدرجة {result.tier}
        </span>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {result.breakdown.map((item, i) => (
            <tr key={i} className="border-b border-emerald-200 last:border-0">
              <td className="py-1.5 font-bold text-gray-700">{item.label}</td>
              {item.note
                ? <td className="py-1.5 text-xs text-amber-700 font-bold text-center">{item.note}</td>
                : <td />}
              <td className="py-1.5 font-extrabold text-emerald-800 text-left" dir="ltr">
                {item.fee.toLocaleString('ar-EG')} ج.م
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 pt-3 border-t-2 border-emerald-400 flex justify-between items-center">
        <span className="font-extrabold text-gray-800 text-base">الإجمالي</span>
        <span className="font-extrabold text-emerald-700 text-xl" dir="ltr">
          {result.total.toLocaleString('ar-EG')} ج.م
        </span>
      </div>
    </div>
  );
};

// --- Waiting Page Component ---
const WaitingPage = ({ memberName, onLogout }) => {
  return (
    <div dir="rtl" className="min-h-screen bg-gray-200 flex items-center justify-center p-4 font-sans text-gray-900">
      <div className="bg-white p-8 shadow-2xl border border-gray-300 w-full max-w-md text-center rounded-xl">
        <h2 className="text-3xl font-extrabold mb-4 text-green-600">تم الاستلام بنجاح</h2>
        <div className="bg-green-50 p-6 rounded-lg mb-6 border border-green-200">
          <p className="font-bold text-gray-800 text-lg mb-3">شكراً لك يا: {memberName}</p>
          <p className="text-md text-gray-700 leading-relaxed font-bold">
            استمارتك الآن <span className="text-blue-600 bg-blue-100 px-2 py-1 rounded">قيد المراجعة (in process)</span>
          </p>
          <p className="mt-4 text-sm text-gray-600">
            لقد تم حفظ المستندات والبيانات بنجاح. سيتم مراجعة طلبك من قبل إدارة المشروع.
          </p>
        </div>

        <button
          onClick={onLogout}
          className="w-full bg-blue-600 text-white font-bold py-3 hover:bg-blue-700 transition-colors rounded shadow-md"
        >
          خروج مؤقت
        </button>
      </div>
    </div>
  );
};

// ── Initial State Constants
const INITIAL_FORM_DATA = {
  syndicateType: '',
  subSyndicate: '',
  registrationNumber: '',
  treatmentCardNumber: '',
  syndicateRegistrationYear: '', // Used for tier calculation
  workStatus: '',
  memberName: '',
  religion: '',
  nationalId: '',
  gender: '',
  birthYear: '',                 // Used for age-cap check
  governorate: '',
  neighborhood: '',
  address: '',
  mobile: '',
  email: '',
  beneficiaries: Array(10).fill({ kinship: '', name: '', birthYear: '', nationalId: '', documents: {} }),
  declarationName: ''
};

const INITIAL_MAIN_DOCS = {
  nationalIdFront: null,
  nationalIdBack: null,
  syndicateId: null
};

// --- Main Application ---
export default function App() {
  const [user, setUser] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [memberPhoto, setMemberPhoto] = useState(null);     // Image preview data-URL
  const [memberPhotoFile, setMemberPhotoFile] = useState(null); // Physical file for upload

  const [activeModalIndex, setActiveModalIndex] = useState(null);

  // Controls which page the user sees: 'form' | 'payment' | 'waiting'
  const [currentView, setCurrentView] = useState('form');

  // ── Fee calculation result (recomputed whenever relevant fields change) ──
  const [feeResult, setFeeResult] = useState(null);

  // ── Form data (all member + beneficiary fields) ──────────────────────────
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  // ── Main member mandatory document files (held until payment succeeds) ───
  const [mainMemberDocs, setMainMemberDocs] = useState(INITIAL_MAIN_DOCS);

  // ── Auth listener ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  // ── Recalculate fees whenever registration year, work status, or beneficiaries change ──
  useEffect(() => {
    const result = calculateTotal(
      {
        registrationYear: formData.syndicateRegistrationYear,
        workStatus: formData.workStatus,
        birthYear: formData.birthYear,
      },
      formData.beneficiaries
    );
    setFeeResult(result);
  }, [formData.syndicateRegistrationYear, formData.workStatus, formData.birthYear, formData.beneficiaries]);

  // ── Field updaters ───────────────────────────────────────────────────────
  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const updateBeneficiary = (index, field, value) => {
    setFormData(prev => {
      const newBens = [...prev.beneficiaries];
      newBens[index] = { ...newBens[index], [field]: value };
      if (field === 'kinship') newBens[index].documents = {};
      return { ...prev, beneficiaries: newBens };
    });
  };

  const updateBeneficiaryBatch = (index, updatesObj) => {
    setFormData(prev => {
      const newBens = [...prev.beneficiaries];
      const existing = newBens[index];
      const merged = { ...existing };
      for (const [key, val] of Object.entries(updatesObj)) {
        if (val && (!existing[key] || existing[key].trim() === '')) {
          merged[key] = val;
        }
      }
      newBens[index] = merged;
      return { ...prev, beneficiaries: newBens };
    });
  };

  const updateBeneficiaryDocs = (index, newDocs) => {
    setFormData(prev => {
      const newBens = [...prev.beneficiaries];
      newBens[index] = { ...newBens[index], documents: newDocs };
      return { ...prev, beneficiaries: newBens };
    });
  };

  /**
   * handleOcrResult — merges OCR-extracted fields into formData.
   * Called by SmartUpload after a successful scan. Existing non-empty
   * values are NOT overwritten — the OCR result only fills blank fields.
   */
  const handleOcrResult = useCallback((fields) => {
    setFormData(prev => {
      const next = { ...prev };
      for (const [key, val] of Object.entries(fields)) {
        // Only fill if the field is currently empty and we have a value
        if (val && (!next[key] || next[key].trim() === '')) {
          next[key] = val;
        }
      }
      return next;
    });
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const handlePrint = () => window.print();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setFormData(INITIAL_FORM_DATA);
      setMainMemberDocs(INITIAL_MAIN_DOCS);
      setMemberPhoto(null);
      setMemberPhotoFile(null);
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  // 1. Validates the form and moves to the payment screen (No Database Uploads yet)
  const handleProceedToPayment = () => {
    if (!user) {
      showToast("خطأ في المصادقة، يرجى تحديث الصفحة.", "error");
      return;
    }

    if (!formData.memberName.trim() || formData.nationalId.trim().length < 14) {
      showToast("يرجى إدخال اسم العضو والرقم القومي كاملاً (14 رقم) قبل المتابعة للدفع.", "error");
      return;
    }

    // Validate Main Member Documents
    if (!mainMemberDocs.nationalIdFront || !mainMemberDocs.nationalIdBack || !mainMemberDocs.syndicateId) {
      showToast("يجب إرفاق جميع مستندات العضو الأصلي (صورة البطاقة وجه وظهر، وكارنيه النقابة) قبل المتابعة.", "error");
      return;
    }

    // Validate Beneficiaries Documents
    for (let i = 0; i < formData.beneficiaries.length; i++) {
      const ben = formData.beneficiaries[i];
      if (ben.kinship && ben.name.trim()) {
        let requiredDocsKeys = [];

        if (['زوج', 'زوجة'].includes(ben.kinship)) {
          requiredDocsKeys = ['nationalId', 'marriageCertificate', 'insurancePrint'];
        } else if (['أم', 'أب'].includes(ben.kinship)) {
          requiredDocsKeys = ['nationalId', 'insurancePrint'];
        } else if (['ابن (18 سنة أو أقل)', 'ابن (طالب جامعي)', 'ابن (خريج)', 'ابنة'].includes(ben.kinship)) {
          const isSon = ben.kinship.startsWith('ابن');

          if (formData.gender === 'أنثى') {
            requiredDocsKeys.push('birthCertificate');
          } else {
            requiredDocsKeys.push('birthCertificate'); // Required logic handled in modal mostly, but enforce here
          }

          if (isSon) {
            requiredDocsKeys.push('nationalId'); // Mandatory for 16+
          }

          if (ben.kinship === 'ابن (طالب جامعي)') {
            requiredDocsKeys.push('universityId');
          } else if (ben.kinship === 'ابن (خريج)') {
            requiredDocsKeys.push('insurancePrint');
          }
        }

        for (const reqKey of requiredDocsKeys) {
          // If birth cert or national ID isn't strictly mandatory for all cases, you can loosen this, but based on prompt "every required document"
          if (!ben.documents || !ben.documents[reqKey]) {
            showToast(`يرجى استكمال رفع جميع المستندات المطلوبة للمستفيد: ${ben.name || `رقم ${i + 1}`}`, "error");
            return;
          }
        }
      }
    }

    // If validation passes, show the payment page
    setCurrentView('payment');
  };

  // 2. The actual upload logic (Triggered only AFTER successful payment)
  const handleFinalSubmit = async () => {
    setIsSaving(true);
    try {
      // 1. Define the readable ID
      const customDocumentId = `${formData.memberName.trim()} - ${formData.nationalId}`;

      // 2. Upload Member Photo to Storage
      let photoUrl = "";
      if (memberPhotoFile) {
        const photoRef = ref(storage, `members/${formData.memberName.trim()}/profile_photo`);
        await uploadBytes(photoRef, memberPhotoFile);
        photoUrl = await getDownloadURL(photoRef);
      }

      // 2.5 Upload Main Member Required Documents
      const mainDocsUrls = {};
      for (const [key, file] of Object.entries(mainMemberDocs)) {
        if (file) {
          const docRef = ref(storage, `members/${formData.memberName.trim()}/main_${key}`);
          await uploadBytes(docRef, file);
          mainDocsUrls[key] = await getDownloadURL(docRef);
        }
      }

      // 3. Upload Beneficiary Documents to Storage
      const processedBeneficiaries = await Promise.all(
        formData.beneficiaries
          .filter(b => b.name.trim() !== '' || b.kinship !== '')
          .map(async (ben, i) => {
            const uploadedDocsUrls = {};
            if (ben.documents) {
              for (const [docId, file] of Object.entries(ben.documents)) {
                if (file) {
                  const docRef = ref(storage, `members/${formData.memberName.trim()}/beneficiary_${i}_${docId}`);
                  await uploadBytes(docRef, file);
                  uploadedDocsUrls[docId] = await getDownloadURL(docRef);
                }
              }
            }
            return { ...ben, documents: uploadedDocsUrls };
          })
      );

      // 4. Save to Firestore using setDoc with the exact same Custom ID
      const memberDocRef = doc(db, 'members', customDocumentId);

      const payload = {
        ...formData,
        memberPhotoUrl: photoUrl,
        mainMemberDocumentsUrls: mainDocsUrls,
        beneficiaries: processedBeneficiaries,
        userId: user.uid,
        submittedAt: serverTimestamp()
      };

      await setDoc(memberDocRef, payload);

      showToast("تم تأكيد الدفع وحفظ الاستمارة والمستندات بنجاح!", "success");

      // Redirect to the Waiting Page
      setTimeout(() => {
        setCurrentView('waiting');
      }, 1500);

    } catch (error) {
      console.error("Error saving document: ", error);
      showToast("حدث خطأ أثناء حفظ البيانات. حاول مرة أخرى.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (!authInitialized) return <div className="min-h-screen bg-gray-200 flex items-center justify-center"><LoaderIcon /></div>;
  if (!user) return <AuthScreen auth={auth} />;

  // Label width constraints for pixel-perfect vertical alignment of colons
  const labelRight = "w-[125px]";
  const labelMid = "w-[105px]";
  const labelLeft = "w-[105px]";

  // ── PAYMENT VIEW: render CheckoutPage with Paymob iframe ──────────────────────
  if (currentView === 'payment') {
    // Split name into first/last for Paymob's billing_data schema
    const nameParts = formData.memberName.trim().split(' ');
    return (
      <CheckoutPage
        amountCents={(feeResult?.total || 0) * 100}   // Convert EGP → piastres
        billingData={{
          first_name: nameParts[0] || 'عضو',
          last_name: nameParts.slice(1).join(' ') || 'النقابة',
          email: formData.email || 'n/a@n/a.com',
          phone_number: formData.mobile || '+20000000000',
        }}
        memberName={formData.memberName}
        onPaymentSuccess={handleFinalSubmit}   // Upload data after confirmed payment
        onCancel={() => setCurrentView('form')}
      />
    );
  }

  // If the state is set to 'waiting', show the waiting page and STOP.
  if (currentView === 'waiting') {
    return (
      <WaitingPage
        memberName={formData.memberName}
        onLogout={handleLogout}
      />
    );
  }

  // If the state is 'form', it skips the block above and renders this:
  return (
    <div dir="rtl" className="min-h-screen bg-gray-200 py-8 px-4 font-sans text-gray-900 selection:bg-blue-200 overflow-x-auto relative">

      {/* ------------------------------------------------------------------ */}
      {/* NEW: Hidden CSS to force the printer into A4 Mode with no margins */}
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
      {/* ------------------------------------------------------------------ */}

      <DocumentModal
        isOpen={activeModalIndex !== null}
        onClose={() => setActiveModalIndex(null)}
        beneficiary={activeModalIndex !== null ? formData.beneficiaries[activeModalIndex] : null}
        index={activeModalIndex}
        onUpdateDocs={updateBeneficiaryDocs}
        memberGender={formData.gender}
        onUpdateData={updateBeneficiaryBatch}
      />

      {toast.show && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg text-white font-bold transition-all ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.message}
        </div>
      )}

      {/* Floating Action Buttons - Hidden on Print */}
      <div className="print:hidden fixed bottom-8 left-8 flex flex-col gap-4 z-50">
        <button
          onClick={handleLogout}
          className="bg-gray-800 text-white p-4 rounded-full shadow-xl hover:bg-gray-900 hover:scale-105 transition-all flex items-center justify-center gap-2"
          title="تسجيل الخروج"
        >
          <LogoutIcon />
          <span className="font-bold hidden md:inline">تسجيل الخروج</span>
        </button>

        <button
          onClick={handleProceedToPayment}
          className={`text-white p-4 rounded-full shadow-xl transition-all flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 hover:scale-105`}
        >
          <SaveIcon />
          <span className="font-bold hidden md:inline">متابعة للدفع</span>
        </button>

        <button
          onClick={handlePrint}
          className="bg-blue-600 text-white p-4 rounded-full shadow-xl hover:bg-blue-700 hover:scale-105 transition-all flex items-center justify-center gap-2"
        >
          <PrinterIcon />
          <span className="font-bold hidden md:inline">طباعة الاستمارة</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* FIXED: Scaled exactly for A4 perfectly vertically by adjusting padding and scale */}
      <div className="w-[794px] min-h-[1123px] mx-auto bg-white p-8 shadow-2xl print:w-[210mm] print:h-[297mm] print:shadow-none print:p-6 print:m-0 print:overflow-hidden print:box-border flex flex-col justify-between">
        {/* ------------------------------------------------------------------ */}

        {/* Header Section */}
        <header className="flex justify-between items-start mb-10 h-32">
          {/* Right Logo approximation */}
          <div className="text-center font-bold text-[18px] leading-snug w-[260px]">
            <p className="text-xl font-extrabold mb-1 tracking-wide">اتحاد نقابات المهن الطبية</p>
            <div className="border-t-[3px] border-black my-1.5 mx-8"></div>
            <p className="font-extrabold tracking-wide">مشروع علاج الأعضاء وأسرهم</p>
          </div>

          {/* Center Titles */}
          <div className="text-center flex-1 pt-4">
            <h1 className="text-[26px] font-extrabold mb-3">استمارة اشتراك بمشروع العلاج</h1>
            <h2 className="text-[22px] font-bold text-gray-800">( أول مرة - إضافة )</h2>
          </div>

          {/* Left Photo Box */}
          <label className="w-28 h-36 border-[1.5px] border-black flex items-center justify-center bg-white shrink-0 mt-2 ml-4 cursor-pointer relative overflow-hidden group">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  setMemberPhotoFile(file); // Saves the physical file to state
                  const reader = new FileReader();
                  reader.onload = (ev) => setMemberPhoto(ev.target.result);
                  reader.readAsDataURL(file);
                }
              }}
            />
            {memberPhoto ? (
              <img src={memberPhoto} alt="صورة العضو" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center text-gray-400 text-sm font-bold leading-tight group-hover:text-blue-600 transition-colors">
                صورة<br />العضو<br />الأصلي
              </div>
            )}
          </label>
        </header>

        {/* ──────────────────────────────────────────────────────────────
            Main Member Mandatory Documents — SmartUpload with OCR
        ────────────────────────────────────────────────────────────────── */}
        <div className="mb-8 border-[1.5px] border-black p-4 rounded-md print:hidden">
          <h3 className="font-bold text-lg mb-1 text-blue-700">مرفقات العضو الأصلي الإلزامية</h3>
          <p className="text-xs text-gray-500 font-bold mb-4">
            بعد رفع كل صورة، اضغط <span className="text-emerald-700">مسح تلقائي</span> لاستخراج البيانات منها تلقائياً — يمكنك التعديل يدوياً بعد ذلك.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* National ID — Front: extracts member name, NID, birth year, address */}
            <SmartUpload
              label="صورة البطاقة (وجه)"
              docType="nationalIdFront"
              currentFile={mainMemberDocs.nationalIdFront}
              onFileChange={(file) =>
                setMainMemberDocs(prev => ({ ...prev, nationalIdFront: file }))
              }
              onExtracted={handleOcrResult}
            />

            {/* National ID — Back: extracts gender and religion */}
            <SmartUpload
              label="صورة البطاقة (ظهر)"
              docType="nationalIdBack"
              currentFile={mainMemberDocs.nationalIdBack}
              onFileChange={(file) =>
                setMainMemberDocs(prev => ({ ...prev, nationalIdBack: file }))
              }
              onExtracted={handleOcrResult}
            />

            {/* Syndicate ID: extracts registrationNumber, subSyndicate, registrationYear, syndicateType */}
            <SmartUpload
              label="كارنيه النقابة"
              docType="syndicateId"
              currentFile={mainMemberDocs.syndicateId}
              onFileChange={(file) =>
                setMainMemberDocs(prev => ({ ...prev, syndicateId: file }))
              }
              onExtracted={(fields) => {
                // Map OcrService keys → formData keys
                handleOcrResult({
                  registrationNumber: fields.registrationNumber,
                  subSyndicate: fields.subSyndicate,
                  syndicateRegistrationYear: fields.syndicateRegistrationYear,
                  syndicateType: fields.syndicateType,
                });
              }}
            />

          </div>
        </div>

        {/* Section 1: Original Member Data */}
        <section className="mb-10 mt-6">
          <div className="grid grid-cols-12 gap-y-7 gap-x-4 text-[15px]">

            {/* Row 1 */}
            <RadioBoxGroup
              label="الـنـقـــابـــة :"
              name="syndicateType"
              options={['بشري', 'صيدلي', 'أسنان', 'بيطري']}
              value={formData.syndicateType}
              onChange={(v) => updateField('syndicateType', v)}
              labelWidth={labelRight}
              containerClass="col-span-6"
            />
            <DashedField label="النقابة الفرعية :" value={formData.subSyndicate} onChange={(v) => updateField('subSyndicate', v)} labelWidth={labelMid} containerClass="col-span-3" />
            <DashedField label="رقم قيد النقابة :" value={formData.registrationNumber} onChange={(v) => updateField('registrationNumber', v)} labelWidth={labelLeft} containerClass="col-span-3" />

            {/* Row 2 */}
            <DashedField label="رقم بطاقة العلاج :" value={formData.treatmentCardNumber} onChange={(v) => updateField('treatmentCardNumber', v)} labelWidth={labelRight} containerClass="col-span-5" />
            <DashedField label="سنة قيد النقابة :" value={formData.syndicateRegistrationYear} onChange={(v) => updateField('syndicateRegistrationYear', v)} labelWidth={labelMid} containerClass="col-span-3" />
            <RadioBoxGroup
              label="حـالـــة العـمـيـل :"
              name="workStatus"
              options={['يعمل', 'معاش', 'متوفى']}
              value={formData.workStatus}
              onChange={(v) => updateField('workStatus', v)}
              labelWidth={labelLeft}
              containerClass="col-span-4"
            />

            {/* Row 3 */}
            <DashedField label="أســــم العـضــــو :" value={formData.memberName} onChange={(v) => updateField('memberName', v)} labelWidth={labelRight} containerClass="col-span-8 pr-1" />
            <RadioBoxGroup
              label="الـــديـــانــــة :"
              name="religion"
              options={['مسلم', 'مسيحي']}
              value={formData.religion}
              onChange={(v) => updateField('religion', v)}
              labelWidth={labelLeft}
              containerClass="col-span-4 pl-1"
            />

            {/* Row 4 */}
            <div className="col-span-8 flex items-end">
              <span className={`whitespace-nowrap font-bold text-gray-900 inline-block shrink-0 ${labelRight}`}>الرقـم القـومــي :</span>
              <NidInput value={formData.nationalId} onChange={(v) => updateField('nationalId', v)} />
            </div>
            <RadioBoxGroup
              label="الـــنـــــوع :"
              name="gender"
              options={['ذكر', 'أنثى']}
              value={formData.gender}
              onChange={(v) => updateField('gender', v)}
              labelWidth={labelLeft}
              containerClass="col-span-4"
            />

            {/* Row 5 */}
            <DashedField label="سنة المـيـــلاد :" value={formData.birthYear} onChange={(v) => updateField('birthYear', v)} labelWidth={labelRight} containerClass="col-span-5" />
            <DashedField label="محافظة السكن :" value={formData.governorate} onChange={(v) => updateField('governorate', v)} labelWidth={labelMid} containerClass="col-span-3" />
            <DashedField label="الـــحــــــــــي :" value={formData.neighborhood} onChange={(v) => updateField('neighborhood', v)} labelWidth={labelLeft} containerClass="col-span-4" />

            {/* Row 6 */}
            <DashedField label="الـــعـــنــــوان :" value={formData.address} onChange={(v) => updateField('address', v)} labelWidth={labelRight} containerClass="col-span-8" />
            <DashedField label="المـحـــمـــــول :" value={formData.mobile} onChange={(v) => updateField('mobile', v)} labelWidth={labelLeft} containerClass="col-span-4" />

            {/* Row 7 */}
            <div className="col-span-12 flex items-end mt-1">
              <span className={`whitespace-nowrap font-bold text-gray-900 inline-block shrink-0 ${labelRight}`}>البريد الالكتروني :</span>
              <BoxStringInput value={formData.email} onChange={(v) => updateField('email', v)} length={26} />
            </div>
          </div>


        </section>

        {/* Section 2: Beneficiaries Data */}
        <section className="mb-6 mt-12">

          <div className="text-center mb-5">
            <h2 className="text-[20px] font-extrabold inline-block">بيانات المستفيدين مع العضو الأصلى</h2>
          </div>

          <table className="w-full border-collapse border border-black text-center text-[15px] relative">
            <thead className="bg-white">
              <tr>
                <th className="border border-black p-1.5 font-bold w-10">م</th>
                <th className="border border-black p-1.5 font-bold w-36">درجة القرابة</th>
                <th className="border border-black p-1.5 font-bold">اسم المستفيد</th>
                <th className="border border-black p-1.5 font-bold w-24">سنة الميلاد</th>
                <th className="border border-black p-1.5 font-bold w-[320px]">الرقم القومي</th>
              </tr>
            </thead>
            <tbody>
              {formData.beneficiaries.map((ben, i) => {
                const hasDocs = ben.documents && Object.keys(ben.documents).some(k => ben.documents[k] !== null);

                return (
                  <tr key={i} className="h-9 group relative">
                    <td className="border border-black p-0 font-bold text-gray-800 bg-white relative">
                      {i + 1}
                      {ben.kinship && (
                        <button
                          onClick={() => setActiveModalIndex(i)}
                          className={`print:hidden absolute -right-7 top-1.5 p-1 rounded-full bg-white shadow-sm border ${hasDocs ? 'text-green-600 border-green-200 hover:bg-green-50' : 'text-gray-400 border-gray-200 hover:bg-gray-50 hover:text-blue-600'} transition-all`}
                          title="إرفاق مستندات"
                        >
                          <PaperclipIcon />
                        </button>
                      )}
                    </td>
                    <td className="border border-black p-0 relative">
                      <select
                        className="w-full h-full text-center outline-none bg-transparent text-blue-700 font-bold focus:bg-blue-50 cursor-pointer"
                        value={ben.kinship}
                        onChange={(e) => updateBeneficiary(i, 'kinship', e.target.value)}
                      >
                        <option value=""></option>
                        <option value="أم">أم</option>
                        <option value="أب">أب</option>
                        <option value="ابن (18 سنة أو أقل)">ابن (18 سنة أو أقل)</option>
                        <option value="ابن (طالب جامعي)">ابن (طالب جامعي)</option>
                        <option value="ابن (خريج)">ابن (خريج)</option>
                        <option value="ابنة">ابنة</option>
                        <option value="زوج">زوج</option>
                        <option value="زوجة">زوجة</option>
                      </select>
                    </td>
                    <td className="border border-black p-0">
                      <input
                        className="w-full h-full px-2 outline-none bg-transparent text-blue-700 font-bold focus:bg-blue-50 text-right"
                        value={ben.name}
                        onChange={(e) => updateBeneficiary(i, 'name', e.target.value)}
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        className="w-full h-full text-center outline-none bg-transparent text-blue-700 font-bold focus:bg-blue-50"
                        value={ben.birthYear}
                        onChange={(e) => updateBeneficiary(i, 'birthYear', e.target.value)}
                        maxLength={4}
                      />
                    </td>
                    <td className="border border-black p-1 bg-white flex justify-center h-[37px] items-center">
                      <NidInput
                        value={ben.nationalId}
                        onChange={(v) => updateBeneficiary(i, 'nationalId', v)}
                        size="small"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* Section 3: Declaration */}
        <section className="mt-10 text-[15px] leading-relaxed">
          <div className="text-center mb-5">
            <h2 className="text-[20px] font-extrabold inline-block">إقــــــــرار</h2>
          </div>

          <div className="text-justify font-medium text-gray-900 leading-[2.5] text-[16px]">
            <span className="font-bold ml-2">أقر أنا /</span>
            <input
              type="text"
              value={formData.declarationName}
              onChange={(e) => updateField('declarationName', e.target.value)}
              className="inline-block min-w-[300px] border-b-[2px] border-dashed border-gray-600 outline-none bg-transparent px-2 text-center text-blue-700 font-bold focus:border-blue-500 -translate-y-[2px]"
            />
            <span className="font-bold mr-2">أن جميع البيانات بعاليه صحيحة وكذلك صور المستفيدين وأن الأولاد في الدراسة ولم يتخرجوا وأن بناتي المدونة أسماءهم لم يتزوجوا بعد واتعهد باخطار المشروع فور زواجهم <span className="font-bold underline decoration-red-400 underline-offset-4">مع العلم انه لا يجوز استفادة الابن بعد التخرج أو الابنة بعد الزواج واذا ثبت عكس ذلك أتحمل المسئولية المالية والقانونية فورا مع عدم رد قيمة الاشتراك وتحمل كافة التكاليف وللمشروع الحق في اتخاذ اي اجراء مناسب لذلك .</span> وأقر بالموافقة علي النظام العلاجي الذي يسير عليه المشروع وأي تعديلات تتم اثناء العام الصادرة من لجنة العلاج العليا للمشروع وأتبرع تكافلا بمبلغ اشتراكي لعلاج زملائى المشتركين وأتعاون معهم في سداد قيمة العلاج.</span>
          </div>

          <div className="mt-8 flex justify-end">
            <div className="text-center w-48 ml-8">
              <p className="font-bold mb-8">المقر بما فيه</p>
              <div className="border-b-[2px] border-dotted border-gray-600 w-full"></div>
            </div>
          </div>
        </section>

        {/* Fee Summary Panel — auto-computed from tier + beneficiaries */}
        <FeeSummaryPanel result={feeResult} />

      </div>
    </div>
  );
}