# 2026-05-18 v0.16.0 rc closure context

## 状态

`v0.16.0` 已完成为本地开发里程碑：`系统收束、UI 减法与权威归并`。

## 主要变更

- 底栏收束为 `地图 / 行动 / 角色 / 蛊道 / 世界 / 记录`。
- 新增 `ActionHubPanel`：当前行动 + 自由目标。
- 新增 `GuDaoPanel`：蛊虫 + 杀招 + 炼蛊 + 蛊材。
- 新增 `RoleHubPanel`：属性 + 空窍 + 人物 + 道痕 + 成就。
- 新增 `WorldHubPanel`：总览 + 宿命 + 传承 + 终局 + 商会 + 道场 + 小队 + 演武。
- 新增 `RecordsHubPanel`：事件日志。
- 演武/调试入口移出正式底栏，进入 `世界 -> 演武`。
- 新增 `src/engine/v016-authority-map.ts` 和测试，记录旧入口归并与权威边界。
- 旧 e2e 路径已迁移到新工作台标签。

## 未改变边界

- 未新增 save 字段，`SAVE_FORMAT_VERSION` 保持 22。
- 未扩大 DeepSeek 权限。
- 未开放正式奖励、地点、阵营、NPC 生死。
- 未开放正式材料消耗、炼蛊成功、市场库存、价格表、黑市或委托收益。
- 未吸收 MiroFish 包进入 runtime。
- 未新增后端/BFF、自动部署或公开承诺。

## 验证

- `npx tsc --noEmit --pretty false`：通过。
- `npm test -- --reporter=dot`：132 个 test file，735 个测试通过。
- `npm run build`：通过。
- `npm run check:runtime-assets`：通过。
- `npm run check:qingmao-assets`：通过。
- `npm run check:player-visible-copy`：通过。
- `npm run test:e2e`：81 个测试通过。
- `npm run test:e2e:long`：29 个测试通过。
- `npm run check:production-preview`：通过。
- b1/b2/b3 Player Advocate 20 轮：均通过，95% 下一步理解率。
- rc Player Advocate 60 轮：通过，95% 下一步理解率。

## 修复过的回归点

- Playwright 双 DOM 严格定位：改为 `:visible`。
- 旧测试重复点击已激活底栏按钮导致侧栏关闭：改为直接切工作台标签。
- 青茅凡战资产立即读取加载状态的竞态：改为等待图片自然尺寸。

## Git

本地质量门已完成。提交/推送后回填 commit、push、CI 状态到 `v0.16.0-Git提交与推送计划.md` 和根目录项目仪表盘。

## 下一步

停下来让用户决策 `v0.17.0` 启动审查与范围冻结。建议主线：战斗、杀招、小队与阵法深化，并继承 v0.16 的入口和权威边界。
