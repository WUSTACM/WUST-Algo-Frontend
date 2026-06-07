<template>
  <div class="dashboardContent">
    <h2>数据统计</h2>
    <div class="stat-scope-note">
      <strong>{{ statisticExplanation.title || "统计口径说明" }}</strong>
      <span>{{ statisticExplanation.summary || "本站统计基于提交日志统一去重，可能与 OJ 主页展示口径不同。" }}</span>
      <button @click="showStatisticExplanation = !showStatisticExplanation">
        {{ showStatisticExplanation ? "收起" : "查看说明" }}
      </button>
    </div>
    <div v-if="showStatisticExplanation" class="stat-scope-details">
      <div v-for="item in statisticExplanation.bullets" :key="item">{{ item }}</div>
    </div>
    <div style="position: relative">
      <LoadingOverlay :show="loadingStats" />
      <div class="stats-grid">
        <div class="stat-card">
          <div class="card-header">
            <div class="card-title">
              <div class="title-main">用户数量</div>
            </div>
          </div>
          <div class="card-data">
            <div class="data-value">{{ userCount }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="card-header">
            <div class="card-title">
              <div class="title-main">团队数量</div>
            </div>
          </div>
          <div class="card-data">
            <div class="data-value">{{ groupCount }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="card-header">
            <div class="card-title">
              <div class="title-main">总AC</div>
            </div>
          </div>
          <div class="card-data">
            <div class="data-value">{{ periodData.ac.total }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="card-header">
            <div class="card-title">
              <div class="title-main">总提交</div>
            </div>
          </div>
          <div class="card-data">
            <div class="data-value">{{ periodData.submit.total }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="card-header">
            <div class="card-title">
              <div class="title-main">今年AC</div>
            </div>
          </div>
          <div class="card-data">
            <div class="data-value">{{ periodData.ac.thisYear }}</div>
          </div>
          <div class="card-footer">
            <div
              class="footer-trend"
              :class="
                getTrendClass(periodData.ac.thisYear, periodData.ac.lastYear)
              "
            >
              <span class="trend-icon">{{
                getTrend(periodData.ac.thisYear, periodData.ac.lastYear)
              }}</span>
              <span class="trend-value">{{
                getTrendValue(periodData.ac.thisYear, periodData.ac.lastYear)
              }}</span>
            </div>
            <div class="footer-info">对比去年</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="card-header">
            <div class="card-title">
              <div class="title-main">今年提交</div>
            </div>
          </div>
          <div class="card-data">
            <div class="data-value">{{ periodData.submit.thisYear }}</div>
          </div>
          <div class="card-footer">
            <div
              class="footer-trend"
              :class="
                getTrendClass(
                  periodData.submit.thisYear,
                  periodData.submit.lastYear,
                )
              "
            >
              <span class="trend-icon">{{
                getTrend(periodData.submit.thisYear, periodData.submit.lastYear)
              }}</span>
              <span class="trend-value">{{
                getTrendValue(
                  periodData.submit.thisYear,
                  periodData.submit.lastYear,
                )
              }}</span>
            </div>
            <div class="footer-info">对比去年</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="card-header">
            <div class="card-title">
              <div class="title-main">本月AC</div>
            </div>
          </div>
          <div class="card-data">
            <div class="data-value">{{ periodData.ac.thisMonth }}</div>
          </div>
          <div class="card-footer">
            <div
              class="footer-trend"
              :class="
                getTrendClass(periodData.ac.thisMonth, periodData.ac.lastMonth)
              "
            >
              <span class="trend-icon">{{
                getTrend(periodData.ac.thisMonth, periodData.ac.lastMonth)
              }}</span>
              <span class="trend-value">{{
                getTrendValue(periodData.ac.thisMonth, periodData.ac.lastMonth)
              }}</span>
            </div>
            <div class="footer-info">对比上月</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="card-header">
            <div class="card-title">
              <div class="title-main">本月提交</div>
            </div>
          </div>
          <div class="card-data">
            <div class="data-value">{{ periodData.submit.thisMonth }}</div>
          </div>
          <div class="card-footer">
            <div
              class="footer-trend"
              :class="
                getTrendClass(
                  periodData.submit.thisMonth,
                  periodData.submit.lastMonth,
                )
              "
            >
              <span class="trend-icon">{{
                getTrend(
                  periodData.submit.thisMonth,
                  periodData.submit.lastMonth,
                )
              }}</span>
              <span class="trend-value">{{
                getTrendValue(
                  periodData.submit.thisMonth,
                  periodData.submit.lastMonth,
                )
              }}</span>
            </div>
            <div class="footer-info">对比上月</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="card-header">
            <div class="card-title">
              <div class="title-main">本周AC</div>
            </div>
          </div>
          <div class="card-data">
            <div class="data-value">{{ periodData.ac.thisWeek }}</div>
          </div>
          <div class="card-footer">
            <div
              class="footer-trend"
              :class="
                getTrendClass(periodData.ac.thisWeek, periodData.ac.lastWeek)
              "
            >
              <span class="trend-icon">{{
                getTrend(periodData.ac.thisWeek, periodData.ac.lastWeek)
              }}</span>
              <span class="trend-value">{{
                getTrendValue(periodData.ac.thisWeek, periodData.ac.lastWeek)
              }}</span>
            </div>
            <div class="footer-info">对比上周</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="card-header">
            <div class="card-title">
              <div class="title-main">本周提交</div>
            </div>
          </div>
          <div class="card-data">
            <div class="data-value">{{ periodData.submit.thisWeek }}</div>
          </div>
          <div class="card-footer">
            <div
              class="footer-trend"
              :class="
                getTrendClass(
                  periodData.submit.thisWeek,
                  periodData.submit.lastWeek,
                )
              "
            >
              <span class="trend-icon">{{
                getTrend(periodData.submit.thisWeek, periodData.submit.lastWeek)
              }}</span>
              <span class="trend-value">{{
                getTrendValue(
                  periodData.submit.thisWeek,
                  periodData.submit.lastWeek,
                )
              }}</span>
            </div>
            <div class="footer-info">对比上周</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="card-header">
            <div class="card-title">
              <div class="title-main">今日AC</div>
            </div>
          </div>
          <div class="card-data">
            <div class="data-value">{{ periodData.ac.today }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="card-header">
            <div class="card-title">
              <div class="title-main">今日提交</div>
            </div>
          </div>
          <div class="card-data">
            <div class="data-value">{{ periodData.submit.today }}</div>
          </div>
        </div>
      </div>
    </div>
    <h2>提交趋势</h2>
    <div style="position: relative">
      <LoadingOverlay :show="loadingChart" />
      <div class="chart-container">
        <v-chart class="chart" :option="chartOption" autoresize />
      </div>
    </div>
    <template v-if="showRanking">
      <div class="ranking-heading">
        <h2>{{ rankingMode === "user" ? "用户排名" : "团队排名" }}</h2>
        <div class="ranking-switch" aria-label="切换排名类型">
          <button
            :class="{ active: rankingMode === 'user' }"
            @click="setRankingMode('user')"
          >
            用户排名
          </button>
          <button
            :class="{ active: rankingMode === 'team' }"
            @click="setRankingMode('team')"
          >
            团队排名
          </button>
        </div>
      </div>
      <div class="ranking-section" style="position: relative">
        <LoadingOverlay :show="loadingRanking" />
        <div class="ranking-table-wrapper">
          <table class="ranking-table">
            <thead>
              <tr>
                <th class="rank-col">排名</th>
                <th>{{ rankingMode === "user" ? "用户" : "团队" }}</th>
                <th>{{ rankingMode === "user" ? "刷题数" : "团队总题数" }}</th>
                <th>提交数</th>
                <th>最后提交</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in rankingPageRows"
                :key="`${rankingMode}-${item.id}`"
              >
                <td class="rank-col">
                  <span class="rank-badge" :class="getRankClass(item.rank)">{{
                    item.rank
                  }}</span>
                </td>
                <td>
                  <div
                    v-if="rankingMode === 'user'"
                    class="rank-user"
                    @click="router.push(`/profile?id=${item.id}`)"
                  >
                    <img
                      :src="item.avatar || '/images/defaultAvatar.png'"
                      alt=""
                    />
                    <div class="rank-user-info">
                      <span class="rank-name">{{ item.name }}</span>
                      <span class="rank-username">{{ item.subText }}</span>
                      <span
                        v-if="item.status"
                        class="rank-status"
                        :class="`tone-${item.status.tone}`"
                        :title="item.status.description"
                      >
                        {{ item.status.label }}
                      </span>
                    </div>
                  </div>
                  <div v-else class="rank-team">
                    <img
                      v-if="item.avatar"
                      class="team-avatar-img"
                      :src="item.avatar"
                      alt=""
                    />
                    <span v-else class="team-avatar">队</span>
                    <div class="rank-user-info">
                      <span class="rank-name">{{ item.name }}</span>
                      <span class="rank-username">{{ item.members }} 名成员</span>
                    </div>
                  </div>
                </td>
                <td class="count-cell">{{ item.acTotal }}</td>
                <td class="count-cell">{{ item.submitTotal }}</td>
                <td>{{ formatDate(item.lastSubmit) }}</td>
              </tr>
              <tr v-if="!loadingRanking && rankingPageRows.length === 0">
                <td colspan="5" class="empty-ranking">暂无排名数据</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pageNavigation" v-if="rankingTotalPage > 1">
          <div class="group">
            <div class="pageButtons" v-if="rankingPage !== 1">
              <button @click="setRankingPage(rankingPage - 1)">上一页</button>
            </div>
            <div class="pageButtons">
              <button
                v-for="value in rankingPages"
                :key="value"
                :class="value === rankingPage ? 'active' : ''"
                @click="value === rankingPage ? null : setRankingPage(value)"
              >
                {{ value }}
              </button>
            </div>
            <div class="pageButtons" v-if="rankingPage !== rankingTotalPage">
              <button @click="setRankingPage(rankingPage + 1)">下一页</button>
            </div>
          </div>
          <div class="group">
            <div class="pageInput">
              <button @click="setRankingPage(rankingJumpPage)">跳转</button>
              <input
                type="number"
                min="1"
                :max="rankingTotalPage"
                v-model="rankingJumpPage"
              />
            </div>
            <div class="pageSum">共 {{ rankingTotalPage }} 页</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import API, {
  type CoreStatisticPeriodData,
  type Datum as DailyData,
  type Group as UserGroupItem,
  type List as ProfileListItem,
} from "@/utils/api";
import Toast from "@/utils/toast";
import LoadingOverlay from "@/components/LoadingOverlay.vue";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import { buildTrainingStatuses, type TrainingStatusBadge } from "@/utils/trainingStatus";

// 导入 ECharts 相关
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { LineChart } from "echarts/charts";
import {
  TooltipComponent,
  ToolboxComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
} from "echarts/components";
import VChart from "vue-echarts";

const router = useRouter();
const userStore = useUserStore();
const showRanking = computed(() => userStore.isLogin);

// 注册 ECharts 模块
use([
  CanvasRenderer,
  LineChart,
  TooltipComponent,
  ToolboxComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
]);

export interface Response {
  list: List[];
  [property: string]: any;
}

export interface List {
  avatar: string;
  groupId: string;
  lastSubmit: string;
  name: string;
  roleId?: number | string;
  userId: string;
  username: string;
  [property: string]: any;
}

const loadingStats = ref(true);
const loadingChart = ref(true);
const loadingRanking = ref(true);
const userCount = ref(0);
const showStatisticExplanation = ref(false);
const statisticExplanation = ref({
  title: "统计口径说明",
  summary: "本站统计基于提交日志统一去重，可能与 OJ 主页展示口径不同。",
  bullets: [] as string[],
});

const getStatisticExplanation = async () => {
  const response = await API.core.statistic.explanation();
  Toast.stdResponse(response, false);
  if (response.success) {
    statisticExplanation.value = {
      title: response.data.title,
      summary: response.data.summary,
      bullets: response.data.bullets,
    };
  }
};

const getUserCount = async () => {
  const response = await API.user.profile.list(1);
  Toast.stdResponse(response, false);

  if (response.success) {
    userCount.value = response.data.total;
  }
};

const periodData = ref<CoreStatisticPeriodData>({
  ac: {
    lastMonth: 0,
    lastWeek: 0,
    lastYear: 0,
    thisMonth: 0,
    thisWeek: 0,
    thisYear: 0,
    today: 0,
    total: 0,
  },
  submit: {
    lastMonth: 0,
    lastWeek: 0,
    lastYear: 0,
    thisMonth: 0,
    thisWeek: 0,
    thisYear: 0,
    today: 0,
    total: 0,
  },
});

const getPeriodData = async () => {
  const response = await API.core.statistic.period(-1);
  Toast.stdResponse(response, false);

  periodData.value = response.data.data;
};

const getTrendClass = (curr: number, prev: number): string => {
  curr = Number(curr);
  prev = Number(prev);
  if (curr === prev) {
    return "equal";
  } else if (curr > prev) {
    return "up";
  } else {
    return "down";
  }
};

const getTrendValue = (curr: number, prev: number): string => {
  curr = Number(curr);
  prev = Number(prev);
  return (curr - prev >= 0 ? "+" : "") + (curr - prev);
};

const getTrend = (curr: number, prev: number): string => {
  curr = Number(curr);
  prev = Number(prev);
  if (curr === prev) {
    return "-";
  } else if (curr > prev) {
    return "↗";
  } else {
    return "↘";
  }
};

const groupCount = ref(0);

const getGroupCount = async () => {
  const response = await API.user.group.list(1);

  if (response.success) {
    Toast.stdResponse(response, false);
    groupCount.value = response.data.total;
  }
};

const acDataDaily = ref<DailyData[]>([]);
const submitDataDaily = ref<DailyData[]>([]);
const isCompactScreen = ref(false);

const syncScreenSize = () => {
  isCompactScreen.value = window.innerWidth <= 640;
};

const padZero = (num: number): string => {
  return num < 10 ? "0" + num : num.toString();
};

const getDailyData = async () => {
  const dateObj = new Date();
  const date =
    dateObj.getFullYear() +
    padZero(dateObj.getMonth() + 1) +
    padZero(dateObj.getDate());
  const responseAc = await API.core.statistic.heatmap({
    startDate: "20230101",
    endDate: date,
    isAc: true,
  });
  const responseSubmit = await API.core.statistic.heatmap({
    startDate: "20230101",
    endDate: date,
    isAc: false,
  });
  Toast.stdResponse(responseAc, false);
  Toast.stdResponse(responseAc, false);
  if (responseAc.success && responseSubmit.success) {
    acDataDaily.value = responseAc.data.data;
    submitDataDaily.value = responseSubmit.data.data;
  }
};

const calculateDefaultRange = (dates: string[]) => {
  if (dates.length <= 30) {
    return {
      startIndex: 0,
      endIndex: dates.length - 1,
    };
  } else {
    const endIndex = dates.length - 1;
    const startIndex = Math.max(0, endIndex - 29);
    return {
      startIndex,
      endIndex,
    };
  }
};

const chartOption = computed(() => {
  const sortedAcData = [...acDataDaily.value].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const sortedSubmitData = [...submitDataDaily.value].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const dates = sortedAcData.map((item) => item.date);
  const acValues = sortedAcData.map((item) => item.count);
  const submitValues = sortedSubmitData.map((item) => item.count);

  const { startIndex, endIndex } = calculateDefaultRange(dates);

  const startPercent = (startIndex / dates.length) * 100;
  const endPercent = (endIndex / dates.length) * 100;

  return {
    darkmode: "auto",
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
        label: {
          backgroundColor: "#6a7985",
        },
      },
    },
    legend: {
      data: ["AC", "提交"],
      top: isCompactScreen.value ? 4 : 0,
      left: isCompactScreen.value ? "center" : "left",
    },
    grid: {
      top: isCompactScreen.value ? 42 : 48,
      left: isCompactScreen.value ? 8 : "3%",
      right: isCompactScreen.value ? 8 : "4%",
      bottom: isCompactScreen.value ? 52 : 74,
      containLabel: true,
    },
    toolbox: {
      show: !isCompactScreen.value,
      feature: {
        saveAsImage: {},
      },
    },
    xAxis: [
      {
        type: "category",
        boundaryGap: false,
        data: dates,
        axisLabel: {
          hideOverlap: true,
          interval: isCompactScreen.value ? "auto" : 0,
          formatter: function (value: string) {
            const date = new Date(value);
            return date.getMonth() + 1 + "-" + date.getDate();
          },
        },
        splitLine: {
          show: false,
        },
      },
    ],
    yAxis: [
      {
        type: "value",
        splitLine: {
          show: false,
        },
      },
    ],
    dataZoom: [
      {
        type: "inside",
        start: startPercent,
        end: endPercent,
      },
      {
        show: !isCompactScreen.value,
        start: startPercent,
        end: endPercent,
        handleSize: "110%",
      },
    ],
    series: [
      {
        name: "AC",
        type: "line",
        emphasis: {
          focus: "series",
        },
        data: acValues,
        smooth: true,
        showSymbol: false,
      },
      {
        name: "提交",
        type: "line",
        emphasis: {
          focus: "series",
        },
        data: submitValues,
        smooth: true,
        showSymbol: false,
      },
    ],
  };
});

type RankingMode = "user" | "team";

interface RankingRow {
  rank: number;
  id: number;
  avatar: string;
  name: string;
  subText: string;
  acTotal: number;
  submitTotal: number;
  lastSubmit: string;
  members: number;
  status?: TrainingStatusBadge;
  scoreMembers?: number;
  groupId?: number;
}

const rankingMode = ref<RankingMode>("user");
const userRankingRows = ref<RankingRow[]>([]);
const teamRankingRows = ref<RankingRow[]>([]);
const rankingPage = ref(1);
const rankingJumpPage = ref(1);
const rankingPageSize = 10;

const activeRankingRows = computed(() =>
  rankingMode.value === "user" ? userRankingRows.value : teamRankingRows.value,
);

const rankingTotalPage = computed(() =>
  Math.ceil(activeRankingRows.value.length / rankingPageSize),
);

const rankingPageRows = computed(() => {
  const start = (rankingPage.value - 1) * rankingPageSize;
  return activeRankingRows.value.slice(start, start + rankingPageSize);
});

const rankingPages = computed(() => {
  const currentPage = rankingPage.value;
  const totalPage = rankingTotalPage.value;
  if (totalPage <= 3) return Array.from({ length: totalPage }, (_, i) => i + 1);
  if (currentPage <= 1) return [1, 2, 3];
  if (currentPage >= totalPage - 1)
    return [totalPage - 2, totalPage - 1, totalPage];
  return [currentPage - 1, currentPage, currentPage + 1];
});

const setRankingPage = (page: number) => {
  const safePage = Math.min(
    Math.max(Number(page) || 1, 1),
    Math.max(rankingTotalPage.value, 1),
  );
  rankingPage.value = safePage;
  rankingJumpPage.value = safePage;
};

const setRankingMode = (mode: RankingMode) => {
  if (rankingMode.value === mode) return;
  rankingMode.value = mode;
  setRankingPage(1);
};

const getRankClass = (rank: number): string => {
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  return "";
};

const formatDate = (timestamp: string): string => {
  const time = Number(timestamp);
  if (!time) return "暂无提交";
  return new Date(time * 1000).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const chunkedMap = async <T, R>(
  items: T[],
  size: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> => {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    const chunk = items.slice(i, i + size);
    results.push(...(await Promise.all(chunk.map(mapper))));
  }
  return results;
};

const getAllUsers = async (): Promise<ProfileListItem[]> => {
  const firstResponse = await API.user.profile.list(1);
  Toast.stdResponse(firstResponse, false);
  if (!firstResponse.success) return [];

  const totalPage = Math.ceil(firstResponse.data.total / 10);
  const users = [...firstResponse.data.list];
  if (totalPage <= 1) return users;

  const pageResponses = await chunkedMap(
    Array.from({ length: totalPage - 1 }, (_, index) => index + 2),
    4,
    (page) => API.user.profile.list(page),
  );

  pageResponses.forEach((response) => {
    if (response.success) {
      users.push(...response.data.list);
    }
  });

  return users;
};

const getAllGroups = async (): Promise<UserGroupItem[]> => {
  const firstResponse = await API.user.group.list(1);
  if (!firstResponse.success) return [];

  const totalPage = Math.ceil(firstResponse.data.total / 5);
  const groups = [...firstResponse.data.list];
  if (totalPage <= 1) return groups;

  const pageResponses = await chunkedMap(
    Array.from({ length: totalPage - 1 }, (_, index) => index + 2),
    4,
    (page) => API.user.group.list(page),
  );

  pageResponses.forEach((response) => {
    if (response.success) {
      groups.push(...response.data.list);
    }
  });

  return groups;
};

const getTeamAvatarMap = async (
  groups: UserGroupItem[],
): Promise<Map<number, string>> => {
  const teamGroups = groups.filter((group) => Number(group.id) > 0);
  const details = await chunkedMap(teamGroups, 4, async (group) => {
    const groupId = Number(group.id);
    const response = await API.user.team.detail(groupId);
    return {
      groupId,
      avatar: response.success ? response.data.avatar : (group.avatar || ""),
    };
  });
  return new Map(details.map((item) => [item.groupId, item.avatar]));
};

const rankRows = (rows: RankingRow[]): RankingRow[] => {
  return rows
    .sort(
      (a, b) =>
        b.acTotal - a.acTotal ||
        b.submitTotal - a.submitTotal ||
        b.members - a.members ||
        a.id - b.id,
    )
    .map((item, index) => ({ ...item, rank: index + 1 }));
};

const getLatestSubmit = (a: string, b: string): string => {
  return Number(a) >= Number(b) ? a : b;
};

const isSystemAdminAccount = (user: ProfileListItem): boolean => {
  return user.username === "admin";
};

const getRankingData = async () => {
  loadingRanking.value = true;
  const [allUsers, groups] = await Promise.all([getAllUsers(), getAllGroups()]);
  const teamAvatars = await getTeamAvatarMap(groups);
  const users = allUsers.filter((user) => !isSystemAdminAccount(user));
  const rows = await chunkedMap(users, 6, async (user): Promise<RankingRow> => {
    const response = await API.core.statistic.period(user.userId);
    const period = response.success ? response.data.data : null;
    return {
      rank: 0,
      id: Number(user.userId),
      avatar: user.avatar,
      name: user.name || user.username,
      subText: `@${user.username}`,
      acTotal: period ? Number(period.ac.total) : 0,
      submitTotal: period ? Number(period.submit.total) : 0,
      lastSubmit: user.lastSubmit,
      members: 1,
      groupId: Number(user.groupId),
      status: buildTrainingStatuses({
        period,
        lastSubmit: user.lastSubmit,
        maxCount: 1,
      })[0],
    };
  });

  const teamRows = new Map<number, RankingRow>();
  groups
    .filter((group) => Number(group.id) !== 0)
    .forEach((group) => {
      const groupId = Number(group.id);
      teamRows.set(groupId, {
        rank: 0,
        id: groupId,
        avatar: teamAvatars.get(groupId) || group.avatar || "",
        name: group.name || `团队 ${groupId}`,
        subText: group.describe || "",
        acTotal: 0,
        submitTotal: 0,
        lastSubmit: "",
        members: group.users?.length || 0,
        scoreMembers: 0,
      });
    });

  rows.forEach((row) => {
    const groupId = Number(row.groupId);
    if (groupId === 0) return;
    const current = teamRows.get(groupId) || {
      rank: 0,
      id: groupId,
      avatar: teamAvatars.get(groupId) || "",
      name: `团队 ${groupId}`,
      subText: "",
      acTotal: 0,
      submitTotal: 0,
      lastSubmit: "",
      members: 0,
      scoreMembers: 0,
    };
    current.acTotal += row.acTotal;
    current.submitTotal += row.submitTotal;
    current.lastSubmit = getLatestSubmit(current.lastSubmit, row.lastSubmit);
    current.scoreMembers = (current.scoreMembers || 0) + 1;
    teamRows.set(groupId, current);
  });

  userRankingRows.value = rankRows(rows);
  teamRankingRows.value = rankRows(
    [...teamRows.values()].filter((row) => (row.scoreMembers || 0) > 0),
  );
  setRankingPage(1);
  loadingRanking.value = false;
};

onMounted(async () => {
  syncScreenSize();
  window.addEventListener("resize", syncScreenSize);
  loadingStats.value = true;
  loadingChart.value = true;
  loadingRanking.value = showRanking.value;
  try {
    await Promise.all([getUserCount(), getPeriodData(), getGroupCount(), getStatisticExplanation()]);
    loadingStats.value = false;
  } finally {
    // loadingStats handled above
  }
  await getDailyData();
  loadingChart.value = false;
  if (showRanking.value) {
    await getRankingData();
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", syncScreenSize);
});
</script>

<style scoped>
.dashboardContent {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  height: 100%;
  border: 1px solid var(--divider-color);
  color: var(--text-default-color);
  padding: clamp(10px, 1.6vw, 18px);
  overflow-x: hidden;

  .stat-scope-note {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin: 10px 0 14px;
    padding: 10px 12px;
    border: 1px solid var(--divider-color);
    border-radius: 12px;
    color: var(--text-light-color);
    background-color: var(--background-color-2);
    font-size: var(--text-sm);
    line-height: 1.6;
  }

  .stat-scope-note strong {
    color: var(--text-default-color);
  }

  .stat-scope-note button {
    border: 0;
    color: var(--active-color);
    background: transparent;
    font-family: inherit;
    font-size: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  .stat-scope-details {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: -4px 0 14px;
    padding: 10px 12px;
    border-left: 3px solid var(--active-color);
    color: var(--text-light-color);
    background-color: var(--background-color-2);
    font-size: var(--text-xs);
    line-height: 1.7;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: clamp(10px, 1.5vw, 20px);
    margin-top: 8px;
  }

  .stat-card {
    border: 1px solid var(--divider-color);
    position: relative;
    min-width: 0;
    padding: clamp(12px, 1.8vw, 18px);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s ease;
    background-color: var(--background-color-content);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: clamp(10px, 1.4vw, 16px);
    margin-bottom: clamp(10px, 1.5vw, 18px);
  }

  .card-icon {
    font-size: clamp(1.4rem, 2vw, 2rem);
    color: var(--neon-cyan);
  }

  .card-title {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .title-main {
    font-size: clamp(1rem, 1.5vw, 1.2rem);
    font-weight: 700;
    color: var(--text-default-color);
    letter-spacing: 0;
  }

  .title-sub {
    font-size: var(--text-sm);
    color: var(--text-light-color);
    opacity: 0.8;
  }

  .card-data {
    margin-bottom: 12px;
  }

  .data-value {
    font-size: clamp(1.8rem, 4vw, 3rem);
    font-weight: 800;
    line-height: 1;
    margin-bottom: 4px;
    letter-spacing: 0;
    overflow-wrap: anywhere;
  }

  .data-unit {
    font-size: 0.9rem;
    color: var(--text-light-color);
    opacity: 0.8;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--divider-color);
  }

  .footer-trend {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;

    &.up {
      color: red;
    }

    &.down {
      color: green;
    }

    &.equal {
      color: var(--text-light-color);
    }
  }

  .trend-icon {
    font-size: 1.1rem;
  }

  .footer-info {
    font-size: 0.8rem;
    color: var(--text-light-color);
    opacity: 0.7;
  }

  .chart-container {
    width: 100%;
    min-width: 0;
    height: clamp(280px, 46vh, 500px);
    margin-top: clamp(12px, 1.6vw, 20px);
    border: 1px solid var(--divider-color);
    border-radius: 12px;
    padding: clamp(8px, 1.4vw, 14px);
    box-sizing: border-box;
    background-color: var(--background-color-content);
  }

  .chart {
    width: 100%;
    height: 100%;
  }

  .ranking-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    margin-top: 20px;
  }

  .ranking-heading h2 {
    margin: 0;
  }

  .ranking-switch {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 0;
  }

  .ranking-switch button {
    min-width: 86px;
    padding: 5px 10px;
    border: 1px solid var(--divider-color);
    border-radius: var(--control-radius);
    color: var(--text-secondary-color);
    background-color: var(--background-color-2);
    cursor: pointer;
    font-family: inherit;
    font-size: var(--text-sm);
    font-weight: 800;
    line-height: 1;
    outline: none;
    transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease;
  }

  .ranking-switch button:hover {
    color: white;
    border-color: var(--input-active-color);
    background-color: var(--input-active-color);
  }

  .ranking-switch button.active {
    color: white;
    border-color: var(--input-active-color);
    background-color: var(--input-active-color);
  }

  .ranking-section {
    margin-top: clamp(12px, 1.6vw, 20px);
    border: 1px solid var(--divider-color);
    border-radius: 12px;
    padding: clamp(8px, 1.2vw, 14px);
    background-color: var(--background-color-content);
    overflow: hidden;
  }

  .ranking-table-wrapper {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .ranking-table {
    width: 100%;
    min-width: 680px;
    border-collapse: collapse;
  }

  .ranking-table th,
  .ranking-table td {
    padding: clamp(10px, 1.2vw, 14px) 12px;
    border-bottom: 1px solid var(--divider-color);
    color: var(--text-default-color);
    text-align: left;
  }

  .ranking-table th {
    color: var(--text-light-color);
    font-size: var(--text-sm);
    font-weight: 600;
    letter-spacing: 0;
  }

  .ranking-table tbody tr {
    transition: background-color 0.2s ease;
  }

  .ranking-table tbody tr:hover {
    background-color: var(--section-background-color);
  }

  .rank-col {
    width: 76px;
    text-align: center;
  }

  .rank-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 34px;
    height: 34px;
    padding: 0 10px;
    border: 1px solid var(--divider-color);
    border-radius: 999px;
    color: var(--text-light-color);
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    background-color: var(--section-background-color);
  }

  .rank-badge.gold {
    border-color: #f59e0b;
    color: #f59e0b;
    box-shadow: 0 0 14px rgba(245, 158, 11, 0.25);
  }

  .rank-badge.silver {
    border-color: #94a3b8;
    color: #94a3b8;
    box-shadow: 0 0 14px rgba(148, 163, 184, 0.22);
  }

  .rank-badge.bronze {
    border-color: #b45309;
    color: #b45309;
    box-shadow: 0 0 14px rgba(180, 83, 9, 0.22);
  }

  .rank-user {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
  }

  .rank-team {
    display: inline-flex;
    align-items: center;
    gap: 12px;
  }

  .rank-user img,
  .team-avatar-img {
    width: 42px;
    height: 42px;
    border: 1px solid var(--divider-color);
    border-radius: 50%;
    object-fit: cover;
    background-color: var(--section-background-color);
  }

  .team-avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border: 1px solid var(--divider-color);
    border-radius: 50%;
    color: var(--neon-cyan);
    background-color: var(--section-background-color);
    font-weight: 800;
    box-shadow: inset 0 0 16px rgba(0, 255, 255, 0.08);
  }

  .rank-user-info {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  .rank-name {
    color: var(--text-default-color);
    font-weight: 700;
    overflow-wrap: anywhere;
  }

  .rank-username {
    color: var(--text-light-color);
    font-size: var(--text-xs);
  }

  .rank-status {
    width: fit-content;
    padding: 2px 8px;
    border: 1px solid var(--divider-color);
    border-radius: 999px;
    color: var(--text-light-color);
    background-color: var(--section-background-color);
    font-size: var(--text-xs);
    font-weight: 700;

    &.tone-steady,
    &.tone-rising,
    &.tone-intense,
    &.tone-night,
    &.tone-explore {
      border-color: oklch(from var(--neon-cyan) l c h / 0.45);
      color: var(--neon-cyan);
      box-shadow: inset 0 0 12px oklch(from var(--neon-cyan) l c h / 0.08);
    }

    &.tone-warning {
      border-color: rgba(248, 113, 113, 0.45);
      color: #f87171;
      box-shadow: inset 0 0 12px rgba(248, 113, 113, 0.08);
    }
  }

  .count-cell {
    color: var(--neon-cyan);
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }

  .empty-ranking {
    color: var(--text-light-color);
    text-align: center;
  }

  .pageNavigation {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 16px;
  }

  .pageNavigation .group,
  .pageButtons,
  .pageInput {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  .pageButtons button,
  .pageInput button {
    padding: 8px 12px;
    border: 1px solid var(--divider-color);
    border-radius: 8px;
    color: var(--text-light-color);
    background-color: var(--section-background-color);
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s ease;
  }

  .pageButtons button:hover,
  .pageButtons button.active,
  .pageInput button:hover {
    border-color: var(--neon-cyan);
    color: var(--text-default-color);
    box-shadow: 0 0 12px rgba(0, 255, 255, 0.16);
  }

  .pageInput input {
    width: 76px;
    padding: 8px 10px;
    border: 1px solid var(--divider-color);
    border-radius: 8px;
    color: var(--text-default-color);
    font-family: inherit;
    background-color: var(--background-color-2);
  }

  .pageSum {
    color: var(--text-light-color);
    font-size: var(--text-sm);
  }
}

@media (max-width: 900px) {
  .dashboardContent {
    padding: 12px;

    h2 {
      font-size: 1.2rem;
      margin: 18px 0 12px;
    }

    .stats-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .ranking-heading {
      align-items: flex-start;
      flex-direction: column;
      gap: 10px;
    }

    .ranking-switch {
      width: 100%;
      flex-wrap: wrap;
    }

    .ranking-switch button {
      min-width: 0;
      flex: 1 1 120px;
    }

    .pageNavigation {
      align-items: flex-start;
      flex-direction: column;
    }
  }
}

@media (max-width: 560px) {
  .dashboardContent {
    width: 100%;
    border-left: none;
    border-right: none;
    padding: 10px;

    .stats-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    .stat-card {
      padding: 10px;
      border-radius: 10px;
    }

    .card-header {
      margin-bottom: 8px;
    }

    .title-main {
      font-size: 0.86rem;
      line-height: 1.35;
    }

    .data-value {
      font-size: clamp(1.35rem, 8vw, 2rem);
      line-height: 1.1;
    }

    .card-footer {
      align-items: flex-start;
      flex-direction: column;
      gap: 4px;
      padding-top: 8px;
    }

    .footer-trend,
    .footer-info {
      font-size: 0.72rem;
    }

    .chart-container {
      height: 320px;
      padding: 6px;
      border-radius: 10px;
    }

    .ranking-heading {
      margin-top: 16px;
    }

    .ranking-switch {
      gap: 8px;
    }

    .ranking-switch button {
      flex-basis: calc(50% - 4px);
      padding: 5px 10px;
      border-radius: 5px;
      font-size: var(--text-xs);
    }

    .ranking-section {
      padding: 8px;
      border-radius: 10px;
    }

    .ranking-table-wrapper {
      overflow: visible;
    }

    .ranking-table {
      min-width: 0;
      display: block;
    }

    .ranking-table thead {
      display: none;
    }

    .ranking-table tbody {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .ranking-table tr {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: 8px 12px;
      padding: 12px;
      border: 1px solid var(--divider-color);
      border-radius: 12px;
      background-color: var(--background-color-content);
    }

    .ranking-table tbody tr:hover {
      background-color: var(--background-color-content);
    }

    .ranking-table td {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      min-width: 0;
      padding: 0;
      border-bottom: none;
      font-size: var(--text-sm);
    }

    .ranking-table td::before {
      color: var(--text-light-color);
      font-size: var(--text-xs);
      white-space: nowrap;
    }

    .ranking-table td:nth-child(1) {
      grid-row: span 4;
      align-items: flex-start;
      justify-content: center;
      padding-top: 2px;
    }

    .ranking-table td:nth-child(1)::before {
      content: "";
    }

    .ranking-table td:nth-child(2) {
      justify-content: flex-start;
    }

    .ranking-table td:nth-child(2)::before {
      content: "";
    }

    .ranking-table td:nth-child(3)::before {
      content: "刷题数";
    }

    .ranking-table td:nth-child(4)::before {
      content: "提交数";
    }

    .ranking-table td:nth-child(5)::before {
      content: "最后提交";
    }

    .rank-col {
      width: auto;
    }

    .rank-badge {
      min-width: 34px;
      height: 34px;
      padding: 0 8px;
    }

    .rank-user,
    .rank-team {
      gap: 10px;
      min-width: 0;
    }

    .rank-user img,
    .team-avatar-img,
    .team-avatar {
      width: 38px;
      height: 38px;
      flex: 0 0 auto;
    }

    .rank-user-info {
      min-width: 0;
    }

    .rank-username {
      overflow-wrap: anywhere;
    }

    .empty-ranking {
      display: block !important;
      text-align: center;
    }

    .empty-ranking::before {
      content: "";
      display: none;
    }

    .pageNavigation {
      gap: 10px;
      margin-top: 12px;
    }

    .pageNavigation .group {
      width: 100%;
      justify-content: center;
    }

    .pageButtons {
      justify-content: center;
    }

    .pageInput {
      width: 100%;
      justify-content: center;
    }

    .pageButtons button,
    .pageInput button,
    .pageInput input {
      padding: 7px 10px;
      border-radius: 8px;
      font-size: var(--text-xs);
    }

    .pageInput input {
      width: 68px;
    }
  }
}

@media (max-width: 380px) {
  .dashboardContent {
    .stats-grid {
      grid-template-columns: 1fr;
    }

    .stat-card {
      padding: 12px;
    }
  }
}
</style>
