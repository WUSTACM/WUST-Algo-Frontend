<template>
  <BaseLayout>
    <template #header> 比赛 Contest </template>
    <div v-if="requiresLoginMessage" class="empty-placeholder">登录后可以查看比赛</div>
    <div v-else class="contest-detail-page">
      <section class="contestInfo" style="position: relative">
        <LoadingOverlay :show="loadingInfo" />
        <div class="platform">{{ info.platform || "加载中" }}</div>
        <a
          v-if="info.contestUrl"
          class="title contest-title-link"
          :href="info.contestUrl"
          target="_blank"
          rel="noopener noreferrer"
          :aria-disabled="loadingInfo"
        >
          {{ info.contestName || "加载中" }}
        </a>
        <div v-else class="title">{{ info.contestName || "加载中" }}</div>
        <div class="time">
          <span>{{ info.time || "1970/1/1 00:00:00" }}</span>
          <span v-if="info.endTime" class="time-separator">至</span>
          <span v-if="info.endTime">{{ info.endTime }}</span>
        </div>
      </section>

      <div class="group-filter" v-if="groups.length > 0">
        <span class="filter-label">分组筛选：</span>
        <button
          class="filter-tab"
          :class="{ active: selectedGroupId === -1 }"
          type="button"
          @click="switchGroup(-1)"
        >
          全部
        </button>
        <button
          class="filter-tab"
          v-for="g in groups"
          :key="g.id"
          :class="{ active: selectedGroupId === g.id }"
          type="button"
          @click="switchGroup(g.id)"
        >
          {{ g.name }}
        </button>
      </div>

      <section class="matrix-section" style="position: relative">
        <LoadingOverlay :show="loadingRank" />
        <template v-if="rankRows.length > 0">
          <div class="matrix-heading">
            <div class="matrix-legend" aria-label="单元格图例">
              <span><i class="legend-dot contest-ac"></i>赛时 AC</span>
              <span><i class="legend-dot contest-failed"></i>赛时未过</span>
              <span><i class="legend-dot upsolve-ac"></i>赛后补题</span>
            </div>
          </div>

          <div class="matrix-scroll" aria-label="比赛逐题矩阵">
            <table class="matrix-table">
              <thead>
                <tr>
                  <th class="sticky-col sticky-rank">名次</th>
                  <th class="sticky-col sticky-user">参赛者</th>
                  <th class="sticky-col sticky-group">团队/分组</th>
                  <th class="sticky-col sticky-accepted">通过</th>
                  <th class="sticky-col sticky-penalty">罚时</th>
                  <th
                    v-for="problem in problems"
                    :key="problem.problemKey"
                    class="problem-col"
                    :title="problem.name || problem.index"
                  >
                    <a
                      v-if="problem.problemUrl"
                      class="problem-header-link"
                      :href="problem.problemUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span class="problem-index">{{ problem.index || "-" }}</span>
                      <small>{{ problem.contestAccepted }} / {{ problem.contestAttempted }}</small>
                    </a>
                    <span v-else class="problem-header-link is-disabled">
                      <span class="problem-index">{{ problem.index || "-" }}</span>
                      <small>{{ problem.contestAccepted }} / {{ problem.contestAttempted }}</small>
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in rankRows" :key="row.userId">
                  <td class="sticky-col sticky-rank rank-cell">{{ formatRank(row.rank) }}</td>
                  <td class="sticky-col sticky-user user-cell" @click="toProfile(row.userId)">
                    <img :src="row.avatar || '/images/defaultAvatar.png'" alt="" />
                    <div class="user-meta">
                      <strong>{{ row.name || "未知用户" }}</strong>
                      <span>@{{ formatUserHandle(row) }}</span>
                    </div>
                  </td>
                  <td
                    class="sticky-col sticky-group group-cell"
                    :title="formatGroupName(row.groupId)"
                  >
                    {{ formatGroupName(row.groupId) }}
                  </td>
                  <td class="sticky-col sticky-accepted score-cell">{{ row.acCount }}</td>
                  <td class="sticky-col sticky-penalty score-cell">
                    {{ formatPenalty(row.penalty) }}
                  </td>
                  <td
                    v-for="problem in problems"
                    :key="`${row.userId}-${problem.problemKey}`"
                    class="problem-cell"
                    :class="[
                      problemCellClass(getProblemResult(row, problem.problemKey)),
                      { 'is-clickable': Boolean(problem.problemUrl) },
                    ]"
                    :title="problemCellTitle(getProblemResult(row, problem.problemKey), problem)"
                    @click="openProblem(problem)"
                  >
                    <span>{{ formatProblemCell(getProblemResult(row, problem.problemKey)) }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="contest-mobile-list" aria-label="比赛逐题卡片">
            <article
              class="contest-mobile-card"
              v-for="row in rankRows"
              :key="`mobile-${row.userId}`"
            >
              <div class="mobile-card-header">
                <button class="mobile-user" type="button" @click="toProfile(row.userId)">
                  <img :src="row.avatar || '/images/defaultAvatar.png'" alt="" />
                  <span>
                    <strong>{{ row.name || "未知用户" }}</strong>
                    <small>{{ formatUserHandle(row) }}</small>
                  </span>
                </button>
                <div class="mobile-rank">{{ formatRank(row.rank) }}</div>
              </div>

              <div class="mobile-score-grid">
                <div>
                  <strong>{{ row.acCount }}</strong>
                  <span>通过</span>
                </div>
                <div>
                  <strong>{{ formatPenalty(row.penalty) }}</strong>
                  <span>罚时</span>
                </div>
                <div>
                  <strong>{{ formatGroupName(row.groupId) }}</strong>
                  <span>团队</span>
                </div>
              </div>

              <div class="mobile-problem-strip">
                <button
                  v-for="problem in problems"
                  :key="`${row.userId}-mobile-${problem.problemKey}`"
                  class="mobile-problem-chip"
                  :class="problemCellClass(getProblemResult(row, problem.problemKey))"
                  type="button"
                  :disabled="!problem.problemUrl"
                  :title="problemCellTitle(getProblemResult(row, problem.problemKey), problem)"
                  @click="openProblem(problem)"
                >
                  <span>{{ problem.index || "-" }}</span>
                  <strong>{{
                    formatProblemCell(getProblemResult(row, problem.problemKey)) || "-"
                  }}</strong>
                  <small>{{ problem.contestAccepted }}/{{ problem.contestAttempted }}</small>
                </button>
              </div>
            </article>
          </div>
        </template>
        <div v-else-if="!loadingRank" class="empty-placeholder">暂无排行数据</div>
      </section>

      <div class="pageNavigation" v-if="data && rankRows.length > 0">
        <div class="group">
          <button
            class="page-nav-btn"
            :disabled="data.currentPage <= 1"
            @click="getRankData(data.currentPage - 1)"
          >
            上一页
          </button>
          <div class="pageButtons">
            <button
              v-for="value in pages"
              :key="value"
              :class="value === data.currentPage ? 'active' : ''"
              @click="value === data.currentPage ? null : getRankData(value)"
            >
              {{ value }}
            </button>
          </div>
          <button
            class="page-nav-btn"
            :disabled="data.currentPage >= data.totalPage"
            @click="getRankData(data.currentPage + 1)"
          >
            下一页
          </button>
        </div>
        <div class="group">
          <div class="pageInput">
            <input
              type="number"
              min="1"
              :max="data.totalPage"
              v-model="jumppage"
              @keyup.enter="getRankData(jumppage)"
            />
            <button @click="getRankData(jumppage)">跳转</button>
          </div>
          <div class="pageSum">共 {{ data.totalPage }} 页</div>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import BaseLayout from "@/components/BaseLayout.vue"
import LoadingOverlay from "@/components/LoadingOverlay.vue"
import API from "@/utils/api"
import type {
  CoreContestProblemColumn,
  CoreContestProblemResult,
  CoreContestRankingData,
} from "@/utils/api"
import Toast from "@/utils/toast"
import type { platform } from "@/utils/type"
import { useUserStore } from "@/stores/user"

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const id = route.params.id
const requiresLoginMessage = ref(false)

const loadingInfo = ref(true)
const loadingRank = ref(true)

if (!id) {
  router.back()
}

const info = ref<{
  id: number
  platform: platform
  contestId: string
  contestName: string
  contestUrl: string
  totalCount: number
  time: string
  endTime: string
}>({
  id: 0,
  platform: "NowCoder",
  contestId: "",
  contestName: "",
  contestUrl: "",
  totalCount: 0,
  time: "",
  endTime: "",
})

const data = ref<{
  total: number
  totalPage: number
  currentPage: number
}>({
  total: 1,
  totalPage: 1,
  currentPage: 0,
})

const rankRows = ref<CoreContestRankingData[]>([])
const problems = ref<CoreContestProblemColumn[]>([])
const jumppage = ref(1)

const pages = computed(() => {
  if (!data.value) return []
  const currentPage = data.value.currentPage
  const totalPage = data.value.totalPage
  if (totalPage <= 3) return Array.from({ length: totalPage }, (_, i) => i + 1)
  if (currentPage <= 1) return [1, 2, 3]
  if (currentPage >= totalPage - 1) return [totalPage - 2, totalPage - 1, totalPage]
  return [currentPage - 1, currentPage, currentPage + 1]
})

const selectedGroupId = ref<number>(-1)
const groups = ref<{ id: number; name: string }[]>([])

const loadGroups = async () => {
  const collected: { id: number; name: string }[] = []
  let page = 1
  while (true) {
    const resp = await API.user.group.list(page)
    if (!resp.success) break
    collected.push(...resp.data.list.map((g: any) => ({ id: Number(g.id), name: g.name })))
    const totalPage = Math.max(1, Number(resp.data.totalPage || 1))
    if (page >= totalPage) break
    page += 1
  }
  groups.value = collected
}

const groupNameById = computed(() => {
  const map = new Map<number, string>()
  for (const group of groups.value) {
    const id = Number(group.id || 0)
    if (id > 0 && group.name) {
      map.set(id, group.name)
    }
  }
  return map
})

const formatGroupName = (groupId?: number) => {
  const id = Number(groupId || 0)
  if (!id) return "无团队"
  return groupNameById.value.get(id) || `团队 ${id}`
}

const formatUserHandle = (row: CoreContestRankingData) => {
  return row.username || row.name || String(row.userId)
}

const switchGroup = (groupId: number) => {
  if (selectedGroupId.value === groupId) return
  selectedGroupId.value = groupId
  data.value.totalPage = 1
  data.value.currentPage = 0
  getRankData(1)
}

const getRankData = async (page: number | string) => {
  const targetPage = Number(page)
  if (!userStore.isLogin) {
    requiresLoginMessage.value = true
    loadingInfo.value = false
    loadingRank.value = false
    return
  }

  if (!id) {
    router.back()
    return
  }

  if (!Number.isFinite(targetPage) || targetPage > data.value.totalPage || targetPage < 1) {
    return
  }

  loadingRank.value = true
  if (info.value.contestName === "") {
    loadingInfo.value = true
  }

  const limit = 10
  const offset = (targetPage - 1) * limit

  const request: any = {
    contestId: id.toString(),
    limit,
    offset,
  }
  if (selectedGroupId.value !== -1) {
    request.groupId = selectedGroupId.value
  }

  const response = await API.core.contest.ranking(request)
  Toast.stdResponse(response, false)

  if (response.success) {
    rankRows.value = response.data.data || []
    problems.value = response.data.problems || []

    const total = response.data.total || response.data.data.length
    data.value.total = total
    data.value.totalPage = Math.max(1, Math.ceil(total / limit))
    data.value.currentPage = targetPage
    jumppage.value = targetPage

    info.value = response.data.contest
    loadingInfo.value = false
  }

  loadingRank.value = false
}

const getProblemResult = (
  row: CoreContestRankingData,
  problemKey: string,
): CoreContestProblemResult | undefined => {
  return row.problemResults?.find((item) => item.problemKey === problemKey)
}

const formatRank = (rank: number) => {
  if (!rank || rank <= 0) return "-"
  return `#${rank}`
}

const formatPenalty = (penalty: number) => {
  if (!penalty || penalty <= 0) return "-"
  return penalty
}

const formatProblemCell = (result?: CoreContestProblemResult) => {
  if (!result || result.status === "none") return ""
  if (result.status === "contest_ac") {
    const minute = result.acceptedMinute > 0 ? String(result.acceptedMinute).padStart(2, "0") : "0"
    return result.wrongBeforeAc > 0 ? `${minute} (-${result.wrongBeforeAc})` : minute
  }
  if (result.status === "contest_failed") {
    return result.wrongAttempts > 0 ? `(-${result.wrongAttempts})` : ""
  }
  if (result.status === "upsolve_ac") {
    return result.wrongAttempts > 0 ? `+ (-${result.wrongAttempts})` : "+"
  }
  return ""
}

const problemCellClass = (result?: CoreContestProblemResult) => {
  if (!result || result.status === "none") return "is-empty"
  return {
    "is-contest-ac": result.status === "contest_ac",
    "is-contest-failed": result.status === "contest_failed",
    "is-upsolve-ac": result.status === "upsolve_ac",
  }
}

const problemCellTitle = (
  result: CoreContestProblemResult | undefined,
  problem: CoreContestProblemColumn,
) => {
  const name = problem.name || problem.index
  if (!result || result.status === "none") return `${name}：无提交`
  if (result.status === "contest_ac") {
    return `${name}：赛时 ${result.acceptedMinute} 分钟 AC，AC 前错误 ${result.wrongBeforeAc} 次`
  }
  if (result.status === "contest_failed") {
    return `${name}：赛时未 AC，错误提交 ${result.wrongAttempts} 次`
  }
  if (result.status === "upsolve_ac") {
    return `${name}：赛后补题 AC，补题前错误 ${result.wrongAttempts} 次`
  }
  return name
}

const toProfile = (userId: number) => {
  router.push(`/profile?id=${userId}`)
}

const openExternal = (url: string) => {
  if (!loadingInfo.value && url) {
    window.open(url, "_blank", "noopener,noreferrer")
  }
}

const openProblem = (problem: CoreContestProblemColumn) => {
  if (problem.problemUrl) {
    window.open(problem.problemUrl, "_blank", "noopener,noreferrer")
  }
}

onMounted(() => {
  if (!userStore.isLogin) {
    requiresLoginMessage.value = true
    loadingInfo.value = false
    loadingRank.value = false
    return
  }
  loadGroups()
  getRankData(1)
})
</script>

<style scoped>
@import "@/assets/css/navagation.css";

.contest-detail-page {
  min-width: 0;
  overflow-x: hidden;
}

.contestInfo {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: calc(100% - 40px);
  box-sizing: border-box;
  margin: 0 20px;
  padding: 20px;

  > .platform {
    color: var(--text-light-color);
    font-size: var(--text-sm);
  }

  > .title {
    color: var(--text-default-color);
    font-size: clamp(28px, 2.2vw, 38px);
    font-weight: bold;
    line-height: 1.18;
    overflow-wrap: anywhere;
  }

  > .contest-title-link {
    display: inline;
    width: fit-content;
    max-width: 100%;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--text-default-color);
    font-family: inherit;
    text-align: left;
    cursor: pointer;
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover:not(:disabled) {
      color: var(--neon-cyan);
      text-decoration: none;
    }

    &:focus-visible {
      color: var(--neon-cyan);
      text-decoration: none;
      outline: none;
    }

    &[aria-disabled="true"] {
      cursor: default;
    }
  }

  > .time {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    color: var(--text-light-color);
    font-size: var(--text-sm);
  }

  .time-separator {
    color: var(--text-secondary-color);
  }
}

.group-filter {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 20px;
  max-width: 100%;
  box-sizing: border-box;

  .filter-label {
    font-size: var(--text-sm);
    color: var(--text-light-color);
  }

  .filter-tab {
    min-height: var(--ds-control-height-sm, 30px);
    padding: 4px 12px;
    border-radius: var(--control-radius);
    font-family: inherit;
    font-size: var(--text-sm);
    font-weight: var(--ds-control-font-weight, 800);
    color: var(--text-light-color);
    background-color: var(--section-background-color);
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid transparent;
    -webkit-user-select: none;
    user-select: none;

    &:hover {
      color: var(--neon-cyan);
      border-color: var(--neon-cyan);
    }

    &.active {
      background-color: var(--neon-cyan);
      color: var(--background-color-1);
      border-color: var(--neon-cyan);
    }
  }
}

.matrix-section {
  width: calc(100% - 40px);
  margin: 10px 20px 0;
  padding: 18px;
  box-sizing: border-box;
  border: 1px solid var(--divider-color);
  border-radius: var(--control-radius);
  background-color: var(--background-color-content);
}

.matrix-heading {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.matrix-legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
  color: var(--text-secondary-color);
  font-size: var(--text-xs);
  white-space: nowrap;
}

.legend-dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  margin-right: 5px;
  border-radius: 999px;
}

.legend-dot.contest-ac {
  background-color: color-mix(in srgb, #22c55e 70%, var(--neon-cyan));
}

.legend-dot.contest-failed {
  background-color: #ef4444;
}

.legend-dot.upsolve-ac {
  background-color: color-mix(in srgb, var(--neon-cyan) 70%, #60a5fa);
}

.matrix-scroll {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  border: 1px solid var(--divider-color);
  border-radius: var(--control-radius);
  background-color: var(--background-color-1);
  overscroll-behavior-x: contain;
  touch-action: pan-x;
  scrollbar-width: thin;
  scrollbar-color: var(--neon-cyan) var(--background-color-3);
  -webkit-overflow-scrolling: touch;
}

.matrix-scroll::-webkit-scrollbar {
  height: 8px;
}

.matrix-scroll::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background-color: var(--neon-cyan);
}

.matrix-scroll::-webkit-scrollbar-track {
  background-color: var(--background-color-3);
}

.matrix-table {
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  color: var(--text-default-color);
  font-size: var(--text-sm);
}

.matrix-table th,
.matrix-table td {
  height: 58px;
  padding: 10px 12px;
  box-sizing: border-box;
  border-bottom: 1px solid var(--divider-color);
  vertical-align: middle;
  white-space: nowrap;
}

.matrix-table thead th {
  position: sticky;
  top: 0;
  z-index: 3;
  color: var(--text-secondary-color);
  background-color: var(--background-color-2);
  font-weight: 800;
}

.matrix-table tbody tr:last-child td {
  border-bottom: none;
}

.matrix-table tbody tr:hover td {
  background-color: color-mix(in srgb, var(--neon-cyan) 5%, var(--background-color-1));
}

.sticky-col {
  position: sticky;
  z-index: 2;
  background-color: var(--background-color-1);
}

thead .sticky-col {
  z-index: 4;
  background-color: var(--background-color-2);
}

.sticky-rank {
  left: 0;
  width: 64px;
  min-width: 64px;
}

.sticky-user {
  left: 64px;
  width: 190px;
  min-width: 190px;
}

.sticky-group {
  left: 254px;
  width: 112px;
  min-width: 112px;
}

.sticky-accepted {
  left: 366px;
  width: 74px;
  min-width: 74px;
  text-align: center;
}

.sticky-penalty {
  left: 440px;
  width: 74px;
  min-width: 74px;
  text-align: center;
}

.problem-col {
  min-width: 88px;
  text-align: center;

  .problem-header-link {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    max-width: 76px;
    padding: 0;
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    line-height: inherit;
    cursor: pointer;
    text-decoration: none;
    transition: color 0.2s ease;

    &.is-disabled {
      cursor: default;
    }
  }

  .problem-index {
    display: block;
    max-width: 68px;
    margin: 0 auto;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--text-default-color);
    font-weight: 900;
  }

  small {
    display: block;
    margin-top: 2px;
    color: var(--text-light-color);
    font-size: var(--text-xs);
    font-weight: 500;
  }
}

.rank-cell {
  color: var(--text-secondary-color);
  font-weight: 800;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  cursor: pointer;

  img {
    width: 36px;
    height: 36px;
    flex: 0 0 auto;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid var(--divider-color);
  }

  .user-meta {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;

    strong {
      max-width: 126px;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--text-default-color);
      white-space: nowrap;
    }

    span {
      display: block;
      max-width: 126px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--text-light-color);
      font-size: var(--text-xs);
    }
  }
}

.group-cell {
  color: var(--text-light-color);
  max-width: 112px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.score-cell {
  color: var(--text-default-color);
  font-weight: 800;
}

.problem-cell {
  min-width: 88px;
  text-align: center;
  color: var(--text-secondary-color);
  font-weight: 800;

  span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 28px;
    min-width: 42px;
    padding: 2px 6px;
    border-radius: var(--control-radius);
  }
}

.problem-cell.is-clickable {
  cursor: pointer;
}

.problem-cell.is-clickable:hover span {
  color: var(--neon-cyan);
}

.problem-cell.is-contest-ac {
  background-color: color-mix(in srgb, #22c55e 14%, var(--background-color-1));

  span {
    color: color-mix(in srgb, #16a34a 72%, var(--text-default-color));
  }
}

.problem-cell.is-contest-failed {
  background-color: color-mix(in srgb, #ef4444 12%, var(--background-color-1));

  span {
    color: color-mix(in srgb, #ef4444 76%, var(--text-default-color));
  }
}

.problem-cell.is-upsolve-ac {
  background-color: color-mix(in srgb, var(--neon-cyan) 14%, var(--background-color-1));

  span {
    color: var(--neon-cyan);
  }
}

.empty-placeholder {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-light-color);
  font-size: var(--text-base);
}

.contest-mobile-list {
  display: none;
}

.contest-mobile-card {
  border: 1px solid var(--divider-color);
  border-radius: var(--control-radius);
  background-color: var(--background-color-1);
  padding: 12px;
}

.mobile-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.mobile-user {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--text-default-color);
  font-family: inherit;
  text-align: left;
  cursor: pointer;

  img {
    width: 38px;
    height: 38px;
    flex: 0 0 auto;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid var(--divider-color);
  }

  span {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 3px;
  }

  strong,
  small {
    max-width: 190px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    color: var(--text-light-color);
    font-size: var(--text-xs);
  }
}

.mobile-rank {
  flex: 0 0 auto;
  color: var(--neon-cyan);
  font-size: var(--text-base);
  font-weight: 900;
}

.mobile-score-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 12px;

  div {
    min-width: 0;
    padding: 8px;
    border-radius: var(--control-radius);
    background-color: var(--section-background-color);
  }

  strong,
  span {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    color: var(--text-default-color);
    font-size: var(--text-base);
  }

  span {
    margin-top: 2px;
    color: var(--text-light-color);
    font-size: var(--text-xs);
  }
}

.mobile-problem-strip {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  overflow-x: auto;
  padding-bottom: 6px;
  scrollbar-width: thin;
  scrollbar-color: var(--neon-cyan) var(--background-color-3);
  -webkit-overflow-scrolling: touch;
}

.mobile-problem-strip::-webkit-scrollbar {
  height: 7px;
}

.mobile-problem-strip::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background-color: var(--neon-cyan);
}

.mobile-problem-strip::-webkit-scrollbar-track {
  background-color: var(--background-color-3);
}

.mobile-problem-chip {
  min-width: 72px;
  flex: 0 0 auto;
  padding: 8px 10px;
  border: 1px solid var(--divider-color);
  border-radius: var(--control-radius);
  background-color: var(--section-background-color);
  color: var(--text-secondary-color);
  font-family: inherit;
  font-weight: 800;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease;

  span,
  strong,
  small {
    display: block;
    text-align: center;
  }

  span {
    color: var(--text-light-color);
    font-size: var(--text-xs);
  }

  strong {
    margin: 4px 0;
    color: var(--text-default-color);
    font-size: var(--text-base);
  }

  small {
    color: var(--text-light-color);
    font-size: var(--text-xs);
    font-weight: 500;
  }

  &:hover:not(:disabled) {
    border-color: var(--neon-cyan);
    transform: translateY(-1px);
  }

  &:disabled {
    cursor: default;
  }
}

.mobile-problem-chip.is-contest-ac {
  background-color: color-mix(in srgb, #22c55e 14%, var(--section-background-color));
}

.mobile-problem-chip.is-contest-failed {
  background-color: color-mix(in srgb, #ef4444 12%, var(--section-background-color));
}

.mobile-problem-chip.is-upsolve-ac {
  background-color: color-mix(in srgb, var(--neon-cyan) 14%, var(--section-background-color));
}

@media (max-width: 900px) {
  .matrix-heading {
    flex-direction: column;
  }

  .matrix-legend {
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .contestInfo,
  .matrix-section {
    width: calc(100% - 24px);
    margin-left: 12px;
    margin-right: 12px;
    padding: 14px;
  }

  .contestInfo > .title {
    font-size: clamp(24px, 6vw, 30px);
  }

  .group-filter {
    padding: 10px 12px;
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .group-filter::-webkit-scrollbar {
    display: none;
  }

  .group-filter .filter-label,
  .group-filter .filter-tab {
    flex: 0 0 auto;
  }

  .matrix-scroll {
    display: none;
  }

  .contest-mobile-list {
    display: grid;
    gap: 12px;
  }

  .pageNavigation {
    width: calc(100% - 24px);
    margin: 12px;
    box-sizing: border-box;
  }

  .pageNavigation .group {
    flex-wrap: wrap;
  }
}

@media (max-width: 430px) {
  .contestInfo,
  .matrix-section {
    width: calc(100% - 16px);
    margin-left: 8px;
    margin-right: 8px;
    padding: 12px;
  }

  .matrix-heading h2 {
    font-size: var(--text-lg);
  }

  .matrix-legend {
    gap: 8px;
    white-space: normal;
  }

  .mobile-user strong,
  .mobile-user small {
    max-width: 150px;
  }

  .pageButtons {
    gap: 6px;
  }

  .pageInput {
    gap: 6px;
  }
}

@media (max-width: 390px) {
  .mobile-score-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .mobile-user strong,
  .mobile-user small {
    max-width: 128px;
  }
}
</style>
