/**
 * validateReceiptImage — validates a receipt image file before upload.
 * Checks type, size, and minimum pixel dimensions.
 * @param {File} file
 * @returns {Promise<{ valid: boolean, error: string | null }>}
 */
export async function validateReceiptImage(file) {
  // 1. File type
  if (!/^image\/(jpeg|jpg|png|webp|heic)$/i.test(file.type)) {
    return { valid: false, error: 'يجب أن يكون الملف صورة (JPG, PNG, WEBP, HEIC)' };
  }

  // 2. File size — max 8 MB
  if (file.size >= 8 * 1024 * 1024) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return {
      valid: false,
      error: `حجم الملف يجب أن يكون أقل من 8 ميجابايت — الحجم الحالي: ${mb} ميجابايت`,
    };
  }

  // 3. Minimum pixel dimensions (400×300)
  const objectUrl = URL.createObjectURL(file);
  try {
    const { width, height } = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload  = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error('failed to load image'));
      img.src = objectUrl;
    });

    if (width < 400 || height < 300) {
      return {
        valid: false,
        error: 'جودة الصورة منخفضة جداً — يرجى التقاط صورة بدقة أعلى (الحد الأدنى 400×300 بكسل)',
      };
    }
  } catch {
    // If we can't load it, let the upload proceed — server will catch corrupt files
    return { valid: true, error: null };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  return { valid: true, error: null };
}
