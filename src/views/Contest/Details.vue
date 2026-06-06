<template>
    <BaseLayout>
        <template #header>
            比赛 Contest
        </template>
        <div v-if="requiresLoginMessage" class="empty-placeholder">登录后可以查看比赛</div>
        <div v-else>
            <div class="contestInfo" style="position: relative;">
                <LoadingOverlay :show="loadingInfo" />
                <div class="platform">{{ info.platform || "加载中" }}</div>
                <div class="title">{{ info.contestName || "加载中" }}</div>
                <div class="time">{{ info.time || "1970/1/1 00:00:00" }}</div>
                <div class="actions">
                    <div class="btn def" :class="loadingInfo ? 'dis' : ''" @click="toContest(info.contestUrl)">跳转到比赛主页</div>
                </div>
            </div>
            <div class="group-filter" v-if="groups.length > 0">
                <span class="filter-label">分组筛选：</span>
                <span class="filter-tab" :class="{ active: selectedGroupId === -1 }" @click="switchGroup(-1)">全部</span>
                <span class="filter-tab" v-for="g in groups" :key="g.id" :class="{ active: selectedGroupId === g.id }" @click="switchGroup(g.id)">{{ g.name }}</span>
            </div>
            <div style="position: relative;">
                <LoadingOverlay :show="loadingRank" />
                <template v-if="rankData.data.length > 0">
                    <Rank :data="rankData" title="比赛排行榜" :is-joined="false"></Rank>
                </template>
                <div v-else-if="!loadingRank" class="empty-placeholder">暂无排行数据</div>
            </div>
            <div class="pageNavigation" v-if="data && rankData.data.length > 0">
                <div class="group">
                    <button class="page-nav-btn" :disabled="data.currentPage <= 1"
                        @click="getRankData(data.currentPage - 1)">上一页</button>
                    <div class="pageButtons">
                        <button v-for="value in pages" :key="value" :class="value === data.currentPage ? 'active' : ''"
                            @click="value === data.currentPage ? null : getRankData(value)">{{ value
                            }}</button>
                    </div>
                    <button class="page-nav-btn" :disabled="data.currentPage >= data.totalPage"
                        @click="getRankData(data.currentPage + 1)">下一页</button>
                </div>
                <div class="group">
                    <div class="pageInput">
                        <input type="number" min="1" :max="data.totalPage" v-model="jumppage"
                            @keyup.enter="getRankData(jumppage)">
                        <button @click="getRankData(jumppage)">跳转</button>
                    </div>
                    <div class="pageSum">共 {{ data.totalPage }} 页</div>
                </div>
            </div>
        </div>
    </BaseLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseLayout from '@/components/BaseLayout.vue'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import Rank from '@/components/Rank.vue'
import API from '@/utils/api'
import Toast from '@/utils/toast'
import type { platform } from '@/utils/type'
import { useUserStore } from '@/stores/user'

// 从url获取id参数
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const id = route.params.id
const requiresLoginMessage = ref(false)

// 加载状态，用于加载时禁用按键
const loadingInfo = ref(true);
const loadingRank = ref(true);

if (!id) {
    router.back();
}

const info = ref<{
    id: number;
    platform: platform;
    contestId: string;
    contestName: string;
    contestUrl: string;
    totalCount: number;
    time: string;
}>({
    id: 0,
    platform: 'NowCoder',
    contestId: '',
    contestName: '',
    contestUrl: '',
    totalCount: 0,
    time: ""
})

const data = ref<{
    list: rankDataItem[],
    total: number,
    totalPage: number,
    currentPage: number,
}>({
    list: [],
    total: 1,
    totalPage: 1,
    currentPage: 0
})

const jumppage = ref(1);

const pages = computed(() => {
    if (!data.value) return [];
    const currentPage = data.value.currentPage;
    const totalPage = data.value.totalPage;
    if (totalPage <= 3) return Array.from({ length: totalPage }, (_, i) => i + 1);
    if (currentPage <= 1) return [1, 2, 3];
    if (currentPage >= totalPage - 1) return [totalPage - 2, totalPage - 1, totalPage];
    return [currentPage - 1, currentPage, currentPage + 1];
})

const selectedGroupId = ref<number>(-1)
const groups = ref<{ id: number; name: string }[]>([])

const loadGroups = async () => {
    const resp = await API.user.group.list(1)
    if (resp.success) {
        groups.value = resp.data.list.map((g: any) => ({ id: g.id, name: g.name }))
    }
}

const switchGroup = (groupId: number) => {
    if (selectedGroupId.value === groupId) return
    selectedGroupId.value = groupId
    // 重置分页状态，避免空数据导致 totalPage=0 阻塞请求
    data.value.totalPage = 1
    data.value.currentPage = 0
    getRankData(1)
}

const getRankData = async (page: number) => {
    if (!userStore.isLogin) {
        requiresLoginMessage.value = true
        loadingInfo.value = false
        loadingRank.value = false
        return
    }

    if (!id) {
        router.back();
        return;
    }

    if (page > data.value.totalPage || page < 1) {
        return;
    }

    loadingRank.value = true;
    if (info.value.contestName === '') {
        loadingInfo.value = true;
    }

    const limit = 10
    const offset = (page - 1) * limit

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
        const list: rankDataItem[] = [];
        for (const item of response.data.data) {
            list.push({
                userId: item.userId,
                avatar: item.avatar || '/images/defaultAvatar.png',
                name: item.name,
                rank: item.rank,
                score: item.acCount,
                change: 0
            })
        }
        rankData.value.data = list;

        // 从 API 响应更新分页状态
        const total = response.data.total || response.data.data.length;
        data.value.total = total;
        data.value.totalPage = Math.ceil(total / limit);
        data.value.currentPage = page;

        info.value = response.data.contest;
        loadingInfo.value = false;
    }

    loadingRank.value = false;
}

interface rankDataItem {
    userId: number,
    avatar: string,
    name: string,
    rank: number,
    score: number,
    change: number
}

const rankData = ref<{
    data: rankDataItem[],
    scoreUnit: string,
    userRank: number,
    userName: string,
    userScore: number,
    totalPage: number
}>({
    "data": [],
    "scoreUnit": "AC",
    "userRank": 4,
    "userName": '赵六',
    "userScore": 9,
    "totalPage": 1
})

const toContest = (url: string) => {
    if (!loadingRank.value) {
        window.open(url);
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
    getRankData(1);
})
</script>

<style scoped>
@import '@/assets/css/navagation.css';

.contestInfo {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: calc(100% - 40px);
    padding: 20px;

    >.platform {
        color: var(--text-light-color);
        font-size: var(--text-sm);
    }

    >.title {
        color: var(--text-default-color);
        font-size: var(--text-2xl);
        font-weight: bold;
    }

    >.time {
        color: var(--text-light-color);
        font-size: var(--text-sm);
    }

    >.actions {
        position: relative;
        display: flex;
        flex-direction: row;
        gap: 5px;
    }
}

.group-filter {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    padding: 10px 20px;

    .filter-label {
        font-size: var(--text-sm);
        color: var(--text-light-color);
    }

    .filter-tab {
        padding: 4px 12px;
        border-radius: 6px;
        font-size: var(--text-sm);
        color: var(--text-light-color);
        background-color: var(--section-background-color);
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid transparent;
        -webkit-user-select: none;
        user-select: none;

        &:hover {
            color: var(--text-default-color);
            border-color: var(--divider-color);
        }

        &.active {
            background-color: var(--neon-cyan);
            color: var(--background-color-1);
            font-weight: 500;
        }
    }
}

.btn {
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

    &.dis{
        cursor: not-allowed;
    }
}

.empty-placeholder {
    text-align: center;
    padding: 40px 20px;
    color: var(--text-light-color);
    font-size: var(--text-base);
}
</style>
