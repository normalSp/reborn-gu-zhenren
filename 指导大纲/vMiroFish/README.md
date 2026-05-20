# RebornG x MiroFish 资料交付区

用途：保存 MiroFish 产出的 quote-redacted 候选材料包、请求文件和 RebornG intake review。

## 权限口径

- MiroFish 代码不并入 RebornG runtime。
- MiroFish 交付包不是 RebornG canon。
- MiroFish 交付包不是 DeepSeek 权限源。
- 所有内容必须经过 RebornG intake review 后，才能被转写为 fact card、anchor、IF rule、reaction rule 或测试样本。

## 目录

- `requests/`：RebornG 主线（runtime / canon / save / DeepSeek）需要 MiroFish 产包时写入的请求文件，按版本分子目录。
- `美术/`：RebornG 美术专项（跨版本，不绑某个 RebornG 小版本主线）的 MiroFish 请求；交付包仍按主协议放到 `intake-reviews/<version>/`。
- `intake-reviews/`：RebornG 对 MiroFish 交付包的审查结论（主线 + 美术专项交付包都进这里）。
- `基础包/`：全书 quote-redacted 基础包档案层，当前范围 `ri_lw_ch_0001` 至 `ri_lw_ch_2340`。它只作为 candidate material 和 source pointer 后勤仓库，不是 canon、runtime authority 或 DeepSeek visible context。
- 根目录：MiroFish 产出的主 JSON、报告、ledger、说明文件。

## 全书基础包入口

当前全书基础包已放入：

- `指导大纲/vMiroFish/基础包/`

使用前先读：

- `指导大纲/vMiroFish/基础包/README.md`
- `指导大纲/vMiroFish/基础包/manifest.json`
- `指导大纲/vMiroFish/基础包/coverage_report.json`
- `指导大纲/vMiroFish/intake-reviews/v1.1.0/2026-05-20-全书基础包入库使用计划.md`

基础包只能按主题切片进入 intake review。不得全量导入知识库、runtime、DeepSeek 或玩家可见 UI。

## 当前主协议

见：

- `指导大纲/v0.12.0/codex/00-总览/v0.12.0-MiroFish资料需求与交付协议.md`
- `指导大纲/vMiroFish/2026-05-16-第一次对接复盘与流程固化.md`

## 当前会话口径

负责 MiroFish 的会话链接：

- `019e207b-c55d-7e23-b450-efa7a054a165`

当前 Codex 线程不能直接联系该会话。需要用户把 `requests/` 中的请求文件转交给 MiroFish 会话；产物放回本目录后，RebornG 再做 intake review。

## 当前闭环状态

- 第一次完整对接已完成：`v0.12.0-b1 route / supply / pursuit`。
- 当前通过 review 的主包：`v0.12.0/qingmao_route_supply_pursuit_pack_export_ready.json`。
- 当前 review：`intake-reviews/2026-05-16-qingmao-route-supply-pursuit-pack-intake-review.md`。
- 当前可吸收范围：routeCandidate、supplyRequirement、pursuitTrigger。
- 延期范围：factionPressure 到 b2；hiddenFactRef 到 hidden fact gate 或 b3。

## 下一包提醒

进入 `v0.12.0-b2` 前，Codex 已写好 `qingmao_faction_pressure_pack` 请求：

- `requests/2026-05-16-qingmao-faction-pressure-pack.md`

需要用户转交给 MiroFish 会话。进入 `v0.12.0-b3` 前，Codex 应主动判断是否请求 `fang_yuan_public_evidence_pack`。
