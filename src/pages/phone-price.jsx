// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { useToast } from '@/components/ui';
// @ts-ignore;
import { Search, Phone } from 'lucide-react';

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

  /* ---------------- 状态 ---------------- */
  const defaultBrands = ['华为', '荣耀', 'OPPO', 'vivo', '小米', '三星', '苹果'];
  const [brands, setBrands] = useState(defaultBrands);
  const [categories] = useState(['手机', '平板', '手表', '耳机']);
  const [selectedBrand, setSelectedBrand] = useState('华为');
  const [selectedCategory, setSelectedCategory] = useState('手机');
  const [priceData, setPriceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');
  const [queryModel, setQueryModel] = useState('');
  const [queryList, setQueryList] = useState([]);
  const [queryLoading, setQueryLoading] = useState(false);

  /* ---------------- 工具函数 ---------------- */
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
  const escapeReg = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  /* ---------------- 生命周期 ---------------- */
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

  /* ---------------- 数据加载 ---------------- */
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
          // 始终包含默认品牌（确保例如“三星”等固定品牌出现）
          const ordered = defaultBrands.slice();
          const others = existing.filter(b => !defaultBrands.includes(b)).sort();
          const brandList = Array.from(new Set([...ordered, ...others]));
          setBrands(brandList);
          if (brandList.length > 0 && !brandList.includes(selectedBrand)) {
            setSelectedBrand(brandList[0]);
          }
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
  const loadLatestRecord = async () => {
    if (!queryModel || !queryModel.trim()) {
      toast({
        title: '提示',
        description: '请输入型号关键词',
        variant: 'default'
      });
      return;
    }
    setQueryLoading(true);
    try {
      const kw = toHalfWidth(queryModel.trim());
      const pattern = `.*${escapeReg(kw)}.*`;
      const where = {
        $or: [{
          model: {
            $regex_ci: pattern
          }
        }, {
          modelName: {
            $regex_ci: pattern
          }
        }]
      };
      const PAGE_SIZE = 200;
      const MAX_PAGES = 5;
      const latestByModel = new Map();
      let page = 1;
      while (page <= MAX_PAGES) {
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
            pageSize: PAGE_SIZE,
            pageNumber: page
          }
        });
        const rows = result.records || [];
        for (const rec of rows) {
          const key = rec.model || '';
          const d = parseRecordUpdateTime(rec) || (rec.updatedAt ? new Date(rec.updatedAt) : null);
          const existed = latestByModel.get(key);
          if (!existed) {
            latestByModel.set(key, rec);
          } else {
            const de = parseRecordUpdateTime(existed) || (existed.updatedAt ? new Date(existed.updatedAt) : null);
            const tn = d ? d.getTime() : 0;
            const te = de ? de.getTime() : 0;
            if (tn > te) latestByModel.set(key, rec);
          }
        }
        if (rows.length < PAGE_SIZE) break;
        page += 1;
      }
      const list = Array.from(latestByModel.values()).sort((a, b) => {
        const da = parseRecordUpdateTime(a) || (a.updatedAt ? new Date(a.updatedAt) : null);
        const db = parseRecordUpdateTime(b) || (b.updatedAt ? new Date(b.updatedAt) : null);
        const ta = da ? da.getTime() : 0;
        const tb = db ? db.getTime() : 0;
        return tb - ta;
      });
      setQueryList(list);
    } catch (error) {
      console.error('查询最新记录失败:', error);
      toast({
        title: '查询失败',
        description: error.message || '请稍后重试',
        variant: 'destructive'
      });
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
    <header className="bg-blue-600 text-white p-4 sticky top-0 z-10 shadow-md">
      <h1 className="text-lg font-bold text-center">
        石家庄旷世唐朵通讯报价单 {formattedDate}
      </h1>
    </header>

    <main className="flex-1 p-4 space-y-2 max-w-4xl mx-auto w-full">
      {/* 品牌行 - 浅灰背景 */}
      <section className="bg-gray-100 rounded-lg p-2 shadow-sm">
        <PriceChips items={brands} current={selectedBrand} onClick={setSelectedBrand} />
      </section>

      {/* 分类行 - 白色背景 */}
      <section className="bg-white rounded-lg p-2 shadow-sm">
        <PriceChips items={categories} current={selectedCategory} onClick={setSelectedCategory} />
      </section>

      <section className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex gap-2 items-end">
          <input type="text" placeholder="型号关键词" value={queryModel} onChange={e => setQueryModel(e.target.value)} onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (!queryLoading) loadLatestRecord();
            }
          }} className="flex-1 border border-gray-300 rounded-md px-2 py-1.5 text-xs" />
          <button onClick={loadLatestRecord} disabled={queryLoading} className="bg-blue-600 text-white px-2.5 py-1.5 rounded-md text-xs flex items-center gap-1 disabled:opacity-50">
            <Search size={12} />
            {queryLoading ? '查询' : '查询'}
          </button>
          <a href="tel:031185209160" className="bg-green-600 text-white px-2.5 py-1.5 rounded-md text-xs flex items-center gap-1">
            <Phone size={12} />
            电询
          </a>
        </div>
      </section>

      {queryList.length > 0 && <section className="bg-white rounded-lg p-4 shadow-sm">
        <div className="text-sm font-medium text-gray-700 mb-2">
          查询结果（{queryList.length} 条）
        </div>
        <PriceTable data={queryList} loading={false} />
      </section>}

      {lastUpdate && <div className="text-sm text-gray-600 px-2">
        {selectedBrand} {selectedCategory} 最后更新: {lastUpdate}
      </div>}

      <PriceTable data={priceData} loading={loading} className="mt-2" />
    </main>

    <footer className="bg-white border-t border-gray-200 p-4 mt-auto">
      <div className="text-center text-sm text-gray-500">
        数据存储: CloudBase · 演示模板
      </div>
    </footer>
  </div>;
}