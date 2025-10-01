// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Button } from '@/components/ui';
// @ts-ignore;
import { Upload, Database, Edit } from 'lucide-react';

export default function DataManagement(props) {
  const {
    $w
  } = props;
  const navigateToImport = () => {
    $w.utils.navigateTo({
      pageId: 'data-import',
      params: {}
    });
  };
  const navigateToEdit = () => {
    // 跳转到价格编辑页面
    $w.utils.navigateTo({
      pageId: 'price-editor',
      params: {}
    });
  };
  return <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 标题 */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">数据管理</h1>
          <p className="text-gray-600 mt-2">管理手机报价数据</p>
        </div>

        {/* 功能卡片 */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Excel导入 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Excel导入</h3>
            <p className="text-gray-600 mb-4 text-sm">
              通过Excel文件批量导入手机报价数据
            </p>
            <Button onClick={navigateToImport} className="w-full">
              开始导入
            </Button>
          </div>

          {/* 手动编辑 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Edit className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">手动编辑</h3>
            <p className="text-gray-600 mb-4 text-sm">
              手动添加或修改手机报价信息
            </p>
            <Button onClick={navigateToEdit} variant="outline" className="w-full">
              进入编辑
            </Button>
          </div>
        </div>

        {/* 数据统计 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Database className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="font-medium text-gray-900">数据统计</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">28</div>
              <div className="text-sm text-gray-600">总记录数</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">5</div>
              <div className="text-sm text-gray-600">品牌数量</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">2</div>
              <div className="text-sm text-gray-600">分类数量</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">2025-09-09</div>
              <div className="text-sm text-gray-600">最后更新</div>
            </div>
          </div>
        </div>
      </div>
    </div>;
}