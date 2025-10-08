// @ts-ignore;
import React, { useState, useEffect, useRef } from 'react';
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
  const defaultBrands = ['华为', '荣耀', 'OPPO', 'vivo', '三星', '小米', '苹果'];
  const extraBrands = ['一加', '小度', '小天才', '其它'];
  const defaultCategories = ['手机', '平板', '手表', '耳机', '手环', '笔记本电脑'];
  const extraCategories = [ '学习机','充电器', '路由器', '摄像头', '台灯', '其它'];
  const [brands, setBrands] = useState(defaultBrands);
  const [categories] = useState(defaultCategories);
  const [selectedBrand, setSelectedBrand] = useState('华为');
  const [selectedCategory, setSelectedCategory] = useState('手机');
  const [priceData, setPriceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');
  const [queryModel, setQueryModel] = useState('');
  const [queryList, setQueryList] = useState([]);
  const [queryLoading, setQueryLoading] = useState(false);
  const [showMoreBrands, setShowMoreBrands] = useState(false);
  const [visiblePrimaryBrands, setVisiblePrimaryBrands] = useState([]);
  const brandsRowRef = useRef(null);
  const measureRef = useRef(null);
  const [measureWidth, setMeasureWidth] = useState(0);
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const [visiblePrimaryCategories, setVisiblePrimaryCategories] = useState([]);
  const categoriesRowRef = useRef(null);
  const measureCatRef = useRef(null);
  const [measureCatWidth, setMeasureCatWidth] = useState(0);

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
      let brandFilter;
      if (selectedBrand === '其它') {
        brandFilter = {
          $nin: defaultBrands
        };
      } else if (selectedBrand && selectedBrand.toLowerCase() === 'vivo') {
        brandFilter = {
          $in: vivoSynonyms
        };
      } else {
        brandFilter = {
          $eq: selectedBrand
        };
      }
      let categoryFilter;
      if (selectedCategory === '其它') {
        categoryFilter = { $nin: defaultCategories };
      } else {
        categoryFilter = { $eq: selectedCategory };
      }
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'PhonePrice',
        methodName: 'wedaGetRecordsV2',
        params: {
          filter: {
            where: {
              $and: [{
                brand: brandFilter
              }, {
                category: categoryFilter
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
  const handleBrandClick = item => {
    if (item === '更多') {
      setShowMoreBrands(true);
    } else {
      setSelectedBrand(item);
    }
  };
  const handleCategoryClick = item => {
    if (item === '更多') {
      setShowMoreCategories(true);
    } else {
      setSelectedCategory(item);
    }
  };
  // 计算一行可容纳的主品牌（不含 extraBrands）
  const computeVisiblePrimaryBrands = () => {
    const primaryCandidates = brands.filter(b => !extraBrands.includes(b));
    if (!measureRef.current) {
      setVisiblePrimaryBrands(primaryCandidates);
      return;
    }
    const buttons = Array.from(measureRef.current.querySelectorAll('button'));
    if (buttons.length === 0) {
      setVisiblePrimaryBrands(primaryCandidates);
      return;
    }
    const firstTop = buttons[0].offsetTop;
    const visible = [];
    for (let i = 0; i < buttons.length; i += 1) {
      const btn = buttons[i];
      if (btn.offsetTop === firstTop) {
        visible.push(primaryCandidates[i]);
      } else {
        break;
      }
    }
    setVisiblePrimaryBrands(visible.length > 0 ? visible : primaryCandidates.slice(0, 1));
  };
  const computeVisiblePrimaryCategories = () => {
    const primaryCandidates = categories.filter(c => !extraCategories.includes(c));
    if (!measureCatRef.current) {
      setVisiblePrimaryCategories(primaryCandidates);
      return;
    }
    const buttons = Array.from(measureCatRef.current.querySelectorAll('button'));
    if (buttons.length === 0) {
      setVisiblePrimaryCategories(primaryCandidates);
      return;
    }
    const firstTop = buttons[0].offsetTop;
    const visible = [];
    for (let i = 0; i < buttons.length; i += 1) {
      const btn = buttons[i];
      if (btn.offsetTop === firstTop) {
        visible.push(primaryCandidates[i]);
      } else {
        break;
      }
    }
    setVisiblePrimaryCategories(visible.length > 0 ? visible : primaryCandidates.slice(0, 1));
  };
  // 同步测量宽度并在窗口尺寸变化时重算
  useEffect(() => {
    const syncWidthAndCompute = () => {
      const w = brandsRowRef.current ? brandsRowRef.current.clientWidth : 0;
      setMeasureWidth(w);
      Promise.resolve().then(() => computeVisiblePrimaryBrands());
    };
    syncWidthAndCompute();
    const onResize = () => syncWidthAndCompute();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', onResize);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', onResize);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brands]);
  useEffect(() => {
    const syncWidthAndCompute = () => {
      const w = categoriesRowRef.current ? categoriesRowRef.current.clientWidth : 0;
      setMeasureCatWidth(w);
      Promise.resolve().then(() => computeVisiblePrimaryCategories());
    };
    syncWidthAndCompute();
    const onResize = () => syncWidthAndCompute();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', onResize);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', onResize);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);
  useEffect(() => {
    loadBrands();
  }, []);
  useEffect(() => {
    if (selectedBrand && selectedCategory) loadPriceData();
  }, [selectedBrand, selectedCategory]);
  const currentDate = new Date();
  const formattedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
  return <div style={style} className={`min-h-screen bg-gray-50 flex flex-col ${className || ''}`}>
    <header className="sticky top-0 z-10 text-white shadow-md bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-900/20">
      <div className="max-w-4xl mx-auto px-3 py-3 flex flex-col items-center">
        <h1 className="text-[22px] sm:text-2xl font-semibold tracking-wide text-center">
          石家庄旷世唐朵通讯报价单
        </h1>
        <div className="mt-1 flex items-center gap-2 text-xs sm:text-sm text-white/90">
          <span className="inline-block bg-white/10 px-2.5 py-1 rounded-full ring-1 ring-white/20">
            {formattedDate}
          </span>
          <span>太和电子城5F65号</span>
        </div>
      </div>
    </header>

    <main className="flex-1 p-4 space-y-2 max-w-4xl mx-auto w-full">
      {/* 品牌区域 - 冷色系（单行显示，溢出折叠到“更多”） */}
      <section className="bg-slate-50 rounded-md py-1 px-1.5 shadow-sm" ref={brandsRowRef}>
        {/* 隐藏测量容器：用于计算一行可容纳的品牌 */}
        <div ref={measureRef} style={{
          position: 'absolute',
          visibility: 'hidden',
          pointerEvents: 'none',
          left: -9999,
          width: measureWidth || undefined
        }}>
          <PriceChips items={brands.filter(b => !extraBrands.includes(b))} current={null} onClick={() => {}} />
        </div>
        {(() => {
          const primaryCandidates = brands.filter(b => !extraBrands.includes(b));
          const overflowAuto = primaryCandidates.filter(b => !visiblePrimaryBrands.includes(b));
          const overflowAll = [...extraBrands, ...overflowAuto];
          const hasMore = overflowAll.length > 0;
          const items = hasMore ? [...visiblePrimaryBrands, '更多'] : visiblePrimaryBrands;
          const currentChip = overflowAll.includes(selectedBrand) ? '更多' : selectedBrand;
          return <PriceChips items={items} current={currentChip} onClick={handleBrandClick} activeColor="bg-blue-500 text-white" inactiveColor="bg-slate-100 text-slate-700 hover:bg-slate-200" />;
        })()}
      </section>

      {/* 更多品牌弹窗（包含固定更多品牌 + 自动溢出品牌） */}
      {showMoreBrands && (() => {
        const primaryCandidates = brands.filter(b => !extraBrands.includes(b));
        const overflowAuto = primaryCandidates.filter(b => !visiblePrimaryBrands.includes(b));
        const overflowAll = [...extraBrands, ...overflowAuto];
        return <div className="fixed inset-0 z-50 flex items-start justify-center" onClick={() => setShowMoreBrands(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative mt-24 w-[90vw] max-w-sm bg-white rounded-lg shadow-lg border border-gray-200" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-gray-100 font-semibold">选择品牌</div>
              <div className="p-3 grid grid-cols-2 gap-2">
                {overflowAll.map(b => <button key={b} className="px-3 py-2 rounded-md text-sm border border-gray-300 hover:border-blue-300 hover:text-blue-500 text-gray-700 text-left transition-colors" onClick={() => {
                setSelectedBrand(b);
                setShowMoreBrands(false);
              }}>
                    {b}
                  </button>)}
              </div>
              <div className="p-3 border-t border-gray-100 text-right">
                <button className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:border-gray-400 transition-colors" onClick={() => setShowMoreBrands(false)}>取消</button>
              </div>
            </div>
          </div>;
      })()}

      {/* 分类区域 - 暖色系（单行显示，溢出折叠到“更多”） */}
      <section className="bg-orange-50 rounded-md py-1 px-1.5 shadow-sm" ref={categoriesRowRef}>
        {/* 隐藏测量容器：用于计算一行可容纳的分类 */}
        <div
          ref={measureCatRef}
          style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none', left: -9999, width: measureCatWidth || undefined }}
        >
          <PriceChips items={categories.filter(c => !extraCategories.includes(c))} current={null} onClick={() => {}} />
        </div>
        {(() => {
          const primaryCandidates = categories.filter(c => !extraCategories.includes(c));
          const overflowAuto = primaryCandidates.filter(c => !visiblePrimaryCategories.includes(c));
          const overflowAll = [...extraCategories, ...overflowAuto];
          const hasMore = overflowAll.length > 0;
          const items = hasMore ? [...visiblePrimaryCategories, '更多'] : visiblePrimaryCategories;
          const currentChip = overflowAll.includes(selectedCategory) ? '更多' : selectedCategory;
          return (
            <PriceChips items={items} current={currentChip} onClick={handleCategoryClick} activeColor="bg-orange-500 text-white" inactiveColor="bg-orange-100 text-orange-700 hover:bg-orange-200" />
          );
        })()}
      </section>

      {/* 更多分类弹窗（包含固定更多分类 + 自动溢出分类） */}
      {showMoreCategories && (() => {
        const primaryCandidates = categories.filter(c => !extraCategories.includes(c));
        const overflowAuto = primaryCandidates.filter(c => !visiblePrimaryCategories.includes(c));
        const overflowAll = [...extraCategories, ...overflowAuto];
        return (
          <div className="fixed inset-0 z-50 flex items-start justify-center" onClick={() => setShowMoreCategories(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative mt-24 w-[90vw] max-w-sm bg-white rounded-lg shadow-lg border border-gray-200" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-gray-100 font-semibold">选择分类</div>
              <div className="p-3 grid grid-cols-2 gap-2">
                {overflowAll.map(c => (
                  <button
                    key={c}
                    className="px-3 py-2 rounded-md text-sm border border-gray-300 hover:border-orange-300 hover:text-orange-600 text-gray-700 text-left transition-colors"
                    onClick={() => { setSelectedCategory(c); setShowMoreCategories(false); }}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="p-3 border-t border-gray-100 text-right">
                <button className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:border-gray-400 transition-colors" onClick={() => setShowMoreCategories(false)}>取消</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 搜索区域 */}
      <section className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex gap-2 items-end">
          <input type="text" placeholder="型号关键词" value={queryModel} onChange={e => setQueryModel(e.target.value)} onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (!queryLoading) loadLatestRecord();
            }
          }} className="flex-1 border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow" />
          <button onClick={loadLatestRecord} disabled={queryLoading} className="bg-blue-600 text-white px-2.5 py-1.5 rounded-md text-xs flex items-center gap-1 disabled:opacity-50 hover:bg-blue-700 transition-colors">
            <Search size={12} />
            {queryLoading ? '查询中...' : '查询'}
          </button>
          <a href="tel:031185209160" className="bg-green-600 text-white px-2.5 py-1.5 rounded-md text-xs flex items-center gap-1 hover:bg-green-700 transition-colors">
            <Phone size={12} />
            电询
          </a>
        </div>
      </section>

      {/* 查询结果 */}
      {queryList.length > 0 && <section className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-700 mb-2">
            查询结果（{queryList.length} 条）
          </div>
          <PriceTable data={queryList} loading={false} />
        </section>}

      {/* 最后更新时间 */}
      {lastUpdate && <div className="text-sm text-gray-600 px-2">
          {selectedBrand} {selectedCategory} 最后更新: {lastUpdate}
        </div>}

      {/* 价格表格 */}
      <PriceTable data={priceData} loading={loading} className="mt-2" />
    </main>

    <footer className="bg-white border-t border-gray-200 p-4 mt-auto">
      <div className="text-center text-sm text-gray-500">
        数据存储: CloudBase · 演示模板
      </div>
    </footer>
  </div>;
}