import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * useSubmissionStatus — real-time listener on a member's Firestore document.
 * @param {string | null} memberId
 * @returns {{ applicationStatus, referenceNumber, submittedAt, reviewNotes, loading, error }}
 */
export function useSubmissionStatus(memberId) {
  const [state, setState] = useState({
    applicationStatus: null,
    referenceNumber:   null,
    submittedAt:       null,
    reviewNotes:       '',
    loading:           true,
    error:             null,
  });

  useEffect(() => {
    if (!memberId) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'members', memberId),
      (snap) => {
        if (!snap.exists()) {
          setState(prev => ({ ...prev, loading: false, error: 'لم يتم العثور على الطلب' }));
          return;
        }
        const data = snap.data();
        setState({
          applicationStatus: data.applicationStatus || 'submitted',
          referenceNumber:   data.referenceNumber   || null,
          submittedAt:       data.submittedAt       || null,
          reviewNotes:       data.reviewNotes       || '',
          loading:           false,
          error:             null,
        });
      },
      (err) => {
        const msg = err.code === 'permission-denied'
          ? 'ليس لديك صلاحية الوصول لهذا الطلب'
          : 'حدث خطأ أثناء تحميل بيانات الطلب';
        setState(prev => ({ ...prev, loading: false, error: msg }));
      }
    );

    return () => unsubscribe();
  }, [memberId]);

  return state;
}
