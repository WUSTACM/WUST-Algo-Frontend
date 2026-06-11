# WUST Algo Design System

本项目的界面目标是：**克制、清晰、统一、有训练系统的专业感**。新增功能时优先复用设计系统组件和变量，不要在页面里重新发明按钮、输入框、弹窗和分页。

## 核心原则

- **统一优先**：同类操作必须长得一样，尤其是按钮、输入框、分页、弹窗确认区。
- **主题兼容**：所有颜色必须使用 CSS 变量，例如 `--neon-cyan`、`--divider-color`、`--background-color-2`、`--text-default-color`。
- **字体一致**：统一使用 `Jetbrains Mono + Maple Mono CN`，不要在页面局部指定 Arial、system-ui、微软雅黑等其他字体。
- **悬停反馈一致**：普通按钮 hover 使用当前主题色，危险按钮 hover 使用红色。
- **信息克制**：页面优先展示用户要完成的动作，不要用多余边框、色块和大面积装饰堆叠内容。
- **卡片自适应**：普通卡片和面板不要写死高度，内容超过预期时应让卡片纵向增高；表格、热力图、长 `problem key` 这类超宽内容必须在卡片内部滚动或换行，禁止显示到卡片外面。
- **移动端优先兜底**：新增卡片、表格和按钮区必须检查 `900px / 640px / 420px` 断点，禁止整页横向溢出。

## 组件使用

新代码必须优先使用：

```vue
<script setup lang="ts">
import AppButton from "@/components/ui/AppButton.vue";
</script>

<template>
  <AppButton>取消</AppButton>
  <AppButton variant="primary">确认</AppButton>
  <AppButton variant="danger">删除</AppButton>
</template>
```

按钮规范：

- 普通操作：`variant="default"`
- 主操作：`variant="primary"`
- 危险操作：`variant="danger"`
- 低强调操作：`variant="ghost"`
- 小按钮：`size="sm"`
- 表单提交按钮：`type="submit"`
- 不要在页面内新写 `.xxx-btn`，除非它只是布局容器，不负责按钮视觉。

## 兼容层

`src/assets/css/design-system.css` 是历史页面兼容层。它统一了这些旧类的按钮视觉：

- `.btn`
- `.login-btn`
- `.register-btn`
- `.team-edit`
- `.team-action`
- `.invite-action`
- `.achievement-action-button`
- `.page-nav-btn`
- `.modal-close`
- `.ranking-switch button`

这层是为了让旧页面全站统一；新页面不要继续新增这些旧类。

## 页面设计思路

页面结构建议固定为：

1. 顶部标题区：图标 + 中文标题，右侧放少量关键操作。
2. 内容卡片区：统一圆角和浅边框，避免嵌套太多框。
3. 表单区：label、输入框、说明文案垂直对齐；输入框宽度不要突出卡片边界。
4. 操作区：主按钮在左或右保持同页一致，危险按钮不和主按钮抢视觉。
5. 空状态：给明确下一步，不只写“暂无数据”。

## 新功能开发提示

每次新增或修改前端功能，请遵守下面这段提示：

> 新增 UI 必须遵循 WUST Algo Design System。按钮使用 `AppButton`，颜色使用主题变量，字体继承全局字体，hover 使用当前主题色，危险操作使用 danger 样式。不要新增局部按钮视觉类，不要硬编码主题外颜色。页面需要兼容四个主题和移动端断点，表格在小屏使用内部滚动或卡片化。错误提示使用 `Toast.stdResponse` 或 `normalizeApiError`，不要吞掉后端错误原因。

> 卡片布局必须遵循“内容在卡片内”的原则：普通卡片只允许使用 `min-height` 作为视觉下限，不要固定 `height`；内容变多时卡片自动撑开。确实不可换行的宽内容，例如统计明细表、热力图和长字段，必须放在卡片内部滚动容器中，不能溢出到相邻卡片或页面外。

## 后续迁移方向

- 新增 `AppInput`：统一输入框、textarea、select。
- 新增 `AppModal`：统一弹窗标题、正文和按钮区。
- 新增 `AppPagination`：统一分页按钮和跳转输入。
- 逐步删除页面内重复 `.btn` / `.team-action` / `.invite-action` 样式。
