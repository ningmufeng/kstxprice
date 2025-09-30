// Excel解析工具类
export class ExcelParser {
  constructor() {
    // 检查是否已加载XLSX库
    if (typeof XLSX === 'undefined') {
      this.loadXLSXLibrary();
    }
  }

  // 动态加载XLSX库
  loadXLSXLibrary() {
    return new Promise((resolve, reject) => {
      if (typeof XLSX !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      script.onload = () => {
        console.log('XLSX库加载成功');
        resolve();
      };
      script.onerror = () => {
        reject(new Error('XLSX库加载失败'));
      };
      document.head.appendChild(script);
    });
  }

  // 解析Excel文件
  async parseFile(file) {
    try {
      // 确保XLSX库已加载
      await this.loadXLSXLibrary();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            // 假设第一行是标题行，从第二行开始是数据
            const headers = jsonData[0];
            const rows = jsonData.slice(1);
            
            // 根据列标题映射数据
            const parsedData = rows.map((row, index) => {
              const rowData = {};
              headers.forEach((header, colIndex) => {
                if (header && row[colIndex] !== undefined) {
                  // 根据列标题映射到对应的字段
                  const headerStr = String(header).trim().toLowerCase();
                  if (headerStr.includes('品牌') || headerStr.includes('brand')) {
                    rowData.brand = String(row[colIndex]).trim();
                  } else if (headerStr.includes('分类') || headerStr.includes('category')) {
                    rowData.category = String(row[colIndex]).trim();
                  } else if (headerStr.includes('型号') || headerStr.includes('model')) {
                    rowData.model = String(row[colIndex]).trim();
                  } else if (headerStr.includes('价格') || headerStr.includes('price')) {
                    rowData.price = parseFloat(row[colIndex]) || 0;
                  }
                }
              });
              return rowData;
            }).filter(item => item.brand && item.category && item.model); // 过滤掉空行
            
            resolve(parsedData);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsArrayBuffer(file);
      });
    } catch (error) {
      throw new Error('Excel解析失败: ' + error.message);
    }
  }

  // 获取Excel文件的预览数据
  async getPreview(file, maxRows = 5) {
    try {
      const data = await this.parseFile(file);
      return data.slice(0, maxRows);
    } catch (error) {
      throw error;
    }
  }

  // 验证Excel文件格式
  validateFile(file) {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ];
    
    const allowedExtensions = ['.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();
    
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    const hasValidType = allowedTypes.includes(file.type);
    
    return hasValidExtension || hasValidType;
  }
}

// 创建单例实例
export const excelParser = new ExcelParser();
