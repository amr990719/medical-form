import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSubmissionStatus } from '../hooks/useSubmissionStatus';
import ProgressStepper from '../components/shared/ProgressStepper';

export default function WaitingPage() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { logout } = useAuth();
  const memberName = location.state?.memberName || '';
  const docId      = location.state?.docId      || '';

  const { referenceNumber, loading } = useSubmissionStatus(docId || null);

  const [checkmarkDone, setCheckmarkDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setCheckmarkDone(true), 1000);
    return () => clearTimeout(t);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // The reference number is ready when it's a non-empty string
  const refReady = referenceNumber && referenceNumber.trim() !== '';

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--nb-teal-light)', fontFamily: "'Cairo', sans-serif", display: 'flex', flexDirection: 'column' }}>
      <ProgressStepper currentStep={5} />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        <div style={{
          background: 'var(--nb-white)', borderRadius: 20, maxWidth: 440, width: '100%',
          padding: '32px 28px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}>
          {/* Animated checkmark circle */}
          <div style={{
            width: 120, height: 120, borderRadius: '50%', background: 'var(--nb-teal)',
            margin: '0 auto 28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: checkmarkDone ? 'pulsonce 0.3s ease-out' : 'none',
          }}>
            <svg viewBox="0 0 100 100" width="60" height="60" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
              <polyline
                points="20,55 40,75 80,30"
                strokeDasharray="100"
                style={{ strokeDashoffset: 100, animation: 'checkDraw 0.8s ease-out 0.2s forwards' }}
              />
            </svg>
          </div>

          {/* Title */}
          <h2 style={{ textAlign: 'center', fontWeight: 700, fontSize: 22, color: 'var(--nb-teal)', marginBottom: 12 }}>
            تم استلام طلبك بنجاح!
          </h2>

          {/* Member name pill */}
          {memberName && (
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <span style={{
                display: 'inline-block', background: 'var(--nb-banana-light)', color: 'var(--nb-charcoal)',
                borderRadius: 20, padding: '4px 16px', fontWeight: 600, fontSize: 15,
              }}>
                {memberName}
              </span>
            </div>
          )}

          {/* Reference number — shimmer until Cloud Function populates it */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--nb-muted)', marginBottom: 6 }}>رقم المرجع</p>
            <div style={{ background: 'var(--nb-smoke)', borderRadius: 10, padding: '12px 16px', textAlign: 'center', minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {refReady ? (
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 18, color: 'var(--nb-charcoal)', letterSpacing: 2, animation: 'fadeIn 0.4s ease-out' }}>
                  {referenceNumber}
                </span>
              ) : (
                <span className="shimmer" style={{ width: 140, height: 24, borderRadius: 4 }} />
              )}
            </div>
          </div>

          {/* Status timeline */}
          <div style={{ marginBottom: 20 }}>
            {[
              { label: 'تم التقديم ✓', status: 'completed' },
              { label: 'قيد المراجعة',  status: 'current' },
              { label: 'إشعار بالنتيجة', status: 'upcoming' },
            ].map((item, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: item.status === 'completed' ? 'var(--nb-teal)'
                               : item.status === 'current'   ? 'var(--nb-banana)'
                               : 'var(--nb-border)',
                  }}>
                    {item.status === 'completed' && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="5,12 10,17 19,7"/></svg>
                    )}
                    {item.status === 'current' && (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--nb-charcoal)', animation: 'pulsonce 1.5s ease-in-out infinite' }} />
                    )}
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{ width: 2, height: 24, background: i === 0 ? 'var(--nb-teal)' : 'var(--nb-border)', margin: '2px 0' }} />
                  )}
                </div>
                <span style={{ fontSize: 14, fontWeight: 500, color: item.status === 'upcoming' ? 'var(--nb-muted)' : 'var(--nb-charcoal)', paddingTop: 2 }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Info note */}
          <div style={{ borderRight: '3px solid var(--nb-banana)', paddingRight: 10, fontSize: 13, color: 'var(--nb-muted)', marginBottom: 24 }}>
            سيتم التواصل معك خلال 3-5 أيام عمل
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                width: '100%', height: 48, background: 'var(--nb-banana)', border: 'none', borderRadius: 10,
                fontFamily: "'Cairo', sans-serif", fontWeight: 700, fontSize: 15, color: 'var(--nb-charcoal)',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--nb-banana-deep)'}
              onMouseOut={e => e.currentTarget.style.background = 'var(--nb-banana)'}
            >
              عرض طلباتي
            </button>
            <button
              onClick={handleLogout}
              style={{
                width: '100%', height: 48, background: 'transparent', border: '1.5px solid var(--nb-teal)',
                borderRadius: 10, fontFamily: "'Cairo', sans-serif", fontWeight: 600, fontSize: 15,
                color: 'var(--nb-teal)', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--nb-teal-light)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
