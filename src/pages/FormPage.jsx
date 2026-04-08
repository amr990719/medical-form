import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFormData } from '../context/FormContext';
import MemberSection from '../components/form/MemberSection';
import BeneficiaryTable from '../components/form/BeneficiaryTable';
import DeclarationSection from '../components/form/DeclarationSection';
import FeeSummaryPanel from '../components/form/FeeSummaryPanel';
import ProgressStepper from '../components/shared/ProgressStepper';

export default function FormPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { formData, mainMemberDocs } = useFormData();
  const [validationErrors, setValidationErrors] = useState([]);
  const errorPanelRef = useRef(null);

  const handleProceed = async () => {
    const { validateForm } = await import('../utils/validateForm');
    const result = validateForm(formData, mainMemberDocs);
    if (!result.valid) {
      setValidationErrors(result.errors);
      setTimeout(() => {
        errorPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
      return;
    }
    setValidationErrors([]);
    navigate('/receipt');
  };

  const handlePrint = () => window.print();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--nb-smoke)', fontFamily: "'Cairo', sans-serif" }}>

      {/* Progress stepper */}
      <ProgressStepper currentStep={1} />

      {/* Top bar */}
      <div className="no-print" style={{
        position: 'sticky',
        top: 61,
        zIndex: 20,
        background: 'var(--nb-white)',
        borderBottom: '1px solid var(--nb-border)',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}>
        <button
          onClick={handleLogout}
          title="تسجيل الخروج"
          style={{
            width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--nb-border)',
            background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', transition: 'all 0.2s',
          }}
          onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--nb-danger)'; e.currentTarget.style.color = 'var(--nb-danger)'; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--nb-border)'; e.currentTarget.style.color = 'inherit'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>

        <span style={{ fontWeight: 600, fontSize: 16, color: 'var(--nb-charcoal)' }}>استمارة اشتراك — 2026</span>

        <button
          onClick={handlePrint}
          title="طباعة"
          style={{
            width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--nb-border)',
            background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', transition: 'all 0.2s',
          }}
          onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--nb-teal)'; e.currentTarget.style.color = 'var(--nb-teal)'; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--nb-border)'; e.currentTarget.style.color = 'inherit'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>
          </svg>
        </button>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 16px 120px' }}>

        {/* Validation error panel */}
        {validationErrors.length > 0 && (
          <div
            ref={errorPanelRef}
            className="no-print"
            style={{
              background: 'var(--nb-white)',
              borderRight: '4px solid var(--nb-danger)',
              borderRadius: '0 12px 12px 0',
              padding: '16px 20px',
              marginBottom: 16,
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--nb-danger)', marginBottom: 8 }}>
              يرجى تصحيح الأخطاء التالية قبل المتابعة:
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {validationErrors.map((err, i) => (
                <li key={i} style={{ fontSize: 13, color: 'var(--nb-charcoal)', padding: '2px 0' }}>• {err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* A4 form card */}
        <div style={{
          background: 'var(--nb-white)',
          border: '1px solid var(--nb-border)',
          borderRadius: 16,
          padding: '20px 24px',
          marginBottom: 16,
        }}>
          {/* Print A4 styles */}
          <style>{`
            @media print {
              @page { size: A4; margin: 0; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; }
              .no-print { display: none !important; }
            }
          `}</style>

          <div className="w-full print:w-[210mm] print:min-h-[297mm] print:p-6 print:m-0 flex flex-col">
            <MemberSection />
            <BeneficiaryTable />
            <DeclarationSection />
          </div>
        </div>

        {/* Fee summary card */}
        <div style={{
          background: 'var(--nb-white)',
          borderRight: '4px solid var(--nb-teal)',
          borderRadius: '0 12px 12px 0',
          padding: '16px 20px',
          marginBottom: 16,
        }} className="no-print">
          <FeeSummaryPanel />
        </div>
      </div>

      {/* Sticky bottom action bar */}
      <div className="no-print" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        background: 'var(--nb-white)',
        borderTop: '1px solid var(--nb-border)',
        padding: '12px 24px',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}>
        <button
          onClick={handleLogout}
          style={{
            background: 'none', border: 'none', color: 'var(--nb-muted)', cursor: 'pointer',
            fontSize: 14, fontFamily: "'Cairo', sans-serif", marginRight: 'auto', padding: '0 8px',
            transition: 'color 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.color = 'var(--nb-danger)'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--nb-muted)'}
        >
          تسجيل الخروج
        </button>

        <button
          onClick={handlePrint}
          style={{
            height: 48, padding: '0 24px', borderRadius: 10,
            border: '1.5px solid var(--nb-teal)', background: 'transparent', color: 'var(--nb-teal)',
            fontFamily: "'Cairo', sans-serif", fontWeight: 600, fontSize: 14, cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.background = 'var(--nb-teal-light)'}
          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
        >
          طباعة
        </button>

        <button
          onClick={handleProceed}
          style={{
            height: 48, padding: '0 28px', borderRadius: 10,
            background: 'var(--nb-banana)', border: 'none', color: 'var(--nb-charcoal)',
            fontFamily: "'Cairo', sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.background = 'var(--nb-banana-deep)'}
          onMouseOut={e => e.currentTarget.style.background = 'var(--nb-banana)'}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          متابعة لرفع الإيصال
        </button>
      </div>
    </div>
  );
}
