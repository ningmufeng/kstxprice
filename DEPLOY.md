# 部署到腾讯云CloudBase指南

## 📋 准备工作

### 1. 创建CloudBase环境
1. 登录 [腾讯云CloudBase控制台](https://console.cloud.tencent.com/tcb)
2. 创建新环境，选择"Web应用托管"
3. 记录环境ID (envId)

### 2. 获取API密钥
1. 进入 [API密钥管理](https://console.cloud.tencent.com/cam/capi)
2. 创建新的API密钥
3. 记录SecretId和SecretKey

### 3. 设置GitHub Secrets
在GitHub仓库设置中添加以下Secrets：
- `CLOUDBASE_SECRET_ID`: 您的SecretId
- `CLOUDBASE_SECRET_KEY`: 您的SecretKey  
- `CLOUDBASE_ENV_ID`: 您的环境ID

## 🚀 部署步骤

### 方法一：GitHub Actions自动部署（推荐）

1. **推送代码到GitHub**
   ```bash
   git add .
   git commit -m "feat: 添加CloudBase部署配置"
   git push origin main
   ```

2. **自动部署**
   - GitHub Actions会自动检测到代码推送
   - 自动构建和部署到CloudBase
   - 查看部署状态：仓库 → Actions

### 方法二：手动部署

1. **安装CloudBase CLI**
   ```bash
   npm install -g @cloudbase/cli
   ```

2. **登录CloudBase**
   ```bash
   cloudbase login
   ```

3. **部署项目**
   ```bash
   cloudbase deploy
   ```

## 🔧 配置说明

### 环境变量配置
在CloudBase控制台设置以下环境变量：
- `NODE_ENV`: production
- `DATABASE_NAME`: PhonePrice
- `APP_NAME`: 石家庄旷世唐朵通讯报价系统

### 数据库配置
1. 在CloudBase控制台创建数据库
2. 创建`PhonePrice`集合
3. 设置索引：
   - brand (字符串索引)
   - category (字符串索引)  
   - model (字符串索引)
   - price (数字索引)

### 静态资源配置
- 上传目录：`public/`
- CDN加速：开启
- 缓存策略：设置合适的缓存时间

## 📝 部署后检查

1. **访问应用**
   - 获取CloudBase分配的域名
   - 测试所有页面功能

2. **数据库连接测试**
   - 测试数据导入功能
   - 验证数据存储正确性

3. **Excel解析测试**
   - 上传Excel文件测试
   - 验证数据解析准确性

## 🔄 更新部署

每次代码更新后：
1. 提交代码到GitHub
2. GitHub Actions自动部署
3. 或手动执行 `cloudbase deploy`

## 🛠️ 故障排除

### 常见问题
1. **构建失败**
   - 检查Node.js版本
   - 检查依赖包版本
   - 查看构建日志

2. **部署失败**
   - 检查API密钥权限
   - 检查环境ID是否正确
   - 检查网络连接

3. **运行时错误**
   - 检查环境变量配置
   - 检查数据库连接
   - 查看CloudBase日志

### 联系支持
- CloudBase文档：https://cloud.tencent.com/document/product/876
- GitHub Issues：在项目仓库提交问题
