
// Excel解析器 - 使用SheetJS库解析Excel文件
export const ExcelParser = {
  async parseFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsArrayBuffer(file);
    });
  },

  validateData(data) {
    const requiredFields = ['brand', 'category', 'model', 'price'];
    const errors = [];
    const validData = [];

    data.forEach((row, index) => {
      const rowErrors = [];
      
      // 检查必填字段
      requiredFields.forEach(field => {
        if (!row[field] || row[field].toString().trim() === '') {
          rowErrors.push(`第${index + 2}行: ${field}字段不能为空`);
        }
      });

      // 检查价格格式
      if (row.price && isNaN(Number(row.price))) {
        rowErrors.push(`第${index + 2}行: 价格必须是数字`);
      }

      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      } else {
        validData.push({
          brand: row.brand.toString().trim(),
          category: row.category.toString().trim(),
          model: row.model.toString().trim(),
          price: Number(row.price),
          updatedAtText: row.updatedAtText || new Date().toLocaleDateString()
        });
      }
    });

    return { validData, errors };
  }
};
