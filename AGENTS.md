# WUST Algo Frontend Agent Guide

所有后续前端开发都必须遵循 `DESIGN_SYSTEM.md`。

## Required UI Rules

- 新增按钮必须使用 `src/components/ui/AppButton.vue`。
- 不要新增局部 `.xxx-btn` 视觉样式；如果必须保留类名，只能用于布局，不负责颜色、字体、圆角和 hover。
- 颜色必须使用主题变量，禁止硬编码新的主题色。
- 字体必须继承全局字体，禁止局部改成 system-ui、Arial、微软雅黑等。
- hover 规则：普通/主按钮变为当前主题色；危险按钮变为 danger 红色。
- 新增页面必须检查四个主题和移动端断点，禁止整页横向溢出。
- 卡片和面板必须让内容留在卡片内：普通卡片不要固定高度，内容变多时自动撑开；超宽表格、热力图和长字段必须在卡片内部滚动或换行。
- API 错误展示必须使用 `Toast.stdResponse` 或 `normalizeApiError`，不要只写“操作失败”。

## Design Direction

WUST Algo 的界面应该像一个专业训练系统：清晰、克制、统一、有一点算法社区的酷感。不要用多余色块和重复边框堆页面，也不要把每个新功能做成独立视觉风格。
