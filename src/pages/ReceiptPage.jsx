import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useFormData } from '../context/FormContext';
import { db, storage } from '../firebase';
import { validateReceiptImage } from '../utils/validateReceiptImage';
import ProgressStepper from '../components/shared/ProgressStepper';

async function uploadFile(storagePath, file) {
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export default function ReceiptPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user }  = useAuth();
  const {
    formData, mainMemberDocs, memberPhotoFile,
    feeResult, receiptFile, receiptPreview,
    setReceiptFromFile, resetForm,
  } = useFormData();

  const existingMemberId = location.state?.existingMemberId || null;

  const [isSaving,       setIsSaving]       = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep,     setUploadStep]     = useState('');
  const [error,          setError]          = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setReceiptFromFile(file);
  };

  const handleRemove = (e) => {
    e.preventDefault();
    setReceiptFromFile(null);
  };

  // ── Main submit handler ──────────────────────────────────────────────────
  const handleFinalSubmit = async () => {
    setError('');

    // Pre-flight
    if (!user) { setError('انتهت جلسة تسجيل الدخول. يرجى تسجيل الدخول مرة أخرى.'); return; }
    if (!receiptFile) { setError('يرجى اختيار صورة الإيصال أولاً'); return; }

    const imgValidation = await validateReceiptImage(receiptFile);
    if (!imgValidation.valid) { setError(imgValidation.error); return; }

    setIsSaving(true);
    setUploadProgress(0);

    const uploadedUrls = {
      profilePhoto:    '',
      mainDocs:        {},
      beneficiaryDocs: {},
      receiptUrl:      '',
    };

    try {
      // ── STEP 1: Member profile photo ───────────────────────────────────
      setUploadStep('جارٍ رفع الصورة الشخصية...');
      if (memberPhotoFile) {
        uploadedUrls.profilePhoto = await uploadFile(
          `members/${user.uid}/profile_photo`,
          memberPhotoFile
        );
      }
      setUploadProgress(15);

      // ── STEP 2: Main member docs ────────────────────────────────────────
      setUploadStep('جارٍ رفع مستندات العضو...');
      for (const key of ['nationalIdFront', 'nationalIdBack', 'syndicateId']) {
        if (mainMemberDocs[key]) {
          uploadedUrls.mainDocs[key] = await uploadFile(
            `members/${user.uid}/docs/main_${key}_${Date.now()}`,
            mainMemberDocs[key]
          );
        }
      }
      setUploadProgress(45);

      // ── STEP 3: Beneficiary documents ──────────────────────────────────
      setUploadStep('جارٍ رفع مستندات المستفيدين...');
      for (let i = 0; i < formData.beneficiaries.length; i++) {
        const ben = formData.beneficiaries[i];
        if (!ben.name?.trim() || !ben.kinship) continue;
        uploadedUrls.beneficiaryDocs[i] = {};
        for (const docId of Object.keys(ben.documents || {})) {
          if (ben.documents[docId] instanceof File) {
            uploadedUrls.beneficiaryDocs[i][docId] = await uploadFile(
              `members/${user.uid}/docs/ben_${i}_${docId}_${Date.now()}`,
              ben.documents[docId]
            );
          }
        }
      }
      setUploadProgress(65);

      // ── STEP 4: Receipt image ────────────────────────────────────────────
      setUploadStep('جارٍ رفع إيصال الدفع...');
      try {
        const ext = receiptFile.name.split('.').pop() || 'jpg';
        uploadedUrls.receiptUrl = await uploadFile(
          `receipts/${user.uid}/${Date.now()}.${ext}`,
          receiptFile
        );
      } catch (err) {
        setError('فشل رفع إيصال الدفع. تأكد من أن الصورة واضحة وحجمها أقل من 8 ميجابايت');
        setUploadProgress(0);
        setIsSaving(false);
        return;
      }
      setUploadProgress(85);

      // ── STEP 5: Firestore ────────────────────────────────────────────────
      setUploadStep('جارٍ حفظ البيانات...');
      try {
        if (existingMemberId) {
          // Re-upload for revision
          await updateDoc(doc(db, 'members', existingMemberId), {
            receiptImageUrl:   uploadedUrls.receiptUrl,
            paymentStatus:     'pending_review',
            applicationStatus: 'submitted',
            lastUpdatedAt:     serverTimestamp(),
          });
          setUploadProgress(100);
          navigate('/waiting', {
            state: { memberName: formData.memberName, docId: existingMemberId },
          });
        } else {
          // New submission
          const payload = {
            userId:                  user.uid,
            memberName:              formData.memberName.trim(),
            nationalId:              formData.nationalId.trim(),
            syndicateType:           formData.syndicateType,
            subSyndicate:            formData.subSyndicate,
            registrationNumber:      formData.registrationNumber,
            treatmentCardNumber:     formData.treatmentCardNumber,
            syndicateRegistrationYear: formData.syndicateRegistrationYear,
            workStatus:              formData.workStatus,
            religion:                formData.religion,
            gender:                  formData.gender,
            birthYear:               formData.birthYear,
            governorate:             formData.governorate,
            neighborhood:            formData.neighborhood,
            address:                 formData.address,
            mobile:                  formData.mobile,
            email:                   formData.email,
            declarationName:         formData.declarationName,
            beneficiaries: formData.beneficiaries
              .filter(b => b.name?.trim() && b.kinship)
              .map((b, i) => ({
                kinship:      b.kinship,
                name:         b.name.trim(),
                birthYear:    b.birthYear,
                nationalId:   b.nationalId,
                documentUrls: uploadedUrls.beneficiaryDocs[i] || {},
              })),
            feeSnapshot: feeResult ? {
              tier:      feeResult.tier,
              total:     feeResult.total,
              adminFee:  feeResult.adminFee,
              breakdown: feeResult.breakdown,
            } : null,
            profilePhotoUrl:    uploadedUrls.profilePhoto,
            mainDocumentUrls:   uploadedUrls.mainDocs,
            receiptImageUrl:    uploadedUrls.receiptUrl,
            paymentStatus:      'pending_review',
            applicationStatus:  'submitted',
            referenceNumber:    '',
            reviewNotes:        '',
            reviewedBy:         '',
            reviewedAt:         null,
            submittedAt:        serverTimestamp(),
            lastUpdatedAt:      serverTimestamp(),
          };

          const docRef = await addDoc(collection(db, 'members'), payload);
          setUploadProgress(100);
          resetForm();
          navigate('/waiting', {
            state: { memberName: formData.memberName, docId: docRef.id },
          });
        }
      } catch (err) {
        console.error('Firestore write failed:', err);
        setError(
          `تم رفع جميع الملفات بنجاح، لكن فشل حفظ البيانات. يرجى التواصل مع الدعم الفني مع الرمز: ${user.uid}`
        );
        setUploadProgress(0);
        setIsSaving(false);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('حدث خطأ أثناء رفع الملفات. يرجى المحاولة مرة أخرى.');
      setUploadProgress(0);
      setIsSaving(false);
    }
  };

  const canSubmit = !!receiptFile && !isSaving;

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--nb-smoke)', fontFamily: "'Cairo', sans-serif" }}>
      <ProgressStepper currentStep={4} />

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 16px' }}>

        {/* Back link */}
        <button
          onClick={() => navigate('/form')}
          style={{
            background: 'none', border: 'none', color: 'var(--nb-muted)', cursor: 'pointer',
            fontSize: 13, fontFamily: "'Cairo', sans-serif", marginBottom: 20, display: 'block',
            transition: 'color 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.color = 'var(--nb-teal)'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--nb-muted)'}
        >
          ← رجوع للاستمارة
        </button>

        {/* Fee summary card */}
        {feeResult?.isValid && (
          <div style={{ background: 'var(--nb-white)', borderRadius: 16, overflow: 'hidden', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ background: 'var(--nb-banana)', padding: '16px 20px', fontWeight: 600, fontSize: 15, color: 'var(--nb-charcoal)' }}>
              ملخص الرسوم
            </div>
            <div style={{ padding: '16px 20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <tbody>
                  {feeResult.breakdown?.map((item, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'var(--nb-smoke)' : 'var(--nb-white)' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--nb-slate)' }}>{item.label}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--nb-teal)', textAlign: 'left' }} dir="ltr">
                        {item.fee.toLocaleString('ar-EG')} ج.م
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ borderTop: '2px solid var(--nb-border)', marginTop: 8, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: 'var(--nb-charcoal)' }}>الإجمالي</span>
                <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--nb-teal)' }} dir="ltr">
                  {feeResult.total.toLocaleString('ar-EG')} ج.م
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Receipt upload card */}
        <div style={{ background: 'var(--nb-white)', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontWeight: 700, fontSize: 16, color: 'var(--nb-charcoal)', marginBottom: 16 }}>رفع إيصال الدفع</h2>

          {error && (
            <div style={{
              background: 'var(--nb-danger-light)', borderRight: '3px solid var(--nb-danger)',
              borderRadius: '0 8px 8px 0', padding: '10px 14px', fontSize: 13, color: '#742A2A', marginBottom: 12,
            }}>
              {error}
            </div>
          )}

          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            border: '2px dashed var(--nb-banana-deep)', borderRadius: 16,
            minHeight: 200, cursor: 'pointer',
            background: receiptPreview ? 'var(--nb-white)' : 'rgba(253,251,232,0.4)',
            position: 'relative', overflow: 'hidden', transition: 'all 0.2s',
          }}>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            {receiptPreview ? (
              <>
                <img src={receiptPreview} alt="معاينة الإيصال" style={{ maxHeight: 180, objectFit: 'contain' }} />
                <div style={{
                  position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
                  background: 'rgba(255,255,255,0.9)', borderRadius: 20, padding: '4px 12px',
                  fontSize: 12, color: 'var(--nb-slate)', whiteSpace: 'nowrap',
                }}>
                  تغيير الصورة ×
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 16px' }}>
                <svg style={{ marginBottom: 12, color: 'var(--nb-teal)', display: 'block', margin: '0 auto 12px' }} width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--nb-teal)" strokeWidth="1.5">
                  <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                </svg>
                <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--nb-charcoal)', margin: 0 }}>اسحب صورة الإيصال هنا</p>
                <p style={{ color: 'var(--nb-teal)', fontSize: 13, textDecoration: 'underline', marginTop: 4 }}>أو اضغط للاختيار</p>
                <p style={{ color: 'var(--nb-muted)', fontSize: 11, marginTop: 8 }}>الصور المقبولة: JPG, PNG, WEBP · الحجم الأقصى: 8 ميجابايت</p>
              </div>
            )}
          </label>

          {/* Uploaded file bar */}
          {receiptFile && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginTop: 12,
              padding: '8px 12px', background: 'var(--nb-teal-light)', borderRadius: 8,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--nb-teal)" strokeWidth="2.5"><polyline points="5,12 10,17 19,7"/></svg>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: 'var(--nb-charcoal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {receiptFile.name}
              </span>
              <span style={{ fontSize: 11, color: 'var(--nb-muted)' }}>{(receiptFile.size / 1024 / 1024).toFixed(1)} MB</span>
              <button onClick={handleRemove} style={{ background: 'none', border: 'none', color: 'var(--nb-danger)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>إزالة</button>
            </div>
          )}

          {/* Progress bar */}
          {isSaving && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--nb-slate)', marginBottom: 6 }}>{uploadStep}</p>
              <div style={{ height: 6, background: 'var(--nb-border)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--nb-teal)', width: `${uploadProgress}%`, transition: 'width 0.3s ease', borderRadius: 3 }} />
              </div>
              <p style={{ fontSize: 11, color: 'var(--nb-muted)', marginTop: 4, textAlign: 'center' }}>{uploadProgress}%</p>
            </div>
          )}
        </div>

        {/* Submit button */}
        <button
          onClick={handleFinalSubmit}
          disabled={!canSubmit}
          style={{
            width: '100%', height: 54, borderRadius: 12, border: 'none',
            fontFamily: "'Cairo', sans-serif", fontWeight: 700, fontSize: 16,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            background: canSubmit ? 'var(--nb-teal)' : 'var(--nb-border)',
            color: canSubmit ? 'white' : 'var(--nb-muted)',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}
          onMouseOver={e => { if (canSubmit) e.currentTarget.style.background = 'var(--nb-teal-deep)'; }}
          onMouseOut={e => { if (canSubmit) e.currentTarget.style.background = 'var(--nb-teal)'; }}
        >
          {isSaving ? (
            <>
              <span style={{ width: 20, height: 20, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
              جارٍ الرفع والحفظ...
            </>
          ) : 'تأكيد وإرسال الطلب'}
        </button>
      </div>
    </div>
  );
}
