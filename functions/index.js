/**
 * functions/index.js
 * ==================
 * Firebase Cloud Functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

/**
 * generateReferenceNumber
 * -----------------------
 * Triggered automatically when a new member document is created.
 * Uses a Firestore transaction on /metadata/submissionCounter to generate
 * a sequential, zero-padded reference number: MED-YYYY-000001
 */
exports.generateReferenceNumber = functions.firestore
  .document('members/{memberId}')
  .onCreate(async (snap, context) => {
    const memberId = context.params.memberId;
    const counterRef = db.collection('metadata').doc('submissionCounter');

    try {
      const referenceNumber = await db.runTransaction(async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        const currentCount = counterDoc.exists ? (counterDoc.data().count || 0) : 0;
        const newCount = currentCount + 1;

        transaction.set(counterRef, { count: newCount }, { merge: true });

        const year = new Date().getFullYear();
        return `MED-${year}-${String(newCount).padStart(6, '0')}`;
      });

      await db.collection('members').doc(memberId).update({
        referenceNumber,
        referenceGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      functions.logger.info(`Generated ${referenceNumber} for member ${memberId}`);
    } catch (error) {
      functions.logger.error(`Error generating reference number for ${memberId}:`, error);
    }

    return null;
  });

/**
 * verifyMemberStatus
 * ------------------
 * HTTPS Callable — returns the status of a member's application.
 * Only the owner of the document may call this.
 */
exports.verifyMemberStatus = functions.https.onCall(async (data, context) => {
  // Auth guard
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'يجب تسجيل الدخول للوصول إلى هذه الخدمة'
    );
  }

  const { memberId } = data;
  if (!memberId || typeof memberId !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'معرّف الطلب مطلوب'
    );
  }

  const memberRef = db.collection('members').doc(memberId);
  const memberDoc = await memberRef.get();

  if (!memberDoc.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      'لم يتم العثور على الطلب'
    );
  }

  const memberData = memberDoc.data();

  // Ownership check
  if (memberData.userId !== context.auth.uid) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'ليس لديك صلاحية الوصول لهذا الطلب'
    );
  }

  return {
    referenceNumber:   memberData.referenceNumber   || '',
    applicationStatus: memberData.applicationStatus || 'submitted',
    submittedAt:       memberData.submittedAt        || null,
    reviewNotes:       memberData.reviewNotes        || '',
  };
});
