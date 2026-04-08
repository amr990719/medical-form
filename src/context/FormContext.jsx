import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { calculateTotal } from '../services/CalculationService';

const FormContext = createContext();

export const useFormData = () => useContext(FormContext);

export const INITIAL_FORM_DATA = {
  syndicateType: '',
  subSyndicate: '',
  registrationNumber: '',
  treatmentCardNumber: '',
  syndicateRegistrationYear: '', 
  workStatus: '',
  memberName: '',
  religion: '',
  nationalId: '',
  gender: '',
  birthYear: '',                 
  governorate: '',
  neighborhood: '',
  address: '',
  mobile: '',
  email: '',
  beneficiaries: Array(10).fill({ kinship: '', name: '', birthYear: '', nationalId: '', documents: {} }),
  declarationName: ''
};

export const INITIAL_MAIN_DOCS = {
  nationalIdFront: null,
  nationalIdBack: null,
  syndicateId: null
};

export const FormProvider = ({ children }) => {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [mainMemberDocs, setMainMemberDocs] = useState(INITIAL_MAIN_DOCS);
  
  const [memberPhoto, setMemberPhoto] = useState(null);
  const [memberPhotoFile, setMemberPhotoFile] = useState(null);
  const [feeResult, setFeeResult] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);

  // Recalculate fees
  useEffect(() => {
    const result = calculateTotal(
      {
        registrationYear: formData.syndicateRegistrationYear,
        workStatus: formData.workStatus,
        birthYear: formData.birthYear,
      },
      formData.beneficiaries
    );
    setFeeResult(result);
  }, [formData.syndicateRegistrationYear, formData.workStatus, formData.birthYear, formData.beneficiaries]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateBeneficiary = (index, field, value) => {
    setFormData(prev => {
      const newBens = [...prev.beneficiaries];
      newBens[index] = { ...newBens[index], [field]: value };
      if (field === 'kinship') newBens[index].documents = {};
      return { ...prev, beneficiaries: newBens };
    });
  };

  const updateBeneficiaryBatch = (index, updatesObj) => {
    setFormData(prev => {
      const newBens = [...prev.beneficiaries];
      const existing = newBens[index];
      const merged = { ...existing };
      for (const [key, val] of Object.entries(updatesObj)) {
        if (val && (!existing[key] || (typeof existing[key] === 'string' && existing[key].trim() === ''))) {
          merged[key] = val;
        }
      }
      newBens[index] = merged;
      return { ...prev, beneficiaries: newBens };
    });
  };

  const updateBeneficiaryDocs = (index, newDocs) => {
    setFormData(prev => {
      const newBens = [...prev.beneficiaries];
      newBens[index] = { ...newBens[index], documents: newDocs };
      return { ...prev, beneficiaries: newBens };
    });
  };

  const handleOcrResult = useCallback((fields) => {
    setFormData(prev => {
      const next = { ...prev };
      for (const [key, val] of Object.entries(fields)) {
        if (val && (!next[key] || next[key].trim() === '')) {
          next[key] = val;
        }
      }
      return next;
    });
  }, []);

  const setMemberPhotoFromFile = (file) => {
    setMemberPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setMemberPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  const setReceiptFromFile = (file) => {
    setReceiptFile(file);
    if (!file) { setReceiptPreview(null); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setReceiptPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setMainMemberDocs(INITIAL_MAIN_DOCS);
    setMemberPhoto(null);
    setMemberPhotoFile(null);
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const value = {
    formData,
    mainMemberDocs,
    memberPhoto,
    memberPhotoFile,
    feeResult,
    receiptFile,
    receiptPreview,
    setFormData,
    setMainMemberDocs,
    setMemberPhoto,
    setMemberPhotoFile,
    setMemberPhotoFromFile,
    setReceiptFromFile,
    updateField,
    updateBeneficiary,
    updateBeneficiaryBatch,
    updateBeneficiaryDocs,
    handleOcrResult,
    resetForm
  };

  return (
    <FormContext.Provider value={value}>
      {children}
    </FormContext.Provider>
  );
};
