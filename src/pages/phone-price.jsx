// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { useToast } from '@/components/ui';

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
  // 品牌显示顺序按业务约定
  const defaultBrands = ['华为', '荣耀', 'OPPO', 'vivo', '三星', '小米', '苹果'];
  const [brands, setBrands] = useState(defaultBrands);
  const [categories] = useState(['手机', '平板', '手表', '耳机']);
  const [selectedBrand, setSelectedBrand] = useState('华为');
  const [selectedCategory, setSelectedCategory] = useState('手机');
  const [priceData, setPriceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');

  // 设置页面标题和微信分享信息
  useEffect(() => {
    const currentDate = new Date();
    const formattedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    const pageTitle = `石家庄旷世唐朵通讯报价单 ${formattedDate}`;

    // 设置页面标题
    document.title = pageTitle;

    // 设置微信分享相关的meta标签
    const setWechatShareMeta = () => {
      // 移除现有的微信分享meta标签
      const existingMeta = document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]');
      existingMeta.forEach(meta => meta.remove());

      // 添加Open Graph meta标签（微信分享使用）
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

      // 添加描述（可选）
      const ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      ogDescription.setAttribute('content', '石家庄旷世唐朵通讯最新手机报价单，实时更新各大品牌手机、平板、手表、耳机价格');
      document.head.appendChild(ogDescription);
    };
    setWechatShareMeta();
  }, []);

  // 加载品牌列表
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
          // CloudBase返回的数据已经是对象，直接访问字段
          if (item.brand) {
            brandSet.add(item.brand);
          }
        });
        if (brandSet.size > 0) {
          // 按默认顺序排列，额外品牌排在后面（按字母序）
          const existing = Array.from(brandSet);
          const ordered = defaultBrands.filter(b => brandSet.has(b));
          const others = existing.filter(b => !defaultBrands.includes(b)).sort();
          const brandList = [...ordered, ...others];
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

  // 加载报价数据
  const loadPriceData = async () => {
    if (!selectedBrand || !selectedCategory) return;
    setLoading(true);
    try {
      const result = await $w.cloud.callDataSource({
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
      if (result.records && result.records.length > 0) {
        // 直接使用返回的记录对象
        setPriceData(result.records);

        // 获取最新更新时间
        const latestItem = result.records[0];
        setLastUpdate(latestItem.updatedAtText || new Date(latestItem.updatedAt).toLocaleDateString());
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
  useEffect(() => {
    loadBrands();
  }, []);
  useEffect(() => {
    if (selectedBrand && selectedCategory) {
      loadPriceData();
    }
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
        {/* 品牌筛选 */}
        <section className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-700 mb-2">品牌</div>
          <PriceChips items={brands} current={selectedBrand} onClick={setSelectedBrand} />
        </section>

        {/* 分类筛选 */}
        <section className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-700 mb-2">分类</div>
          <PriceChips items={categories} current={selectedCategory} onClick={setSelectedCategory} />
        </section>

        {/* 报价表格标题 */}
        {lastUpdate && <div className="text-sm text-gray-600 px-2">
            {selectedBrand} {selectedCategory} 最后更新: {lastUpdate}
          </div>}

        {/* 报价表格 */}
        <PriceTable data={priceData} loading={loading} className="mt-2" />
      </main>

      {/* 底部信息 */}
      <footer className="bg-white border-t border-gray-200 p-4 mt-auto">
        <div className="text-center text-sm text-gray-500">
          数据存储: CloudBase · 演示模板
        </div>
      </footer>
    </div>;
}