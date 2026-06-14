<template>
  <div class="dashboardContent">
    <div class="section">
      <div class="header">
        <div class="header-title">
          <span class="title-icon">
            <font-awesome-icon icon="fa-solid fa-server" />
          </span>
          <span class="title-text">运维总览</span>
        </div>
        <div class="header-tabs">
          <span class="tab" @click="refreshOperations">刷新全部</span>
        </div>
      </div>
      <div class="content" style="position: relative">
        <LoadingOverlay :show="loadingOps" />
        <div class="ops-grid">
          <div class="ops-card">
            <span>当前前端版本</span>
            <strong>v1.1.5</strong>
            <em>{{ shortGitHash }} · {{ gitDateLabel }}</em>
          </div>
          <div class="ops-card" :class="serviceHealthClass">
            <span>服务健康</span>
            <strong>{{ healthyServiceCount }}/{{ serviceStatuses.length }}</strong>
            <em>{{ serviceHealthSummary }}</em>
          </div>
          <div class="ops-card">
            <span>缓存状态</span>
            <strong>{{ activeCacheCount }}/{{ cacheKeys.length }}</strong>
            <em>当前查询范围：{{ cacheUserId === -1 ? "全站" : `用户 ${cacheUserId}` }}</em>
          </div>
          <div class="ops-card" :class="{ warn: activeJobCount > 0, danger: failedJobCount > 0 }">
            <span>抓取任务</span>
            <strong>{{ activeJobCount }} 运行 / {{ failedJobCount }} 失败</strong>
            <em>最近展示 {{ spiderJobs.length }} 条任务</em>
          </div>
          <div class="ops-card">
            <span>操作日志</span>
            <strong>{{ operationLogs.length }}</strong>
            <em>用户服务 + 核心数据服务</em>
          </div>
        </div>
        <div class="service-grid">
          <div
            class="service-card"
            v-for="service in serviceStatuses"
            :key="service.key"
            :class="service.status"
          >
            <div>
              <strong>{{ service.name }}</strong>
              <span>{{ service.description }}</span>
            </div>
            <em>{{
              service.status === "ok" ? "正常" : service.status === "checking" ? "检查中" : "异常"
            }}</em>
          </div>
        </div>
        <div class="failure-panel" v-if="recentFailedJobs.length > 0">
          <div class="failure-title">最近失败任务</div>
          <div class="failure-row" v-for="job in recentFailedJobs" :key="`failed-${job.jobId}`">
            <span
              >#{{ job.jobId }} · 用户 {{ job.userId }} ·
              {{ job.currentPlatform || "全平台" }}</span
            >
            <p>{{ job.error || "未记录失败原因" }}</p>
          </div>
        </div>
        <div class="empty" v-else>当前没有失败抓取任务。</div>
      </div>
    </div>
    <div class="section">
      <div class="header">
        <div class="header-title">
          <span class="title-icon">
            <font-awesome-icon icon="fa-solid fa-clipboard-list" />
          </span>
          <span class="title-text">运维审计</span>
        </div>
        <div class="header-tabs">
          <span class="tab" @click="loadOperationLogs">刷新</span>
        </div>
      </div>
      <div class="content" style="position: relative">
        <LoadingOverlay :show="loadingOperationLogs" />
        <div class="log-toolbar">
          <input v-model="operationAction" type="text" placeholder="按 action 精确筛选，可留空" />
          <button class="action-btn" @click="loadOperationLogs">查看日志</button>
        </div>
        <div class="hint">
          记录改角色、删用户、清缓存、重爬数据、改团队等高风险操作，方便线上问题回溯。
        </div>
        <div class="operation-list" v-if="operationLogs.length > 0">
          <div
            class="operation-card"
            v-for="item in operationLogs"
            :key="`${item.service}-${item.id}`"
          >
            <div class="operation-main">
              <div class="operation-title">
                <strong>{{ actionLabel(item.action) }}</strong>
                <span>{{ item.service }}</span>
              </div>
              <div class="operation-meta">
                操作者 {{ item.operatorId || "未知" }} · {{ roleLabel(item.operatorRole) }}
                <template v-if="item.targetType">
                  · 目标 {{ item.targetType }} #{{ item.targetId }}</template
                >
              </div>
              <pre v-if="formatDetail(item.detail)" class="operation-detail">{{
                formatDetail(item.detail)
              }}</pre>
            </div>
            <div class="operation-time">{{ formatTime(item.createdAt) }}</div>
          </div>
        </div>
        <div v-else class="empty">暂无操作日志。</div>
      </div>
    </div>
    <div class="section">
      <div class="header">
        <div class="header-title">
          <span class="title-icon">
            <font-awesome-icon icon="fa-solid fa-key" />
          </span>
          <span class="title-text">邀请码设置</span>
        </div>
        <div class="header-tabs">
          <span class="tab" @click="loadInviteCode">刷新</span>
        </div>
      </div>
      <div class="content" style="position: relative">
        <LoadingOverlay :show="loading" />
        <div class="form-grid">
          <div class="field">
            <label>注册邀请码</label>
            <input v-model="inviteCode" type="text" placeholder="请输入注册邀请码" />
            <div class="hint">默认邀请码为 <code>wustacm666</code>，只有管理员可以修改。</div>
          </div>
          <div class="actions">
            <button class="action-btn" :disabled="loading" @click="saveInviteCode">
              保存邀请码
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="section">
      <div class="header">
        <div class="header-title">
          <span class="title-icon">
            <font-awesome-icon icon="fa-solid fa-database" />
          </span>
          <span class="title-text">统计缓存</span>
        </div>
        <div class="header-tabs">
          <span class="tab" @click="loadCacheStatus">刷新</span>
        </div>
      </div>
      <div class="content" style="position: relative">
        <LoadingOverlay :show="loadingCache" />
        <div class="cache-toolbar">
          <input v-model.number="cacheUserId" type="number" placeholder="-1 表示全站缓存" />
          <button class="action-btn" @click="loadCacheStatus">查看缓存</button>
          <button class="action-btn danger" :disabled="clearingCache" @click="clearStatisticCache">
            {{ clearingCache ? "清理中" : "清理缓存" }}
          </button>
        </div>
        <div class="hint">`-1` 表示全站统计缓存；填写用户 ID 可查看/清理该用户统计与提交缓存。</div>
        <div class="cache-list" v-if="cacheKeys.length > 0">
          <div class="cache-row" v-for="item in cacheKeys" :key="item.key">
            <code>{{ item.key }}</code>
            <span :class="{ active: item.exists }">{{ item.exists ? "存在" : "不存在" }}</span>
            <span>TTL {{ formatTTL(item.ttl) }}</span>
          </div>
        </div>
        <div v-else class="empty">暂无缓存信息。</div>
      </div>
    </div>
    <div class="section">
      <div class="header">
        <div class="header-title">
          <span class="title-icon">
            <font-awesome-icon icon="fa-solid fa-arrows-rotate" />
          </span>
          <span class="title-text">抓取任务</span>
        </div>
        <div class="header-tabs">
          <span class="tab" @click="loadSpiderJobs">刷新</span>
        </div>
      </div>
      <div class="content" style="position: relative">
        <LoadingOverlay :show="loadingJobs" />
        <div class="job-toolbar">
          <button
            v-for="item in jobFilters"
            :key="item.value"
            class="job-filter"
            :class="{ active: jobStatus === item.value }"
            @click="setJobStatus(item.value)"
          >
            {{ item.label }}
          </button>
        </div>
        <div class="job-list" v-if="spiderJobs.length > 0">
          <div
            class="job-card"
            v-for="job in spiderJobs"
            :key="job.jobId"
            :class="`job-${job.status}`"
          >
            <div class="job-main">
              <div class="job-title-row">
                <strong>#{{ job.jobId }}</strong>
                <span>{{ jobStatusLabel(job.status) }}</span>
              </div>
              <div class="job-meta">
                用户 {{ job.userId }} · {{ sourceLabel(job.source) }}
                <template v-if="job.currentPlatform"> · {{ job.currentPlatform }} </template>
              </div>
              <div v-if="job.error" class="job-error">{{ job.error }}</div>
            </div>
            <div class="job-side">
              <div class="job-time">{{ formatTime(job.updatedAt || job.createdAt) }}</div>
              <div class="job-progress">
                <div :style="{ width: jobProgress(job) + '%' }"></div>
              </div>
              <div class="job-count">{{ job.finishedPlatforms }}/{{ job.totalPlatforms || 0 }}</div>
              <button
                v-if="job.status === 'failed'"
                class="action-btn retry-btn"
                :disabled="retryingJobs[job.jobId]"
                @click="retrySpiderJob(job.jobId)"
              >
                {{ retryingJobs[job.jobId] ? "重试中" : "重试" }}
              </button>
            </div>
          </div>
        </div>
        <div v-else class="empty">暂无抓取任务。</div>
      </div>
    </div>
    <div class="section">
      <div class="header">
        <div class="header-title">
          <span class="title-icon">
            <font-awesome-icon icon="fa-solid fa-magnifying-glass-chart" />
          </span>
          <span class="title-text">抓取数据审计</span>
        </div>
        <div class="header-tabs">
          <span class="tab" @click="loadSpiderAudit">查询</span>
        </div>
      </div>
      <div class="content" style="position: relative">
        <LoadingOverlay :show="loadingAudit" />
        <div class="audit-toolbar">
          <input v-model.number="auditUserId" type="number" placeholder="输入用户 ID" />
          <button class="action-btn" @click="loadSpiderAudit">查看审计</button>
        </div>
        <div class="hint">
          展示每个平台从“原始抓取”到“最终计入 AC”的完整链路，用来解释 AC 数和 OJ 主页口径差异。
        </div>
        <div class="audit-list" v-if="spiderAuditRows.length > 0">
          <div class="audit-card" v-for="item in spiderAuditRows" :key="item.platform">
            <div class="audit-head">
              <div>
                <strong>{{ item.platform }}</strong>
                <span>@{{ item.username }} · {{ formatTime(item.lastSuccessAt) }}</span>
              </div>
              <em :class="{ stale: item.isStale, failed: item.status === 'failed' }">
                {{
                  item.status === "success" && !item.isStale
                    ? "已同步"
                    : item.status === "running"
                      ? "抓取中"
                      : "未同步"
                }}
              </em>
            </div>
            <div class="audit-metrics">
              <div>
                <b>{{ item.lastRawFetchedCount || 0 }}</b
                ><span>本次原始</span>
              </div>
              <div>
                <b>{{ item.lastFetchedCount || 0 }}</b
                ><span>本次有效</span>
              </div>
              <div>
                <b>{{ item.rawSubmitCount }}</b
                ><span>库内原始</span>
              </div>
              <div>
                <b>{{ item.distinctSubmitCount }}</b
                ><span>去重提交</span>
              </div>
              <div>
                <b>{{ item.acceptedSubmitCount }}</b
                ><span>AC 提交</span>
              </div>
              <div>
                <b>{{ item.distinctAcCount }}</b
                ><span>去重 AC</span>
              </div>
              <div>
                <b>{{ item.filteredDuplicateCount || 0 }}</b
                ><span>去重过滤</span>
              </div>
              <div>
                <b>{{ item.filteredAbnormalCount || 0 }}</b
                ><span>异常/跳过</span>
              </div>
            </div>
            <div class="audit-notes">
              <p v-for="note in item.auditNotes" :key="note">{{ note }}</p>
              <p v-if="item.lastError" class="audit-error">最近错误：{{ item.lastError }}</p>
            </div>
          </div>
        </div>
        <div v-else class="empty">输入用户 ID 后可以查看平台抓取审计。</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import API from "@/utils/api"
import Toast from "@/utils/toast"
import LoadingOverlay from "@/components/LoadingOverlay.vue"
import type { OperationLogItem, SpiderAuditItem, SpiderJobInfo } from "@/utils/api"

const loading = ref(false)
const loadingJobs = ref(false)
const loadingOps = ref(false)
const loadingOperationLogs = ref(false)
const inviteCode = ref("")
const spiderJobs = ref<SpiderJobInfo[]>([])
const operationLogs = ref<OperationLogItem[]>([])
const operationAction = ref("")
const jobStatus = ref("")
const retryingJobs = ref<Record<number, boolean>>({})
const loadingCache = ref(false)
const clearingCache = ref(false)
const loadingAudit = ref(false)
const cacheUserId = ref(-1)
const auditUserId = ref<number | null>(null)
const cacheKeys = ref<{ key: string; exists: boolean; ttl: number }[]>([])
const spiderAuditRows = ref<SpiderAuditItem[]>([])
const serviceStatuses = ref([
  { key: "user", name: "User 服务", description: "邀请码、用户和权限接口", status: "checking" },
  { key: "core", name: "Core Data 服务", description: "统计、缓存和抓取接口", status: "checking" },
  { key: "spider", name: "Spider 队列", description: "抓取任务查询与重试", status: "checking" },
])

const shortGitHash = __GIT_HASH__ ? __GIT_HASH__.slice(0, 7) : "unknown"
const gitDateLabel = __GIT_DATE__ || "unknown"

const activeCacheCount = computed(() => cacheKeys.value.filter((item) => item.exists).length)
const activeJobCount = computed(
  () => spiderJobs.value.filter((job) => ["queued", "running"].includes(job.status)).length,
)
const failedJobCount = computed(
  () => spiderJobs.value.filter((job) => job.status === "failed").length,
)
const recentFailedJobs = computed(() =>
  spiderJobs.value.filter((job) => job.status === "failed").slice(0, 3),
)
const healthyServiceCount = computed(
  () => serviceStatuses.value.filter((service) => service.status === "ok").length,
)
const serviceHealthClass = computed(() => ({
  warn: healthyServiceCount.value > 0 && healthyServiceCount.value < serviceStatuses.value.length,
  danger: healthyServiceCount.value === 0,
}))
const serviceHealthSummary = computed(() => {
  const failed = serviceStatuses.value.filter((service) => service.status === "failed")
  if (failed.length === 0) return "全部探测正常"
  return `${failed.map((item) => item.name).join("、")} 异常`
})

const actionLabels: Record<string, string> = {
  "profile.delete": "删除用户",
  "profile.change_password": "修改密码",
  "profile.set_role": "设置角色",
  "profile.move_group": "移动分组",
  "group.create": "创建团队/分组",
  "group.update": "更新团队/分组",
  "group.delete": "删除团队/分组",
  "team.create": "创建团队",
  "team.update": "更新团队",
  "team.invite": "邀请成员",
  "team.remove_member": "移除成员",
  "team.transfer_owner": "转移队长",
  "team.leave": "退出团队",
  "team.disband": "解散团队",
  "message.broadcast": "群发消息",
  "spider.update": "更新 OJ 数据",
  "spider.retry": "重试抓取",
  "spider.rebuild_all": "重爬全站",
  "spider.set": "绑定 OJ 账号",
  "statistic.clear_cache": "清理统计缓存",
  "snapshot.save": "保存功能快照",
  "snapshot.cleanup": "清理功能快照",
}

const jobFilters = [
  { label: "全部", value: "" },
  { label: "排队中", value: "queued" },
  { label: "抓取中", value: "running" },
  { label: "失败", value: "failed" },
  { label: "已完成", value: "success" },
]

const loadInviteCode = async () => {
  loading.value = true
  const response = await API.user.system.getRegisterInviteCode()
  Toast.stdResponse(response, false)
  if (response.success) {
    inviteCode.value = response.data.inviteCode
  }
  loading.value = false
}

const saveInviteCode = async () => {
  loading.value = true
  const response = await API.user.system.updateRegisterInviteCode({
    inviteCode: inviteCode.value.trim(),
  })
  Toast.stdResponse(response)
  if (response.success) {
    inviteCode.value = response.data.inviteCode
  }
  loading.value = false
}

const loadCacheStatus = async () => {
  loadingCache.value = true
  const response = await API.core.statistic.cacheStatus(Number(cacheUserId.value || -1))
  Toast.stdResponse(response, false)
  if (response.success) {
    cacheKeys.value = response.data.keys || []
  }
  loadingCache.value = false
}

const clearStatisticCache = async () => {
  clearingCache.value = true
  const response = await API.core.statistic.clearCache(Number(cacheUserId.value || -1))
  Toast.stdResponse(response)
  clearingCache.value = false
  if (response.success) {
    await loadCacheStatus()
  }
}

const loadSpiderAudit = async () => {
  const userId = Number(auditUserId.value || 0)
  if (!userId || userId <= 0) {
    Toast.error("请输入需要审计的用户 ID")
    return
  }
  loadingAudit.value = true
  const response = await API.core.spider.audit(userId)
  Toast.stdResponse(response, false, true)
  if (response.success) {
    spiderAuditRows.value = response.data.data || []
  }
  loadingAudit.value = false
}

const loadOperationLogs = async () => {
  loadingOperationLogs.value = true
  const request = {
    page: 1,
    pageSize: 50,
    action: operationAction.value.trim() || undefined,
  }
  const [userResult, coreResult] = await Promise.allSettled([
    API.user.system.operationLogs(request),
    API.core.operationLogs(request),
  ])
  const rows: OperationLogItem[] = []
  if (userResult.status === "fulfilled" && userResult.value.success) {
    rows.push(...(userResult.value.data.data || []))
  }
  if (coreResult.status === "fulfilled" && coreResult.value.success) {
    rows.push(...(coreResult.value.data.data || []))
  }
  const failed = [userResult, coreResult].some(
    (item) => item.status === "fulfilled" && !item.value.success,
  )
  if (failed) {
    Toast.error("部分操作日志获取失败")
  }
  operationLogs.value = rows
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
    .slice(0, 80)
  loadingOperationLogs.value = false
}

const formatTTL = (ttl: number) => {
  if (ttl === -1) return "永久"
  if (ttl < 0) return "-"
  if (ttl < 60) return `${ttl}s`
  if (ttl < 3600) return `${Math.round(ttl / 60)}min`
  return `${Math.round(ttl / 3600)}h`
}

const loadSpiderJobs = async () => {
  loadingJobs.value = true
  const response = await API.core.spider.jobs({
    scope: "all",
    status: jobStatus.value || undefined,
    page: 1,
    pageSize: 30,
  })
  Toast.stdResponse(response, false)
  if (response.success) {
    spiderJobs.value = response.data.data || []
  }
  loadingJobs.value = false
}

const setServiceStatus = (key: string, status: string) => {
  serviceStatuses.value = serviceStatuses.value.map((service) =>
    service.key === key ? { ...service, status } : service,
  )
}

const loadServiceStatuses = async () => {
  serviceStatuses.value = serviceStatuses.value.map((service) => ({
    ...service,
    status: "checking",
  }))
  const [userResult, coreResult, spiderResult] = await Promise.allSettled([
    API.user.system.getRegisterInviteCode(),
    API.core.statistic.explanation(),
    API.core.spider.jobs({ scope: "all", page: 1, pageSize: 1 }),
  ])

  setServiceStatus(
    "user",
    userResult.status === "fulfilled" && userResult.value.success ? "ok" : "failed",
  )
  setServiceStatus(
    "core",
    coreResult.status === "fulfilled" && coreResult.value.success ? "ok" : "failed",
  )
  setServiceStatus(
    "spider",
    spiderResult.status === "fulfilled" && spiderResult.value.success ? "ok" : "failed",
  )
}

const refreshOperations = async () => {
  loadingOps.value = true
  await Promise.all([
    loadServiceStatuses(),
    loadCacheStatus(),
    loadSpiderJobs(),
    loadOperationLogs(),
  ])
  loadingOps.value = false
}

const setJobStatus = (status: string) => {
  jobStatus.value = status
  loadSpiderJobs()
}

const retrySpiderJob = async (jobId: number) => {
  retryingJobs.value = { ...retryingJobs.value, [jobId]: true }
  const response = await API.core.spider.retry(jobId)
  Toast.stdResponse(response)
  retryingJobs.value = { ...retryingJobs.value, [jobId]: false }
  if (response.success) {
    await loadSpiderJobs()
  }
}

const jobStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    queued: "排队中",
    running: "抓取中",
    success: "已完成",
    failed: "失败",
  }
  return map[status] || status
}

const sourceLabel = (source: string) => {
  const map: Record<string, string> = {
    manual: "手动刷新",
    cron: "定时刷新",
    bind: "绑定触发",
  }
  return map[source] || source || "未知来源"
}

const jobProgress = (job: SpiderJobInfo) => {
  if (job.status === "success") return 100
  if (job.totalPlatforms <= 0) return job.status === "running" ? 20 : 8
  return Math.max(8, Math.min(100, Math.round((job.finishedPlatforms / job.totalPlatforms) * 100)))
}

const formatTime = (timestamp: number) => {
  if (!timestamp) return "未知时间"
  return new Date(timestamp * 1000).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

const actionLabel = (action: string) => actionLabels[action] || action || "未知操作"

const roleLabel = (roleId: number) => {
  if (roleId === 1) return "管理员"
  if (roleId === 2) return "教练"
  return "普通用户"
}

const formatDetail = (detail: Record<string, any> = {}) => {
  const entries = Object.entries(detail || {}).filter(
    ([, value]) => value !== undefined && value !== null && value !== "",
  )
  if (entries.length === 0) return ""
  return entries
    .slice(0, 6)
    .map(
      ([key, value]) =>
        `${key}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`,
    )
    .join(" · ")
}

onMounted(() => {
  loadInviteCode()
  refreshOperations()
})
</script>

<style scoped>
.dashboardContent {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.section {
  border: 1px solid var(--divider-color);
  background-color: var(--section-background-color);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--divider-color);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-default-color);
  font-size: var(--text-lg);
}

.header-tabs .tab {
  cursor: pointer;
  color: var(--text-light-color);
  transition: color 0.2s ease-in-out;
}

.header-tabs .tab:hover {
  color: var(--section-active-color);
}

.content {
  padding: 24px 20px;
}

.ops-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.ops-card {
  display: flex;
  min-height: 118px;
  flex-direction: column;
  justify-content: space-between;
  gap: 10px;
  padding: 16px;
  border: 1px solid var(--divider-color);
  border-radius: 14px;
  background-color: var(--background-color-1);
}

.ops-card span,
.service-card span,
.failure-row p {
  color: var(--text-light-color);
  font-size: var(--text-sm);
  line-height: 1.6;
}

.ops-card strong {
  color: var(--text-default-color);
  font-size: 1.75rem;
  line-height: 1.1;
}

.ops-card em,
.service-card em {
  color: var(--section-active-color);
  font-style: normal;
  font-size: var(--text-xs);
  font-weight: 800;
}

.ops-card.warn {
  border-color: color-mix(in srgb, #ffb020 50%, var(--divider-color));
}

.ops-card.warn em {
  color: #ffb020;
}

.ops-card.danger {
  border-color: color-mix(in srgb, #ff8585 50%, var(--divider-color));
}

.ops-card.danger em,
.service-card.failed em {
  color: #ff8585;
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

.service-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--divider-color);
  border-radius: 12px;
  background-color: var(--background-color-1);
}

.service-card div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.service-card strong {
  color: var(--text-default-color);
  font-size: var(--text-sm);
}

.service-card.ok {
  border-color: color-mix(in srgb, var(--active-color) 35%, var(--divider-color));
}

.service-card.failed {
  border-color: color-mix(in srgb, #ff8585 45%, var(--divider-color));
}

.failure-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 4px;
}

.failure-title {
  color: var(--text-default-color);
  font-size: var(--text-sm);
  font-weight: 800;
}

.failure-row {
  padding: 10px 12px;
  border: 1px solid color-mix(in srgb, #ff8585 35%, var(--divider-color));
  border-radius: 10px;
  background-color: var(--background-color-1);
}

.failure-row span {
  color: #ff8585;
  font-size: var(--text-sm);
  font-weight: 800;
}

.failure-row p {
  margin: 4px 0 0;
  overflow-wrap: anywhere;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 520px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field label {
  color: var(--text-default-color);
  font-size: var(--text-base);
}

.field input {
  height: 40px;
  padding: 0 14px;
  color: var(--text-default-color);
  background-color: var(--background-color-1);
  border: 1px solid var(--divider-color);
  border-radius: 6px;
  outline: none;
  box-shadow: 0 0 0 100px var(--background-color-1) inset;
}

.field input:focus {
  border-color: var(--input-active-color);
}

.hint {
  color: var(--text-light-color);
  font-size: var(--text-sm);
  line-height: 1.6;
}

.hint code {
  color: var(--section-active-color);
}

.actions {
  display: flex;
}

.action-btn {
  min-width: 120px;
  height: 34px;
  padding: 0 14px;
  border: 1px solid var(--divider-color);
  border-radius: 8px;
  background-color: var(--background-color-1);
  color: var(--text-default-color);
  font-family: inherit;
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.action-btn:hover:not(:disabled) {
  background-color: var(--section-active-color);
  border-color: var(--section-active-color);
  color: var(--background-color-1);
}

.action-btn.danger:hover:not(:disabled) {
  background-color: #ff8585;
  border-color: #ff8585;
  color: white;
}

.action-btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.job-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.job-filter {
  min-width: 72px;
}

.retry-btn {
  min-width: 64px;
  height: 30px;
}

.cache-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}

.cache-toolbar input {
  width: 180px;
  height: 34px;
  padding: 0 12px;
  color: var(--text-default-color);
  background-color: var(--background-color-1);
  border: 1px solid var(--divider-color);
  border-radius: 8px;
  outline: none;
  font-family: inherit;
}

.audit-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}

.audit-toolbar input {
  width: 180px;
  height: 34px;
  padding: 0 12px;
  color: var(--text-default-color);
  background-color: var(--background-color-1);
  border: 1px solid var(--divider-color);
  border-radius: 8px;
  outline: none;
  font-family: inherit;
}

.audit-toolbar input:focus {
  border-color: var(--input-active-color);
}

.log-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}

.log-toolbar input {
  width: min(360px, 100%);
  height: 34px;
  padding: 0 12px;
  color: var(--text-default-color);
  background-color: var(--background-color-1);
  border: 1px solid var(--divider-color);
  border-radius: 8px;
  outline: none;
  font-family: inherit;
}

.log-toolbar input:focus {
  border-color: var(--input-active-color);
}

.operation-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 14px;
}

.operation-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 120px;
  gap: 14px;
  padding: 14px;
  border: 1px solid var(--divider-color);
  border-radius: 12px;
  background-color: var(--background-color-1);
}

.operation-main {
  min-width: 0;
}

.operation-title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.operation-title strong {
  color: var(--text-default-color);
  font-size: var(--text-base);
}

.operation-title span {
  padding: 2px 8px;
  border: 1px solid var(--divider-color);
  border-radius: 999px;
  color: var(--section-active-color);
  font-size: var(--text-xs);
}

.operation-meta,
.operation-time {
  margin-top: 6px;
  color: var(--text-light-color);
  font-size: var(--text-sm);
  line-height: 1.6;
}

.operation-time {
  margin-top: 0;
  text-align: right;
}

.operation-detail {
  margin: 8px 0 0;
  padding: 8px 10px;
  border-radius: 8px;
  color: var(--text-light-color);
  background-color: var(--background-color-2);
  font-family: inherit;
  font-size: var(--text-xs);
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.audit-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 14px;
}

.audit-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--divider-color);
  border-radius: 12px;
  background-color: var(--background-color-1);
}

.audit-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.audit-head div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.audit-head strong {
  color: var(--text-default-color);
  font-size: var(--text-base);
}

.audit-head span,
.audit-notes p {
  color: var(--text-light-color);
  font-size: var(--text-sm);
  line-height: 1.6;
}

.audit-head em {
  flex-shrink: 0;
  color: var(--active-color);
  font-style: normal;
  font-size: var(--text-sm);
  font-weight: 800;
}

.audit-head em.stale {
  color: #ffb020;
}

.audit-head em.failed,
.audit-error {
  color: #ff8585 !important;
}

.audit-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.audit-metrics div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border: 1px solid var(--divider-color);
  border-radius: 10px;
  background-color: var(--background-color-2);
}

.audit-metrics b {
  color: var(--section-active-color);
  font-size: var(--text-lg);
}

.audit-metrics span {
  color: var(--text-light-color);
  font-size: var(--text-xs);
}

.audit-notes {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 2px;
}

.audit-notes p {
  margin: 0;
}

.cache-toolbar input:focus {
  border-color: var(--input-active-color);
}

.cache-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
}

.cache-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 72px 80px;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid var(--divider-color);
  border-radius: 10px;
  color: var(--text-light-color);
  background-color: var(--background-color-1);
  font-size: var(--text-sm);
}

.cache-row code {
  color: var(--text-default-color);
  overflow-wrap: anywhere;
}

.cache-row span.active {
  color: var(--active-color);
  font-weight: 800;
}

.job-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.job-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 180px;
  gap: 16px;
  padding: 14px;
  border: 1px solid var(--divider-color);
  border-radius: 12px;
  background-color: var(--background-color-1);
}

.job-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-default-color);
}

.job-title-row span {
  color: var(--section-active-color);
  font-size: var(--text-sm);
}

.job-meta,
.job-time,
.job-count,
.empty {
  color: var(--text-light-color);
  font-size: var(--text-sm);
  line-height: 1.6;
}

.job-error {
  margin-top: 8px;
  color: #ff8585;
  font-size: var(--text-xs);
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.job-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 8px;
}

.job-progress {
  width: 100%;
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background-color: var(--background-color-2);
}

.job-progress div {
  height: 100%;
  border-radius: inherit;
  background-color: var(--section-active-color);
}

.job-failed .job-progress div {
  background-color: #ff8585;
}

.job-success .job-progress div {
  background-color: var(--active-color);
}

@media (max-width: 720px) {
  .header {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .content {
    padding: 18px 14px;
  }

  .job-card {
    grid-template-columns: 1fr;
  }

  .operation-card {
    grid-template-columns: 1fr;
  }

  .operation-time {
    text-align: left;
  }

  .cache-row {
    grid-template-columns: 1fr;
  }

  .job-side {
    align-items: stretch;
  }

  .ops-grid,
  .service-grid,
  .audit-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
