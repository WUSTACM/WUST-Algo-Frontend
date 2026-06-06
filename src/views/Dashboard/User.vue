<template>
  <div class="dashboardContent">
    <div class="section">
      <div class="header">
        <div class="header-title">
          <span class="title-icon">
            <font-awesome-icon icon="fa-solid fa-user" />
          </span>
          <span class="title-text">{{
            userStore.isCoach ? "队员管理" : "用户管理"
          }}</span>
        </div>
        <div class="header-tabs">
          <span class="tab" @click="openBroadcastModal">群发消息</span>
          <span class="tab" @click="refresh">刷新</span>
        </div>
      </div>
      <div class="content">
        <div style="position: relative">
          <LoadingOverlay :show="loading" />
          <table style="margin-bottom: 10px">
            <thead>
              <tr>
                <th style="width: 60px">头像</th>
                <th style="width: 120px">用户名</th>
                <th style="width: 120px">昵称</th>
                <th style="width: 120px">
                  {{ userStore.isCoach ? "分组" : "角色" }}
                </th>
                <th style="width: 240px">最后提交日期</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in data?.list" style="cursor: pointer">
                <td @click="router.push(`/profile?id=${item.userId}`)">
                  <div class="avatar">
                    <img
                      :src="item.avatar || '/images/defaultAvatar.png'"
                      alt=""
                    />
                  </div>
                </td>
                <td @click="router.push(`/profile?id=${item.userId}`)">
                  {{ item.username }}
                </td>
                <td @click="router.push(`/profile?id=${item.userId}`)">
                  {{ item.name }}
                </td>
                <td @click="router.push(`/profile?id=${item.userId}`)">
                  {{
                    userStore.isCoach
                      ? getGroupName(item.groupId)
                      : getRoleName(item.roleId)
                  }}
                </td>
                <td @click="router.push(`/profile?id=${item.userId}`)">
                  {{ formatDate(item.lastSubmit) }}
                </td>
                <td>
                  <div class="actions" @click.stop>
                    <button
                      class="btn btn-primary"
                      @click="openEditModal(item)"
                    >
                      {{ userStore.isAdmin ? "改角色" : "改分组" }}
                    </button>
                    <button
                      v-if="userStore.isAdmin"
                      class="btn btn-primary"
                      @click="openPasswordModal(item)"
                    >
                      改密码
                    </button>
                    <button
                      v-if="userStore.isAdmin"
                      class="btn btn-primary"
                      @click="openNicknameModal(item)"
                    >
                      改昵称
                    </button>
                    <button
                      class="btn btn-primary"
                      @click="router.push(`/profile?id=${item.userId}`)"
                    >
                      个人资料
                    </button>
                    <button
                      v-if="canDeleteUser(item)"
                      class="btn btn-danger"
                      :disabled="deleteLoadingUserId === Number(item.userId)"
                      @click="handleDeleteUser(item)"
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pageNavigation" v-if="data">
          <div class="group">
            <div class="pageButtons" v-if="data.currentPage != 1">
              <button @click="getData(data.currentPage - 1)">上一页</button>
            </div>
            <div class="pageButtons">
              <button
                v-for="value in pages"
                :key="value"
                :class="value === data.currentPage ? 'active' : ''"
                @click="value === data.currentPage ? null : getData(value)"
              >
                {{ value }}
              </button>
            </div>
            <div class="pageButtons" v-if="data.currentPage != data.totalPage">
              <button @click="getData(data.currentPage + 1)">下一页</button>
            </div>
          </div>
          <div class="group">
            <div class="pageInput">
              <button @click="getData(jumppage)">跳转</button>
              <input
                type="number"
                min="1"
                :max="data.totalPage"
                v-model="jumppage"
              />
            </div>
            <div class="pageSum">共 {{ data.totalPage }} 页</div>
          </div>
        </div>
      </div>
    </div>
    <div class="section spider-task-section">
      <div class="header">
        <div class="header-title">
          <span class="title-icon">
            <font-awesome-icon icon="fa-solid fa-rotate" />
          </span>
          <span class="title-text">抓取任务</span>
        </div>
        <div class="header-tabs">
          <span class="tab" :class="{ active: taskStatusFilter === '' }" @click="setTaskFilter('')">全部</span>
          <span class="tab" :class="{ active: taskStatusFilter === 'queued' }" @click="setTaskFilter('queued')">排队</span>
          <span class="tab" :class="{ active: taskStatusFilter === 'running' }" @click="setTaskFilter('running')">抓取中</span>
          <span class="tab" :class="{ active: taskStatusFilter === 'failed' }" @click="setTaskFilter('failed')">失败</span>
          <span class="tab" @click="fetchSpiderJobs">刷新</span>
        </div>
      </div>
      <div class="content spider-task-content" style="position: relative">
        <LoadingOverlay :show="taskLoading" />
        <div class="task-list" v-if="spiderJobs.length > 0">
          <div class="task-row" v-for="job in spiderJobs" :key="job.jobId">
            <div class="task-main">
              <span class="task-status" :class="`status-${job.status}`">{{ formatTaskStatus(job.status) }}</span>
              <span>用户 #{{ job.userId }}</span>
              <span>{{ formatTaskSource(job.source) }}</span>
              <span v-if="job.currentPlatform">{{ job.currentPlatform }}</span>
            </div>
            <div class="task-progress">
              <div class="task-progress-bar" :style="{ width: jobProgress(job) + '%' }"></div>
            </div>
            <div class="task-time">{{ formatTaskTime(job.updatedAt) }}</div>
            <div class="task-error" v-if="job.error">{{ job.error }}</div>
          </div>
        </div>
        <div class="task-empty" v-else>暂无抓取任务</div>
      </div>
    </div>
  </div>

  <!-- 角色选择弹窗 -->
  <div class="modal-overlay" v-if="showRoleModal" @click="closeRoleModal">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <span>设置用户角色</span>
        <button class="modal-close" @click="closeRoleModal">&times;</button>
      </div>
      <div class="modal-body">
        <div class="modal-user">
          <span class="label">用户：</span>
          <span>{{ selectedUser?.name }} ({{ selectedUser?.username }})</span>
        </div>
        <div class="modal-role">
          <span class="label">角色：</span>
          <div class="role-options">
            <div
              v-for="role in roles"
              :key="role.roleId"
              class="role-option"
              :class="{ active: selectedRoleId === role.roleId }"
              @click="selectedRoleId = role.roleId"
            >
              {{ role.name }}
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button
          class="btn btn-primary"
          @click="handleRoleConfirm"
          :disabled="roleLoading"
        >
          确认
        </button>
        <button class="btn" @click="closeRoleModal">取消</button>
      </div>
    </div>
  </div>

  <!-- 分组选择弹窗 -->
  <div class="modal-overlay" v-if="showGroupModal" @click="closeGroupModal">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <span>更改用户分组</span>
        <button class="modal-close" @click="closeGroupModal">&times;</button>
      </div>
      <div class="modal-body">
        <div class="modal-user">
          <span class="label">用户：</span>
          <span>{{ selectedUser?.name }} ({{ selectedUser?.username }})</span>
        </div>
        <div class="modal-role">
          <span class="label">分组：</span>
          <div class="role-options">
            <div
              v-for="group in groups"
              :key="group.id"
              class="role-option"
              :class="{ active: selectedGroupId === group.id }"
              @click="selectedGroupId = group.id"
            >
              {{ group.name }}
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button
          class="btn btn-primary"
          @click="handleGroupConfirm"
          :disabled="groupLoading"
        >
          确认
        </button>
        <button class="btn" @click="closeGroupModal">取消</button>
      </div>
    </div>
  </div>

  <!-- 管理员重置密码弹窗 -->
  <div
    class="modal-overlay"
    v-if="showPasswordModal"
    @click="closePasswordModal"
  >
    <div class="modal" @click.stop>
      <div class="modal-header">
        <span>重置用户密码</span>
        <button class="modal-close" @click="closePasswordModal">&times;</button>
      </div>
      <div class="modal-body">
        <div class="modal-user">
          <span class="label">用户：</span>
          <span
            >{{ selectedPasswordUser?.name }} ({{
              selectedPasswordUser?.username
            }})</span
          >
        </div>
        <div class="modal-field">
          <label>新密码</label>
          <input
            type="password"
            v-model="passwordForm.newPassword"
            placeholder="请输入新密码"
          />
        </div>
        <div class="modal-field">
          <label>确认密码</label>
          <input
            type="password"
            v-model="passwordForm.newPasswordConfirm"
            placeholder="请再次输入新密码"
          />
        </div>
      </div>
      <div class="modal-footer">
        <button
          class="btn btn-primary"
          @click="handlePasswordConfirm"
          :disabled="passwordLoading"
        >
          确认
        </button>
        <button class="btn" @click="closePasswordModal">取消</button>
      </div>
    </div>
  </div>

  <!-- 管理员修改昵称弹窗 -->
  <div
    class="modal-overlay"
    v-if="showNicknameModal"
    @click="closeNicknameModal"
  >
    <div class="modal" @click.stop>
      <div class="modal-header">
        <span>修改用户昵称</span>
        <button class="modal-close" @click="closeNicknameModal">&times;</button>
      </div>
      <div class="modal-body">
        <div class="modal-user">
          <span class="label">用户：</span>
          <span
            >{{ selectedNicknameUser?.name }} ({{
              selectedNicknameUser?.username
            }})</span
          >
        </div>
        <div class="modal-field">
          <label>昵称</label>
          <input
            type="text"
            v-model.trim="nicknameForm.name"
            placeholder="请输入新的昵称"
          />
        </div>
      </div>
      <div class="modal-footer">
        <button
          class="btn btn-primary"
          @click="handleNicknameConfirm"
          :disabled="nicknameLoading"
        >
          确认
        </button>
        <button class="btn" @click="closeNicknameModal">取消</button>
      </div>
    </div>
  </div>

  <!-- 群发消息弹窗 -->
  <div
    class="modal-overlay"
    v-if="showBroadcastModal"
    @click="closeBroadcastModal"
  >
    <div class="modal" @click.stop>
      <div class="modal-header">
        <span>群发消息</span>
        <button class="modal-close" @click="closeBroadcastModal">&times;</button>
      </div>
      <div class="modal-body">
        <div class="modal-user">
          <span class="label">范围：</span>
          <span>发送给除自己以外的所有用户</span>
        </div>
        <div class="modal-field">
          <label>消息内容</label>
          <textarea
            v-model="broadcastForm.content"
            maxlength="1000"
            rows="6"
            placeholder="请输入要群发的消息"
          ></textarea>
          <span class="field-hint">{{ broadcastForm.content.length }}/1000</span>
        </div>
      </div>
      <div class="modal-footer">
        <button
          class="btn btn-primary"
          @click="handleBroadcastConfirm"
          :disabled="broadcastLoading"
        >
          确认发送
        </button>
        <button class="btn" @click="closeBroadcastModal">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import API from "@/utils/api";
import Toast from "@/utils/toast";
import LoadingOverlay from "@/components/LoadingOverlay.vue";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import type { SpiderJobInfo, UserRole } from "@/utils/api";
import { useUserStore } from "@/stores/user";

const router = useRouter();
const userStore = useUserStore();
const loading = ref(true);

interface Response {
  list: User[];
  total: number;
  totalPage: number;
  currentPage: number;
}

interface User {
  avatar: string;
  groupId: number;
  lastSubmit: string;
  name: string;
  roleId?: number;
  userId: number | string;
  username: string;
}

const data = ref<Response>({
  list: [],
  total: 0,
  totalPage: 0,
  currentPage: 1,
});

const jumppage = ref(1);

// 角色相关
const roles = ref<UserRole[]>([]);
const showRoleModal = ref(false);
const selectedUser = ref<User | null>(null);
const selectedRoleId = ref<number>(0);
const roleLoading = ref(false);

// 分组相关
const groups = ref<{ id: number; name: string }[]>([]);
const showGroupModal = ref(false);
const selectedGroupId = ref<number>(0);
const groupLoading = ref(false);

const showPasswordModal = ref(false);
const selectedPasswordUser = ref<User | null>(null);
const passwordLoading = ref(false);
const passwordForm = ref({
  newPassword: "",
  newPasswordConfirm: "",
});
const deleteLoadingUserId = ref<number | null>(null);
const showNicknameModal = ref(false);
const selectedNicknameUser = ref<User | null>(null);
const nicknameLoading = ref(false);
const nicknameForm = ref({
  userId: 0,
  name: "",
  email: "",
  avatar: "",
});
const showBroadcastModal = ref(false);
const broadcastLoading = ref(false);
const broadcastForm = ref({
  content: "",
});
const taskLoading = ref(false);
const taskStatusFilter = ref("");
const spiderJobs = ref<SpiderJobInfo[]>([]);

const pages = computed(() => {
  if (!data.value) return [];
  const currentPage = data.value.currentPage;
  const totalPage = data.value.totalPage;
  if (totalPage <= 3) return Array.from({ length: totalPage }, (_, i) => i + 1);
  if (currentPage <= 1) return [1, 2, 3];
  if (currentPage >= totalPage - 1)
    return [totalPage - 2, totalPage - 1, totalPage];
  return [currentPage - 1, currentPage, currentPage + 1];
});

const getData = async (page: number) => {
  loading.value = true;
  const response = await API.user.profile.list(page);
  Toast.stdResponse(response, false);

  if (response.success) {
    jumppage.value = page;
    data.value = response.data;
    data.value.currentPage = page;
    data.value.totalPage = Math.ceil(data.value.total / 10);
  }
  loading.value = false;
};

const getRoleName = (roleId: number | undefined) => {
  if (roleId === undefined) return "未知";
  const role = roles.value.find((r) => r.roleId === roleId);
  return role?.name || `角色${roleId}`;
};

const getGroupName = (groupId: number) => {
  const group = groups.value.find((g) => g.id === groupId);
  return group?.name || `组${groupId}`;
};

const loadRoles = async () => {
  const response = await API.user.role.list();
  if (response.success) {
    roles.value = response.data.roles;
  }
};

const openEditModal = async (user: User) => {
  selectedUser.value = user;
  if (userStore.isAdmin) {
    // 获取完整用户信息（包含 roleId）
    const resp = await API.user.profile.getById(Number(user.userId));
    if (resp.success && resp.data.roleId !== undefined) {
      selectedRoleId.value = resp.data.roleId;
    }
    showRoleModal.value = true;
  } else {
    // 教练：获取分组列表 + 当前用户分组
    selectedGroupId.value = user.groupId;
    await loadGroups();
    showGroupModal.value = true;
  }
};

const loadGroups = async () => {
  const resp = await API.user.group.list(1);
  if (resp.success) {
    groups.value = resp.data.list.map((g: any) => ({ id: g.id, name: g.name }));
  }
};

const closeRoleModal = () => {
  showRoleModal.value = false;
  selectedUser.value = null;
  selectedRoleId.value = 0;
};

const handleRoleConfirm = async () => {
  if (!selectedUser.value) return;
  roleLoading.value = true;
  const response = await API.user.role.setUserRole({
    userId: Number(selectedUser.value.userId),
    roleId: selectedRoleId.value,
  });
  Toast.stdResponse(response);
  roleLoading.value = false;
  if (response.success) {
    closeRoleModal();
    refresh();
  }
};

const closeGroupModal = () => {
  showGroupModal.value = false;
  selectedUser.value = null;
  selectedGroupId.value = 0;
};

const handleGroupConfirm = async () => {
  if (!selectedUser.value) return;
  groupLoading.value = true;
  const response = await API.user.profile.moveGroup({
    userId: Number(selectedUser.value.userId),
    groupId: selectedGroupId.value,
  });
  Toast.stdResponse(response);
  groupLoading.value = false;
  if (response.success) {
    closeGroupModal();
    refresh();
  }
};

const openPasswordModal = (user: User) => {
  selectedPasswordUser.value = user;
  passwordForm.value = {
    newPassword: "",
    newPasswordConfirm: "",
  };
  showPasswordModal.value = true;
};

const closePasswordModal = () => {
  showPasswordModal.value = false;
  selectedPasswordUser.value = null;
  passwordForm.value = {
    newPassword: "",
    newPasswordConfirm: "",
  };
};

const handlePasswordConfirm = async () => {
  if (!selectedPasswordUser.value) return;
  passwordLoading.value = true;
  const response = await API.user.profile.changePassword({
    userId: Number(selectedPasswordUser.value.userId),
    newPassword: passwordForm.value.newPassword,
    newPasswordConfirm: passwordForm.value.newPasswordConfirm,
  });
  Toast.stdResponse(response);
  passwordLoading.value = false;
  if (response.success) {
    closePasswordModal();
  }
};

const openNicknameModal = async (user: User) => {
  selectedNicknameUser.value = user;
  nicknameLoading.value = true;
  const response = await API.user.profile.getById(Number(user.userId));
  nicknameLoading.value = false;
  if (!response.success) {
    Toast.stdResponse(response);
    selectedNicknameUser.value = null;
    return;
  }
  nicknameForm.value = {
    userId: Number(response.data.userId),
    name: response.data.name || "",
    email: response.data.email || "",
    avatar: response.data.avatar || "",
  };
  showNicknameModal.value = true;
};

const closeNicknameModal = () => {
  showNicknameModal.value = false;
  selectedNicknameUser.value = null;
  nicknameForm.value = {
    userId: 0,
    name: "",
    email: "",
    avatar: "",
  };
};

const handleNicknameConfirm = async () => {
  if (!selectedNicknameUser.value) return;
  if (!nicknameForm.value.name.trim()) {
    Toast.error("昵称不能为空");
    return;
  }

  nicknameLoading.value = true;
  const response = await API.user.profile.updateNickname({
    userId: nicknameForm.value.userId,
    name: nicknameForm.value.name.trim(),
    email: nicknameForm.value.email,
    avatar: nicknameForm.value.avatar,
  });
  Toast.stdResponse(response);
  nicknameLoading.value = false;
  if (response.success) {
    closeNicknameModal();
    refresh();
  }
};

const openBroadcastModal = () => {
  broadcastForm.value.content = "";
  showBroadcastModal.value = true;
};

const closeBroadcastModal = () => {
  showBroadcastModal.value = false;
  broadcastForm.value.content = "";
};

const handleBroadcastConfirm = async () => {
  const content = broadcastForm.value.content.trim();
  if (!content) {
    Toast.error("消息内容不能为空");
    return;
  }
  broadcastLoading.value = true;
  const response = await API.user.message.broadcast(content);
  Toast.stdResponse(response);
  broadcastLoading.value = false;
  if (response.success) {
    closeBroadcastModal();
  }
};

const canDeleteUser = (user: User) => {
  return (
    userStore.isAdmin &&
    Number(user.roleId) !== 1 &&
    Number(user.userId) !== Number(userStore.info?.userId)
  );
};

const handleDeleteUser = async (user: User) => {
  if (!canDeleteUser(user)) return;
  const userId = Number(user.userId);
  const displayName = user.name || user.username;
  if (!window.confirm(`确认删除用户「${displayName}」吗？删除后该用户不会再出现在列表和排名中。`)) {
    return;
  }

  deleteLoadingUserId.value = userId;
  const response = await API.user.profile.delete(userId);
  Toast.stdResponse(response);
  deleteLoadingUserId.value = null;
  if (response.success) {
    const currentPage = data.value?.currentPage || 1;
    const shouldBackPage = data.value.list.length === 1 && currentPage > 1;
    await getData(shouldBackPage ? currentPage - 1 : currentPage);
  }
};

const formatDate = (date: string) => {
  return new Date(Number(date) * 1000).toLocaleString("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

const fetchSpiderJobs = async () => {
  taskLoading.value = true;
  const response = await API.core.spider.jobs({
    scope: "all",
    status: taskStatusFilter.value,
    page: 1,
    pageSize: 20,
  });
  Toast.stdResponse(response, false);
  if (response.success) {
    spiderJobs.value = response.data.data;
  }
  taskLoading.value = false;
};

const setTaskFilter = (status: string) => {
  taskStatusFilter.value = status;
  fetchSpiderJobs();
};

const formatTaskStatus = (status: string) => {
  const map: Record<string, string> = {
    queued: "排队中",
    running: "抓取中",
    success: "完成",
    failed: "失败",
  };
  return map[status] || status;
};

const formatTaskSource = (source: string) => {
  const map: Record<string, string> = {
    manual: "手动刷新",
    cron: "定时刷新",
    bind: "绑定触发",
  };
  return map[source] || source;
};

const formatTaskTime = (time: number) => {
  if (!time) return "";
  return formatDate(String(time));
};

const jobProgress = (job: SpiderJobInfo) => {
  if (job.status === "success") return 100;
  if (job.totalPlatforms <= 0) return job.status === "running" ? 20 : 8;
  return Math.max(8, Math.min(100, Math.round((job.finishedPlatforms / job.totalPlatforms) * 100)));
};

const refresh = () => {
  getData(data.value?.currentPage || 1);
  fetchSpiderJobs();
};

onMounted(() => {
  getData(1);
  loadRoles();
  loadGroups();
  fetchSpiderJobs();
});
</script>

<style scoped>
@import "@/assets/css/navagation.css";

.dashboardContent {
  height: 100%;
  border-top: 1px solid var(--divider-color);
  color: var(--text-default-color);

  .section {
    border-radius: 6px;

    > .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 10px;
      border-bottom: 1px solid var(--divider-color);
    }

    > .content {
      padding: 10px;
      overflow: auto;

      &::-webkit-scrollbar {
        width: 5px;
        height: 5px;
      }

      &::-webkit-scrollbar-thumb {
        background-color: var(--divider-color);
        border-radius: 5px;
      }
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: var(--text-lg);
      font-weight: 600;
    }

    .header-tabs {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 12px;

      .tab {
        padding: 6px 12px;
        border-radius: 6px;
        background-color: var(--section-background-color);
        color: var(--text-light-color);
        font-size: var(--text-base);
        white-space: nowrap;
        cursor: pointer;
        transition:
          background-color 0.2s ease,
          color 0.2s ease;
        -webkit-user-select: none;
        user-select: none;

        &:hover {
          color: var(--text-default-color);
          background-color: var(--divider-color);
        }

        &.active {
          background-color: var(--neon-cyan);
          color: var(--background-color-1);
          font-weight: 500;
        }
      }
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
  }

  .avatar {
    width: 40px;
    height: 40px;
    overflow: hidden;
    border-radius: 6px;

    > img {
      width: 100%;
      height: 100%;
      -webkit-user-drag: none;
    }
  }

  .actions {
    display: flex;
    gap: 8px;
  }

  .btn {
    font-size: var(--text-sm);
    font-weight: 800;
    line-height: 1;
    padding: 5px 10px;
    border-radius: var(--control-radius);
    border: 1px solid var(--divider-color);
    color: var(--text-secondary-color);
    background-color: var(--background-color-2);
    font-family: inherit;
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
    cursor: pointer;
  }

  .btn:hover,
  .btn-primary:hover {
    border-color: var(--input-active-color);
    color: white;
    background-color: var(--input-active-color);
  }

  .btn-danger:hover {
    background-color: #f00;
    color: #fff;
  }
}

.spider-task-section {
  margin-top: 18px;
}

.spider-task-content {
  min-height: 120px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-row {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) 180px 160px;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--divider-color);
  border-radius: 10px;
  background-color: var(--background-color-1);
}

.task-main {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.task-status {
  border: 1px solid var(--divider-color);
  border-radius: 8px;
  padding: 3px 8px;
  font-size: var(--text-xs);
  font-weight: 800;
}

.task-status.status-running {
  color: var(--active-color);
}

.task-status.status-success {
  color: var(--neon-cyan);
}

.task-status.status-failed {
  color: #ff8585;
}

.task-status.status-queued {
  color: #ffb86c;
}

.task-progress {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background-color: var(--background-color-2);
}

.task-progress-bar {
  height: 100%;
  border-radius: inherit;
  background-color: var(--neon-cyan);
}

.task-time {
  color: var(--text-light-color);
  font-size: var(--text-xs);
  text-align: right;
}

.task-error {
  grid-column: 1 / -1;
  color: #ff8585;
  font-size: var(--text-xs);
  overflow-wrap: anywhere;
}

.task-empty {
  color: var(--text-light-color);
  text-align: center;
  padding: 24px 0;
}

@media (max-width: 760px) {
  .task-row {
    grid-template-columns: 1fr;
  }

  .task-time {
    text-align: left;
  }
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background-color: var(--background-color-1);
  border: 1px solid var(--divider-color);
  border-radius: 8px;
  width: 400px;
  max-width: 90vw;

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid var(--divider-color);
    font-size: var(--text-base);
    font-weight: 600;
  }

  .modal-close {
    width: 30px;
    height: 30px;
    min-height: 30px;
    padding: 0;
    border: 1px solid var(--divider-color);
    border-radius: var(--control-radius);
    background-color: var(--background-color-2);
    font-family: inherit;
    font-size: var(--text-base);
    font-weight: 800;
    cursor: pointer;
    color: var(--text-light-color);
    line-height: 1;

    &:hover {
      color: white;
      border-color: var(--neon-cyan);
      background-color: var(--neon-cyan);
    }
  }

  .modal-body {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;

    .modal-user {
      font-size: var(--text-base);
    }

    .modal-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .modal-field input,
    .modal-field textarea {
      outline: none;
      color: var(--text-default-color);
      border: 1px solid var(--divider-color);
      box-shadow: 0 0 0px 100px var(--background-color-1) inset;
      padding: 10px 12px;
      background-color: var(--background-color-1);
      border-radius: var(--control-radius);
      font-family: inherit;
      font-size: var(--text-sm);
    }

    .modal-field textarea {
      resize: vertical;
      min-height: 120px;
      box-shadow: none;
    }

    .modal-field input:focus,
    .modal-field textarea:focus {
      border-color: var(--input-active-color);
    }

    .field-hint {
      color: var(--text-light-color);
      font-size: var(--text-xs);
      text-align: right;
    }

    .label {
      color: var(--text-light-color);
    }

    .role-options {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 8px;
    }

    .role-option {
      padding: 6px 12px;
      border: 1px solid var(--divider-color);
      border-radius: var(--control-radius);
      cursor: pointer;
      font-family: inherit;
      font-size: var(--text-sm);
      font-weight: 800;
      line-height: 1;
      transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
      background-color: var(--background-color-2);
      color: var(--text-secondary-color);

      &:hover {
        border-color: var(--input-active-color);
        background-color: var(--input-active-color);
        color: white;
      }

      &.active {
        background-color: var(--input-active-color);
        color: white;
        border-color: var(--input-active-color);
      }
    }
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 16px;
    border-top: 1px solid var(--divider-color);

    .btn {
      min-width: 72px;
      padding: 5px 10px;
      border: 1px solid var(--divider-color);
      border-radius: var(--control-radius);
      color: var(--text-secondary-color);
      background-color: var(--background-color-2);
      font-family: inherit;
      font-size: var(--text-sm);
      font-weight: 800;
      line-height: 1;
      cursor: pointer;
      transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
    }

    .btn:hover,
    .btn-primary:hover {
      border-color: var(--input-active-color);
      color: white;
      background-color: var(--input-active-color);
    }

    .btn:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }
  }
}
</style>
