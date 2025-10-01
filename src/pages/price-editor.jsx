// @ts-ignore;
import React, { useState, useEffect, useCallback } from 'react';
// @ts-ignore;
import { useToast, Button } from '@/components/ui';
// @ts-ignore;
import { Search, Save } from 'lucide-react';

export default function PriceEditor(props) {
  const { $w, style, className } = props;
  const { toast } = useToast();

  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [modelKeyword, setModelKeyword] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState({}); // _id -> price string

  const onPriceChange = (id, value) => {
    setEditing(prev => ({ ...prev, [id]: value }));
  };

  const buildFilter = () => {
    const andConds = [];
    if (brand) andConds.push({ brand: { $eq: brand } });
    if (category) andConds.push({ category: { $eq: category } });
    if (modelKeyword) andConds.push({ model: { $regex: modelKeyword, $options: 'i' } });
    return andConds.length > 0 ? { where: { $and: andConds } } : undefined;
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        // 确保取到主字段及 _id
        select: { $master: true, _id: true },
        orderBy: [{ updatedAt: 'desc' }],
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
    } catch (e) {
      toast({ title: '查询失败', description: e.message || '请检查数据源权限/网络', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [brand, category, modelKeyword, $w, toast]);

  useEffect(() => {
    // 初始加载最近记录
    load();
  }, []);

  const saveOne = async (rec) => {
    const raw = editing[rec._id];
    const num = Number(raw);
    const valid = Number.isFinite(num) && num > 0;
    const priceToSave = valid ? num : 0; // 0 表示前端展示“电询”
    try {
      // 组装 filter：优先用 _id，兜底用 三键（brand/category/model）
      const where = rec._id ? { _id: { $eq: rec._id } } : {
        $and: [
          { brand: { $eq: rec.brand } },
          { category: { $eq: rec.category } },
          { model: { $eq: rec.model } }
        ]
      };
      await $w.cloud.callDataSource({
        dataSourceName: 'PhonePrice',
        methodName: 'wedaUpdateV2',
        params: {
          filter: { where },
          data: {
            price: priceToSave,
            updatedAtText: new Date().toLocaleDateString()
          }
        }
      });
      toast({ title: '已保存', description: `${rec.model} 已更新`, variant: 'default' });
    } catch (e) {
      toast({ title: '保存失败', description: e.message || '请检查权限与网络', variant: 'destructive' });
    }
  };

  const saveAll = async () => {
    const targets = records.filter(r => Object.prototype.hasOwnProperty.call(editing, r._id));
    if (targets.length === 0) {
      toast({ title: '无改动', description: '没有可保存的修改', variant: 'default' });
      return;
    }
    setLoading(true);
    let ok = 0; let fail = 0;
    for (const rec of targets) {
      const raw = editing[rec._id];
      const num = Number(raw);
      const valid = Number.isFinite(num) && num > 0;
      const priceToSave = valid ? num : 0;
      try {
        const where = rec._id ? { _id: { $eq: rec._id } } : {
          $and: [
            { brand: { $eq: rec.brand } },
            { category: { $eq: rec.category } },
            { model: { $eq: rec.model } }
          ]
        };
        await $w.cloud.callDataSource({
          dataSourceName: 'PhonePrice',
          methodName: 'wedaUpdateV2',
          params: {
            filter: { where },
            data: { price: priceToSave, updatedAtText: new Date().toLocaleDateString() }
          }
        });
        ok++;
      } catch (e) {
        fail++;
      }
      await new Promise(r => setTimeout(r, 50));
    }
    setLoading(false);
    toast({ title: '保存完成', description: `成功 ${ok} 条，失败 ${fail} 条`, variant: fail ? 'destructive' : 'default' });
    load();
  };

  return (
    <div style={style} className={`min-h-screen bg-gray-50 p-4 ${className || ''}`}>
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">品牌</label>
            <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="如：苹果/华为" className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">分类</label>
            <input value={category} onChange={e => setCategory(e.target.value)} placeholder="如：手机/平板" className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">型号关键词</label>
            <input value={modelKeyword} onChange={e => setModelKeyword(e.target.value)} placeholder="如：iPhone 16" className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <Button onClick={load} className="px-4 py-2 flex items-center justify-center">
            <Search className="w-4 h-4 mr-2" /> 查询
          </Button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="grid grid-cols-[140px_120px_1fr_140px_120px] bg-yellow-100 text-sm font-semibold">
            <div className="p-3">品牌</div>
            <div className="p-3">分类</div>
            <div className="p-3">型号</div>
            <div className="p-3 text-right">价格</div>
            <div className="p-3 text-right">操作</div>
          </div>
          {loading ? (
            <div className="p-4 text-gray-500">加载中...</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {records.length === 0 && <div className="p-6 text-center text-gray-500 text-sm">无匹配数据</div>}
              {records.map((rec) => {
                const current = editing[rec._id];
                const displayValue = current !== undefined ? current : (rec.price ?? '');
                return (
                  <div key={rec._id} className="grid grid-cols-[140px_120px_1fr_140px_120px] items-center hover:bg-gray-50">
                    <div className="p-3 text-sm text-gray-700">{rec.brand}</div>
                    <div className="p-3 text-sm text-gray-700">{rec.category}</div>
                    <div className="p-3 text-sm text-gray-900">{rec.model}</div>
                    <div className="p-3">
                      <input
                        className="w-full border rounded px-2 py-1 text-right"
                        placeholder="数字或留空=电询"
                        value={displayValue}
                        onChange={e => onPriceChange(rec._id, e.target.value)}
                        inputMode="decimal"
                      />
                    </div>
                    <div className="p-3 text-right">
                      <Button onClick={() => saveOne(rec)} className="px-3 py-2 inline-flex items-center">
                        <Save className="w-4 h-4 mr-1" /> 保存
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={saveAll} className="px-4 py-2 inline-flex items-center">
            <Save className="w-4 h-4 mr-2" /> 保存全部修改
          </Button>
        </div>
      </div>
    </div>
  );
}


