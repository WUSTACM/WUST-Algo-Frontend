<template>
    <BaseLayout>
        <Confirm ref="confirmRef" :message="'确定要退出登录吗？'" @confirm="logout" />
        <Confirm ref="confirmUpdateRef" :title="'更新OJ数据'" :message="'确定要更新OJ数据吗？这可能需要一些时间。'" @confirm="doUpdateLog" />
        <div class="container">
            <div class="top">
                <div class="left" style="position: relative;">
                    <LoadingOverlay :show="loadingProfile" />
                    <div class="background">
                        <div class="flow-emoji">
                            {{ '💯🏅🎯'.repeat(5) }}<br>
                            {{ '🏅🎯💯'.repeat(5) }}<br>
                            {{ '🎯💯🏅'.repeat(5) }}<br>
                            {{ '💯🏅🎯'.repeat(5) }}<br>
                            {{ '🏅🎯💯'.repeat(5) }}<br>
                            {{ '🎯💯🏅'.repeat(5) }}<br>
                        </div>
                    </div>
                    <div class="avatar">
                        <img :src="user.avatar ? user.avatar : '/images/defaultAvatar.png'" alt="" srcset="">
                    </div>
                    <div class="info">
                        <div class="name">
                            <div class="name">{{ user.name || "萌新" }}</div>
                            <div class="username">{{ user.username || "noob" }}</div>
                        </div>
                        <div class="training-statuses" v-if="trainingStatuses.length > 0">
                            <span
                                v-for="status in trainingStatuses"
                                :key="status.label"
                                class="training-status"
                                :class="`tone-${status.tone}`"
                                :title="status.description"
                            >
                                {{ status.label }}
                            </span>
                        </div>
                        <div class="details" v-if="user">
                            <div class="item" v-for="oj in ojPlatforms" :key="oj.key">
                                <div class="name">{{ oj.label }}</div>
                                <div class="link"
                                    :class="!(!user.links[oj.key] && currentUserId !== Number(user.userId)) ? 'go' : ''">
                                    <div v-if="!user.links[oj.key] && currentUserId !== Number(user.userId)">未绑定</div>
                                    <router-link v-else-if="!user.links[oj.key] && currentUserId === Number(user.userId)"
                                        :to="`/changeProfile?oj=${oj.key}`">去绑定</router-link>
                                    <a v-else target="_blank" :href="user.links[oj.key]">主页</a>
                                </div>
                            </div>
                        </div>
                        <div class="moblie-details">
                            <a class="item" v-if="user.links.NowCoder" target="_blank"
                                :href="user.links.NowCoder">牛客</a>
                            <a class="item" v-if="user.links.AtCoder" target="_blank"
                                :href="user.links.AtCoder">AtCoder</a>
                            <a class="item" v-if="user.links.CodeForces" target="_blank"
                                :href="user.links.CodeForces">CodeForces</a>
                            <a class="item" v-if="user.links.LuoGu" target="_blank" :href="user.links.LuoGu">洛谷</a>
                            <a class="item" v-if="user.links.QOJ" target="_blank" :href="user.links.QOJ">QOJ</a>
                        </div>
                    </div>
                    <div class="actions">
                        <template v-if="currentUserId === Number(user.userId)">
                            <button class="btn def" @click="showUpdateConfirm">更新OJ数据</button>
                            <button class="btn def" @click="router.push('/changeprofile')">编辑个人资料</button>
                            <button class="btn dan" @click="showLogoutConfirm">退出登录</button>
                        </template>
                        <button v-else-if="currentUserId" class="btn def" @click="openDirectMessage">发消息</button>
                    </div>
                    <div class="team-card" style="position: relative;">
                        <LoadingOverlay :show="loadingTeam" />
                        <div class="team-header">
                            <div class="team-title">
                                <img class="team-avatar" :src="teamInfo.avatar || '/images/defaultAvatar.png'" alt="">
                                <div>
                                    <div class="team-label">团队</div>
                                    <div class="team-name">{{ teamInfo.name }}</div>
                                </div>
                            </div>
                            <button v-if="isSelfProfile && teamInfo.id === 0 && teamPanelMode === 'idle'" class="team-edit"
                                @click="startCreateTeam">新建团队</button>
                            <button v-else-if="canManageTeam && teamPanelMode === 'idle'" class="team-edit"
                                @click="startEditTeam">编辑团队</button>
                            <button v-else-if="teamPanelMode !== 'idle'" class="team-edit" @click="closeTeamPanel">收起</button>
                        </div>
                        <div v-if="teamPanelMode === 'create'" class="team-form">
                            <div class="team-panel-title">创建团队</div>
                            <input v-model="teamForm.name" placeholder="团队名称">
                            <input v-model="teamForm.avatar" placeholder="团队头像链接（可选）">
                            <button class="team-action primary wide" @click="createTeam">创建并加入团队</button>
                        </div>
                        <div v-else-if="teamPanelMode === 'edit'" class="team-form">
                            <div class="team-panel-title">编辑团队资料</div>
                            <input v-model="teamForm.name" placeholder="团队名称">
                            <input v-model="teamForm.avatar" placeholder="团队头像链接（可选）">
                            <div class="team-inline-actions">
                                <button class="team-action primary" @click="updateTeam">保存</button>
                                <button class="team-action" @click="closeTeamPanel">取消</button>
                            </div>
                            <div class="team-panel-title">成员管理</div>
                            <div class="team-edit-members">
                                <div class="team-edit-member" v-for="member in teamInfo.members" :key="member.userId">
                                    <img :src="member.avatar || '/images/defaultAvatar.png'" alt="">
                                    <div class="member-info">
                                        <span class="member-name">{{ member.name || member.username }}</span>
                                        <span class="member-username">
                                            @{{ member.username }}
                                            <span v-if="Number(member.userId) === Number(teamInfo.ownerId)">队长</span>
                                        </span>
                                    </div>
                                    <button v-if="Number(member.userId) !== Number(teamInfo.ownerId)"
                                        class="team-action danger" @click="removeMember(member.userId)">移除</button>
                                </div>
                            </div>
                            <div class="team-panel-title">邀请成员</div>
                            <div class="team-search">
                                <input v-model="inviteKeyword" placeholder="输入姓名搜索用户">
                                <button class="team-action" @click="searchInviteUsers">搜索</button>
                            </div>
                            <div class="team-candidates" v-if="inviteCandidates.length > 0">
                                <button class="team-candidate" v-for="candidate in inviteCandidates"
                                    :key="candidate.userId" @click="sendInvite(Number(candidate.userId))">
                                    邀请 {{ candidate.name }} #{{ candidate.userId }}
                                </button>
                            </div>
                        </div>
                        <div v-if="teamOwner" class="team-owner" @click="router.push(`/profile?id=${teamOwner.userId}`)">
                            <img :src="teamOwner.avatar || '/images/defaultAvatar.png'" alt="">
                            <div class="team-owner-info">
                                <div class="team-owner-label">队长</div>
                                <div class="team-owner-name">{{ teamOwner.name || teamOwner.username }}</div>
                            </div>
                        </div>
                        <div class="team-stats">
                            <div class="team-stat">
                                <span class="value">{{ teamInfo.members.length }}</span>
                                <span class="label">成员</span>
                            </div>
                            <div class="team-stat">
                                <span class="value">{{ teamInfo.acTotal }}</span>
                                <span class="label">总AC</span>
                            </div>
                            <div class="team-stat">
                                <span class="value">{{ teamInfo.submitTotal }}</span>
                                <span class="label">总提交</span>
                            </div>
                        </div>
                        <div v-if="teamInfo.id !== 0" class="team-dashboard">
                            <div class="team-dashboard-title">
                                <span>训练看板</span>
                                <span>{{ teamDashboard.summary }}</span>
                            </div>
                            <div class="team-dashboard-grid">
                                <div class="team-dashboard-stat">
                                    <strong>{{ teamDashboard.weekAc }}</strong>
                                    <span>本周 AC</span>
                                </div>
                                <div class="team-dashboard-stat">
                                    <strong>{{ teamDashboard.monthAc }}</strong>
                                    <span>本月 AC</span>
                                </div>
                                <div class="team-dashboard-stat">
                                    <strong>{{ teamDashboard.activeMembers }}/{{ teamInfo.members.length }}</strong>
                                    <span>活跃成员</span>
                                </div>
                            </div>
                            <div class="team-dashboard-members" v-if="teamDashboard.members.length > 0">
                                <div class="team-dashboard-member" v-for="member in teamDashboard.members.slice(0, 5)"
                                    :key="member.userId">
                                    <div class="team-dashboard-member-main">
                                        <span>{{ member.name || member.username }}</span>
                                        <span>{{ member.weekAc }} AC / {{ member.weekSubmit }} 提交</span>
                                    </div>
                                    <div class="team-dashboard-bar">
                                        <div :style="{ width: teamMemberBarWidth(member.weekAc) + '%' }"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="team-members">
                            <div class="team-member" v-for="member in teamInfo.members.slice(0, 6)" :key="member.userId"
                                @click="router.push(`/profile?id=${member.userId}`)">
                                <img :src="member.avatar || '/images/defaultAvatar.png'" alt="">
                                <div class="member-info">
                                    <span class="member-name">{{ member.name || member.username }}</span>
                                    <span class="member-username">@{{ member.username }}<span
                                            v-if="Number(member.userId) === Number(teamInfo.ownerId)"
                                            class="member-role">队长</span></span>
                                </div>
                                <div class="member-score">{{ member.acTotal }} AC</div>
                            </div>
                            <div v-if="!loadingTeam && teamInfo.members.length === 0" class="team-empty">暂无团队成员</div>
                        </div>
                    </div>
                </div>
                <div class="right">
                    <div class="section" style="position: relative;">
                        <LoadingOverlay :show="loadingStats" />
                        <div class="header">
                            <div class="header-title">
                                <span class="title-icon">
                                    <font-awesome-icon icon="fa-solid fa-chart-line" />
                                </span>
                                <span class="title-text">数据</span>
                            </div>
                            <div class="header-tabs">
                                <span class="tab" @click="currentData = 0"
                                    :class="currentData === 0 ? 'active' : ''">提交</span>
                                <span class="tab" @click="currentData = 1"
                                    :class="currentData === 1 ? 'active' : ''">AC</span>
                            </div>
                        </div>
                        <div class="content">
                            <div v-if="currentData === 0" class="statisticItems">
                                <div class="statisticItem" v-for="item in data.submit">
                                    <div class="title">{{ item.title }}</div>
                                    <div class="barContainer">
                                        <div class="bar"
                                            :style="'width:' + ((item.value / (item.value + item.ave)) * 100) + '%'">
                                        </div>
                                        <div class="ave"
                                            :style="'left:' + ((item.ave / (item.value + item.ave)) * 100) + '%'">平均值:{{
                                                item.ave.toFixed(2) }}</div>
                                        <div class="cursor"
                                            :style="'left:' + ((item.ave / (item.value + item.ave)) * 100) + '%'"></div>
                                    </div>
                                    <div class="value">{{ item.value.toString().includes('.') ?
                                        item.value.toFixed(2) : item.value }}</div>
                                    <div class="grow" :class="getGrowClass(item.grow)">{{ item.grow ? item.grow > 0 ?
                                        '+' + item.grow : item.grow : '' }}
                                    </div>
                                </div>
                            </div>
                            <div v-else class="statisticItems">
                                <div class="statisticItem" v-for="item in data.ac">
                                    <div class="title">{{ item.title }}</div>
                                    <div class="barContainer">
                                        <div class="bar"
                                            :style="'width:' + ((item.value / (item.value + item.ave)) * 100) + '%'">
                                        </div>
                                        <div class="ave"
                                            :style="'left:' + ((item.ave / (item.value + item.ave)) * 100) + '%'">平均值:{{
                                                item.ave.toFixed(2) }}</div>
                                        <div class="cursor"
                                            :style="'left:' + ((item.ave / (item.value + item.ave)) * 100) + '%'"></div>
                                    </div>
                                    <div class="value">{{ item.value.toString().includes('.') ?
                                        item.value.toFixed(2) : item.value }}</div>
                                    <div class="grow" :class="getGrowClass(item.grow)">{{ item.grow ? item.grow > 0 ?
                                        '+' + item.grow : item.grow : '' }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="section insight-section" style="position: relative;">
                        <LoadingOverlay :show="loadingSyncStatus" />
                        <div class="header">
                            <div class="header-title">
                                <span class="title-icon portrait-title-icon">
                                    <font-awesome-icon icon="fa-solid fa-gauge-high" />
                                </span>
                                <span class="title-text">训练画像</span>
                            </div>
                        </div>
                        <div class="content">
                            <div class="portrait-card" v-if="trainingPortrait">
                                <div class="portrait-main">
                                    <span class="portrait-label" :class="`tone-${trainingPortrait.primary.tone}`">
                                        {{ trainingPortrait.primary.label }}
                                    </span>
                                    <span>{{ trainingPortrait.summary }}</span>
                                </div>
                                <div class="portrait-advice">{{ trainingPortrait.advice }}</div>
                                <div class="recent-summary">{{ trainingPortrait.recent30Summary }}</div>
                            </div>
                            <div v-if="activeSpiderJob" class="spider-job-card" :class="`job-${activeSpiderJob.status}`">
                                <div>
                                    <div class="job-title">{{ formatJobStatus(activeSpiderJob.status) }}</div>
                                    <div class="job-subtitle">
                                        {{ activeSpiderJob.currentPlatform || '等待调度' }}
                                        <template v-if="activeSpiderJob.totalPlatforms > 0">
                                            · {{ activeSpiderJob.finishedPlatforms }}/{{ activeSpiderJob.totalPlatforms }}
                                        </template>
                                    </div>
                                </div>
                                <div class="job-progress">
                                    <div class="job-progress-bar" :style="{ width: jobProgress(activeSpiderJob) + '%' }"></div>
                                </div>
                            </div>
                            <div class="sync-status-list">
                                <template v-if="syncStatuses.length > 0">
                                <div class="sync-status-item" v-for="item in syncStatuses" :key="item.platform">
                                    <div>
                                        <div class="sync-platform">{{ platformLabel(item.platform) }}</div>
                                        <div class="sync-meta">@{{ item.username }} · {{ formatSyncTime(item.lastSuccessAt) }}</div>
                                        <div v-if="item.lastError && item.canViewError" class="sync-error">{{ item.lastError }}</div>
                                    </div>
                                    <div class="sync-side">
                                        <div class="sync-counts">
                                            <span><strong>{{ platformStats(item.platform).ac }}</strong> 题</span>
                                            <span>{{ platformStats(item.platform).submit }} 提交</span>
                                        </div>
                                        <span class="sync-badge" :class="{ stale: item.isStale, failed: item.status === 'failed', running: item.status === 'running' }">
                                            {{ formatSyncStatus(item) }}
                                        </span>
                                    </div>
                                </div>
                                </template>
                                <template v-else-if="platformPeriodRows.length > 0">
                                <div class="sync-status-item" v-for="item in platformPeriodRows" :key="item.platform">
                                    <div>
                                        <div class="sync-platform">{{ platformLabel(item.platform) }}</div>
                                        <div class="sync-meta">平台统计</div>
                                    </div>
                                    <div class="sync-side">
                                        <div class="sync-counts">
                                            <span><strong>{{ item.ac.total }}</strong> 题</span>
                                            <span>{{ item.submit.total }} 提交</span>
                                        </div>
                                    </div>
                                </div>
                                </template>
                                <div class="sync-empty" v-if="!loadingSyncStatus && syncStatuses.length === 0 && platformPeriodRows.length === 0">暂无 OJ 绑定，绑定后会显示数据同步状态。</div>
                            </div>
                        </div>
                    </div>
                    <div class="section weekly-section" style="position: relative;">
                        <LoadingOverlay :show="loadingActivities || loadingStats" />
                        <div class="header">
                            <div class="header-title">
                                <span class="title-icon">
                                    <font-awesome-icon icon="fa-solid fa-calendar-days" />
                                </span>
                                <span class="title-text">训练周报</span>
                            </div>
                        </div>
                        <div class="content">
                            <div class="weekly-card">
                                <div class="weekly-title">
                                    <span>{{ weeklyReport.title }}</span>
                                </div>
                                <div class="weekly-summary">{{ weeklyReport.summary }}</div>
                                <div class="weekly-metrics">
                                    <div class="weekly-metric" v-for="metric in weeklyReport.metrics" :key="metric.label">
                                        <strong>{{ metric.value }}</strong>
                                        <span>{{ metric.label }}</span>
                                        <em>{{ metric.hint }}</em>
                                    </div>
                                </div>
                                <div class="weekly-advice">{{ weeklyReport.advice }}</div>
                                <div class="weekly-version">v1.1</div>
                            </div>
                        </div>
                    </div>
                    <div class="section achievement-section" style="position: relative;">
                        <LoadingOverlay :show="loadingActivities || loadingStats" />
                        <div class="header">
                            <div class="header-title">
                                <span class="title-icon">
                                    <font-awesome-icon icon="fa-solid fa-trophy" />
                                </span>
                                <span class="title-text">成就徽章</span>
                            </div>
                            <div class="header-tabs">
                                <span class="tab active">{{ unlockedAchievements.length }}/{{ achievements.length }}</span>
                            </div>
                        </div>
                        <div class="content">
                            <div class="achievement-grid">
                                <div class="achievement-card" v-for="badge in achievements" :key="badge.key"
                                    :class="[{ locked: !badge.unlocked }, `tone-${badge.tone}`]">
                                    <div class="achievement-icon">{{ badge.icon }}</div>
                                    <div class="achievement-info">
                                        <div class="achievement-name">{{ badge.label }}</div>
                                        <div class="achievement-desc">{{ badge.description }}</div>
                                        <div class="achievement-progress">
                                            <div :style="{ width: badge.progress + '%' }"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="section" style="position: relative;">
                        <LoadingOverlay :show="loadingHeatmap" />
                        <div class="header">
                            <div class="header-title">
                                <span class="title-icon">
                                    <font-awesome-icon icon="fa-solid fa-chart-line" />
                                </span>
                                <span class="title-text">热力图</span>
                            </div>
                            <div class="header-tabs">
                                <span class="tab" @click="currentCalendar = 0"
                                    :class="currentCalendar === 0 ? 'active' : ''">提交热力图</span>
                                <span class="tab" @click="currentCalendar = 1"
                                    :class="currentCalendar === 1 ? 'active' : ''">AC热力图</span>
                            </div>
                        </div>
                        <div class="content">
                            <Calendar :data="submitData" style="width: 100%;" v-if="currentCalendar === 0"
                                :year="dynamicYear" @changeYear="handleYearChange"></Calendar>
                            <Calendar :data="acData" style="width: 100%;" v-else :year="dynamicYear"
                                @changeYear="handleYearChange"></Calendar>
                        </div>
                    </div>
                    <div class="section" style="position: relative;">
                        <LoadingOverlay :show="loadingHeatmap" />
                        <div class="header">
                            <div class="header-title">
                                <span class="title-icon">
                                    <font-awesome-icon icon="fa-solid fa-chart-line" />
                                </span>
                                <span class="title-text">提交趋势</span>
                            </div>
                        </div>
                        <div class="content">
                            <div class="profile-chart-container">
                                <v-chart class="profile-chart" :option="chartOption" autoresize />
                            </div>
                        </div>
                    </div>
                    <div class="section" style="position: relative;">
                        <LoadingOverlay :show="loadingActivities" />
                        <div class="header">
                            <div class="header-title">
                                <span class="title-icon">
                                    <font-awesome-icon icon="fa-solid fa-chart-line" />
                                </span>
                                <span class="title-text">近期动态</span>
                            </div>
                            <div class="header-tabs">
                                <span class="tab" @click="router.push(`/allActivities?id=${user.userId}`)">查看所有动态</span>
                            </div>
                        </div>
                        <div class="content">
                            <div v-if="activities.length != 0" class="activities">
                                <div class="activity" v-for="activity in activities">
                                    <div class="title">
                                        <span>{{ activity.title }}</span>
                                        <a :href="activity.link" target="_blank">{{ activity.status }}</a>
                                    </div>
                                    <div class="time">{{ activity.time }}</div>
                                </div>
                            </div>
                            <div v-else>暂无近期动态</div>
                        </div>
                    </div>
                    <div class="section" style="position: relative;">
                        <LoadingOverlay :show="loadingContests" />
                        <div class="header">
                            <div class="header-title">
                                <span class="title-icon">
                                    <font-awesome-icon icon="fa-solid fa-chart-line" />
                                </span>
                                <span class="title-text">最近参加的比赛</span>
                            </div>
                            <div class="header-tabs">
                                <span class="tab" @click="router.push(`/contest?id=${user.userId}`)">查看所有比赛</span>
                            </div>
                        </div>
                        <div class="content">
                            <div class="contests">
                                <div class="contest" v-for="contest in contests">
                                    <div class="info">
                                        <div class="platform">{{ contest.platform }}</div>
                                        <div class="title">{{ contest.contestName }}</div>
                                    </div>
                                    <div class="actions">
                                        <div class="btn def" @click="toContest(contest.contestUrl)">跳转到比赛主页</div>
                                        <div class="btn def" @click="router.push({ path: '/contest/' + contest.id })">
                                            查看比赛信息</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="moblie-actions" v-if="currentUserId">
                        <template v-if="currentUserId === Number(user.userId)">
                            <button class="btn def" @click="showUpdateConfirm">更新OJ数据</button>
                            <button class="btn def" @click="router.push('/changeprofile')">编辑个人资料</button>
                            <button class="btn dan" @click="showLogoutConfirm">退出登录</button>
                        </template>
                        <button v-else class="btn def" @click="openDirectMessage">发消息</button>
                    </div>
                </div>
            </div>
            <div class="bottom">
            </div>
        </div>
    </BaseLayout>
</template>

<script setup lang="ts">
import BaseLayout from '@/components/BaseLayout.vue'
import Calendar from '@/components/Calendar.vue';
import { computed, ref, onBeforeUnmount, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import JWT from '../utils/jwt';
import Confirm from '@/components/confirm.vue'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import { useUserStore } from '@/stores/user';
import API from '@/utils/api';
import type { CoreContestListData, CoreStatisticPeriodData, CoreStatisticPlatformPeriodItem, CoreSubmitLogGetByIdData, SpiderJobInfo, SpiderSyncStatusInfo, UserProfileGetByNameList } from '@/utils/api';
import Toast from '@/utils/toast';
import type { User } from '@/utils/type';
import Link from '@/utils/link';
import Bot from '@/utils/bot';
import { buildTrainingPortrait, buildTrainingStatuses, type TrainingPortrait, type TrainingStatusBadge } from '@/utils/trainingStatus';
import {
    buildAchievementBadges,
    buildTeamDashboard,
    buildWeeklyReport,
    type AchievementBadge,
    type TeamDashboard,
    type TeamDashboardMember,
    type WeeklyReport,
} from '@/utils/v11Features';
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { LineChart } from "echarts/charts";
import {
    DataZoomComponent,
    GridComponent,
    LegendComponent,
    TooltipComponent,
} from "echarts/components";
import VChart from "vue-echarts";

use([
    CanvasRenderer,
    LineChart,
    TooltipComponent,
    LegendComponent,
    GridComponent,
    DataZoomComponent,
]);

Bot.tip.addOjTip();

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const currentCalendar = ref(0);
const currentData = ref(0)

const jwtUserInfo = JWT.getUserInfo();
const currentUserId = computed(() => Number(jwtUserInfo?.userId || 0))

const user = ref<User>({
    avatar: "",
    email: "",
    groupId: "",
    name: "",
    spiders: [],
    links: {
        AtCoder: "",
        NowCoder: "",
        LuoGu: "",
        CodeForces: "",
        LeetCode: "",
        QOJ: ""
    },
    userId: 0,
    username: ""
})

const confirmRef = ref()
const confirmUpdateRef = ref()
const loadingProfile = ref(true)
const loadingStats = ref(true)
const loadingHeatmap = ref(true)
const loadingActivities = ref(true)
const loadingContests = ref(true)
const loadingTeam = ref(true)
const isCompactScreen = ref(false);
const trainingStatuses = ref<TrainingStatusBadge[]>([]);
const trainingPortrait = ref<TrainingPortrait | null>(null);
const recentSubmitLogs = ref<CoreSubmitLogGetByIdData[]>([]);
const profilePeriodData = ref<CoreStatisticPeriodData | null>(null);
const platformPeriodStats = ref<CoreStatisticPlatformPeriodItem[]>([]);
const syncStatuses = ref<SpiderSyncStatusInfo[]>([]);
const loadingSyncStatus = ref(false);
const activeSpiderJob = ref<SpiderJobInfo | null>(null);
let spiderJobTimer: number | undefined;

const syncScreenSize = () => {
    isCompactScreen.value = window.innerWidth <= 640;
};

const ojPlatforms = [
    { key: 'AtCoder' as const, label: 'AtCoder' },
    { key: 'NowCoder' as const, label: '牛客' },
    { key: 'LuoGu' as const, label: '洛谷' },
    { key: 'CodeForces' as const, label: 'CodeForces' },
    { key: 'QOJ' as const, label: 'QOJ' },
]

interface ActivityItem {
    title: string;
    status: string;
    link: string;
    time: string;
}

const refreshTrainingStatuses = () => {
    const input = {
        period: profilePeriodData.value,
        recentLogs: recentSubmitLogs.value,
        lastSubmit: recentSubmitLogs.value[0]?.time,
    };
    trainingStatuses.value = buildTrainingStatuses(input);
    trainingPortrait.value = buildTrainingPortrait(input);
}

interface TeamMember {
    userId: number;
    avatar: string;
    name: string;
    username: string;
    acTotal: number;
    submitTotal: number;
    weekAc: number;
    weekSubmit: number;
    monthAc: number;
    monthSubmit: number;
}

interface TeamInfo {
    id: number;
    name: string;
    avatar: string;
    ownerId: number;
    acTotal: number;
    submitTotal: number;
    members: TeamMember[];
}

const teamInfo = ref<TeamInfo>({
    id: 0,
    name: '无团队',
    avatar: '',
    ownerId: 0,
    acTotal: 0,
    submitTotal: 0,
    members: [] as TeamMember[]
})

const teamForm = ref({
    name: '',
    avatar: ''
})
type TeamPanelMode = 'idle' | 'create' | 'edit'
const teamPanelMode = ref<TeamPanelMode>('idle')
const inviteKeyword = ref('')
const inviteCandidates = ref<UserProfileGetByNameList[]>([])
const isSelfProfile = computed(() => currentUserId.value !== 0 && currentUserId.value === Number(user.value.userId))
const canManageTeam = computed(() => {
    if (!isSelfProfile.value || teamInfo.value.id === 0) return false;
    return Number(teamInfo.value.ownerId) === currentUserId.value;
})
const teamOwner = computed(() => teamInfo.value.members.find(member => Number(member.userId) === Number(teamInfo.value.ownerId)))
const platformPeriodRows = computed(() => {
    return platformPeriodStats.value.filter((item) => Number(item.ac?.total || 0) > 0 || Number(item.submit?.total || 0) > 0);
})

const platformStats = (platform: string) => {
    const item = platformPeriodStats.value.find((stat) => stat.platform === platform);
    return {
        ac: Number(item?.ac?.total || 0),
        submit: Number(item?.submit?.total || 0),
    };
}

const achievements = computed<AchievementBadge[]>(() => {
    return buildAchievementBadges(profilePeriodData.value, recentSubmitLogs.value, platformPeriodStats.value);
})

const unlockedAchievements = computed(() => achievements.value.filter((item) => item.unlocked))

const weeklyReport = computed<WeeklyReport>(() => {
    return buildWeeklyReport(profilePeriodData.value, recentSubmitLogs.value);
})

const teamDashboard = computed<TeamDashboard>(() => {
    return buildTeamDashboard(teamInfo.value.members as TeamDashboardMember[]);
})

const teamMemberBarWidth = (weekAc: number) => {
    const max = Math.max(...teamDashboard.value.members.map((member) => member.weekAc), 1);
    return Math.max(8, Math.round((weekAc / max) * 100));
}

// 增加占位数据，保证刷新时页面变化小
const activities = ref<ActivityItem[]>([
    {
        title: "-",
        status: "",
        link: "",
        time: ""
    }, {
        title: "-",
        status: "",
        link: "",
        time: ""
    }, {
        title: "-",
        status: "",
        link: "",
        time: ""
    }, {
        title: "-",
        status: "",
        link: "",
        time: ""
    }, {
        title: "-",
        status: "",
        link: "",
        time: ""
    }, {
        title: "-",
        status: "",
        link: "",
        time: ""
    }, {
        title: "-",
        status: "",
        link: "",
        time: ""
    }, {
        title: "-",
        status: "",
        link: "",
        time: ""
    }, {
        title: "-",
        status: "",
        link: "",
        time: ""
    }, {
        title: "-",
        status: "",
        link: "",
        time: ""
    },
])

const chunkedMap = async <T, R>(items: T[], size: number, mapper: (item: T) => Promise<R>): Promise<R[]> => {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += size) {
        const chunk = items.slice(i, i + size);
        results.push(...await Promise.all(chunk.map(mapper)));
    }
    return results;
}

const getTeamInfo = async () => {
    loadingTeam.value = true;
    teamPanelMode.value = 'idle';
    inviteCandidates.value = [];
    const groupId = Number(user.value.groupId) || 0;
    if (groupId === 0) {
        teamInfo.value = {
            id: 0,
            name: '无团队',
            avatar: '',
            ownerId: 0,
            acTotal: 0,
            submitTotal: 0,
            members: []
        };
        teamForm.value = { name: '', avatar: '' };
        loadingTeam.value = false;
        return;
    }
    const teamResponse = await API.user.team.detail(groupId);
    if (!teamResponse.success) {
        Toast.stdResponse(teamResponse, false);
        loadingTeam.value = false;
        return;
    }
    const members = await chunkedMap(teamResponse.data.users, 6, async (member): Promise<TeamMember> => {
        const response = await API.core.statistic.period(member.userId);
        const stats = response.success ? response.data.data : null;
        return {
            userId: Number(member.userId),
            avatar: member.avatar,
            name: member.name,
            username: member.username,
            acTotal: stats ? Number(stats.ac.total) : 0,
            submitTotal: stats ? Number(stats.submit.total) : 0,
            weekAc: stats ? Number(stats.ac.thisWeek) : 0,
            weekSubmit: stats ? Number(stats.submit.thisWeek) : 0,
            monthAc: stats ? Number(stats.ac.thisMonth) : 0,
            monthSubmit: stats ? Number(stats.submit.thisMonth) : 0
        };
    });
    const sortedMembers = members.sort((a, b) => b.acTotal - a.acTotal || b.submitTotal - a.submitTotal || a.userId - b.userId);

    teamInfo.value = {
        id: groupId,
        name: teamResponse.data.name || `团队 ${groupId}`,
        avatar: teamResponse.data.avatar || '',
        ownerId: Number(teamResponse.data.ownerId) || 0,
        acTotal: sortedMembers.reduce((sum, item) => sum + item.acTotal, 0),
        submitTotal: sortedMembers.reduce((sum, item) => sum + item.submitTotal, 0),
        members: sortedMembers
    };
    teamForm.value = {
        name: teamInfo.value.name,
        avatar: teamInfo.value.avatar
    };
    loadingTeam.value = false;
}

const startEditTeam = () => {
    teamForm.value = {
        name: teamInfo.value.name,
        avatar: teamInfo.value.avatar
    };
    inviteKeyword.value = '';
    inviteCandidates.value = [];
    teamPanelMode.value = 'edit';
}

const startCreateTeam = () => {
    teamForm.value = { name: '', avatar: '' };
    teamPanelMode.value = 'create';
}

const closeTeamPanel = () => {
    teamPanelMode.value = 'idle';
    inviteKeyword.value = '';
    inviteCandidates.value = [];
}

const createTeam = async () => {
    if (!teamForm.value.name.trim()) {
        Toast.warn('请填写团队名称');
        return;
    }
    const response = await API.user.team.create({
        name: teamForm.value.name.trim(),
        avatar: teamForm.value.avatar.trim(),
        describe: ''
    });
    Toast.stdResponse(response);
    if (response.success) {
        user.value.groupId = String(response.data.id);
        await getTeamInfo();
        teamPanelMode.value = 'edit';
    }
}

const updateTeam = async () => {
    if (!teamForm.value.name.trim()) {
        Toast.warn('请填写团队名称');
        return;
    }
    const response = await API.user.team.update({
        id: teamInfo.value.id,
        name: teamForm.value.name.trim(),
        avatar: teamForm.value.avatar.trim(),
        describe: ''
    });
    Toast.stdResponse(response);
    if (response.success) {
        teamPanelMode.value = 'idle';
        await getTeamInfo();
    }
}

const searchInviteUsers = async () => {
    if (!inviteKeyword.value.trim()) {
        Toast.warn('请输入姓名搜索用户');
        return;
    }
    const response = await API.user.profile.getByName(inviteKeyword.value.trim());
    Toast.stdResponse(response, false);
    if (response.success) {
        const details = await Promise.all(
            response.data.list.map(async (item) => {
                const detail = await API.user.profile.getById(Number(item.userId));
                return {
                    item,
                    groupId: detail.success ? Number(detail.data.groupId || 0) : -1
                };
            })
        );
        inviteCandidates.value = details
            .filter(({ item, groupId }) => Number(item.userId) !== user.value.userId && groupId === 0)
            .map(({ item }) => item);
        if (inviteCandidates.value.length === 0) {
            Toast.info('没有找到可邀请的无团队用户');
        }
    }
}

const sendInvite = async (inviteeId: number) => {
    const targetUserId = Number(inviteeId);
    if (!Number.isFinite(targetUserId) || targetUserId <= 0) {
        Toast.error('邀请用户ID无效');
        return;
    }
    const response = await API.user.team.invite(targetUserId);
    Toast.stdResponse(response);
    if (response.success) {
        inviteCandidates.value = inviteCandidates.value.filter(item => Number(item.userId) !== targetUserId);
    }
}

const removeMember = async (userId: number) => {
    const response = await API.user.team.removeMember(userId);
    Toast.stdResponse(response);
    if (response.success) {
        await getTeamInfo();
        teamPanelMode.value = 'edit';
    }
}

const getSubmitInfo = async () => {
    loadingActivities.value = true;
    try {
        const recentLogs: CoreSubmitLogGetByIdData[] = [];
        let cursor = -1;
        const pageSize = 300;
        const maxLogs = 2000;
        const minTime = Math.floor(Date.now() / 1000) - 60 * 86400;

        while (recentLogs.length < maxLogs) {
            const response = await API.core.submitLog.getById(user.value.userId, cursor, pageSize);
            Toast.stdResponse(response, false);

            if (!response.success) {
                break;
            }

            const pageLogs = response.data.data || [];
            recentLogs.push(...pageLogs);

            if (pageLogs.length === 0 || pageLogs.length < pageSize) {
                break;
            }

            const lastLog = pageLogs[pageLogs.length - 1];
            if (!lastLog) {
                break;
            }
            cursor = Number(lastLog.time || 0);
            if (!cursor || cursor < minTime) {
                break;
            }
        }

        recentSubmitLogs.value = recentLogs;
        refreshTrainingStatuses();
        activities.value = [];

        if (recentLogs.length > 0) {
            recentLogs.slice(0, 10).forEach((item: CoreSubmitLogGetByIdData) => {
                const platform = item.platform;
                const lang = item.lang;
                const contest = item.contest;
                const problem = item.problem;
                const status = item.status;
                const time = new Date(Number(item.time) * 1000).toLocaleString('sv-SE', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                });

                activities.value.push({
                    title: `在 ${platform} 使用 ${lang} 解决 ${problem || contest}：`,
                    status: status,
                    link: Link.getSubmitLink(platform, contest, item.submitId),
                    time: time,
                });
            });
        }
    } finally {
        loadingActivities.value = false;
    }
}

// 获取用户信息
const getUserInfo = async () => {
    loadingProfile.value = true;
    const response = await API.user.profile.getById(user.value.userId);

    if (response.success) {
        user.value = response.data;
        loadingProfile.value = false;
    }

    Toast.stdResponse(response, false);

    getSubmitInfo();
    getHeatmapData();
    getData();
    getContests();
    getTeamInfo();
    getSyncStatus();
}

interface HeatmapData {
    date: string;
    count: number;
}

const submitData = ref<HeatmapData[]>([])
const acData = ref<HeatmapData[]>([])
const submitTrendData = ref<HeatmapData[]>([])
const acTrendData = ref<HeatmapData[]>([])

const dynamicYear = ref<number>(new Date().getFullYear())

const handleYearChange = (year: number) => {
    dynamicYear.value = year
}

const padZero = (num: number): string => {
    return num < 10 ? '0' + num : num.toString();
}

const getHeatmapData = async () => {
    loadingHeatmap.value = true;
    const dateObj = new Date();
    const date = dateObj.getFullYear() + padZero(dateObj.getMonth() + 1) + padZero(dateObj.getDate());

    const response1 = await API.core.statistic.heatmap({
        userId: user.value.userId,
        startDate: "20230101",
        endDate: date,
        isAc: false
    })
    Toast.stdResponse(response1, false);

    if (response1.success) {
        submitTrendData.value = response1.data.data;
        submitData.value = response1.data.data.filter(item => item.count > 0);
    }

    const response2 = await API.core.statistic.heatmap({
        userId: user.value.userId,
        startDate: "20230101",
        endDate: date,
        isAc: true
    })
    Toast.stdResponse(response2, false);

    if (response2.success) {
        acTrendData.value = response2.data.data;
        acData.value = response2.data.data.filter(item => item.count > 0);
    }
    loadingHeatmap.value = false;
}

const calculateDefaultRange = (dates: string[]) => {
    if (dates.length === 0) {
        return {
            startIndex: 0,
            endIndex: 0
        };
    }
    if (dates.length <= 30) {
        return {
            startIndex: 0,
            endIndex: dates.length - 1
        };
    }
    const endIndex = dates.length - 1;
    const startIndex = Math.max(0, endIndex - 29);
    return {
        startIndex,
        endIndex
    };
}

const chartOption = computed(() => {
    const sortedAcData = [...acTrendData.value].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const sortedSubmitData = [...submitTrendData.value].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const dates = sortedSubmitData.length > 0
        ? sortedSubmitData.map((item) => item.date)
        : sortedAcData.map((item) => item.date);
    const acMap = new Map(sortedAcData.map((item) => [item.date, item.count]));
    const submitMap = new Map(sortedSubmitData.map((item) => [item.date, item.count]));
    const acValues = dates.map((date) => acMap.get(date) || 0);
    const submitValues = dates.map((date) => submitMap.get(date) || 0);
    const { startIndex, endIndex } = calculateDefaultRange(dates);
    const divisor = Math.max(dates.length - 1, 1);
    const startPercent = (startIndex / divisor) * 100;
    const endPercent = dates.length <= 1 ? 100 : (endIndex / divisor) * 100;

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
            bottom: isCompactScreen.value ? 36 : 64,
            containLabel: true,
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

interface Unit {
    title: string;
    value: number;
    ave: number;
    grow?: number;
}

interface Data {
    ac: {
        today: Unit,
        thisWeek: Unit,
        thisMonth: Unit,
        thisYear: Unit,
        total: Unit,
        percentage: Unit
    },
    submit: {
        today: Unit,
        thisWeek: Unit,
        thisMonth: Unit,
        thisYear: Unit,
        total: Unit,
        percentage: Unit
    }
}

const data = ref<Data>({
    ac: {
        today: {
            title: "今日AC",
            value: 0,
            ave: 0,
            grow: undefined
        },
        thisWeek: {
            title: "本周AC",
            value: 0,
            ave: 0,
            grow: 0
        },
        thisMonth: {
            title: "本月AC",
            value: 0,
            ave: 0,
            grow: 0
        },
        thisYear: {
            title: "今年AC",
            value: 0,
            ave: 0,
            grow: 0
        },
        total: {
            title: "总AC",
            value: 0,
            ave: 0,
            grow: undefined
        },
        percentage: {
            title: "AC率",
            value: 0,
            ave: 0,
            grow: undefined
        }
    },
    submit: {
        today: {
            title: "今日提交",
            value: 0,
            ave: 0,
            grow: undefined
        },
        thisWeek: {
            title: "本周提交",
            value: 0,
            ave: 0,
            grow: 0
        },
        thisMonth: {
            title: "本月提交",
            value: 0,
            ave: 0,
            grow: 0
        },
        thisYear: {
            title: "今年提交",
            value: 0,
            ave: 0,
            grow: 0
        },
        total: {
            title: "总提交",
            value: 0,
            ave: 0,
            grow: undefined
        },
        percentage: {
            title: "AC率",
            value: 0,
            ave: 0,
            grow: undefined
        }
    },
})

const getGrowClass = (grow: number | undefined) => {
    if (grow !== undefined && grow !== null) {
        if (grow === 0) {
            return "equal";
        } else if (grow > 0) {
            return "up";
        } else if (grow < 0) {
            return "down";
        }
    }
}

const getData = async () => {
    const userId = user.value.userId

    const [userResponse, globalResponse, userCountResponse, platformResponse] = await Promise.all([
        API.core.statistic.period(userId),
        API.core.statistic.period(-1),
        API.user.profile.list(1),
        API.core.statistic.platformPeriod(userId)
    ]);

    Toast.stdResponse(userResponse, false);
    Toast.stdResponse(globalResponse, false);
    Toast.stdResponse(userCountResponse, false);
    Toast.stdResponse(platformResponse, false);

    if (platformResponse.success) {
        platformPeriodStats.value = platformResponse.data.data;
    } else {
        platformPeriodStats.value = [];
    }

    if (userResponse.success && globalResponse.success && userCountResponse.success) {
        const userData: CoreStatisticPeriodData = userResponse.data.data;
        const globalData: CoreStatisticPeriodData = globalResponse.data.data;
        const userCount: number = userCountResponse.data.total;
        profilePeriodData.value = userData;
        refreshTrainingStatuses();
        data.value = {
            ac: {
                today: {
                    title: "今日AC",
                    value: Number(userData.ac.today),
                    ave: globalData.ac.today / userCount,
                    grow: undefined
                },
                thisWeek: {
                    title: "本周AC",
                    value: Number(userData.ac.thisWeek),
                    ave: globalData.ac.thisWeek / userCount,
                    grow: userData.ac.thisWeek - userData.ac.lastWeek
                },
                thisMonth: {
                    title: "本月AC",
                    value: Number(userData.ac.thisMonth),
                    ave: globalData.ac.thisMonth / userCount,
                    grow: userData.ac.thisMonth - userData.ac.lastMonth
                },
                thisYear: {
                    title: "今年AC",
                    value: Number(userData.ac.thisYear),
                    ave: globalData.ac.thisYear / userCount,
                    grow: userData.ac.thisYear - userData.ac.lastYear
                },
                total: {
                    title: "总AC ",
                    value: Number(userData.ac.total),
                    ave: globalData.ac.total / userCount,
                    grow: undefined
                },
                percentage: {
                    title: "AC率 ",
                    value: userData.ac.total / userData.submit.total * 100,
                    ave: globalData.ac.total / globalData.submit.total * 100,
                    grow: undefined
                }
            },
            submit: {
                today: {
                    title: "今日提交",
                    value: Number(userData.submit.today),
                    ave: globalData.submit.today / userCount,
                    grow: undefined
                },
                thisWeek: {
                    title: "本周提交",
                    value: Number(userData.submit.thisWeek),
                    ave: globalData.submit.thisWeek / userCount,
                    grow: userData.submit.thisWeek - userData.submit.lastWeek
                },
                thisMonth: {
                    title: "本月提交",
                    value: Number(userData.submit.thisMonth),
                    ave: globalData.submit.thisMonth / userCount,
                    grow: userData.submit.thisMonth - userData.submit.lastMonth
                },
                thisYear: {
                    title: "今年提交",
                    value: Number(userData.submit.thisYear),
                    ave: globalData.submit.thisYear / userCount,
                    grow: userData.submit.thisYear - userData.submit.lastYear
                },
                total: {
                    title: "总提交",
                    value: Number(userData.submit.total),
                    ave: globalData.submit.total / userCount,
                    grow: undefined
                },
                percentage: {
                    title: "AC率",
                    value: userData.ac.total / userData.submit.total * 100,
                    ave: globalData.ac.total / globalData.submit.total * 100,
                    grow: undefined
                }
            }
        }
        loadingStats.value = false;
    }
}

const updateLog = async () => {
    const response = await API.core.spider.update(user.value.userId);
    Toast.stdResponse(response);
    const jobId = Number(response.data?.jobId || 0);
    if (response.success && jobId > 0) {
        await pollSpiderJob(jobId);
    }
}

const stopSpiderJobPolling = () => {
    if (spiderJobTimer) {
        window.clearInterval(spiderJobTimer);
        spiderJobTimer = undefined;
    }
}

const pollSpiderJob = async (jobId: number) => {
    stopSpiderJobPolling();
    const load = async () => {
        const response = await API.core.spider.job(jobId);
        if (!response.success || !response.data?.data) return;
        activeSpiderJob.value = response.data.data;
        if (["success", "failed"].includes(activeSpiderJob.value.status)) {
            stopSpiderJobPolling();
            await getSyncStatus();
            await getData();
            await getSubmitInfo();
            if (activeSpiderJob.value.status === "success") {
                Toast.success("OJ 数据更新完成");
            } else {
                Toast.error(activeSpiderJob.value.error || "OJ 数据更新失败");
            }
        }
    };
    await load();
    if (!activeSpiderJob.value || !["success", "failed"].includes(activeSpiderJob.value.status)) {
        spiderJobTimer = window.setInterval(load, 2000);
    }
}

const getSyncStatus = async () => {
    if (!user.value.userId || !currentUserId.value) return;
    loadingSyncStatus.value = true;
    const response = await API.core.spider.status(user.value.userId);
    Toast.stdResponse(response, false);
    if (response.success) {
        syncStatuses.value = response.data.data;
    }
    loadingSyncStatus.value = false;
}

const platformLabel = (platform: string) => {
    return ojPlatforms.find((item) => item.key === platform)?.label || platform;
}

const formatSyncTime = (timestamp: number) => {
    if (!timestamp) return "未同步";
    return new Date(timestamp * 1000).toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}

const formatSyncStatus = (item: SpiderSyncStatusInfo) => {
    if (item.status === "running") return "抓取中";
    if (item.status === "success" && !item.isStale) return "已同步";
    return "未同步";
}

const formatJobStatus = (status: string) => {
    const map: Record<string, string> = {
        queued: "排队中",
        running: "抓取中",
        success: "已完成",
        failed: "失败",
    };
    return map[status] || status;
}

const jobProgress = (job: SpiderJobInfo) => {
    if (job.status === "success") return 100;
    if (job.totalPlatforms <= 0) return job.status === "running" ? 20 : 8;
    return Math.max(8, Math.min(100, Math.round((job.finishedPlatforms / job.totalPlatforms) * 100)));
}

const showUpdateConfirm = () => {
    confirmUpdateRef.value?.show()
}

const doUpdateLog = () => {
    updateLog()
}

const contests = ref<CoreContestListData[]>([])

const getContests = async () => {
    loadingContests.value = true;
    const limit = 5;
    const offset = 0;
    const userId = user.value.userId;

    const response = await API.core.contest.list({ limit, offset, userId });
    Toast.stdResponse(response, false);

    if (response.success) {
        contests.value = response.data.data;
        loadingContests.value = false;
    }
}

const toContest = (url: string) => {
    window.open(url);
}

const openDirectMessage = () => {
    if (!user.value.userId || currentUserId.value === Number(user.value.userId)) return;
    router.push(`/bulletin?tab=dm&userId=${user.value.userId}`);
}

const showLogoutConfirm = () => {
    confirmRef.value?.show()
}

const logout = async () => {
    JWT.clearToken()
    userStore.syncStatus()

    // 跳转到登录页面
    router.push('/login')
}

onMounted(() => {
    syncScreenSize();
    window.addEventListener("resize", syncScreenSize);
    // 该页面有登录路由守卫
    if (route.query.id) {
        user.value.userId = Number(route.query.id);
    } else {
        user.value.userId = JWT.getUserInfo()!.userId;
    }
    getUserInfo();
})

onBeforeUnmount(() => {
    window.removeEventListener("resize", syncScreenSize);
    stopSpiderJobPolling();
})
</script>

<style scoped>
.container {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 20px 0;
    gap: 20px;

    >.top {
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        justify-content: space-around;

        >.left,
        >.right {
            display: flex;
            flex-direction: column;
        }

        >.left {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 300px;
            gap: 20px;


            >.background {
                display: none;
            }

            >.avatar {
                position: relative;
                overflow: hidden;
                border-radius: 50%;
                width: 80%;
                aspect-ratio: 1;
                border: 1rem solid var(--background-color-content);
                box-shadow: 0 0 20px 5px rgba(0, 0, 0, 0.1);
                transition: all 0.3s ease;

                /* &::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    box-shadow: inset 0 0 0 1rem #e5e5e5;
                } */

                img {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    -webkit-user-select: none;
                    user-select: none;
                    -webkit-user-drag: none;
                }

                &:hover {
                    transform: scale(1.05);
                }
            }

            >.info {
                display: flex;
                flex-direction: column;
                background: var(--background-color-content);
                border-radius: 12px;
                box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
                padding: 20px;
                gap: 20px;
                width: 100%;

                >.name {
                    width: 100%;
                    /* border-bottom: 1px solid var(--divider-color); */

                    >.name {
                        font-size: var(--text-2xl);
                        font-weight: bold;
                    }

                    >.username {
                        font-size: var(--text-xl);
                        color: var(--text-light-color);
                    }
                }

                >.details {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;

                    >.item {
                        display: flex;
                        flex-direction: row;
                        justify-content: space-between;

                        >.link {
                            position: relative;
                            border-radius: 6px;
                            transition: padding 0.3s ease;

                            &.go {
                                background-color: var(--neon-cyan);
                                padding: 0 10px 0 20px;
                            }

                            &.go::before {
                                pointer-events: none;
                                content: '>';
                                position: absolute;
                                left: 10px;
                                color: var(--text-reverse-color);
                                transform: rotate(0deg);
                                transition: all 0.3s ease;
                            }

                            &.go:hover::before {
                                left: calc(100% - 20px);
                                transform: rotate(180deg);
                            }

                            &.go:hover {
                                padding: 0 20px 0 10px;
                            }

                            >a {
                                color: var(--text-reverse-color);
                                text-decoration: none;
                            }
                        }
                    }
                }

                >.moblie-details {
                    display: none;
                }
            }

            .training-statuses {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: -8px;
            }

            .training-status {
                padding: 4px 10px;
                border: 1px solid var(--divider-color);
                border-radius: 999px;
                color: var(--text-light-color);
                background-color: var(--section-background-color);
                font-size: var(--text-xs);
                font-weight: 700;
                letter-spacing: 0.5px;
                transition: all 0.2s ease;

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

            >.actions {
                display: flex;
                flex-direction: column;
                width: 100%;
                gap: 10px;

                &.placeholder {
                    visibility: hidden;
                    pointer-events: none;
                }
            }

            >.team-card {
                display: flex;
                flex-direction: column;
                gap: 14px;
                width: 100%;
                padding: 18px;
                border: 1px solid var(--divider-color);
                border-radius: 12px;
                background: var(--background-color-content);
                box-shadow: 0 0 20px rgba(0, 0, 0, 0.06);
            }
        }

        >.right {
            /* margin: 0 auto;
            width: 100%; */
            max-width: 1200px;
            width: calc(100% - 360px);
            gap: 20px;
        }
    }

    >.bottom {
        display: flex;
        flex-direction: row;
        gap: 10px;
    }
}

.ranks {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 10px;

    >.rank {
        position: relative;
        min-width: 100px;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;

        >.title {
            font-size: var(--text-base);
        }

        >.value {
            font-size: var(--text-base);
        }

        &::before {
            content: '';
            position: absolute;
            bottom: -5px;
            width: 100%;
            height: 5px;
            background-color: var(--neon-cyan);
        }
    }
}

.team-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
}

.team-title {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 12px;
}

.team-avatar {
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    border: 1px solid var(--divider-color);
    border-radius: 14px;
    object-fit: cover;
    background-color: var(--section-background-color);
}

.team-label {
    color: var(--text-light-color);
    font-size: var(--text-xs);
    letter-spacing: 1px;
}

.team-name {
    margin-top: 4px;
    color: var(--text-default-color);
    font-size: var(--text-lg);
    font-weight: 800;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.team-edit {
    flex-shrink: 0;
    height: 28px;
    padding: 0 8px;
    border: 1px solid var(--divider-color);
    border-radius: 8px;
    color: var(--text-light-color);
    background-color: var(--background-color-1);
    cursor: pointer;
    font-family: inherit;
    font-weight: 700;
    font-size: var(--text-xs);
    line-height: 1;
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.team-edit:hover {
    border-color: var(--neon-cyan);
    color: var(--text-reverse-color);
    background-color: var(--neon-cyan);
}

.team-panel-title {
    color: var(--text-default-color);
    font-size: var(--text-sm);
    font-weight: 800;
    margin-top: 2px;
}

.team-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
    padding-top: 10px;
    border-top: 1px solid var(--divider-color);
}

.team-form.compact {
    padding: 10px;
}

.team-form input,
.team-search input {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    border: 1px solid var(--divider-color);
    border-radius: 8px;
    padding: 8px 11px;
    color: var(--text-default-color);
    background-color: var(--background-color-1);
    outline: none;
    box-shadow: none;
    transition: border-color 0.2s ease, background-color 0.2s ease;
}

.team-form input:focus,
.team-search input:focus {
    border-color: var(--input-active-color);
    background-color: var(--background-color-2);
}

.team-search,
.team-inline-actions {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 8px;
}

.team-search input {
    flex: 1;
}

.team-action {
    flex-shrink: 0;
    height: 30px;
    padding: 0 10px;
    border: 1px solid var(--divider-color);
    border-radius: 8px;
    color: var(--text-light-color);
    background-color: var(--background-color-1);
    cursor: pointer;
    font-family: inherit;
    font-weight: 800;
    font-size: var(--text-sm);
    line-height: 1;
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.team-action.primary {
    color: var(--text-default-color);
    background-color: var(--background-color-2);
}

.team-action.danger {
    color: var(--text-light-color);
    background-color: var(--background-color-1);
}

.team-action.wide {
    width: 100%;
}

.team-action:hover {
    border-color: var(--neon-cyan);
    color: var(--text-reverse-color);
    background-color: var(--neon-cyan);
}

.team-action.danger:hover {
    border-color: #f44336;
    color: #fff;
    background-color: #f44336;
}

.team-candidates {
    display: flex;
    flex-direction: column;
    gap: 0;
}

.team-candidate {
    padding: 10px 0;
    border: none;
    border-bottom: 1px solid var(--divider-color);
    color: var(--text-default-color);
    background-color: transparent;
    cursor: pointer;
    font-family: inherit;
    text-align: left;
    transition: all 0.2s ease;
}

.team-candidate:last-child {
    border-bottom: none;
}

.team-candidate:hover {
    color: var(--neon-cyan);
    transform: translateX(4px);
}

.team-edit-members {
    display: flex;
    flex-direction: column;
    gap: 0;
}

.team-edit-member {
    display: grid;
    grid-template-columns: 34px minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid var(--divider-color);
    background-color: transparent;
}

.team-edit-member:last-child {
    border-bottom: none;
}

.team-edit-member img {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    object-fit: cover;
}

.team-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
}

.team-owner {
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr);
    align-items: center;
    gap: 10px;
    padding: 2px 0 0;
    cursor: pointer;
    transition: all 0.2s ease;
}

.team-owner:hover {
    transform: translateX(2px);
}

.team-owner img {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid var(--divider-color);
    background-color: var(--section-background-color);
}

.team-owner-info {
    min-width: 0;
}

.team-owner-label {
    color: var(--text-light-color);
    font-size: var(--text-xs);
}

.team-owner-name {
    margin-top: 4px;
    color: var(--text-default-color);
    font-size: var(--text-sm);
    font-weight: 800;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.team-stat {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 10px 8px;
    border: 1px solid var(--divider-color);
    border-radius: 10px;
    background-color: var(--section-background-color);
}

.team-stat .value {
    color: var(--neon-cyan);
    font-size: var(--text-lg);
    font-weight: 900;
    font-variant-numeric: tabular-nums;
}

.team-stat .label {
    color: var(--text-light-color);
    font-size: var(--text-xs);
}

.team-dashboard {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 12px;
    border-top: 1px solid var(--divider-color);
}

.team-dashboard-title {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.team-dashboard-title span:first-child {
    color: var(--text-default-color);
    font-size: var(--text-sm);
    font-weight: 900;
}

.team-dashboard-title span:last-child {
    color: var(--text-light-color);
    font-size: var(--text-xs);
    line-height: 1.6;
}

.team-dashboard-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
}

.team-dashboard-stat {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 8px;
    border-radius: 10px;
    background-color: var(--section-background-color);
}

.team-dashboard-stat strong {
    color: var(--active-color);
    font-size: var(--text-base);
    font-variant-numeric: tabular-nums;
}

.team-dashboard-stat span {
    color: var(--text-light-color);
    font-size: var(--text-xs);
}

.team-dashboard-members {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.team-dashboard-member {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.team-dashboard-member-main {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    color: var(--text-light-color);
    font-size: var(--text-xs);
}

.team-dashboard-member-main span:first-child {
    color: var(--text-default-color);
    font-weight: 800;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.team-dashboard-member-main span:last-child {
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
}

.team-dashboard-bar {
    height: 6px;
    overflow: hidden;
    border-radius: 999px;
    background-color: var(--background-color-1);
}

.team-dashboard-bar div {
    height: 100%;
    border-radius: inherit;
    background-color: var(--neon-cyan);
    transition: width 0.25s ease;
}

.team-members {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.team-member {
    display: grid;
    grid-template-columns: 34px minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    padding: 8px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.team-member:hover {
    background-color: var(--section-background-color);
    transform: translateX(2px);
}

.team-member img {
    width: 34px;
    height: 34px;
    border: 1px solid var(--divider-color);
    border-radius: 50%;
    object-fit: cover;
    background-color: var(--section-background-color);
}

.member-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.member-name,
.member-username {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.member-name {
    color: var(--text-default-color);
    font-size: var(--text-sm);
    font-weight: 700;
}

.member-username {
    color: var(--text-light-color);
    font-size: var(--text-xs);
}

.member-role {
    margin-left: 8px;
    color: var(--neon-cyan);
    font-weight: 800;
}

.member-score {
    color: var(--neon-cyan);
    font-size: var(--text-xs);
    font-weight: 800;
    font-variant-numeric: tabular-nums;
}

.team-empty {
    padding: 10px 0;
    color: var(--text-light-color);
    font-size: var(--text-sm);
    text-align: center;
}

.insight-section .content {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.portrait-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    color: var(--text-default-color);
}

.portrait-title-icon {
    color: var(--active-color);
}

.portrait-main {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    line-height: 1.6;
}

.portrait-label,
.training-status {
    border: 1px solid var(--divider-color);
    border-radius: 8px;
    padding: 3px 8px;
    color: var(--text-default-color);
    background-color: var(--background-color-2);
    font-size: var(--text-xs);
    font-weight: 800;
}

.portrait-label.tone-steady,
.training-status.tone-steady {
    color: var(--neon-cyan);
}

.portrait-label.tone-rising,
.training-status.tone-rising {
    color: var(--active-color);
}

.portrait-label.tone-warning,
.training-status.tone-warning {
    color: #ff8585;
}

.portrait-label.tone-intense,
.training-status.tone-intense {
    color: #ffb86c;
}

.portrait-label.tone-night,
.training-status.tone-night {
    color: #9fb5ff;
}

.portrait-advice,
.recent-summary,
.sync-meta,
.job-subtitle {
    color: var(--text-light-color);
    font-size: var(--text-sm);
    line-height: 1.7;
}

.spider-job-card {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 180px;
    gap: 14px;
    align-items: center;
    padding: 12px;
    border: 1px solid var(--divider-color);
    border-radius: 12px;
    background-color: var(--background-color-2);
}

.job-title {
    color: var(--text-default-color);
    font-weight: 800;
}

.job-progress {
    height: 8px;
    overflow: hidden;
    border-radius: 999px;
    background-color: var(--background-color-1);
}

.job-progress-bar {
    height: 100%;
    border-radius: inherit;
    background-color: var(--neon-cyan);
    transition: width 0.25s ease;
}

.spider-job-card.job-failed .job-progress-bar {
    background-color: #ff8585;
}

.spider-job-card.job-success .job-progress-bar {
    background-color: var(--active-color);
}

.sync-status-list {
    display: flex;
    flex-direction: column;
    gap: 0;
}

.sync-status-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 12px 0;
    border-top: 1px solid var(--divider-color);
}

.sync-platform {
    color: var(--text-default-color);
    font-weight: 800;
}

.sync-side {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    flex-shrink: 0;
}

.sync-counts {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 3px;
    color: var(--text-light-color);
    font-size: var(--text-xs);
    line-height: 1.25;
    white-space: nowrap;
}

.sync-counts strong {
    color: var(--active-color);
    font-size: var(--text-sm);
}

.sync-error {
    margin-top: 4px;
    color: #ff8585;
    font-size: var(--text-xs);
    overflow-wrap: anywhere;
}

.sync-badge {
    flex-shrink: 0;
    border: 1px solid var(--divider-color);
    border-radius: 8px;
    padding: 4px 8px;
    color: var(--neon-cyan);
    font-size: var(--text-xs);
    font-weight: 800;
}

.sync-badge.stale {
    color: #ffb86c;
}

.sync-badge.failed {
    color: #ff8585;
}

.sync-badge.running {
    color: var(--active-color);
}

.sync-empty {
    color: var(--text-light-color);
    font-size: var(--text-sm);
}

.weekly-card {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.weekly-title {
    display: block;
}

.weekly-title span:first-child {
    color: var(--text-default-color);
    font-size: var(--text-xl);
    font-weight: 900;
}

.weekly-version {
    align-self: flex-start;
    padding: 4px 8px;
    border: 1px solid var(--divider-color);
    border-radius: 8px;
    color: var(--neon-cyan);
    background-color: var(--background-color-2);
    font-size: var(--text-xs);
    font-weight: 900;
}

.weekly-summary,
.weekly-advice {
    color: var(--text-light-color);
    font-size: var(--text-sm);
    line-height: 1.8;
}

.weekly-advice {
    padding-top: 10px;
    border-top: 1px solid var(--divider-color);
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

.achievement-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 10px;
}

.achievement-card {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr);
    gap: 10px;
    align-items: center;
    padding: 12px;
    border: 1px solid var(--divider-color);
    border-radius: 12px;
    background-color: var(--section-background-color);
    transition: all 0.2s ease;
}

.achievement-card:hover {
    border-color: var(--neon-cyan);
    transform: translateY(-2px);
}

.achievement-card.locked {
    opacity: 0.58;
    filter: grayscale(0.35);
}

.achievement-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 14px;
    color: var(--text-reverse-color);
    background-color: var(--neon-cyan);
    font-size: var(--text-sm);
    font-weight: 900;
}

.achievement-card.tone-gold .achievement-icon {
    background-color: #f59e0b;
}

.achievement-card.tone-blue .achievement-icon {
    background-color: var(--active-color);
}

.achievement-card.tone-red .achievement-icon {
    background-color: #ef4444;
}

.achievement-card.tone-muted .achievement-icon,
.achievement-card.locked .achievement-icon {
    color: var(--text-light-color);
    background-color: var(--background-color-2);
}

.achievement-info {
    min-width: 0;
}

.achievement-name {
    color: var(--text-default-color);
    font-size: var(--text-sm);
    font-weight: 900;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.achievement-desc {
    margin-top: 4px;
    color: var(--text-light-color);
    font-size: var(--text-xs);
    line-height: 1.5;
    min-height: 2.8em;
}

.achievement-progress {
    height: 5px;
    margin-top: 8px;
    overflow: hidden;
    border-radius: 999px;
    background-color: var(--background-color-1);
}

.achievement-progress div {
    height: 100%;
    border-radius: inherit;
    background-color: var(--neon-cyan);
}

.activities {
    display: flex;
    flex-direction: column;
    gap: 10px;

    .activity {
        position: relative;
        width: calc(100% - 20px);
        padding-left: 20px;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;

        >.title {
            width: 80%;
            font-size: var(--text-sm);
        }

        >.time {
            display: flex;
            justify-content: flex-end;
            width: 20%;
            font-size: var(--text-xs);
            color: var(--text-light-color);
        }

        &::before {
            content: '';
            position: absolute;
            height: calc(100% + 10px);
            width: 3px;
            top: -5px;
            left: 10px;
            background-color: var(--divider-color);
        }

        &:first-child::before {
            content: '';
            position: absolute;
            height: calc(100% + 15px);
            width: 3px;
            top: -10px;
            left: 10px;
            background-color: var(--divider-color);
        }

        &:last-child::before {
            content: '';
            position: absolute;
            height: calc(100% + 15px);
            width: 3px;
            bottom: -10px;
            left: 10px;
            background-color: var(--divider-color);
        }

        &::after {
            content: '';
            position: absolute;
            width: 5px;
            height: 5px;
            left: 6px;
            background-color: #fff;
            border-radius: 50%;
            border: 3px solid var(--neon-cyan);

            box-shadow: 0 0 5px var(--neon-cyan);
        }
    }
}

.btn {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0 5px;
    padding: 3px 6px;
    background-color: var(--background-color-2);
    color: var(--text-secondary-color);
    border: 1px solid var(--divider-color);
    border-radius: 6px;
    cursor: pointer;
    font-size: var(--text-sm);
    transition: all 0.2s ease;
    -webkit-user-select: none;
    user-select: none;

    &.dan:hover {
        background-color: #f44336;
        color: white;
        border-color: #f44336;
    }

    &.def:hover {
        background-color: var(--neon-cyan);
        color: white;
        border-color: var(--neon-cyan);
    }
}

.section {
    display: flex;
    flex-direction: column;
    gap: 10px;
    border-radius: 6px;

    >.header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 10px;
        border-radius: 12px;
        background: var(--background-header);
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
    }

    >.content {
        background-color: var(--background-color-content);
        border-radius: 12px;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
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
        gap: 12px;

        .tab {
            padding: 6px 12px;
            border-radius: 6px;
            color: var(--text-light-color);
            font-size: var(--text-base);
            cursor: pointer;
            transition: all 0.2s ease;
            -webkit-user-select: none;
            user-select: none;

            &:hover {
                color: var(--text-default-color);
                background-color: oklch(from var(--background-color-2) 1 c h / 0.1);
            }

            &.active {
                background-color: var(--neon-cyan);
                color: var(--text-reverse-color);
                font-weight: 500;
            }
        }
    }

    .title-icon {
        font-size: var(--text-base);
    }

    .title-text {
        color: var(--text-default-color);
    }

    .header-actions {
        display: flex;
        gap: 16px;
    }
}

.profile-chart-container {
    width: 100%;
    min-width: 0;
    height: clamp(280px, 34vh, 420px);
    box-sizing: border-box;
}

.profile-chart {
    width: 100%;
    height: 100%;
}

.moblie-actions {
    display: none;
}

.statisticItems {
    display: flex;
    flex-direction: column;
    gap: 10px;

    >.statisticItem {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 10px;

        >.title {
            font-size: var(--text-base);
            width: 80px;
        }

        >.barContainer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            flex-grow: 1;
            flex-direction: row;
            position: relative;
            background-color: var(--background-color-1);

            >.bar {
                width: 0%;
                position: relative;
                height: 10px;
                background-color: var(--neon-cyan);
                transition: all 1s ease-in-out;
            }

            >.ave {
                font-size: var(--text-xs);
                text-wrap: nowrap;
                position: absolute;
                z-index: 1;
                left: 50%;
                top: -100%;
                transform: translate(-50%, -50%);
                transition: all 1s ease-in-out;
            }

            >.cursor {
                position: absolute;
                z-index: 2;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                width: 2px;
                height: 12px;
                background-color: red;
                transition: all 1s ease-in-out;
            }
        }

        >.value {
            font-size: var(--text-base);
            width: 50px;
        }

        >.grow {
            font-size: var(--text-base);
            width: 50px;

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
    }
}

.contests {
    display: flex;
    flex-direction: column;
    gap: 10px;

    >.contest {
        display: flex;
        justify-content: space-between;
        flex-direction: row;

        >.info {
            flex-grow: 1;
            >.platform {
                color: var(--text-light-color);
                font-size: var(--text-sm);
            }

            >.title {
                color: var(--text-default-color);
                font-size: var(--text-lg);
                font-weight: bold;
            }
        }

        >.actions{
            display: flex;
            flex-direction: row;
            gap: 5px;
        }
    }
}

@media (max-width:1000px) {
    .container {
        width: calc(100% - 40px);
        padding: 0 20px;
    }

    .container>.top {
        flex-direction: column;
        align-items: center;
        gap: 20px;
    }

    .container>.top>.left {
        width: 100%;
        flex-direction: row;
        flex-wrap: wrap;

        >.avatar {
            width: 200px;
        }

        >.info {
            flex: 1;
        }

        >.actions {
            width: 150px;
        }

        >.team-card {
            width: calc(100% - 36px);
        }
    }

    .container>.top>.right {
        width: 100%;
    }
}

@media (max-width:1000px) {
    .weekly-metrics,
    .achievement-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .moblie-actions {
        display: flex;
        flex-direction: column;
        gap: 10px;

        .btn {
            width: 100%;
            font-size: var(--text-base);
        }
    }

    .container {
        width: 100%;
        padding: 0;

        >.top {
            >.left {
                position: relative;
                flex-direction: column;
                gap: 0;

                >.background {
                    display: block;
                    position: relative;
                    width: 100%;
                    height: 200px;
                    background-color: var(--background-color-2);
                    overflow: hidden;

                    >.flow-emoji {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform-origin: center center;
                        transform: translate(-50%, -50%) rotate(-10deg);
                        width: 100%;
                        font-size: 2rem;
                        text-wrap: nowrap;
                        letter-spacing: 10px;
                        line-height: 2;
                        -webkit-user-select: none;
                        user-select: none;
                    }
                }

                >.avatar {
                    position: absolute;
                    left: 50%;
                    transform: translateX(-50%);
                    top: 140px;
                    overflow: hidden;
                    border-radius: 50%;
                    width: 100px;
                    aspect-ratio: 1;
                    border: 10px solid var(--background-color-2);
                    box-shadow: 0 0 20px 5px rgba(0, 0, 0, 0.1);
                    transition: all 0.3s ease;

                    img {
                        width: 100%;
                        height: 100%;
                        border-radius: 50%;
                        -webkit-user-select: none;
                        user-select: none;
                        -webkit-user-drag: none;
                    }
                }

                >.info {
                    background: none;
                    box-shadow: none;
                    padding: 90px 20px 0 20px;
                    width: calc(100% - 40px);

                    >.name {
                        border-bottom: none;

                        >.name {
                            font-size: 2rem;
                        }

                        >.username {
                            font-size: 1.2rem;
                        }
                    }

                    >.details {
                        display: none;
                    }

                    >.moblie-details {
                        display: flex;
                        flex-direction: row;
                        flex-wrap: wrap;
                        gap: 5px;

                        >.item {
                            flex-grow: 0;
                            width: auto;
                            color: var(--text-light-color);
                            text-decoration: none;
                            background-color: var(--background-color-2);
                            padding: 5px 10px;
                            border-radius: 10px;
                            font-size: var(--text-sm);
                        }
                    }
                }

                >.actions {
                    display: none;
                }

                >.team-card {
                    width: calc(100% - 40px);
                    margin-top: 16px;
                }
            }

            >.right {
                width: calc(100% - 40px);
                padding: 0 20px;
            }
        }
    }

    .section {
        border-left: none;
        border-right: none;
        border-bottom: none;

        >.header {
            border-bottom: none;
        }
    }
}

@media (max-width:600px) {
    .weekly-metrics,
    .achievement-grid,
    .team-dashboard-grid {
        grid-template-columns: 1fr;
    }

    .achievement-card {
        grid-template-columns: 40px minmax(0, 1fr);
    }

    .achievement-icon {
        width: 40px;
        height: 40px;
        border-radius: 12px;
    }

    .weekly-title {
        align-items: flex-start;
        flex-direction: column;
    }

    .profile-chart-container {
        height: 300px;
    }

    .spider-job-card {
        grid-template-columns: 1fr;
    }

    .sync-status-item {
        align-items: flex-start;
        flex-direction: column;
        gap: 8px;
    }

    .sync-side {
        width: 100%;
        justify-content: space-between;
    }

    .sync-counts {
        align-items: flex-start;
    }

    .sync-badge {
        align-self: flex-start;
    }

    .container > .top > .left > .avatar {
        top: 120px;
        width: 80px;
        border-width: 6px;
    }

    .container > .top > .left > .info {
        padding: 80px 16px 0 16px;
    }

    .container {
        >.top {
            >.right {
                width: 100%;
                padding: 0;
            }
        }
    }
}
</style>
