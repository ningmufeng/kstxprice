
// Excel模板生成器
export const ExcelTemplate = {
  generateTemplate() {
    const templateData = [
      {
        brand: '苹果',
        category: '手机',
        model: 'iPhone 16',
        price: 6999,
        updatedAtText: '2025-09-10'
      },
      {
        brand: '华为',
        category: '手机',
        model: 'Mate 70',
        price: 5999,
        updatedAtText: '2025-09-10'
      },
      {
        brand: '小米',
        category: '手机',
        model: '15 Pro',
        price: 4999,
        updatedAtText: '2025-09-10'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '手机报价数据');
    
    // 设置列宽
    const cols = [
      { wch: 10 }, // brand
      { wch: 10 }, // category
      { wch: 20 }, // model
      { wch: 10 }, // price
      { wch: 12 }  // updatedAtText
    ];
    ws['!cols'] = cols;

    return wb;
  },

  downloadTemplate() {
    const wb = this.generateTemplate();
    XLSX.writeFile(wb, '手机报价模板.xlsx');
  }
};
