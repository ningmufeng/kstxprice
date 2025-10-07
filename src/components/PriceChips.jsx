// @ts-ignore;
import React from 'react';

export function PriceChips({
  items,
  current,
  onClick
}) {
  return <div className="flex flex-wrap gap-2">
      {items.map(item => <button key={item} onClick={() => onClick(item)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
            ${current === item ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          {item}
        </button>)}
    </div>;
}