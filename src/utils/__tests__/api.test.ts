import { beforeEach, describe, expect, it, vi } from "vitest"
import { normalizeApiError } from "../api"

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value)
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

vi.stubGlobal("localStorage", localStorageMock)

describe("normalizeApiError", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("uses non-empty plain string response bodies first", () => {
    expect(normalizeApiError({ response: { data: "  邀请码无效  " } }, "操作失败")).toBe(
      "邀请码无效",
    )
  })

  it("prefers backend error fields before generic axios messages", () => {
    const error = {
      message: "Request failed with status code 403",
      response: {
        data: {
          message: "",
          error: "不能修改管理员账号",
          reason: "权限不足",
          code: "FORBIDDEN",
        },
      },
    }

    expect(normalizeApiError(error, "修改失败")).toBe("不能修改管理员账号")
  })

  it("falls back through reason and code fields", () => {
    expect(normalizeApiError({ response: { data: { reason: "团队不存在" } } }, "获取失败")).toBe(
      "团队不存在",
    )
    expect(
      normalizeApiError({ response: { data: { code: "TEAM_INVITE_EXPIRED" } } }, "处理失败"),
    ).toBe("TEAM_INVITE_EXPIRED")
  })

  it("maps common HTTP statuses to readable messages", () => {
    expect(normalizeApiError({ response: { status: 401 } }, "请求失败")).toBe(
      "登录状态已失效，请重新登录",
    )
    expect(normalizeApiError({ response: { status: 403 } }, "请求失败")).toBe(
      "权限不足，无法完成操作",
    )
    expect(normalizeApiError({ response: { status: 404 } }, "请求失败")).toBe("请求资源不存在")
    expect(normalizeApiError({ response: { status: 500 } }, "请求失败")).toBe(
      "服务器开小差了，请稍后再试",
    )
  })

  it("uses fallback when no useful error details exist", () => {
    expect(normalizeApiError({}, "保存失败")).toBe("保存失败")
  })
})
