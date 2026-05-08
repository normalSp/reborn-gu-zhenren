# RebornG Lore Index

本目录是开发用世界观索引库，只保存摘要、设计约束和定位锚点，不复制原著正文，不进入运行时代码路径。

## Source Policy

- 原著全文本地来源：`doc/original work/reverend-insanity.txt`
- 项目 canon 来源：`src/canon/*.json`
- 本索引只记录：关键词、人物/势力/术语摘要、可用于后续审查的定位线索。
- 后续新增条目必须注明来源类型：`original_text_keyword`、`canon_file`、`design_outline` 或 `implementation_evidence`。

## Files

- `characters.md`：核心人物、势力代表、AI性格约束。
- `world-and-cultivation.md`：五域、境界、空窍/仙窍、十绝体、道痕。
- `gu-economy-events.md`：蛊虫、杀招、宝黄天、货币经济、关键事件锚点。
- `lore-index.json`：机器可读索引，供后续审计和检索脚本使用。

## Usage

开发前先查本目录，再回到原著全文或 canon 文件验证细节。若索引与源码或 canon 冲突，以源码/canon 当前实现为实现真相，以原著全文为世界观真相，并在跟踪文档中标注差异。
