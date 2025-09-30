// @ts-ignore;
import React, { useState, useCallback } from 'react';
// @ts-ignore;
import { useToast } from '@/components/ui';
// @ts-ignore;
import { Upload, Cloud, CheckCircle, XCircle, Loader, Download } from 'lucide-react';

// 注意：实际项目中需要引入SheetJS库
// import * as XLSX from 'xlsx';

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

  // 模拟Excel解析函数（实际项目中需要集成xlsx库）
  const parseExcelFile = async file => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          // 模拟解析Excel数据
          const mockData = [{
            brand: '苹果',
            category: '手机',
            model: 'iPhone 16 Pro',
            price: 8999,
            updatedAtText: new Date().toLocaleDateString()
          }, {
            brand: '华为',
            category: '手机',
            model: 'Mate 70 Pro',
            price: 7999,
            updatedAtText: new Date().toLocaleDateString()
          }, {
            brand: '小米',
            category: '手机',
            model: '15 Ultra',
            price: 6999,
            updatedAtText: new Date().toLocaleDateString()
          }];
          resolve(mockData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsArrayBuffer(file);
    });
  };
  const validateData = data => {
    const requiredFields = ['brand', 'category', 'model', 'price'];
    const errors = [];
    const validData = [];
    data.forEach((row, index) => {
      const rowErrors = [];

      // 检查必填字段
      requiredFields.forEach(field => {
        if (!row[field] || row[field].toString().trim() === '') {
          rowErrors.push(`第${index + 2}行: ${field}字段不能为空`);
        }
      });

      // 检查价格格式
      if (row.price && isNaN(Number(row.price))) {
        rowErrors.push(`第${index + 2}行: 价格必须是数字`);
      }
      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      } else {
        validData.push({
          brand: row.brand.toString().trim(),
          category: row.category.toString().trim(),
          model: row.model.toString().trim(),
          price: Number(row.price),
          updatedAtText: row.updatedAtText || new Date().toLocaleDateString()
        });
      }
    });
    return {
      validData,
      errors
    };
  };
  const handleFileSelect = useCallback(async file => {
    if (file) {
      setSelectedFile(file);
      toast({
        title: '文件已选择',
        description: `准备导入: ${file.name}`,
        variant: 'default'
      });
    }
  }, [toast]);
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
  const downloadTemplate = useCallback(() => {
    // 实际项目中使用ExcelTemplate.downloadTemplate()
    toast({
      title: '模板下载',
      description: 'Excel模板已准备下载',
      variant: 'default'
    });
  }, [toast]);
  const handleImport = useCallback(async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      // 解析Excel文件
      const data = await parseExcelFile(selectedFile);

      // 验证数据
      const {
        validData,
        errors
      } = validateData(data);
      if (errors.length > 0) {
        toast({
          title: '数据验证失败',
          description: `发现 ${errors.length} 个错误，请修正后重试`,
          variant: 'destructive'
        });
        setImportResult({
          total: data.length,
          success: 0,
          failed: errors.length,
          errors
        });
        setIsUploading(false);
        return;
      }

      // 批量导入数据
      const importErrors = [];
      let successCount = 0;
      for (let i = 0; i < validData.length; i++) {
        try {
          await $w.cloud.callDataSource({
            dataSourceName: 'PhonePrice',
            methodName: 'wedaCreateV2',
            params: {
              data: validData[i]
            }
          });
          successCount++;
        } catch (error) {
          importErrors.push(`第${i + 1}行: ${error.message}`);
        }

        // 更新进度
        setUploadProgress(Math.round((i + 1) / validData.length * 100));
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      setImportResult({
        total: validData.length,
        success: successCount,
        failed: importErrors.length,
        errors: importErrors
      });

      // 显示导入结果
      if (importErrors.length === 0) {
        toast({
          title: '导入成功',
          description: `成功导入 ${successCount} 条数据`,
          variant: 'default'
        });
      } else {
        toast({
          title: '导入完成',
          description: `成功 ${successCount} 条，失败 ${importErrors.length} 条`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: '导入失败',
        description: error.message || '文件处理失败，请重试',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, $w, toast]);
  return <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">后台数据管理</h1>
          <p className="text-gray-600">上传Excel文件导入手机报价数据</p>
        </div>

        {/* 模板下载 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">Excel模板下载</h3>
              <p className="text-sm text-blue-700 mt-1">下载标准模板，按格式填写数据后上传</p>
            </div>
            <button onClick={downloadTemplate} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center">
              <Download className="w-4 h-4 mr-2" />
              下载模板
            </button>
          </div>
        </div>

        {/* 上传区域 */}
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer transition-all hover:border-blue-400 hover:bg-gray-50" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => document.getElementById('file-input')?.click()}>
          <input id="file-input" type="file" accept=".xlsx,.xls" onChange={handleFileInput} className="hidden" />
          
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <Cloud className="w-10 h-10 text-blue-600" />
            </div>
            
            <div>
              <p className="font-semibold text-gray-900 text-xl">拖拽文件到此处</p>
              <p className="text-gray-500 mt-2">或点击选择Excel文件</p>
            </div>
            
            <div className="text-sm text-gray-400">
              支持 .xlsx 和 .xls 格式
            </div>
            
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
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
                  <p className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button onClick={handleImport} disabled={isUploading} className="px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
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
      </div>
    </div>;
}