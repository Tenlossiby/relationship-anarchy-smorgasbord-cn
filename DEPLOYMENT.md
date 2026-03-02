# 部署指南

本文档说明如何将"关系安那其自助拼盘"项目部署到 GitHub 和 Netlify。

## 📋 部署前准备

### 1. 清理项目文件

在部署之前，建议删除或隐藏以下文件（它们仅用于 Coze 开发环境）：

```bash
# 这些文件不需要上传到 GitHub
rm -rf .coze
rm -rf scripts/
```

### 2. 修改 package.json

由于项目使用了自定义脚本（`.coze` 和 `scripts/`），你需要修改 `package.json` 中的脚本命令为标准的 Next.js 命令：

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

**完整的 package.json 示例**：

```json
{
  "name": "ra-smorgasbord",
    "version": "1.0.0",
  "private": false,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    // ... 保持原有的依赖不变
  },
  "devDependencies": {
    // ... 保持原有的开发依赖不变
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

### 3. 创建 .gitignore 文件

如果项目还没有 `.gitignore` 文件，创建一个：

```gitignore
# Dependencies
node_modules
/.pnp
.pnp.*

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local
.env

# Vercel
.vercel

# Typescript
*.tsbuildinfo
next-env.d.ts

# Coze specific (development only)
.coze
scripts/
```

---

## 🚀 部署到 GitHub

### 方法一：使用 GitHub CLI（推荐）

```bash
# 1. 登录 GitHub（首次使用）
gh auth login

# 2. 初始化 Git 仓库
git init
git add .
git commit -m "Initial commit: RA Smörgåsbord"

# 3. 创建远程仓库并推送
gh repo create ra-smorgasbord --public --source=. --remote=origin
git push -u origin main
```

### 方法二：手动创建仓库

1. 在 GitHub 网站上创建新仓库 `ra-smorgasbord`
2. 初始化 Git 并推送：

```bash
git init
git add .
git commit -m "Initial commit: RA Smörgåsbord"
git branch -M main
git remote add origin https://github.com/your-username/ra-smorgasbord.git
git push -u origin main
```

### 配置 GitHub Pages（可选）

如果你想使用 GitHub Pages 托管：

1. 在仓库设置中启用 GitHub Pages
2. 选择 "Source" 为 "GitHub Actions"
3. 创建 `.github/workflows/pages.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './out'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

> ⚠️ **注意**：GitHub Pages 需要静态导出。在 `next.config.mjs` 中添加 `output: 'export'`。

---

## 🌐 部署到 Netlify

Netlify 是部署 Next.js 项目最简单的方式之一。

### 方法一：拖拽部署（最简单）

1. 删除 `.coze` 目录和 `scripts/` 目录
2. 修改 `package.json` 中的脚本为标准命令（见上文）
3. 打开 [Netlify](https://app.netlify.com/drop)
4. 将项目文件夹拖拽到上传区域
5. 等待构建完成（通常 2-3 分钟）

**⚠️ 拖拽部署的限制**：
- 每次更新需要重新拖拽整个项目
- 不推荐用于持续开发的项目

### 方法二：连接 GitHub（推荐）

#### 1. 创建 Netlify 账号

- 访问 [Netlify](https://app.netlify.com)
- 使用 GitHub 账号登录

#### 2. 添加新站点

1. 点击 "Add new site" → "Import an existing project"
2. 选择 GitHub 中的 `ra-smorgasbord` 仓库
3. 配置构建设置：

```
Build command: pnpm build
Publish directory: .next
```

#### 3. 配置环境变量（可选）

如果项目需要环境变量，在 "Site settings" → "Environment variables" 中添加。

#### 4. 部署

Netlify 会自动部署。你可以通过 `https://your-site-name.netlify.app` 访问。

#### 5. 配置自定义域名（可选）

在 "Domain management" 中添加你的自定义域名。

### 方法三：使用 netlify.toml（最专业）

在项目根目录创建 `netlify.toml` 文件：

```toml
[build]
  command = "pnpm build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"
  NPM_FLAGS = "--legacy-peer-deps"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Netlify 配置说明

#### 为什么需要 `@netlify/plugin-nextjs`？

Next.js 的输出需要特殊的处理才能在 Netlify 上正常运行。这个插件会：
- 将 `.next` 目录转换为 Netlify 函数
- 处理静态资源和图片优化
- 配置正确的重定向规则

#### 端口问题

Netlify 会自动处理端口，你不需要修改默认的 5000 端口配置。

---

## 🔧 常见问题

### Q1: 构建失败，提示 "Cannot find module"

**A**: 确保已删除 `.coze` 目录和 `scripts/` 目录，并更新 `package.json` 中的脚本命令。

### Q2: 拖拽到 Netlify 后无法访问

**A**: 拖拽部署不支持 Next.js 的服务器端功能。请使用 GitHub 集成部署。

### Q3: 如何更新已部署的项目？

**A**:
- GitHub 集成：推送新代码后 Netlify 会自动重新部署
- 拖拽部署：重新拖拽更新后的文件夹

### Q4: 页面刷新后 404

**A**: 确保 `netlify.toml` 中配置了正确的重定向规则（见上文）。

### Q5: 图片优化功能不工作

**A**: 添加 `@netlify/plugin-nextjs` 插件到 `netlify.toml`。

---

## 📊 部署对比

| 平台 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| Netlify | 最简单、免费 SSL、自动部署 | 有限制（免费版） | ⭐⭐⭐⭐⭐ |
| Vercel | Next.js 官方支持、性能最佳 | 构建时间限制（免费版） | ⭐⭐⭐⭐⭐ |
| GitHub Pages | 完全免费、与 GitHub 集成 | 需要静态导出、速度较慢 | ⭐⭐⭐ |
| 自己的服务器 | 完全控制、无限制 | 需要运维知识 | ⭐⭐⭐ |

---

## 🎯 推荐部署方案

**最佳实践**：使用 **Netlify + GitHub 集成**

1. 将项目推送到 GitHub
2. 在 Netlify 连接 GitHub 仓库
3. 配置构建设置
4. 享受自动部署

这样可以：
- ✅ 自动部署
- ✅ 预览每个 Pull Request
- ✅ 免费 SSL 证书
- ✅ 自定义域名
- ✅ 无限静态站点

---

## 📞 需要帮助？

如果遇到部署问题，请：
1. 查看 Netlify [文档](https://docs.netlify.com)
2. 检查构建日志
3. 在 GitHub Issues 提问
