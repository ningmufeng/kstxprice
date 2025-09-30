// @ts-ignore;
import React from 'react';

export function PriceChips({
  items,
  current,
  onClick,
  className = ''
}) {
  return <div className={`flex flex-wrap gap-2 ${className}`}>
      {items.map(item => <button key={item} className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${item === current ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-700 border-gray-300 hover:border-red-300 hover:text-red-500'} border`} onClick={() => onClick(item)}>
          {item}
        </button>)}
    </div>;
}