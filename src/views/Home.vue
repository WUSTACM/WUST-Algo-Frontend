<template>
  <BaseLayout>
    <div class="terminal-home">
      <!-- 数据统计卡片 -->
      <div class="data-section">
        <div class="section-header">
          <div class="header-title">
            <span class="title-icon">
              <font-awesome-icon icon="fa-solid fa-chart-line" />
            </span>
            <span class="title-text">{{ isLogin ? "" : "全站" }}数据统计</span>
          </div>
          <!-- <div class="header-actions">
            <span class="action-refresh">⟳ 刷新</span>
            <span class="action-export">⬇ 导出</span>
          </div> -->
          <div class="header-tabs">
            <span class="tab" :class="mode === 'ac' ? 'active' : ''" @click="mode = 'ac'"
              >AC数据</span
            >
            <span class="tab" :class="mode === 'submit' ? 'active' : ''" @click="mode = 'submit'"
              >提交数据</span
            >
          </div>
        </div>

        <div class="stats-grid" style="position: relative">
          <LoadingOverlay :show="loadingStats" />
          <!-- 生涯统计 -->
          <div class="stat-card">
            <div class="card-header">
              <font-awesome-icon icon="fa-solid fa-trophy" class="card-icon" />
              <div class="card-title">
                <div class="title-main">CAREER</div>
                <div class="title-sub">生涯{{ mode.toUpperCase() }}</div>
              </div>
            </div>
            <div class="card-data">
              <div class="data-value">{{ currentPeriodData.total }}</div>
              <div class="data-unit">{{ mode.toUpperCase() }} Total</div>
            </div>
            <div class="platform-breakdown">
              <div
                class="platform-row"
                v-for="item in platformBreakdown('total')"
                :key="`career-${item.platform}`"
              >
                <span class="platform-name">{{ item.label }}</span>
                <span class="platform-value">{{ item.value }}</span>
              </div>
            </div>
            <div class="card-glow"></div>
          </div>

          <!-- AC率 -->
          <div class="stat-card">
            <div class="card-header">
              <font-awesome-icon icon="fa-solid fa-globe" class="card-icon" />
              <div class="card-title">
                <div class="title-main">Percentage</div>
                <div class="title-sub">AC率</div>
              </div>
            </div>
            <div class="card-data">
              <div class="data-value">
                {{ formatRate(periodData.ac.total, periodData.submit.total) }}
              </div>
              <div class="data-unit">AC Percentage</div>
            </div>
            <div class="platform-breakdown">
              <div
                class="platform-row"
                v-for="item in platformBreakdown('percentage')"
                :key="`percentage-${item.platform}`"
              >
                <span class="platform-name">{{ item.label }}</span>
                <span class="platform-value">{{ item.value }}</span>
              </div>
            </div>
            <div class="card-glow"></div>
          </div>

          <!-- 今日统计 -->
          <div class="stat-card">
            <div class="card-header">
              <font-awesome-icon icon="fa-solid fa-sun" class="card-icon" />
              <div class="card-title">
                <div class="title-main">DAILY</div>
                <div class="title-sub">今日{{ mode.toUpperCase() }}</div>
              </div>
            </div>
            <div class="card-data">
              <div class="data-value">{{ currentPeriodData.today }}</div>
              <div class="data-unit">Today's {{ mode.toUpperCase() }}</div>
            </div>
            <div class="platform-breakdown">
              <div
                class="platform-row"
                v-for="item in platformBreakdown('today')"
                :key="`today-${item.platform}`"
              >
                <span class="platform-name">{{ item.label }}</span>
                <span class="platform-value">{{ item.value }}</span>
              </div>
            </div>
            <div class="card-glow"></div>
          </div>

          <!-- 年度统计 -->
          <div class="stat-card">
            <div class="card-header">
              <font-awesome-icon icon="fa-solid fa-globe" class="card-icon" />
              <div class="card-title">
                <div class="title-main">YEARLY</div>
                <div class="title-sub">年度{{ mode.toUpperCase() }}</div>
              </div>
            </div>
            <div class="card-data">
              <div class="data-value">{{ currentPeriodData.thisYear }}</div>
              <div class="data-unit">
                Year {{ new Date().getFullYear() }}'s {{ mode.toUpperCase() }}
              </div>
            </div>
            <div class="platform-breakdown">
              <div
                class="platform-row"
                v-for="item in platformBreakdown('thisYear')"
                :key="`year-${item.platform}`"
              >
                <span class="platform-name">{{ item.label }}</span>
                <span class="platform-value">{{ item.value }}</span>
              </div>
            </div>
            <div class="card-footer">
              <div
                class="footer-trend"
                :class="getTrendClass(currentPeriodData.thisYear, currentPeriodData.lastYear)"
              >
                <span class="trend-icon">{{
                  getTrend(currentPeriodData.thisYear, currentPeriodData.lastYear)
                }}</span>
                <span class="trend-value">{{
                  getTrendValue(currentPeriodData.thisYear, currentPeriodData.lastYear)
                }}</span>
              </div>
              <div class="footer-info">VS last year</div>
            </div>
            <div class="card-glow"></div>
          </div>

          <!-- 本月统计 -->
          <div class="stat-card">
            <div class="card-header">
              <font-awesome-icon icon="fa-solid fa-sun" class="card-icon" />
              <div class="card-title">
                <div class="title-main">MONTHLY</div>
                <div class="title-sub">本月{{ mode.toUpperCase() }}</div>
              </div>
            </div>
            <div class="card-data">
              <div class="data-value">{{ currentPeriodData.thisMonth }}</div>
              <div class="data-unit">This Month's {{ mode.toUpperCase() }}</div>
            </div>
            <div class="platform-breakdown">
              <div
                class="platform-row"
                v-for="item in platformBreakdown('thisMonth')"
                :key="`month-${item.platform}`"
              >
                <span class="platform-name">{{ item.label }}</span>
                <span class="platform-value">{{ item.value }}</span>
              </div>
            </div>
            <div class="card-footer">
              <div
                class="footer-trend"
                :class="getTrendClass(currentPeriodData.thisMonth, currentPeriodData.lastMonth)"
              >
                <span class="trend-icon">{{
                  getTrend(currentPeriodData.thisMonth, currentPeriodData.lastMonth)
                }}</span>
                <span class="trend-value">{{
                  getTrendValue(currentPeriodData.thisMonth, currentPeriodData.lastMonth)
                }}</span>
              </div>
              <div class="footer-info">VS last month</div>
            </div>
            <div class="card-glow"></div>
          </div>

          <!-- 本周统计 -->
          <div class="stat-card">
            <div class="card-header">
              <font-awesome-icon icon="fa-solid fa-crosshairs" class="card-icon" />
              <div class="card-title">
                <div class="title-main">WEEKLY</div>
                <div class="title-sub">本周{{ mode.toUpperCase() }}</div>
              </div>
            </div>
            <div class="card-data">
              <div class="data-value">{{ currentPeriodData.thisWeek }}</div>
              <div class="data-unit">This Week's {{ mode.toUpperCase() }}</div>
            </div>
            <div class="platform-breakdown">
              <div
                class="platform-row"
                v-for="item in platformBreakdown('thisWeek')"
                :key="`week-${item.platform}`"
              >
                <span class="platform-name">{{ item.label }}</span>
                <span class="platform-value">{{ item.value }}</span>
              </div>
            </div>
            <div class="card-footer">
              <div
                class="footer-trend"
                :class="getTrendClass(currentPeriodData.thisWeek, currentPeriodData.lastWeek)"
              >
                <span class="trend-icon">{{
                  getTrend(currentPeriodData.thisWeek, currentPeriodData.lastWeek)
                }}</span>
                <span class="trend-value">{{
                  getTrendValue(currentPeriodData.thisWeek, currentPeriodData.lastWeek)
                }}</span>
              </div>
              <div class="footer-info">VS last week</div>
            </div>
            <div class="card-glow"></div>
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="grid-left">
          <div class="section-secondary weekly-home-section">
            <div class="section-header">
              <div class="header-title">
                <span class="title-icon">
                  <font-awesome-icon icon="fa-solid fa-calendar-days" />
                </span>
                <span class="title-text">训练战报</span>
              </div>
            </div>

            <div class="section-secondary-container" style="position: relative">
              <LoadingOverlay :show="loadingWeekly || loadingStats" />
              <div class="weekly-card" v-if="weeklyReport">
                <div class="weekly-title">
                  <span>本周战报</span>
                  <strong>{{ weeklyReport.title }}</strong>
                </div>
                <div class="weekly-summary">{{ weeklyReport.summary }}</div>
                <div class="weekly-metrics">
                  <div
                    class="weekly-metric"
                    v-for="metric in weeklyReport.metrics"
                    :key="metric.label"
                  >
                    <strong>{{ metric.value }}</strong>
                    <span>{{ metric.label }}</span>
                    <em>{{ metric.hint }}</em>
                  </div>
                </div>
                <div class="weekly-scenes">
                  <div class="weekly-block-title">本周名场面</div>
                  <div class="weekly-scene" v-for="scene in weeklyReport.scenes" :key="scene.title">
                    <strong>{{ scene.title }}</strong>
                    <span>{{ scene.text }}</span>
                  </div>
                </div>
                <div class="weekly-advice">
                  <strong>训练提示</strong>
                  <span>{{ weeklyReport.tip }}</span>
                </div>
              </div>
              <div class="weekly-empty" v-else>登录后查看你的训练战报。</div>
            </div>
          </div>
          <div class="section-secondary heatmap-home-section">
            <div class="section-header">
              <div class="header-title">
                <span class="title-icon">
                  <font-awesome-icon icon="fa-solid fa-calendar-days" />
                </span>
                <span class="title-text">热力图</span>
              </div>
              <div class="header-tabs">
                <span
                  class="tab"
                  :class="currentCalendar === 0 ? 'active' : ''"
                  @click="currentCalendar = 0"
                  >提交热力图</span
                >
                <span
                  class="tab"
                  :class="currentCalendar === 1 ? 'active' : ''"
                  @click="currentCalendar = 1"
                  >AC热力图</span
                >
              </div>
            </div>

            <div class="section-secondary-container" style="position: relative">
              <LoadingOverlay :show="loadingHeatmap" />
              <Calendar
                v-if="currentCalendar === 0"
                :data="submitData"
                :year="dynamicYear"
                @changeYear="handleYearChange"
              ></Calendar>
              <Calendar
                v-if="currentCalendar === 1"
                :data="acData"
                :year="dynamicYear"
                @changeYear="handleYearChange"
              >
              </Calendar>
            </div>
          </div>
          <div class="section-secondary quick-home-section">
            <div class="section-header">
              <div class="header-title">
                <span class="title-icon">
                  <font-awesome-icon icon="fa-solid fa-star" />
                </span>
                <span class="title-text">快捷入口</span>
              </div>
            </div>

            <div class="section-secondary-container">
              <div class="enterCardGrid">
                <a class="card" href="https://ac.nowcoder.com/" target="_blank">
                  <div class="icon">
                    <img src="/images/ac.nowcoder.webp" alt="" />
                  </div>
                  <div class="info">
                    <div class="title">牛客竞赛</div>
                    <div class="desc">专业的编程算法训练平台</div>
                  </div>
                </a>
                <a
                  class="card"
                  href="https://www.nowcoder.com/problem/tracker#/daily"
                  target="_blank"
                >
                  <div class="icon">
                    <img src="/images/www.nowcoder.webp" alt="" />
                  </div>
                  <div class="info">
                    <div class="title">牛客tracker</div>
                    <div class="desc">牛客tracker</div>
                  </div>
                </a>
                <a class="card" href="https://www.luogu.com.cn/" target="_blank">
                  <div class="icon">
                    <img
                      src="https://fecdn.luogu.com.cn/columba/static.325908fec383795b.logo-single-color.svg"
                      alt=""
                    />
                  </div>
                  <div class="info">
                    <div class="title">洛谷</div>
                    <div class="desc">计算机科学教育新生态</div>
                  </div>
                </a>
                <a class="card" href="https://atcoder.jp/home" target="_blank">
                  <div class="icon">
                    <img src="https://img.atcoder.jp/assets/logo.png" alt="" />
                  </div>
                  <div class="info">
                    <div class="title">AtCoder</div>
                    <div class="desc">
                      AtCoder is a programming contest site for anyone from beginners to experts
                    </div>
                  </div>
                </a>
                <a class="card" href="https://codeforces.com/" target="_blank">
                  <div class="icon">
                    <img
                      src="https://codeforces.com/codeforces.org/s/52348/android-icon-192x192.png"
                      alt=""
                    />
                  </div>
                  <div class="info">
                    <div class="title">CodeForces</div>
                    <div class="desc">全球最大算法平台</div>
                  </div>
                </a>
                <a class="card" href="https://leetcode.cn/" target="_blank">
                  <div class="icon">
                    <img
                      src="https://assets.leetcode.cn/aliyun-lc-upload/uploaded_files/2021/03/73c9f099-abbe-4d94-853f-f8abffd459cd/leetcode.png"
                      alt=""
                    />
                  </div>
                  <div class="info">
                    <div class="title">力扣</div>
                    <div class="desc">全球极客挚爱的技术成长平台</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div class="grid-right">
          <!-- <div class="section-secondary">
            <div class="section-header">
              <div class="header-title">
                <span class="title-icon">
                  <font-awesome-icon icon="fa-solid fa-trophy" />
                </span>
                <span class="title-text">排行榜</span>
              </div>
              <div class="header-tabs">
                <span class="tab" :class="currentRank === 0 ? 'active' : ''" @click="currentRank = 0">CAREER</span>
                <span class="tab" :class="currentRank === 1 ? 'active' : ''" @click="currentRank = 1">MONTHLY</span>
                <span class="tab" :class="currentRank === 2 ? 'active' : ''" @click="currentRank = 2">WEEKLY</span>
              </div>
            </div>

            <div class="section-secondary-container">
              <div v-if="currentRank === 0">
                <Rank :data="rankData"></Rank>
              </div>
              <div v-else-if="currentRank === 1">
                <Rank :data="rankData"></Rank>
              </div>

              <div v-else-if="currentRank === 2">
                <Rank :data="rankData"></Rank>
              </div>
            </div>
          </div> -->
          <div class="section-secondary">
            <div class="section-header">
              <div class="header-title">
                <span class="title-icon">
                  <font-awesome-icon icon="fa-solid fa-envelope" />
                </span>
                <span class="title-text">消息</span>
              </div>
            </div>
            <div class="section-secondary-container" style="position: relative">
              <BulletinBoard />
            </div>
          </div>
          <div class="section-secondary">
            <div class="section-header">
              <div class="header-title">
                <span class="title-icon">
                  <font-awesome-icon icon="fa-solid fa-trophy" />
                </span>
                <span class="title-text">AI总结</span>
              </div>
            </div>

            <div class="section-secondary-container" style="position: relative">
              <LoadingOverlay :show="loadingAi" />
              <div v-for="(item, index) in aiSummary" :key="`${index}-${item}`" class="analyseItem">
                {{ item }}
              </div>
              <div class="aiTip">内容由AI生成，请仔细甄别。</div>
              <!-- <div v-for="item in analyse" v-html="item" class="analyseItem"></div> -->
            </div>
          </div>
          <div class="section-secondary update-home-section">
            <div class="section-header">
              <div class="header-title">
                <span class="title-icon">
                  <font-awesome-icon icon="fa-solid fa-code-branch" />
                </span>
                <span class="title-text">最近更新</span>
              </div>
              <span class="update-version">v1.1.5</span>
            </div>

            <div class="section-secondary-container update-feed">
              <div class="update-item" v-for="item in recentUpdates" :key="item.title">
                <div class="update-marker" :class="`tone-${item.tone}`">
                  {{ item.type }}
                </div>
                <div class="update-content">
                  <div class="update-title-row">
                    <strong>{{ item.title }}</strong>
                    <span>{{ item.date }}</span>
                  </div>
                  <p>{{ item.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import BaseLayout from "@/components/BaseLayout.vue"
import Calendar from "@/components/Calendar.vue"
// import Rank from '@/components/Rank.vue';
import JWT from "@/utils/jwt"
import API, {
  type CoreSubmitLogGetByIdData,
  type CoreStatisticHeatmapRequest,
  type CoreStatisticPeriodData,
  type CoreStatisticPeriodItem,
  type CoreStatisticPlatformPeriodItem,
} from "@/utils/api"
import Toast from "@/utils/toast"
import Analyse from "@/utils/analyse"
import { useUserStore } from "@/stores/user"
import LoadingOverlay from "@/components/LoadingOverlay.vue"
import BulletinBoard from "@/components/BulletinBoard.vue"
import type { WeeklyReport } from "@/utils/v11Features"

const userStore = useUserStore()
const isLogin = computed(() => userStore.isLogin)

const loadingStats = ref(true)
const loadingHeatmap = ref(true)
const loadingAi = ref(true)
const loadingWeekly = ref(false)

interface HeatmapData {
  date: string
  count: number
}

const analyse = ref<string[]>([])
const aiSummary = ref<string[]>([])

const recentUpdates = [
  {
    type: "修复",
    tone: "fix",
    title: "分屏布局越界修复",
    description: "普通卡片随内容增高，热力图和长内容在卡片内部滚动，分屏时不再压到右侧模块。",
    date: "06/11",
  },
  {
    type: "修复",
    tone: "fix",
    title: "Codeforces 抓取保护",
    description: "降低 CF 刷新频率，避免接口限流时用不完整数据覆盖旧统计。",
    date: "06/11",
  },
  {
    type: "优化",
    tone: "improve",
    title: "统计明细体验",
    description: "调整平台明细弹窗尺寸和表格横向滚动，移动端查看更稳。",
    date: "06/10",
  },
  {
    type: "修复",
    tone: "fix",
    title: "团队统计口径",
    description: "团队总 AC 与提交改为成员数据累加，修复本周看板异常值。",
    date: "06/09",
  },
]

const submitData = ref<HeatmapData[]>([])
const acData = ref<HeatmapData[]>([])
const recentSubmitLogs = ref<CoreSubmitLogGetByIdData[]>([])

const dynamicYear = ref<number>(new Date().getFullYear())

const handleYearChange = (year: number) => {
  dynamicYear.value = year
}
const padZero = (num: number): string => {
  return num < 10 ? "0" + num : num.toString()
}

const getHeatmapData = async () => {
  loadingHeatmap.value = true
  const dateObj = new Date()
  const date = dateObj.getFullYear() + padZero(dateObj.getMonth() + 1) + padZero(dateObj.getDate())

  let request: CoreStatisticHeatmapRequest = {
    startDate: "20230101",
    endDate: date,
    isAc: false,
  }

  if (isLogin.value) {
    request.userId = JWT.getUserInfo()!.userId
  }

  const response1 = await API.core.statistic.heatmap(request)
  Toast.stdResponse(response1, false)

  if (response1.success) {
    submitData.value = response1.data.data.filter((item) => item.count > 0)
  }

  request.isAc = true

  const response2 = await API.core.statistic.heatmap(request)
  Toast.stdResponse(response2, false)

  if (response2.success) {
    acData.value = response2.data.data.filter((item) => item.count > 0)
    loadingHeatmap.value = false
  }
}

const rankData = ref({
  data: [
    { name: "张三", score: 1400, change: 1 },
    { name: "李四", score: 1300, change: 1 },
    { name: "王五", score: 1200, change: 0 },
    { name: "赵六", score: 1145, change: 0 },
    { name: "钱七", score: 1000, change: 0 },
    { name: "孙八", score: 900, change: 1 },
    { name: "周九", score: 400, change: -1 },
    { name: "吴十", score: 300, change: -1 },
    { name: "郑十一", score: 200, change: 0 },
    { name: "王十二", score: 100, change: 0 },
  ],
  scoreUnit: "AC",
  userRank: 4,
  userName: "赵六",
  userScore: 1145,
  totalPage: 1,
})

const currentRank = ref(0)
const currentCalendar = ref(0)

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
})

type PeriodMetricKey = keyof CoreStatisticPeriodItem | "percentage"

const platformPeriodData = ref<CoreStatisticPlatformPeriodItem[]>([])
const platformLabels: Record<string, string> = {
  AtCoder: "AtCoder",
  NowCoder: "牛客",
  LuoGu: "洛谷",
  CodeForces: "CodeForces",
  QOJ: "QOJ",
}

const mode = ref<"ac" | "submit">("ac")

const currentPeriodData = computed<CoreStatisticPeriodItem>(() => {
  return periodData.value[mode.value]
})

const weeklyReport = ref<WeeklyReport | null>(null)
let weeklyReportSignature = ""
const spiderRefreshEventKey = "wust-spider-refresh-done"
const spiderSnapshotState = ref({
  checkedAt: 0,
  active: false,
})

const weeklyCacheKey = (userId: number, signature: string) =>
  `wust-weekly-report:${userId}:${signature}`

const hasActiveSpiderRefresh = async (userId: number) => {
  if (!userId || !JWT.isValid()) return false
  const now = Date.now()
  if (now - spiderSnapshotState.value.checkedAt < 5000) {
    return spiderSnapshotState.value.active
  }

  const [queuedResponse, runningResponse] = await Promise.all([
    API.core.spider.jobs({ scope: "mine", status: "queued", page: 1, pageSize: 1, userId }),
    API.core.spider.jobs({ scope: "mine", status: "running", page: 1, pageSize: 1, userId }),
  ])
  const active = Boolean(
    (queuedResponse.success && queuedResponse.data.data.length > 0) ||
    (runningResponse.success && runningResponse.data.data.length > 0),
  )
  spiderSnapshotState.value = { checkedAt: now, active }
  return active
}

const buildWeeklySignature = () => {
  const userId = Number(JWT.getUserInfo()?.userId || 0)
  const newestLogTime = Math.max(0, ...recentSubmitLogs.value.map((item) => Number(item.time || 0)))
  const periodMarker = [
    periodData.value.ac.thisWeek,
    periodData.value.ac.lastWeek,
    periodData.value.ac.total,
    periodData.value.submit.thisWeek,
    periodData.value.submit.total,
  ].join(":")
  const platformMarker = platformPeriodData.value
    .map(
      (item) =>
        `${item.platform}:${item.ac.thisWeek}:${item.ac.total}:${item.submit.thisWeek}:${item.submit.total}`,
    )
    .join("|")
  return `${userId}:${periodMarker}:${recentSubmitLogs.value.length}:${newestLogTime}:${platformMarker}`
}

const refreshWeeklyReport = async () => {
  if (!isLogin.value) {
    weeklyReport.value = null
    weeklyReportSignature = ""
    return
  }
  const userId = Number(JWT.getUserInfo()?.userId || 0)
  const signature = buildWeeklySignature()
  if (!userId || signature === weeklyReportSignature) return
  if (await hasActiveSpiderRefresh(userId)) return

  weeklyReportSignature = signature
  const cacheKey = weeklyCacheKey(userId, signature)
  try {
    const cached = JSON.parse(sessionStorage.getItem(cacheKey) || "null")
    if (
      cached?.generatedAt &&
      Date.now() - Number(cached.generatedAt) < 10 * 60 * 1000 &&
      cached?.report
    ) {
      weeklyReport.value = cached.report
      return
    }
  } catch {
    // Ignore broken cache entries and rebuild below.
  }

  const snapshot = await API.core.snapshot.get<WeeklyReport>(userId, "weekly_report", signature)
  if (snapshot.success && snapshot.data.exists && !snapshot.data.stale && snapshot.data.payload) {
    weeklyReport.value = snapshot.data.payload
    try {
      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({ generatedAt: Date.now(), report: snapshot.data.payload }),
      )
    } catch {
      // Snapshot is enough when browser storage is unavailable.
    }
    return
  }

  const { buildWeeklyReport } = await import("@/utils/v11Features")
  const report = buildWeeklyReport(
    periodData.value,
    recentSubmitLogs.value,
    platformPeriodData.value,
  )
  weeklyReport.value = report
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify({ generatedAt: Date.now(), report }))
  } catch {
    // Storage can be unavailable in private mode; rendering should still work.
  }
  API.core.snapshot.save(userId, "weekly_report", signature, report)
}

const refreshHomeAfterSpider = async () => {
  spiderSnapshotState.value = { checkedAt: 0, active: false }
  weeklyReportSignature = ""
  await Promise.all([getPeriodData(), getWeeklySubmitLogs()])
  await refreshWeeklyReport()
}

const handleSpiderRefreshDone = (event: StorageEvent) => {
  if (event.key !== spiderRefreshEventKey || !event.newValue) return
  try {
    const payload = JSON.parse(event.newValue)
    const currentUserId = Number(JWT.getUserInfo()?.userId || 0)
    if (!currentUserId || Number(payload?.userId || 0) !== currentUserId) return
    refreshHomeAfterSpider()
  } catch {
    // Ignore malformed cross-tab notifications.
  }
}

watch(
  [periodData, recentSubmitLogs, platformPeriodData, isLogin],
  () => {
    refreshWeeklyReport()
  },
  { deep: true },
)

const formatRate = (ac: number, submit: number): string => {
  if (!submit) return "0.00%"
  return `${((ac / submit) * 100).toFixed(2)}%`
}

const platformBreakdown = (metric: PeriodMetricKey) => {
  return platformPeriodData.value.map((item) => {
    const value =
      metric === "percentage"
        ? formatRate(Number(item.ac.total), Number(item.submit.total))
        : Number(item[mode.value][metric] || 0).toLocaleString()

    return {
      platform: item.platform,
      label: platformLabels[item.platform] || item.platform,
      value,
    }
  })
}

const getPeriodData = async () => {
  loadingStats.value = true
  const userId = JWT.getUserInfo()?.userId || -1
  const response = await API.core.statistic.period(userId)
  Toast.stdResponse(response, false)
  if (response.success) {
    periodData.value = response.data.data
    analyse.value = Analyse.period(response.data.data)
  }
  loadingStats.value = false

  const platformResponse = await API.core.statistic.platformPeriod(userId)
  Toast.stdResponse(platformResponse, false)
  if (platformResponse.success) {
    platformPeriodData.value = platformResponse.data.data
  }
}

const getWeeklySubmitLogs = async () => {
  if (!isLogin.value) return
  loadingWeekly.value = true
  const userId = JWT.getUserInfo()?.userId || 0
  const logs: CoreSubmitLogGetByIdData[] = []
  let cursor = -1
  const pageSize = 300
  const maxLogs = 1000
  const minTime = Math.floor(Date.now() / 1000) - 21 * 86400

  try {
    while (logs.length < maxLogs) {
      const response = await API.core.submitLog.getById(userId, cursor, pageSize)
      Toast.stdResponse(response, false)
      if (!response.success) break

      const pageLogs = response.data.data || []
      logs.push(...pageLogs)
      if (pageLogs.length === 0 || pageLogs.length < pageSize) break

      const lastLog = pageLogs[pageLogs.length - 1]
      cursor = Number(lastLog?.time || 0)
      if (!cursor || cursor < minTime) break
    }
    recentSubmitLogs.value = logs
  } finally {
    loadingWeekly.value = false
  }
}

const getAiSummary = async () => {
  loadingAi.value = true
  const userId = JWT.getUserInfo()?.userId
  if (!userId) {
    aiSummary.value = ["登录后查看AI总结"]
    loadingAi.value = false
    return
  }
  const response = await API.agent.summary.recent(userId)
  Toast.stdResponse(response, false)
  aiSummary.value = response.data.msg
  loadingAi.value = false
}

/*
卧槽了惊天大无语，传的明明是数字却变成字符串了，逆天
*/
const getTrendClass = (curr: number, prev: number): string => {
  curr = Number(curr)
  prev = Number(prev)
  if (curr === prev) {
    return "equal"
  } else if (curr > prev) {
    return "up"
  } else {
    return "down"
  }
}

const getTrendValue = (curr: number, prev: number): string => {
  curr = Number(curr)
  prev = Number(prev)
  // return (curr - prev >= 0 ? '+' : '') + ((curr - prev) / (prev === 0 ? 1 : prev) * 100).toFixed(2) + '%'
  return (curr - prev >= 0 ? "+" : "") + (curr - prev)
}

const getTrend = (curr: number, prev: number): string => {
  curr = Number(curr)
  prev = Number(prev)
  if (curr === prev) {
    return "-"
  } else if (curr > prev) {
    return "↗"
  } else {
    return "↘"
  }
}

onMounted(() => {
  window.addEventListener("storage", handleSpiderRefreshDone)
  getHeatmapData()
  getPeriodData()
  getWeeklySubmitLogs()
  getAiSummary()
})

onBeforeUnmount(() => {
  window.removeEventListener("storage", handleSpiderRefreshDone)
})
</script>

<style scoped>
.terminal-home {
  display: flex;
  flex-direction: column;
  gap: 24px;
  color: var(--text-default-color);
  padding: 20px;
  width: calc(100% - 40px);
}

/* 数据统计区域 */
.data-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 10px;
  border-radius: 12px;
  background: var(--background-header);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: var(--text-lg);
  font-weight: 600;
}

.title-icon {
  font-size: var(--text-lg);
}

.title-text {
  color: var(--text-default-color);
}

.header-actions {
  display: flex;
  gap: 16px;
}

.action-refresh,
.action-export {
  color: var(--text-light-color);
  font-size: var(--text-base);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.action-refresh:hover {
  color: var(--neon-cyan);
  background-color: var(--section-background-color);
}

.action-export:hover {
  color: var(--text-light-color);
  background-color: var(--section-background-color);
}

/* 统计卡片网格 */
.stats-grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 8px;
}

.stat-card {
  background-color: rgba(255, 255, 255, 0.08);
  position: relative;
  padding: 20px;
  border-radius: 12px;
  overflow: hidden;
  transition:
    box-shadow 0.3s ease,
    transform 0.3s ease;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
}

.stat-card:hover {
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
  transform: translateY(-4px) scale(1.02);
}

.stat-card:hover .card-header,
.stat-card:hover .card-data,
.stat-card:hover .card-footer {
  opacity: 0;
  transform: translateY(8px);
}

.stat-card:hover::after {
  transform: rotate(24deg) translateY(16%);
  opacity: 1;
}

.stat-card::after {
  content: "";
  position: absolute;
  top: -58%;
  left: -18%;
  width: 150%;
  height: 150%;
  background-image: linear-gradient(
    hsla(0, 0%, 100%, 0),
    hsla(0, 0%, 100%, 0.1) 48%,
    hsla(0, 0%, 100%, 0) 52%
  );
  transform: rotate(24deg);
  opacity: 0.5;
  transition:
    transform 0.5s ease,
    opacity 0.5s ease;
  pointer-events: none;
}

.card-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--gradient-cyber);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover .card-glow {
  opacity: 1;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  transition:
    opacity 0.24s ease,
    transform 0.24s ease;
}

.card-icon {
  font-size: var(--text-2xl);
  color: var(--neon-cyan);
}

.card-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title-main {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--text-default-color);
  letter-spacing: 1px;
}

.title-sub {
  font-size: var(--text-base);
  color: var(--text-light-color);
  opacity: 0.8;
}

.card-data {
  margin-bottom: 16px;
  transition:
    opacity 0.24s ease,
    transform 0.24s ease;
}

.data-value {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 4px;
  letter-spacing: -1px;
}

.data-unit {
  font-size: var(--text-base);
  color: var(--text-light-color);
  opacity: 0.8;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid var(--divider-color);
  transition:
    opacity 0.24s ease,
    transform 0.24s ease;
}

.platform-breakdown {
  position: absolute;
  inset: 18px 20px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  opacity: 0;
  transform: translateY(10px) scale(0.98);
  pointer-events: none;
  transition:
    opacity 0.24s ease,
    transform 0.24s ease;
}

.stat-card:hover .platform-breakdown {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.platform-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  min-height: 24px;
  color: var(--text-default-color);
}

.platform-name {
  overflow: hidden;
  color: var(--text-light-color);
  font-size: var(--text-base);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.platform-value {
  color: var(--neon-cyan);
  font-size: var(--text-lg);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
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
  font-size: var(--text-base);
}

.trend-value {
  font-size: var(--text-base);
}

.footer-info {
  font-size: var(--text-base);
  color: var(--text-light-color);
  opacity: 0.7;
}

/* 仪表板网格布局 */
.dashboard-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-top: 8px;
}

@media (max-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

.grid-left,
.grid-right {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
  width: 100%;
}

.heatmap-home-section {
  order: 1;
  min-width: 0;
}

.heatmap-home-section .section-secondary-container {
  overflow: hidden;
  min-width: 0;
}

.weekly-home-section {
  order: 2;
}

.quick-home-section {
  order: 3;
}

.section-secondary {
  width: 100%;
  display: flex;
  gap: 10px;
  flex-direction: column;
  /* border: 1px solid var(--divider-color); */
  /* border-radius: 6px; */
}

.header-tabs {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px;
}

.tab {
  padding: 6px 12px;
  border-radius: 6px;
  color: var(--text-light-color);
  font-size: var(--text-base);
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab:hover {
  background-color: oklch(from var(--background-color-2) 1 c h / 0.1);
  color: var(--text-default-color);
}

.tab.active {
  background-color: var(--neon-cyan);
  color: var(--text-reverse-color);
  font-weight: 500;
}

.section-secondary-container {
  display: flex;
  flex-direction: column;
  padding: 10px;
  gap: 16px;
  width: calc(100% - 20px);
  border-radius: 12px;
  background-color: var(--background-color-content);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
}

.section-secondary-container::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.section-secondary-container::-webkit-scrollbar-thumb {
  background-color: var(--divider-color);
  border-radius: 5px;
}

.weekly-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.weekly-title {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  color: var(--text-default-color);
  font-weight: 900;
}

.weekly-title span {
  color: var(--text-light-color);
  font-size: var(--text-xs);
  font-weight: 800;
}

.weekly-title strong {
  color: var(--active-color);
  font-size: var(--text-xl);
}

.weekly-summary,
.weekly-scene span,
.weekly-advice span,
.weekly-empty {
  color: var(--text-light-color);
  font-size: var(--text-base);
  line-height: 1.7;
}

.weekly-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.weekly-metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  border: 1px solid var(--divider-color);
  border-radius: 12px;
  background-color: var(--section-background-color);
}

.weekly-metric strong {
  color: var(--active-color);
  font-size: var(--text-xl);
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}

.weekly-metric span {
  color: var(--text-default-color);
  font-size: var(--text-sm);
  font-weight: 800;
}

.weekly-metric em {
  color: var(--text-light-color);
  font-size: var(--text-xs);
  font-style: normal;
}

.weekly-scenes {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.weekly-block-title {
  grid-column: 1 / -1;
  color: var(--text-default-color);
  font-size: var(--text-sm);
  font-weight: 900;
}

.weekly-scene {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
  padding: 10px;
  border-left: 3px solid color-mix(in srgb, var(--neon-cyan) 56%, var(--divider-color));
  border-radius: 10px;
  background-color: var(--section-background-color);
}

.weekly-scene strong,
.weekly-advice strong {
  color: var(--text-default-color);
  font-size: var(--text-sm);
  font-weight: 900;
}

.weekly-scene span {
  font-size: var(--text-sm);
  line-height: 1.6;
}

.weekly-advice {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 12px;
  border: 1px solid color-mix(in srgb, var(--neon-cyan) 26%, var(--divider-color));
  border-radius: 12px;
  background-color: color-mix(in srgb, var(--neon-cyan) 9%, var(--background-color-content));
}

.weekly-advice span {
  font-size: var(--text-sm);
}

.update-version {
  flex-shrink: 0;
  padding: 4px 8px;
  border: 1px solid var(--divider-color);
  border-radius: 8px;
  color: var(--active-color);
  font-size: var(--text-xs);
  font-weight: 800;
}

.update-feed {
  gap: 0;
  padding-block: 4px;
}

.update-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12px;
  padding: 12px 2px;
  border-bottom: 1px solid var(--divider-color);
}

.update-item:last-child {
  border-bottom: none;
}

.update-marker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 28px;
  border: 1px solid var(--divider-color);
  border-radius: 10px;
  color: var(--text-default-color);
  background-color: var(--section-background-color);
  font-size: var(--text-xs);
  font-weight: 900;
}

.update-marker.tone-fix {
  color: #ff8585;
}

.update-marker.tone-improve {
  color: var(--neon-cyan);
}

.update-marker.tone-new {
  color: var(--active-color);
}

.update-content {
  min-width: 0;
}

.update-title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.update-title-row strong {
  color: var(--text-default-color);
  font-size: var(--text-sm);
  font-weight: 900;
}

.update-title-row span {
  flex-shrink: 0;
  color: var(--text-light-color);
  font-size: var(--text-xs);
}

.update-content p {
  margin: 5px 0 0;
  color: var(--text-light-color);
  font-size: var(--text-sm);
  line-height: 1.6;
}

.analyseItem {
  font-size: var(--text-base);
}

.aiTip {
  font-size: var(--text-xs);
  color: var(--text-light-color);
}

.enterCardGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;

  > .card {
    background-color: var(--background-color-content);
    color: var(--text-default-color);
    text-decoration: none;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: row;
    padding: 10px;
    border-radius: 8px;
    gap: 10px;
    transition: all 0.2s ease;
    border: 1px dashed var(--background-color-content);

    &:hover {
      transform: scale(1.01);
      box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
      border: 1px dashed var(--neon-cyan);
    }

    > .icon {
      flex-shrink: 0;
      width: 50px;
      height: 50px;
      overflow: hidden;
      border-radius: 10px;

      > img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    > .info {
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: 150px;

      > .title {
        font-size: var(--text-base);
      }

      > .desc {
        font-size: var(--text-xs);
        color: var(--text-light-color);
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
    }
  }
}

/* 响应式设计 */

@media (max-width: 768px) {
  .terminal-home {
    width: calc(100% - 20px);
    padding: 10px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    gap: 12px;
  }

  .header-actions {
    align-self: flex-end;
  }

  .dashboard-grid {
    gap: 16px;
  }

  .weekly-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .weekly-scenes {
    grid-template-columns: 1fr;
  }

  .update-title-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;
  }

  .ranking-card {
    height: 250px;
  }

  .data-value {
    font-size: 2.5rem;
  }
}

@media (max-width: 640px) {
  .header-tabs {
    flex-wrap: wrap;
  }

  .tab {
    padding: 4px 8px;
  }

  .ranking-card {
    height: 220px;
  }

  .data-value {
    font-size: 2rem;
  }

  .weekly-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* 自定义滚动条 */
.terminal-content::-webkit-scrollbar {
  width: 6px;
}

.terminal-content::-webkit-scrollbar-track {
  background-color: var(--background-color-2);
  border-radius: 3px;
}

.terminal-content::-webkit-scrollbar-thumb {
  background-color: var(--neon-cyan);
  border-radius: 3px;
  opacity: 0.5;
}

.terminal-content::-webkit-scrollbar-thumb:hover {
  opacity: 0.8;
}
</style>
