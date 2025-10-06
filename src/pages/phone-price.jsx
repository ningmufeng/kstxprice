// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { useToast, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Input, Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

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

  /* ---------------- 常量 & 初始状态 ---------------- */
  const defaultBrands = ['华为', '荣耀', 'OPPO', 'vivo', '三星', '小米', '苹果'];
  const categories = ['手机', '平板', '手表', '耳机'];

  /* ---------------- 列表筛选 ---------------- */
  const [brands, setBrands] = useState(defaultBrands);
  const [selectedBrand, setSelectedBrand] = useState('华为');
  const [selectedCategory, setSelectedCategory] = useState('手机');
  const [priceData, setPriceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');

  /* ---------------- 型号查询 ---------------- */
  const [modelQuery, setModelQuery] = useState('');
  const [latestRecord, setLatestRecord] = useState(null);
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

  /* ---------------- 加载品牌 ---------------- */
  const loadBrands = async () => {
    try {
      const res = await $w.cloud.callDataSource({
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
      if (res.records?.length) {
        const set = new Set(res.records.map(r => r.brand).filter(Boolean));
        const ordered = defaultBrands.filter(b => set.has(b));
        const others = Array.from(set).filter(b => !defaultBrands.includes(b)).sort();
        setBrands([...ordered, ...others]);
      }
    } catch (e) {
      toast({
        title: '加载品牌失败',
        description: e.message,
        variant: 'destructive'
      });
    }
  };

  /* ---------------- 列表数据 ---------------- */
  const loadPriceData = async () => {
    if (!selectedBrand || !selectedCategory) return;
    setLoading(true);
    try {
      const res = await $w.cloud.callDataSource({
        dataSourceName: 'PhonePrice',
        methodName: 'wedaGetRecordsV2',
        params: {
          filter: {
            where: {
              $and: [{
                brand: {
                  $eq: selectedBrand
                }
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
      setPriceData(res.records || []);
      const latest = res.records?.[0];
      if (latest) {
        const d = latest.updatedAt ? new Date(latest.updatedAt) : null;
        setLastUpdate(d && !isNaN(d) ? formatDateTime(d) : '');
      }
    } catch (e) {
      toast({
        title: '加载列表失败',
        description: e.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- 型号查询 ---------------- */
  const handleQuery = async () => {
    if (!modelQuery.trim()) {
      toast({
        title: '请输入型号',
        variant: 'destructive'
      });
      return;
    }
    setQueryLoading(true);
    try {
      const res = await $w.cloud.callDataSource({
        dataSourceName: 'PhonePrice',
        methodName: 'wedaGetRecordsV2',
        params: {
          filter: {
            where: {
              $and: [{
                brand: {
                  $eq: selectedBrand
                }
              }, {
                category: {
                  $eq: selectedCategory
                }
              }, {
                model: {
                  $search: modelQuery.trim()
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
          pageSize: 1,
          pageNumber: 1
        }
      });
      setLatestRecord(res.records?.[0] || null);
    } catch (e) {
      toast({
        title: '查询失败',
        description: e.message,
        variant: 'destructive'
      });
    } finally {
      setQueryLoading(false);
    }
  };

  /* ---------------- 生命周期 ---------------- */
  useEffect(() => {
    loadBrands();
  }, []);
  useEffect(() => {
    loadPriceData();
  }, [selectedBrand, selectedCategory]);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;
  return <div style={style} className={`min-h-screen bg-gray-50 flex flex-col ${className || ''}`}>
      {/* 顶部标题 */}
      <header className="bg-blue-600 text-white p-4 sticky top-0 z-10 shadow-md">
        <h1 className="text-lg font-bold text-center">石家庄旷世唐朵通讯报价单 {todayStr}</h1>
      </header>

      <main className="flex-1 p-4 space-y-4 max-w-4xl mx-auto w-full">
        {/* 品牌 & 分类 Chips */}
        <section className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-700 mb-2">品牌</div>
          <PriceChips items={brands} current={selectedBrand} onClick={setSelectedBrand} />
        </section>

        <section className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-700 mb-2">分类</div>
          <PriceChips items={categories} current={selectedCategory} onClick={setSelectedCategory} />
        </section>

        {/* 型号查询行 */}
        <section className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-700 mb-2">型号查询（最新一条）</div>
          <div className="flex flex-col sm:flex-row gap-2 items-end">
            <div className="flex-1">
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="选择品牌" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-[2]">
              <Input placeholder="输入型号（支持模糊）" value={modelQuery} onChange={e => setModelQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleQuery()} />
            </div>
            <Button onClick={handleQuery} loading={queryLoading}>查询</Button>
          </div>

          {/* 最新一条结果 */}
          {latestRecord && <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">最新报价</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div><span className="font-medium">型号：</span>{latestRecord.model}</div>
                <div><span className="font-medium">价格：</span>¥{latestRecord.price}</div>
                <div><span className="font-medium">更新时间：</span>{formatDateTime(new Date(latestRecord.updatedAt))}</div>
              </CardContent>
            </Card>}
          {latestRecord === null && modelQuery && !queryLoading && <div className="mt-4 text-sm text-gray-500">未找到匹配记录</div>}
        </section>

        {/* 列表标题 */}
        {lastUpdate && <div className="text-sm text-gray-600 px-2">
            {selectedBrand} {selectedCategory} 最后更新: {lastUpdate}
          </div>}

        {/* 列表表格 */}
        <PriceTable data={priceData} loading={loading} />
      </main>

      <footer className="bg-white border-t border-gray-200 p-4 mt-auto">
        <div className="text-center text-sm text-gray-500">数据存储: CloudBase · 演示模板</div>
      </footer>
    </div>;
}