# 文法？知るか！

日语语法学习应用。目前处于需求与设计讨论阶段。

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

## 交互原型

直接在浏览器打开 [`frontend/morphology-demo.html`](frontend/morphology-demo.html)，即可体验一个无依赖的形态链样本：从「書く」展开活用词尾、选择接续、继续构造助动词及其变化。这个页面仅验证交互方式，还不是完整语法规则库。
