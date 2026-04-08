import React from 'react';

const STEPS = [
  { n: 1, label: 'البيانات' },
  { n: 2, label: 'المستفيدون' },
  { n: 3, label: 'المستندات' },
  { n: 4, label: 'الإيصال' },
  { n: 5, label: 'التأكيد' },
];

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="5,12 10,17 19,7" />
    </svg>
  );
}

export default function ProgressStepper({ currentStep = 1 }) {
  return (
    <div className="no-print" style={{
      background: 'var(--nb-white)',
      borderBottom: '1px solid var(--nb-border)',
      padding: '14px 24px',
      position: 'sticky',
      top: 0,
      zIndex: 10,
      fontFamily: "'Cairo', sans-serif",
    }}>
      <div style={{ display: 'flex', alignItems: 'center', maxWidth: 640, margin: '0 auto' }}>
        {STEPS.map((step, idx) => {
          const isCompleted = step.n < currentStep;
          const isCurrent   = step.n === currentStep;
          const isUpcoming  = step.n > currentStep;

          const circleStyle = {
            width: 32,
            height: 32,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontWeight: 700,
            fontSize: 14,
            transition: 'all 0.3s ease',
            ...(isCompleted ? {
              background: 'var(--nb-teal)',
              color: 'white',
            } : isCurrent ? {
              background: 'var(--nb-banana)',
              color: 'var(--nb-charcoal)',
              animation: 'stepPulse 2s ease-out infinite',
            } : {
              background: 'var(--nb-border)',
              color: 'var(--nb-muted)',
            }),
          };

          return (
            <React.Fragment key={step.n}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={circleStyle}>
                  {isCompleted ? <CheckIcon /> : step.n}
                </div>
                <span style={{
                  fontSize: 11,
                  fontWeight: isCurrent ? 600 : 400,
                  color: isCurrent ? 'var(--nb-charcoal)' : 'var(--nb-muted)',
                  whiteSpace: 'nowrap',
                }} className="stepper-label">
                  {step.label}
                </span>
              </div>

              {idx < STEPS.length - 1 && (
                <div style={{
                  flex: 1,
                  height: 2,
                  background: isCompleted ? 'var(--nb-teal)' : 'var(--nb-border)',
                  margin: '0 6px',
                  marginBottom: 18,
                  transition: 'background 0.3s ease',
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .stepper-label { display: none; }
        }
      `}</style>
    </div>
  );
}
