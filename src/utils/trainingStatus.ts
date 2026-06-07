import type { CoreStatisticPeriodData, CoreSubmitLogGetByIdData } from "@/utils/api";

export type TrainingStatusTone =
  | "steady"
  | "rising"
  | "warning"
  | "intense"
  | "night"
  | "explore"
  | "neutral";

export interface TrainingStatusBadge {
  label: string;
  description: string;
  tone: TrainingStatusTone;
}

export interface TrainingPortrait {
  primary: TrainingStatusBadge;
  badges: TrainingStatusBadge[];
  summary: string;
  advice: string;
  recent30Summary: string;
}

interface TrainingStatusInput {
  period?: CoreStatisticPeriodData | null;
  recentLogs?: CoreSubmitLogGetByIdData[];
  lastSubmit?: string | number | null;
  maxCount?: number;
}

const PLATFORM_ORDER = ["AtCoder", "NowCoder", "LuoGu", "CodeForces", "QOJ"];

const nowSeconds = () => Math.floor(Date.now() / 1000);

const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const isAccepted = (status: string): boolean => {
  const normalized = status.trim().toLowerCase();
  return (
    normalized === "ac" ||
    normalized.includes("accepted") ||
    normalized.includes("答案正确") ||
    normalized.includes("通过")
  );
};

const daysSince = (timestamp?: string | number | null): number | null => {
  const time = toNumber(timestamp);
  if (!time) return null;
  return Math.max(0, (nowSeconds() - time) / 86400);
};

const recentNightRatio = (logs: CoreSubmitLogGetByIdData[]): number | null => {
  if (logs.length < 8) return null;
  const nightCount = logs.filter((log) => {
    const hour = new Date(toNumber(log.time) * 1000).getHours();
    return hour >= 23 || hour < 6;
  }).length;
  return nightCount / logs.length;
};

const uniqueRecentPlatforms = (logs: CoreSubmitLogGetByIdData[]): number => {
  return new Set(logs.map((log) => log.platform).filter(Boolean)).size;
};

const problemKey = (log: CoreSubmitLogGetByIdData): string => {
  const problem = String(log.problem || "").trim();
  const submitId = String(log.submitId || log.id || "").trim();
  return `${log.platform}:${problem || submitId}`;
};

const recentAcceptedCount = (logs: CoreSubmitLogGetByIdData[]): number => {
  const acceptedProblems = new Set<string>();
  logs.forEach((log) => {
    if (isAccepted(log.status)) {
      acceptedProblems.add(problemKey(log));
    }
  });
  return acceptedProblems.size;
};

const daysAgoSeconds = (days: number): number => nowSeconds() - days * 86400;

const logsInRange = (logs: CoreSubmitLogGetByIdData[], days: number): CoreSubmitLogGetByIdData[] => {
  const start = daysAgoSeconds(days);
  return logs.filter((log) => toNumber(log.time) >= start);
};

const activeDays = (logs: CoreSubmitLogGetByIdData[]): number => {
  const days = new Set(
    logs
      .map((log) => {
        const time = toNumber(log.time);
        if (!time) return "";
        return new Date(time * 1000).toISOString().slice(0, 10);
      })
      .filter(Boolean),
  );
  return days.size;
};

const topPlatforms = (logs: CoreSubmitLogGetByIdData[]): string[] => {
  const counts = new Map<string, number>();
  logs.forEach((log) => counts.set(log.platform, (counts.get(log.platform) || 0) + 1));
  return PLATFORM_ORDER
    .filter((platform) => (counts.get(platform) || 0) > 0)
    .slice(0, 2)
};

const pushUnique = (list: TrainingStatusBadge[], badge: TrainingStatusBadge) => {
  if (!list.some((item) => item.label === badge.label)) {
    list.push(badge);
  }
};

export const buildTrainingStatuses = ({
  period,
  recentLogs = [],
  lastSubmit,
  maxCount = 3,
}: TrainingStatusInput): TrainingStatusBadge[] => {
  const badges: TrainingStatusBadge[] = [];
  const thisWeekAc = toNumber(period?.ac?.thisWeek);
  const lastWeekAc = toNumber(period?.ac?.lastWeek);
  const thisMonthAc = toNumber(period?.ac?.thisMonth);
  const lastMonthAc = toNumber(period?.ac?.lastMonth);
  const thisWeekSubmit = toNumber(period?.submit?.thisWeek);
  const thisMonthSubmit = toNumber(period?.submit?.thisMonth);
  const totalAc = toNumber(period?.ac?.total);
  const totalSubmit = toNumber(period?.submit?.total);
  const weeklyAcceptRate = thisWeekSubmit > 0 ? thisWeekAc / thisWeekSubmit : null;
  const totalAcceptRate = totalSubmit > 0 ? totalAc / totalSubmit : null;
  const inactiveDays = daysSince(lastSubmit ?? recentLogs[0]?.time);
  const nightRatio = recentNightRatio(recentLogs);
  const platformCount = uniqueRecentPlatforms(recentLogs);
  const recentAc = recentAcceptedCount(recentLogs);

  if (totalSubmit === 0 || (inactiveDays !== null && inactiveDays >= 10)) {
    pushUnique(badges, {
      label: "疑似掉队",
      description: inactiveDays === null ? "暂无提交记录" : `已约 ${Math.floor(inactiveDays)} 天没有提交`,
      tone: "warning",
    });
  }

  if (
    (thisWeekAc >= 8 && thisWeekAc >= Math.max(lastWeekAc * 1.8, lastWeekAc + 5)) ||
    (thisMonthAc >= 20 && thisMonthAc >= Math.max(lastMonthAc * 1.5, lastMonthAc + 10))
  ) {
    pushUnique(badges, {
      label: "爆发上升中",
      description: "近期 AC 增长明显，训练势头很强",
      tone: "rising",
    });
  }

  if (thisWeekSubmit >= 40 || thisMonthSubmit >= 120 || recentAc >= 20) {
    pushUnique(badges, {
      label: "疯狂补题",
      description: "近期提交密度很高，正在集中补训练量",
      tone: "intense",
    });
  }

  if (
    (thisWeekSubmit >= 20 && weeklyAcceptRate !== null && weeklyAcceptRate < 0.35) ||
    (totalSubmit >= 80 && totalAcceptRate !== null && totalAcceptRate < 0.35)
  ) {
    pushUnique(badges, {
      label: "WA 战神",
      description: "提交很多但 AC 占比较低，建议关注调试质量",
      tone: "warning",
    });
  }

  if (nightRatio !== null && nightRatio >= 0.35) {
    pushUnique(badges, {
      label: "夜间训练型",
      description: `近提交中深夜比例约 ${Math.round(nightRatio * 100)}%`,
      tone: "night",
    });
  }

  if (platformCount >= 3) {
    pushUnique(badges, {
      label: "多平台开荒",
      description: "近期覆盖多个 OJ 平台，训练面较广",
      tone: "explore",
    });
  }

  if (!badges.some((item) => item.label === "疑似掉队") && thisWeekSubmit >= 8 && thisMonthAc >= 10) {
    pushUnique(badges, {
      label: "稳定训练中",
      description: "最近保持活跃，有持续提交和 AC",
      tone: "steady",
    });
  }

  if (badges.length === 0) {
    pushUnique(badges, {
      label: "观察期",
      description: "训练数据还不够明显，继续积累后会自动更新状态",
      tone: "neutral",
    });
  }

  return badges.slice(0, maxCount);
};

export const buildTrainingPortrait = ({
  period,
  recentLogs = [],
  lastSubmit,
  maxCount = 4,
}: TrainingStatusInput): TrainingPortrait => {
  const badges = buildTrainingStatuses({ period, recentLogs, lastSubmit, maxCount });
  const fallback: TrainingStatusBadge = {
    label: "观察期",
    description: "训练数据还不够明显，继续积累后会自动更新状态",
    tone: "neutral",
  };
  const primary = badges[0] || fallback;
  const thisMonthAc = toNumber(period?.ac?.thisMonth);
  const lastMonthAc = toNumber(period?.ac?.lastMonth);
  const thisMonthSubmit = toNumber(period?.submit?.thisMonth);
  const totalAc = toNumber(period?.ac?.total);
  const totalSubmit = toNumber(period?.submit?.total);
  const acceptRate = totalSubmit > 0 ? totalAc / totalSubmit : null;
  const inactiveDays = daysSince(lastSubmit ?? recentLogs[0]?.time);
  const logs30 = logsInRange(recentLogs, 30);
  const logs60 = logsInRange(recentLogs, 60);
  const previous30 = logs60.filter((log) => toNumber(log.time) < daysAgoSeconds(30));
  const ac30 = recentAcceptedCount(logs30);
  const previousAc30 = recentAcceptedCount(previous30);
  const active30 = activeDays(logs30);
  const platforms30 = topPlatforms(logs30);
  const submit30 = logs30.length;

  let summary = primary.description;
  if (primary.label === "爆发上升中") {
    summary = "近期增长速度突出，训练势头正在抬升。";
  } else if (primary.label === "稳定训练中") {
    summary = "近期保持稳定活跃，训练节奏比较健康。";
  } else if (primary.label === "夜间训练型") {
    summary = "提交时间偏晚，属于夜间训练特征明显的选手。";
  } else if (primary.label === "WA 战神") {
    summary = "提交量不低，但通过率偏低，需要把调试质量拉上来。";
  }

  let advice = "继续积累有效提交，保持稳定复盘节奏。";
  if (inactiveDays !== null && inactiveDays >= 7) {
    advice = "建议先恢复低强度连续训练，别一上来就猛冲难题。";
  } else if (acceptRate !== null && acceptRate < 0.35 && thisMonthSubmit >= 20) {
    advice = "建议赛后复盘 WA 原因，优先减少同题重复提交成本。";
  } else if (thisMonthAc >= 20 && thisMonthAc > lastMonthAc) {
    advice = "当前状态不错，可以适当提高题目难度或补薄弱平台。";
  } else if (submit30 >= 30 && ac30 < 8) {
    advice = "近期提交不少但 AC 偏少，建议放慢节奏做题解复盘。";
  }

  let trendText = "与上一个 30 天基本持平";
  const diff = ac30 - previousAc30;
  if (diff > 0) trendText = `比上一个 30 天增加 ${diff} 题`;
  if (diff < 0) trendText = `比上一个 30 天减少 ${Math.abs(diff)} 题`;
  const platformText = platforms30.length > 0 ? `，主要活跃于 ${platforms30.join(" 和 ")}` : "";
  const recent30Summary =
    submit30 === 0
      ? "近 30 天暂时没有提交记录，继续训练后会自动生成总结。"
      : `近 30 天 AC ${ac30} 题、提交 ${submit30} 次、活跃 ${active30} 天，${trendText}${platformText}。`;

  return {
    primary,
    badges,
    summary,
    advice,
    recent30Summary,
  };
};
