import React, { useState } from 'react';
import { useFormData } from '../../context/FormContext';
import NidInput from '../shared/NidInput';
import DocumentModal from '../shared/DocumentModal';

const PaperclipIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
  </svg>
);

export default function BeneficiaryTable() {
  const { formData, updateBeneficiary, updateBeneficiaryDocs, updateBeneficiaryBatch } = useFormData();
  const [activeModalIndex, setActiveModalIndex] = useState(null);

  return (
    <>
      <DocumentModal
        isOpen={activeModalIndex !== null}
        onClose={() => setActiveModalIndex(null)}
        beneficiary={activeModalIndex !== null ? formData.beneficiaries[activeModalIndex] : null}
        index={activeModalIndex}
        onUpdateDocs={updateBeneficiaryDocs}
        memberGender={formData.gender}
        onUpdateData={updateBeneficiaryBatch}
      />

      <section className="mb-6 mt-12">
        <div className="text-center mb-5">
          <h2 className="text-[20px] font-extrabold inline-block">بيانات المستفيدين مع العضو الأصلى</h2>
        </div>

        <table className="w-full border-collapse border border-black text-center text-[15px] relative">
          <thead className="bg-white">
            <tr>
              <th className="border border-black p-1.5 font-bold w-10">م</th>
              <th className="border border-black p-1.5 font-bold w-36">درجة القرابة</th>
              <th className="border border-black p-1.5 font-bold">اسم المستفيد</th>
              <th className="border border-black p-1.5 font-bold w-24">سنة الميلاد</th>
              <th className="border border-black p-1.5 font-bold w-[320px]">الرقم القومي</th>
            </tr>
          </thead>
          <tbody>
            {formData.beneficiaries.map((ben, i) => {
              const hasDocs = ben.documents && Object.keys(ben.documents).some(k => ben.documents[k] !== null);
              return (
                <tr key={i} className="h-9 group relative">
                  <td className="border border-black p-0 font-bold text-gray-800 bg-white relative">
                    {i + 1}
                    {ben.kinship && (
                      <button
                        onClick={() => setActiveModalIndex(i)}
                        className={`print:hidden absolute -right-7 top-1.5 p-1 rounded-full bg-white shadow-sm border ${hasDocs ? 'text-green-600 border-green-200 hover:bg-green-50' : 'text-gray-400 border-gray-200 hover:bg-gray-50 hover:text-blue-600'} transition-all`}
                        title="إرفاق مستندات"
                      >
                        <PaperclipIcon />
                      </button>
                    )}
                  </td>
                  <td className="border border-black p-0 relative">
                    <select
                      className="w-full h-full text-center outline-none bg-transparent text-blue-700 font-bold focus:bg-blue-50 cursor-pointer"
                      value={ben.kinship}
                      onChange={(e) => updateBeneficiary(i, 'kinship', e.target.value)}
                    >
                      <option value=""></option>
                      <option value="أم">أم</option>
                      <option value="أب">أب</option>
                      <option value="ابن (18 سنة أو أقل)">ابن (18 سنة أو أقل)</option>
                      <option value="ابن (طالب جامعي)">ابن (طالب جامعي)</option>
                      <option value="ابن (خريج)">ابن (خريج)</option>
                      <option value="ابنة">ابنة</option>
                      <option value="زوج">زوج</option>
                      <option value="زوجة">زوجة</option>
                    </select>
                  </td>
                  <td className="border border-black p-0">
                    <input
                      className="w-full h-full px-2 outline-none bg-transparent text-blue-700 font-bold focus:bg-blue-50 text-right"
                      value={ben.name}
                      onChange={(e) => updateBeneficiary(i, 'name', e.target.value)}
                    />
                  </td>
                  <td className="border border-black p-0">
                    <input
                      className="w-full h-full text-center outline-none bg-transparent text-blue-700 font-bold focus:bg-blue-50"
                      value={ben.birthYear}
                      onChange={(e) => updateBeneficiary(i, 'birthYear', e.target.value)}
                      maxLength={4}
                    />
                  </td>
                  <td className="border border-black p-1 bg-white flex justify-center h-[37px] items-center">
                    <NidInput
                      value={ben.nationalId}
                      onChange={(v) => updateBeneficiary(i, 'nationalId', v)}
                      size="small"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}
