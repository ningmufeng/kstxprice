// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { useToast } from '@/components/ui';
// @ts-ignore;
import { Search } from 'lucide-react';

import { PriceChips } from '@/components/PriceChips';
import { PriceTable } from '@/components/PriceTable';
export default function PhonePrice(props) {
  const {
    $w,
    style,
    className
  } = props;
  const {
    toast
  } = useToast();

  /* ---------------- 原有状态 ---------------- */
  const defaultBrands = ['华为', '荣耀', 'OPPO', 'vivo', '三星', '小米', '苹果'];
  const [brands, setBrands] = useState(defaultBrands);
  const [categories] = useState(['手机', '平板', '手表', '耳机']);
  const [selectedBrand, setSelectedBrand] = useState('华为');
  const [selectedCategory, setSelectedCategory] = useState('手机');
  const [priceData, setPriceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');

  /* ---------------- 新增查询行状态 ---------------- */
  const [queryBrand, setQueryBrand] = useState('华为');
  const [queryCategory, setQueryCategory] = useState('手机');
  const [queryModel, setQueryModel] = useState('');
  const [latestRecord, setLatestRecord] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);

  /* ---------------- 工具函数（保持已有） ---------------- */
  const pad2 = n => String(n).padStart(2, '0');
  const formatDateTime = d => {
    if (!d) return '';
    const year = d.getFullYear();
    const month = pad2(d.getMonth() + 1);
    const day = pad2(d.getDate());
    const hour = pad2(d.getHours());
    const minute = pad2(d.getMinutes());
    return `${year}-${month}-${day} ${hour}:${minute}`;
  };
  const excelSerialToDate = serial => {
    const n = Number(serial);
    if (!Number.isFinite(n)) return null;
    const ms = Math.round((n - 25569) * 86400 * 1000);
    return new Date(ms);
  };
  const parseRecordUpdateTime = rec => {
    const txt = rec?.updatedAtText;
    if (txt) {
      if (/^\d+(\.\d+)?$/.test(String(txt).trim())) {
        const d = excelSerialToDate(txt);
        if (d) return d;
      }
      const s = String(txt).trim();
      const hasTime = /\dT\d|\d \d/.test(s);
      const tryDate = new Date(hasTime ? s : `${s}T00:00:00`);
      if (!isNaN(tryDate.getTime())) return tryDate;
    }
    const upd = rec?.updatedAt ? new Date(rec.updatedAt) : null;
    if (upd && !isNaN(upd.getTime())) return upd;
    return null;
  };
  const toHalfWidth = str => {
    if (!str) return str;
    return str.replace(/[\uFF01-\uFF5E]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 65248)).replace(/\u3000/g, ' ');
  };
  const normalizeBrandName = raw => {
    if (!raw) return raw;
    const s = toHalfWidth(String(raw)).trim();
    const letters = s.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '');
    const lower = letters.toLowerCase();
    if (lower === 'vivo') return 'vivo';
    return s;
  };
  const vivoSynonyms = ['vivo', 'VIVO', 'Vivo', 'ViVo', 'vIvO', 'ＶＩＶＯ'];

  // 安全转义正则
  const escapeReg = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  /* ---------------- 原有逻辑（保持已有） ---------------- */
  useEffect(() => {
    const currentDate = new Date();
    const formattedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    const pageTitle = `石家庄旷世唐朵通讯报价单 ${formattedDate}`;
    document.title = pageTitle;
    const setWechatShareMeta = () => {
      const existingMeta = document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]');
      existingMeta.forEach(meta => meta.remove());
      const ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      ogTitle.setAttribute('content', pageTitle);
      document.head.appendChild(ogTitle);
      const ogType = document.createElement('meta');
      ogType.setAttribute('property', 'og:type');
      ogType.setAttribute('content', 'website');
      document.head.appendChild(ogType);
      const ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      ogUrl.setAttribute('content', window.location.href);
      document.head.appendChild(ogUrl);
      const ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      ogDescription.setAttribute('content', '石家庄旷世唐朵通讯最新手机报价单，实时更新各大品牌手机、平板、手表、耳机价格');
      document.head.appendChild(ogDescription);
    };
    setWechatShareMeta();
  }, []);
  const loadBrands = async () => {
    try {
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'PhonePrice',
        methodName: 'wedaGetRecordsV2',
        params: {
          select: {
            brand: true
          },
          pageSize: 100,
          pageNumber: 1
        }
      });
      if (result.records && result.records.length > 0) {
        const brandSet = new Set();
        result.records.forEach(item => {
          const normalized = normalizeBrandName(item.brand);
          if (normalized) brandSet.add(normalized);
        });
        if (brandSet.size > 0) {
          const existing = Array.from(brandSet);
          const ordered = defaultBrands.filter(b => brandSet.has(b));
          const others = existing.filter(b => !defaultBrands.includes(b)).sort();
          const brandList = [...ordered, ...others];
          setBrands(brandList);
          if (brandList.length > 0 && !brandList.includes(selectedBrand)) {
            setSelectedBrand(brandList[0]);
          }
          // 同步初始化查询行品牌
          if (!brandList.includes(queryBrand)) setQueryBrand(brandList[0]);
        }
      }
    } catch (error) {
      console.error('加载品牌失败:', error);
      toast({
        title: '加载失败',
        description: '无法获取品牌列表: ' + (error.message || '请检查数据模型连接'),
        variant: 'destructive'
      });
    }
  };
  const loadPriceData = async () => {
    if (!selectedBrand || !selectedCategory) return;
    setLoading(true);
    try {
      const brandFilter = selectedBrand.toLowerCase() === 'vivo' ? {
        $in: vivoSynonyms
      } : {
        $eq: selectedBrand
      };
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'PhonePrice',
        methodName: 'wedaGetRecordsV2',
        params: {
          filter: {
            where: {
              $and: [{
                brand: brandFilter
              }, {
                category: {
                  $eq: selectedCategory
                }
              }]
            }
          },
          select: {
            $master: true
          },
          orderBy: [{
            updatedAt: 'desc'
          }],
          pageSize: 50,
          pageNumber: 1
        }
      });
      if (result.records && result.records.length > 0) {
        setPriceData(result.records);
        const latestItem = result.records[0];
        const d = latestItem && latestItem.updatedAt ? new Date(latestItem.updatedAt) : null;
        setLastUpdate(d && !isNaN(d.getTime()) ? formatDateTime(d) : '');
      } else {
        setPriceData([]);
        setLastUpdate('');
      }
    } catch (error) {
      console.error('加载报价数据失败:', error);
      toast({
        title: '加载失败',
        description: '无法获取报价数据: ' + (error.message || '请检查查询条件或数据连接'),
        variant: 'destructive'
      });
      setPriceData([]);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- 新增：查询最新一条记录 ---------------- */
  const loadLatestRecord = async () => {
    if (!queryBrand || !queryCategory) {
      toast({
        title: '提示',
        description: '请先选择品牌和分类',
        variant: 'default'
      });
      return;
    }
    setQueryLoading(true);
    try {
      const brandFilter = queryBrand.toLowerCase() === 'vivo' ? {
        $in: vivoSynonyms
      } : {
        $eq: queryBrand
      };
      const where = {
        $and: [{
          brand: brandFilter
        }, {
          category: {
            $eq: queryCategory
          }
        }]
      };
      if (queryModel.trim()) {
        const kw = toHalfWidth(queryModel.trim());
        const pattern = `.*${escapeReg(kw)}.*`;
        where.$and.push({
          $or: [
            { model: { $regex_ci: pattern } },
            { modelName: { $regex_ci: pattern } }
          ]
        });
      }
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'PhonePrice',
        methodName: 'wedaGetRecordsV2',
        params: {
          filter: {
            where
          },
          select: {
            $master: true
          },
          orderBy: [{
            updatedAt: 'desc'
          }],
          pageSize: 1,
          pageNumber: 1
        }
      });
       setLatestRecord(result.records?.[0] || null);
    } catch (error) {
      console.error('查询最新记录失败:', error);
      toast({
        title: '查询失败',
        description: error.message || '请稍后重试',
        variant: 'destructive'
      });
      setLatestRecord(null);
    } finally {
      setQueryLoading(false);
    }
  };
  useEffect(() => {
    loadBrands();
  }, []);
  useEffect(() => {
    if (selectedBrand && selectedCategory) loadPriceData();
  }, [selectedBrand, selectedCategory]);
  const currentDate = new Date();
  const formattedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
  return <div style={style} className={`min-h-screen bg-gray-50 flex flex-col ${className || ''}`}>
      {/* 顶部标题栏 */}
      <header className="bg-blue-600 text-white p-4 sticky top-0 z-10 shadow-md">
        <h1 className="text-lg font-bold text-center">
          石家庄旷世唐朵通讯报价单 {formattedDate}
        </h1>
      </header>

      <main className="flex-1 p-4 space-y-4 max-w-4xl mx-auto w-full">
        {/* 品牌 Chips */}
        <section className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-700 mb-2">品牌</div>
          <PriceChips items={brands} current={selectedBrand} onClick={setSelectedBrand} />
        </section>

        {/* 分类 Chips */}
        <section className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-700 mb-2">分类</div>
          <PriceChips items={categories} current={selectedCategory} onClick={setSelectedCategory} />
        </section>

        {/* 新增：型号查询行 */}
        <section className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-700 mb-2">快速查询最新一条</div>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[120px]">
              <label className="text-xs text-gray-600 mb-1 block">品牌</label>
              <select value={queryBrand} onChange={e => setQueryBrand(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="text-xs text-gray-600 mb-1 block">分类</label>
              <select value={queryCategory} onChange={e => setQueryCategory(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="text-xs text-gray-600 mb-1 block">型号（模糊）</label>
              <input type="text" placeholder="输入型号关键词" value={queryModel} onChange={e => setQueryModel(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
            </div>
            <button onClick={loadLatestRecord} disabled={queryLoading} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm flex items-center gap-1 disabled:opacity-50">
              <Search size={14} />
              {queryLoading ? '查询中...' : '查询'}
            </button>
          </div>
        </section>

        {/* 最新一条记录卡片 */}
        {latestRecord && <section className="bg-white rounded-lg shadow-sm border border-blue-200">
            <div className="bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 rounded-t-lg">
              最新一条记录
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div><span className="font-medium text-gray-600">品牌：</span>{latestRecord.brand}</div>
              <div><span className="font-medium text-gray-600">分类：</span>{latestRecord.category}</div>
              <div className="sm:col-span-2"><span className="font-medium text-gray-600">型号：</span>{latestRecord.modelName}</div>
              <div><span className="font-medium text-gray-600">价格：</span><span className="text-red-600 font-bold">{latestRecord.price} 元</span></div>
              <div><span className="font-medium text-gray-600">更新时间：</span>{formatDateTime(parseRecordUpdateTime(latestRecord))}</div>
            </div>
          </section>}

        {/* 原有表格标题 */}
        {lastUpdate && <div className="text-sm text-gray-600 px-2">
            {selectedBrand} {selectedCategory} 最后更新: {lastUpdate}
          </div>}

        {/* 原有表格 */}
        <PriceTable data={priceData} loading={loading} className="mt-2" />
      </main>

      <footer className="bg-white border-t border-gray-200 p-4 mt-auto">
        <div className="text-center text-sm text-gray-500">
          数据存储: CloudBase · 演示模板
        </div>
      </footer>
    </div>;
}