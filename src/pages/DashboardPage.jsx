import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';

const STATUS_CONFIG = {
  submitted:      { bg: '#FDFBE8', color: '#744210', label: 'مقدم' },
  under_review:   { bg: '#EBF4FF', color: '#2B6CB0', label: 'قيد المراجعة', pulse: true },
  approved:       { bg: '#E3F8F0', color: '#0A7A55', label: 'مقبول', check: true },
  rejected:       { bg: '#FFF5F5', color: '#742A2A', label: 'مرفوض' },
  needs_revision: { bg: '#FFFBEB', color: '#92400E', label: 'يحتاج مراجعة' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.submitted;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: cfg.bg, color: cfg.color,
      borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600,
    }}>
      {cfg.pulse && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3182CE', animation: 'pulsonce 1.5s ease-in-out infinite', display: 'inline-block' }} />
      )}
      {cfg.check && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="5,12 10,17 19,7"/></svg>
      )}
      {cfg.label}
    </span>
  );
}

function EmptyState({ onNew }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      {/* Clipboard SVG */}
      <svg width="60" height="70" viewBox="0 0 60 70" fill="none" style={{ margin: '0 auto 20px', display: 'block' }}>
        <rect x="5" y="12" width="50" height="53" rx="4" fill="#E8EAED"/>
        <rect x="20" y="5" width="20" height="14" rx="4" fill="#CBD5E0"/>
        <circle cx="30" cy="12" r="3" fill="#fff"/>
        {[22, 32, 42].map(y => <rect key={y} x="14" y={y} width="32" height="3" rx="1.5" fill="#CBD5E0"/>)}
      </svg>
      <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--nb-slate)', marginBottom: 20 }}>لم تقدم أي طلبات بعد</p>
      <button
        onClick={onNew}
        style={{
          background: 'var(--nb-banana)', border: 'none', borderRadius: 10,
          padding: '12px 28px', fontFamily: "'Cairo', sans-serif", fontWeight: 700,
          fontSize: 14, color: 'var(--nb-charcoal)', cursor: 'pointer', transition: 'all 0.2s',
        }}
        onMouseOver={e => e.currentTarget.style.background = 'var(--nb-banana-deep)'}
        onMouseOut={e => e.currentTarget.style.background = 'var(--nb-banana)'}
      >
        تقديم طلب جديد
      </button>
    </div>
  );
}

function ApplicationCard({ docData, docId, onReupload }) {
  const [expanded, setExpanded] = useState(false);
  const canReupload = ['needs_revision', 'rejected'].includes(docData.applicationStatus);

  const formatDate = (ts) => {
    if (!ts) return '—';
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return '—'; }
  };

  return (
    <div
      style={{
        background: 'var(--nb-white)', borderRadius: 14, border: '1px solid var(--nb-border)',
        marginBottom: 12, overflow: 'hidden', transition: 'border-color 0.2s',
      }}
      onMouseOver={e => e.currentTarget.style.borderColor = 'var(--nb-banana-deep)'}
      onMouseOut={e => e.currentTarget.style.borderColor = 'var(--nb-border)'}
    >
      {/* Card header — click to expand */}
      <div
        onClick={() => setExpanded(x => !x)}
        style={{ padding: '16px 20px', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: 'var(--nb-charcoal)' }}>
            {docData.referenceNumber || <em style={{ color: 'var(--nb-muted)', fontFamily: "'Cairo', sans-serif", fontWeight: 400 }}>جارٍ إنشاء الرقم...</em>}
          </span>
          <StatusBadge status={docData.applicationStatus} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--nb-muted)' }}>{formatDate(docData.submittedAt)}</span>
          {docData.feeSnapshot?.total != null && (
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--nb-teal)' }}>
              {docData.feeSnapshot.total.toLocaleString('ar-EG')} ج.م
            </span>
          )}
        </div>
      </div>

      {/* Expandable detail section */}
      <div style={{
        maxHeight: expanded ? 600 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.25s ease',
      }}>
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--nb-border)' }}>

          {/* Fee breakdown */}
          {docData.feeSnapshot?.breakdown?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--nb-slate)', marginBottom: 6 }}>تفاصيل الرسوم</p>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <tbody>
                  {docData.feeSnapshot.breakdown.map((item, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'var(--nb-smoke)' : 'var(--nb-white)' }}>
                      <td style={{ padding: '6px 8px', color: 'var(--nb-slate)' }}>{item.label}</td>
                      <td style={{ padding: '6px 8px', color: 'var(--nb-teal)', fontWeight: 600, textAlign: 'left' }} dir="ltr">
                        {item.fee?.toLocaleString('ar-EG')} ج.م
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Review notes */}
          {docData.reviewNotes && (
            <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--nb-smoke)', borderRadius: 8 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--nb-slate)', marginBottom: 4 }}>ملاحظات المراجع</p>
              <p style={{ fontSize: 13, color: 'var(--nb-muted)', fontStyle: 'italic' }}>{docData.reviewNotes}</p>
            </div>
          )}

          {/* Receipt thumbnail */}
          {docData.receiptImageUrl && (
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--nb-slate)', marginBottom: 6 }}>إيصال الدفع</p>
              <img
                src={docData.receiptImageUrl}
                alt="إيصال الدفع"
                style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--nb-border)', cursor: 'pointer' }}
                onClick={() => window.open(docData.receiptImageUrl, '_blank')}
                title="اضغط لعرض الإيصال"
              />
            </div>
          )}

          {/* Re-upload button */}
          {canReupload && (
            <button
              onClick={() => onReupload(docId)}
              style={{
                marginTop: 16, background: 'var(--nb-banana)', border: 'none', borderRadius: 10,
                padding: '10px 20px', fontFamily: "'Cairo', sans-serif", fontWeight: 700,
                fontSize: 13, color: 'var(--nb-charcoal)', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--nb-banana-deep)'}
              onMouseOut={e => e.currentTarget.style.background = 'var(--nb-banana)'}
            >
              رفع إيصال جديد
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate     = useNavigate();
  const { user, logout } = useAuth();
  const [docs,    setDocs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const q = query(
          collection(db, 'members'),
          where('userId', '==', user.uid),
          orderBy('submittedAt', 'desc')
        );
        const snap = await getDocs(q);
        setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
        setError('حدث خطأ أثناء تحميل الطلبات');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleReupload = (docId) => {
    navigate('/receipt', { state: { existingMemberId: docId } });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--nb-smoke)', fontFamily: "'Cairo', sans-serif" }}>
      {/* Header bar */}
      <div style={{
        background: 'var(--nb-white)', borderBottom: '1px solid var(--nb-border)',
        padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button
          onClick={handleLogout}
          style={{
            background: 'none', border: 'none', color: 'var(--nb-muted)', cursor: 'pointer',
            fontSize: 13, fontFamily: "'Cairo', sans-serif", marginRight: 'auto',
            transition: 'color 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.color = 'var(--nb-danger)'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--nb-muted)'}
        >
          تسجيل الخروج
        </button>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h1 style={{ fontWeight: 700, fontSize: 22, color: 'var(--nb-charcoal)', margin: 0 }}>طلباتي</h1>
          <button
            onClick={() => navigate('/form')}
            style={{
              background: 'var(--nb-banana)', border: 'none', borderRadius: 10,
              padding: '10px 20px', fontFamily: "'Cairo', sans-serif", fontWeight: 700,
              fontSize: 14, color: 'var(--nb-charcoal)', cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--nb-banana-deep)'}
            onMouseOut={e => e.currentTarget.style.background = 'var(--nb-banana)'}
          >
            تقديم طلب جديد
          </button>
        </div>

        {!loading && docs.length > 0 && (
          <p style={{ fontSize: 13, color: 'var(--nb-muted)', marginBottom: 20 }}>
            لديك {docs.length} طلب مسجل
          </p>
        )}

        {error && (
          <div style={{ background: 'var(--nb-danger-light)', borderRight: '3px solid var(--nb-danger)', borderRadius: '0 8px 8px 0', padding: '10px 14px', fontSize: 13, color: '#742A2A', marginBottom: 16 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ width: 36, height: 36, border: '4px solid var(--nb-border)', borderTopColor: 'var(--nb-teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : docs.length === 0 ? (
          <EmptyState onNew={() => navigate('/form')} />
        ) : (
          docs.map(doc => (
            <ApplicationCard
              key={doc.id}
              docId={doc.id}
              docData={doc}
              onReupload={handleReupload}
            />
          ))
        )}
      </div>
    </div>
  );
}
