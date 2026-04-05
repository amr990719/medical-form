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

console.log("Test 1:", extractYear("٢٠٢١-٠٤-٢٨"));
console.log("Test 2:", extractYear("2021-04-28"));
console.log("Test 3:", extractYear("تاريخ القيد ٢٠٢١-٠٤-٢٨"));
console.log("Test 4:", extractYear("تاريخ ٢٠٢١/٠٤/٢٨"));
console.log("Test 5:", extractYear("٢٠٢١٠٤٢٨")); // fallback case
console.log("Test 6:", extractYear("2021"));
console.log("Test 7:", extractYear("٢٨-٠٤-٢٠٢١"));
