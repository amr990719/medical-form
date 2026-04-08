import React, { useRef } from 'react';

export default function BoxStringInput({ value, onChange, length = 25 }) {
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
}
