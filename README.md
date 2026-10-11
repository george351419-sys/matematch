# 合笺 · MateMatch

两个人的八字与紫微婚配报告网页。支持公历、农历、闰月、出生时间、时区和夏令时处理；在本地排双盘，再用 DeepSeek 整理双人关系手札。

- 测试站点：https://george351419-sys.github.io/matematch/
- 前端：GitHub Pages，从 `gh-pages` 分支发布静态构建；`main` 保存源码。
- AI 后端：`https://soulmatefor-html-tawny.vercel.app/api/match`，复用 soulmate 已有 Vercel 生产密钥与 `deepseek-flash` 配置。

## 功能

- 双人出生资料独立校验；支持同性组合，不假设谁必须承担特定关系角色。
- 六个报告维度：相处节奏、沟通与被理解、亲密与安全感、分歧与修复、共同生活、一起成长的方向。
- 双方四柱、藏干、命宫及夫妻宫主星，可展开紫微十二宫与四化。
- 明确区分本地基础报告、示例和 DeepSeek 解读；AI 失败、超时或取消时保留基础报告。
- 下载 Markdown 报告、浏览器打印 / PDF、资料清除、响应式手机布局。
- 不输出无依据的匹配分数或婚姻成败预测。

## 开发

Node.js 24。

```sh
npm ci
npm run dev
npm test
npm run build
npm run deploy
```

`npm run deploy` 会构建并正常提交静态内容到 `gh-pages`，不强制覆盖分支历史。GitHub Pages 设置为该分支的根目录。需要已登录的 GitHub CLI。可选的 Actions 模板保存在 `docs/github-pages-workflow.example.yml`；当前凭据没有 workflow 权限，因此未启用自动工作流。

开发入口是 `/matematch/`。`src/service.json` 只保存公开 API 地址，可用 `VITE_MATCH_API_URL` 覆盖，不能在 VITE 环境变量里填写密钥。

## 排盘口径与来源

与 soulmate 相同：`lunar-javascript 1.7.3` 八字历法，`iztro 2.5.8` 紫微核心。紫微适配源自 [ziwei-doushu](https://github.com/george351419-sys/ziwei-doushu)，版本 `79b21babb30a65cdac3ce267f39276ce63debf4b`，适配代码及 MIT 许可见 `src/lib/ziwei/`。时间归一化和传统主星词库参考用户的 soulmate 项目。

- 所选时区的当地标准时间，依据时区历史记录回拨夏令时；拒绝重复或不存在的钟点。
- 晚子时当天：八字 sect=2、紫微 dayDivide=current，23 点索引为 12。
- 紫微 fixLeap=true；不做经度或均时差校正，不把出生地点字符串自动换成时区。
- 基础合盘只实现日干五行生克、日干五合、日支同支/六合/六冲，以及双方命宫和夫妻宫主星主题。未实现格局、旺衰、喜用神、合化、刑害、大运或流年推断。
- 不将夫妻宫的传统伴侣期待等同于现实中另一人的性格。两套命理体系并不是预测准确率的独立验证。

## 服务端与部署

GitHub Pages 无法保管 API 密钥。当前生产婚配接口被添加到 soulmate 的原 Vercel 项目，使用原项目不可导出的 `DEEPSEEK_API_KEY`，原 `/api/interpret` 和 `/api/portrait` 保留。

本仓库保存婚配接口完整源代码：`api/match.mjs` 和 `backend/service.mjs`。在 soulmate 后端中第二个文件名为 `backend/match-service.mjs`，对应 import 已调整；其 `vercel.json` 增加该函数 60 秒上限。更新时需同步这两个文件并部署后端。**GitHub Pages 的更新只部署前端，不会自动更新服务端。**

也可独立部署本仓库至 Vercel，私密设置：

```text
DEEPSEEK_API_KEY=<仅在服务端填写>
DEEPSEEK_MODEL=deepseek-flash
ALLOWED_ORIGINS=https://george351419-sys.github.io
```

随后把新后端的完整 `/api/match` 地址写入 `src/service.json` 并发布 Pages。Vercel 自带页面要调用该 API，需把其准确 Origin 加入 `ALLOWED_ORIGINS`。

接口有来源检查、12 KB 请求上限、严格结构校验、45 秒上游超时、每实例每 IP 每分钟 3 次和每实例每分钟 30 次的限制。多实例不共享计数；CORS 不是认证，也不是全局费用上限。面向大量用户前可在已有 Vercel 防火墙与 DeepSeek 账号配置预算限制。

## 隐私

称呼、原始日期、出生地点只在当前页面内存中使用；不创建生辰数据库，不使用 localStorage。启用 AI 并同意后，只发送双方四柱、命宫/夫妻宫主星与计算摘要。应用不主动记录请求正文，Vercel 与模型服务可能保留访问元数据。用户导出的报告由用户自行保存。

## 验证

`npm test` 覆盖与 soulmate 对齐的男女样例、公农历等价、闰月、夏令时、晚子时、非法日期、同性组合、去身份化请求、双人差异、模型响应校验与接口错误。生产 AI 连通性另以样例数据调用验证，不在测试中存放密钥。
