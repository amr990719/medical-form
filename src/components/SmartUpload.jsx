/**
 * SmartUpload.jsx
 * ===============
 * A reusable file upload component that supports optional OCR scanning.
 * Displays a file picker, a thumbnail preview, a progress bar during scanning,
 * and triggers a callback with the extracted fields on completion.
 *
 * Props:
 *   label       {string}   - Arabic label shown above the upload box
 *   docType     {string}   - One of 'nationalIdFront', 'nationalIdBack', 'syndicateId'
 *   onFileChange(file)     - Called when a new file is selected
 *   onExtracted(fields)    - Called with extracted field object after OCR completes
 *   currentFile {File|null}- Currently selected file (controlled component)
 */

import React, { useState, useCallback } from 'react';
import {
  extractNationalIdFront,
  extractNationalIdBack,
  extractSyndicateId,
  extractBeneficiaryDocument,
} from '../services/OcrService';

// ─── OCR dispatcher ──────────────────────────────────────────────────────────

/**
 * Routes the OCR call to the correct extractor based on docType.
 */
async function runExtraction(docType, file, onProgress) {
  switch (docType) {
    case 'nationalIdFront': return extractNationalIdFront(file, onProgress);
    case 'nationalIdBack':  return extractNationalIdBack(file, onProgress);
    case 'syndicateId':     return extractSyndicateId(file, onProgress);
    case 'beneficiaryDoc':  return extractBeneficiaryDocument(file, onProgress);
    default: return null;
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SmartUpload({ label, docType, onFileChange, onExtracted, currentFile }) {
  const [preview, setPreview]     = useState(null);   // data-URL for image thumbnail
  const [scanning, setScanning]   = useState(false);  // OCR in progress
  const [progress, setProgress]   = useState(0);      // 0-100
  const [scanDone, setScanDone]   = useState(false);  // OCR completed successfully
  const [scanError, setScanError] = useState('');     // Error message if OCR fails

  // Handle new file selection
  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset scan state when a new file is chosen
    setScanDone(false);
    setScanError('');
    setProgress(0);

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    onFileChange(file);
  }, [onFileChange]);

  // Trigger OCR extraction
  const handleScan = useCallback(async () => {
    if (!currentFile) return;

    setScanning(true);
    setScanError('');
    setScanDone(false);
    setProgress(0);

    try {
      const fields = await runExtraction(docType, currentFile, setProgress);
      if (fields) {
        onExtracted(fields);
        setScanDone(true);
      }
    } catch (err) {
      console.error('[SmartUpload] OCR failed:', err);
      setScanError('فشل المسح التلقائي. يمكنك إدخال البيانات يدوياً.');
    } finally {
      setScanning(false);
    }
  }, [currentFile, docType, onExtracted]);

  return (
    <div className="flex flex-col gap-2">
      {/* Label */}
      <label className="font-bold text-gray-800 text-sm">{label}</label>

      {/* File input row */}
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          className="text-xs text-gray-500
            file:mr-2 file:py-1.5 file:px-3
            file:rounded-md file:border-0
            file:text-xs file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100 cursor-pointer"
        />

        {/* Scan button — only shown when a file is selected and docType supports scanning */}
        {currentFile && ['nationalIdFront', 'nationalIdBack', 'syndicateId', 'beneficiaryDoc'].includes(docType) && (
          <button
            type="button"
            onClick={handleScan}
            disabled={scanning}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-md transition-colors ${
              scanning
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {scanning ? (
              <>
                {/* Spinner */}
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                جارٍ المسح…
              </>
            ) : (
              <>
                {/* Scan icon */}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
                </svg>
                مسح تلقائي
              </>
            )}
          </button>
        )}
      </div>

      {/* Progress bar */}
      {scanning && (
        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Status messages */}
      {scanDone && !scanning && (
        <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
          ✓ تم استخراج البيانات — راجع الحقول أدناه وعدّل إن لزم
        </p>
      )}
      {scanError && (
        <p className="text-xs text-red-600 font-bold">{scanError}</p>
      )}
      {currentFile && !scanning && !scanDone && !scanError && (
        <p className="text-xs text-green-600 font-bold">✓ تم الإرفاق: {currentFile.name}</p>
      )}

      {/* Thumbnail preview */}
      {preview && (
        <img
          src={preview}
          alt="معاينة المستند"
          className="mt-1 w-32 h-20 object-cover rounded border border-gray-300 shadow-sm"
        />
      )}
    </div>
  );
}
