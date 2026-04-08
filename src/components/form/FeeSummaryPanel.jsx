import React from 'react';
import { useFormData } from '../../context/FormContext';

export default function FeeSummaryPanel() {
  const { feeResult } = useFormData();

  if (!feeResult || !feeResult.isValid) return null;

  return (
    <div className="mt-6 border border-emerald-300 rounded-xl bg-emerald-50 p-4 print:hidden">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-extrabold text-emerald-800 text-base">ملخص الاشتراك — السنة المالية 2026</h3>
        <span className="text-xs font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
          الدرجة {feeResult.tier}
        </span>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {feeResult.breakdown.map((item, i) => (
            <tr key={i} className="border-b border-emerald-200 last:border-0">
              <td className="py-1.5 font-bold text-gray-700">{item.label}</td>
              {item.note
                ? <td className="py-1.5 text-xs text-amber-700 font-bold text-center">{item.note}</td>
                : <td />}
              <td className="py-1.5 font-extrabold text-emerald-800 text-left" dir="ltr">
                {item.fee.toLocaleString('ar-EG')} ج.م
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 pt-3 border-t-2 border-emerald-400 flex justify-between items-center">
        <span className="font-extrabold text-gray-800 text-base">الإجمالي</span>
        <span className="font-extrabold text-emerald-700 text-xl" dir="ltr">
          {feeResult.total.toLocaleString('ar-EG')} ج.م
        </span>
      </div>
    </div>
  );
}
