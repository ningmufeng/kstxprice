// @ts-ignore;
import React from 'react';

export function PriceChips({
  items,
  current,
  onClick,
  activeColor = 'bg-blue-500 text-white',
  inactiveColor = 'bg-gray-200 text-gray-700 hover:bg-gray-300'
}) {
  return <div className="flex flex-wrap gap-2">
      {items.map(item => <button key={item} onClick={() => onClick(item)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${current === item ? activeColor : inactiveColor}`}>
          {item}
        </button>)}
    </div>;
}