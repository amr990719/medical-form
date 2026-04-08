import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuthPage from '../auth/AuthPage';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div dir="rtl" style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Cairo', sans-serif" }}>

      {/* ── Left teal panel (hidden on mobile) ─────────────────────────── */}
      <style>{`
        @media (max-width: 767px) { #nb-landing-left { display: none !important; } }
      `}</style>
      <div id="nb-landing-left" style={{
        width: '40%',
        background: 'var(--nb-teal)',
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
        `,
        backgroundSize: '24px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 32px',
        flexShrink: 0,
      }}>
        {/* Union emblem */}
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.4)',
          background: 'rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 700, fontSize: 28, color: 'white' }}>نق</span>
        </div>

        {/* Title */}
        <p style={{ fontWeight: 700, fontSize: 18, color: 'white', marginTop: 16, textAlign: 'center', lineHeight: 1.5 }}>
          اتحاد نقابات المهن الطبية
        </p>
        <p style={{ fontWeight: 500, fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 4 }}>
          مشروع علاج الأعضاء وأسرهم
        </p>

        {/* ECG SVG */}
        <div style={{ marginTop: 28 }}>
          <svg viewBox="0 0 350 60" width="220" height="60">
            <polyline
              points="0,30 40,30 55,10 65,50 75,20 85,40 95,30 350,30"
              fill="none"
              stroke="rgba(255,255,255,0.8)"
              strokeWidth="2"
              strokeDasharray="350"
              style={{ animation: 'ecgDraw 3.5s ease-in-out infinite' }}
            />
          </svg>
        </div>

        {/* Trust badges */}
        <div style={{ display: 'flex', gap: 8, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['بيانات محمية', 'معتمد رسمياً', '4 نقابات طبية'].map(badge => (
            <span key={badge} style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 20,
              padding: '5px 12px',
              fontWeight: 500,
              fontSize: 11,
              color: 'white',
              fontFamily: "'Cairo', sans-serif",
            }}>
              {badge}
            </span>
          ))}
        </div>
      </div>

      {/* ── Right auth panel ────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        background: 'var(--nb-smoke)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(24px, 5vw, 48px) clamp(16px, 4vw, 32px)',
        overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <AuthPage onAuthSuccess={() => navigate('/form')} />
        </div>
      </div>

    </div>
  );
}
