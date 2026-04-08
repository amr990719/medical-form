/**
 * validateForm — collects ALL validation errors before allowing navigation to /receipt.
 * @param {object} formData — from FormContext
 * @param {object} mainMemberDocs — from FormContext
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateForm(formData, mainMemberDocs) {
  const errors = [];

  // 1. Syndicate type
  if (!formData.syndicateType) {
    errors.push('يرجى اختيار نوع النقابة');
  }

  // 2. Member name
  if (!formData.memberName || formData.memberName.trim().length < 5) {
    errors.push('اسم العضو يجب أن يكون 5 أحرف على الأقل');
  }

  // 3. National ID — exactly 14 digits
  if (!/^\d{14}$/.test(formData.nationalId)) {
    errors.push('الرقم القومي يجب أن يكون 14 رقماً صحيحاً');
  }

  // 4. Gender
  if (!formData.gender) {
    errors.push('يرجى تحديد النوع (ذكر/أنثى)');
  }

  // 5. Work status
  if (!formData.workStatus) {
    errors.push('يرجى تحديد حالة العمل');
  }

  // 6. Syndicate registration year
  const regYear = formData.syndicateRegistrationYear;
  if (!/^\d{4}$/.test(regYear) || Number(regYear) < 1950 || Number(regYear) > 2026) {
    errors.push('سنة قيد النقابة غير صحيحة');
  }

  // 7. Mobile phone
  if (!/^(\+20|0020|0)?1[0125]\d{8}$/.test(formData.mobile)) {
    errors.push('رقم الهاتف المحمول غير صحيح');
  }

  // 8-10. Main member mandatory documents
  if (!mainMemberDocs.nationalIdFront) {
    errors.push('يرجى إرفاق صورة وجه البطاقة الشخصية');
  }
  if (!mainMemberDocs.nationalIdBack) {
    errors.push('يرجى إرفاق صورة ظهر البطاقة الشخصية');
  }
  if (!mainMemberDocs.syndicateId) {
    errors.push('يرجى إرفاق صورة كارنيه النقابة');
  }

  // 11. Beneficiary validation
  const DOC_LABEL = {
    nationalId:          'بطاقة الرقم القومي',
    birthCertificate:    'شهادة الميلاد',
    marriageCertificate: 'شهادة الزواج',
    insurancePrint:      'برينت تأميني',
    universityId:        'كارنيه الجامعة',
  };

  const KINSHIP_DOCS = {
    'زوج':                ['nationalId', 'marriageCertificate', 'insurancePrint'],
    'زوجة':               ['nationalId', 'marriageCertificate', 'insurancePrint'],
    'أب':                 ['nationalId'],
    'أم':                 ['nationalId'],
    'ابن (18 سنة أو أقل)':['birthCertificate', 'nationalId'],
    'ابنة':               ['birthCertificate', 'nationalId'],
    'ابن (طالب جامعي)':   ['birthCertificate', 'nationalId', 'universityId'],
    'ابن (خريج)':         ['birthCertificate', 'nationalId', 'insurancePrint'],
  };

  formData.beneficiaries.forEach((ben, i) => {
    if (!ben.name || !ben.name.trim()) return; // skip empty rows

    // a. Kinship required
    if (!ben.kinship) {
      errors.push(`المستفيد رقم ${i + 1}: يرجى تحديد درجة القرابة`);
      return; // can't check docs without kinship
    }

    // b. Birth year validation (if provided)
    if (ben.birthYear) {
      const by = ben.birthYear;
      if (!/^\d{4}$/.test(by) || Number(by) < 1920 || Number(by) > 2026) {
        errors.push(`المستفيد ${ben.name}: سنة الميلاد غير صحيحة`);
      }
    }

    // c. Required documents
    const required = KINSHIP_DOCS[ben.kinship] || [];
    required.forEach(docId => {
      if (!ben.documents?.[docId]) {
        errors.push(`المستفيد ${ben.name}: مستند ${DOC_LABEL[docId] || docId} مطلوب`);
      }
    });
  });

  return { valid: errors.length === 0, errors };
}
