import type {
  CoreStatisticPeriodData,
  CoreStatisticPlatformPeriodItem,
  CoreSubmitLogGetByIdData,
} from "@/utils/api"

export interface AchievementBadge {
  key: string
  label: string
  description: string
  hiddenDescription?: string
  condition: string
  icon: string
  unlocked: boolean
  progress: number
  tone: "cyan" | "blue" | "gold" | "red" | "muted"
  rarity?: "common" | "rare" | "epic" | "legendary" | "pain" | "hidden" | "fun" | "server"
  hidden?: boolean
  permanent?: boolean
}

export interface AchievementTeamContext {
  currentUserId: number
  members: Pick<TeamDashboardMember, "userId" | "acTotal" | "submitTotal" | "waTotal">[]
  nightAcPercentile?: number
  passwordChangeCount?: number
  totalSubmitPercentile?: number
  acceptRatePercentile?: number
  medianSubmit?: number
  medianAcceptRate?: number
  uniqueAcMinute?: boolean
  siteDailyWaLeader?: boolean
  todaySubmitLeader?: boolean
  todaySubmit?: number
  todayAcRatePercentile?: number
  offPeakPercentile?: number
}

export interface WeeklyReportMetric {
  label: string
  value: string
  hint: string
}

export interface WeeklyReportScene {
  title: string
  text: string
}

export interface WeeklyReport {
  title: string
  summary: string
  advice: string
  metrics: WeeklyReportMetric[]
  scenes: WeeklyReportScene[]
  tip: string
}

export interface TeamDashboardMember {
  userId: number
  name: string
  username: string
  avatar: string
  acTotal: number
  submitTotal: number
  waTotal: number
  weekAc: number
  weekSubmit: number
  monthAc: number
  monthSubmit: number
}

export interface TeamDashboard {
  weekAc: number
  weekSubmit: number
  monthAc: number
  activeMembers: number
  leader: TeamDashboardMember | null
  members: TeamDashboardMember[]
  summary: string
}

const toNumber = (value: unknown): number => {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

const nowSeconds = () => Math.floor(Date.now() / 1000)

const isAccepted = (status: string): boolean => {
  const normalized = status.trim().toLowerCase()
  return (
    normalized === "ac" ||
    normalized.includes("accepted") ||
    normalized.includes("答案正确") ||
    normalized.includes("通过")
  )
}

const isCompileError = (status: string): boolean => {
  const normalized = status.trim().toLowerCase()
  return (
    normalized === "ce" ||
    normalized.includes("compile") ||
    normalized.includes("compilation") ||
    normalized.includes("编译")
  )
}

const isWrongAnswer = (status: string): boolean => {
  const normalized = status.trim().toLowerCase()
  return (
    normalized === "wa" || normalized.includes("wrong answer") || normalized.includes("答案错误")
  )
}

const problemKey = (log: CoreSubmitLogGetByIdData): string => {
  const platform = String(log.platform || "Unknown").trim()
  const problem = String(log.problem || "").trim()
  const submitId = String(log.submitId || log.id || "").trim()
  return `${platform}:${problem || submitId}`
}

const logsBetween = (logs: CoreSubmitLogGetByIdData[], start: number, end: number) => {
  return logs.filter((log) => {
    const time = toNumber(log.time)
    return time >= start && time < end
  })
}

const uniqueAcCount = (logs: CoreSubmitLogGetByIdData[]): number => {
  const accepted = new Set<string>()
  logs.forEach((log) => {
    if (isAccepted(log.status)) {
      accepted.add(problemKey(log))
    }
  })
  return accepted.size
}

const activeDayCount = (logs: CoreSubmitLogGetByIdData[]): number => {
  return new Set(logs.map((log) => new Date(toNumber(log.time) * 1000).toISOString().slice(0, 10)))
    .size
}

const topPlatform = (logs: CoreSubmitLogGetByIdData[]): string => {
  const counts = new Map<string, number>()
  logs.forEach((log) => {
    const platform = String(log.platform || "未知平台")
    counts.set(platform, (counts.get(platform) || 0) + 1)
  })
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "暂无平台"
}

const platformLabel = (platform: string): string => {
  const labels: Record<string, string> = {
    AtCoder: "AtCoder",
    NowCoder: "NowCoder",
    LuoGu: "Luogu",
    CodeForces: "CodeForces",
    LeetCode: "LeetCode",
    QOJ: "QOJ",
  }
  return labels[platform] || platform || "未知平台"
}

const formatPlatformList = (platforms: string[]): string => {
  return platforms.map(platformLabel).join("、")
}

const clampProgress = (value: number, target: number) => {
  if (target <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((value / target) * 100)))
}

const localDateKey = (time: number) => {
  const date = new Date(time * 1000)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

const localMonthKey = (time: number) => localDateKey(time).slice(0, 7)

const dayNumberFromKey = (key: string) => {
  const [year, month, day] = key.split("-").map(Number)
  return Math.floor(new Date(year || 1970, (month || 1) - 1, day || 1).getTime() / 86400000)
}

const groupLogsByDay = (logs: CoreSubmitLogGetByIdData[]) => {
  const days = new Map<string, { submit: number; ac: number; wa: number }>()
  logs.forEach((log) => {
    const key = localDateKey(toNumber(log.time))
    const current = days.get(key) || { submit: 0, ac: 0, wa: 0 }
    current.submit += 1
    if (isAccepted(log.status)) current.ac += 1
    if (isWrongAnswer(log.status)) current.wa += 1
    days.set(key, current)
  })
  return days
}

const maxDailyValue = (
  days: Map<string, { submit: number; ac: number; wa: number }>,
  field: "submit" | "ac" | "wa",
) => {
  return Math.max(0, ...[...days.values()].map((item) => item[field]))
}

const maxConsecutiveDays = (dayKeys: string[]) => {
  const numbers = [...new Set(dayKeys.map(dayNumberFromKey))].sort((a, b) => a - b)
  let best = 0
  let current = 0
  let previous: number | null = null
  numbers.forEach((day) => {
    current = previous !== null && day === previous + 1 ? current + 1 : 1
    best = Math.max(best, current)
    previous = day
  })
  return best
}

const hasDailyStreak = (
  days: Map<string, { submit: number; ac: number; wa: number }>,
  count: number,
  predicate: (day: { submit: number; ac: number; wa: number }) => boolean,
) => {
  const matched = [...days.entries()].filter(([, value]) => predicate(value)).map(([key]) => key)
  return maxConsecutiveDays(matched) >= count
}

const hasGapThenAc = (
  logs: CoreSubmitLogGetByIdData[],
  gapDays: number,
  gapType: "submit" | "ac",
) => {
  const sorted = [...logs].sort((a, b) => toNumber(a.time) - toNumber(b.time))
  let previousTime: number | null = null
  for (const log of sorted) {
    const currentTime = toNumber(log.time)
    if (
      isAccepted(log.status) &&
      previousTime !== null &&
      currentTime - previousTime >= gapDays * 86400
    ) {
      return true
    }
    if (gapType === "submit" || isAccepted(log.status)) {
      previousTime = currentTime
    }
  }
  return false
}

const hasMonthlyScatteredTraining = (logs: CoreSubmitLogGetByIdData[]) => {
  const months = new Map<string, string[]>()
  logs.forEach((log) => {
    const month = localMonthKey(toNumber(log.time))
    const list = months.get(month) || []
    list.push(localDateKey(toNumber(log.time)))
    months.set(month, list)
  })
  for (const dayKeys of months.values()) {
    const uniqueDays = [...new Set(dayKeys)]
    if (uniqueDays.length >= 10 && maxConsecutiveDays(uniqueDays) <= 2) return true
  }
  return false
}

const qixiDateByYear: Record<number, string> = {
  2018: "2018-08-17",
  2019: "2019-08-07",
  2020: "2020-08-25",
  2021: "2021-08-14",
  2022: "2022-08-04",
  2023: "2023-08-22",
  2024: "2024-08-10",
  2025: "2025-08-29",
  2026: "2026-08-19",
  2027: "2027-08-08",
  2028: "2028-08-26",
  2029: "2029-08-16",
  2030: "2030-08-05",
}

const hasThreeLineLoveLetter = (logs: CoreSubmitLogGetByIdData[]) => {
  const acDates = new Set(
    logs.filter((log) => isAccepted(log.status)).map((log) => localDateKey(toNumber(log.time))),
  )
  return Object.entries(qixiDateByYear).some(
    ([year, qixi]) =>
      acDates.has(`${year}-03-14`) && acDates.has(`${year}-05-20`) && acDates.has(qixi),
  )
}

const hasNewYearAc = (logs: CoreSubmitLogGetByIdData[]) => {
  return logs.some((log) => {
    if (!isAccepted(log.status)) return false
    const date = new Date(toNumber(log.time) * 1000)
    return date.getMonth() === 0 && date.getDate() === 1 && date.getHours() === 0
  })
}

const groupLogsByProblem = (logs: CoreSubmitLogGetByIdData[]) => {
  const groups = new Map<string, CoreSubmitLogGetByIdData[]>()
  logs.forEach((log) => {
    const key = problemKey(log)
    if (!key) return
    const list = groups.get(key) || []
    list.push(log)
    groups.set(key, list)
  })
  groups.forEach((list) => list.sort((a, b) => toNumber(a.time) - toNumber(b.time)))
  return groups
}

const hasWaThenAc = (groups: Map<string, CoreSubmitLogGetByIdData[]>, minWa: number) => {
  for (const logs of groups.values()) {
    const firstAcIndex = logs.findIndex((log) => isAccepted(log.status))
    if (firstAcIndex <= 0) continue
    const waBeforeAc = logs.slice(0, firstAcIndex).filter((log) => isWrongAnswer(log.status)).length
    if (waBeforeAc >= minWa) return true
  }
  return false
}

const hasManySubmitsInWindow = (
  groups: Map<string, CoreSubmitLogGetByIdData[]>,
  limit: number,
  seconds: number,
) => {
  for (const logs of groups.values()) {
    for (let left = 0, right = 0; right < logs.length; right += 1) {
      const rightLog = logs[right]
      if (!rightLog) continue
      const rightTime = toNumber(rightLog.time)
      let leftLog = logs[left]
      while (leftLog && rightTime - toNumber(leftLog.time) > seconds) {
        left += 1
        leftLog = logs[left]
      }
      if (right - left + 1 >= limit) return true
    }
  }
  return false
}

const hasLongFightAc = (groups: Map<string, CoreSubmitLogGetByIdData[]>, seconds: number) => {
  for (const logs of groups.values()) {
    const first = logs[0]
    const firstAc = logs.find((log) => isAccepted(log.status))
    if (first && firstAc && toNumber(firstAc.time) - toNumber(first.time) >= seconds) return true
  }
  return false
}

const hasFirstWaToFirstAcGap = (
  groups: Map<string, CoreSubmitLogGetByIdData[]>,
  seconds: number,
) => {
  for (const logs of groups.values()) {
    const firstWa = logs.find((log) => isWrongAnswer(log.status))
    const firstAc = logs.find((log) => isAccepted(log.status))
    if (
      firstWa &&
      firstAc &&
      toNumber(firstAc.time) > toNumber(firstWa.time) &&
      toNumber(firstAc.time) - toNumber(firstWa.time) >= seconds
    ) {
      return true
    }
  }
  return false
}

const hasFirstTryAc = (groups: Map<string, CoreSubmitLogGetByIdData[]>) => {
  for (const logs of groups.values()) {
    const first = logs[0]
    if (first && isAccepted(first.status)) return true
  }
  return false
}

const hasAcInHourRange = (
  logs: CoreSubmitLogGetByIdData[],
  startHour: number,
  endHour: number,
  endMinute = 60,
) => {
  return logs.some((log) => {
    if (!isAccepted(log.status)) return false
    const date = new Date(toNumber(log.time) * 1000)
    const hour = date.getHours()
    const minute = date.getMinutes()
    if (startHour === endHour) return hour === startHour && minute < endMinute
    return hour >= startHour && hour < endHour
  })
}

const maxAcInOneHour = (logs: CoreSubmitLogGetByIdData[]) => {
  const acTimes = logs
    .filter((log) => isAccepted(log.status))
    .map((log) => toNumber(log.time))
    .sort((a, b) => a - b)
  let best = 0
  for (let left = 0, right = 0; right < acTimes.length; right += 1) {
    const rightTime = acTimes[right]
    if (rightTime === undefined) continue
    let leftTime = acTimes[left]
    while (leftTime !== undefined && rightTime - leftTime > 3600) {
      left += 1
      leftTime = acTimes[left]
    }
    best = Math.max(best, right - left + 1)
  }
  return best
}

const maxWaInOneHour = (logs: CoreSubmitLogGetByIdData[]) => {
  const waTimes = logs
    .filter((log) => isWrongAnswer(log.status))
    .map((log) => toNumber(log.time))
    .sort((a, b) => a - b)
  let best = 0
  for (let left = 0, right = 0; right < waTimes.length; right += 1) {
    const rightTime = waTimes[right]
    if (rightTime === undefined) continue
    let leftTime = waTimes[left]
    while (leftTime !== undefined && rightTime - leftTime > 3600) {
      left += 1
      leftTime = waTimes[left]
    }
    best = Math.max(best, right - left + 1)
  }
  return best
}

const maxWaInWindow = (logs: CoreSubmitLogGetByIdData[], seconds: number) => {
  const waTimes = logs
    .filter((log) => isWrongAnswer(log.status))
    .map((log) => toNumber(log.time))
    .sort((a, b) => a - b)
  let best = 0
  for (let left = 0, right = 0; right < waTimes.length; right += 1) {
    const rightTime = waTimes[right]
    if (rightTime === undefined) continue
    let leftTime = waTimes[left]
    while (leftTime !== undefined && rightTime - leftTime > seconds) {
      left += 1
      leftTime = waTimes[left]
    }
    best = Math.max(best, right - left + 1)
  }
  return best
}

const maxConsecutiveStatus = (
  logs: CoreSubmitLogGetByIdData[],
  matcher: (status: string) => boolean,
) => {
  const sortedLogs = [...logs].sort((a, b) => toNumber(a.time) - toNumber(b.time))
  let best = 0
  let current = 0
  sortedLogs.forEach((log) => {
    if (matcher(log.status)) {
      current += 1
      best = Math.max(best, current)
      return
    }
    current = 0
  })
  return best
}

const nightAcceptedCount = (logs: CoreSubmitLogGetByIdData[]) => {
  return logs.filter((log) => {
    if (!isAccepted(log.status)) return false
    const hour = new Date(toNumber(log.time) * 1000).getHours()
    return hour >= 0 && hour < 5
  }).length
}

const hasRetirementFailed = (logs: CoreSubmitLogGetByIdData[]) => {
  const sortedAc = logs
    .filter((log) => isAccepted(log.status))
    .sort((a, b) => toNumber(a.time) - toNumber(b.time))
  for (let index = 1; index < sortedAc.length; index += 1) {
    const current = sortedAc[index]
    const previous = sortedAc[index - 1]
    if (current && previous && toNumber(current.time) - toNumber(previous.time) >= 30 * 86400) {
      return true
    }
  }
  return false
}

const achievementDifficultyScore = (badge: AchievementBadge) => {
  const rarityScore: Record<string, number> = {
    common: 10,
    rare: 30,
    pain: 40,
    epic: 50,
    hidden: 60,
    fun: 65,
    legendary: 70,
    server: 80,
  }
  const fallbackScore = badge.tone === "gold" ? 45 : badge.tone === "red" ? 35 : 20
  return rarityScore[badge.rarity || ""] ?? fallbackScore
}

export const buildAchievementBadges = (
  period: CoreStatisticPeriodData | null,
  submitLogs: CoreSubmitLogGetByIdData[],
  platformStats: CoreStatisticPlatformPeriodItem[],
  teamContext?: AchievementTeamContext,
): AchievementBadge[] => {
  const totalAc = toNumber(period?.ac?.total)
  const platformCount = platformStats.filter((item) => toNumber(item.ac?.total) > 0).length
  const problemGroups = groupLogsByProblem(submitLogs)
  const compileErrorCount = submitLogs.filter((log) => isCompileError(log.status)).length
  const acInOneHour = maxAcInOneHour(submitLogs)
  const waInOneHour = maxWaInOneHour(submitLogs)
  const waInFiveMinutes = maxWaInWindow(submitLogs, 5 * 60)
  const consecutiveAc = maxConsecutiveStatus(submitLogs, isAccepted)
  const consecutiveWa = maxConsecutiveStatus(submitLogs, isWrongAnswer)
  const dayStats = groupLogsByDay(submitLogs)
  const maxDailyAc = maxDailyValue(dayStats, "ac")
  const maxDailyWa = maxDailyValue(dayStats, "wa")
  const maxDailySubmit = maxDailyValue(dayStats, "submit")
  const midnightSubmitCount = submitLogs.filter((log) => {
    const hour = new Date(toNumber(log.time) * 1000).getHours()
    return hour >= 0 && hour < 5
  }).length
  const totalSubmit = toNumber(period?.submit?.total) || submitLogs.length
  const acceptedSubmit = submitLogs.filter((log) => isAccepted(log.status)).length
  const acceptRatePercent = totalSubmit > 0 ? Math.round((acceptedSubmit / totalSubmit) * 100) : 0
  const teamAcTotal =
    teamContext?.members.reduce((sum, item) => sum + toNumber(item.acTotal), 0) || 0
  const teamWaTotal =
    teamContext?.members.reduce((sum, item) => sum + toNumber(item.waTotal), 0) || 0
  const currentTeamMember = teamContext?.members.find(
    (item) => Number(item.userId) === Number(teamContext.currentUserId),
  )
  const currentTeamAc = toNumber(currentTeamMember?.acTotal)
  const currentTeamSubmit = toNumber(currentTeamMember?.submitTotal)
  const currentTeamWa = toNumber(currentTeamMember?.waTotal)
  const teamCarryRatio = teamAcTotal > 0 ? currentTeamAc / teamAcTotal : 0
  const teamWaRatio = teamWaTotal > 0 ? currentTeamWa / teamWaTotal : 0
  const ququRatio = teamAcTotal > 0 ? currentTeamAc / teamAcTotal : 0
  const userNightAcCount = nightAcceptedCount(submitLogs)
  const nightAcPercentile = toNumber(teamContext?.nightAcPercentile)
  const passwordChangeCount = toNumber(teamContext?.passwordChangeCount)
  const totalSubmitPercentile = toNumber(teamContext?.totalSubmitPercentile)
  const acceptRatePercentile = toNumber(teamContext?.acceptRatePercentile)
  const medianSubmit = toNumber(teamContext?.medianSubmit)
  const medianAcceptRate = toNumber(teamContext?.medianAcceptRate)
  const todayAcRatePercentile = toNumber(teamContext?.todayAcRatePercentile)
  const todaySubmit = toNumber(teamContext?.todaySubmit)
  const offPeakPercentile = toNumber(teamContext?.offPeakPercentile)

  const badges: AchievementBadge[] = [
    {
      key: "first-ac",
      label: "Hello AC",
      description: "你提交了一发，世界开始运转。",
      condition: "累计真实 AC 达到 1 题。",
      icon: "✓",
      unlocked: totalAc >= 1,
      progress: clampProgress(totalAc, 1),
      tone: "cyan",
    },
    {
      key: "ten-ac",
      label: "AC 小登",
      description: "初入江湖，代码还有点青涩。",
      condition: "累计真实 AC 达到 10 题。",
      icon: "10",
      unlocked: totalAc >= 10,
      progress: clampProgress(totalAc, 10),
      tone: "blue",
    },
    {
      key: "hundred-ac",
      label: "百题斩",
      description: "你已经不是来玩的了。",
      condition: "累计真实 AC 达到 100 题。",
      icon: "100",
      unlocked: totalAc >= 100,
      progress: clampProgress(totalAc, 100),
      tone: "gold",
    },
    {
      key: "thousand-ac",
      label: "千题修罗",
      description: "题单见你都绕路走。",
      condition: "累计真实 AC 达到 1000 题。",
      icon: "1K",
      unlocked: totalAc >= 1000,
      progress: clampProgress(totalAc, 1000),
      tone: "gold",
    },
    {
      key: "oj-wanderer",
      label: "OJ 流浪汉",
      description: "哪里有题，哪里就是家。",
      condition: "至少 3 个 OJ 平台有 AC 记录。",
      icon: "OJ",
      unlocked: platformCount >= 3,
      progress: clampProgress(platformCount, 3),
      tone: "blue",
    },
    {
      key: "cross-server",
      label: "跨服作战",
      description: "你已经开始打跨平台排位了。",
      condition: "至少 5 个 OJ 平台有 AC 记录。",
      icon: "5OJ",
      unlocked: platformCount >= 5,
      progress: clampProgress(platformCount, 5),
      tone: "cyan",
    },
    {
      key: "wa-until-dawn",
      label: "WA 到天亮",
      description: "你不是不会，你只是太倔了。",
      condition: "同一题 WA 不少于 10 次后最终 AC。",
      icon: "WA",
      unlocked: hasWaThenAc(problemGroups, 10),
      progress: hasWaThenAc(problemGroups, 10) ? 100 : 0,
      tone: "red",
    },
    {
      key: "penalty-sitter",
      label: "罚坐选手",
      description: "这题陪你过夜了。",
      condition: "同一题从第一次提交到 AC 间隔超过 24 小时。",
      icon: "24H",
      unlocked: hasLongFightAc(problemGroups, 24 * 3600),
      progress: hasLongFightAc(problemGroups, 24 * 3600) ? 100 : 0,
      tone: "red",
    },
    {
      key: "red-temperature",
      label: "红温战士",
      description: "冷静？不存在的。",
      condition: "30 分钟内对同一题提交不少于 8 次。",
      icon: "热",
      unlocked: hasManySubmitsInWindow(problemGroups, 8, 30 * 60),
      progress: hasManySubmitsInWindow(problemGroups, 8, 30 * 60) ? 100 : 0,
      tone: "red",
    },
    {
      key: "rush-wa",
      label: "急急急急急",
      description: "五分钟五发 WA，你和判题机肯定有私聊。",
      condition: "任意 5 分钟内 WA 不少于 10 次。",
      icon: "急",
      unlocked: waInFiveMinutes >= 10,
      progress: clampProgress(waInFiveMinutes, 10),
      tone: "red",
      rarity: "pain",
    },
    {
      key: "compiler-victim",
      label: "编译器受害者",
      description: "代码没跑，人先麻了。",
      condition: "全期 CE / 编译错误提交累计不少于 10 次。",
      icon: "CE",
      unlocked: compileErrorCount >= 10,
      progress: clampProgress(compileErrorCount, 10),
      tone: "red",
    },
    {
      key: "first-try-soul",
      label: "一发入魂",
      description: "没调试，不解释。",
      condition: "某题首次提交直接 AC。",
      icon: "???",
      unlocked: hasFirstTryAc(problemGroups),
      progress: hasFirstTryAc(problemGroups) ? 100 : 0,
      tone: "gold",
      hidden: true,
    },
    {
      key: "zero-legend",
      label: "零点传说",
      description: "新的一天，从 AC 开始。",
      condition: "全期任意一天 00:00-00:10 之间 AC 一题。",
      icon: "???",
      unlocked: hasAcInHourRange(submitLogs, 0, 0, 10),
      progress: hasAcInHourRange(submitLogs, 0, 0, 10) ? 100 : 0,
      tone: "blue",
      hidden: true,
    },
    {
      key: "luogu-at-four",
      label: "凌晨四点的武汉",
      description: "这不是自律，这是故事。",
      condition: "全期任意一天 04:00-05:00 有提交记录。",
      icon: "???",
      unlocked: submitLogs.some((log) => new Date(toNumber(log.time) * 1000).getHours() === 4),
      progress: submitLogs.some((log) => new Date(toNumber(log.time) * 1000).getHours() === 4)
        ? 100
        : 0,
      tone: "blue",
      hidden: true,
    },
    {
      key: "hands-on",
      label: "手感来了",
      description: "今天键盘很听话。",
      condition: "1 小时内 AC 不少于 5 题。",
      icon: "5AC",
      unlocked: acInOneHour >= 5,
      progress: clampProgress(acInOneHour, 5),
      tone: "cyan",
      rarity: "rare",
    },
    {
      key: "sus-opened",
      label: "疑似开了",
      description: "连续绿得太顺，建议查一下是不是本人。",
      condition: "连续 AC 不少于 15 次。",
      icon: "绿",
      unlocked: consecutiveAc >= 15,
      progress: clampProgress(consecutiveAc, 15),
      tone: "cyan",
      rarity: "epic",
    },
    {
      key: "hands-off",
      label: "手感没了",
      description: "今天评测机不太给面子。",
      condition: "1 小时内 WA 不少于 8 次。",
      icon: "8WA",
      unlocked: waInOneHour >= 8,
      progress: clampProgress(waInOneHour, 8),
      tone: "red",
      rarity: "pain",
    },
    {
      key: "sus-cannot",
      label: "疑似不会",
      description: "连续红得太稳，建议查一下是不是本人。",
      condition: "连续 WA 不少于 15 次。",
      icon: "红",
      unlocked: consecutiveWa >= 15,
      progress: clampProgress(consecutiveWa, 15),
      tone: "red",
      rarity: "pain",
    },
    {
      key: "last-stand",
      label: "绝地翻盘",
      description: "你差点放弃，但没有。",
      condition: "同一题连续失败不少于 7 次后最终 AC。",
      icon: "???",
      unlocked: hasWaThenAc(problemGroups, 7),
      progress: hasWaThenAc(problemGroups, 7) ? 100 : 0,
      tone: "gold",
      hidden: true,
    },
    {
      key: "retirement-failed",
      label: "退役失败",
      description: "嘴上退役，身体很诚实。",
      condition: "超过 30 天没有提交后重新 AC。",
      icon: "???",
      unlocked: hasRetirementFailed(submitLogs),
      progress: hasRetirementFailed(submitLogs) ? 100 : 0,
      tone: "gold",
      hidden: true,
    },
    {
      key: "seven-day-practice",
      label: "七日修行",
      description: "真正的强者，靠的是持续折磨自己。",
      condition: "连续 7 天每天至少 1 次 AC。",
      icon: "7D",
      unlocked: hasDailyStreak(dayStats, 7, (day) => day.ac >= 1),
      progress: hasDailyStreak(dayStats, 7, (day) => day.ac >= 1) ? 100 : 0,
      tone: "gold",
      rarity: "epic",
    },
    {
      key: "monthly-ascetic",
      label: "月度苦行僧",
      description: "你这个月和 OJ 绑定了。",
      condition: "连续 30 天每天至少 1 次提交。",
      icon: "30D",
      unlocked: hasDailyStreak(dayStats, 30, (day) => day.submit >= 1),
      progress: hasDailyStreak(dayStats, 30, (day) => day.submit >= 1) ? 100 : 0,
      tone: "gold",
      rarity: "legendary",
    },
    {
      key: "streak-rehab",
      label: "断签复健",
      description: "消失很久，然后突然诈尸。",
      condition: "连续 14 天无提交后再次 AC。",
      icon: "14",
      unlocked: hasGapThenAc(submitLogs, 14, "submit"),
      progress: hasGapThenAc(submitLogs, 14, "submit") ? 100 : 0,
      tone: "blue",
      rarity: "rare",
    },
    {
      key: "retirement-edge",
      label: "退役边缘",
      description: "一个月没刷题，手感像重装系统。",
      condition: "连续 30 天无 AC 后再次 AC。",
      icon: "30",
      unlocked: hasGapThenAc(submitLogs, 30, "ac"),
      progress: hasGapThenAc(submitLogs, 30, "ac") ? 100 : 0,
      tone: "gold",
      rarity: "epic",
    },
    {
      key: "three-days-fishing",
      label: "三天打鱼",
      description: "刷题很努力，但不连续。",
      condition: "一个月内提交天数不少于 10 天，但最长连续提交天数不超过 2 天。",
      icon: "散",
      unlocked: hasMonthlyScatteredTraining(submitLogs),
      progress: hasMonthlyScatteredTraining(submitLogs) ? 100 : 0,
      tone: "cyan",
      rarity: "rare",
    },
    {
      key: "daily-small-burst",
      label: "单日小爆发",
      description: "今天状态不错。",
      condition: "单日 AC 不少于 5 题。",
      icon: "5",
      unlocked: maxDailyAc >= 5,
      progress: clampProgress(maxDailyAc, 5),
      tone: "cyan",
      rarity: "rare",
    },
    {
      key: "daily-board-sweep",
      label: "单日屠榜",
      description: "这一天，你像开了。",
      condition: "单日 AC 不少于 20 题。",
      icon: "20",
      unlocked: maxDailyAc >= 20,
      progress: clampProgress(maxDailyAc, 20),
      tone: "gold",
      rarity: "legendary",
    },
    {
      key: "daily-redline",
      label: "单日红温",
      description: "今天 OJ 对你不太友好。",
      condition: "单日 WA 不少于 20 次。",
      icon: "WA",
      unlocked: maxDailyWa >= 20,
      progress: clampProgress(maxDailyWa, 20),
      tone: "red",
      rarity: "pain",
    },
    {
      key: "problem-marathon",
      label: "刷题马拉松",
      description: "你坐在那里，好像没打算起来。",
      condition: "单日提交数不少于 50 次。",
      icon: "50",
      unlocked: maxDailySubmit >= 50,
      progress: clampProgress(maxDailySubmit, 50),
      tone: "gold",
      rarity: "epic",
    },
    {
      key: "high-intensity-training",
      label: "高强度训练",
      description: "不是比赛，但比比赛还累。",
      condition: "连续 3 天每天提交数不少于 20 次。",
      icon: "3D",
      unlocked: hasDailyStreak(dayStats, 3, (day) => day.submit >= 20),
      progress: hasDailyStreak(dayStats, 3, (day) => day.submit >= 20) ? 100 : 0,
      tone: "red",
      rarity: "pain",
    },
    {
      key: "new-year-ac",
      label: "跨年 AC",
      description: "新年第一件事：过题。",
      condition: "1 月 1 日 00:00-01:00 获得 AC。",
      icon: "NY",
      unlocked: hasNewYearAc(submitLogs),
      progress: hasNewYearAc(submitLogs) ? 100 : 0,
      tone: "gold",
      rarity: "legendary",
      hidden: true,
    },
    {
      key: "three-line-love-letter",
      label: "三行情书",
      description: "你写给世界的情书，是三发 Accepted。",
      condition: "同一年内，白色情人节、520、七夕均有 AC。",
      icon: "♥",
      unlocked: hasThreeLineLoveLetter(submitLogs),
      progress: hasThreeLineLoveLetter(submitLogs) ? 100 : 0,
      tone: "gold",
      rarity: "legendary",
      hidden: true,
    },
    {
      key: "midnight-judge",
      label: "凌晨判官",
      description: "这个点还在判题，OJ 都沉默了。",
      condition: "00:00-05:00 总提交数不少于 100 次。",
      icon: "夜",
      unlocked: midnightSubmitCount >= 100,
      progress: clampProgress(midnightSubmitCount, 100),
      tone: "blue",
      rarity: "epic",
    },
    {
      key: "night-limited-skin",
      label: "夜间限定皮肤",
      description: "白天是普通人，凌晨是算法怪物。",
      condition: "00:00-05:00 的 AC 数超过全站 90% 用户。",
      icon: "夜",
      unlocked: nightAcPercentile >= 90,
      progress:
        nightAcPercentile > 0
          ? Math.min(100, Math.round(nightAcPercentile))
          : clampProgress(userNightAcCount, 100),
      tone: "blue",
      rarity: "legendary",
      hidden: true,
    },
    {
      key: "undead-revival",
      label: "死者苏生",
      description: "很久以前没过的题，今天终于活了。",
      condition: "同一题首次 WA 到首次 AC 间隔不少于 30 天。",
      icon: "30D",
      unlocked: hasFirstWaToFirstAcGap(problemGroups, 30 * 86400),
      progress: hasFirstWaToFirstAcGap(problemGroups, 30 * 86400) ? 100 : 0,
      tone: "gold",
      rarity: "epic",
      hidden: true,
    },
    {
      key: "not-bro",
      label: "不是哥们",
      description: "传说很久以前没过的题，今天龙王逆袭。",
      condition: "同一题首次 WA 到第一次 AC 间隔不少于 100 天。",
      icon: "100D",
      unlocked: hasFirstWaToFirstAcGap(problemGroups, 100 * 86400),
      progress: hasFirstWaToFirstAcGap(problemGroups, 100 * 86400) ? 100 : 0,
      tone: "gold",
      rarity: "legendary",
      hidden: true,
    },
    {
      key: "volume-king-trainee",
      label: "卷王预备役",
      description: "你的提交量已经有点不礼貌了。",
      condition: "总提交数超过全站 80% 用户。",
      icon: "卷",
      unlocked: totalSubmitPercentile >= 80,
      progress:
        totalSubmitPercentile > 0
          ? Math.min(100, Math.round(totalSubmitPercentile))
          : clampProgress(totalSubmit, 1000),
      tone: "gold",
      rarity: "server",
    },
    {
      key: "reckless-submitter",
      label: "莽夫型选手",
      description: "别问，问就是先交。",
      condition: "提交数超过全站 80% 用户，但 AC 率低于全站中位数。",
      icon: "莽",
      unlocked: totalSubmitPercentile >= 80 && acceptRatePercent < medianAcceptRate,
      progress:
        totalSubmitPercentile > 0
          ? Math.min(100, Math.round(totalSubmitPercentile))
          : clampProgress(totalSubmit, 1000),
      tone: "red",
      rarity: "server",
    },
    {
      key: "quiet-master",
      label: "低调高手",
      description: "刷得不算最多，但过得很准。",
      condition: "AC 率进入全站前 10%，且提交数低于全站中位数。",
      icon: `${acceptRatePercent}%`,
      unlocked: acceptRatePercentile >= 90 && totalSubmit < medianSubmit,
      progress:
        acceptRatePercentile > 0
          ? Math.min(100, Math.round(acceptRatePercentile))
          : Math.min(acceptRatePercent, 100),
      tone: "cyan",
      rarity: "server",
    },
    {
      key: "one-of-a-kind",
      label: "孤品",
      description: "这个行为，全站只有你干过。",
      condition: "存在一个全站唯一的 AC 时间签名。",
      icon: "1",
      unlocked: Boolean(teamContext?.uniqueAcMinute),
      progress: teamContext?.uniqueAcMinute ? 100 : 0,
      tone: "gold",
      rarity: "server",
      hidden: true,
    },
    {
      key: "site-redest-day",
      label: "全站第一红",
      description: "这一天，你错得最响亮。",
      condition: "单日 WA 数达到全站第一。",
      icon: "红",
      unlocked: Boolean(teamContext?.siteDailyWaLeader),
      progress: teamContext?.siteDailyWaLeader ? 100 : clampProgress(maxDailyWa, 20),
      tone: "red",
      rarity: "server",
    },
    {
      key: "today-volume-king",
      label: "今日卷王",
      description: "今天的服务器，你用得最多。",
      condition: "今日提交数全站第一。",
      icon: "榜",
      unlocked: Boolean(teamContext?.todaySubmitLeader),
      progress: teamContext?.todaySubmitLeader ? 100 : clampProgress(maxDailySubmit, 50),
      tone: "gold",
      rarity: "server",
    },
    {
      key: "today-lucky-ac",
      label: "今日欧皇",
      description: "今天你 AC 率离谱。",
      condition: "今日提交数不少于 10，且今日 AC 率进入全站前 1%。",
      icon: "欧",
      unlocked: todaySubmit >= 10 && todayAcRatePercentile >= 99,
      progress:
        todayAcRatePercentile > 0
          ? Math.min(100, Math.round(todayAcRatePercentile))
          : Math.min(acceptRatePercent, 100),
      tone: "gold",
      rarity: "server",
    },
    {
      key: "off-peak-master",
      label: "错峰高手",
      description: "别人刷题的时候你不刷，你刷的时候别人睡了。",
      condition: "提交时间分布与全站平均差异进入前 5%。",
      icon: "峰",
      unlocked: offPeakPercentile >= 95,
      progress:
        offPeakPercentile > 0
          ? Math.min(100, Math.round(offPeakPercentile))
          : clampProgress(midnightSubmitCount, 100),
      tone: "blue",
      rarity: "server",
    },
    {
      key: "solo-carry-double-pit",
      label: "一人牵俩狗",
      description: "这不是组队训练，这是一个人在前面拉绳。",
      condition: "在团队中，个人 AC 贡献占团队总 AC 不少于 70%。",
      icon: "70%",
      unlocked: Boolean(currentTeamMember) && teamCarryRatio >= 0.7,
      progress: clampProgress(Math.round(teamCarryRatio * 100), 70),
      tone: "gold",
      rarity: "legendary",
      permanent: true,
    },
    {
      key: "little-jail-bro",
      label: "小牢弟",
      description: "团队的错误答案，主要由你负责。",
      condition: "在团队中，个人 WA 数占团队总 WA 不少于 70%。",
      icon: "牢",
      unlocked: Boolean(currentTeamMember) && teamWaTotal >= 10 && teamWaRatio >= 0.7,
      progress: clampProgress(Math.round(teamWaRatio * 100), 70),
      tone: "red",
      rarity: "pain",
    },
    {
      key: "ququ-chan",
      label: "ququ 酱",
      description: "你可能不是队伍的输出核心，但你一定是队伍的精神支柱。",
      hiddenDescription: "有些人不负责过题，但负责让队伍还像个队伍。",
      condition:
        "一次团队统计周期内，团队总 AC 不少于 10，用户至少有 1 次提交，且个人 AC 贡献占团队总 AC 低于 10%。",
      icon: "趣",
      unlocked:
        Boolean(currentTeamMember) &&
        teamAcTotal >= 10 &&
        currentTeamSubmit >= 1 &&
        ququRatio < 0.1,
      progress:
        teamAcTotal >= 10 && currentTeamSubmit >= 1
          ? Math.max(0, Math.min(100, Math.round((0.1 - ququRatio) * 1000)))
          : 0,
      tone: "cyan",
      rarity: "fun",
      hidden: true,
    },
    {
      key: "amnesia",
      label: "健忘症",
      description: "密码可能会忘，但改密码的手感不会。",
      hiddenDescription: "有些记忆，终究留不住。",
      condition: "账号累计主动成功修改密码超过 10 次。",
      icon: "???",
      unlocked: passwordChangeCount > 10,
      progress: clampProgress(passwordChangeCount, 11),
      tone: "cyan",
      rarity: "fun",
      hidden: true,
    },
  ]

  return badges.sort(
    (a, b) =>
      Number(b.unlocked) - Number(a.unlocked) ||
      achievementDifficultyScore(a) - achievementDifficultyScore(b) ||
      a.label.localeCompare(b.label, "zh-CN"),
  )
}

export const buildWeeklyReport = (
  period: CoreStatisticPeriodData | null,
  recentLogs: CoreSubmitLogGetByIdData[],
  platformStats: CoreStatisticPlatformPeriodItem[] = [],
): WeeklyReport => {
  const now = nowSeconds()
  const currentStart = now - 7 * 86400
  const previousStart = now - 14 * 86400
  const currentLogs = logsBetween(recentLogs, currentStart, now + 1)
  const previousLogs = logsBetween(recentLogs, previousStart, currentStart)
  const currentAc = toNumber(period?.ac?.thisWeek) || uniqueAcCount(currentLogs)
  const previousAc = toNumber(period?.ac?.lastWeek) || uniqueAcCount(previousLogs)
  const currentSubmit = toNumber(period?.submit?.thisWeek) || currentLogs.length
  const activeDays = activeDayCount(currentLogs)
  const growth = currentAc - previousAc
  const totalAc = toNumber(period?.ac?.total)
  const currentAcceptedLogs = currentLogs.filter((log) => isAccepted(log.status))
  const currentWaLogs = currentLogs.filter((log) => isWrongAnswer(log.status))
  const acceptRate = currentSubmit > 0 ? currentAc / currentSubmit : 0
  const nightRatio =
    currentLogs.length > 0
      ? currentLogs.filter((log) => {
          const hour = new Date(toNumber(log.time) * 1000).getHours()
          return hour >= 23 || hour < 6
        }).length / currentLogs.length
      : 0

  const platformCounts = new Map<string, number>()
  currentLogs.forEach((log) => {
    const platform = String(log.platform || "").trim()
    if (platform) platformCounts.set(platform, (platformCounts.get(platform) || 0) + 1)
  })
  if (platformCounts.size === 0) {
    platformStats.forEach((item) => {
      const submit = toNumber(item.submit?.thisWeek)
      if (submit > 0) platformCounts.set(item.platform, submit)
    })
  }
  const activePlatforms = [...platformCounts.entries()].sort((a, b) => b[1] - a[1])
  const mainPlatform = activePlatforms[0]?.[0] || topPlatform(currentLogs)
  const mainPlatformLabel = mainPlatform === "暂无平台" ? "训练场" : platformLabel(mainPlatform)
  const clearlyRising =
    currentAc >= 5 && currentAc >= Math.max(previousAc + 5, Math.ceil(previousAc * 1.5))
  const lowAcceptRate = currentSubmit >= 20 && acceptRate > 0 && acceptRate < 0.35

  let title = "持续训练周"
  if (clearlyRising) title = "爆发上升周"
  else if (activeDays >= 5) title = "稳定发育周"
  else if (lowAcceptRate || (currentSubmit >= 30 && currentAc <= 3)) title = "红温调试周"
  else if (nightRatio >= 0.35) title = "夜行训练周"
  else if (activePlatforms.length >= 3) title = "跨平台开火周"
  else if (currentSubmit > 0 && currentAc <= 2) title = "低调蓄力周"

  const summary =
    currentSubmit === 0
      ? "本周训练记录还不够多，继续积累后会生成更完整的战报。"
      : `本周 AC ${currentAc} 题，提交 ${currentSubmit} 次，活跃 ${activeDays} 天，主要火力集中在 ${mainPlatformLabel}。`

  const scenes: WeeklyReportScene[] = []
  if (activePlatforms.length >= 3) {
    scenes.push({
      title: "跨平台开火",
      text: `本周在 ${formatPlatformList(activePlatforms.slice(0, 4).map(([platform]) => platform))} 等平台均有提交记录。`,
    })
  } else if (activePlatforms.length > 0) {
    scenes.push({
      title: "主战场锁定",
      text: `本周主要在 ${mainPlatformLabel} 训练，节奏比较集中。`,
    })
  }

  const waGroups = new Map<string, { problem: string; platform: string; count: number }>()
  currentWaLogs.forEach((log) => {
    const key = problemKey(log)
    const current = waGroups.get(key) || {
      problem:
        String(log.problem || log.contest || log.submitId || "未知题目").trim() || "未知题目",
      platform: String(log.platform || ""),
      count: 0,
    }
    current.count += 1
    waGroups.set(key, current)
  })
  const boss = [...waGroups.values()].sort((a, b) => b.count - a.count)[0]
  if (boss && boss.count >= 2) {
    scenes.push({
      title: "本周 Boss",
      text: `${boss.problem} 在 ${platformLabel(boss.platform)} 卡了 ${boss.count} 次，值得回看题意、边界和数据范围。`,
    })
  }

  const lastValidSubmit = [...currentLogs]
    .sort((a, b) => toNumber(b.time) - toNumber(a.time))
    .find((log) => String(log.status || "").trim())
  const lastAccepted = [...currentAcceptedLogs].sort(
    (a, b) => toNumber(b.time) - toNumber(a.time),
  )[0]
  if (lastValidSubmit && isAccepted(lastValidSubmit.status)) {
    scenes.push({
      title: "最后一发入魂",
      text: `本周最后一次有效提交在 ${platformLabel(String(lastValidSubmit.platform || ""))} 拿到 AC。`,
    })
  } else if (lastAccepted) {
    scenes.push({
      title: "本周 AC 定格",
      text: `最近一次 AC 来自 ${platformLabel(String(lastAccepted.platform || ""))} 的 ${String(lastAccepted.problem || "一道题")}。`,
    })
  }

  if (scenes.length < 3 && currentSubmit >= 45 && activeDays > 0) {
    scenes.push({
      title: "高密度训练",
      text: `本周平均活跃日提交约 ${Math.round(currentSubmit / Math.max(activeDays, 1))} 次，训练火力不低。`,
    })
  }
  if (scenes.length === 0) {
    scenes.push({
      title: "战报生成中",
      text: "本周训练记录还不够多，继续积累后会生成更完整的战报。",
    })
  }
  if (scenes.length < 2 && currentSubmit > 0) {
    scenes.push({
      title: "节奏留痕",
      text: "已经有训练记录留下来了，等提交样本更多，战报会更有故事感。",
    })
  }

  let tip = "当前训练节奏还在积累阶段，保持轻量接触就很好，手感会慢慢回来。"
  if (lowAcceptRate || (currentSubmit >= 25 && currentAc <= 3)) {
    tip = "提交量已经起来了，可以稍微减少试探性提交，先把思路、样例和反例整理清楚，通常会更赚。"
  } else if (currentWaLogs.length >= 8) {
    tip = "这周调试痕迹不少，遇到连续 WA 时，先停一轮检查题意、边界和数据范围，比继续硬交更稳。"
  } else if (activePlatforms.length >= 3) {
    tip = "跨平台状态在线，题感覆盖面不错。不同平台的错题风格可以顺手沉淀一下，后面会省很多时间。"
  } else if (currentAc >= 15 || clearlyRising) {
    tip = "这周手感不错，AC 增长很明显。维持现在的节奏，再给复盘留一点空间就很舒服。"
  } else if (currentSubmit > 0 && activeDays <= 2) {
    tip = "这周训练比较集中，保持轻量节奏也可以，不用硬爆肝；让手感持续在线更重要。"
  }

  return {
    title,
    summary,
    advice: tip,
    metrics: [
      { label: "本周 AC", value: `${currentAc}`, hint: `累计 ${totalAc} 题` },
      { label: "本周提交", value: `${currentSubmit}`, hint: "包含所有平台" },
      { label: "活跃天数", value: `${activeDays}`, hint: "近 7 天" },
      { label: "较上周", value: growth > 0 ? `+${growth}` : `${growth}`, hint: "AC 变化" },
    ],
    scenes: scenes.slice(0, 3),
    tip,
  }
}

export const buildTeamDashboard = (members: TeamDashboardMember[]): TeamDashboard => {
  const sorted = [...members].sort(
    (a, b) => b.weekAc - a.weekAc || b.monthAc - a.monthAc || b.acTotal - a.acTotal,
  )
  const weekAc = members.reduce((sum, item) => sum + toNumber(item.weekAc), 0)
  const weekSubmit = members.reduce((sum, item) => sum + toNumber(item.weekSubmit), 0)
  const monthAc = members.reduce((sum, item) => sum + toNumber(item.monthAc), 0)
  const activeMembers = members.filter(
    (item) => toNumber(item.weekSubmit) > 0 || toNumber(item.weekAc) > 0,
  ).length
  const leader = sorted[0] || null
  const summary =
    members.length === 0
      ? "暂无团队成员，创建团队后会生成训练看板。"
      : activeMembers === 0
        ? "本周团队还没有提交记录，可以从一次轻量训练开始。"
        : `本周 ${activeMembers}/${members.length} 名成员保持活跃，团队 AC ${weekAc} 题，${leader ? `${leader.name || leader.username} 暂列本周火力位。` : ""}`

  return {
    weekAc,
    weekSubmit,
    monthAc,
    activeMembers,
    leader,
    members: sorted,
    summary,
  }
}
