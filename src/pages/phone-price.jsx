// @ts-ignore;
import React, { useState, useEffect, useCallback } from 'react';
// @ts-ignore;
import { useToast } from '@/components/ui';
// @ts-ignore;
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PhonePrice(props) {
  const {
    $w,
    style,
    className
  } = props;
  const {
    toast
  } = useToast();
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState('全部');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [priceRange, setPriceRange] = useState('全部');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // 固定品牌顺序
  const brands = ['全部', '华为', '荣耀', 'OPPO', 'vivo', '三星', '小米', '苹果'];
  const categories = ['全部', '手机', '平板', '笔记本', '穿戴', '配件'];
  const priceRanges = ['全部', '0-1000', '1000-2000', '2000-3000', '3000-4000', '4000-5000', '5000+'];
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await $w.cloud.callDataSource({
        dataSourceName: 'PhonePrice',
        methodName: 'wedaGetRecordsV2',
        params: {
          select: {
            $master: true
          },
          orderBy: [{
            updatedAt: 'desc'
          }],
          pageSize: 500,
          pageNumber: 1
        }
      });
      setRecords(res.records || []);
    } catch (e) {
      toast({
        title: '加载失败',
        description: e.message || '请检查网络或权限',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [$w, toast]);
  useEffect(() => {
    loadData();
  }, [loadData]);
  useEffect(() => {
    let filtered = [...records];
    if (selectedBrand !== '全部') {
      filtered = filtered.filter(r => r.brand === selectedBrand);
    }
    if (selectedCategory !== '全部') {
      filtered = filtered.filter(r => r.category === selectedCategory);
    }
    if (priceRange !== '全部') {
      const [min, max] = priceRange.split('-').map(Number);
      filtered = filtered.filter(r => {
        const price = Number(r.price);
        if (priceRange === '5000+') return price >= 5000;
        return price >= min && price <= max;
      });
    }
    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      filtered = filtered.filter(r => r.model.toLowerCase().includes(kw));
    }
    setFilteredRecords(filtered);
    setCurrentPage(1);
  }, [records, selectedBrand, selectedCategory, priceRange, searchKeyword]);
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRecords = filteredRecords.slice(startIndex, startIndex + itemsPerPage);
  const handlePageChange = page => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  return <div style={style} className={`min-h-screen bg-gray-50 ${className || ''}`}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">手机报价查询</h1>
          <p className="text-gray-600 mt-2">实时查询最新手机价格信息</p>
        </div>

        {/* 筛选区域 */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            {/* 品牌筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">品牌</label>
              <div className="flex flex-wrap gap-2">
                {brands.map(brand => <button key={brand} onClick={() => setSelectedBrand(brand)} className={`px-3 py-1 rounded-full text-sm transition-colors ${selectedBrand === brand ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    {brand}
                  </button>)}
              </div>
            </div>

            {/* 分类筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => <button key={category} onClick={() => setSelectedCategory(category)} className={`px-3 py-1 rounded-full text-sm transition-colors ${selectedCategory === category ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    {category}
                  </button>)}
              </div>
            </div>

            {/* 价格区间 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">价格区间</label>
              <div className="flex flex-wrap gap-2">
                {priceRanges.map(range => <button key={range} onClick={() => setPriceRange(range)} className={`px-3 py-1 rounded-full text-sm transition-colors ${priceRange === range ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    {range}
                  </button>)}
              </div>
            </div>
          </div>

          {/* 搜索框 */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input type="text" placeholder="搜索型号..." value={searchKeyword} onChange={e => setSearchKeyword(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
        </div>

        {/* 结果列表 */}
        <div className="bg-white rounded-lg shadow-sm border">
          {loading ? <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">加载中...</p>
            </div> : <>
              <div className="px-6 py-4 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">
                    共找到 {filteredRecords.length} 条记录
                  </h2>
                  <Filter className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">品牌</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分类</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">型号</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">价格</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">更新日期</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentRecords.map(record => <tr key={record._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.brand}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.model}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ¥{Number(record.price).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.updatedAtText || new Date(record.updatedAt).toLocaleDateString('zh-CN')}
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div>

              {/* 分页 */}
              {totalPages > 1 && <div className="px-6 py-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      显示 {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredRecords.length)} 条，共 {filteredRecords.length} 条
                    </div>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="text-sm text-gray-700">
                        第 {currentPage} / {totalPages} 页
                      </span>
                      <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>}
            </>}
        </div>
      </div>
    </div>;
}