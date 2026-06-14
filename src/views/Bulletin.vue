<template>
  <BaseLayout>
    <div class="bulletin-page">
      <div class="page-header">
        <div class="header-title">
          <span class="title-icon">
            <font-awesome-icon icon="fa-solid fa-envelope" />
          </span>
          <span class="title-text">消息</span>
        </div>
      </div>

      <section class="dm-shell">
        <LoadingOverlay :show="dmLoading" />
        <aside class="conversation-list">
          <template v-if="userStore.isLogin">
            <div class="dm-search">
              <input
                v-model="dmSearchKeyword"
                placeholder="搜索用户开始私信"
                @keydown.enter.prevent="searchDirectMessageUsers"
              />
              <button @click="searchDirectMessageUsers" :disabled="dmSearchLoading">搜索</button>
            </div>
            <div v-if="dmSearchCandidates.length > 0" class="dm-candidates">
              <button
                v-for="candidate in dmSearchCandidates"
                :key="candidate.userId"
                class="dm-candidate"
                @click="openThread(Number(candidate.userId))"
              >
                {{ candidate.name }} #{{ candidate.userId }}
              </button>
            </div>
          </template>

          <button
            class="conversation-item system-entry"
            :class="{ active: activeTab === 'system' }"
            @click="openSystemMessages"
          >
            <span class="system-entry-icon">
              <font-awesome-icon icon="fa-solid fa-bell" />
            </span>
            <div class="conversation-main">
              <div class="conversation-top">
                <span class="conversation-name">系统消息</span>
                <span class="conversation-time">置顶</span>
              </div>
              <div class="conversation-preview">团队邀请与站内通知</div>
            </div>
            <span v-if="invites.length > 0" class="unread-dot">{{ invites.length }}</span>
          </button>

          <template v-if="userStore.isLogin">
            <div v-if="conversations.length === 0 && !dmLoading" class="empty-tip compact">
              暂无私信
            </div>
            <button
              v-for="conversation in conversations"
              :key="conversation.threadId"
              class="conversation-item"
              :class="{
                active: activeTab === 'dm' && selectedUserId === conversation.otherUser.userId,
              }"
              @click="openThread(conversation.otherUser.userId)"
            >
              <img
                :src="avatarOf(conversation.otherUser.avatar)"
                :alt="conversation.otherUser.name"
              />
              <div class="conversation-main">
                <div class="conversation-top">
                  <span class="conversation-name">{{
                    conversation.otherUser.name || conversation.otherUser.username || "已注销用户"
                  }}</span>
                  <span class="conversation-time">{{ shortTime(conversation.lastSentAt) }}</span>
                </div>
                <div class="conversation-preview">
                  <span v-if="conversation.lastSenderId === currentUserId">我：</span
                  >{{ conversation.lastMessagePreview || "暂无消息" }}
                </div>
              </div>
              <span v-if="conversation.unreadCount > 0" class="unread-dot">{{
                conversation.unreadCount
              }}</span>
            </button>
          </template>
          <div v-else class="empty-tip compact">登录后可以收发私信</div>
        </aside>

        <main class="thread-panel">
          <template v-if="activeTab === 'system'">
            <div class="thread-header system-header">
              <span class="system-entry-icon">
                <font-awesome-icon icon="fa-solid fa-bell" />
              </span>
              <div>
                <div class="thread-name">系统消息</div>
                <div class="thread-subtitle">团队邀请与站内通知</div>
              </div>
            </div>
            <div class="system-message-panel">
              <div class="bulletin-list" style="position: relative">
                <LoadingOverlay :show="loading" />
                <div
                  v-if="bulletins.length === 0 && invites.length === 0 && !loading"
                  class="empty-tip"
                >
                  暂无系统消息
                </div>
                <div
                  v-for="invite in invites"
                  :key="`invite-${invite.id}`"
                  class="bulletin-card invite-card"
                >
                  <div class="card-header invite-header">
                    <div class="card-title-row">
                      <span class="pinned-badge invite-badge">
                        <font-awesome-icon icon="fa-solid fa-user-group" />
                        邀请
                      </span>
                      <span class="card-title"
                        >{{ invite.inviterName || "队长" }} 邀请你加入
                        {{ invite.groupName || `团队 ${invite.groupId}` }}</span
                      >
                    </div>
                    <div class="card-meta">
                      <span class="meta-time">{{ formatTime(invite.createdAt) }}</span>
                    </div>
                  </div>
                  <div class="invite-actions">
                    <button class="invite-action primary" @click="respondInvite(invite.id, true)">
                      同意
                    </button>
                    <button class="invite-action" @click="respondInvite(invite.id, false)">
                      拒绝
                    </button>
                  </div>
                </div>
                <div
                  v-for="item in bulletins"
                  :key="item.id"
                  class="bulletin-card"
                  :class="{ pinned: item.isPinned, expanded: expandedId === item.id }"
                  @click="handleCardClick($event, item.id)"
                >
                  <div class="card-header">
                    <div class="card-title-row">
                      <span v-if="item.isPinned" class="pinned-badge">
                        <font-awesome-icon icon="fa-solid fa-thumbtack" />
                        置顶
                      </span>
                      <span class="card-title">{{ item.title }}</span>
                    </div>
                    <div class="card-meta">
                      <span class="meta-author">{{ item.authorName }}</span>
                      <span class="meta-divider">|</span>
                      <span class="meta-time">{{ formatTime(item.createdAt) }}</span>
                    </div>
                  </div>
                  <transition name="expand">
                    <div
                      v-if="expandedId === item.id"
                      class="card-content"
                      v-html="item.content"
                    ></div>
                  </transition>
                </div>
              </div>

              <div class="pageNavigation" v-if="totalPage > 1">
                <div class="group">
                  <div class="pageButtons" v-if="currentPage > 1">
                    <button @click="fetchBulletins(currentPage - 1)">上一页</button>
                  </div>
                  <div class="pageButtons">
                    <button
                      v-for="value in pages"
                      :key="value"
                      :class="value === currentPage ? 'active' : ''"
                      @click="value === currentPage ? null : fetchBulletins(value)"
                    >
                      {{ value }}
                    </button>
                  </div>
                  <div class="pageButtons" v-if="currentPage < totalPage">
                    <button @click="fetchBulletins(currentPage + 1)">下一页</button>
                  </div>
                </div>
                <div class="group">
                  <div class="pageInput">
                    <button @click="fetchBulletins(jumpPage)">跳转</button>
                    <input type="number" min="1" :max="totalPage" v-model="jumpPage" />
                  </div>
                  <div class="pageSum">共 {{ totalPage }} 页</div>
                </div>
              </div>
            </div>
          </template>
          <template v-else-if="!userStore.isLogin">
            <div class="empty-tip">登录后可以收发私信</div>
          </template>
          <template v-else-if="!selectedUserId">
            <div class="empty-tip">选择一个会话开始私信</div>
          </template>
          <template v-else>
            <div class="thread-header">
              <img :src="avatarOf(activeOther.avatar)" :alt="activeOther.name" />
              <div>
                <div class="thread-name">
                  {{ activeOther.name || activeOther.username || "已注销用户" }}
                </div>
                <div class="thread-subtitle">@{{ activeOther.username || "deleted" }}</div>
              </div>
            </div>
            <div class="message-list" ref="messageListRef">
              <LoadingOverlay :show="threadLoading" />
              <div v-if="messages.length === 0 && !threadLoading" class="empty-tip compact">
                还没有消息，发一句打个招呼吧
              </div>
              <div
                v-for="message in messages"
                :key="message.id"
                class="message-bubble"
                :class="{ mine: message.senderId === currentUserId }"
              >
                <div class="bubble-content">{{ message.content }}</div>
                <div class="bubble-time">{{ formatTime(message.createdAt) }}</div>
              </div>
            </div>
            <form class="message-compose" @submit.prevent="sendDirectMessage">
              <textarea
                v-model="messageDraft"
                maxlength="1000"
                rows="3"
                placeholder="输入私信内容..."
                @keydown.ctrl.enter.prevent="sendDirectMessage"
              />
              <div class="compose-footer">
                <span>{{ messageDraft.length }}/1000</span>
                <button type="submit" :disabled="sending || messageDraft.trim().length === 0">
                  发送
                </button>
              </div>
            </form>
          </template>
        </main>
      </section>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from "vue"
import { useRoute } from "vue-router"
import BaseLayout from "@/components/BaseLayout.vue"
import LoadingOverlay from "@/components/LoadingOverlay.vue"
import { useUserStore } from "@/stores/user"
import API, {
  type BulletinInfo,
  type DirectMessage,
  type MessageConversation,
  type MessageUser,
  type UserProfileGetByNameList,
  type UserTeamInvite,
} from "@/utils/api"
import Toast from "@/utils/toast"

const route = useRoute()
const userStore = useUserStore()
const loading = ref(true)
const bulletins = ref<BulletinInfo[]>([])
const invites = ref<UserTeamInvite[]>([])
const currentPage = ref(1)
const totalPage = ref(1)
const total = ref(0)
const jumpPage = ref(1)
const expandedId = ref<number | null>(null)
const routeTab = (query = route.query): "dm" | "system" => {
  return query.tab === "system" || query.expand ? "system" : "dm"
}
const activeTab = ref<"dm" | "system">(routeTab())

const dmLoading = ref(false)
const threadLoading = ref(false)
const sending = ref(false)
const conversations = ref<MessageConversation[]>([])
const messages = ref<DirectMessage[]>([])
const selectedUserId = ref<number>(Number(route.query.userId || 0))
const activeOther = ref<MessageUser>({
  userId: 0,
  username: "",
  name: "",
  avatar: "",
  deleted: false,
})
const unreadCount = ref(0)
const messageDraft = ref("")
const dmSearchKeyword = ref("")
const dmSearchCandidates = ref<UserProfileGetByNameList[]>([])
const dmSearchLoading = ref(false)
const messageListRef = ref<HTMLElement | null>(null)
let pollTimer: number | undefined

const pageSize = 10
const currentUserId = computed(() => Number(userStore.info?.userId || 0))

const pages = computed(() => {
  if (totalPage.value <= 3) return Array.from({ length: totalPage.value }, (_, i) => i + 1)
  if (currentPage.value <= 1) return [1, 2, 3]
  if (currentPage.value >= totalPage.value - 1)
    return [totalPage.value - 2, totalPage.value - 1, totalPage.value]
  return [currentPage.value - 1, currentPage.value, currentPage.value + 1]
})

const scrollMessagesToBottom = async () => {
  await nextTick()
  const list = messageListRef.value
  if (list) {
    list.scrollTop = list.scrollHeight
  }
}

const openSystemMessages = async () => {
  if (activeTab.value === "system") return
  activeTab.value = "system"
  await fetchBulletins(currentPage.value)
}

const fetchBulletins = async (page: number) => {
  loading.value = true
  const [bulletinResponse, inviteResponse] = await Promise.all([
    API.core.bulletin.list(page, pageSize),
    userStore.isLogin ? API.user.team.invites() : Promise.resolve(null),
  ])
  Toast.stdResponse(bulletinResponse, false)
  if (bulletinResponse.success) {
    bulletins.value = bulletinResponse.data.data
    total.value = bulletinResponse.data.total
    totalPage.value = Math.ceil(bulletinResponse.data.total / pageSize)
    currentPage.value = page
    jumpPage.value = page
  }
  if (inviteResponse?.success) {
    invites.value = inviteResponse.data.list
  } else {
    invites.value = []
  }
  loading.value = false
}

const fetchConversations = async () => {
  if (!userStore.isLogin) return
  dmLoading.value = true
  const response = await API.user.message.conversations(1, 30)
  Toast.stdResponse(response, false)
  if (response.success) {
    conversations.value = response.data.list
    unreadCount.value = response.data.unreadCount
    if (!selectedUserId.value && conversations.value.length > 0) {
      const firstConversation = conversations.value[0]
      if (firstConversation) {
        selectedUserId.value = firstConversation.otherUser.userId
      }
    }
    if (activeTab.value === "dm" && selectedUserId.value) {
      await fetchThread(selectedUserId.value)
    }
  }
  dmLoading.value = false
}

const fetchUnreadCount = async () => {
  if (!userStore.isLogin) return
  const response = await API.user.message.unreadCount()
  if (response.success) {
    unreadCount.value = response.data.unreadCount
  }
}

const updateConversationPreview = (message: DirectMessage) => {
  const otherUserId = selectedUserId.value
  if (!otherUserId) return

  let found = false
  const nextConversations = conversations.value.map((item) => {
    if (item.otherUser.userId !== otherUserId) return item
    found = true
    return {
      ...item,
      threadId: message.threadId || item.threadId,
      lastMessagePreview: message.content,
      lastSenderId: message.senderId,
      lastSentAt: message.createdAt,
      unreadCount: 0,
    }
  })

  if (!found && activeOther.value.userId) {
    nextConversations.unshift({
      threadId: message.threadId,
      otherUser: activeOther.value,
      lastMessagePreview: message.content,
      lastSenderId: message.senderId,
      lastSentAt: message.createdAt,
      unreadCount: 0,
    })
  }

  conversations.value = nextConversations.sort(
    (a, b) => Number(b.lastSentAt || 0) - Number(a.lastSentAt || 0),
  )
}

const fetchThread = async (userId: number) => {
  if (!userStore.isLogin || !userId) return
  threadLoading.value = true
  const response = await API.user.message.thread(userId, 1, 50)
  Toast.stdResponse(response, false)
  if (response.success) {
    selectedUserId.value = userId
    activeOther.value = response.data.otherUser
    messages.value = response.data.list
    await scrollMessagesToBottom()
    await API.user.message.markRead(userId)
    await fetchUnreadCount()
    conversations.value = conversations.value.map((item) =>
      item.otherUser.userId === userId ? { ...item, unreadCount: 0 } : item,
    )
  }
  threadLoading.value = false
}

const openThread = async (userId: number) => {
  activeTab.value = "dm"
  selectedUserId.value = userId
  dmSearchCandidates.value = []
  await fetchThread(userId)
}

const searchDirectMessageUsers = async () => {
  const keyword = dmSearchKeyword.value.trim()
  if (!keyword) {
    Toast.warn("请输入用户昵称")
    return
  }
  dmSearchLoading.value = true
  const response = await API.user.profile.getByName(keyword)
  Toast.stdResponse(response, false)
  if (response.success) {
    dmSearchCandidates.value = response.data.list.filter(
      (item) => Number(item.userId) !== currentUserId.value,
    )
    if (dmSearchCandidates.value.length === 0) {
      Toast.info("没有找到可私信的用户")
    }
  }
  dmSearchLoading.value = false
}

const sendDirectMessage = async () => {
  if (!selectedUserId.value || sending.value) return
  const content = messageDraft.value.trim()
  if (!content) return
  sending.value = true
  const response = await API.user.message.send(selectedUserId.value, content)
  Toast.stdResponse(response)
  if (response.success) {
    const sentMessage = response.data.data
    messages.value.push(sentMessage)
    updateConversationPreview(sentMessage)
    messageDraft.value = ""
    await scrollMessagesToBottom()
  }
  sending.value = false
}

const handleCardClick = (event: MouseEvent, id: number) => {
  if (event.composedPath().some((el) => el instanceof HTMLAnchorElement)) return
  expandedId.value = expandedId.value === id ? null : id
}

const avatarOf = (avatar?: string): string => {
  return avatar || "/images/defaultAvatar.png"
}

const formatTime = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const shortTime = (timestamp: number): string => {
  if (!timestamp) return ""
  const d = new Date(timestamp * 1000)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })
  if (days < 7) return `${days}天前`
  return d.toLocaleDateString("sv-SE", { month: "2-digit", day: "2-digit" })
}

const respondInvite = async (inviteId: number, accept: boolean) => {
  const response = await API.user.team.respondInvite(inviteId, accept)
  Toast.stdResponse(response)
  if (response.success) {
    await fetchBulletins(currentPage.value)
  }
}

watch(
  () => route.query,
  async (query) => {
    const previousTab = activeTab.value
    const nextTab = routeTab(query)
    activeTab.value = nextTab
    const nextUserId = Number(query.userId || 0)
    if (nextTab === "dm") {
      if (nextUserId && nextUserId !== selectedUserId.value) {
        selectedUserId.value = nextUserId
        await fetchThread(nextUserId)
        return
      }
      if (previousTab !== "dm" || conversations.value.length === 0) {
        await fetchConversations()
      }
    } else if (previousTab !== "system") {
      await fetchBulletins(currentPage.value)
      if (userStore.isLogin && conversations.value.length === 0) {
        await fetchConversations()
      }
    }
  },
)

onMounted(() => {
  const expandParam = route.query.expand
  if (expandParam) {
    expandedId.value = Number(expandParam)
  }
  fetchBulletins(1)
  if (userStore.isLogin) {
    fetchConversations()
  }
  if (userStore.isLogin) {
    fetchUnreadCount()
    pollTimer = window.setInterval(() => {
      fetchUnreadCount()
      if (!threadLoading.value) {
        fetchConversations()
      }
    }, 30000)
  }
})

onBeforeUnmount(() => {
  if (pollTimer) {
    window.clearInterval(pollTimer)
  }
})
</script>

<style scoped>
@import "@/assets/css/navagation.css";

.bulletin-page {
  padding: 20px;
  color: var(--text-default-color);
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
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

.message-tabs {
  display: flex;
  gap: 8px;
}

.message-tabs button,
.dm-search button,
.compose-footer button,
.invite-action {
  border: 1px solid var(--divider-color);
  border-radius: 8px;
  padding: 6px 12px;
  color: var(--text-light-color);
  background-color: var(--background-color-1);
  cursor: pointer;
  font-family: inherit;
  font-size: var(--text-sm);
  font-weight: 800;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.message-tabs button:hover,
.message-tabs button.active,
.dm-search button:hover:not(:disabled),
.compose-footer button:hover:not(:disabled),
.invite-action:hover {
  border-color: var(--neon-cyan);
  color: var(--text-reverse-color);
  background-color: var(--neon-cyan);
}

.dm-search button:disabled,
.compose-footer button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.tab-badge,
.unread-dot {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  color: var(--text-reverse-color);
  background-color: var(--neon-cyan);
  font-size: var(--text-xs);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.message-tabs button.active .tab-badge,
.message-tabs button:hover .tab-badge {
  color: var(--neon-cyan);
  background-color: var(--text-reverse-color);
}

.dm-shell {
  display: grid;
  grid-template-columns: minmax(260px, 330px) minmax(0, 1fr);
  gap: 16px;
  height: clamp(520px, calc(100vh - 150px), 760px);
  min-height: 0;
  position: relative;
}

.conversation-list,
.thread-panel {
  background-color: var(--background-color-content);
  border: 1px solid var(--divider-color);
  border-radius: 12px;
  min-height: 0;
}

.conversation-list {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.dm-search {
  display: flex;
  flex: none;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--divider-color);
}

.dm-search input {
  min-width: 0;
  flex: 1;
  border: 1px solid var(--divider-color);
  border-radius: 8px;
  padding: 8px 10px;
  color: var(--text-default-color);
  background-color: var(--background-color-1);
  font-family: inherit;
  font-size: var(--text-sm);
  outline: none;
}

.dm-search input:focus {
  border-color: var(--neon-cyan);
}

.dm-candidates {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 6px;
  max-height: 180px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.dm-candidate {
  border: 1px solid var(--divider-color);
  border-radius: 8px;
  padding: 8px 10px;
  color: var(--text-default-color);
  background-color: var(--background-color-1);
  cursor: pointer;
  font-family: inherit;
  font-size: var(--text-sm);
  text-align: left;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.dm-candidate:hover {
  border-color: var(--neon-cyan);
  color: var(--text-reverse-color);
  background-color: var(--neon-cyan);
}

.conversation-item {
  width: 100%;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-default-color);
  background-color: transparent;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: all 0.2s ease;
}

.conversation-item:hover,
.conversation-item.active {
  border-color: var(--neon-cyan);
  background-color: var(--background-color-1);
}

.system-entry {
  flex: none;
}

.system-entry-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  color: var(--neon-cyan);
  background-color: var(--background-color-1);
  border: 1px solid var(--divider-color);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.conversation-item img,
.thread-header img {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  object-fit: cover;
  background-color: var(--background-color-1);
  flex-shrink: 0;
}

.conversation-main {
  min-width: 0;
  flex: 1;
}

.conversation-top {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.conversation-name {
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-time,
.conversation-preview,
.thread-subtitle,
.bubble-time,
.compose-footer span {
  color: var(--text-light-color);
  font-size: var(--text-xs);
}

.conversation-preview {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.thread-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.thread-header {
  display: flex;
  flex: none;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--divider-color);
}

.system-header {
  background: linear-gradient(90deg, var(--background-color-1), transparent);
}

.thread-name {
  font-size: var(--text-base);
  font-weight: 900;
}

.system-message-panel {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 16px;
}

.message-list {
  position: relative;
  flex: 1;
  min-height: 0;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.message-bubble {
  width: fit-content;
  max-width: min(70%, 620px);
  align-self: flex-start;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.message-bubble.mine {
  align-self: flex-end;
  align-items: flex-end;
}

.bubble-content {
  box-sizing: border-box;
  max-width: 100%;
  white-space: pre-wrap;
  word-break: break-word;
  border-radius: 12px;
  padding: 10px 12px;
  background-color: var(--background-color-1);
  border: 1px solid var(--divider-color);
  line-height: 1.6;
}

.message-bubble.mine .bubble-content {
  border-color: var(--neon-cyan);
  background-color: rgba(0, 255, 255, 0.12);
}

.bubble-time {
  margin-top: 4px;
  text-align: right;
}

.message-compose {
  flex: none;
  padding: 12px;
  border-top: 1px solid var(--divider-color);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-compose textarea {
  width: 100%;
  min-height: 76px;
  max-height: 76px;
  resize: none;
  border: 1px solid var(--divider-color);
  border-radius: 10px;
  padding: 10px 12px;
  color: var(--text-default-color);
  background-color: var(--background-color-1);
  font-family: inherit;
  font-size: var(--text-sm);
  outline: none;
}

.message-compose textarea:focus {
  border-color: var(--neon-cyan);
}

.compose-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bulletin-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 200px;
}

.empty-tip {
  text-align: center;
  padding: 40px;
  color: var(--text-light-color);
  font-size: var(--text-base);
}

.empty-tip.compact {
  padding: 20px;
  font-size: var(--text-sm);
}

.bulletin-card {
  background-color: var(--background-color-content);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.bulletin-card.expanded {
  cursor: auto;
}

.bulletin-card:hover {
  border-color: var(--neon-cyan);
  transform: translateX(4px);
}

.bulletin-card.pinned {
  border-left: 3px solid var(--neon-cyan);
}

.invite-card {
  cursor: default;
}

.invite-card:hover {
  transform: none;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pinned-badge {
  font-size: var(--text-xs);
  padding: 2px 8px;
  border-radius: 4px;
  background-color: var(--neon-cyan);
  color: var(--background-color-1);
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.card-title {
  font-size: var(--text-base);
  font-weight: 600;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--text-sm);
  color: var(--text-light-color);
}

.invite-header {
  align-items: flex-start;
}

.invite-badge {
  background-color: rgba(0, 255, 255, 0.14);
  color: var(--text-default-color);
}

.invite-actions {
  margin-top: 14px;
  display: flex;
  gap: 8px;
}

.invite-action.primary {
  color: var(--text-light-color);
  background-color: var(--background-color-1);
}

.meta-divider {
  opacity: 0.5;
}

.card-content {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--divider-color);
  font-size: var(--text-base);
  line-height: 1.6;
  overflow: hidden;
}

.expand-enter-active {
  transition: all 0.3s ease;
}

.expand-leave-active {
  transition: all 0.2s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
  padding-top: 0;
}

@media (max-width: 860px) {
  .bulletin-page {
    padding: 10px;
  }

  .page-header,
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .message-tabs {
    width: 100%;
  }

  .message-tabs button {
    flex: 1;
  }

  .dm-shell {
    grid-template-columns: 1fr;
    height: auto;
    min-height: 0;
  }

  .conversation-list {
    max-height: 230px;
  }

  .thread-panel {
    height: min(600px, calc(100dvh - 180px));
    min-height: 380px;
  }

  .message-bubble {
    max-width: 88%;
  }
}

@media (max-width: 520px) {
  .bulletin-page {
    padding: 0;
  }

  .page-header {
    border-radius: 0;
  }

  .dm-shell {
    gap: 10px;
  }

  .conversation-list,
  .thread-panel {
    border-left: none;
    border-right: none;
    border-radius: 0;
  }

  .conversation-list {
    max-height: 210px;
    padding: 10px;
  }

  .dm-search {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .conversation-item {
    padding: 10px;
  }

  .conversation-item img,
  .system-entry-icon {
    width: 40px;
    height: 40px;
  }

  .thread-header {
    padding: 12px;
  }

  .message-list {
    padding: 10px;
  }

  .message-compose {
    padding: 8px;
  }

  .message-compose textarea {
    min-height: 60px;
    max-height: 60px;
    font-size: var(--text-xs);
  }

  .message-bubble {
    max-width: 92%;
  }

  .bubble-content {
    padding: 8px 10px;
    font-size: var(--text-sm);
    line-height: 1.5;
  }

  .bulletin-card {
    padding: 12px;
  }

  .card-title-row,
  .card-meta,
  .invite-actions {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 430px) {
  .dm-shell {
    gap: 8px;
  }

  .conversation-list {
    max-height: 190px;
  }

  .thread-panel {
    height: calc(100dvh - 250px);
    min-height: 340px;
  }

  .dm-search {
    gap: 6px;
  }

  .dm-search input,
  .dm-search button,
  .compose-footer button {
    padding: 7px 9px;
    font-size: var(--text-xs);
  }

  .conversation-item {
    gap: 8px;
    padding: 8px;
  }

  .conversation-item img,
  .system-entry-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }

  .thread-header {
    gap: 8px;
    padding: 10px;
  }
}
</style>
