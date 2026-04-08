import React from 'react';

export default function RadioBoxGroup({ label, options, name, value, onChange, labelWidth, containerClass = '' }) {
  return (
    <div className={`flex items-end ${containerClass}`}>
      <span className={`whitespace-nowrap font-bold text-gray-900 inline-block shrink-0 ${labelWidth || ''}`}>
        {label}
      </span>
      <div className="flex items-center justify-start gap-1">
        {options.map((opt) => (
          <label
            key={opt}
            className={`flex items-center justify-center px-1.5 h-[26px] border-[1.5px] border-black cursor-pointer transition-colors ${value === opt ? 'bg-gray-300 shadow-inner' : 'bg-white hover:bg-gray-100'}`}
          >
            <span className={`text-[13px] font-bold leading-none mt-0.5 ${value === opt ? 'text-black' : 'text-gray-800'}`}>
              {opt}
            </span>
            <input
              type="radio"
              name={name}
              value={opt}
              checked={value === opt}
              onChange={() => onChange(opt)}
              className="hidden"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
