/**
 * CalculationService.js
 * =====================
 * Fiscal Year 2026 — Medical Syndicate Fee Calculation Engine
 *
 * Usage:
 *   import { calculateTotal, getTier } from './services/CalculationService';
 *
 * All functions are pure (no side effects) and unit-testable.
 */

// ─── Tier Fee Tables (EGP) ──────────────────────────────────────────────────

/**
 * Fee schedules indexed by tier (1–4).
 * Keys map to beneficiary relationship types used throughout the app.
 *
 * - member      : العضو الأصلي
 * - spouse      : زوج / زوجة
 * - child       : ابن (18 سنة أو أقل) / ابنة
 * - gradSon     : ابن (خريج) / ابن (طالب جامعي)
 * - parent      : أب / أم
 */
export const TIER_FEES = {
  1: { member: 600,  spouse: 800,  child: 500, gradSon: 1200, parent: 1050 },
  2: { member: 700,  spouse: 950,  child: 550, gradSon: 1400, parent: 1200 },
  3: { member: 750,  spouse: 1000, child: 550, gradSon: 1500, parent: 1300 },
  4: { member: 850,  spouse: 1050, child: 600, gradSon: 1750, parent: 1400 },
};

/** Admin fee when registering the member only (no beneficiaries). */
export const ADMIN_FEE_MEMBER_ONLY = 150;

/** Admin fee when at least one beneficiary is added. */
export const ADMIN_FEE_WITH_BENEFICIARIES = 175;

/** Age threshold above which the fee is capped at 500 EGP. */
export const AGE_CAP_THRESHOLD = 70;

/** Capped fee amount for member/spouse who are 70+ years old. */
export const AGE_CAP_FEE = 500;

/** Fiscal year used for all tier and age calculations. */
export const FISCAL_YEAR = 2026;

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Determines the subscription tier (1–4) based on years since registration.
 *
 * @param {string|number} registrationYear  - The year the member registered with the syndicate.
 * @param {string}        workStatus        - The member's work status (e.g. 'معاش' = pension).
 * @returns {1|2|3|4}
 */
export function getTier(registrationYear, workStatus) {
  // Pension members always belong to Tier 4
  if (workStatus === 'معاش') return 4;

  const years = FISCAL_YEAR - parseInt(registrationYear, 10);

  if (years <= 5)  return 1;
  if (years <= 10) return 2;
  if (years <= 15) return 3;
  return 4;
}

/**
 * Returns the full fee table for a given tier.
 *
 * @param {1|2|3|4} tier
 * @returns {{ member: number, spouse: number, child: number, gradSon: number, parent: number }}
 */
export function getTierFees(tier) {
  return TIER_FEES[tier] || TIER_FEES[1];
}

/**
 * Calculates the current age from a birth year.
 *
 * @param {string|number} birthYear
 * @returns {number}
 */
export function getAge(birthYear) {
  return FISCAL_YEAR - parseInt(birthYear, 10);
}

/**
 * Maps a beneficiary's kinship string to the fee table key.
 *
 * @param {string} kinship - Arabic kinship label from the form dropdown.
 * @returns {'spouse'|'child'|'gradSon'|'parent'|null}
 */
export function kinshipToFeeKey(kinship) {
  if (['زوج', 'زوجة'].includes(kinship))                    return 'spouse';
  if (['أب', 'أم'].includes(kinship))                        return 'parent';
  if (['ابن (18 سنة أو أقل)', 'ابنة'].includes(kinship))    return 'child';
  if (['ابن (طالب جامعي)', 'ابن (خريج)'].includes(kinship)) return 'gradSon';
  return null;
}

// ─── Main Calculation ────────────────────────────────────────────────────────

/**
 * Calculates the full fee breakdown for a member and their beneficiaries.
 *
 * @param {object} memberData
 * @param {string} memberData.registrationYear  - Syndicate registration year.
 * @param {string} memberData.workStatus        - Work status ('يعمل', 'معاش', 'متوفى').
 * @param {string} memberData.birthYear         - Member's birth year for age-cap check.
 *
 * @param {Array}  beneficiaries - Array of beneficiary objects from formData.
 * @param {string} beneficiaries[].kinship      - Arabic kinship string.
 * @param {string} beneficiaries[].name         - Beneficiary name (used to filter active rows).
 * @param {string} beneficiaries[].birthYear    - Beneficiary birth year for age-cap check.
 *
 * @returns {{
 *   tier: number,
 *   breakdown: Array<{ label: string, fee: number, note?: string }>,
 *   adminFee: number,
 *   total: number,
 *   isValid: boolean,
 *   errorMessage: string
 * }}
 */
export function calculateTotal(memberData, beneficiaries) {
  const { registrationYear, workStatus, birthYear } = memberData;

  // Guard: registration year must be a valid 4-digit number
  const regYear = parseInt(registrationYear, 10);
  if (!registrationYear || isNaN(regYear) || regYear < 1950 || regYear > FISCAL_YEAR) {
    return {
      tier: 0,
      breakdown: [],
      adminFee: 0,
      total: 0,
      isValid: false,
      errorMessage: 'يرجى إدخال سنة قيد النقابة بشكل صحيح لحساب الاشتراك.',
    };
  }

  const tier       = getTier(registrationYear, workStatus);
  const fees       = getTierFees(tier);
  const breakdown  = [];

  // ── Member fee ──────────────────────────────────────────────────────────
  const memberAge  = birthYear ? getAge(birthYear) : 0;
  const memberFee  = (memberAge >= AGE_CAP_THRESHOLD) ? AGE_CAP_FEE : fees.member;
  const memberNote = (memberAge >= AGE_CAP_THRESHOLD)
    ? `تم تطبيق سقف 500 ج (عمر ${memberAge} سنة)`
    : '';

  breakdown.push({ label: 'العضو الأصلي', fee: memberFee, note: memberNote });

  // ── Active beneficiaries ─────────────────────────────────────────────────
  const activeBens = (beneficiaries || []).filter(b => b.kinship && b.name?.trim());
  const hasActiveBens = activeBens.length > 0;

  for (const ben of activeBens) {
    const feeKey = kinshipToFeeKey(ben.kinship);
    if (!feeKey) continue;

    let benFee  = fees[feeKey];
    let benNote = '';

    // Age cap applies only to spouse
    if (feeKey === 'spouse' && ben.birthYear) {
      const spouseAge = getAge(ben.birthYear);
      if (spouseAge >= AGE_CAP_THRESHOLD) {
        benFee  = AGE_CAP_FEE;
        benNote = `تم تطبيق سقف 500 ج (عمر ${spouseAge} سنة)`;
      }
    }

    breakdown.push({ label: ben.name || ben.kinship, fee: benFee, note: benNote });
  }

  // ── Admin fee ────────────────────────────────────────────────────────────
  const adminFee = hasActiveBens ? ADMIN_FEE_WITH_BENEFICIARIES : ADMIN_FEE_MEMBER_ONLY;
  breakdown.push({ label: 'رسوم إدارية', fee: adminFee, note: '' });

  // ── Total ────────────────────────────────────────────────────────────────
  const total = breakdown.reduce((sum, item) => sum + item.fee, 0);

  return {
    tier,
    breakdown,
    adminFee,
    total,
    isValid: true,
    errorMessage: '',
  };
}
