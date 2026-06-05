import type {
  CoreStatisticPeriodData,
  CoreStatisticPlatformPeriodItem,
  CoreSubmitLogGetByIdData,
} from "@/utils/api";

export interface AchievementBadge {
  key: string;
  label: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  tone: "cyan" | "blue" | "gold" | "red" | "muted";
  hidden?: boolean;
}

export interface WeeklyReportMetric {
  label: string;
  value: string;
  hint: string;
}

export interface WeeklyReport {
  title: string;
  summary: string;
  advice: string;
  metrics: WeeklyReportMetric[];
}

export interface TeamDashboardMember {
  userId: number;
  name: string;
  username: string;
  avatar: string;
  acTotal: number;
  submitTotal: number;
  weekAc: number;
  weekSubmit: number;
  monthAc: number;
  monthSubmit: number;
}

export interface TeamDashboard {
  weekAc: number;
  weekSubmit: number;
  monthAc: number;
  activeMembers: number;
  leader: TeamDashboardMember | null;
  members: TeamDashboardMember[];
  summary: string;
}

const toNumber = (value: unknown): number => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const nowSeconds = () => Math.floor(Date.now() / 1000);

const isAccepted = (status: string): boolean => {
  const normalized = status.trim().toLowerCase();
  return (
    normalized === "ac" ||
    normalized.includes("accepted") ||
    normalized.includes("答案正确") ||
    normalized.includes("通过")
  );
};

const isCompileError = (status: string): boolean => {
  const normalized = status.trim().toLowerCase();
  return (
    normalized === "ce" ||
    normalized.includes("compile") ||
    normalized.includes("compilation") ||
    normalized.includes("编译")
  );
};

const isWrongAnswer = (status: string): boolean => {
  const normalized = status.trim().toLowerCase();
  return (
    normalized === "wa" ||
    normalized.includes("wrong answer") ||
    normalized.includes("答案错误")
  );
};

const problemKey = (log: CoreSubmitLogGetByIdData): string => {
  const platform = String(log.platform || "Unknown").trim();
  const problem = String(log.problem || "").trim();
  const submitId = String(log.submitId || log.id || "").trim();
  return `${platform}:${problem || submitId}`;
};

const logsInDays = (logs: CoreSubmitLogGetByIdData[], days: number) => {
  const start = nowSeconds() - days * 86400;
  return logs.filter((log) => toNumber(log.time) >= start);
};

const logsBetween = (logs: CoreSubmitLogGetByIdData[], start: number, end: number) => {
  return logs.filter((log) => {
    const time = toNumber(log.time);
    return time >= start && time < end;
  });
};

const uniqueAcCount = (logs: CoreSubmitLogGetByIdData[]): number => {
  const accepted = new Set<string>();
  logs.forEach((log) => {
    if (isAccepted(log.status)) {
      accepted.add(problemKey(log));
    }
  });
  return accepted.size;
};

const activeDayCount = (logs: CoreSubmitLogGetByIdData[]): number => {
  return new Set(
    logs.map((log) => new Date(toNumber(log.time) * 1000).toISOString().slice(0, 10)),
  ).size;
};

const topPlatform = (logs: CoreSubmitLogGetByIdData[]): string => {
  const counts = new Map<string, number>();
  logs.forEach((log) => {
    const platform = String(log.platform || "未知平台");
    counts.set(platform, (counts.get(platform) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "暂无平台";
};

const clampProgress = (value: number, target: number) => {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / target) * 100)));
};

const groupLogsByProblem = (logs: CoreSubmitLogGetByIdData[]) => {
  const groups = new Map<string, CoreSubmitLogGetByIdData[]>();
  logs.forEach((log) => {
    const key = problemKey(log);
    if (!key) return;
    const list = groups.get(key) || [];
    list.push(log);
    groups.set(key, list);
  });
  groups.forEach((list) => list.sort((a, b) => toNumber(a.time) - toNumber(b.time)));
  return groups;
};

const hasWaThenAc = (groups: Map<string, CoreSubmitLogGetByIdData[]>, minWa: number) => {
  for (const logs of groups.values()) {
    const firstAcIndex = logs.findIndex((log) => isAccepted(log.status));
    if (firstAcIndex <= 0) continue;
    const waBeforeAc = logs.slice(0, firstAcIndex).filter((log) => isWrongAnswer(log.status)).length;
    if (waBeforeAc >= minWa) return true;
  }
  return false;
};

const hasManySubmitsInWindow = (groups: Map<string, CoreSubmitLogGetByIdData[]>, limit: number, seconds: number) => {
  for (const logs of groups.values()) {
    for (let left = 0, right = 0; right < logs.length; right += 1) {
      const rightLog = logs[right];
      if (!rightLog) continue;
      const rightTime = toNumber(rightLog.time);
      let leftLog = logs[left];
      while (leftLog && rightTime - toNumber(leftLog.time) > seconds) {
        left += 1;
        leftLog = logs[left];
      }
      if (right - left + 1 >= limit) return true;
    }
  }
  return false;
};

const hasLongFightAc = (groups: Map<string, CoreSubmitLogGetByIdData[]>, seconds: number) => {
  for (const logs of groups.values()) {
    const first = logs[0];
    const firstAc = logs.find((log) => isAccepted(log.status));
    if (first && firstAc && toNumber(firstAc.time) - toNumber(first.time) >= seconds) return true;
  }
  return false;
};

const hasFirstTryAc = (groups: Map<string, CoreSubmitLogGetByIdData[]>) => {
  for (const logs of groups.values()) {
    const first = logs[0];
    if (first && isAccepted(first.status)) return true;
  }
  return false;
};

const hasAcInHourRange = (logs: CoreSubmitLogGetByIdData[], startHour: number, endHour: number, endMinute = 60) => {
  return logs.some((log) => {
    if (!isAccepted(log.status)) return false;
    const date = new Date(toNumber(log.time) * 1000);
    const hour = date.getHours();
    const minute = date.getMinutes();
    if (startHour === endHour) return hour === startHour && minute < endMinute;
    return hour >= startHour && hour < endHour;
  });
};

const maxAcInOneHour = (logs: CoreSubmitLogGetByIdData[]) => {
  const acTimes = logs
    .filter((log) => isAccepted(log.status))
    .map((log) => toNumber(log.time))
    .sort((a, b) => a - b);
  let best = 0;
  for (let left = 0, right = 0; right < acTimes.length; right += 1) {
    const rightTime = acTimes[right];
    if (rightTime === undefined) continue;
    let leftTime = acTimes[left];
    while (leftTime !== undefined && rightTime - leftTime > 3600) {
      left += 1;
      leftTime = acTimes[left];
    }
    best = Math.max(best, right - left + 1);
  }
  return best;
};

const maxWaInOneHour = (logs: CoreSubmitLogGetByIdData[]) => {
  const waTimes = logs
    .filter((log) => isWrongAnswer(log.status))
    .map((log) => toNumber(log.time))
    .sort((a, b) => a - b);
  let best = 0;
  for (let left = 0, right = 0; right < waTimes.length; right += 1) {
    const rightTime = waTimes[right];
    if (rightTime === undefined) continue;
    let leftTime = waTimes[left];
    while (leftTime !== undefined && rightTime - leftTime > 3600) {
      left += 1;
      leftTime = waTimes[left];
    }
    best = Math.max(best, right - left + 1);
  }
  return best;
};

const hasRetirementFailed = (logs: CoreSubmitLogGetByIdData[]) => {
  const sortedAc = logs
    .filter((log) => isAccepted(log.status))
    .sort((a, b) => toNumber(a.time) - toNumber(b.time));
  for (let index = 1; index < sortedAc.length; index += 1) {
    const current = sortedAc[index];
    const previous = sortedAc[index - 1];
    if (current && previous && toNumber(current.time) - toNumber(previous.time) >= 30 * 86400) {
      return true;
    }
  }
  return false;
};

export const buildAchievementBadges = (
  period: CoreStatisticPeriodData | null,
  recentLogs: CoreSubmitLogGetByIdData[],
  platformStats: CoreStatisticPlatformPeriodItem[],
): AchievementBadge[] => {
  const totalAc = toNumber(period?.ac?.total);
  const platformCount = platformStats.filter((item) => toNumber(item.ac?.total) > 0).length;
  const problemGroups = groupLogsByProblem(recentLogs);
  const compileErrorCount = recentLogs.filter((log) => isCompileError(log.status)).length;
  const lastLog = [...recentLogs].sort((a, b) => toNumber(b.time) - toNumber(a.time))[0];
  const lastSubmitAc = Boolean(lastLog && isAccepted(lastLog.status));
  const acInOneHour = maxAcInOneHour(recentLogs);
  const waInOneHour = maxWaInOneHour(recentLogs);

  const badges: AchievementBadge[] = [
    {
      key: "first-ac",
      label: "Hello AC",
      description: "你提交了一发，世界开始运转。",
      icon: "✓",
      unlocked: totalAc >= 1,
      progress: clampProgress(totalAc, 1),
      tone: "cyan",
    },
    {
      key: "ten-ac",
      label: "AC 小登",
      description: "初入江湖，代码还有点青涩。",
      icon: "10",
      unlocked: totalAc >= 10,
      progress: clampProgress(totalAc, 10),
      tone: "blue",
    },
    {
      key: "hundred-ac",
      label: "百题斩",
      description: "你已经不是来玩的了。",
      icon: "100",
      unlocked: totalAc >= 100,
      progress: clampProgress(totalAc, 100),
      tone: "gold",
    },
    {
      key: "thousand-ac",
      label: "千题修罗",
      description: "题单见你都绕路走。",
      icon: "1K",
      unlocked: totalAc >= 1000,
      progress: clampProgress(totalAc, 1000),
      tone: "gold",
    },
    {
      key: "oj-wanderer",
      label: "OJ 流浪汉",
      description: "哪里有题，哪里就是家。",
      icon: "OJ",
      unlocked: platformCount >= 3,
      progress: clampProgress(platformCount, 3),
      tone: "blue",
    },
    {
      key: "cross-server",
      label: "跨服作战",
      description: "你已经开始打跨平台排位了。",
      icon: "5OJ",
      unlocked: platformCount >= 5,
      progress: clampProgress(platformCount, 5),
      tone: "cyan",
    },
    {
      key: "wa-until-dawn",
      label: "WA 到天亮",
      description: "你不是不会，你只是太倔了。",
      icon: "WA",
      unlocked: hasWaThenAc(problemGroups, 10),
      progress: hasWaThenAc(problemGroups, 10) ? 100 : 0,
      tone: "red",
    },
    {
      key: "penalty-sitter",
      label: "罚坐选手",
      description: "这题陪你过夜了。",
      icon: "24H",
      unlocked: hasLongFightAc(problemGroups, 24 * 3600),
      progress: hasLongFightAc(problemGroups, 24 * 3600) ? 100 : 0,
      tone: "red",
    },
    {
      key: "red-temperature",
      label: "红温战士",
      description: "冷静？不存在的。",
      icon: "热",
      unlocked: hasManySubmitsInWindow(problemGroups, 8, 30 * 60),
      progress: hasManySubmitsInWindow(problemGroups, 8, 30 * 60) ? 100 : 0,
      tone: "red",
    },
    {
      key: "compiler-victim",
      label: "编译器受害者",
      description: "代码没跑，人先麻了。",
      icon: "CE",
      unlocked: compileErrorCount >= 10,
      progress: clampProgress(compileErrorCount, 10),
      tone: "red",
    },
    {
      key: "last-submit-soul",
      label: "最后一发入魂",
      description: "关电脑前，世界原谅了你。",
      icon: "终",
      unlocked: lastSubmitAc,
      progress: lastSubmitAc ? 100 : 0,
      tone: "gold",
    },
    {
      key: "first-try-soul",
      label: "一发入魂",
      description: "没调试，不解释。",
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
      icon: "???",
      unlocked: hasAcInHourRange(recentLogs, 0, 0, 10),
      progress: hasAcInHourRange(recentLogs, 0, 0, 10) ? 100 : 0,
      tone: "blue",
      hidden: true,
    },
    {
      key: "luogu-at-four",
      label: "凌晨四点的洛谷",
      description: "这不是自律，这是故事。",
      icon: "???",
      unlocked: recentLogs.some((log) => String(log.platform).toLowerCase().includes("luogu") && new Date(toNumber(log.time) * 1000).getHours() === 4),
      progress: recentLogs.some((log) => String(log.platform).toLowerCase().includes("luogu") && new Date(toNumber(log.time) * 1000).getHours() === 4) ? 100 : 0,
      tone: "blue",
      hidden: true,
    },
    {
      key: "hands-on",
      label: "手感来了",
      description: "今天键盘很听话。",
      icon: "???",
      unlocked: acInOneHour >= 5,
      progress: clampProgress(acInOneHour, 5),
      tone: "cyan",
      hidden: true,
    },
    {
      key: "hands-off",
      label: "手感没了",
      description: "今天评测机不太给面子。",
      icon: "???",
      unlocked: waInOneHour >= 8,
      progress: clampProgress(waInOneHour, 8),
      tone: "red",
      hidden: true,
    },
    {
      key: "last-stand",
      label: "绝地翻盘",
      description: "你差点放弃，但没有。",
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
      icon: "???",
      unlocked: hasRetirementFailed(recentLogs),
      progress: hasRetirementFailed(recentLogs) ? 100 : 0,
      tone: "gold",
      hidden: true,
    },
  ];

  return badges.sort((a, b) => Number(b.unlocked) - Number(a.unlocked) || b.progress - a.progress);
};

export const buildWeeklyReport = (
  period: CoreStatisticPeriodData | null,
  recentLogs: CoreSubmitLogGetByIdData[],
): WeeklyReport => {
  const now = nowSeconds();
  const currentStart = now - 7 * 86400;
  const previousStart = now - 14 * 86400;
  const currentLogs = logsBetween(recentLogs, currentStart, now + 1);
  const previousLogs = logsBetween(recentLogs, previousStart, currentStart);
  const currentAc = uniqueAcCount(currentLogs);
  const previousAc = uniqueAcCount(previousLogs);
  const currentSubmit = currentLogs.length;
  const activeDays = activeDayCount(currentLogs);
  const growth = currentAc - previousAc;
  const platform = topPlatform(currentLogs);
  const totalAc = toNumber(period?.ac?.total);

  let title = "稳步训练周";
  if (currentAc >= 20 || growth >= 10) title = "爆发上升周";
  else if (activeDays >= 5) title = "稳定训练周";
  else if (currentSubmit >= 30 && currentAc <= 3) title = "调试复盘周";
  else if (currentSubmit === 0) title = "待启动周";

  const growthText = growth > 0 ? `比上周多 ${growth} 题` : growth < 0 ? `比上周少 ${Math.abs(growth)} 题` : "与上周持平";
  const summary = currentSubmit === 0
    ? "本周还没有提交记录，先用一道熟悉题把节奏找回来。"
    : `本周 AC ${currentAc} 题、提交 ${currentSubmit} 次、活跃 ${activeDays} 天，${growthText}，主要活跃于 ${platform}。`;

  let advice = "继续保持当前训练节奏，优先复盘最近 WA 较多的题目。";
  if (currentSubmit === 0) advice = "建议先做 1-2 道低压力题恢复手感。";
  else if (currentSubmit >= 30 && currentAc <= 3) advice = "近期提交不少但 AC 偏少，建议放慢节奏做题解复盘。";
  else if (growth >= 8) advice = "增长很明显，可以趁热增加一组稍高难度训练。";
  else if (activeDays <= 2) advice = "训练天数偏少，建议拆成更小的每日任务。";

  return {
    title,
    summary,
    advice,
    metrics: [
      { label: "本周 AC", value: `${currentAc}`, hint: `累计 ${totalAc} 题` },
      { label: "本周提交", value: `${currentSubmit}`, hint: "包含所有平台" },
      { label: "活跃天数", value: `${activeDays}`, hint: "近 7 天" },
      { label: "较上周", value: growth > 0 ? `+${growth}` : `${growth}`, hint: "AC 变化" },
    ],
  };
};

export const buildTeamDashboard = (members: TeamDashboardMember[]): TeamDashboard => {
  const sorted = [...members].sort((a, b) => b.weekAc - a.weekAc || b.monthAc - a.monthAc || b.acTotal - a.acTotal);
  const weekAc = members.reduce((sum, item) => sum + toNumber(item.weekAc), 0);
  const weekSubmit = members.reduce((sum, item) => sum + toNumber(item.weekSubmit), 0);
  const monthAc = members.reduce((sum, item) => sum + toNumber(item.monthAc), 0);
  const activeMembers = members.filter((item) => toNumber(item.weekSubmit) > 0 || toNumber(item.weekAc) > 0).length;
  const leader = sorted[0] || null;
  const summary = members.length === 0
    ? "暂无团队成员，创建团队后会生成训练看板。"
    : activeMembers === 0
      ? "本周团队还没有提交记录，可以从一次轻量训练开始。"
      : `本周 ${activeMembers}/${members.length} 名成员保持活跃，团队 AC ${weekAc} 题，${leader ? `${leader.name || leader.username} 暂列本周火力位。` : ""}`;

  return {
    weekAc,
    weekSubmit,
    monthAc,
    activeMembers,
    leader,
    members: sorted,
    summary,
  };
};
