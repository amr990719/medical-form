import React, { useRef } from 'react';

export default function NidInput({ value, onChange, size = 'large' }) {
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
  const boxClass = size === 'large'
    ? 'w-[24px] h-[32px] text-base'
    : 'w-[18px] h-[26px] text-sm';

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
}
