# X岛 PWA

X岛匿名版的 PWA 客户端，基于 React + TypeScript + Vite 构建。

## 技术栈

- **React 19** + **TypeScript**
- **Vite** - 构建工具
- **Tailwind CSS** - 样式
- **TanStack Query** - 数据获取与缓存
- **Zustand** - 状态管理（含 persist 持久化）
- **React Router** - 路由（Hash 模式，兼容 GitHub Pages）
- **vite-plugin-pwa** - PWA 支持
- **nmb API** - 基于 xdnmb_api 的接口封装

## 功能

- 版块浏览（分类展开/收起）
- 时间线浏览
- 串列表与详情
- 只看 PO / 正序倒序切换
- 引用点击跳转
- [h] 隐藏内容支持
- 图片模糊/隐藏模式
- 搜索
- 本地收藏（持久化）
- 浏览历史（持久化）
- 深色/浅色/跟随系统主题
- 字体大小调节
- 无限滚动加载
- 回复发帖（需配置 userhash）
- PWA 离线缓存
- 备用 API 切换
- 响应式布局（移动端 + 桌面端）

## 开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

构建产物在 `dist/` 目录。

## 部署

推送到 `main` 或 `master` 分支会自动通过 GitHub Actions 构建并部署到 GitHub Pages。

在仓库设置中启用 GitHub Pages，选择 "GitHub Actions" 作为构建源即可。

## 项目结构

```
src/
  api/          # API 客户端
  components/   # 通用组件
  hooks/        # React 自定义 hooks
  pages/        # 页面组件
  store/        # Zustand 状态管理
  types/        # TypeScript 类型
```
