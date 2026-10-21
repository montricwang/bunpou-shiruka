# 文法？知るか！

日语语法学习应用。交互原型已经实现并待验收，语法数据源和数据库方案仍在调研阶段。

## 项目目录

- `frontend/`：学习界面与交互。
- `backend/`：服务端逻辑与数据处理。
- `docs/`：需求、设计与开发文档。
- `data/raw/`：采集的原始语法资料。
- `data/processed/`：整理后的结构化数据。

原始资料和处理结果默认只保存在本地。确认来源、授权和发布范围后，再决定是否纳入版本控制。

## 开发协作

遵循 [《教学与开发协作手册》](https://github.com/montricwang/chatgpt-vault/blob/main/GPT%20%E7%BA%A6%E6%9D%9F/%E6%95%99%E5%AD%A6%E4%B8%8E%E5%BC%80%E5%8F%91%E5%8D%8F%E4%BD%9C%E6%89%8B%E5%86%8C.md)。

具体功能、技术栈和语法资料采集方案将在讨论后逐步确定。


## 当前进度

- [交互原型 PR #3](https://github.com/montricwang/bunpou-shiruka/pull/3)：词尾活用、助动词接续、夜间模式等，尚未合并；网页原型可在该分支试用。
- [资料调研 Issue #4](https://github.com/montricwang/bunpou-shiruka/issues/4) 与 [Draft PR #5](https://github.com/montricwang/bunpou-shiruka/pull/5)：先验证日本本土语法体系、UniDic 等来源，再设计数据库。
- [2026-10-21 DevLog](docs/devlog/2026-10-21.md)：首轮交互与数据源调研的工作记录。
- [日本本土语法体系与数据源调查](docs/research/japanese-grammar-sources.md)：学术参照、机器资源、许可边界及后续验证任务。

目前不批量导入例句和现有 Excel；原始资料的来源、版本与使用许可需先核对。
