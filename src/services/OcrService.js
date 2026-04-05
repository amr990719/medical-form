/**
 * OcrService.js  — Gemini Vision extraction for Egyptian ID & Syndicate cards
 *
 * Uses firebase/ai (GoogleAIBackend) — no extra API key needed beyond Firebase.
 * Enable "AI Logic" in Firebase Console → Build → AI Logic.
 *
 * Exports:
 *   extractNationalIdFront(file, onProgress)
 *     → { memberName, nationalId, birthYear, governorate,
 *          neighborhood, residenceGovernorate, address }
 *   extractNationalIdBack(file, onProgress)
 *     → { gender, religion, maritalStatus }
 *   extractSyndicateId(file, onProgress)
 *     → { registrationNumber, subSyndicate, syndicateRegistrationYear, syndicateType }
 */

import { getApps }                                    from 'firebase/app';
import { getAI, GoogleAIBackend, getGenerativeModel } from 'firebase/ai';

// ─── Firebase / Gemini setup ──────────────────────────────────────────────────

function getFirebaseApp() {
  const apps = getApps();
  if (apps.length === 0) throw new Error('[OcrService] No Firebase app found.');
  return apps[0];
}

let _model = null;
function getModel() {
  if (_model) return _model;
  const ai = getAI(getFirebaseApp(), { backend: new GoogleAIBackend() });
  _model = getGenerativeModel(ai, { model: 'gemini-3-flash-preview' });
  return _model;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** File → Gemini inline image part */
async function fileToInlinePart(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve({
      inlineData: { data: reader.result.split(',')[1], mimeType: file.type || 'image/jpeg' }
    });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Call Gemini, strip code fences, parse JSON */
async function askGemini(imageFile, prompt, onProgress) {
  onProgress?.(30);
  const imagePart = await fileToInlinePart(imageFile);
  onProgress?.(60);

  const result = await getModel().generateContent([prompt, imagePart]);
  onProgress?.(95);

  const raw = result.response.text();
  const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

  try {
    return JSON.parse(jsonStr);
  } catch {
    console.warn('[OcrService] Non-JSON response:', raw);
    return {};
  }
}

/** Normalise Eastern Arabic-Indic digits → Western, return first 14-digit run */
function cleanIdNumber(raw) {
  if (!raw) return '';
  const w = String(raw).replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  const digits = w.replace(/\D/g, '');
  const m = digits.match(/\d{14}/);
  return m ? m[0] : digits.slice(0, 14);
}

/** Derive 4-digit birth year from clean 14-digit Egyptian ID */
function birthYearFromId(id14) {
  if (id14.length !== 14) return '';
  const c = id14[0], yy = id14.slice(1, 3);
  if (c === '2') return '19' + yy;
  if (c === '3') return '20' + yy;
  return '';
}

/** Extract 4-digit year from any date string or number.
 *  Handles Eastern Arabic-Indic digits (٢٠٢١-٠٤-٢٨ → "2021"). */
function extractYear(raw) {
  // 1. Normalise Eastern Arabic-Indic digits → Western digits
  const western = String(raw || '').replace(/[٠١٢٣٤٥٦٧٨٩]/g, d =>
    '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString()
  );
  // 2. Find the first 4-digit year (19xx or 20xx)
  const m = western.match(/\b(19|20)\d{2}\b/);
  if (m) return m[0];
  // 3. Fallback: take the first 4 consecutive digits
  const digits = western.replace(/\D/g, '');
  return digits.slice(0, 4);
}

// ─── Exported functions ───────────────────────────────────────────────────────

/**
 * Front of Egyptian National ID card.
 * Returns keys matching App.jsx formData exactly.
 */
export async function extractNationalIdFront(imageFile, onProgress) {
  const prompt = `
هذه صورة للوجه الأمامي لبطاقة الرقم القومي المصرية.
استخرج البيانات التالية وأرجعها كـ JSON فقط (بدون أي نص إضافي):

{
  "memberName":           "الاسم الكامل للشخص (الاسم الأول + سلسلة الأسماء)",
  "nationalID":           "رقم الهوية المكون من 14 رقماً (أرقام غربية 0-9 فقط، بدون مسافات)",
  "governorate":          "اسم المحافظة المذكورة على البطاقة (الجزء بعد الشرطة في سطر العنوان)",
  "address":              "عنوان الشارع (السطر الذي يحتوي على رقم المبنى والشارع)",
  "neighborhood":         "اسم الحي أو المنطقة (الجزء قبل الشرطة في السطر الأخير قبل الرقم القومي)",
  "residenceGovernorate": "اسم المحافظة من بطاقة الهوية (الجزء بعد الشرطة في نفس السطر)"
}

ملاحظات:
- الرقم القومي في الأسفل، يبدأ بـ 2 أو 3، طوله 14 رقماً.
- أزل أي مسافات من الرقم القومي.
- لا توجد تسميات على البطاقة — البيانات في مواضع ثابتة.
- أرجع JSON فقط.
`;

  const data = await askGemini(imageFile, prompt, onProgress);
  onProgress?.(100);

  const nationalId  = cleanIdNumber(data.nationalID);
  const birthYear   = birthYearFromId(nationalId);

  return {
    memberName:           String(data.memberName           || '').trim(),
    nationalId,
    birthYear,
    governorate:          String(data.governorate          || '').trim(),
    neighborhood:         String(data.neighborhood         || '').trim(),
    residenceGovernorate: String(data.residenceGovernorate || '').trim(),
    address:              String(data.address              || '').trim(),
  };
}

/**
 * Back of Egyptian National ID card.
 */
export async function extractNationalIdBack(imageFile, onProgress) {
  const prompt = `
هذه صورة للوجه الخلفي لبطاقة الرقم القومي المصرية.
استخرج البيانات التالية وأرجعها كـ JSON فقط:

{
  "gender":        "ذكر أو أنثى",
  "religion":      "مسلم أو مسيحي",
  "maritalStatus": "اعزب أو متزوج أو مطلق أو ارمل"
}

أرجع JSON فقط.
`;

  const data = await askGemini(imageFile, prompt, onProgress);
  onProgress?.(100);

  return {
    gender:        String(data.gender        || '').trim(),
    religion:      String(data.religion      || '').trim(),
    maritalStatus: String(data.maritalStatus || '').trim(),
  };
}

/**
 * Syndicate ID card (كارنيه النقابة).
 *
 * Real card layout — labeled rows (right) with values (left):
 *   رقم القيد       : ٣٠٥٧٧٧
 *   تاريخ القيد     : ٢٠٢١-٠٤-٢٨   ← we extract the year only
 *   النقابة الفرعية : الجيزة
 *   Type in top header strip: طبيب بشري
 */
export async function extractSyndicateId(imageFile, onProgress) {
  const prompt = `
هذه صورة لكارنيه النقابة الطبية المصرية.

تخطيط البطاقة: كل سطر يحتوي على اسم الحقل على اليمين والقيمة على اليسار، مثل:
  رقم القيد        : ٣٠٥٧٧٧
  تاريخ القيد      : ٢٠٢١-٠٤-٢٨
  النقابه الفرعيه  : الجيزة
ونوع الطبيب (بشري / صيدلي / أسنان / بيطري) مكتوب في شريط العنوان العلوي للبطاقة.

استخرج البيانات التالية وأرجعها كـ JSON فقط:

{
  "registrationNumber": "القيمة الموجودة بجانب 'رقم القيد' — أرقام فقط، حوّل الأرقام العربية إلى غربية",
  "subSyndicate":       "القيمة الموجودة بجانب 'النقابه الفرعيه' أو 'النقابة الفرعية'",
  "registrationDate":   "القيمة الكاملة الموجودة بجانب 'تاريخ القيد' كما هي مكتوبة على البطاقة تماماً (بالأرقام العربية إن وُجدت) — مثال: ٢٠٢١-٠٤-٢٨",
  "syndicateType":      "نوع الطبيب من شريط العنوان: بشري أو صيدلي أو أسنان أو بيطري"
}

تعليمات مهمة:
- أرجع قيمة 'registrationDate' كما هي على البطاقة بدون أي تحويل.
- أرجع JSON فقط، بدون أي نص إضافي.
`;

  const data = await askGemini(imageFile, prompt, onProgress);
  onProgress?.(100);

  console.log('[OcrService] Syndicate Gemini response:', data);

  return {
    registrationNumber:        String(data.registrationNumber || '').trim(),
    subSyndicate:              String(data.subSyndicate        || '').trim(),
    syndicateRegistrationYear: extractYear(data.registrationDate),
    syndicateType:             String(data.syndicateType       || '').trim(),
  };
}

/**
 * Beneficiary Document (National ID or Birth Certificate).
 * Extracts name (first 3 words), birth year, and ID number.
 */
export async function extractBeneficiaryDocument(imageFile, onProgress) {
  const prompt = `
هذه صورة لمستند رسمي (قد يكون بطاقة رقم قومي أو شهادة ميلاد).
استخرج البيانات التالية الخاصة بالشخص صاحب المستند (أو الطفل في حالة شهادة الميلاد) وأرجعها كـ JSON فقط:

{
  "fullName": "الاسم بالكامل كما هو مكتوب",
  "nationalId": "رقم الهوية المكون من 14 رقماً (أرقام غربية 0-9 فقط، بدون مسافات)",
  "birthDate": "تاريخ الميلاد المكتوب على المستند (أو استنتجه إذا لم يكن صريحاً ولكن بالاعتماد على المستند)"
}

تعليمات إضافية:
- أرجع JSON فقط بدون أي نصوص إضافية.
- الرقم القومي يتكون من 14 رقماً.
`;

  const data = await askGemini(imageFile, prompt, onProgress);
  onProgress?.(100);

  // 1. Process Name (first 3 names)
  const full = String(data.fullName || '').trim();
  const rawParts = full.split(/\s+/).filter(Boolean);
  const nameParts = [];
  
  for (let i = 0; i < rawParts.length; i++) {
    // Combine "عبد" or "أبو/ابو" with the next word so they count as a single name
    if ((rawParts[i] === 'عبد' || rawParts[i] === 'أبو' || rawParts[i] === 'ابو') && i + 1 < rawParts.length) {
      nameParts.push(rawParts[i] + ' ' + rawParts[i + 1]);
      i++;
    } else {
      nameParts.push(rawParts[i]);
    }
  }
  
  const tripleName = nameParts.slice(0, 3).join(' ');

  // 2. Process National ID
  const nationalId = cleanIdNumber(data.nationalId);

  // 3. Process Birth Year
  // Prefer extracting from the 14-digit National ID if available and valid
  const yearFromId = birthYearFromId(nationalId);
  const extractedYear = extractYear(data.birthDate);
  const finalBirthYear = yearFromId || extractedYear;

  return {
    name: tripleName,
    nationalId: nationalId,
    birthYear: finalBirthYear,
  };
}
