// @ts-ignore;
import React, { useState, useCallback } from 'react';
// @ts-ignore;
import { useToast } from '@/components/ui';
// @ts-ignore;
import { Trash2, Database, AlertTriangle, CheckCircle } from 'lucide-react';

export default function DataCleanup(props) {
  const { $w } = props;
  const { toast } = useToast();
  
  const [duplicateData, setDuplicateData] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanupResult, setCleanupResult] = useState(null);

  // 扫描重复数据
  const scanDuplicates = useCallback(async () => {
    setIsScanning(true);
    setDuplicateData([]);
    
    try {
      // 获取所有数据
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'PhonePrice',
        methodName: 'wedaGetRecordsV2',
        params: {
          select: { $master: true },
          pageSize: 1000,
          pageNumber: 1
        }
      });

      if (result.records && result.records.length > 0) {
        // 按品牌、分类、型号分组查找重复数据
        const groups = {};
        result.records.forEach(record => {
          const key = `${record.brand}-${record.category}-${record.model}`;
          if (!groups[key]) {
            groups[key] = [];
          }
          groups[key].push(record);
        });

        // 找出重复的数据组
        const duplicates = [];
        Object.values(groups).forEach(group => {
          if (group.length > 1) {
            // 按创建时间排序，保留最新的
            group.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            const toDelete = group.slice(1); // 删除除最新外的所有记录
            duplicates.push({
              brand: group[0].brand,
              category: group[0].category,
              model: group[0].model,
              keep: group[0],
              delete: toDelete
            });
          }
        });

        setDuplicateData(duplicates);
        
        toast({
          title: '扫描完成',
          description: `发现 ${duplicates.length} 组重复数据，共 ${duplicates.reduce((sum, item) => sum + item.delete.length, 0)} 条需要删除`,
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('扫描重复数据失败:', error);
      toast({
        title: '扫描失败',
        description: '无法扫描重复数据: ' + error.message,
        variant: 'destructive'
      });
    } finally {
      setIsScanning(false);
    }
  }, [$w, toast]);

  // 清理重复数据
  const cleanupDuplicates = useCallback(async () => {
    if (duplicateData.length === 0) return;
    
    setIsCleaning(true);
    setCleanupResult(null);
    
    let deletedCount = 0;
    let errorCount = 0;
    const errors = [];

    try {
      for (const group of duplicateData) {
        for (const record of group.delete) {
          try {
            await $w.cloud.callDataSource({
              dataSourceName: 'PhonePrice',
              methodName: 'wedaDeleteV2',
              params: {
                _id: record._id
              }
            });
            deletedCount++;
          } catch (error) {
            errorCount++;
            errors.push(`删除失败 ${record.brand} ${record.model}: ${error.message}`);
          }
          
          // 添加延迟避免请求过于频繁
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      setCleanupResult({
        deleted: deletedCount,
        errors: errorCount,
        errorMessages: errors
      });

      toast({
        title: '清理完成',
        description: `成功删除 ${deletedCount} 条重复数据${errorCount > 0 ? `，失败 ${errorCount} 条` : ''}`,
        variant: errorCount > 0 ? 'destructive' : 'default'
      });

      // 重新扫描
      scanDuplicates();
      
    } catch (error) {
      console.error('清理重复数据失败:', error);
      toast({
        title: '清理失败',
        description: '清理过程中发生错误: ' + error.message,
        variant: 'destructive'
      });
    } finally {
      setIsCleaning(false);
    }
  }, [duplicateData, $w, toast, scanDuplicates]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 标题 */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">数据清理工具</h1>
          <p className="text-gray-600 mt-2">清理数据库中的重复手机报价数据</p>
        </div>

        {/* 操作按钮 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={scanDuplicates}
              disabled={isScanning}
              className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Database className="w-5 h-5 mr-2" />
              {isScanning ? '扫描中...' : '扫描重复数据'}
            </button>
            
            {duplicateData.length > 0 && (
              <button
                onClick={cleanupDuplicates}
                disabled={isCleaning}
                className="flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                {isCleaning ? '清理中...' : `清理重复数据 (${duplicateData.reduce((sum, item) => sum + item.delete.length, 0)} 条)`}
              </button>
            )}
          </div>
        </div>

        {/* 重复数据列表 */}
        {duplicateData.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">发现的重复数据</h3>
            <div className="space-y-4">
              {duplicateData.map((group, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">
                      {group.brand} - {group.category} - {group.model}
                    </h4>
                    <span className="text-sm text-gray-500">
                      {group.delete.length} 条重复
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {/* 保留的记录 */}
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      <span className="text-sm">
                        保留: {new Date(group.keep.createdAt).toLocaleString('zh-CN')} 
                        (¥{group.keep.price})
                      </span>
                    </div>
                    
                    {/* 删除的记录 */}
                    {group.delete.map((record, recordIndex) => (
                      <div key={recordIndex} className="flex items-center text-red-600 ml-6">
                        <Trash2 className="w-4 h-4 mr-2" />
                        <span className="text-sm">
                          删除: {new Date(record.createdAt).toLocaleString('zh-CN')} 
                          (¥{record.price})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 清理结果 */}
        {cleanupResult && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">清理结果</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{cleanupResult.deleted}</div>
                <div className="text-sm text-gray-600">成功删除</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{cleanupResult.errors}</div>
                <div className="text-sm text-gray-600">删除失败</div>
              </div>
            </div>

            {/* 错误详情 */}
            {cleanupResult.errorMessages.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">错误详情</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {cleanupResult.errorMessages.map((error, index) => (
                    <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 使用说明 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">使用说明</h4>
              <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                <li>• 点击"扫描重复数据"按钮查找数据库中的重复记录</li>
                <li>• 重复数据按品牌、分类、型号进行分组</li>
                <li>• 每组重复数据中，保留最新创建的记录，删除其他重复记录</li>
                <li>• 清理操作不可逆，请谨慎操作</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
