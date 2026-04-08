import React from 'react';

export default function DashedField({ label, value, onChange, labelWidth, containerClass = 'flex-1' }) {
  return (
    <div className={`flex items-end ${containerClass}`}>
      <span className={`whitespace-nowrap font-bold text-gray-900 inline-block shrink-0 ${labelWidth || ''}`}>
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 ml-1 border-b-[2px] border-dashed border-gray-600 outline-none bg-transparent px-1 text-center text-blue-700 font-bold focus:border-blue-600 min-w-0 h-6 leading-none"
      />
    </div>
  );
}
