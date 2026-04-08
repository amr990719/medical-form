import React from 'react';
import SmartUpload from '../SmartUpload';

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default function DocumentModal({ isOpen, onClose, beneficiary, index, onUpdateDocs, memberGender, onUpdateData }) {
  if (!isOpen || !beneficiary) return null;

  let requiredDocs = [];

  if (['زوج', 'زوجة'].includes(beneficiary.kinship)) {
    requiredDocs = [
      { id: 'nationalId', label: 'بطاقة الرقم القومي' },
      { id: 'marriageCertificate', label: 'شهادة الزواج' },
      { id: 'insurancePrint', label: 'برينت تأميني' }
    ];
  } else if (['أم', 'أب'].includes(beneficiary.kinship)) {
    requiredDocs = [
      { id: 'nationalId', label: 'بطاقة الرقم القومي' }
    ];
  } else if (['ابن (18 سنة أو أقل)', 'ابن (طالب جامعي)', 'ابن (خريج)', 'ابنة'].includes(beneficiary.kinship)) {
    const isSon = beneficiary.kinship.startsWith('ابن');

    if (memberGender === 'أنثى') {
      requiredDocs.push({ id: 'birthCertificate', label: 'شهادة الميلاد (إلزامي)' });
    } else {
      if (isSon) {
        requiredDocs.push({ id: 'birthCertificate', label: 'شهادة الميلاد (فقط لمن هم دون 16 سنة)' });
      } else {
        requiredDocs.push({ id: 'birthCertificate', label: 'شهادة الميلاد' });
      }
    }

    if (isSon) {
      requiredDocs.push({ id: 'nationalId', label: 'بطاقة الرقم القومي (إلزامي لمن أتم 16 سنة)' });
    } else {
      requiredDocs.push({ id: 'nationalId', label: 'بطاقة الرقم القومي (إن وجدت لمن هم دون 16)' });
    }

    if (beneficiary.kinship === 'ابن (طالب جامعي)') {
      requiredDocs.push({ id: 'universityId', label: 'كارنيه جامعة (للطلاب)' });
    } else if (beneficiary.kinship === 'ابن (خريج)') {
      requiredDocs.push({ id: 'insurancePrint', label: 'برينت تأميني' });
    }
  }

  const handleFileChange = (docId, file) => {
    onUpdateDocs(index, { ...beneficiary.documents, [docId]: file || null });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 print:hidden">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-blue-700 text-white p-4 flex justify-between items-center">
          <h3 className="font-bold text-lg">
            مستندات المستفيد: {beneficiary.name || `(مستفيد رقم ${index + 1})`}
          </h3>
          <button onClick={onClose} className="hover:text-red-300 transition-colors">
            <CloseIcon />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {requiredDocs.length === 0 ? (
            <p className="text-gray-500 text-center font-bold">يرجى اختيار درجة القرابة أولاً لتحديد المستندات المطلوبة.</p>
          ) : (
            requiredDocs.map(doc => {
              const isOcrSupported = ['nationalId', 'birthCertificate'].includes(doc.id);
              return (
                <div key={doc.id} className="border border-gray-200 p-4 rounded-lg bg-gray-50">
                  <label className="block font-bold text-gray-800 mb-2">{doc.label}</label>
                  {isOcrSupported ? (
                    <SmartUpload
                      label=""
                      docType="beneficiaryDoc"
                      currentFile={beneficiary.documents ? beneficiary.documents[doc.id] : null}
                      onFileChange={(file) => handleFileChange(doc.id, file)}
                      onExtracted={(fields) => {
                        if (onUpdateData) onUpdateData(index, fields);
                      }}
                    />
                  ) : (
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        onChange={(e) => handleFileChange(doc.id, e.target.files[0])}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                      />
                    </div>
                  )}
                  {beneficiary.documents && beneficiary.documents[doc.id] && !isOcrSupported && (
                    <p className="mt-2 text-xs text-green-600 font-bold flex items-center gap-1">
                      ✓ تم إرفاق: {beneficiary.documents[doc.id].name}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="bg-gray-100 p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
          >
            حفظ وإغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
