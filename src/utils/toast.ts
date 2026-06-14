/**
 * 通知管理工具类
 */

import type { stdResponse } from "./api"

const normalizeMessage = (message: string, fallback: string) => {
  const value = String(message || "").trim()
  return value || fallback
}

export default class Toast {
  static success = (message: string) => {
    window.dispatchEvent(
      new CustomEvent("show-toast", {
        detail: { message: normalizeMessage(message, "操作成功"), type: "success" },
      }),
    )
  }

  static info = (message: string) => {
    window.dispatchEvent(
      new CustomEvent("show-toast", {
        detail: { message: normalizeMessage(message, "提示"), type: "info" },
      }),
    )
  }

  static warn = (message: string) => {
    window.dispatchEvent(
      new CustomEvent("show-toast", {
        detail: { message: normalizeMessage(message, "请注意"), type: "warn" },
      }),
    )
  }

  static error = (message: string) => {
    window.dispatchEvent(
      new CustomEvent("show-toast", {
        detail: { message: normalizeMessage(message, "操作失败"), type: "error" },
      }),
    )
  }

  /**
   * @brief 自动处理API工具类产生的标准响应
   * @param response 标准响应
   * @param showSuccess 是否处理成功响应
   */
  static stdResponse = (
    response: stdResponse,
    showSuccess: boolean = true,
    showError: boolean = showSuccess,
  ) => {
    const message = response.message || (response.success ? "操作成功" : "操作失败")
    if (response.success) {
      if (showSuccess) {
        Toast.success(message)
      }
    } else {
      if (showError) {
        Toast.error(message)
      }
    }
  }
}
