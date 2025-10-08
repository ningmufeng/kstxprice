// @ts-ignore;
import React from 'react';

export function PriceChips({
  items,
  current,
  onClick,
  activeColor = 'bg-blue-500 text-white',
  inactiveColor = 'bg-gray-200 text-gray-700 hover:bg-gray-300'
}) {
  return <div className="flex flex-wrap gap-1.5">
      {items.map(item => <button key={item} onClick={() => onClick(item)} className={`px-1.5 py-0.5 text-xs rounded transition-colors ${current === item ? activeColor : inactiveColor}`}>
          {item}
        </button>)}
    </div>;
}