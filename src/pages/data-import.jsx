// @ts-ignore;
import React, { useState, useCallback } from 'react';
// @ts-ignore;
import { useToast } from '@/components/ui';
// @ts-ignore;
import { Smartphone, Laptop, Upload, Camera, FileText } from 'lucide-react';

// @ts-ignore;
import { FileUploader } from '@/components/FileUploader';
// @ts-ignore;
import { ImportProgress } from '@/components/ImportProgress';
// 由于在CloudBase Builder中运行时可能无法解析本地模块，
// 这里内置一个 XLSX 解析的兜底实现，并在运行时按需加载 CDN
// @ts-ignore
const ensureXLSX = async () => {
  if (typeof window !== 'undefined' && window.XLSX) return;
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('XLSX加载失败'));
    document.head.appendChild(script);
  });
};

// @ts-ignore
const validateExcelFile = (file) => {
  if (!file) return false;
  const name = (file.name || '').toLowerCase();
  const ext = name.split('.').pop();
  const type = (file.type || '').toLowerCase();
  return ['xlsx', 'xls'].includes(ext) || type.includes('spreadsheet') || type.includes('excel');
};

// @ts-ignore
const parseExcelFile = async (file) => {
  await ensureXLSX();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        // @ts-ignore
        const XLSX = window.XLSX;
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const headers = jsonData[0] || [];
        const rows = jsonData.slice(1);
        const parsed = rows.map((row) => {
          const rowData = {};
          headers.forEach((header, colIndex) => {
            if (header && row[colIndex] !== undefined) {
              const headerStr = String(header).trim().toLowerCase();
              if (headerStr.includes('品牌') || headerStr.includes('brand')) {
                rowData.brand = String(row[colIndex]).trim();
              } else if (headerStr.includes('分类') || headerStr.includes('category')) {
                rowData.category = String(row[colIndex]).trim();
              } else if (headerStr.includes('型号') || headerStr.includes('model')) {
                rowData.model = String(row[colIndex]).trim();
              } else if (headerStr.includes('价格') || headerStr.includes('price')) {
                const n = parseFloat(row[colIndex]);
                rowData.price = Number.isFinite(n) ? n : 0;
              } else if (headerStr.includes('更新') || headerStr.includes('date')) {
                rowData.updatedAtText = String(row[colIndex]).trim();
              }
            }
          });
          return rowData;
        }).filter(item => item.brand && item.category && item.model);
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
};

export default function DataImport(props) {
  const {
    $w
  } = props;
  const {
    toast
  } = useToast();
  const [selectedFile, setSelectedFile] = useState(null);
  const [importData, setImportData] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({
    progress: 0,
    total: 0,
    successCount: 0,
    errorCount: 0,
    errors: []
  });
  const handleFileSelect = useCallback(async file => {
    // 验证文件格式
    if (!validateExcelFile(file)) {
      toast({
        title: '文件格式错误',
        description: '请选择Excel文件(.xlsx或.xls格式)',
        variant: 'destructive'
      });
      return;
    }

    setSelectedFile(file);
    try {
      const data = await parseExcelFile(file);
      setImportData(data);
      toast({
        title: '文件解析成功',
        description: `发现 ${data.length} 条待导入数据`,
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: '解析失败',
        description: '无法解析Excel文件，请检查格式: ' + error.message,
        variant: 'destructive'
      });
    }
  }, [toast]);
  const handleImport = useCallback(async () => {
    if (importData.length === 0) return;
    setIsImporting(true);
    setImportProgress({
      progress: 0,
      total: importData.length,
      successCount: 0,
      errorCount: 0,
      errors: []
    });
    const errors = [];
    for (let i = 0; i < importData.length; i++) {
      const item = importData[i];
      try {
        // 检查是否已存在相同的数据
        const existingData = await $w.cloud.callDataSource({
          dataSourceName: 'PhonePrice',
          methodName: 'wedaGetRecordsV2',
          params: {
            filter: {
              where: {
                $and: [
                  { brand: { $eq: item.brand } },
                  { category: { $eq: item.category } },
                  { model: { $eq: item.model } }
                ]
              }
            },
            pageSize: 1
          }
        });

        // 如果数据已存在，跳过导入
        if (existingData.records && existingData.records.length > 0) {
          console.log(`数据已存在，跳过: ${item.brand} ${item.model}`);
          setImportProgress(prev => ({
            ...prev,
            progress: prev.progress + 1,
            successCount: prev.successCount + 1
          }));
        } else {
          // 数据不存在，执行导入
          await $w.cloud.callDataSource({
            dataSourceName: 'PhonePrice',
            methodName: 'wedaCreateV2',
            params: {
              data: {
                brand: item.brand,
                category: item.category,
                model: item.model,
                // 价格清洗：无效/<=0 统一写 0，前端展示为“电询”
                price: (() => {
                  const n = Number(item.price);
                  return Number.isFinite(n) && n > 0 ? n : 0;
                })(),
                updatedAtText: item.updatedAtText || new Date().toLocaleDateString()
              }
            }
          });
          setImportProgress(prev => ({
            ...prev,
            progress: prev.progress + 1,
            successCount: prev.successCount + 1
          }));
        }
      } catch (error) {
        errors.push(`第${i + 1}行: ${error.message}`);
        setImportProgress(prev => ({
          ...prev,
          progress: prev.progress + 1,
          errorCount: prev.errorCount + 1,
          errors: [...prev.errors, `第${i + 1}行: ${error.message}`]
        }));
      }

      // 添加延迟避免请求过于频繁
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    setIsImporting(false);
    toast({
      title: '导入完成',
      description: `成功导入 ${importData.length - errors.length} 条数据，失败 ${errors.length} 条`,
      variant: errors.length > 0 ? 'destructive' : 'default'
    });
  }, [importData, $w, toast]);
  const handleCameraCapture = useCallback(() => {
    toast({
      title: '手机端功能',
      description: '在手机端可以使用相机拍摄Excel文件进行导入',
      variant: 'default'
    });
  }, [toast]);
  return <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 标题 */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">数据导入</h1>
          <p className="text-gray-600 mt-2">选择导入方式将Excel数据导入到手机报价系统</p>
        </div>

        {/* 导入方式选择 */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* 手机端导入 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Smartphone className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-lg font-medium">手机端导入</h2>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              使用手机拍照或选择相册中的Excel文件进行导入
            </p>
            
            <div className="space-y-3">
              <button onClick={handleCameraCapture} className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                <Camera className="w-5 h-5 mr-2" />
                拍照上传
              </button>
              
              <FileUploader onFileSelect={handleFileSelect} title="从相册选择" description="选择手机相册中的Excel文件" icon={<FileText className="w-8 h-8 text-gray-400" />} />
            </div>
          </div>

          {/* 电脑端导入 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Laptop className="w-6 h-6 text-green-600 mr-2" />
              <h2 className="text-lg font-medium">电脑端导入</h2>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              拖拽或选择电脑中的Excel文件进行批量导入
            </p>
            
            <FileUploader onFileSelect={handleFileSelect} title="拖拽或选择文件" description="支持 .xlsx 和 .xls 格式" icon={<Upload className="w-8 h-8 text-gray-400" />} />
          </div>
        </div>

        {/* 文件信息和导入按钮 */}
        {selectedFile && <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-gray-900">已选择文件</h3>
                <p className="text-sm text-gray-500">{selectedFile.name}</p>
              </div>
              <span className="text-sm text-gray-500">
                {importData.length} 条待导入数据
              </span>
            </div>

            {/* 数据预览 */}
            {importData.length > 0 && <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">数据预览</h4>
                <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <div className="grid grid-cols-4 gap-2 text-sm font-medium text-gray-700 mb-2">
                    <div>品牌</div>
                    <div>分类</div>
                    <div>型号</div>
                    <div>价格</div>
                  </div>
                  {importData.slice(0, 5).map((item, index) => <div key={index} className="grid grid-cols-4 gap-2 text-sm text-gray-600 py-1 border-b border-gray-100 last:border-b-0">
                      <div>{item.brand}</div>
                      <div>{item.category}</div>
                      <div>{item.model}</div>
                      <div>¥{item.price}</div>
                    </div>)}
                  {importData.length > 5 && <div className="text-sm text-gray-500 text-center mt-2">
                      还有 {importData.length - 5} 条数据...
                    </div>}
                </div>
              </div>}

            <button onClick={handleImport} disabled={isImporting || importData.length === 0} className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
              {isImporting ? '导入中...' : `开始导入 (${importData.length} 条)`}
            </button>
          </div>}

        {/* 导入进度 */}
        {isImporting && <ImportProgress {...importProgress} />}
      </div>
    </div>;
}