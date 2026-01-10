# 工作流管理系统

基于 Vue 3 + Vite 的工作流管理系统

## 安装依赖

```bash
npm install
```

## 开发模式

```bash
npm run dev
```

### 配置后端地址（可选）

前端通过 WebSocket 接收 AI 实时视频流，默认连接 `ws://localhost:8000/ai/video`。
如果后端运行在其他地址（例如 `http://36.103.203.206:8000`），可在项目根目录创建 `.env.local`：

```bash
VITE_BACKEND_BASE_URL=http://36.103.203.206:8000
```

前端会自动转换为 `ws://36.103.203.206:8000/ai/video` 并在连接时附加 `client_id` 参数。

关于 `client_id`：

- 如果未手动指定，前端会自动生成并存储到 `sessionStorage`，实现会话内稳定标识。
- 如需固定 `client_id`，可在使用 `WorkArea` 组件时传入 `client-id` 属性。

## 构建生产版本

```bash
npm run build
```

## 项目结构

src/
├── assets/          # 静态资源
├── components/      # 可复用组件
├── views/           # 页面组件
├── mock/            # 模拟数据
├── App.vue          # 根组件
└── main.js          # 入口文件

## 技术栈

- Vue 3 (Composition API)
- Vite
- 原生 CSS
