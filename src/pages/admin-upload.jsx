// @ts-ignore;
import React, { useState, useCallback } from 'react';
// @ts-ignore;
import { useToast } from '@/components/ui';
// @ts-ignore;
import { Upload, Cloud, CheckCircle, XCircle, Loader } from 'lucide-react';
// @ts-ignore;
import { excelParser } from '@/components/ExcelParser';
// @ts-ignore;
import { ExcelTemplate } from '@/components/ExcelTemplate';

export default function AdminUpload(props) {
  const {
    $w
  } = props;
  const {
    toast
  } = useToast();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState({
    total: 0,
    success: 0,
    failed: 0,
    errors: []
  });
  const handleDragOver = useCallback(e => {
    e.preventDefault();
    e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
  }, []);
  const handleDragLeave = useCallback(e => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
  }, []);
  const handleDrop = useCallback(e => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);
  const handleFileInput = useCallback(e => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // 文件选择处理
  const handleFileSelect = useCallback(async (file) => {
    if (file) {
      // 验证文件格式
      if (!excelParser.validateFile(file)) {
        toast({
          title: '文件格式错误',
          description: '请选择Excel文件(.xlsx或.xls格式)',
          variant: 'destructive'
        });
        return;
      }

      setSelectedFile(file);
      
      try {
        // 获取文件预览
        const preview = await excelParser.getPreview(file, 3);
        toast({
          title: '文件已选择',
          description: `准备导入: ${file.name} (预览到 ${preview.length} 条数据)`,
          variant: 'default'
        });
      } catch (error) {
        toast({
          title: '文件预览失败',
          description: '无法预览Excel文件: ' + error.message,
          variant: 'destructive'
        });
      }
    }
  }, [toast]);

  // Excel解析和导入函数
  const importExcelData = useCallback(async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 解析Excel文件
      const parsedData = await excelParser.parseFile(selectedFile);
      
      if (parsedData.length === 0) {
        toast({
          title: '解析失败',
          description: 'Excel文件中没有找到有效的数据行',
          variant: 'destructive'
        });
        setIsUploading(false);
        return;
      }

      // 添加当前日期到每条数据
      const currentDate = new Date().toLocaleDateString('zh-CN');
      const dataWithDate = parsedData.map(item => ({
        ...item,
        updatedAtText: currentDate
      }));
      const errors = [];
      let successCount = 0;

      // 批量导入数据
      for (let i = 0; i < dataWithDate.length; i++) {
        try {
          // 检查是否已存在相同的数据
          const existingData = await $w.cloud.callDataSource({
            dataSourceName: 'PhonePrice',
            methodName: 'wedaGetRecordsV2',
            params: {
              filter: {
                where: {
                  $and: [
                    { brand: { $eq: dataWithDate[i].brand } },
                    { category: { $eq: dataWithDate[i].category } },
                    { model: { $eq: dataWithDate[i].model } }
                  ]
                }
              },
              pageSize: 1
            }
          });

          // 如果数据已存在，跳过导入
          if (existingData.records && existingData.records.length > 0) {
            console.log(`数据已存在，跳过: ${dataWithDate[i].brand} ${dataWithDate[i].model}`);
            successCount++; // 也算作成功
          } else {
            // 数据不存在，执行导入
            await $w.cloud.callDataSource({
              dataSourceName: 'PhonePrice',
              methodName: 'wedaCreateV2',
              params: {
                data: dataWithDate[i]
              }
            });
            successCount++;
          }
        } catch (error) {
          errors.push(`第${i + 1}行导入失败: ${error.message}`);
        }

        // 更新进度
        setUploadProgress(Math.round((i + 1) / dataWithDate.length * 100));
        await new Promise(resolve => setTimeout(resolve, 200)); // 模拟处理延迟
      }
      setImportResult({
        total: dataWithDate.length,
        success: successCount,
        failed: errors.length,
        errors
      });
      setIsUploading(false);

      // 显示导入结果
      if (errors.length === 0) {
        toast({
          title: '导入成功',
          description: `成功导入 ${successCount} 条数据`,
          variant: 'default'
        });
      } else {
        toast({
          title: '导入完成',
          description: `成功 ${successCount} 条，失败 ${errors.length} 条`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Excel解析失败:', error);
      toast({
        title: '解析失败',
        description: '无法解析Excel文件: ' + error.message,
        variant: 'destructive'
      });
      setIsUploading(false);
    }
  }, [selectedFile, $w, toast]);

  // 下载Excel模板
  const downloadTemplate = useCallback(() => {
    try {
      ExcelTemplate.downloadTemplate();
      toast({
        title: '模板下载成功',
        description: 'Excel模板文件已开始下载',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: '下载失败',
        description: '无法下载模板文件: ' + error.message,
        variant: 'destructive'
      });
    }
  }, [toast]);

  return <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">数据导入管理</h1>
          <p className="text-gray-600 mb-4">上传Excel文件导入手机报价数据</p>
          
          {/* 模板下载按钮 */}
          <div className="flex justify-center">
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Upload className="w-4 h-4 mr-2" />
              下载Excel模板
            </button>
          </div>
        </div>

        {/* 上传区域 */}
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer transition-all hover:border-blue-400 hover:bg-gray-50" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => document.getElementById('file-input')?.click()}>
          <input id="file-input" type="file" accept=".xlsx,.xls" onChange={handleFileInput} className="hidden" />
          
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Cloud className="w-8 h-8 text-blue-600" />
            </div>
            
            <div>
              <p className="font-semibold text-gray-900 text-lg">拖拽文件到此处</p>
              <p className="text-sm text-gray-500 mt-1">或点击选择Excel文件</p>
            </div>
            
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
              选择文件
            </button>
          </div>
        </div>

        {/* 文件信息 */}
        {selectedFile && <div className="bg-white rounded-lg border border-gray-200 p-4 mt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">准备导入</p>
                </div>
              </div>
              <button onClick={importExcelData} disabled={isUploading} className="px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                {isUploading ? '导入中...' : '开始导入'}
              </button>
            </div>
          </div>}

        {/* 上传进度 */}
        {isUploading && <div className="bg-white rounded-lg border border-gray-200 p-4 mt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-gray-900">导入进度</span>
              <span className="text-sm text-gray-500">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{
            width: `${uploadProgress}%`
          }} />
            </div>
          </div>}

        {/* 导入结果 */}
        {importResult.total > 0 && !isUploading && <div className="bg-white rounded-lg border border-gray-200 p-4 mt-6">
            <h3 className="font-medium text-gray-900 mb-3">导入结果</h3>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{importResult.total}</div>
                <div className="text-sm text-gray-600">总记录</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                <div className="text-sm text-gray-600">成功</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                <div className="text-sm text-gray-600">失败</div>
              </div>
            </div>

            {/* 错误详情 */}
            {importResult.errors.length > 0 && <div>
                <h4 className="font-medium text-gray-900 mb-2">错误详情</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {importResult.errors.map((error, index) => <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </div>)}
                </div>
              </div>}
          </div>}

        {/* Excel格式说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h3 className="font-medium text-blue-900 mb-2">Excel格式说明</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• 第一行必须是标题行，包含：品牌、分类、型号、价格</p>
            <p>• 从第二行开始是数据行</p>
            <p>• 品牌、分类、型号不能为空</p>
            <p>• 价格必须是数字</p>
            <p>• 支持.xlsx和.xls格式</p>
          </div>
        </div>
      </div>
    </div>;
}