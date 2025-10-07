// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Skeleton } from '@/components/ui';

export function PriceTable({
  data,
  loading,
  className
}) {
  if (loading) {
    return <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${className || ''}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium text-gray-700">型号</th>
                <th className="text-left p-3 font-medium text-gray-700">颜色/配置</th>
                <th className="text-right p-3 font-medium text-gray-700">价格</th>
                <th className="text-center p-3 font-medium text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => <tr key={i} className="border-b">
                  <td className="p-3"><Skeleton className="h-4 w-32" /></td>
                  <td className="p-3"><Skeleton className="h-4 w-24" /></td>
                  <td className="p-3 text-right"><Skeleton className="h-4 w-16" /></td>
                  <td className="p-3 text-center"><Skeleton className="h-4 w-12" /></td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>;
  }
  if (!data || data.length === 0) {
    return <div className={`bg-white rounded-lg shadow-sm p-8 text-center text-gray-500 ${className || ''}`}>
        暂无数据
      </div>;
  }
  return <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${className || ''}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3 font-medium text-gray-700">型号</th>
              <th className="text-left p-3 font-medium text-gray-700">颜色/配置</th>
              <th className="text-right p-3 font-medium text-gray-700">价格</th>
              <th className="text-center p-3 font-medium text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => <tr key={index} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <div className="font-medium">{item.model || '-'}</div>
                  {item.modelName && <div className="text-xs text-gray-500">{item.modelName}</div>}
                </td>
                <td className="p-3 text-gray-600">
                  {item.color || item.spec || '-'}
                </td>
                <td className="p-3 text-right font-medium text-red-600">
                  ¥{item.price || '-'}
                </td>
                <td className="p-3 text-center">
                  <a href="tel:0311-85209160" className="text-blue-600 hover:text-blue-800 font-medium">
                    电询
                  </a>
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>
    </div>;
}