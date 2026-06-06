<template>
  <BaseLayout>
    <div class="editProfile">
      <div
        class="avatar"
        :class="{ dragging: isDraggingAvatar }"
        title="点击或拖入图片更换头像"
        @click="avatarInput?.click()"
        @dragenter.prevent="isDraggingAvatar = true"
        @dragover.prevent="isDraggingAvatar = true"
        @dragleave.prevent="isDraggingAvatar = false"
        @drop.prevent="handleAvatarDrop"
      >
        <img
          :src="avatarPreview"
          alt="头像预览"
          @error="avatarLoadFailed = true"
        />
        <div class="avatar-overlay">拖入图片<br />或点击上传</div>
        <input
          ref="avatarInput"
          class="avatar-file-input"
          type="file"
          accept="image/*"
          @change="handleAvatarFileChange"
        />
      </div>
      <div class="info">
        <div class="title">修改个人资料</div>
        <div class="item avatar-url">
          <label>头像链接</label>
          <div class="avatar-url-control">
            <input
              type="url"
              placeholder="请输入头像图片链接"
              v-model.trim="formData.avatar"
            />
            <button
              type="button"
              class="clear-avatar"
              @click="formData.avatar = ''"
            >
              默认头像
            </button>
          </div>
          <div class="hint">支持 http(s) 图片链接，留空则使用默认头像。</div>
        </div>
        <div class="item">
          <label>昵称</label>
          <input type="text" placeholder="请输入昵称" v-model="formData.name" />
        </div>
        <div class="item">
          <label>邮箱</label>
          <input type="text" placeholder="Email" v-model="formData.email" />
        </div>
        <div class="item email-enabled">
          <label>邮件通知</label>
          <div
            class="switch"
            :class="{ active: emailEnabled }"
            @click="handleEmailToggle"
          >
            <div class="slider"></div>
          </div>
          <span class="email-hint">{{
            emailEnabled ? "已开启" : "已关闭"
          }}</span>
        </div>
        <div class="title password-title">修改密码</div>
        <div class="item">
          <label>旧密码</label>
          <input
            type="password"
            placeholder="请输入旧密码"
            v-model="passwordForm.oldPassword"
          />
        </div>
        <div class="item">
          <label>新密码</label>
          <input
            type="password"
            placeholder="请输入新密码"
            v-model="passwordForm.newPassword"
          />
        </div>
        <div class="item">
          <label>确认密码</label>
          <input
            type="password"
            placeholder="请再次输入新密码"
            v-model="passwordForm.newPasswordConfirm"
          />
        </div>
        <div class="actions">
          <button @click="handleConfirm" :disabled="wait">确认</button>
          <button @click="handlePasswordConfirm" :disabled="wait">
            改密码
          </button>
          <button @click="handleCancel">返回</button>
        </div>
      </div>
    </div>
    <div class="addOj">
      <div class="info">
        <div class="title">绑定OJ账号</div>
        <div class="desc">
          目前仅支持以下平台绑定：AtCoder, 牛客, QOJ。<br />
          <!-- 目前仅支持以下平台绑定：AtCoder, LuoGu, NowCoder, CodeForces, LeetCode。<br> -->
          如何填写用户名？<br />
          AtCoder:填写用户名，例如您的主页是https://atcoder.jp/users/AoralsFout，那么你就填AoralsFout<br />
          LuoGu: 填写您的用户编号<br />
          牛客:
          填写您的用户id，例如您的主页是https://ac.nowcoder.com/acm/contest/profile/978880410，那么你就填978880410<br />
          CodeForces:
          填写您的用户名，例如您的主页是https://CodeForces.com/profile/AoralsFout，那么你就填AoralsFout<br />
          QOJ:
          填写您的用户名，例如您的主页是https://qoj.ac/user/profile/sanenchen，那么你就填sanenchen<br />
          <!-- LeetCode: 填写您的用户id，例如您的主页是https://leetcode.cn/u/musing-i2hodesdmx/，那么你就填musing-i2hodesdmx -->
        </div>
        <div class="item">
          <label>选择平台</label>
          <div class="select">
            <div class="selected">{{ ojData.platform }}</div>
            <div class="options">
              <div class="option" @click="ojData.platform = 'AtCoder'">
                AtCoder
              </div>
              <div class="option" @click="ojData.platform = 'LuoGu'">洛谷</div>
              <div class="option" @click="ojData.platform = 'NowCoder'">
                牛客
              </div>
              <div class="option" @click="ojData.platform = 'CodeForces'">
                CodeForces
              </div>
              <div class="option" @click="ojData.platform = 'QOJ'">QOJ</div>
              <!-- <div class="option" @click="ojData.platform = 'LeetCode'">力扣</div> -->
            </div>
          </div>
        </div>
        <div class="item">
          <label>{{
            ojData.platform === "NowCoder" ? "牛客学号" : ojData.platform === "LuoGu" ? "用户编号" : "用户名"
          }}</label>
          <input
            type="text"
            :placeholder="
              ojData.platform === 'NowCoder' ? '请输入牛客学号' : ojData.platform === 'LuoGu' ? '请输入用户编号' : '请输入用户名'
            "
            v-model="ojData.username"
          />
        </div>
        <div class="actions">
          <button @click="handleOjConfirm" :disabled="wait">确认</button>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>
<script setup lang="ts">
import BaseLayout from "@/components/BaseLayout.vue";
import { computed, ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import API from "@/utils/api";
import type { UserProfileUpdateRequest as FormData } from "@/utils/api";
import Toast from "@/utils/toast";
import type { platform } from "@/utils/link";
import { useUserStore } from "@/stores/user";
import type { User } from "@/utils/type";

const router = useRouter();
const route = useRoute();

const userStore = useUserStore();

// 该页面配置了路由守卫，user一定不为null
const user = computed(() => userStore.info as User);
const oj = route.query.oj;

const formData = ref<FormData>({
  userId: user.value.userId,
  name: user.value.name,
  email: user.value.email,
  avatar: user.value.avatar,
});

const passwordForm = ref({
  oldPassword: "",
  newPassword: "",
  newPasswordConfirm: "",
});

const defaultAvatar = "/images/defaultAvatar.png";
const avatarLoadFailed = ref(false);
const isDraggingAvatar = ref(false);
const avatarInput = ref<HTMLInputElement | null>(null);
const avatarPreview = computed(() => {
  if (!formData.value.avatar || avatarLoadFailed.value) {
    return defaultAvatar;
  }
  return formData.value.avatar;
});

watch(
  () => formData.value.avatar,
  () => {
    avatarLoadFailed.value = false;
  },
);

const setAvatarFromFile = async (file?: File) => {
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    Toast.error("请拖入图片文件");
    return;
  }

  if (file.size > 8 * 1024 * 1024) {
    Toast.error("图片不能超过 8MB");
    return;
  }

  try {
    const imageUrl = URL.createObjectURL(file);
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = imageUrl;
    });

    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("无法处理头像图片");

    const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
    const sourceX = (image.naturalWidth - sourceSize) / 2;
    const sourceY = (image.naturalHeight - sourceSize) / 2;

    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      size,
      size,
    );
    formData.value.avatar = canvas.toDataURL("image/webp", 0.86);
    URL.revokeObjectURL(imageUrl);
    Toast.success("头像已载入，点击确认后保存");
  } catch (error) {
    console.error(error);
    Toast.error("头像处理失败，请换一张图片试试");
  }
};

const handleAvatarDrop = async (event: DragEvent) => {
  isDraggingAvatar.value = false;
  await setAvatarFromFile(event.dataTransfer?.files?.[0]);
};

const handleAvatarFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  await setAvatarFromFile(input.files?.[0]);
  input.value = "";
};

const emailEnabled = ref<boolean>(user.value.emailEnabled ?? false);

const handleEmailToggle = async () => {
  const newValue = !emailEnabled.value;
  const response = await API.user.profile.setEmailEnabled(
    user.value.userId,
    newValue,
  );
  Toast.stdResponse(response);
  if (response.success) {
    emailEnabled.value = newValue;
  }
};

const ojData = ref({
  userId: user.value.userId,
  platform: "" as platform,
  username: "",
});

switch (oj) {
  case "AtCoder":
    ojData.value.platform = "AtCoder";
    break;
  case "luogu":
    ojData.value.platform = "LuoGu";
    break;
  case "NowCoder":
    ojData.value.platform = "NowCoder";
    break;
  case "CodeForces":
    ojData.value.platform = "CodeForces";
    break;
  case "QOJ":
    ojData.value.platform = "QOJ";
    break;
  // case "LeetCode":
  //     ojData.value.platform = "LeetCode"
  //     break;
  default:
    ojData.value.platform = "AtCoder";
}

// 如果wait为true，则禁用按钮
const wait = ref<boolean>(false);

const handleCancel = () => {
  router.push("/profile");
};

const handleConfirm = async () => {
  wait.value = true;

  const response = await API.user.profile.update(formData.value);
  Toast.stdResponse(response);

  wait.value = false;
};

const handlePasswordConfirm = async () => {
  wait.value = true;

  const response = await API.user.profile.changePassword({
    userId: user.value.userId,
    oldPassword: passwordForm.value.oldPassword,
    newPassword: passwordForm.value.newPassword,
    newPasswordConfirm: passwordForm.value.newPasswordConfirm,
  });
  Toast.stdResponse(response);
  if (response.success) {
    passwordForm.value = {
      oldPassword: "",
      newPassword: "",
      newPasswordConfirm: "",
    };
  }

  wait.value = false;
};

const handleOjConfirm = async () => {
  wait.value = true;

  const response = await API.core.spider.set(ojData.value);
  Toast.stdResponse(response);

  wait.value = false;
};
</script>
<style scoped>
.addOj,
.editProfile {
  margin: 0 auto;
  display: flex;
  flex-direction: row;
  gap: 20px;

  label {
    font-size: var(--text-base);
  }

  input {
    font-size: var(--text-base);
    outline: none;
    color: var(--text-default-color);
    border: 1px solid var(--divider-color);
    box-shadow: 0 0 0px 100px var(--background-color-1) inset;
    padding: 10px 20px;
    background-color: var(--background-color-1);
    border-radius: 6px;
  }

  input:focus {
    border: 1px solid var(--input-active-color);
  }

  button {
    width: 100px;
    height: 40px;
    color: var(--text-secondary-color);
    border: 1px solid var(--divider-color);
    background-color: var(--background-color-2);
    border-radius: var(--control-radius);
    cursor: pointer;
    font-family: inherit;
    font-size: var(--text-sm);
    font-weight: 800;
    line-height: 1;
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, opacity 0.2s ease;
  }

  button:hover {
    color: white;
    border-color: var(--neon-cyan);
    background-color: var(--neon-cyan);
  }

  > .avatar {
    width: 200px;
    height: 200px;
    border-radius: 50%;
    overflow: hidden;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    border: 2px dashed transparent;
    transition:
      border-color 0.2s,
      transform 0.2s;

    &.dragging {
      border-color: var(--input-active-color);
      transform: scale(1.03);
    }

    &:hover {
      .avatar-overlay {
        opacity: 1;
      }
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      -webkit-user-select: none;
      user-select: none;
      -webkit-user-drag: none;
    }

    .avatar-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: #fff;
      font-size: var(--text-sm);
      line-height: 1.6;
      background: rgba(0, 0, 0, 0.48);
      opacity: 0;
      transition: opacity 0.2s;
      pointer-events: none;
    }

    &.dragging .avatar-overlay {
      opacity: 1;
    }

    .avatar-file-input {
      display: none;
    }
  }

  > .info {
    display: flex;
    flex-direction: column;
    gap: 10px;

    > .title {
      font-size: var(--text-lg);
      font-weight: bold;
    }

    > .password-title {
      margin-top: 10px;
    }

    > .item {
      font-size: var(--text-base);
      display: flex;
      align-items: center;
      gap: 10px;

      > .select {
        -webkit-user-select: none;
        user-select: none;
        position: relative;

        > .selected {
          background-color: var(--background-color-1);
          border-radius: 6px;
          border: 1px solid var(--divider-color);
          padding: 10px 20px;
          cursor: pointer;
        }

        > .options {
          background-color: var(--background-color-1);
          border-radius: 6px;
          border: 1px solid var(--divider-color);
          position: absolute;
          display: none;
          z-index: 10;

          &:hover {
            display: block;
          }

          > .option {
            padding: 10px 20px;
            cursor: pointer;

            &:hover {
              background-color: var(--background-color-2);
            }
          }
        }

        > .selected:hover + .options {
          display: block;
        }
      }
    }

    > .avatar-url {
      align-items: flex-start;
      flex-direction: column;

      > .avatar-url-control {
        display: flex;
        gap: 10px;
        align-items: center;
        width: 100%;

        > input {
          width: min(420px, 60vw);
        }

        > .clear-avatar {
          width: 100px;
          flex-shrink: 0;
        }
      }

      > .hint {
        color: var(--text-light-color);
        font-size: var(--text-sm);
      }
    }

    > .desc {
      font-size: var(--text-sm);
      color: var(--text-light-color);
    }

    > .actions {
      display: flex;
      flex-direction: row-reverse;
      gap: 10px;
    }

    > .email-enabled {
      display: flex;
      align-items: center;
      gap: 12px;

      > .switch {
        position: relative;
        width: 44px;
        height: 24px;
        background-color: var(--divider-color);
        border-radius: 12px;
        cursor: pointer;
        transition: background-color 0.3s;

        &.active {
          background-color: var(--success-color, #4caf50);
        }

        > .slider {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background-color: white;
          border-radius: 50%;
          transition: transform 0.3s;
        }

        &.active > .slider {
          transform: translateX(20px);
        }
      }

      > .email-hint {
        font-size: var(--text-sm);
        color: var(--text-light-color);
      }
    }
  }
}

.editProfile {
  margin-top: 32px;
}
</style>
