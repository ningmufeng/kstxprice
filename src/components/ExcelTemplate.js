// Excel模板生成器
export class ExcelTemplate {
  
  // 生成示例Excel数据
  static generateSampleData() {
    return [
      ['品牌', '分类', '型号', '价格'],
      ['苹果', '手机', 'iPhone 16', 6999],
      ['苹果', '手机', 'iPhone 16 Pro', 7999],
      ['华为', '手机', 'Mate 70', 5999],
      ['华为', '手机', 'P70', 4999],
      ['小米', '手机', '15 Pro', 4999],
      ['小米', '手机', '15 Ultra', 5999],
      ['vivo', '手机', 'X100 Pro', 3999],
      ['OPPO', '手机', 'Find X7', 4499],
      ['苹果', '平板', 'iPad Air', 4399],
      ['苹果', '平板', 'iPad Pro', 6799],
      ['华为', '平板', 'MatePad Pro', 3299]
    ];
  }

  // 下载Excel模板文件
  static downloadTemplate() {
    try {
      if (typeof XLSX === 'undefined') {
        throw new Error('XLSX库未加载');
      }

      const data = this.generateSampleData();
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      
      // 设置列宽
      worksheet['!cols'] = [
        { width: 10 }, // 品牌
        { width: 10 }, // 分类
        { width: 20 }, // 型号
        { width: 10 }  // 价格
      ];

      // 设置表头样式（如果有条件格式支持）
      if (worksheet['!rows']) {
        worksheet['!rows'][0] = { hpt: 20 }; // 设置第一行高度
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, '手机报价');
      
      // 生成文件名（包含当前日期）
      const currentDate = new Date().toLocaleDateString('zh-CN').replace(/\//g, '-');
      const fileName = `手机报价模板_${currentDate}.xlsx`;
      
      // 下载文件
      XLSX.writeFile(workbook, fileName);
      
      return true;
    } catch (error) {
      console.error('下载模板失败:', error);
      throw error;
    }
  }

  // 验证Excel数据格式
  static validateData(data) {
    if (!Array.isArray(data) || data.length < 2) {
      return { valid: false, message: '数据格式错误：至少需要标题行和一行数据' };
    }

    const headers = data[0];
    const requiredHeaders = ['品牌', '分类', '型号', '价格'];
    const headerMap = {};
    
    // 检查标题行
    headers.forEach((header, index) => {
      const headerStr = String(header).trim().toLowerCase();
      if (headerStr.includes('品牌') || headerStr.includes('brand')) {
        headerMap.brand = index;
      } else if (headerStr.includes('分类') || headerStr.includes('category')) {
        headerMap.category = index;
      } else if (headerStr.includes('型号') || headerStr.includes('model')) {
        headerMap.model = index;
      } else if (headerStr.includes('价格') || headerStr.includes('price')) {
        headerMap.price = index;
      }
    });

    // 检查必要字段
    const missingFields = [];
    if (headerMap.brand === undefined) missingFields.push('品牌');
    if (headerMap.category === undefined) missingFields.push('分类');
    if (headerMap.model === undefined) missingFields.push('型号');
    if (headerMap.price === undefined) missingFields.push('价格');

    if (missingFields.length > 0) {
      return { 
        valid: false, 
        message: `缺少必要字段：${missingFields.join(', ')}` 
      };
    }

    // 检查数据行
    const dataRows = data.slice(1);
    const errors = [];
    
    dataRows.forEach((row, index) => {
      const rowNum = index + 2; // Excel行号从2开始
      
      if (!row[headerMap.brand] || String(row[headerMap.brand]).trim() === '') {
        errors.push(`第${rowNum}行：品牌不能为空`);
      }
      if (!row[headerMap.category] || String(row[headerMap.category]).trim() === '') {
        errors.push(`第${rowNum}行：分类不能为空`);
      }
      if (!row[headerMap.model] || String(row[headerMap.model]).trim() === '') {
        errors.push(`第${rowNum}行：型号不能为空`);
      }
      if (!row[headerMap.price] || isNaN(parseFloat(row[headerMap.price]))) {
        errors.push(`第${rowNum}行：价格必须是数字`);
      }
    });

    if (errors.length > 0) {
      return { 
        valid: false, 
        message: '数据验证失败：\n' + errors.join('\n') 
      };
    }

    return { valid: true, headerMap };
  }

  // 获取Excel格式说明
  static getFormatInstructions() {
    return {
      title: 'Excel文件格式要求',
      instructions: [
        '1. 第一行必须是标题行，包含以下列：',
        '   - 品牌（或Brand）',
        '   - 分类（或Category）', 
        '   - 型号（或Model）',
        '   - 价格（或Price）',
        '2. 从第二行开始是数据行',
        '3. 品牌、分类、型号不能为空',
        '4. 价格必须是数字',
        '5. 支持.xlsx和.xls格式'
      ],
      example: [
        ['品牌', '分类', '型号', '价格'],
        ['苹果', '手机', 'iPhone 16', 6999],
        ['华为', '手机', 'Mate 70', 5999]
      ]
    };
  }
}
