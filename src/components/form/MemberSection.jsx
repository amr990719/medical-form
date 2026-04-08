import React, { useRef } from 'react';
import { useFormData } from '../../context/FormContext';
import SmartUpload from '../SmartUpload';

// Reusable micro-components
const NidInput = ({ value, onChange, size = "large" }) => {
  const inputRefs = useRef([]);

  const handleInput = (e, index) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (!val) {
      const newVal = value.split('');
      newVal[index] = ' ';
      onChange(newVal.join('').trimEnd());
      return;
    }

    const newVal = value.padEnd(14, ' ').split('');
    newVal[index] = val[val.length - 1];
    onChange(newVal.join('').trimEnd());

    if (index < 13 && val) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && (!value[index] || value[index] === ' ') && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 14);
    onChange(pastedData);
  };

  const paddedValue = value.padEnd(14, ' ');
  const boxClass = size === "large"
    ? "w-[24px] h-[32px] text-base"
    : "w-[18px] h-[26px] text-sm";

  return (
    <div dir="ltr" className="flex items-center gap-[2px]">
      {Array.from({ length: 14 }).map((_, i) => (
        <input
          key={i}
          ref={el => inputRefs.current[i] = el}
          className={`${boxClass} border-[1.5px] border-black bg-white text-center text-blue-700 font-bold outline-none focus:border-blue-500 focus:bg-blue-50 transition-colors`}
          maxLength={1}
          value={paddedValue[i] !== ' ' ? paddedValue[i] : ''}
          onChange={(e) => handleInput(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  );
};

const BoxStringInput = ({ value, onChange, length = 25 }) => {
  const inputRefs = useRef([]);
  const paddedValue = (value || '').padEnd(length, ' ');

  const handleInput = (e, index) => {
    const val = e.target.value;
    if (!val) {
      const newVal = (value || '').split('');
      newVal[index] = ' ';
      onChange(newVal.join('').trimEnd());
      return;
    }
    const newVal = paddedValue.split('');
    newVal[index] = val[val.length - 1];
    onChange(newVal.join('').trimEnd());

    if (index < length - 1 && val) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && (!value[index] || value[index] === ' ') && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length);
    onChange(pastedData);
  };

  return (
    <div dir="ltr" className="flex items-center justify-start flex-wrap gap-[2px] flex-1">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={el => inputRefs.current[i] = el}
          className="w-[20px] h-[30px] text-sm border-[1.5px] border-black bg-white text-center text-blue-700 font-bold outline-none focus:border-blue-500 focus:bg-blue-50 transition-colors"
          maxLength={1}
          value={paddedValue[i] !== ' ' ? paddedValue[i] : ''}
          onChange={(e) => handleInput(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  );
};

const DashedField = ({ label, value, onChange, labelWidth, containerClass = "flex-1" }) => (
  <div className={`flex items-end ${containerClass}`}>
    <span className={`whitespace-nowrap font-bold text-gray-900 inline-block shrink-0 ${labelWidth || ''}`}>
      {label}
    </span>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex-1 ml-1 border-b-[2px] border-dashed border-gray-600 outline-none bg-transparent px-1 text-center text-blue-700 font-bold focus:border-blue-600 min-w-0 h-6 leading-none"
    />
  </div>
);

const RadioBoxGroup = ({ label, options, name, value, onChange, labelWidth, containerClass = "" }) => (
  <div className={`flex items-end ${containerClass}`}>
    <span className={`whitespace-nowrap font-bold text-gray-900 inline-block shrink-0 ${labelWidth || ''}`}>
      {label}
    </span>
    <div className="flex items-center justify-start gap-1">
      {options.map((opt) => (
        <label
          key={opt}
          className={`flex items-center justify-center px-1.5 h-[26px] border-[1.5px] border-black cursor-pointer transition-colors ${value === opt ? 'bg-gray-300 shadow-inner' : 'bg-white hover:bg-gray-100'}`}
        >
          <span className={`text-[13px] font-bold leading-none mt-0.5 ${value === opt ? 'text-black' : 'text-gray-800'}`}>
            {opt}
          </span>
          <input
            type="radio"
            name={name}
            value={opt}
            checked={value === opt}
            onChange={() => onChange(opt)}
            className="hidden"
          />
        </label>
      ))}
    </div>
  </div>
);

export default function MemberSection() {
  const { formData, updateField, mainMemberDocs, setMainMemberDocs, memberPhoto, setMemberPhoto, setMemberPhotoFile, handleOcrResult } = useFormData();

  const labelRight = "w-[125px]";
  const labelMid = "w-[105px]";
  const labelLeft = "w-[105px]";

  return (
    <>
      <header className="flex justify-between items-start mb-10 h-32">
        <div className="text-center font-bold text-[18px] leading-snug w-[260px]">
          <p className="text-xl font-extrabold mb-1 tracking-wide">اتحاد نقابات المهن الطبية</p>
          <div className="border-t-[3px] border-black my-1.5 mx-8"></div>
          <p className="font-extrabold tracking-wide">مشروع علاج الأعضاء وأسرهم</p>
        </div>

        <div className="text-center flex-1 pt-4">
          <h1 className="text-[26px] font-extrabold mb-3">استمارة اشتراك بمشروع العلاج</h1>
          <h2 className="text-[22px] font-bold text-gray-800">( أول مرة - إضافة )</h2>
        </div>

        <label className="w-28 h-36 border-[1.5px] border-black flex items-center justify-center bg-white shrink-0 mt-2 ml-4 cursor-pointer relative overflow-hidden group">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                setMemberPhotoFile(file);
                const reader = new FileReader();
                reader.onload = (ev) => setMemberPhoto(ev.target.result);
                reader.readAsDataURL(file);
              }
            }}
          />
          {memberPhoto ? (
            <img src={memberPhoto} alt="صورة العضو" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center text-gray-400 text-sm font-bold leading-tight group-hover:text-blue-600 transition-colors">
              صورة<br />العضو<br />الأصلي
            </div>
          )}
        </label>
      </header>

      <div className="mb-8 border-[1.5px] border-black p-4 rounded-md print:hidden">
        <h3 className="font-bold text-lg mb-1 text-blue-700">مرفقات العضو الأصلي الإلزامية</h3>
        <p className="text-xs text-gray-500 font-bold mb-4">
          بعد رفع كل صورة، اضغط <span className="text-emerald-700">مسح تلقائي</span> لاستخراج البيانات منها تلقائياً — يمكنك التعديل يدوياً بعد ذلك.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SmartUpload
            label="صورة البطاقة (وجه)"
            docType="nationalIdFront"
            currentFile={mainMemberDocs.nationalIdFront}
            onFileChange={(file) => setMainMemberDocs(prev => ({ ...prev, nationalIdFront: file }))}
            onExtracted={handleOcrResult}
          />
          <SmartUpload
            label="صورة البطاقة (ظهر)"
            docType="nationalIdBack"
            currentFile={mainMemberDocs.nationalIdBack}
            onFileChange={(file) => setMainMemberDocs(prev => ({ ...prev, nationalIdBack: file }))}
            onExtracted={handleOcrResult}
          />
          <SmartUpload
            label="كارنيه النقابة"
            docType="syndicateId"
            currentFile={mainMemberDocs.syndicateId}
            onFileChange={(file) => setMainMemberDocs(prev => ({ ...prev, syndicateId: file }))}
            onExtracted={(fields) => {
              handleOcrResult({
                registrationNumber: fields.registrationNumber,
                subSyndicate: fields.subSyndicate,
                syndicateRegistrationYear: fields.syndicateRegistrationYear,
                syndicateType: fields.syndicateType,
              });
            }}
          />
        </div>
      </div>

      <section className="mb-10 mt-6">
        <div className="grid grid-cols-12 gap-y-7 gap-x-4 text-[15px]">
          <RadioBoxGroup label="الـنـقـــابـــة :" name="syndicateType" options={['بشري', 'صيدلي', 'أسنان', 'بيطري']} value={formData.syndicateType} onChange={(v) => updateField('syndicateType', v)} labelWidth={labelRight} containerClass="col-span-6" />
          <DashedField label="النقابة الفرعية :" value={formData.subSyndicate} onChange={(v) => updateField('subSyndicate', v)} labelWidth={labelMid} containerClass="col-span-3" />
          <DashedField label="رقم قيد النقابة :" value={formData.registrationNumber} onChange={(v) => updateField('registrationNumber', v)} labelWidth={labelLeft} containerClass="col-span-3" />

          <DashedField label="رقم بطاقة العلاج :" value={formData.treatmentCardNumber} onChange={(v) => updateField('treatmentCardNumber', v)} labelWidth={labelRight} containerClass="col-span-5" />
          <DashedField label="سنة قيد النقابة :" value={formData.syndicateRegistrationYear} onChange={(v) => updateField('syndicateRegistrationYear', v)} labelWidth={labelMid} containerClass="col-span-3" />
          <RadioBoxGroup label="حـالـــة العـمـيـل :" name="workStatus" options={['يعمل', 'معاش', 'متوفى']} value={formData.workStatus} onChange={(v) => updateField('workStatus', v)} labelWidth={labelLeft} containerClass="col-span-4" />

          <DashedField label="أســــم العـضــــو :" value={formData.memberName} onChange={(v) => updateField('memberName', v)} labelWidth={labelRight} containerClass="col-span-8 pr-1" />
          <RadioBoxGroup label="الـــديـــانــــة :" name="religion" options={['مسلم', 'مسيحي']} value={formData.religion} onChange={(v) => updateField('religion', v)} labelWidth={labelLeft} containerClass="col-span-4 pl-1" />

          <div className="col-span-8 flex items-end">
            <span className={`whitespace-nowrap font-bold text-gray-900 inline-block shrink-0 ${labelRight}`}>الرقـم القـومــي :</span>
            <NidInput value={formData.nationalId} onChange={(v) => updateField('nationalId', v)} />
          </div>
          <RadioBoxGroup label="الـــنـــــوع :" name="gender" options={['ذكر', 'أنثى']} value={formData.gender} onChange={(v) => updateField('gender', v)} labelWidth={labelLeft} containerClass="col-span-4" />

          <DashedField label="سنة المـيـــلاد :" value={formData.birthYear} onChange={(v) => updateField('birthYear', v)} labelWidth={labelRight} containerClass="col-span-5" />
          <DashedField label="محافظة السكن :" value={formData.governorate} onChange={(v) => updateField('governorate', v)} labelWidth={labelMid} containerClass="col-span-3" />
          <DashedField label="الـــحــــــــــي :" value={formData.neighborhood} onChange={(v) => updateField('neighborhood', v)} labelWidth={labelLeft} containerClass="col-span-4" />

          <DashedField label="الـــعـــنــــوان :" value={formData.address} onChange={(v) => updateField('address', v)} labelWidth={labelRight} containerClass="col-span-8" />
          <DashedField label="المـحـــمـــــول :" value={formData.mobile} onChange={(v) => updateField('mobile', v)} labelWidth={labelLeft} containerClass="col-span-4" />

          <div className="col-span-12 flex items-end mt-1">
            <span className={`whitespace-nowrap font-bold text-gray-900 inline-block shrink-0 ${labelRight}`}>البريد الالكتروني :</span>
            <BoxStringInput value={formData.email} onChange={(v) => updateField('email', v)} length={26} />
          </div>
        </div>
      </section>
    </>
  );
}

// Note: NidInput, BoxStringInput, DashedField, RadioBoxGroup are also available
// as standalone components in src/components/shared/ for use outside this file.
