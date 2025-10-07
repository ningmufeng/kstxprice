// @ts-ignore;
import React from 'react';

export function PriceTable({
  data,
  loading,
  className = ''
}) {
  if (loading) {
    return <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
        <div className="grid grid-cols-[1fr_100px] bg-yellow-100">
          <div className="p-3 font-semibold">加载中...</div>
          <div className="p-3 font-semibold text-right">价格</div>
        </div>
        <div className="divide-y divide-gray-100">
          {[1, 2, 3].map(i => <div key={i} className="grid grid-cols-[1fr_100px] animate-pulse">
              <div className="p-3">
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
              <div className="p-3 text-right">
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>)}
        </div>
      </div>;
  }
  if (!data || data.length === 0) {
    return <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
        <div className="grid grid-cols-[1fr_100px] bg-yellow-100">
          <div className="p-3 font-semibold">暂无数据</div>
          <div className="p-3 font-semibold text-right">价格</div>
        </div>
        <div className="p-8 text-center text-gray-500">
          暂无报价信息
        </div>
      </div>;
  }
  return <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      <div className="grid grid-cols-[1fr_100px] bg-yellow-100">
        <div className="p-3 font-semibold">型号</div>
        <div className="p-3 font-semibold text-right">价格</div>
      </div>
      <div className="divide-y divide-gray-100">
        {data.map((item, index) => {
        const n = Number(item.price);
        const isInvalid = !Number.isFinite(n) || n <= 0;
        return <div key={item._id || index} className="grid grid-cols-[1fr_100px] hover:bg-gray-50">
            <div className="p-3">{item.model || `型号 ${index + 1}`}</div>
            <div className={`p-3 text-right font-medium ${isInvalid ? 'text-gray-500' : 'text-green-600'}`}>
              {isInvalid ? '电询' : `¥${n.toLocaleString()}`}
            </div>
          </div>})}
      </div>
    </div>;
}