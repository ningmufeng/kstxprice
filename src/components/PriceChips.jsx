// @ts-ignore;
import React from 'react';

export function PriceChips({
  items,
  current,
  onClick
}) {
  return <div className="flex flex-wrap gap-1.5">
      {items.map(item => <button key={item} onClick={() => onClick(item)} className={`px-2 py-1 rounded-full text-xs font-medium transition-colors
            ${current === item ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
          {item}
        </button>)}
    </div>;
}