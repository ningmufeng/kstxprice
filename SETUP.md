# GitHub Actions 部署配置指南

## 🔧 修复GitHub Actions部署失败

### 问题诊断
当前GitHub Actions失败的主要原因是缺少必要的Secrets配置。

### 解决步骤

#### 1. 配置GitHub Secrets

访问：https://github.com/ningmufeng/kstxprice/settings/secrets/actions

添加以下三个Secrets：

**CLOUDBASE_SECRET_ID**
- 从腾讯云API密钥管理获取
- 访问：https://console.cloud.tencent.com/cam/capi

**CLOUDBASE_SECRET_KEY**  
- 从腾讯云API密钥管理获取
- 与SecretId一起生成

**CLOUDBASE_ENV_ID**
- 您的CloudBase环境ID
- 已知：`cloud1-7gb9wc1q80bad9f3`

#### 2. 启用CloudBase HTTP访问服务

1. 登录CloudBase控制台
2. 进入环境配置 → HTTP访问服务
3. 启用HTTP访问服务
4. 配置域名（可使用默认域名）

#### 3. 测试部署

配置完成后：
```bash
git add .
git commit -m "test: 测试部署配置"
git push origin main
```

### 验证步骤

1. **检查Actions状态**
   - 访问：https://github.com/ningmufeng/kstxprice/actions
   - 查看最新运行状态

2. **查看部署日志**
   - 点击失败的运行
   - 查看具体错误信息

3. **访问部署的应用**
   - 从CloudBase控制台获取域名
   - 测试应用功能

### 常见问题

**Q: 提示"Secrets not found"**
A: 检查GitHub Secrets是否正确配置

**Q: 提示"Environment not found"**  
A: 检查CloudBase环境ID是否正确

**Q: 构建失败**
A: 检查package.json和依赖配置

### 联系支持

如果问题仍然存在，请：
1. 截图错误信息
2. 提供GitHub Actions日志
3. 检查CloudBase环境状态
