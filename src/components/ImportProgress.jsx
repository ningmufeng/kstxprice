// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export function ImportProgress({
  progress,
  total,
  successCount,
  errorCount,
  errors
}) {
  const percentage = total > 0 ? Math.round(progress / total * 100) : 0;
  return <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">导入进度</h3>
        <span className="text-sm text-gray-500">{progress}/{total}</span>
      </div>

      {/* 进度条 */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{
        width: `${percentage}%`
      }} />
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{total}</div>
          <div className="text-gray-500">总记录</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 mr-1" />
            {successCount}
          </div>
          <div className="text-gray-500">成功</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 flex items-center justify-center">
            <XCircle className="w-5 h-5 mr-1" />
            {errorCount}
          </div>
          <div className="text-gray-500">失败</div>
        </div>
      </div>

      {/* 错误信息 */}
      {errors.length > 0 && <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-2">错误详情</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {errors.map((error, index) => <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </div>)}
          </div>
        </div>}
    </div>;
}