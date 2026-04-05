/**
 * functions/index.js
 * ==================
 * Firebase Cloud Functions — Secure Paymob Payment Gateway
 *
 * ╔══════════════════════════════════════════════════════════╗
 * ║  ZERO API KEYS IN THE FRONTEND — All secrets live here  ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * Before deploying, set your Paymob credentials via:
 *
 *   firebase functions:config:set \
 *     paymob.api_key="YOUR_PAYMOB_API_KEY" \
 *     paymob.integration_id="YOUR_INTEGRATION_ID" \
 *     paymob.iframe_id="YOUR_IFRAME_ID"
 *
 * Then deploy with:
 *   firebase deploy --only functions
 *
 * Exported Functions:
 *   createPaymobPayment — HTTPS Callable — performs the full 3-step Paymob
 *                         handshake and returns { payment_key, iframe_id }
 */

const functions   = require('firebase-functions');
const admin       = require('firebase-admin');
const axios       = require('axios');

admin.initializeApp();

// ─── Paymob API Base URL ─────────────────────────────────────────────────────
const PAYMOB_BASE = 'https://accept.paymob.com/api';

// ─── Callable Function ───────────────────────────────────────────────────────

/**
 * createPaymobPayment
 * -------------------
 * HTTPS Callable function that executes the 3-step Paymob checkout handshake:
 *
 *   Step 1 — Authentication
 *     POST /auth/tokens  →  { token }
 *
 *   Step 2 — Order Registration
 *     POST /ecommerce/orders  →  { id }
 *
 *   Step 3 — Payment Key Generation
 *     POST /acceptance/payment_keys  →  { token }  (this is the payment_key)
 *
 * @param {{ amount_cents: number, billing_data: object }} data
 *   amount_cents  : Total fee in piastres (e.g., 85000 for 850 EGP)
 *   billing_data  : { first_name, last_name, email, phone_number, ... }
 *
 * @returns {{ payment_key: string, iframe_id: string }}
 */
exports.createPaymobPayment = functions.https.onCall(async (data, context) => {
  // ── Auth guard: user must be signed in ────────────────────────────────────
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'يجب تسجيل الدخول لإتمام عملية الدفع.'
    );
  }

  // ── Read Paymob config from Firebase environment ──────────────────────────
  const config = functions.config();
  const PAYMOB_API_KEY      = config.paymob?.api_key;
  const PAYMOB_INTEGRATION  = config.paymob?.integration_id;
  const PAYMOB_IFRAME_ID    = config.paymob?.iframe_id;

  if (!PAYMOB_API_KEY || !PAYMOB_INTEGRATION || !PAYMOB_IFRAME_ID) {
    functions.logger.error('Paymob config not set. Run firebase functions:config:set paymob.*');
    throw new functions.https.HttpsError(
      'failed-precondition',
      'بيانات بوابة الدفع غير مهيأة. يرجى التواصل مع الدعم الفني.'
    );
  }

  const { amount_cents, billing_data } = data;

  // ── Input validation ──────────────────────────────────────────────────────
  if (!amount_cents || typeof amount_cents !== 'number' || amount_cents <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'مبلغ الدفع غير صحيح.');
  }

  try {
    // ════════════════════════════════════════════════════════════════════════
    // STEP 1 — Authentication: obtain a short-lived auth token from Paymob
    // ════════════════════════════════════════════════════════════════════════
    functions.logger.info('[Paymob] Step 1: Authenticating…');

    const authResponse = await axios.post(`${PAYMOB_BASE}/auth/tokens`, {
      api_key: PAYMOB_API_KEY,
    });

    const authToken = authResponse.data?.token;
    if (!authToken) {
      throw new Error('Paymob auth failed — no token in response');
    }

    functions.logger.info('[Paymob] Step 1: Auth token obtained.');

    // ════════════════════════════════════════════════════════════════════════
    // STEP 2 — Order Registration: create an order to associate the payment with
    // ════════════════════════════════════════════════════════════════════════
    functions.logger.info('[Paymob] Step 2: Registering order…');

    const orderResponse = await axios.post(`${PAYMOB_BASE}/ecommerce/orders`, {
      auth_token:         authToken,
      delivery_needed:    false,
      amount_cents:       amount_cents,
      currency:           'EGP',
      // Use the Firebase user UID as a merchant order reference for traceability
      merchant_order_id:  context.auth.uid,
      items:              [],  // No physical items for a subscription payment
    });

    const orderId = orderResponse.data?.id;
    if (!orderId) {
      throw new Error('Paymob order registration failed — no order ID in response');
    }

    functions.logger.info('[Paymob] Step 2: Order registered. ID =', orderId);

    // ════════════════════════════════════════════════════════════════════════
    // STEP 3 — Payment Key: generate a one-time token for the iframe
    // ════════════════════════════════════════════════════════════════════════
    functions.logger.info('[Paymob] Step 3: Generating payment key…');

    const paymentKeyResponse = await axios.post(`${PAYMOB_BASE}/acceptance/payment_keys`, {
      auth_token:      authToken,
      amount_cents:    amount_cents,
      expiration:      3600,          // Key valid for 1 hour
      order_id:        orderId,
      currency:        'EGP',
      integration_id:  parseInt(PAYMOB_INTEGRATION, 10),
      billing_data:    {
        // Paymob requires these billing fields even for digital payments
        first_name:    billing_data?.first_name    || 'عضو',
        last_name:     billing_data?.last_name     || 'النقابة',
        email:         billing_data?.email         || 'n/a@n/a.com',
        phone_number:  billing_data?.phone_number  || '+20000000000',
        apartment:     'NA',
        floor:         'NA',
        street:        'NA',
        building:      'NA',
        shipping_method: 'NA',
        postal_code:   'NA',
        city:          'Cairo',
        country:       'EG',
        state:         'NA',
      },
    });

    const paymentKey = paymentKeyResponse.data?.token;
    if (!paymentKey) {
      throw new Error('Paymob payment key generation failed — no token in response');
    }

    functions.logger.info('[Paymob] Step 3: Payment key generated successfully.');

    // ── Return the key and iframe ID to the frontend ──────────────────────
    return {
      payment_key: paymentKey,
      iframe_id:   PAYMOB_IFRAME_ID,
    };

  } catch (error) {
    // Log the full error server-side but return a clean message to the client
    functions.logger.error('[Paymob] Handshake failed:', error?.response?.data || error.message);

    throw new functions.https.HttpsError(
      'internal',
      'حدث خطأ أثناء الاتصال ببوابة الدفع. يرجى المحاولة مرة أخرى.'
    );
  }
});
