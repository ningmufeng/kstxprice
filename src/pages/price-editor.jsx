// @ts-ignore;
import React, { useState, useEffect, useCallback } from 'react';
// @ts-ignore;
import { useToast, Button } from '@/components/ui';
// @ts-ignore;
import { Search, Save, Plus, Trash2 } from 'lucide-react';

export default function PriceEditor(props) {
  const {
    $w,
    style,
    className
  } = props;
  const {
    toast
  } = useToast();
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [modelKeyword, setModelKeyword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState({}); // _id -> price string
  const [editingDate, setEditingDate] = useState({}); // _id -> updatedAtText string (YYYY-MM-DD)
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRecord, setNewRecord] = useState({
    brand: '',
    category: '',
    model: '',
    price: '',
    updatedAtText: ''
  });

  // 工具：获取当天 yyyy-mm-dd
  const today = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const onPriceChange = (id, value) => {
    setEditing(prev => ({
      ...prev,
      [id]: value
    }));
  };
  const onDateChange = (id, value) => {
    setEditingDate(prev => ({
      ...prev,
      [id]: value
    }));
  };
  const buildFilter = () => {
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

    // 日期区间
    if (startDate && endDate) {
      andConds.push({
        updatedAtText: {
          $gte: startDate,
          $lte: endDate
        }
      });
    } else if (startDate) {
      andConds.push({
        updatedAtText: {
          $eq: startDate
        }
      });
    } else if (endDate) {
      andConds.push({
        updatedAtText: {
          $eq: endDate
        }
      });
    }
    return andConds.length > 0 ? {
      where: {
        $and: andConds
      }
    } : undefined;
  };
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        select: {
          $master: true
        },
        orderBy: [{
          updatedAt: 'desc'
        }],
        pageSize: 50,
        pageNumber: 1
      };
      const filter = buildFilter();
      if (filter) params.filter = filter;
      const res = await $w.cloud.callDataSource({
        dataSourceName: 'PhonePrice',
        methodName: 'wedaGetRecordsV2',
        params
      });
      setRecords(res.records || []);
      setEditing({});
      setEditingDate({});
    } catch (e) {
      toast({
        title: '查询失败',
        description: e.message || '请检查数据源权限/网络',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [brand, category, modelKeyword, startDate, endDate, $w, toast]);

  // 首次加载默认当天
  useEffect(() => {
    const d = today();
    setStartDate(d);
    setEndDate(d);
  }, []);

  // 当 startDate/endDate 变化后自动刷新
  useEffect(() => {
    load();
  }, [startDate, endDate, load]);
  const saveOne = async rec => {
    const raw = editing[rec._id];
    const num = Number(raw);
    const valid = Number.isFinite(num) && num > 0;
    const priceToSave = valid ? num : 0;
    const dateEdited = editingDate[rec._id];
    const dateToSave = dateEdited !== undefined ? dateEdited : rec.updatedAtText || today();
    try {
      await $w.cloud.callDataSource({
        dataSourceName: 'PhonePrice',
        methodName: 'wedaUpdateV2',
        params: {
          filter: {
            where: {
              _id: {
                $eq: rec._id
              }
            }
          },
          data: {
            price: priceToSave,
            updatedAtText: dateToSave
          }
        }
      });
      toast({
        title: '已保存',
        description: `${rec.model} 已更新`,
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
  const saveAll = async () => {
    const targets = records.filter(r => Object.prototype.hasOwnProperty.call(editing, r._id));
    if (targets.length === 0) {
      toast({
        title: '无改动',
        description: '没有可保存的修改',
        variant: 'default'
      });
      return;
    }
    setLoading(true);
    let ok = 0,
      fail = 0;
    for (const rec of targets) {
      const raw = editing[rec._id];
      const num = Number(raw);
      const valid = Number.isFinite(num) && num > 0;
      const priceToSave = valid ? num : 0;
      const dateEdited = editingDate[rec._id];
      const dateToSave = dateEdited !== undefined ? dateEdited : rec.updatedAtText || today();
      try {
        await $w.cloud.callDataSource({
          dataSourceName: 'PhonePrice',
          methodName: 'wedaUpdateV2',
          params: {
            filter: {
              where: {
                _id: {
                  $eq: rec._id
                }
              }
            },
            data: {
              price: priceToSave,
              updatedAtText: dateToSave
            }
          }
        });
        ok++;
      } catch (e) {
        fail++;
      }
      await new Promise(r => setTimeout(r, 50));
    }
    setLoading(false);
    toast({
      title: '保存完成',
      description: `成功 ${ok} 条，失败 ${fail} 条`,
      variant: fail ? 'destructive' : 'default'
    });
    load();
  };
  const handleAddRecord = async () => {
    if (!newRecord.brand || !newRecord.category || !newRecord.model) {
      toast({
        title: '信息不完整',
        description: '请填写品牌、分类和型号',
        variant: 'destructive'
      });
      return;
    }
    const num = Number(newRecord.price);
    const valid = Number.isFinite(num) && num > 0;
    const priceToSave = valid ? num : 0;
    try {
      await $w.cloud.callDataSource({
        dataSourceName: 'PhonePrice',
        methodName: 'wedaCreateV2',
        params: {
          data: {
            brand: newRecord.brand,
            category: newRecord.category,
            model: newRecord.model,
            price: priceToSave,
            updatedAtText: newRecord.updatedAtText || today()
          }
        }
      });
      toast({
        title: '添加成功',
        description: `${newRecord.model} 已添加`,
        variant: 'default'
      });
      setShowAddForm(false);
      setNewRecord({
        brand: '',
        category: '',
        model: '',
        price: '',
        updatedAtText: ''
      });
      load();
    } catch (e) {
      toast({
        title: '添加失败',
        description: e.message || '请检查权限与网络',
        variant: 'destructive'
      });
    }
  };
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
  return <div style={style} className={`min-h-screen bg-gray-50 p-4 ${className || ''}`}>
      <div className="max-w-6xl mx-auto space-y-4">
        {/* 顶部操作栏 */}
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
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">开始日期</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">结束日期</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="flex gap-2">
            <Button onClick={load} className="px-4 py-2 flex items-center justify-center">
              <Search className="w-4 h-4 mr-2" /> 查询
            </Button>
            <Button onClick={() => {
            setNewRecord(n => ({
              ...n,
              updatedAtText: today()
            }));
            setShowAddForm(true);
          }} className="px-4 py-2 flex items-center justify-center bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" /> 添加
            </Button>
          </div>
        </div>

        {/* 添加新记录表单 */}
        {showAddForm && <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">添加新记录</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <input placeholder="品牌" value={newRecord.brand} onChange={e => setNewRecord({
            ...newRecord,
            brand: e.target.value
          })} className="border rounded px-3 py-2 text-sm" />
              <input placeholder="分类" value={newRecord.category} onChange={e => setNewRecord({
            ...newRecord,
            category: e.target.value
          })} className="border rounded px-3 py-2 text-sm" />
              <input placeholder="型号" value={newRecord.model} onChange={e => setNewRecord({
            ...newRecord,
            model: e.target.value
          })} className="border rounded px-3 py-2 text-sm" />
              <input placeholder="价格" value={newRecord.price} onChange={e => setNewRecord({
            ...newRecord,
            price: e.target.value
          })} className="border rounded px-3 py-2 text-sm" inputMode="decimal" />
              <div className="flex gap-2">
                <Button onClick={handleAddRecord} className="flex-1">保存</Button>
                <Button onClick={() => setShowAddForm(false)} variant="outline" className="flex-1">取消</Button>
              </div>
            </div>
          </div>}

        {/* 数据表格 - 横向滚动 */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-[140px_120px_1fr_140px_140px_120px_80px] bg-yellow-100 text-sm font-semibold">
                <div className="p-3">品牌</div>
                <div className="p-3">分类</div>
                <div className="p-3">型号</div>
                <div className="p-3">价格日期</div>
                <div className="p-3 text-right">价格</div>
                <div className="p-3 text-right">操作</div>
                <div className="p-3 text-center">删除</div>
              </div>
              {loading ? <div className="p-4 text-gray-500">加载中...</div> : <div className="divide-y divide-gray-100">
                  {records.length === 0 && <div className="p-6 text-center text-gray-500 text-sm">无匹配数据</div>}
                  {records.map(rec => {
                const current = editing[rec._id];
                const displayValue = current !== undefined ? current : rec.price ?? '';
                const currentDate = editingDate[rec._id];
                const displayDate = currentDate !== undefined ? currentDate : rec.updatedAtText || '';
                return <div key={rec._id} className="grid grid-cols-[140px_120px_1fr_140px_140px_120px_80px] items-center hover:bg-gray-50">
                        <div className="p-3 text-sm text-gray-700">{rec.brand}</div>
                        <div className="p-3 text-sm text-gray-700">{rec.category}</div>
                        <div className="p-3 text-sm text-gray-900">{rec.model}</div>
                        <div className="p-3">
                          <input className="w-full border rounded px-2 py-1" type="date" value={displayDate} onChange={e => onDateChange(rec._id, e.target.value)} />
                        </div>
                        <div className="p-3">
                          <input className="w-full border rounded px-2 py-1 text-right" placeholder="数字或留空=电询" value={displayValue} onChange={e => onPriceChange(rec._id, e.target.value)} inputMode="decimal" />
                        </div>
                        <div className="p-3 text-right">
                          <Button onClick={() => saveOne(rec)} className="px-3 py-2 inline-flex items-center">
                            <Save className="w-4 h-4 mr-1" /> 保存
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

        <div className="flex justify-end">
          <Button onClick={saveAll} className="px-4 py-2 inline-flex items-center">
            <Save className="w-4 h-4 mr-2" /> 保存全部修改
          </Button>
        </div>
      </div>
    </div>;
}