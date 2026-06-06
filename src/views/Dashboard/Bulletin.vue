<template>
  <div class="dashboardContent">
    <div class="section">
      <div class="header">
        <div class="header-title">
          <span class="title-icon">
            <font-awesome-icon icon="fa-solid fa-bullhorn" />
          </span>
          <span class="title-text">公告管理</span>
        </div>
        <div class="header-tabs">
          <span class="tab" @click="openCreateModal">创建公告</span>
          <span class="tab" @click="refresh">刷新</span>
        </div>
      </div>
      <div class="content">
        <div style="position: relative;">
          <LoadingOverlay :show="loading" />
          <template v-if="bulletins.length > 0">
          <table>
            <thead>
              <tr>
                <th style="width: 60px;">ID</th>
                <th style="width: 200px;">标题</th>
                <th style="width: 100px;">作者</th>
                <th style="width: 80px;">置顶</th>
                <th style="width: 160px;">创建时间</th>
                <th style="width: 160px;">更新时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in bulletins" :key="item.id">
                <td>{{ item.id }}</td>
                <td>{{ item.title }}</td>
                <td>{{ item.authorName }}</td>
                <td>
                  <span :class="item.isPinned ? 'pinned-yes' : 'pinned-no'">
                    {{ item.isPinned ? '是' : '否' }}
                  </span>
                </td>
                <td>{{ formatTime(item.createdAt) }}</td>
                <td>{{ formatTime(item.updatedAt) }}</td>
                <td>
                  <div class="actions">
                    <button class="btn btn-primary" @click="openEditModal(item)">编辑</button>
                    <button class="btn btn-danger" @click="handleDelete(item.id, item.title)">删除</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          </template>
          <div v-else-if="!loading" class="empty-placeholder">暂无公告</div>
        </div>
        <div class="pageNavigation" v-if="bulletins.length > 0">
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
              >{{ value }}</button>
            </div>
            <div class="pageButtons" v-if="currentPage < totalPage">
              <button @click="fetchBulletins(currentPage + 1)">下一页</button>
            </div>
          </div>
          <div class="group">
            <div class="pageInput">
              <button @click="fetchBulletins(jumpPage)">跳转</button>
              <input type="number" min="1" :max="totalPage" v-model="jumpPage">
            </div>
            <div class="pageSum">共 {{ totalPage }} 页</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑弹窗 -->
    <div class="modal-overlay" v-if="showModal" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <span>{{ editingId ? '编辑公告' : '创建公告' }}</span>
          <button class="modal-close" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>标题</label>
            <input type="text" v-model="form.title" placeholder="请输入公告标题">
          </div>
          <div class="form-group">
            <label>内容（支持HTML）</label>
            <div class="editor-toolbar">
              <button type="button" class="toolbar-btn" @click="insertTag('b')" title="加粗"><b>B</b></button>
              <button type="button" class="toolbar-btn" @click="insertTag('i')" title="斜体"><i>I</i></button>
              <button type="button" class="toolbar-btn" @click="insertTag('u')" title="下划线"><u>U</u></button>
              <button type="button" class="toolbar-btn" @click="insertTag('s')" title="删除线"><s>S</s></button>
              <button type="button" class="toolbar-btn" @click="insertLink" title="链接">🔗</button>
              <button type="button" class="toolbar-btn" @click="insertTag('h3')" title="标题">H</button>
            </div>
            <textarea ref="textareaRef" v-model="form.content" placeholder="请输入公告内容" rows="10"></textarea>
          </div>
          <div class="form-group-checkbox">
            <label>
              <input type="checkbox" v-model="form.isPinned">
              置顶该公告
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="handleSubmit" :disabled="submitting">
            {{ submitting ? '提交中...' : '确认' }}
          </button>
          <button class="btn" @click="closeModal">取消</button>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div class="modal-overlay" v-if="showDeleteConfirm" @click="showDeleteConfirm = false">
      <div class="modal" @click.stop style="max-width: 360px;">
        <div class="modal-header">
          <span>确认删除</span>
          <button class="modal-close" @click="showDeleteConfirm = false">&times;</button>
        </div>
        <div class="modal-body">
          <p>确定要删除公告「{{ deletingTitle }}」吗？此操作不可撤销。</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-danger" @click="confirmDelete" :disabled="deleting">
            {{ deleting ? '删除中...' : '确认删除' }}
          </button>
          <button class="btn" @click="showDeleteConfirm = false">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import API, { type BulletinInfo } from '@/utils/api'
import Toast from '@/utils/toast'
import LoadingOverlay from '@/components/LoadingOverlay.vue'

const loading = ref(true)
const bulletins = ref<BulletinInfo[]>([])
const currentPage = ref(1)
const totalPage = ref(1)
const jumpPage = ref(1)

const pageSize = 10

const pages = computed(() => {
  if (totalPage.value <= 3) return Array.from({ length: totalPage.value }, (_, i) => i + 1)
  if (currentPage.value <= 1) return [1, 2, 3]
  if (currentPage.value >= totalPage.value - 1) return [totalPage.value - 2, totalPage.value - 1, totalPage.value]
  return [currentPage.value - 1, currentPage.value, currentPage.value + 1]
})

const fetchBulletins = async (page: number) => {
  loading.value = true
  const response = await API.core.bulletin.list(page, pageSize)
  Toast.stdResponse(response, false)
  if (response.success) {
    bulletins.value = response.data.data
    totalPage.value = Math.ceil(response.data.total / pageSize)
    currentPage.value = page
    jumpPage.value = page
  }
  loading.value = false
}

// Modal state
const showModal = ref(false)
const editingId = ref<number | null>(null)
const submitting = ref(false)
const form = ref({
  title: '',
  content: '',
  isPinned: false
})

const openCreateModal = () => {
  editingId.value = null
  form.value = { title: '', content: '', isPinned: false }
  showModal.value = true
}

const openEditModal = (item: BulletinInfo) => {
  editingId.value = item.id
  form.value = {
    title: item.title,
    content: item.content,
    isPinned: item.isPinned
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingId.value = null
}

const textareaRef = ref<HTMLTextAreaElement | null>(null)

const insertTag = (tag: string) => {
  const ta = textareaRef.value
  if (!ta) return
  const start = ta.selectionStart
  const end = ta.selectionEnd
  const text = form.value.content
  const selected = text.slice(start, end)
  const replacement = `<${tag}>${selected || ''}</${tag}>`
  form.value.content = text.slice(0, start) + replacement + text.slice(end)
  nextTick(() => {
    ta.focus()
    ta.setSelectionRange(start + 2 + tag.length, start + replacement.length - 3 - tag.length)
  })
}

const insertLink = () => {
  const ta = textareaRef.value
  if (!ta) return
  const start = ta.selectionStart
  const end = ta.selectionEnd
  const text = form.value.content
  const selected = text.slice(start, end) || '链接文字'
  const url = prompt('请输入链接地址', 'https://')
  if (!url) return
  const replacement = `<a href="${url}" target="_blank">${selected}</a>`
  form.value.content = text.slice(0, start) + replacement + text.slice(end)
  nextTick(() => {
    ta.focus()
  })
}

const handleSubmit = async () => {
  if (!form.value.title.trim()) {
    Toast.error('标题不能为空')
    return
  }
  if (!form.value.content.trim()) {
    Toast.error('内容不能为空')
    return
  }

  submitting.value = true
  let response
  if (editingId.value) {
    response = await API.core.bulletin.update({
      id: editingId.value,
      title: form.value.title,
      content: form.value.content,
      isPinned: form.value.isPinned
    })
  } else {
    response = await API.core.bulletin.create({
      title: form.value.title,
      content: form.value.content,
      isPinned: form.value.isPinned
    })
  }
  Toast.stdResponse(response)
  submitting.value = false

  if (response.success) {
    closeModal()
    refresh()
  }
}

// Delete
const showDeleteConfirm = ref(false)
const deletingId = ref(0)
const deletingTitle = ref('')
const deleting = ref(false)

const handleDelete = (id: number, title: string) => {
  deletingId.value = id
  deletingTitle.value = title
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  deleting.value = true
  const response = await API.core.bulletin.delete(deletingId.value)
  Toast.stdResponse(response)
  deleting.value = false
  showDeleteConfirm.value = false
  if (response.success) {
    refresh()
  }
}

const formatTime = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const refresh = () => {
  fetchBulletins(currentPage.value)
}

onMounted(() => {
  fetchBulletins(1)
})
</script>

<style scoped>
@import '@/assets/css/navagation.css';

.dashboardContent {
  height: 100%;
  border-top: 1px solid var(--divider-color);
  color: var(--text-default-color);

  .section {
    border-radius: 6px;

    >.header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 10px;
      border-bottom: 1px solid var(--divider-color);
    }

    >.content {
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
        transition: background-color 0.2s ease, color 0.2s ease;
        -webkit-user-select: none;
        user-select: none;

        &:hover {
          color: var(--text-default-color);
          background-color: var(--divider-color);
        }
      }
    }

    .title-icon {
      font-size: var(--text-lg);
    }

    .title-text {
      color: var(--text-default-color);
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
    color: white;
    border-color: var(--neon-cyan);
    background-color: var(--neon-cyan);
  }

  .btn-danger:hover {
    background-color: #f00;
    color: #fff;
  }

  .pinned-yes {
    color: var(--neon-cyan);
    font-weight: 500;
  }

  .pinned-no {
    color: var(--text-light-color);
  }
}

/* Modal styles */
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
  width: 500px;
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

    p {
      font-size: var(--text-base);
      margin: 0;
    }
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 16px;
    border-top: 1px solid var(--divider-color);
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: var(--text-sm);
    color: var(--text-light-color);
  }

  input[type="text"],
  textarea {
    font-size: var(--text-base);
    outline: none;
    color: var(--text-default-color);
    border: 1px solid var(--divider-color);
    box-shadow: 0 0 0px 100px var(--background-color-1) inset;
    padding: 10px 12px;
    background-color: var(--background-color-1);
    border-radius: 6px;
    resize: vertical;
  }

  input[type="text"]:focus,
  textarea:focus {
    border: 1px solid var(--input-active-color);
  }
}

.editor-toolbar {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;

  .toolbar-btn {
    min-width: 28px;
    height: 28px;
    padding: 0 6px;
    font-size: var(--text-sm);
    border: 1px solid var(--divider-color);
    border-radius: 4px;
    background-color: var(--background-color-1);
    color: var(--text-default-color);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;

    &:hover {
      border-color: var(--neon-cyan);
      color: var(--neon-cyan);
    }
  }
}

.form-group-checkbox {
  label {
    font-size: var(--text-sm);
    color: var(--text-default-color);
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }

  input[type="checkbox"] {
    cursor: pointer;
    width: 16px;
    height: 16px;
  }
}

.modal-footer .btn {
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

.modal-footer .btn:hover {
  color: white;
  border-color: var(--neon-cyan);
  background-color: var(--neon-cyan);
}

.modal-footer .btn-primary {
  background-color: var(--neon-cyan);
  color: var(--background-color-1);
  border-color: var(--neon-cyan);
}

.modal-footer .btn-primary:hover {
  opacity: 0.9;
}

.modal-footer .btn-danger {
  background-color: #f00;
  color: #fff;
  border-color: #f00;
}

.modal-footer .btn-danger:hover {
  opacity: 0.9;
}
.empty-placeholder {
    text-align: center;
    padding: 40px 20px;
    color: var(--text-light-color);
    font-size: var(--text-base);
}
</style>
