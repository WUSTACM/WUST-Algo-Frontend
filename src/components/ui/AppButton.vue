<template>
  <button
    class="app-button"
    :class="[`app-button-${variant}`, `app-button-${size}`, { 'is-block': block }]"
    :type="type"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: "default" | "primary" | "danger" | "ghost"
    size?: "sm" | "md"
    type?: "button" | "submit" | "reset"
    disabled?: boolean
    block?: boolean
  }>(),
  {
    variant: "default",
    size: "md",
    type: "button",
    disabled: false,
    block: false,
  },
)
</script>

<style scoped>
.app-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid var(--ds-control-border);
  border-radius: var(--ds-radius-sm);
  color: var(--ds-control-text);
  background: var(--ds-control-bg);
  cursor: pointer;
  font-family: var(--ds-font-family);
  font-weight: var(--ds-control-font-weight);
  line-height: 1;
  letter-spacing: 0.02em;
  white-space: nowrap;
  transition:
    background-color var(--ds-motion-fast),
    border-color var(--ds-motion-fast),
    color var(--ds-motion-fast),
    opacity var(--ds-motion-fast),
    box-shadow var(--ds-motion-fast);
}

.app-button-sm {
  min-height: var(--ds-control-height-sm);
  padding: 4px var(--ds-control-padding-x-sm);
  font-size: var(--ds-control-font-size);
}

.app-button-md {
  min-height: var(--ds-control-height-md);
  padding: 6px var(--ds-control-padding-x-md);
  font-size: var(--text-base);
}

.app-button-primary,
.app-button:hover:not(:disabled) {
  border-color: var(--ds-control-primary) !important;
  color: var(--ds-control-primary-text) !important;
  background: var(--ds-control-primary) !important;
}

.app-button-danger:hover:not(:disabled) {
  border-color: var(--ds-control-danger) !important;
  color: #fff !important;
  background: var(--ds-control-danger) !important;
}

.app-button-ghost {
  background: transparent !important;
}

.app-button.is-block {
  width: 100%;
}

.app-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.app-button:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}
</style>
