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

// 模拟Excel解析函数（实际项目中需要集成xlsx库）
const parseExcelFile = async file => {
  return new Promise(resolve => {
    // 模拟解析过程
    setTimeout(() => {
      // 模拟Excel数据格式
      const mockData = [{
        brand: '苹果',
        category: '手机',
        model: 'iPhone 16',
        price: 6999,
        updatedAtText: '2025-09-10'
      }, {
        brand: '华为',
        category: '手机',
        model: 'Mate 70',
        price: 5999,
        updatedAtText: '2025-09-10'
      }, {
        brand: '小米',
        category: '手机',
        model: '15 Pro',
        price: 4999,
        updatedAtText: '2025-09-10'
      }];
      resolve(mockData);
    }, 1000);
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
        description: '无法解析Excel文件，请检查格式',
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
        await $w.cloud.callDataSource({
          dataSourceName: 'PhonePrice',
          methodName: 'wedaCreateV2',
          params: {
            data: {
              brand: item.brand,
              category: item.category,
              model: item.model,
              price: Number(item.price),
              updatedAtText: item.updatedAtText || new Date().toLocaleDateString()
            }
          }
        });
        setImportProgress(prev => ({
          ...prev,
          progress: prev.progress + 1,
          successCount: prev.successCount + 1
        }));
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