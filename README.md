# WUST Algo Frontend

WUST Algo Frontend 是 WUST ACM 算法训练数据平台的前端项目，基于 Vue 3、TypeScript 和 Vite 构建。项目用于展示 OJ 绑定、刷题动态、个人资料、团队、消息、数据统计与后台管理等功能。

后端仓库：`https://github.com/everlastingQAQ/WUST-Algo-tracker`

## 功能概览

- 首页统计：总 AC、今日/本周/本月/今年数据，以及 AtCoder、牛客、洛谷、CodeForces、QOJ 平台拆分统计。
- OJ 绑定：支持 AtCoder、NowCoder、LuoGu、CodeForces、QOJ。
- 个人资料：头像链接、邮箱通知、密码修改、团队信息与成员刷题数据。
- 团队系统：创建团队、邀请成员、编辑团队名称和头像、队长管理成员。
- 消息页：显示系统消息和团队邀请处理入口。
- 数据统计：公开统计页、用户排名、团队排名、提交趋势图。
- 后台管理：用户管理、角色/分组调整、密码重置、系统邀请码配置。
- 主题与布局：支持多主题、响应式统计页、统一页脚。

## 当前功能边界

当前版本不包含“两人数据对比”页面，左侧栏没有数据对比入口，个人资料页也不提供“与 TA 对比”按钮。若访问 `/compare`，前端会进入通用 NotFound 页面。

## 技术栈

- Vue 3
- TypeScript
- Vite
- Pinia
- Vue Router
- Axios
- ECharts
- Font Awesome

## 本地开发

要求 Node.js `^20.19.0 || >=22.12.0`。

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

仅预览构建产物：

```bash
npm run preview
```

## 部署

部署脚本默认配合后端仓库的 `/opt/wust-algo` 目录结构：

```text
/opt/wust-algo/
├── frontend/
├── tracker/
├── bin/
├── conf/
└── infra/
```

准备配置：

```bash
cd /opt/wust-algo/frontend
cp deploy/.env.example deploy/.env
nano deploy/.env
```

关键配置：

- `DOMAIN`：站点域名或 IP。
- `NGINX_PORT`：Nginx 监听端口。
- `USER_UPSTREAM`：用户服务地址，默认 `127.0.0.1:8000`。
- `CORE_UPSTREAM`：核心数据服务地址，默认 `127.0.0.1:8001`。
- `BACKEND_UPSTREAM`：后端 gateway 地址。

执行部署：

```bash
bash deploy/scripts/deploy-frontend.sh
```

脚本会执行依赖安装、生产构建、渲染 Nginx 配置并 reload Nginx。

## 后端接口约定

生产环境 Nginx 会把前端请求反代到后端：

- `/api/user/*` -> 用户服务 `/v1/user/*`
- `/api/core/*` -> 核心数据服务 `/v1/core/*`
- `/api/agent/*` -> AI 总结服务 `/v1/agent/*`

前端会对密码进行 SHA-256 后提交，后端存储和校验的也是哈希值。

## 常用维护命令

```bash
npm run build
sudo nginx -t
sudo systemctl reload nginx
```

部署后可验证：

```bash
curl -I http://127.0.0.1:8088/
curl -I http://127.0.0.1:8088/compare
```

由于 Vue Router history fallback，`/compare` 可能仍返回静态站点 `200`，但页面内容应由前端路由渲染为 NotFound，且构建产物中不应包含数据对比入口。

如果更新后浏览器仍显示旧页面，请强制刷新或清理浏览器缓存。

## 致谢

本项目基于无锡学院相关开源项目继续开发，感谢原项目在 GitHub 上贡献的源码。
