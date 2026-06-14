<template>
  <div class="confirmContainer" v-show="visible">
    <div class="window">
      <div class="header">
        <div class="title">{{ title }}</div>
      </div>
      <div class="content">
        <div class="message">{{ message }}</div>
      </div>
      <div class="footer">
        <div class="actions">
          <AppButton variant="primary" size="sm" @click="handleYes">{{ yesText }}</AppButton>
          <AppButton size="sm" @click="handleNo">{{ noText }}</AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import AppButton from "@/components/ui/AppButton.vue"

// 定义组件属性
withDefaults(
  defineProps<{
    title?: string
    message: string
    yesText?: string
    noText?: string
  }>(),
  {
    title: "确认",
    yesText: "确定",
    noText: "取消",
  },
)

// 定义事件
const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const visible = ref(false)

// 显示确认框
const show = () => {
  visible.value = true
}

// 隐藏确认框
const hide = () => {
  visible.value = false
}

// 处理确认操作
const handleYes = () => {
  emit("confirm")
  hide()
}

// 处理取消操作
const handleNo = () => {
  emit("cancel")
  hide()
}

// 暴露给父组件的方法
defineExpose({
  show,
  hide,
})
</script>

<style scoped>
.confirmContainer {
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 10000;

  > .window {
    background: var(--background-color-2);
    border-radius: 8px;
    border: 1px solid var(--divider-color);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    min-width: 300px;
    max-width: 500px;

    > .header {
      padding: 20px;
      border-bottom: 1px solid var(--divider-color);

      > .title {
        font-size: 1.2em;
        font-weight: bold;
        color: var(--text-default-color);
      }
    }

    > .content {
      padding: 20px;

      > .message {
        color: var(--text-light-color);
        line-height: 1.5;
      }
    }

    > .footer {
      padding: 15px 20px;
      border-top: 1px solid var(--divider-color);
      text-align: right;
    }
  }
}

.actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
</style>
