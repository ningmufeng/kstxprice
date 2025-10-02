// @ts-ignore;
import React, { useState, useEffect, useCallback } from 'react';
// @ts-ignore;
import { useToast, Button } from '@/components/ui';
// @ts-ignore;
import { Search, Trash2, Edit3, PlusCircle } from 'lucide-react';

export default function DataManagement(props) {
  const {
    $w,
    style,
    className
  } = props;
  const {
    toast
  } = useToast();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [modelKeyword, setModelKeyword] = useState('');
  const [editing, setEditing] = useState({}); // _id -> { price, updatedAt }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        select: {
          $master: true,
          updatedAt: true
        },
        orderBy: [{
          updatedAt: 'desc'
        }],
        pageSize: 100,
        pageNumber: 1
      };
      const andConds = [];
      if (brand) andConds.push({
        brand: {
          $eq: brand
        }
      });
      if (category) andConds.push({
        category: {
          $eq: category
        }
      });
      if (modelKeyword) andConds.push({
        model: {
          $regex_ci: modelKeyword
        }
      });
      if (andConds.length) params.filter = {
        where: {
          $and: andConds
        }
      };
      const res = await $w.cloud.callDataSource({
        dataSourceName: 'PhonePrice',
        methodName: 'wedaGetRecordsV2',
        params
      });
      setRecords(res.records || []);
      setEditing({});
    } catch (e) {
      toast({
        title: '查询失败',
        description: e.message || '请检查数据源权限/网络',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [brand, category, modelKeyword, $w, toast]);
  useEffect(() => {
    load();
  }, [load]);
  const handleDelete = async record => {
    if (!confirm(`确定要删除 ${record.brand} ${record.model} 吗？`)) return;
    try {
      await $w.cloud.callDataSource({
        dataSourceName: 'PhonePrice',
        methodName: 'wedaDeleteV2',
        params: {
          filter: {
            where: {
              _id: record._id
            }
          }
        }
      });
      toast({
        title: '删除成功',
        description: `${record.model} 已删除`,
        variant: 'default'
      });
      load();
    } catch (e) {
      toast({
        title: '删除失败',
        description: e.message || '请检查权限与网络',
        variant: 'destructive'
      });
    }
  };
  const handleSave = async record => {
    const data = editing[record._id];
    if (!data) return;
    const price = Number(data.price);
    if (!Number.isFinite(price) || price < 0) {
      toast({
        title: '价格格式错误',
        description: '请输入有效数字',
        variant: 'destructive'
      });
      return;
    }
    try {
      await $w.cloud.callDataSource({
        dataSourceName: 'PhonePrice',
        methodName: 'wedaUpdateV2',
        params: {
          filter: {
            where: {
              _id: {
                $eq: record._id
              }
            }
          },
          data: {
            price,
            updatedAt: new Date()
          }
        }
      });
      toast({
        title: '已保存',
        description: `${record.model} 已更新`,
        variant: 'default'
      });
      load();
    } catch (e) {
      toast({
        title: '保存失败',
        description: e.message || '请检查权限与网络',
        variant: 'destructive'
      });
    }
  };
  const onEditChange = (id, field, value) => {
    setEditing(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: value
      }
    }));
  };
  return <div style={style} className={`min-h-screen bg-gray-50 p-4 ${className || ''}`}>
      <div className="max-w-7xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">数据管理</h1>

        {/* 筛选栏 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">品牌</label>
            <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="如：苹果/华为" className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">分类</label>
            <input value={category} onChange={e => setCategory(e.target.value)} placeholder="如：手机/平板" className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">型号关键词</label>
            <input value={modelKeyword} onChange={e => setModelKeyword(e.target.value)} placeholder="如：iPhone 16" className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="flex gap-2">
            <Button onClick={load} className="px-4 py-2 flex items-center justify-center">
              <Search className="w-4 h-4 mr-2" /> 查询
            </Button>
            <Button onClick={() => $w.utils.navigateTo({
            pageId: 'price-editor',
            params: {}
          })} className="px-4 py-2 flex items-center justify-center bg-green-600 hover:bg-green-700">
              <PlusCircle className="w-4 h-4 mr-2" /> 新增
            </Button>
          </div>
        </div>

        {/* 数据表格 */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-[140px_120px_1fr_160px_120px_120px_80px] bg-yellow-100 text-sm font-semibold">
                <div className="p-3">品牌</div>
                <div className="p-3">分类</div>
                <div className="p-3">型号</div>
                <div className="p-3">最后更新</div>
                <div className="p-3 text-right">价格</div>
                <div className="p-3 text-right">操作</div>
                <div className="p-3 text-center">删除</div>
              </div>
              {loading ? <div className="p-4 text-gray-500">加载中...</div> : <div className="divide-y divide-gray-100">
                  {records.length === 0 && <div className="p-6 text-center text-gray-500 text-sm">无匹配数据</div>}
                  {records.map(rec => {
                const editData = editing[rec._id] || {};
                const priceVal = editData.price !== undefined ? editData.price : rec.price ?? '';
                return <div key={rec._id} className="grid grid-cols-[140px_120px_1fr_160px_120px_120px_80px] items-center hover:bg-gray-50">
                        <div className="p-3 text-sm text-gray-700">{rec.brand}</div>
                        <div className="p-3 text-sm text-gray-700">{rec.category}</div>
                        <div className="p-3 text-sm text-gray-900">{rec.model}</div>
                        <div className="p-3 text-sm text-gray-600">
                          {rec.updatedAt ? new Date(rec.updatedAt).toLocaleString() : '-'}
                        </div>
                        <div className="p-3">
                          <input className="w-full border rounded px-2 py-1 text-right" placeholder="价格" value={priceVal} onChange={e => onEditChange(rec._id, 'price', e.target.value)} inputMode="decimal" />
                        </div>
                        <div className="p-3 text-right">
                          <Button onClick={() => handleSave(rec)} className="px-3 py-2 inline-flex items-center">
                            <Edit3 className="w-4 h-4 mr-1" /> 保存
                          </Button>
                        </div>
                        <div className="p-3 text-center">
                          <Button onClick={() => handleDelete(rec)} className="px-3 py-2 inline-flex items-center bg-red-600 hover:bg-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>;
              })}
                </div>}
            </div>
          </div>
        </div>
      </div>
    </div>;
}