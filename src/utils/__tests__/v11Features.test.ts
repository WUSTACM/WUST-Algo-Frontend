import { describe, expect, it } from "vitest"
import { buildAchievementBadges } from "../v11Features"
import { buildTrainingPortrait } from "../trainingStatus"
import type {
  CoreStatisticPeriodData,
  CoreStatisticPlatformPeriodItem,
  CoreSubmitLogGetByIdData,
} from "../api"

const period = (acTotal: number, submitTotal = acTotal): CoreStatisticPeriodData => ({
  ac: {
    today: 0,
    thisWeek: 0,
    lastWeek: 0,
    thisMonth: 0,
    lastMonth: 0,
    thisYear: acTotal,
    lastYear: 0,
    total: acTotal,
  },
  submit: {
    today: 0,
    thisWeek: 0,
    lastWeek: 0,
    thisMonth: 0,
    lastMonth: 0,
    thisYear: submitTotal,
    lastYear: 0,
    total: submitTotal,
  },
})

describe("buildTrainingPortrait", () => {
  it("keeps recent platform summary in the canonical platform order", () => {
    const base = Math.floor(Date.now() / 1000) - 3600
    const logs = [
      submit("AC", base, "A", "CodeForces"),
      submit("AC", base + 60, "B", "AtCoder"),
      submit("WA", base + 120, "C", "CodeForces"),
      submit("AC", base + 180, "D", "LuoGu"),
    ]
    const portrait = buildTrainingPortrait({ period: period(3, 4), recentLogs: logs })
    expect(portrait.recent30Summary).toContain("主要活跃于 AtCoder 和 LuoGu")
  })
})

const platformStat = (platform: string, acTotal: number): CoreStatisticPlatformPeriodItem => ({
  platform: platform as any,
  ac: {
    today: 0,
    thisWeek: 0,
    lastWeek: 0,
    thisMonth: 0,
    lastMonth: 0,
    thisYear: acTotal,
    lastYear: 0,
    total: acTotal,
  },
  submit: {
    today: 0,
    thisWeek: 0,
    lastWeek: 0,
    thisMonth: 0,
    lastMonth: 0,
    thisYear: acTotal,
    lastYear: 0,
    total: acTotal,
  },
})

const submit = (
  status: string,
  time: number,
  problem = "A",
  platform = "AtCoder",
): CoreSubmitLogGetByIdData => ({
  id: time,
  userId: 1,
  platform: platform as any,
  contest: "contest",
  problem,
  submitId: `${platform}-${problem}-${time}`,
  lang: "C++",
  status,
  time: String(time),
})

describe("buildAchievementBadges", () => {
  it("unlocks basic AC achievements from real AC total", () => {
    const badges = buildAchievementBadges(period(10), [], [])
    expect(badges.find((item) => item.key === "first-ac")?.unlocked).toBe(true)
    expect(badges.find((item) => item.key === "ten-ac")?.unlocked).toBe(true)
  })

  it("keeps cross-platform achievement locked until three OJs have AC", () => {
    const badges = buildAchievementBadges(
      period(10),
      [],
      [platformStat("AtCoder", 3), platformStat("NowCoder", 4)],
    )
    expect(badges.find((item) => item.key === "oj-wanderer")?.unlocked).toBe(false)
  })

  it("detects one-hour AC burst from submit logs", () => {
    const base = 1_800_000_000
    const logs = Array.from({ length: 5 }, (_, index) =>
      submit("AC", base + index * 60, `P${index}`),
    )
    const badges = buildAchievementBadges(period(5), logs, [])
    expect(badges.find((item) => item.key === "hands-on")?.unlocked).toBe(true)
  })
})
