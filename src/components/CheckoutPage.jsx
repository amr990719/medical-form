/**
 * CheckoutPage.jsx
 * ================
 * Secure Paymob payment checkout component.
 *
 * Flow:
 *   1. On mount, calls the Firebase Cloud Function `createPaymobPayment`
 *      (never exposes API keys to the browser).
 *   2. Renders the Paymob hosted iframe with the returned payment_key.
 *   3. Listens for a `message` event from the iframe to detect success/failure.
 *   4. On success → calls onPaymentSuccess() so App.jsx can upload data and redirect.
 *
 * Props:
 *   amountCents     {number}   - Total fee in Egyptian Piastres (fee_EGP × 100)
 *   billingData     {object}   - { first_name, last_name, email, phone_number }
 *   memberName      {string}   - Shown in the header
 *   onPaymentSuccess()         - Called when payment is confirmed
 *   onCancel()                 - Called when user clicks "رجوع"
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getFunctions, httpsCallable }              from 'firebase/functions';

// ─── Icons ───────────────────────────────────────────────────────────────────

const LoaderIcon = () => (
  <svg className="animate-spin w-8 h-8 text-blue-600" xmlns="http://www.w3.org/2000/svg"
    fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path className="opacity-75" fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
  </svg>
);

// ─── Component ───────────────────────────────────────────────────────────────

export default function CheckoutPage({ amountCents, billingData, memberName, onPaymentSuccess, onCancel }) {
  const [paymentKey, setPaymentKey]   = useState(null);  // Received from Firebase Function
  const [iframeId,  setIframeId]      = useState(null);  // Received from Firebase Function
  const [loading,   setLoading]       = useState(true);  // Fetching payment key
  const [error,     setError]         = useState('');    // Error message if Function call fails

  // ── Step 1: Fetch payment key from Firebase Function on mount ─────────────
  useEffect(() => {
    const fetchPaymentKey = async () => {
      try {
        const functions = getFunctions();
        const createPayment = httpsCallable(functions, 'createPaymobPayment');

        const result = await createPayment({
          amount_cents: amountCents,
          billing_data: billingData,
        });

        setPaymentKey(result.data.payment_key);
        setIframeId(result.data.iframe_id);
      } catch (err) {
        console.error('[CheckoutPage] Failed to fetch payment key:', err);
        setError('فشل الاتصال ببوابة الدفع. يرجى المحاولة مرة أخرى.');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentKey();
  }, [amountCents, billingData]);

  // ── Step 2: Listen for payment result messages from the Paymob iframe ─────
  const handleIframeMessage = useCallback((event) => {
    // Only trust messages from Paymob's domain
    if (!event.origin.includes('paymob.com')) return;

    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

      // Paymob sends `{ success: true }` on successful payment
      if (data?.success === true) {
        onPaymentSuccess();
      } else if (data?.success === false) {
        setError('لم تكتمل عملية الدفع. يمكنك المحاولة مرة أخرى أو الرجوع لتعديل الاستمارة.');
      }
    } catch {
      // Non-JSON messages from the iframe — ignore
    }
  }, [onPaymentSuccess]);

  useEffect(() => {
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, [handleIframeMessage]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div dir="rtl" className="min-h-screen bg-gray-200 flex flex-col items-center justify-center p-4 font-sans text-gray-900">

      {/* Header card */}
      <div className="bg-white w-full max-w-2xl shadow-2xl border border-gray-300 rounded-xl overflow-hidden">
        <div className="bg-blue-700 text-white p-5 flex justify-between items-center">
          <h2 className="text-xl font-extrabold">بوابة الدفع الإلكتروني — Paymob</h2>
          <span className="text-sm font-bold opacity-80">المبلغ: {(amountCents / 100).toLocaleString('ar-EG')} ج.م</span>
        </div>

        <div className="p-4 border-b border-gray-100 bg-blue-50">
          <p className="text-sm font-bold text-gray-700">
            مرحباً <span className="text-blue-700">{memberName}</span> — يرجى إتمام الدفع في النافذة أدناه.
          </p>
        </div>

        {/* Content area */}
        <div className="p-6">
          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center gap-4 py-12">
              <LoaderIcon />
              <p className="text-gray-600 font-bold">جارٍ الاتصال ببوابة الدفع…</p>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-700 font-bold mb-4">{error}</p>
              <button
                onClick={onCancel}
                className="bg-gray-200 text-gray-800 font-bold px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                رجوع لتعديل الاستمارة
              </button>
            </div>
          )}

          {/* Paymob iframe */}
          {!loading && !error && paymentKey && iframeId && (
            <iframe
              title="Paymob Payment"
              src={`https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentKey}`}
              className="w-full rounded-lg border border-gray-200"
              style={{ height: '600px' }}
              allowFullScreen
            />
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t p-4 flex justify-between items-center">
          <button
            onClick={onCancel}
            className="text-gray-600 font-bold hover:text-red-600 transition-colors text-sm"
          >
            ← رجوع لتعديل الاستمارة
          </button>
          <div className="flex items-center gap-2 text-xs text-gray-400 font-bold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            اتصال آمن عبر Paymob
          </div>
        </div>
      </div>
    </div>
  );
}
