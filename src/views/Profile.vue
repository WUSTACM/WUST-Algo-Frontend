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
                        <button v-else-if="canShowProfileMessageAction" class="btn def" @click="openDirectMessage">发消息</button>
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
                            <button v-else-if="canLeaveTeam && teamPanelMode === 'idle'" class="team-edit danger"
                                @click="leaveTeam">退出团队</button>
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
                                    <div v-if="Number(member.userId) !== Number(teamInfo.ownerId)"
                                        class="team-member-actions">
                                        <button class="team-action" @click="transferOwner(member)">设为队长</button>
                                        <button class="team-action danger" @click="removeMember(member.userId)">移除</button>
                                    </div>
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
                            <div class="team-danger-zone">
                                <div>
                                    <div class="team-panel-title">危险操作</div>
                                    <div class="team-danger-tip">解散后所有成员将变为无团队，待处理邀请会失效。</div>
                                </div>
                                <button class="team-action danger" @click="disbandTeam">解散团队</button>
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
                    <div class="stat-scope-card">
                        <div class="stat-scope-note">
                            <strong>{{ statisticExplanation.title || '统计口径说明' }}</strong>
                            <span>{{ statisticExplanation.summary || '本站统计基于提交日志统一去重，可能与 OJ 主页展示口径不同。' }}</span>
                            <button class="inline-link-button" @click="showStatisticExplanation = !showStatisticExplanation">
                                {{ showStatisticExplanation ? '收起' : '查看说明' }}
                            </button>
                        </div>
                        <div v-if="showStatisticExplanation" class="stat-scope-details">
                            <div v-for="item in statisticExplanation.bullets" :key="item">{{ item }}</div>
                        </div>
                    </div>
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
                                <template v-if="syncStatusRows.length > 0">
                                <div class="sync-status-item" v-for="item in syncStatusRows" :key="item.platform">
                                    <div>
                                        <div class="sync-platform">{{ platformLabel(item.platform) }}</div>
                                        <div class="sync-meta">@{{ item.username }} · {{ formatSyncTime(item.lastSuccessAt) }}</div>
                                        <div v-if="item.lastError && item.canViewError" class="sync-error">{{ item.lastError }}</div>
                                    </div>
                                    <div class="sync-side">
                                        <div class="sync-counts">
                                        <span><strong>{{ platformStats(item.platform).ac }}</strong> 题</span>
                                        <span>{{ platformStats(item.platform).submit }} 提交</span>
                                        <span v-if="auditByPlatform(item.platform)">去重提交 {{ auditByPlatform(item.platform)?.distinctSubmitCount || 0 }}</span>
                                        <span v-if="auditByPlatform(item.platform)">AC 提交 {{ auditByPlatform(item.platform)?.acceptedSubmitCount || 0 }}</span>
                                        <span v-if="auditByPlatform(item.platform)">
                                            本次 {{ auditByPlatform(item.platform)?.lastRawFetchedCount || 0 }} 原始 / {{ auditByPlatform(item.platform)?.lastFetchedCount || 0 }} 有效
                                        </span>
                                        <span v-if="auditByPlatform(item.platform) && Number(auditByPlatform(item.platform)?.lastSkippedCount || 0) > 0">
                                            跳过 {{ auditByPlatform(item.platform)?.lastSkippedCount }}
                                        </span>
                                        <span v-if="auditByPlatform(item.platform) && Number(auditByPlatform(item.platform)?.filteredDuplicateCount || 0) > 0">
                                            去重过滤 {{ auditByPlatform(item.platform)?.filteredDuplicateCount }}
                                        </span>
                                    </div>
                                    <span class="sync-badge" :class="{ stale: item.isStale, failed: item.status === 'failed', running: item.status === 'running' }">
                                        {{ formatSyncStatus(item) }}
                                    </span>
                                    <button class="sync-refresh-btn" @click="openPlatformDetail(item.platform)">明细</button>
                                    <button
                                        v-if="isSelfProfile"
                                            class="sync-refresh-btn"
                                            :disabled="isRefreshingPlatform(item.platform) || isPlatformRefreshCoolingDown(item.platform)"
                                            @click="updatePlatformLog(item.platform)"
                                        >
                                            {{ platformRefreshButtonLabel(item.platform) }}
                                        </button>
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
                                        <button class="sync-refresh-btn" @click="openPlatformDetail(item.platform)">明细</button>
                                    </div>
                                </div>
                                </template>
                                <div class="sync-empty" v-if="!loadingSyncStatus && syncStatusRows.length === 0 && platformPeriodRows.length === 0">暂无 OJ 绑定，绑定后会显示数据同步状态。</div>
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
                            <div class="header-tabs achievement-header-actions">
                                <span class="tab active">{{ unlockedAchievements.length }}/{{ achievements.length }}</span>
                                <button class="achievement-action-button achievement-view-all" @click="showAchievementDrawer = true">查看全部 &gt;</button>
                            </div>
                        </div>
                        <div class="content">
                            <div class="achievement-grid">
                                <div class="achievement-card" v-for="badge in visibleAchievements" :key="badge.key"
                                    :class="[{ locked: !badge.unlocked, 'hidden-achievement': badge.hidden }, `tone-${badge.tone}`]">
                                    <div class="achievement-icon">{{ achievementIcon(badge) }}</div>
                                    <div class="achievement-info">
                                        <div class="achievement-name">{{ achievementLabel(badge) }}</div>
                                        <div class="achievement-desc">{{ achievementDescription(badge) }}</div>
                                        <div v-if="achievementGlobalRateLabel(badge)" class="achievement-global-rate">{{ achievementGlobalRateLabel(badge) }}</div>
                                        <div class="achievement-progress">
                                            <div :style="{ width: achievementDisplayProgress(badge) + '%' }"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="achievement-more" v-if="achievements.length > visibleAchievements.length">
                                只展示精选成就，还有 {{ achievements.length - visibleAchievements.length }} 个成就等你解锁。
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
                                <span class="title-text">提交趋势</span>
                            </div>
                        </div>
                        <div class="content">
                            <div class="profile-chart-container">
                                <AsyncLineChart class="profile-chart" :option="chartOption" autoresize />
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
                    <div class="moblie-actions" v-if="currentUserId && (isSelfProfile || canShowProfileMessageAction)">
                        <template v-if="currentUserId === Number(user.userId)">
                            <button class="btn def" @click="showUpdateConfirm">更新OJ数据</button>
                            <button class="btn def" @click="router.push('/changeprofile')">编辑个人资料</button>
                            <button class="btn dan" @click="showLogoutConfirm">退出登录</button>
                        </template>
                        <button v-else-if="canShowProfileMessageAction" class="btn def" @click="openDirectMessage">发消息</button>
                    </div>
                </div>
            </div>
            <div class="bottom">
            </div>
        </div>
        <div v-if="showAchievementDrawer" class="achievement-drawer-mask" @click="showAchievementDrawer = false">
            <aside class="achievement-drawer" @click.stop>
                <div class="achievement-drawer-header">
                    <div>
                        <div class="achievement-drawer-kicker">Achievements</div>
                        <h2>成就徽章</h2>
                    </div>
                    <div class="achievement-drawer-count">{{ unlockedAchievements.length }}/{{ achievements.length }}</div>
                    <button class="achievement-drawer-close" @click="showAchievementDrawer = false">×</button>
                </div>
                <div class="achievement-drawer-tabs">
                    <button
                        v-for="filter in achievementFilters"
                        :key="filter.key"
                        class="achievement-action-button"
                        :class="{ active: achievementFilter === filter.key }"
                        @click="achievementFilter = filter.key"
                    >
                        {{ filter.label }}
                    </button>
                </div>
                <div class="achievement-drawer-list">
                    <div
                        class="achievement-detail-card"
                        v-for="badge in filteredAchievements"
                        :key="`drawer-${badge.key}`"
                        :class="[{ locked: !badge.unlocked, 'hidden-achievement': badge.hidden }, `tone-${badge.tone}`]"
                    >
                        <div class="achievement-icon achievement-detail-icon">{{ achievementIcon(badge) }}</div>
                        <div class="achievement-detail-info">
                            <div class="achievement-detail-top">
                                <span>{{ achievementLabel(badge) }}</span>
                                <em>{{ achievementMetaLabel(badge) }}</em>
                            </div>
                            <p>{{ achievementDescription(badge) }}</p>
                            <div class="achievement-condition" v-if="achievementCondition(badge)">
                                条件：{{ achievementCondition(badge) }}
                            </div>
                            <div class="achievement-detail-progress">
                                <div><span :style="{ width: achievementDisplayProgress(badge) + '%' }"></span></div>
                                <b>{{ achievementProgressText(badge) }}</b>
                            </div>
                        </div>
                    </div>
                    <div class="achievement-empty" v-if="filteredAchievements.length === 0">暂无成就记录。</div>
                </div>
            </aside>
        </div>
        <div v-if="detailModal.open" class="detail-modal-mask" @click="closePlatformDetail">
            <section class="detail-modal" ref="detailModalRef" @click.stop>
                <div class="detail-modal-header">
                    <div>
                        <div class="achievement-drawer-kicker">Statistic Trace</div>
                        <h2>{{ platformLabel(detailModal.platform) }} 明细</h2>
                    </div>
                    <button class="achievement-drawer-close" @click="closePlatformDetail">×</button>
                </div>
                <LoadingOverlay :show="loadingPlatformDetail" />
                <div class="detail-summary" v-if="platformDetail">
                    <div><strong>{{ platformDetail.summary.distinctAc }}</strong><span>去重 AC</span></div>
                    <div><strong>{{ platformDetail.summary.acceptedSubmits }}</strong><span>AC 提交</span></div>
                    <div><strong>{{ platformDetail.summary.distinctSubmitted }}</strong><span>去重提交题</span></div>
                    <div><strong>{{ platformDetail.summary.rawSubmits }}</strong><span>原始提交</span></div>
                    <div><strong>{{ platformDetail.summary.filteredDuplicate }}</strong><span>去重过滤</span></div>
                    <div><strong>{{ platformDetail.summary.filteredInvalid }}</strong><span>异常记录</span></div>
                </div>
                <div class="detail-tabs">
                    <button class="achievement-action-button" :class="{ active: detailModal.mode === 'ac' }" @click="switchPlatformDetailMode('ac')">AC 题列表</button>
                    <button class="achievement-action-button" :class="{ active: detailModal.mode === 'submit' }" @click="switchPlatformDetailMode('submit')">提交记录</button>
                </div>
                <div class="detail-table-wrap" ref="detailTableWrapRef">
                    <table class="detail-table detail-table-problems" v-if="platformDetail && detailModal.mode === 'ac'">
                        <thead>
                            <tr>
                                <th>题目</th>
                                <th>Problem Key</th>
                                <th>首次 AC</th>
                                <th>AC 提交</th>
                                <th>总提交</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in platformDetail.problems" :key="item.problemKey">
                                <td>{{ item.problem || item.problemKey }}</td>
                                <td><code>{{ item.problemKey }}</code></td>
                                <td>{{ formatDetailTime(item.firstAcAt) }}</td>
                                <td>{{ item.acceptedSubmits }}</td>
                                <td>{{ item.totalSubmits }}</td>
                            </tr>
                        </tbody>
                    </table>
                    <table class="detail-table detail-table-records" v-else-if="platformDetail">
                        <thead>
                            <tr>
                                <th>时间</th>
                                <th>题目</th>
                                <th>状态</th>
                                <th>计入 AC</th>
                                <th>Problem Key</th>
                                <th>审计说明</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in platformDetail.records" :key="item.id">
                                <td>{{ formatDetailTime(item.time) }}</td>
                                <td>{{ item.problem || item.contest }}</td>
                                <td>{{ item.status }}</td>
                                <td>{{ item.includedInAc ? '是' : '否' }}</td>
                                <td><code>{{ item.problemKey }}</code></td>
                                <td>{{ item.auditReason }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="detail-pagination" v-if="platformDetail">
                    <button class="achievement-action-button" :disabled="detailModal.page <= 1" @click="changePlatformDetailPage(-1)">上一页</button>
                    <span>第 {{ detailModal.page }} 页 / 共 {{ Math.max(1, Math.ceil(platformDetail.total / detailModal.pageSize)) }} 页</span>
                    <button class="achievement-action-button" :disabled="detailModal.page >= Math.ceil(platformDetail.total / detailModal.pageSize)" @click="changePlatformDetailPage(1)">下一页</button>
                </div>
            </section>
        </div>
    </BaseLayout>
</template>

<script setup lang="ts">
import BaseLayout from '@/components/BaseLayout.vue'
import { computed, defineAsyncComponent, ref, nextTick, onBeforeUnmount, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import JWT from '../utils/jwt';
import Confirm from '@/components/confirm.vue'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import { useUserStore } from '@/stores/user';
import API from '@/utils/api';
import type {
    CoreContestListData,
    CoreStatisticPeriodData,
    CoreStatisticPlatformPeriodItem,
    CoreSubmitLogGetByIdData,
    List as ProfileListItem,
    SpiderAuditItem,
    SpiderJobInfo,
    SpiderSyncStatusInfo,
    StatisticExplanationResponse,
    StatisticPlatformDetailResponse,
    UserProfileGetByNameList,
} from '@/utils/api';
import Toast from '@/utils/toast';
import type { User } from '@/utils/type';
import Link from '@/utils/link';
import Bot from '@/utils/bot';
import { buildTrainingPortrait, buildTrainingStatuses, type TrainingPortrait, type TrainingStatusBadge } from '@/utils/trainingStatus';
import {
    buildAchievementBadges,
    buildTeamDashboard,
    type AchievementBadge,
    type TeamDashboard,
    type TeamDashboardMember,
} from '@/utils/v11Features';

const AsyncLineChart = defineAsyncComponent(() => import('@/components/AsyncLineChart.vue'));

Bot.tip.addOjTip();

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const currentData = ref(0)

const jwtUserInfo = JWT.getUserInfo();
const currentUserId = computed(() => Number(jwtUserInfo?.userId || 0))
const currentRoleId = computed(() => Number(jwtUserInfo?.roleId || 0))
const isCurrentUserAdmin = computed(() => currentRoleId.value === 1)

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
const spiderAuditRows = ref<SpiderAuditItem[]>([]);
const statisticExplanation = ref<StatisticExplanationResponse>({
    code: 0,
    message: '',
    title: '统计口径说明',
    summary: '本站统计基于提交日志统一去重，可能与 OJ 主页展示口径不同。',
    bullets: [],
    generatedAt: 0,
});
const showStatisticExplanation = ref(false);
const loadingSyncStatus = ref(false);
const activeSpiderJob = ref<SpiderJobInfo | null>(null);
const loadingPlatformDetail = ref(false);
const platformDetail = ref<StatisticPlatformDetailResponse | null>(null);
const detailModalRef = ref<HTMLElement | null>(null);
const detailTableWrapRef = ref<HTMLElement | null>(null);
const detailModal = ref({
    open: false,
    platform: '',
    mode: 'ac' as 'ac' | 'submit',
    page: 1,
    pageSize: 12,
});
const platformRefreshCooldowns = ref<Record<string, number>>({});
let spiderJobTimer: number | undefined;
let refreshCooldownTimer: number | undefined;
let detailResizeTimer: number | undefined;
let previousBodyOverflow = '';

const syncScreenSize = () => {
    isCompactScreen.value = window.innerWidth <= 640;
};

const handleProfileResize = () => {
    syncScreenSize();
    if (!detailModal.value.open) return;
    if (detailResizeTimer) {
        window.clearTimeout(detailResizeTimer);
    }
    detailResizeTimer = window.setTimeout(async () => {
        await nextTick();
        const nextPageSize = measuredDetailPageSize();
        if (nextPageSize !== detailModal.value.pageSize) {
            detailModal.value.pageSize = nextPageSize;
            await loadPlatformDetail();
        }
    }, 160);
};

const ojPlatforms = [
    { key: 'AtCoder' as const, label: 'AtCoder' },
    { key: 'NowCoder' as const, label: '牛客' },
    { key: 'LuoGu' as const, label: '洛谷' },
    { key: 'CodeForces' as const, label: 'CodeForces' },
    { key: 'QOJ' as const, label: 'QOJ' },
]
const ojPlatformOrder = ojPlatforms.map((item) => item.key as string);
const platformOrderIndex = (platform: string) => {
    const index = ojPlatformOrder.indexOf(platform);
    return index === -1 ? ojPlatformOrder.length : index;
}

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
    waTotal: number;
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
const canShowProfileMessageAction = computed(() => {
    return currentUserId.value !== 0 && !isSelfProfile.value && isCurrentUserAdmin.value;
})
const canManageTeam = computed(() => {
    if (!isSelfProfile.value || teamInfo.value.id === 0) return false;
    return Number(teamInfo.value.ownerId) === currentUserId.value;
})
const canLeaveTeam = computed(() => {
    if (!isSelfProfile.value || teamInfo.value.id === 0) return false;
    return Number(teamInfo.value.ownerId) !== currentUserId.value;
})
const teamOwner = computed(() => teamInfo.value.members.find(member => Number(member.userId) === Number(teamInfo.value.ownerId)))
const syncStatusRows = computed(() => {
    return [...syncStatuses.value].sort((a, b) => platformOrderIndex(a.platform) - platformOrderIndex(b.platform));
})
const platformPeriodRows = computed(() => {
    return platformPeriodStats.value
        .filter((item) => Number(item.ac?.total || 0) > 0 || Number(item.submit?.total || 0) > 0)
        .sort((a, b) => platformOrderIndex(a.platform) - platformOrderIndex(b.platform));
})

const platformStats = (platform: string) => {
    const item = platformPeriodStats.value.find((stat) => stat.platform === platform);
    return {
        ac: Number(item?.ac?.total || 0),
        submit: Number(item?.submit?.total || 0),
    };
}

const auditByPlatform = (platform: string) => {
    return spiderAuditRows.value.find((item) => item.platform === platform);
}

const permanentAchievementKeys = ref<string[]>([])
const permanentAchievementStorageKey = computed(() => `wust-achievements:${Number(user.value.userId || 0)}`)
const passwordChangeCount = ref(0)
const achievementNightAcPercentile = ref(0)
const achievementSiteContext = ref<Record<string, number | boolean>>({})
const passwordChangeStorageKey = computed(() => `wust-password-change-count:${Number(user.value.userId || 0)}`)

const loadPermanentAchievements = () => {
    const key = permanentAchievementStorageKey.value;
    if (key.endsWith(':0')) {
        permanentAchievementKeys.value = [];
        return;
    }
    try {
        permanentAchievementKeys.value = JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
        permanentAchievementKeys.value = [];
    }
}

const savePermanentAchievements = (keys: string[]) => {
    const key = permanentAchievementStorageKey.value;
    if (key.endsWith(':0')) return;
    const uniqueKeys = [...new Set(keys)];
    permanentAchievementKeys.value = uniqueKeys;
    localStorage.setItem(key, JSON.stringify(uniqueKeys));
}

const loadPasswordChangeCount = () => {
    const key = passwordChangeStorageKey.value;
    if (key.endsWith(':0')) {
        passwordChangeCount.value = 0;
        return;
    }
    passwordChangeCount.value = Number(localStorage.getItem(key) || 0);
}

const isWrongAnswerStatus = (status: string) => {
    const normalized = String(status || '').trim().toLowerCase();
    return normalized === 'wa' || normalized.includes('wrong answer') || normalized.includes('答案错误');
}

const isAcceptedStatus = (status: string) => {
    const normalized = String(status || '').trim().toLowerCase();
    return normalized === 'ac' || normalized.includes('accepted') || normalized.includes('答案正确') || normalized.includes('通过');
}

const countWrongAnswers = (logs: CoreSubmitLogGetByIdData[]) => logs.filter((log) => isWrongAnswerStatus(log.status)).length;

const countNightAccepted = (logs: CoreSubmitLogGetByIdData[]) => logs.filter((log) => {
    if (!isAcceptedStatus(log.status)) return false;
    const hour = new Date(Number(log.time || 0) * 1000).getHours();
    return hour >= 0 && hour < 5;
}).length;

const localDateKey = (time: number) => {
    const date = new Date(time * 1000);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const localMinuteKey = (time: number) => {
    const date = new Date(time * 1000);
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    const hour = `${date.getHours()}`.padStart(2, '0');
    const minute = `${date.getMinutes()}`.padStart(2, '0');
    return `${month}-${day} ${hour}:${minute}`;
}

const percentileOf = (values: number[], value: number) => {
    if (values.length === 0) return 0;
    return (values.filter((item) => item < value).length / values.length) * 100;
}

const medianOf = (values: number[]) => {
    const sorted = values.filter((item) => Number.isFinite(item)).sort((a, b) => a - b);
    if (sorted.length === 0) return 0;
    const middle = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 1) return sorted[middle] || 0;
    return ((sorted[middle - 1] || 0) + (sorted[middle] || 0)) / 2;
}

const maxDailyWrongAnswers = (logs: CoreSubmitLogGetByIdData[]) => {
    const counts = new Map<string, number>();
    logs.forEach((log) => {
        if (!isWrongAnswerStatus(log.status)) return;
        const key = localDateKey(Number(log.time || 0));
        counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Math.max(0, ...counts.values());
}

const todaySubmitCount = (logs: CoreSubmitLogGetByIdData[]) => {
    const today = localDateKey(Math.floor(Date.now() / 1000));
    return logs.filter((log) => localDateKey(Number(log.time || 0)) === today).length;
}

const todayAcceptRate = (logs: CoreSubmitLogGetByIdData[]) => {
    const today = localDateKey(Math.floor(Date.now() / 1000));
    const todayLogs = logs.filter((log) => localDateKey(Number(log.time || 0)) === today);
    if (todayLogs.length === 0) return 0;
    return (todayLogs.filter((log) => isAcceptedStatus(log.status)).length / todayLogs.length) * 100;
}

const hourlyDistribution = (logs: CoreSubmitLogGetByIdData[]) => {
    const buckets = Array.from({ length: 24 }, () => 0);
    logs.forEach((log) => {
        const hour = new Date(Number(log.time || 0) * 1000).getHours();
        buckets[hour] = (buckets[hour] || 0) + 1;
    });
    const total = buckets.reduce((sum, item) => sum + item, 0);
    return total > 0 ? buckets.map((item) => item / total) : buckets;
}

const distributionDistance = (left: number[], right: number[]) => {
    return left.reduce((sum, item, index) => sum + Math.abs(item - (right[index] || 0)), 0);
}

const rawAchievements = computed<AchievementBadge[]>(() => {
    return buildAchievementBadges(profilePeriodData.value, recentSubmitLogs.value, platformPeriodStats.value, {
        currentUserId: Number(user.value.userId),
        members: teamInfo.value.members,
        nightAcPercentile: achievementNightAcPercentile.value,
        passwordChangeCount: passwordChangeCount.value,
        totalSubmitPercentile: Number(achievementSiteContext.value.totalSubmitPercentile || 0),
        acceptRatePercentile: Number(achievementSiteContext.value.acceptRatePercentile || 0),
        medianSubmit: Number(achievementSiteContext.value.medianSubmit || 0),
        medianAcceptRate: Number(achievementSiteContext.value.medianAcceptRate || 0),
        uniqueAcMinute: Boolean(achievementSiteContext.value.uniqueAcMinute),
        siteDailyWaLeader: Boolean(achievementSiteContext.value.siteDailyWaLeader),
        todaySubmitLeader: Boolean(achievementSiteContext.value.todaySubmitLeader),
        todaySubmit: Number(achievementSiteContext.value.todaySubmit || 0),
        todayAcRatePercentile: Number(achievementSiteContext.value.todayAcRatePercentile || 0),
        offPeakPercentile: Number(achievementSiteContext.value.offPeakPercentile || 0),
    });
})

const achievements = computed<AchievementBadge[]>(() => {
    const permanentSet = new Set(permanentAchievementKeys.value);
    return rawAchievements.value.map((item) => (
        permanentSet.has(item.key)
            ? { ...item, unlocked: true, progress: 100 }
            : item
    ));
})

let achievementSnapshotTimer: ReturnType<typeof setTimeout> | null = null;
let lastAchievementSnapshotHash = "";

const achievementSnapshotHash = computed(() => {
    const newestLogTime = Math.max(0, ...recentSubmitLogs.value.map((item) => Number(item.time || 0)));
    const platformMarker = platformPeriodStats.value
        .map((item) => `${item.platform}:${item.ac?.total || 0}:${item.submit?.total || 0}`)
        .join('|');
    return JSON.stringify([
        Number(user.value.userId || 0),
        Number(profilePeriodData.value?.ac?.total || 0),
        Number(profilePeriodData.value?.submit?.total || 0),
        recentSubmitLogs.value.length,
        newestLogTime,
        platformMarker,
        teamInfo.value.id,
        teamInfo.value.members.map((member) => member.userId).join(','),
        permanentAchievementKeys.value.join(','),
        passwordChangeCount.value,
    ]);
})

const saveAchievementSnapshot = () => {
    const userId = Number(user.value.userId || 0);
    if (!userId || achievements.value.length === 0) return;
    if (!isSelfProfile.value && currentRoleId.value !== 1 && currentRoleId.value !== 2) return;
    const sourceHash = achievementSnapshotHash.value;
    if (!sourceHash || sourceHash === lastAchievementSnapshotHash) return;
    lastAchievementSnapshotHash = sourceHash;
    if (achievementSnapshotTimer) window.clearTimeout(achievementSnapshotTimer);
    achievementSnapshotTimer = window.setTimeout(() => {
        API.core.snapshot.save(userId, 'achievement', sourceHash, {
            achievements: achievements.value,
            unlockedCount: unlockedAchievements.value.length,
            totalCount: achievements.value.length,
            generatedAt: Date.now(),
        });
    }, 800);
}

watch(rawAchievements, (items) => {
    const triggeredPermanent = items.filter((item) => item.unlocked).map((item) => item.key);
    if (triggeredPermanent.length === 0) return;
    const currentKeys = new Set(permanentAchievementKeys.value);
    if (triggeredPermanent.some((key) => !currentKeys.has(key))) {
        savePermanentAchievements([...currentKeys, ...triggeredPermanent]);
    }
}, { immediate: true })

watch([achievements, achievementSnapshotHash], saveAchievementSnapshot, { deep: true })

const unlockedAchievements = computed(() => achievements.value.filter((item) => item.unlocked))
type AchievementGlobalRate = {
    unlocked: number;
    total: number;
    rate: number;
}
const achievementGlobalRates = ref<Record<string, AchievementGlobalRate>>({})
const loadingAchievementGlobalRates = ref(false)
const achievementGlobalRateLoaded = ref(false)
type AchievementFilter = 'all' | 'unlocked' | 'progress' | 'hidden'
const showAchievementDrawer = ref(false)
const achievementFilter = ref<AchievementFilter>('all')
const achievementFilters: { key: AchievementFilter; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'unlocked', label: '已解锁' },
    { key: 'progress', label: '未解锁' },
    { key: 'hidden', label: '隐藏' },
]
const visibleAchievements = computed(() => {
    const picked: AchievementBadge[] = [];
    const pushUnique = (items: AchievementBadge[]) => {
        for (const item of items) {
            if (picked.length >= 6) break;
            if (!picked.some((pickedItem) => pickedItem.key === item.key)) picked.push(item);
        }
    }

    pushUnique(achievements.value.filter((item) => item.unlocked).slice(0, 3));
    pushUnique(
        achievements.value
            .filter((item) => !item.unlocked && !item.hidden)
            .sort((a, b) => b.progress - a.progress)
            .slice(0, 2)
    );
    pushUnique(achievements.value.filter((item) => !item.unlocked && item.hidden).slice(0, 1));
    pushUnique(achievements.value);
    return picked;
})

const achievementLabel = (badge: AchievementBadge) => {
    return badge.hidden && !badge.unlocked ? '？？？' : badge.label;
}

const achievementDescription = (badge: AchievementBadge) => {
    return badge.hidden && !badge.unlocked ? '隐藏成就，解锁后显示。' : badge.description;
}

const achievementCondition = (badge: AchievementBadge) => {
    return badge.hidden && !badge.unlocked ? '' : badge.condition;
}

const achievementIcon = (badge: AchievementBadge) => {
    return badge.hidden && !badge.unlocked ? '???' : badge.icon;
}

const achievementDisplayProgress = (badge: AchievementBadge) => {
    if (badge.unlocked) return 100;
    if (badge.hidden) return 0;
    const progress = Math.round(Number(badge.progress || 0));
    return Math.max(0, Math.min(99, progress));
}

const achievementProgressText = (badge: AchievementBadge) => {
    if (badge.unlocked) return '已解锁';
    if (badge.hidden) return '进度隐藏';
    return `${achievementDisplayProgress(badge)}%`;
}

const filteredAchievements = computed(() => {
    if (achievementFilter.value === 'unlocked') return achievements.value.filter((item) => item.unlocked);
    if (achievementFilter.value === 'progress') return achievements.value.filter((item) => !item.unlocked && !item.hidden);
    if (achievementFilter.value === 'hidden') return achievements.value.filter((item) => item.hidden);
    return [...achievements.value].sort((a, b) => (
        Number(b.unlocked) - Number(a.unlocked) ||
        Number(a.hidden) - Number(b.hidden)
    ));
})

const achievementRarity = (badge: AchievementBadge) => {
    if (badge.rarity === 'legendary') return '传说';
    if (badge.rarity === 'epic') return '史诗';
    if (badge.rarity === 'rare') return '稀有';
    if (badge.rarity === 'pain') return '痛苦';
    if (badge.rarity === 'fun') return '隐藏 / 趣味';
    if (badge.rarity === 'server') return '站内';
    if (badge.rarity === 'hidden') return badge.unlocked ? '隐藏' : '未知';
    if (badge.hidden) return badge.unlocked ? '隐藏' : '未知';
    if (badge.tone === 'gold') return '史诗';
    if (badge.tone === 'red') return '痛苦';
    if (achievementDisplayProgress(badge) >= 80 && !badge.unlocked) return '临门一脚';
    return badge.unlocked ? '已收集' : '未解锁';
}

const achievementGlobalRateLabel = (badge: AchievementBadge) => {
    const stat = achievementGlobalRates.value[badge.key];
    if (stat) return `全站解锁 ${stat.rate.toFixed(stat.rate < 1 && stat.rate > 0 ? 1 : 0)}%`;
    return '';
}

const achievementMetaLabel = (badge: AchievementBadge) => {
    const globalRate = achievementGlobalRateLabel(badge);
    return globalRate ? `${achievementRarity(badge)} · ${globalRate}` : achievementRarity(badge);
}

const getAllProfileUsers = async (): Promise<ProfileListItem[]> => {
    const firstResponse = await API.user.profile.list(1);
    Toast.stdResponse(firstResponse, false);
    if (!firstResponse.success) return [];

    const users = [...firstResponse.data.list];
    const totalPage = Math.ceil(Number(firstResponse.data.total || 0) / 10);
    if (totalPage <= 1) return users;

    const pageResponses = await chunkedMap(
        Array.from({ length: totalPage - 1 }, (_, index) => index + 2),
        4,
        (page) => API.user.profile.list(page),
    );
    pageResponses.forEach((response) => {
        if (response.success) users.push(...response.data.list);
    });
    return users;
}

const getAchievementSubmitLogs = async (userId: number): Promise<CoreSubmitLogGetByIdData[]> => {
    const logs: CoreSubmitLogGetByIdData[] = [];
    let cursor = -1;
    const pageSize = 300;
    const maxLogs = 900;
    const minTime = Math.floor(Date.now() / 1000) - 400 * 86400;

    while (logs.length < maxLogs) {
        const response = await API.core.submitLog.getById(userId, cursor, pageSize);
        Toast.stdResponse(response, false);
        if (!response.success) break;

        const pageLogs = response.data.data || [];
        logs.push(...pageLogs);
        if (pageLogs.length === 0 || pageLogs.length < pageSize) break;

        const lastLog = pageLogs[pageLogs.length - 1];
        cursor = Number(lastLog?.time || 0);
        if (!cursor || cursor < minTime) break;
    }

    return logs;
}

const loadAchievementGlobalRates = async () => {
    if (achievementGlobalRateLoaded.value || loadingAchievementGlobalRates.value) return;

    const cacheKey = 'wust-achievement-global-rates:v2';
    const cacheTtl = 30 * 60 * 1000;
    try {
        const cached = JSON.parse(sessionStorage.getItem(cacheKey) || 'null');
        if (cached?.generatedAt && Date.now() - Number(cached.generatedAt) < cacheTtl && cached?.rates) {
            achievementGlobalRates.value = cached.rates;
            achievementNightAcPercentile.value = Number(cached.nightPercentiles?.[Number(user.value.userId)] || 0);
            achievementSiteContext.value = cached.siteContexts?.[Number(user.value.userId)] || {};
            achievementGlobalRateLoaded.value = true;
            return;
        }
    } catch {
        // Ignore broken cache and recalculate.
    }

    loadingAchievementGlobalRates.value = true;
    try {
        const users = (await getAllProfileUsers()).filter((item) => item.username !== 'admin');
        if (users.length === 0) return;

        const userStats = await chunkedMap(users, 3, async (profile) => {
            const userId = Number(profile.userId);
            const [periodResponse, platformResponse, logs] = await Promise.all([
                API.core.statistic.period(userId),
                API.core.statistic.platformPeriod(userId),
                getAchievementSubmitLogs(userId),
            ]);
            return {
                profile,
                period: periodResponse.success ? periodResponse.data.data : null,
                platformStats: platformResponse.success ? platformResponse.data.data : [],
                logs,
                nightAcCount: countNightAccepted(logs),
                totalSubmit: Number(periodResponse.success ? periodResponse.data.data?.submit?.total || 0 : 0) || logs.length,
                acceptRate: (() => {
                    const submitTotal = Number(periodResponse.success ? periodResponse.data.data?.submit?.total || 0 : 0) || logs.length;
                    const acceptedTotal = Number(periodResponse.success ? periodResponse.data.data?.ac?.total || 0 : 0) || logs.filter((log) => isAcceptedStatus(log.status)).length;
                    return submitTotal > 0 ? (acceptedTotal / submitTotal) * 100 : 0;
                })(),
                maxDailyWa: maxDailyWrongAnswers(logs),
                todaySubmit: todaySubmitCount(logs),
                todayAcRate: todayAcceptRate(logs),
                hourlyDistribution: hourlyDistribution(logs),
            };
        });

        const totalSubmits = userStats.map((item) => item.totalSubmit);
        const acceptRates = userStats.map((item) => item.acceptRate);
        const nightAcCounts = userStats.map((item) => item.nightAcCount);
        const maxDailyWas = userStats.map((item) => item.maxDailyWa);
        const todaySubmits = userStats.map((item) => item.todaySubmit);
        const todayLuckyRates = userStats.filter((item) => item.todaySubmit >= 10).map((item) => item.todayAcRate);
        const medianSubmit = medianOf(totalSubmits);
        const medianAcceptRate = medianOf(acceptRates);
        const averageHourlyDistribution = Array.from({ length: 24 }, (_, index) => (
            userStats.reduce((sum, item) => sum + (item.hourlyDistribution[index] || 0), 0) / Math.max(userStats.length, 1)
        ));
        const offPeakScores = userStats.map((item) => distributionDistance(item.hourlyDistribution, averageHourlyDistribution));
        const acMinuteOwners = new Map<string, Set<number>>();
        userStats.forEach((item) => {
            item.logs.forEach((log) => {
                if (!isAcceptedStatus(log.status)) return;
                const minuteKey = localMinuteKey(Number(log.time || 0));
                const owners = acMinuteOwners.get(minuteKey) || new Set<number>();
                owners.add(Number(item.profile.userId));
                acMinuteOwners.set(minuteKey, owners);
            });
        });
        const nightPercentiles: Record<number, number> = {};
        const siteContexts: Record<number, Record<string, number | boolean>> = {};
        const maxDailyWaLeaderValue = Math.max(0, ...maxDailyWas);
        const todaySubmitLeaderValue = Math.max(0, ...todaySubmits);
        userStats.forEach((item) => {
            const userId = Number(item.profile.userId);
            const nightPercentile = percentileOf(nightAcCounts, item.nightAcCount);
            const offPeakScore = distributionDistance(item.hourlyDistribution, averageHourlyDistribution);
            nightPercentiles[userId] = nightPercentile;
            const userAcMinuteKeys = new Set(
                item.logs
                    .filter((log) => isAcceptedStatus(log.status))
                    .map((log) => localMinuteKey(Number(log.time || 0))),
            );
            const uniqueAcMinute = [...userAcMinuteKeys].some((minuteKey) => acMinuteOwners.get(minuteKey)?.size === 1);
            siteContexts[userId] = {
                totalSubmitPercentile: percentileOf(totalSubmits, item.totalSubmit),
                acceptRatePercentile: percentileOf(acceptRates, item.acceptRate),
                medianSubmit,
                medianAcceptRate,
                uniqueAcMinute,
                siteDailyWaLeader: maxDailyWaLeaderValue >= 20 && item.maxDailyWa === maxDailyWaLeaderValue,
                todaySubmitLeader: todaySubmitLeaderValue > 0 && item.todaySubmit === todaySubmitLeaderValue,
                todaySubmit: item.todaySubmit,
                todayAcRatePercentile: item.todaySubmit >= 10 ? percentileOf(todayLuckyRates, item.todayAcRate) : 0,
                offPeakPercentile: percentileOf(offPeakScores, offPeakScore),
            };
        });
        achievementNightAcPercentile.value = Number(nightPercentiles[Number(user.value.userId)] || 0);
        achievementSiteContext.value = siteContexts[Number(user.value.userId)] || {};

        const teamMembersByGroup = new Map<number, TeamDashboardMember[]>();
        userStats.forEach((item) => {
            const groupId = Number(item.profile.groupId || 0);
            if (groupId <= 0) return;
            const list = teamMembersByGroup.get(groupId) || [];
            list.push({
                userId: Number(item.profile.userId),
                name: item.profile.name || item.profile.username,
                username: item.profile.username,
                avatar: item.profile.avatar || '',
                acTotal: Number(item.period?.ac?.total || 0),
                submitTotal: Number(item.period?.submit?.total || 0),
                waTotal: countWrongAnswers(item.logs),
                weekAc: Number(item.period?.ac?.thisWeek || 0),
                weekSubmit: Number(item.period?.submit?.thisWeek || 0),
                monthAc: Number(item.period?.ac?.thisMonth || 0),
                monthSubmit: Number(item.period?.submit?.thisMonth || 0),
            });
            teamMembersByGroup.set(groupId, list);
        });

        const counts: Record<string, number> = {};
        userStats.forEach((item) => {
            const groupId = Number(item.profile.groupId || 0);
            const badges = buildAchievementBadges(item.period, item.logs, item.platformStats, {
                currentUserId: Number(item.profile.userId),
                members: groupId > 0 ? (teamMembersByGroup.get(groupId) || []) : [],
                nightAcPercentile: nightPercentiles[Number(item.profile.userId)] || 0,
                passwordChangeCount: Number(item.profile.userId) === Number(user.value.userId) ? passwordChangeCount.value : 0,
                ...siteContexts[Number(item.profile.userId)],
            });
            badges.forEach((badge) => {
                if (badge.unlocked) counts[badge.key] = (counts[badge.key] || 0) + 1;
            });
        });

        const rates: Record<string, AchievementGlobalRate> = {};
        const total = userStats.length;
        achievements.value.forEach((badge) => {
            const unlocked = counts[badge.key] || 0;
            rates[badge.key] = {
                unlocked,
                total,
                rate: total > 0 ? (unlocked / total) * 100 : 0,
            };
        });
        achievementGlobalRates.value = rates;
        achievementGlobalRateLoaded.value = true;
        sessionStorage.setItem(cacheKey, JSON.stringify({ generatedAt: Date.now(), rates, nightPercentiles, siteContexts }));
    } finally {
        loadingAchievementGlobalRates.value = false;
    }
}

watch(showAchievementDrawer, (visible) => {
    if (visible) loadAchievementGlobalRates();
})

watch(
    () => detailModal.value.open || showAchievementDrawer.value,
    (locked) => {
        if (typeof document === 'undefined') return;
        if (locked) {
            if (!previousBodyOverflow) previousBodyOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = previousBodyOverflow;
            previousBodyOverflow = '';
        }
    },
);

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
        const submitLogResponse = await API.core.submitLog.getById(member.userId, 0, 900);
        const stats = response.success ? response.data.data : null;
        const logs = submitLogResponse.success ? submitLogResponse.data.data : [];
        return {
            userId: Number(member.userId),
            avatar: member.avatar,
            name: member.name,
            username: member.username,
            acTotal: stats ? Number(stats.ac.total) : 0,
            submitTotal: stats ? Number(stats.submit.total) : 0,
            waTotal: countWrongAnswers(logs),
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

const transferOwner = async (member: TeamMember) => {
    if (!canManageTeam.value || Number(member.userId) === Number(teamInfo.value.ownerId)) {
        return;
    }
    const displayName = member.name || member.username;
    const confirmed = window.confirm(`确定要把团队「${teamInfo.value.name}」的队长转移给 ${displayName} 吗？转移后你将不再拥有团队管理权限。`);
    if (!confirmed) {
        return;
    }
    const response = await API.user.team.transferOwner(Number(member.userId));
    Toast.stdResponse(response);
    if (response.success) {
        teamPanelMode.value = 'idle';
        await getTeamInfo();
    }
}

const leaveTeam = async () => {
    if (!canLeaveTeam.value || teamInfo.value.id === 0) {
        return;
    }
    const confirmed = window.confirm(`确定要退出团队「${teamInfo.value.name}」吗？退出后需要重新接受邀请才能加入团队。`);
    if (!confirmed) {
        return;
    }
    const response = await API.user.team.leave();
    Toast.stdResponse(response);
    if (response.success) {
        user.value.groupId = '0';
        teamPanelMode.value = 'idle';
        await getTeamInfo();
    }
}

const disbandTeam = async () => {
    if (!canManageTeam.value || teamInfo.value.id === 0) {
        return;
    }
    const confirmed = window.confirm(`确定要解散团队「${teamInfo.value.name}」吗？所有成员都会变为无团队，待处理邀请会失效。`);
    if (!confirmed) {
        return;
    }
    const response = await API.user.team.disband();
    Toast.stdResponse(response);
    if (response.success) {
        user.value.groupId = '0';
        teamPanelMode.value = 'idle';
        await getTeamInfo();
    }
}

const getSubmitInfo = async () => {
    loadingActivities.value = true;
    try {
        const recentLogs: CoreSubmitLogGetByIdData[] = [];
        let cursor = -1;
        const pageSize = 300;
        const maxLogs = 5000;

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
            if (!cursor) {
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
        loadPermanentAchievements();
        loadPasswordChangeCount();
        loadingProfile.value = false;
    }

    Toast.stdResponse(response, false);

    getSubmitInfo();
    getHeatmapData();
    getData();
    getContests();
    getTeamInfo();
    getSyncStatus();
    getStatisticExplanation();
}

interface HeatmapData {
    date: string;
    count: number;
}

const submitTrendData = ref<HeatmapData[]>([])
const acTrendData = ref<HeatmapData[]>([])

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

const updateLog = async (platform = "") => {
    const response = await API.core.spider.update(user.value.userId, platform);
    Toast.stdResponse(response);
    const jobId = Number(response.data?.jobId || 0);
    if (response.success && jobId > 0) {
        if (platform) startPlatformRefreshCooldown(platform);
        await pollSpiderJob(jobId);
    }
}

const updatePlatformLog = async (platform: string) => {
    if (!platform) return;
    await updateLog(platform);
}

const isRefreshingPlatform = (platform: string) => {
    if (!activeSpiderJob.value || !["queued", "running"].includes(activeSpiderJob.value.status)) return false;
    return !activeSpiderJob.value.currentPlatform || activeSpiderJob.value.currentPlatform === platform;
}

const platformRefreshCooldown = (platform: string) => {
    const until = platformRefreshCooldowns.value[platform] || 0;
    return Math.max(0, Math.ceil((until - Date.now()) / 1000));
}

const isPlatformRefreshCoolingDown = (platform: string) => platformRefreshCooldown(platform) > 0;

const platformRefreshButtonLabel = (platform: string) => {
    if (isRefreshingPlatform(platform)) return "刷新中";
    const cooldown = platformRefreshCooldown(platform);
    return cooldown > 0 ? `${cooldown}s` : "刷新";
}

const startPlatformRefreshCooldown = (platform: string) => {
    platformRefreshCooldowns.value = {
        ...platformRefreshCooldowns.value,
        [platform]: Date.now() + 60_000,
    };
    startRefreshCooldownTimer();
}

const startRefreshCooldownTimer = () => {
    if (refreshCooldownTimer) return;
    refreshCooldownTimer = window.setInterval(() => {
        platformRefreshCooldowns.value = { ...platformRefreshCooldowns.value };
        if (Object.values(platformRefreshCooldowns.value).every((until) => until <= Date.now())) {
            stopRefreshCooldownTimer();
        }
    }, 1000);
}

const stopRefreshCooldownTimer = () => {
    if (refreshCooldownTimer) {
        window.clearInterval(refreshCooldownTimer);
        refreshCooldownTimer = undefined;
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
    const [response, auditResponse] = await Promise.all([
        API.core.spider.status(user.value.userId),
        API.core.spider.audit(user.value.userId),
    ]);
    Toast.stdResponse(response, false);
    if (response.success) {
        syncStatuses.value = response.data.data;
    }
    Toast.stdResponse(auditResponse, false);
    if (auditResponse.success) {
        spiderAuditRows.value = auditResponse.data.data;
    }
    loadingSyncStatus.value = false;
}

const getStatisticExplanation = async () => {
    const response = await API.core.statistic.explanation();
    Toast.stdResponse(response, false);
    if (response.success) {
        statisticExplanation.value = response.data;
    }
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

const formatDetailTime = (timestamp: number) => {
    if (!timestamp) return '未知';
    return new Date(timestamp * 1000).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

const clampDetailPageSize = (value: number) => Math.max(5, Math.min(40, value));

const preferredDetailPageSize = () => {
    if (typeof window === 'undefined') return 12;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const shellHeight = width <= 600 ? 278 : width <= 1000 ? 292 : 310;
    const rowHeight = width <= 600 ? 36 : 49;
    return clampDetailPageSize(Math.floor((height - shellHeight) / rowHeight));
}

const measuredDetailPageSize = () => {
    const wrapHeight = detailTableWrapRef.value?.clientHeight || 0;
    if (!wrapHeight) return preferredDetailPageSize();
    const width = typeof window === 'undefined' ? 1280 : window.innerWidth;
    const rowHeight = width <= 600 ? 36 : 49;
    const tableHeaderHeight = width <= 600 ? 37 : 45;
    return clampDetailPageSize(Math.floor((wrapHeight - tableHeaderHeight - 12) / rowHeight));
}

const loadPlatformDetail = async () => {
    if (!detailModal.value.platform) return;
    loadingPlatformDetail.value = true;
    const response = await API.core.statistic.platformDetail({
        userId: Number(user.value.userId),
        platform: detailModal.value.platform,
        mode: detailModal.value.mode,
        page: detailModal.value.page,
        pageSize: detailModal.value.pageSize,
    });
    Toast.stdResponse(response, false);
    if (response.success) {
        platformDetail.value = response.data;
    }
    loadingPlatformDetail.value = false;
}

const openPlatformDetail = async (platform: string) => {
    detailModal.value = {
        open: true,
        platform,
        mode: 'ac',
        page: 1,
        pageSize: preferredDetailPageSize(),
    };
    platformDetail.value = null;
    await nextTick();
    detailModal.value.pageSize = measuredDetailPageSize();
    await loadPlatformDetail();
    await nextTick();
    const measuredPageSize = measuredDetailPageSize();
    if (measuredPageSize !== detailModal.value.pageSize) {
        detailModal.value.page = 1;
        detailModal.value.pageSize = measuredPageSize;
        await loadPlatformDetail();
    }
}

const closePlatformDetail = () => {
    detailModal.value.open = false;
}

const switchPlatformDetailMode = async (mode: 'ac' | 'submit') => {
    detailModal.value.mode = mode;
    detailModal.value.page = 1;
    await loadPlatformDetail();
}

const changePlatformDetailPage = async (delta: number) => {
    detailModal.value.page = Math.max(1, detailModal.value.page + delta);
    await loadPlatformDetail();
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
    window.addEventListener("resize", handleProfileResize);
    // 该页面有登录路由守卫
    if (route.query.id) {
        user.value.userId = Number(route.query.id);
    } else {
        user.value.userId = JWT.getUserInfo()!.userId;
    }
    getUserInfo();
})

onBeforeUnmount(() => {
    window.removeEventListener("resize", handleProfileResize);
    if (detailResizeTimer) {
        window.clearTimeout(detailResizeTimer);
    }
    stopSpiderJobPolling();
    stopRefreshCooldownTimer();
    if (typeof document !== 'undefined') {
        document.body.style.overflow = previousBodyOverflow;
    }
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
            min-width: 0;
            box-sizing: border-box;
        }

        >.left {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 300px;
            box-sizing: border-box;
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
                box-sizing: border-box;

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
                width: 100%;
                box-sizing: border-box;
                padding: 18px;
                border: 1px solid var(--divider-color);
                border-radius: 12px;
                background: var(--background-color-content);
                box-shadow: 0 0 20px rgba(0, 0, 0, 0.06);
            }

            >.team-card {
                gap: 14px;
            }
        }

        >.right {
            /* margin: 0 auto;
            width: 100%; */
            flex: 0 1 980px;
            max-width: 1200px;
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

.team-edit.danger:hover {
    border-color: #f44336;
    color: #fff;
    background-color: #f44336;
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

.team-danger-zone {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 0;
    gap: 10px;
    margin-top: 4px;
    padding-top: 12px;
    border-top: 1px solid var(--divider-color);
}

.team-danger-tip {
    color: var(--text-light-color);
    font-size: var(--text-xs);
    line-height: 1.6;
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

.team-member-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 0;
    gap: 6px;
    flex-wrap: wrap;
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

.sync-refresh-btn {
    flex-shrink: 0;
    min-width: 58px;
}

.sync-empty {
    color: var(--text-light-color);
    font-size: var(--text-sm);
}

.stat-scope-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.stat-scope-note {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
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

.inline-link-button {
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
    padding: 10px 12px;
    border: 1px solid var(--divider-color);
    border-left: 3px solid var(--active-color);
    border-radius: 12px;
    color: var(--text-light-color);
    background-color: var(--background-color-2);
    font-size: var(--text-xs);
    line-height: 1.7;
}

.detail-modal-mask {
    position: fixed;
    z-index: 80;
    inset: 0;
    display: flex;
    align-items: stretch;
    justify-content: flex-end;
    padding: 12px;
    overflow: hidden;
    background-color: rgba(15, 23, 42, 0.72);
}

.detail-modal {
    position: relative;
    display: grid;
    grid-template-rows: auto auto auto minmax(0, 1fr) auto;
    width: min(1400px, calc(100vw - 24px));
    height: calc(100dvh - 24px);
    max-height: calc(100dvh - 24px);
    overflow: hidden;
    overscroll-behavior: contain;
    padding: 0;
    border: 1px solid var(--divider-color);
    border-radius: 18px;
    color: var(--text-default-color);
    background-color: var(--background-color-1);
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.36);
}

.detail-modal-header,
.detail-pagination {
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    background-color: var(--background-color-1);
}

.detail-modal-header {
    padding: 24px 24px 18px;
    border-bottom: 1px solid var(--divider-color);
}

.detail-pagination {
    padding: 14px 24px;
    border-top: 1px solid var(--divider-color);
}

.detail-modal-header h2 {
    margin: 4px 0 0;
    font-size: var(--text-xl);
}

.detail-summary {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 10px;
    margin: 0;
    padding: 18px 24px 14px;
}

.detail-summary div {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px;
    border: 1px solid var(--divider-color);
    border-radius: 12px;
    background-color: var(--background-color-2);
}

.detail-summary strong {
    color: var(--active-color);
    font-size: var(--text-xl);
}

.detail-summary span,
.detail-pagination {
    color: var(--text-light-color);
    font-size: var(--text-sm);
}

.detail-tabs {
    display: flex;
    gap: 8px;
    margin: 0;
    padding: 0 24px 14px;
}

.detail-table-wrap {
    width: auto;
    min-height: 0;
    height: 100%;
    margin: 0 24px;
    overflow-x: auto;
    overflow-y: hidden;
    border: 1px solid var(--divider-color);
    border-radius: 12px;
    overscroll-behavior-x: contain;
    -webkit-overflow-scrolling: touch;
    scrollbar-gutter: stable both-edges;
    touch-action: pan-x;
}

.detail-table-wrap::-webkit-scrollbar {
    width: 10px;
    height: 10px;
}

.detail-table-wrap::-webkit-scrollbar-thumb {
    border: 2px solid var(--background-color-1);
    border-radius: 999px;
    background-color: color-mix(in srgb, var(--section-active-color) 55%, var(--divider-color));
}

.detail-table-wrap::-webkit-scrollbar-track {
    background-color: var(--background-color-2);
}

.detail-table {
    width: 100%;
    min-width: 1040px;
    border-collapse: collapse;
    font-size: var(--text-sm);
    table-layout: fixed;
}

.detail-table-problems {
    min-width: 1120px;
}

.detail-table-records {
    min-width: 1280px;
}

.detail-table th,
.detail-table td {
    padding: 10px 12px;
    border-bottom: 1px solid var(--divider-color);
    text-align: left;
    vertical-align: top;
    white-space: nowrap;
}

.detail-table-problems th:nth-child(1),
.detail-table-problems td:nth-child(1) {
    width: 280px;
    white-space: normal;
    overflow-wrap: anywhere;
}

.detail-table-problems th:nth-child(2),
.detail-table-problems td:nth-child(2) {
    width: 360px;
    white-space: normal;
    overflow-wrap: anywhere;
}

.detail-table-problems th:nth-child(3),
.detail-table-problems td:nth-child(3) {
    width: 180px;
}

.detail-table-problems th:nth-child(4),
.detail-table-problems td:nth-child(4),
.detail-table-problems th:nth-child(5),
.detail-table-problems td:nth-child(5) {
    width: 120px;
}

.detail-table-records th:nth-child(1),
.detail-table-records td:nth-child(1) {
    width: 170px;
}

.detail-table-records th:nth-child(2),
.detail-table-records td:nth-child(2) {
    width: 260px;
    white-space: normal;
    overflow-wrap: anywhere;
}

.detail-table-records th:nth-child(3),
.detail-table-records td:nth-child(3) {
    width: 120px;
}

.detail-table-records th:nth-child(4),
.detail-table-records td:nth-child(4) {
    width: 110px;
}

.detail-table-records th:nth-child(5),
.detail-table-records td:nth-child(5) {
    width: 360px;
    white-space: normal;
    overflow-wrap: anywhere;
}

.detail-table-records th:nth-child(6),
.detail-table-records td:nth-child(6) {
    width: 260px;
    white-space: normal;
    overflow-wrap: anywhere;
}

.detail-table th {
    color: var(--text-default-color);
    background-color: var(--background-color-2);
}

.detail-table td {
    color: var(--text-light-color);
}

.detail-table code {
    color: var(--active-color);
    font-family: inherit;
    overflow-wrap: anywhere;
    white-space: normal;
}

.achievement-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
}

.achievement-header-actions {
    align-items: center;
    gap: 8px;
}

.achievement-drawer-close {
    border: 1px solid var(--divider-color);
    border-radius: 8px;
    color: var(--text-secondary-color);
    background-color: var(--background-color-2);
    font-family: inherit;
    font-weight: 800;
    cursor: pointer;
    transition:
        background-color 0.2s ease,
        border-color 0.2s ease,
        color 0.2s ease;
}

.achievement-drawer-close:hover {
    color: white;
    border-color: var(--neon-cyan);
    background-color: var(--neon-cyan);
}

.achievement-action-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 30px;
    padding: 4px 10px;
    border: 1px solid var(--divider-color);
    border-radius: 8px;
    color: var(--text-secondary-color);
    background-color: var(--background-color-2);
    font-family: inherit;
    font-size: var(--text-sm);
    font-weight: 800;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    transition:
        background-color 0.2s ease,
        border-color 0.2s ease,
        color 0.2s ease;
    -webkit-user-select: none;
    user-select: none;
}

.achievement-action-button:hover,
.achievement-action-button.active {
    color: white;
    border-color: var(--neon-cyan);
    background-color: var(--neon-cyan);
}

.achievement-view-all {
    min-height: 28px;
    padding: 4px 9px;
    font-size: var(--text-xs);
}

.achievement-card {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr);
    gap: 10px;
    align-items: center;
    min-height: 72px;
    padding: 10px;
    border: 1px solid var(--divider-color);
    border-radius: 12px;
    background-color: var(--section-background-color);
    transition:
        border-color 0.2s ease,
        background-color 0.2s ease;
}

.achievement-card:hover {
    border-color: var(--neon-cyan);
}

.achievement-card.locked {
    opacity: 1;
    border-style: dashed;
    background-color: color-mix(in srgb, var(--section-background-color) 88%, var(--background-color-2));
}

.achievement-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 14px;
    color: var(--text-reverse-color);
    background-color: var(--neon-cyan);
    font-size: var(--text-sm);
    font-weight: 900;
}

.achievement-card.tone-cyan .achievement-icon,
.achievement-card.tone-blue .achievement-icon {
    color: var(--text-default-color);
    border: 1px solid color-mix(in srgb, var(--neon-cyan) 48%, var(--divider-color));
    background-color: var(--background-color-2);
    background-color: color-mix(in srgb, var(--neon-cyan) 30%, var(--background-color-content));
}

.achievement-card.tone-gold .achievement-icon {
    color: #111827;
    background-color: #f59e0b;
}

.achievement-card.tone-blue .achievement-icon {
    background-color: var(--background-color-2);
    background-color: color-mix(in srgb, var(--neon-cyan) 38%, var(--background-color-content));
}

.achievement-card.tone-red .achievement-icon {
    background-color: #ef4444;
}

.achievement-card.tone-muted .achievement-icon,
.achievement-card.locked .achievement-icon {
    color: var(--text-default-color);
    border: 1px solid var(--divider-color);
    background-color: var(--background-color-2);
    background-color: color-mix(in srgb, var(--background-color-2) 78%, var(--background-color-content));
}

.achievement-card.hidden-achievement .achievement-icon {
    color: var(--text-default-color);
    border: 1px solid color-mix(in srgb, var(--neon-cyan) 38%, var(--divider-color));
    background-color: var(--background-color-2);
    background-color: color-mix(in srgb, var(--neon-cyan) 16%, var(--section-background-color));
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
    overflow: hidden;
    display: -webkit-box;
    min-height: 0;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
}

.achievement-global-rate {
    margin-top: 5px;
    color: var(--active-color);
    font-size: var(--text-xs);
    font-weight: 900;
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

.achievement-more {
    margin-top: 10px;
    color: var(--text-light-color);
    font-size: var(--text-xs);
}

.achievement-drawer-mask {
    position: fixed;
    inset: 0;
    z-index: 2100;
    display: flex;
    justify-content: flex-end;
    background-color: rgba(0, 0, 0, 0.42);
}

.achievement-drawer {
    display: flex;
    flex-direction: column;
    width: min(520px, 100vw);
    height: 100%;
    padding: 22px;
    overflow: hidden;
    border-left: 1px solid var(--divider-color);
    background-color: var(--background-color-content);
    box-shadow: -12px 0 28px rgba(0, 0, 0, 0.18);
    contain: layout paint;
}

.achievement-drawer-header {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 12px;
    align-items: center;
}

.achievement-drawer-kicker {
    color: var(--active-color);
    font-size: var(--text-xs);
    font-weight: 900;
    letter-spacing: 0.08em;
}

.achievement-drawer-header h2 {
    margin: 4px 0 0;
    color: var(--text-default-color);
    font-size: var(--text-xl);
}

.achievement-drawer-count {
    padding: 5px 9px;
    border: 1px solid var(--divider-color);
    border-radius: 10px;
    color: var(--active-color);
    background-color: var(--background-color-1);
    font-size: var(--text-sm);
    font-weight: 900;
}

.achievement-drawer-close {
    width: 30px;
    height: 30px;
    font-size: var(--text-base);
    line-height: 1;
}

.achievement-drawer-tabs {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 8px;
    margin: 14px 0;
}

.achievement-drawer-tabs .achievement-action-button {
    min-width: 64px;
}

.achievement-drawer-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 0;
    overflow-y: auto;
    padding-bottom: 22px;
    overscroll-behavior: contain;
}

.achievement-drawer-list::-webkit-scrollbar {
    width: 6px;
}

.achievement-drawer-list::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background-color: var(--divider-color);
}

.achievement-detail-card {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr);
    gap: 12px;
    padding: 12px;
    border: 1px solid var(--divider-color);
    border-radius: 14px;
    background-color: var(--section-background-color);
    content-visibility: auto;
    contain-intrinsic-size: 92px;
}

.achievement-detail-card.locked {
    opacity: 1;
    border-style: dashed;
    background-color: color-mix(in srgb, var(--section-background-color) 88%, var(--background-color-2));
}

.achievement-detail-card.tone-gold .achievement-detail-icon {
    color: #111827;
    background-color: #f59e0b;
}

.achievement-detail-card.tone-cyan .achievement-detail-icon,
.achievement-detail-card.tone-blue .achievement-detail-icon {
    color: var(--text-default-color);
    border: 1px solid color-mix(in srgb, var(--neon-cyan) 48%, var(--divider-color));
    background-color: var(--background-color-2);
    background-color: color-mix(in srgb, var(--neon-cyan) 30%, var(--background-color-content));
}

.achievement-detail-card.tone-blue .achievement-detail-icon {
    background-color: var(--background-color-2);
    background-color: color-mix(in srgb, var(--neon-cyan) 38%, var(--background-color-content));
}

.achievement-detail-card.tone-red .achievement-detail-icon {
    background-color: #ef4444;
}

.achievement-detail-card.tone-muted .achievement-detail-icon,
.achievement-detail-card.locked .achievement-detail-icon {
    color: var(--text-default-color);
    border: 1px solid var(--divider-color);
    background-color: var(--background-color-2);
    background-color: color-mix(in srgb, var(--background-color-2) 78%, var(--background-color-content));
}

.achievement-detail-card.hidden-achievement .achievement-detail-icon {
    color: var(--text-default-color);
    border: 1px solid color-mix(in srgb, var(--neon-cyan) 38%, var(--divider-color));
    background-color: var(--background-color-2);
    background-color: color-mix(in srgb, var(--neon-cyan) 16%, var(--section-background-color));
}

.achievement-detail-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.achievement-detail-top span {
    color: var(--text-default-color);
    font-size: var(--text-base);
    font-weight: 900;
}

.achievement-detail-top em {
    flex: none;
    color: var(--active-color);
    font-size: var(--text-xs);
    font-style: normal;
    font-weight: 900;
}

.achievement-detail-info p {
    margin: 6px 0 10px;
    color: var(--text-light-color);
    font-size: var(--text-sm);
    line-height: 1.6;
}

.achievement-condition {
    margin: -2px 0 10px;
    color: var(--text-default-color);
    font-size: var(--text-xs);
    font-weight: 800;
    line-height: 1.6;
}

.achievement-detail-progress {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
}

.achievement-detail-progress div {
    height: 6px;
    overflow: hidden;
    border-radius: 999px;
    background-color: var(--background-color-1);
}

.achievement-detail-progress span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background-color: var(--neon-cyan);
}

.achievement-detail-progress b {
    color: var(--text-light-color);
    font-size: var(--text-xs);
}

.achievement-empty {
    padding: 28px 0;
    color: var(--text-light-color);
    text-align: center;
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
    min-height: 30px;
    padding: 4px 10px;
    background-color: var(--background-color-2);
    color: var(--text-secondary-color);
    border: 1px solid var(--divider-color);
    border-radius: var(--control-radius);
    cursor: pointer;
    font-family: inherit;
    font-size: var(--text-sm);
    font-weight: 800;
    line-height: 1;
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
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

@media (max-width:1600px) {
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
        flex: none;
        width: 100%;
    }
}

@media (max-width:1000px) {
    .detail-modal-mask {
        padding: 10px;
    }

    .detail-modal {
        width: 100%;
        height: calc(100dvh - 20px);
        max-height: calc(100dvh - 20px);
    }

    .detail-modal-header {
        padding: 18px 18px 12px;
    }

    .detail-pagination {
        padding: 12px 18px;
    }

    .detail-summary {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        padding: 14px 18px 12px;
    }

    .detail-tabs {
        padding: 0 18px 12px;
    }

    .detail-table-wrap {
        margin: 0 18px;
    }

    .achievement-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .moblie-actions {
        display: flex;
        flex-direction: column;
        gap: 10px;

        .btn {
            width: 100%;
            font-size: var(--text-sm);
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
                    background:
                        radial-gradient(circle at 30% 20%, color-mix(in srgb, var(--neon-cyan) 18%, transparent), transparent 34%),
                        linear-gradient(135deg, var(--background-color-2), var(--background-color-content));
                    overflow: hidden;

                    >.flow-emoji {
                        display: none;
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
    .detail-summary {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
    }

    .detail-modal-mask {
        padding: 0;
    }

    .detail-modal {
        width: 100%;
        height: 100dvh;
        max-height: 100dvh;
        border-left: none;
        border-right: none;
        border-radius: 0;
    }

    .detail-modal-header {
        align-items: flex-start;
        padding: 14px 14px 10px;
    }

    .detail-summary {
        padding: 12px 14px 10px;
    }

    .detail-summary div {
        gap: 2px;
        padding: 9px 10px;
    }

    .detail-summary strong {
        font-size: var(--text-lg);
    }

    .detail-tabs {
        gap: 6px;
        margin-bottom: 10px;
        padding: 0 14px 10px;
    }

    .detail-tabs .achievement-action-button {
        min-width: 0;
        padding: 6px 10px;
        font-size: var(--text-xs);
    }

    .detail-table-wrap {
        margin: 0 14px;
        border-radius: 10px;
    }

    .detail-table {
        width: max(100%, 720px);
        font-size: var(--text-xs);
    }

    .detail-table th,
    .detail-table td {
        padding: 8px 10px;
    }

    .detail-pagination {
        align-items: stretch;
        flex-direction: column;
        padding: 10px 14px calc(10px + env(safe-area-inset-bottom));
    }

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
        flex-wrap: wrap;
    }

    .sync-counts {
        align-items: flex-start;
    }

    .sync-badge,
    .sync-refresh-btn {
        align-self: flex-start;
    }

    .stat-scope-note {
        align-items: flex-start;
        flex-direction: column;
        gap: 6px;
    }

    .stat-scope-note span {
        width: 100%;
    }

    .inline-link-button {
        align-self: flex-start;
        padding: 0;
    }

    .container > .top > .left > .avatar {
        top: 120px;
        width: 80px;
        border-width: 6px;
    }

    .container > .top > .left > .info {
        padding: 80px 16px 0 16px;
    }

    .team-header,
    .team-search,
    .team-inline-actions,
    .team-danger-zone {
        align-items: stretch;
        flex-direction: column;
    }

    .team-edit {
        align-self: flex-start;
    }

    .team-action {
        width: 100%;
    }

    .team-edit-member {
        align-items: flex-start;
        flex-wrap: wrap;
    }

    .team-member-actions {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
    }

    .container {
        >.top {
            >.right {
                width: 100%;
                padding: 0;
            }
        }
    }

    .achievement-drawer-mask {
        align-items: flex-end;
    }

    .achievement-drawer {
        width: 100%;
        height: min(86vh, 760px);
        padding: 18px;
        border-left: none;
        border-radius: 18px 18px 0 0;
    }

    .achievement-drawer-tabs {
        gap: 6px;
    }

    .achievement-drawer-tabs .achievement-action-button {
        min-width: 0;
        padding: 5px 10px;
        font-size: var(--text-xs);
    }

    .achievement-drawer-header {
        grid-template-columns: minmax(0, 1fr) auto;
    }

    .achievement-drawer-close {
        grid-column: 2;
        grid-row: 1;
    }

    .achievement-drawer-count {
        justify-self: flex-start;
    }

    .achievement-detail-card {
        grid-template-columns: 40px minmax(0, 1fr);
        padding: 10px;
    }

    .achievement-drawer-list {
        padding-bottom: 18px;
    }
}

@media (max-width:430px) {
    .container > .top > .left > .team-card {
        width: calc(100% - 24px);
        padding: 14px;
    }

    .container > .top > .left > .info {
        width: calc(100% - 24px);
        padding-left: 12px;
        padding-right: 12px;
    }

    .detail-summary {
        gap: 8px;
    }

    .detail-summary div {
        padding: 10px;
    }

    .achievement-drawer {
        height: 88dvh;
        padding: 14px;
    }

    .achievement-drawer-header h2 {
        font-size: var(--text-lg);
    }

    .achievement-detail-card {
        gap: 10px;
        border-radius: 12px;
    }
}
</style>
