<template>
  <div class="bulletin-board" style="position: relative">
    <LoadingOverlay :show="loading" />
    <div
      v-if="
        bulletins.length === 0 && invites.length === 0 && conversations.length === 0 && !loading
      "
      class="empty-tip"
    >
      暂无消息
    </div>
    <div
      v-for="conversation in conversations"
      :key="`dm-${conversation.threadId}`"
      class="bulletin-item dm-item"
      @click="goToMessage(conversation.otherUser.userId)"
    >
      <span class="item-icon">
        <font-awesome-icon icon="fa-solid fa-envelope" />
      </span>
      <div class="invite-main">
        <span class="item-title">
          {{ conversation.otherUser.name || conversation.otherUser.username || "已注销用户" }}
          <span v-if="conversation.unreadCount > 0" class="unread-inline">{{
            conversation.unreadCount
          }}</span>
        </span>
        <span class="item-time">{{ conversation.lastMessagePreview || "暂无消息" }}</span>
      </div>
      <span class="item-time">{{ formatTime(conversation.lastSentAt) }}</span>
    </div>
    <div
      v-for="item in bulletins"
      :key="item.id"
      class="bulletin-item"
      @click="goToBulletin(item.id)"
    >
      <span v-if="item.isPinned" class="pin-icon">
        <font-awesome-icon icon="fa-solid fa-thumbtack" />
      </span>
      <span v-else class="item-icon">
        <font-awesome-icon icon="fa-solid fa-envelope" />
      </span>
      <span class="item-title">{{ item.title }}</span>
      <span class="item-time">{{ formatTime(item.createdAt) }}</span>
    </div>
    <div v-for="invite in invites" :key="`invite-${invite.id}`" class="bulletin-item invite-item">
      <span class="item-icon">
        <font-awesome-icon icon="fa-solid fa-user-group" />
      </span>
      <div class="invite-main">
        <span class="item-title"
          >{{ invite.inviterName || "队长" }} 邀请你加入
          {{ invite.groupName || `团队 ${invite.groupId}` }}</span
        >
        <span class="item-time">{{ formatTime(invite.createdAt) }}</span>
      </div>
      <div class="invite-actions">
        <button class="invite-action primary" @click.stop="respondInvite(invite.id, true)">
          同意
        </button>
        <button class="invite-action" @click.stop="respondInvite(invite.id, false)">拒绝</button>
      </div>
    </div>
    <div class="board-footer">
      <router-link to="/bulletin" class="view-all">
        查看全部消息 <font-awesome-icon icon="fa-solid fa-arrow-right" />
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted } from "vue"
import { useRouter } from "vue-router"
import { useUserStore } from "@/stores/user"
import API, { type BulletinInfo, type MessageConversation, type UserTeamInvite } from "@/utils/api"
import LoadingOverlay from "@/components/LoadingOverlay.vue"
import Toast from "@/utils/toast"

const router = useRouter()
const userStore = useUserStore()
const loading = ref(true)
const bulletins = ref<BulletinInfo[]>([])
const invites = ref<UserTeamInvite[]>([])
const conversations = ref<MessageConversation[]>([])
let pollTimer: number | undefined

const fetchMessages = async () => {
  loading.value = true
  const [bulletinResponse, inviteResponse, conversationResponse] = await Promise.all([
    API.core.bulletin.list(1, 5),
    userStore.isLogin ? API.user.team.invites() : Promise.resolve(null),
    userStore.isLogin ? API.user.message.conversations(1, 3) : Promise.resolve(null),
  ])
  if (bulletinResponse.success) {
    bulletins.value = bulletinResponse.data.data
  }
  if (inviteResponse?.success) {
    invites.value = inviteResponse.data.list
  } else {
    invites.value = []
  }
  if (conversationResponse?.success) {
    conversations.value = conversationResponse.data.list
  } else {
    conversations.value = []
  }
  loading.value = false
}

const goToBulletin = (id: number) => {
  router.push(`/bulletin?expand=${id}`)
}

const goToMessage = (userId: number) => {
  router.push(`/bulletin?tab=dm&userId=${userId}`)
}

const respondInvite = async (inviteId: number, accept: boolean) => {
  const response = await API.user.team.respondInvite(inviteId, accept)
  Toast.stdResponse(response)
  if (response.success) {
    await fetchMessages()
  }
}

const formatTime = (timestamp: number): string => {
  const d = new Date(timestamp * 1000)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })
  } else if (days === 1) {
    return "昨天"
  } else if (days < 7) {
    return `${days}天前`
  }
  return d.toLocaleDateString("sv-SE", { month: "2-digit", day: "2-digit" })
}

onMounted(() => {
  fetchMessages()
  if (userStore.isLogin) {
    pollTimer = window.setInterval(fetchMessages, 30000)
  }
})

onBeforeUnmount(() => {
  if (pollTimer) {
    window.clearInterval(pollTimer)
  }
})
</script>

<style scoped>
.bulletin-board {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 60px;
}

.empty-tip {
  text-align: center;
  padding: 20px;
  color: var(--text-light-color);
  font-size: var(--text-sm);
}

.bulletin-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid var(--divider-color);
}

.invite-item {
  align-items: flex-start;
  gap: 10px;
}

.dm-item {
  align-items: flex-start;
}

.bulletin-item:last-of-type {
  border-bottom: none;
}

.bulletin-item:hover {
  color: var(--neon-cyan);
}

.pin-icon {
  color: var(--neon-cyan);
  font-size: var(--text-xs);
  flex-shrink: 0;
}

.item-icon {
  color: var(--text-light-color);
  font-size: var(--text-xs);
  flex-shrink: 0;
}

.item-title {
  flex: 1;
  font-size: var(--text-sm);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.item-time {
  font-size: var(--text-xs);
  color: var(--text-light-color);
  flex-shrink: 0;
}

.invite-main {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 4px;
}

.invite-main .item-title {
  white-space: normal;
}

.invite-actions {
  display: flex;
  flex-shrink: 0;
  gap: 6px;
}

.invite-action {
  border: 1px solid var(--divider-color);
  border-radius: 8px;
  padding: 6px 10px;
  color: var(--text-light-color);
  background-color: var(--background-color-1);
  cursor: pointer;
  font-family: inherit;
  font-size: var(--text-xs);
  font-weight: 800;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.invite-action.primary {
  color: var(--text-light-color);
  background-color: var(--background-color-1);
}

.invite-action:hover {
  border-color: var(--neon-cyan);
  color: var(--text-reverse-color);
  background-color: var(--neon-cyan);
}

.unread-inline {
  min-width: 16px;
  height: 16px;
  padding: 0 5px;
  border-radius: 999px;
  color: var(--text-reverse-color);
  background-color: var(--neon-cyan);
  font-size: var(--text-xs);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
}

.board-footer {
  padding-top: 8px;
  text-align: right;
}

.view-all {
  font-size: var(--text-sm);
  color: var(--neon-cyan);
  text-decoration: none;
  transition: opacity 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.view-all:hover {
  opacity: 0.8;
}

@media (max-width: 720px) {
  .invite-item {
    flex-wrap: wrap;
  }

  .invite-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
