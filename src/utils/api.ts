/**
 * 集成API请求，通过类似API.user.auth.login(request)的方法进行API请求
 * 统一响应结构(stdResponse)，简化错误处理
 */

import axios from "axios";
import JWT from "../utils/jwt";
import Validate from "../utils/validate";
import { useUserStore } from "@/stores/user";
import { hashPassword } from "@/utils/hash";
import Link from "./link";
import type { User as UserProfileGetByIdResponse, platform } from "./type";

export interface stdResponse<T = any> {
  message: string;
  success: boolean;
  data: T;
  [property: string]: any;
}

export interface UserAuthRegisterRequest {
  email: string;
  groupId: number;
  inviteCode: string;
  name: string;
  password: string;
  passwordConfirm: string;
  username: string;
  [property: string]: any;
}

export interface UserAuthRegisterResponse {
  message: string;
  success: boolean;
  [property: string]: any;
}

export interface UserAuthLoginRequest {
  password: string;
  username: string;
  [property: string]: any;
}

export interface UserAuthLoginResponse {
  jwtToken: string;
  message: string;
  success: boolean;
  [property: string]: any;
}

export interface UserProfileUpdateRequest {
  avatar: string;
  email: string;
  name: string;
  userId: number;
  password?: string;
  [property: string]: any;
}

export interface UserProfileUpdateResponse {
  code: string;
  message: string;
  [property: string]: any;
}

export interface UserProfileChangePasswordRequest {
  userId: number;
  oldPassword?: string;
  newPassword: string;
  newPasswordConfirm?: string;
}

export interface UserProfileChangePasswordResponse {
  success: boolean;
  message: string;
}

export interface UserProfileDeleteResponse {
  success: boolean;
  message: string;
}

export interface UserProfileListResponse {
  list: List[];
  total: number;
  totalPage: number;
  currentPage: number;
  [property: string]: any;
}

export interface List {
  avatar: string;
  groupId: number;
  lastSubmit: string;
  name: string;
  roleId?: number;
  userId: number;
  username: string;
  [property: string]: any;
}

export interface CoreSubmitLogGetByIdResponse {
  data: CoreSubmitLogGetByIdData[];
  [property: string]: any;
}

export interface CoreSubmitLogGetByIdData {
  contest: string;
  id: number;
  lang: string;
  platform: platform;
  problem: string;
  status: string;
  submitId: string;
  time: string;
  userId: number;
  [property: string]: any;
}

export interface CodeSpiderSetRequest {
  platform: platform;
  userId: number;
  username: string;
  [property: string]: any;
}

export interface CodeSpiderSetResponse {
  code: number;
  message: string;
  [property: string]: any;
}

export interface CodeSpiderUpdateResponse {
  code: string;
  message: string;
  [property: string]: any;
}

export interface CoreStatisticHeatmapRequest {
  endDate: string;
  isAc: boolean;
  startDate: string;
  userId?: number;
  [property: string]: any;
}

export interface CoreStatisticHeatmapResponse {
  code: string;
  data: Datum[];
  [property: string]: any;
}

export interface Datum {
  count: number;
  date: string;
  [property: string]: any;
}

export interface CoreStatisticPeriodResponse {
  code: string;
  data: CoreStatisticPeriodData;
  [property: string]: any;
}

export interface CoreStatisticPlatformPeriodResponse {
  code: string;
  data: CoreStatisticPlatformPeriodItem[];
  [property: string]: any;
}

export interface CoreStatisticPlatformPeriodItem {
  platform: platform;
  ac: CoreStatisticPeriodItem;
  submit: CoreStatisticPeriodItem;
  [property: string]: any;
}

export interface CoreStatisticPeriodData {
  ac: CoreStatisticPeriodItem;
  submit: CoreStatisticPeriodItem;
  [property: string]: any;
}

export interface CoreStatisticPeriodItem {
  lastMonth: number;
  lastWeek: number;
  lastYear: number;
  thisMonth: number;
  thisWeek: number;
  thisYear: number;
  today: number;
  total: number;
  [property: string]: any;
}

export interface UserProfileMoveGroupRequest {
  userId: number;
  groupId: number;
}

export interface UserProfileMoveGroupResponse {
  code: string;
  message: string;
}

export interface UserGroupListResponse {
  list: Group[];
  total: number;
  totalPage: number;
  currentPage: number;
  [property: string]: any;
}

export interface Group {
  describe: string;
  id: number;
  name: string;
  users: UserGroupUser[];
  [property: string]: any;
}

export interface UserGroupCreateRequest {
  name: string;
  describe: string;
}

export interface UserGroupCreateResponse {
  id: number;
  message: string;
}

export interface UserGroupDeleteResponse {
  success: boolean;
}

export interface UserGroupUpdateRequest {
  id: number;
  name: string;
  describe: string;
}

export interface UserGroupUpdateResponse {
  success: boolean;
}

export interface UserGroupGetResponse {
  describe: string;
  avatar?: string;
  id: number;
  name: string;
  ownerId?: number;
  users: UserGroupUser[];
  [property: string]: any;
}

export interface UserGroupUser {
  avatar: string;
  groupId: number;
  lastSubmit: string;
  name: string;
  userId: number;
  username: string;
  [property: string]: any;
}

export interface UserTeamDetailResponse {
  success: boolean;
  describe: string;
  avatar: string;
  id: number;
  name: string;
  ownerId: number;
  users: UserGroupUser[];
}

export interface UserTeamCreateRequest {
  name: string;
  avatar: string;
  describe: string;
}

export interface UserTeamCreateResponse extends UserTeamDetailResponse {
  message: string;
}

export interface UserTeamUpdateRequest {
  id: number;
  name: string;
  avatar: string;
  describe: string;
}

export interface UserTeamInvite {
  id: number;
  groupId: number;
  groupName: string;
  groupAvatar: string;
  inviterId: number;
  inviterName: string;
  status: string;
  createdAt: number;
}

export interface UserTeamInviteListResponse {
  success: boolean;
  list: UserTeamInvite[];
}

export interface UserSystemRegisterInviteCodeRequest {
  inviteCode: string;
}

export interface UserSystemRegisterInviteCodeResponse {
  success: boolean;
  message: string;
  inviteCode: string;
}

export interface UserRoleListResponse {
  roles: UserRole[];
  [property: string]: any;
}

export interface UserRole {
  roleId: number;
  name: string;
  [property: string]: any;
}

export interface UserRoleSetRequest {
  userId: number;
  roleId: number;
}

export interface UserRoleSetResponse {
  code: number;
  message: string;
  [property: string]: any;
}

export interface UserProfileGetByNameResponse {
  list: UserProfileGetByNameList[];
  [property: string]: any;
}

export interface UserProfileGetByNameList {
  name: string;
  userId: number;
  [property: string]: any;
}

export interface AgentSummaryRecentResponse {
  code: number;
  msg: string;
  resp: string;
  [property: string]: any;
}

export interface AgentSummaryRecentData {
  msg: string[];
  updateTime: string;
}

export interface CoreContestListRequest {
  limit: number;
  offset: number;
  /**
   * 用户id
   * -1 表示所有比赛
   * 其他用户id表示该用户参加过的比赛
   */
  userId: number;
  [property: string]: any;
}

export interface CoreContestListResponse {
  code: string;
  message: string;
  data: CoreContestListData[];
  total: number;
  [property: string]: any;
}

export interface CoreContestListData {
  id: number;
  platform: platform;
  userId: number;
  contestId: string;
  contestName: string;
  contestUrl: string;
  rank: number;
  totalCount: number;
  acCount: number;
  time: string;
}

export interface CoreContestRankingRequest {
  contestId: string;
  limit: number;
  offset: number;
  groupId?: number;
}

export interface CoreContestRankingResponse {
  code: string;
  message: string;
  contest: {
    id: number;
    platform: platform;
    contestId: string;
    contestName: string;
    avatar: string;
    contestUrl: string;
    totalCount: number;
    time: string;
  };
  data: CoreContestRankingData[];
  total: number;
}

export interface CoreContestRankingData {
  rank: number;
  userId: number;
  name: string;
  avatar: string;
  score: number;
  acCount: number;
  totalCount: number;
}

// Bulletin types
export interface BulletinInfo {
  id: number;
  title: string;
  content: string;
  authorId: number;
  authorName: string;
  isPinned: boolean;
  createdAt: number; // Unix seconds
  updatedAt: number; // Unix seconds
}

export interface BulletinListResponse {
  data: BulletinInfo[];
  total: number;
  page: number;
  pageSize: number;
}

// 通用 API 请求辅助函数
async function apiCall<T>(
  request: () => Promise<any>,
  onSuccess: (response: any) => { data?: T; message?: string },
  errorMsg: string,
  defaultData: T,
): Promise<stdResponse<T>> {
  const stdRes: stdResponse<T> = {
    message: "",
    success: false,
    data: defaultData,
  };
  try {
    const response = await request();
    const result = onSuccess(response);
    stdRes.success = true;
    stdRes.message = result.message || "";
    if (result.data !== undefined) {
      stdRes.data = result.data;
    }
  } catch (error: any) {
    console.error(error);
    stdRes.message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      errorMsg;
  }
  return stdRes;
}

export default class API {
  static user = {
    auth: {
      login: async (request: UserAuthLoginRequest): Promise<stdResponse> => {
        const stdRes: stdResponse = {
          message: "",
          success: false,
          data: null,
        };
        if (JWT.isValid()) {
          stdRes.message = "用户已登录";
          return stdRes;
        }
        try {
          const response = await axios.post<UserAuthLoginResponse>(
            "/api/user/auth/login",
            request,
          );
          if (response.data.success) {
            stdRes.success = true;
            stdRes.message = response.data.message || "登录成功";
            JWT.setNewToken(response.data.jwtToken);
            const userStore = useUserStore();
            userStore.syncStatus();
          } else {
            stdRes.message = response.data.message || "登录失败";
          }
        } catch (error: any) {
          console.error(error);
          stdRes.message = "登录失败";
        }
        return stdRes;
      },
      register: async (
        request: UserAuthRegisterRequest,
      ): Promise<stdResponse> => {
        const stdRes: stdResponse = {
          message: "",
          success: false,
          data: null,
        };

        if (JWT.isValid()) {
          stdRes.message = "用户已登录";
          return stdRes;
        }

        if (!Validate.checkEmail(request.email)) {
          stdRes.message = "请输入有效邮箱";
          return stdRes;
        }

        if (
          request.email === "" ||
          request.username === "" ||
          request.password === "" ||
          request.name === "" ||
          request.passwordConfirm === "" ||
          request.inviteCode.trim() === ""
        ) {
          stdRes.message = "请填写所有必填项";
          return stdRes;
        }

        if (request.password !== request.passwordConfirm) {
          stdRes.message = "密码不一致";
          return stdRes;
        }

        const payload = {
          username: request.username,
          password: hashPassword(request.password),
          name: request.name,
          email: request.email,
          groupId: Number(request.groupId),
          inviteCode: request.inviteCode.trim(),
        };

        try {
          const response = await axios.post<UserAuthRegisterResponse>(
            "/api/user/auth/register",
            payload,
          );
          if (response.data.success) {
            stdRes.success = true;
            stdRes.message = response.data.message || "注册成功";
          } else {
            stdRes.message = response.data.message || "注册失败";
          }
        } catch (error: any) {
          console.error(error);
          stdRes.message = "注册失败";
        }
        return stdRes;
      },
    },
    profile: {
      getById: async (
        id: number,
      ): Promise<stdResponse<UserProfileGetByIdResponse>> => {
        const result = await apiCall<UserProfileGetByIdResponse>(
          () =>
            axios.get<UserProfileGetByIdResponse>(
              "/api/user/profile/get-by-id",
              {
                params: { userId: id },
              },
            ),
          (response) => {
            if (response.status !== 200) return { message: "获取用户信息失败" };
            response.data.links = {
              AtCoder: "",
              CodeForces: "",
              NowCoder: "",
              LuoGu: "",
              LeetCode: "",
            };
            response.data.spiders.forEach((spider: any) => {
              response.data.links[spider.platform] = Link.getPlatformHomeLink(
                spider.platform,
                spider.username,
              );
            });
            return {
              data: response.data,
              message: response.data.message || "获取用户信息成功",
            };
          },
          "获取用户信息失败",
          {
            avatar: "",
            email: "",
            groupId: "",
            name: "",
            spiders: [],
            links: {
              AtCoder: "",
              CodeForces: "",
              NowCoder: "",
              LuoGu: "",
              LeetCode: "",
              QOJ: "",
            },
            userId: 0,
            username: "",
          },
        );
        return result;
      },
      getByName: async (
        name: string,
      ): Promise<stdResponse<UserProfileGetByNameResponse>> => {
        return apiCall<UserProfileGetByNameResponse>(
          () =>
            axios.get<UserProfileGetByNameResponse>(
              "/api/user/profile/get-by-name",
              {
                params: { name },
              },
            ),
          (response) => {
            if (response.status !== 200) return { message: "获取用户信息失败" };
            return {
              data: response.data,
              message: response.data.message || "获取用户信息成功",
            };
          },
          "获取用户信息失败",
          { list: [] },
        );
      },
      update: async (
        request: UserProfileUpdateRequest,
      ): Promise<stdResponse> => {
        const stdRes: stdResponse = {
          message: "",
          success: false,
          data: null,
        };

        if (!JWT.isValid()) {
          stdRes.message = "用户未登录";
          return stdRes;
        }

        if (!Validate.checkEmail(request.email)) {
          stdRes.message = "请输入有效邮箱";
          return stdRes;
        }

        // 不检查头像，空表示移除头像
        if (request.email === "" || request.name === "") {
          stdRes.message = "输入不能为空";
          return stdRes;
        }

        const payload = request.password
          ? { ...request, password: hashPassword(request.password) }
          : { ...request };

        try {
          const response = await axios.post<UserProfileGetByIdResponse>(
            "/api/user/profile/update",
            payload,
            {
              headers: {
                Authorization: `Bearer ${JWT.token}`,
              },
            },
          );
          if (response.status === 200) {
            const userStore = useUserStore();
            userStore.syncStatus();
            stdRes.success = true;
            stdRes.message = response.data.message || "更新用户资料成功";
            stdRes.data = response.data;
          } else {
            stdRes.message = response.data.message || "更新用户资料失败";
          }
        } catch (error: any) {
          console.error(error);
          stdRes.message = "更新用户资料失败";
        }

        return stdRes;
      },
      updateNickname: async (
        request: UserProfileUpdateRequest,
      ): Promise<stdResponse> => {
        const stdRes: stdResponse = {
          message: "",
          success: false,
          data: null,
        };

        if (!JWT.isValid()) {
          stdRes.message = "用户未登录";
          return stdRes;
        }

        if (!request.userId || request.name.trim() === "") {
          stdRes.message = "昵称不能为空";
          return stdRes;
        }

        try {
          const response = await axios.post<UserProfileUpdateResponse>(
            "/api/user/profile/update",
            {
              userId: Number(request.userId),
              name: request.name.trim(),
              email: request.email || "",
              avatar: request.avatar || "",
            },
            {
              headers: {
                Authorization: `Bearer ${JWT.token}`,
              },
            },
          );
          if (response.status === 200) {
            stdRes.success = true;
            stdRes.message = response.data.message || "昵称已更新";
            stdRes.data = response.data;
          } else {
            stdRes.message = response.data.message || "更新昵称失败";
          }
        } catch (error: any) {
          console.error(error);
          stdRes.message =
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            "更新昵称失败";
        }

        return stdRes;
      },
      changePassword: async (
        request: UserProfileChangePasswordRequest,
      ): Promise<stdResponse> => {
        const stdRes: stdResponse = {
          message: "",
          success: false,
          data: null,
        };

        if (!JWT.isValid()) {
          stdRes.message = "用户未登录";
          return stdRes;
        }

        if (!request.userId || !request.newPassword) {
          stdRes.message = "请填写新密码";
          return stdRes;
        }

        if (
          request.newPasswordConfirm !== undefined &&
          request.newPassword !== request.newPasswordConfirm
        ) {
          stdRes.message = "两次输入的新密码不一致";
          return stdRes;
        }

        const payload = {
          userId: Number(request.userId),
          oldPassword: request.oldPassword
            ? hashPassword(request.oldPassword)
            : "",
          newPassword: hashPassword(request.newPassword),
        };

        try {
          const response = await axios.post<UserProfileChangePasswordResponse>(
            "/api/user/profile/change-password",
            payload,
            {
              headers: {
                Authorization: `Bearer ${JWT.token}`,
              },
            },
          );
          if (response.status === 200 && response.data.success) {
            stdRes.success = true;
            stdRes.message = response.data.message || "密码已更新";
          } else {
            stdRes.message = response.data.message || "修改密码失败";
          }
        } catch (error: any) {
          console.error(error);
          stdRes.message =
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            "修改密码失败";
        }

        return stdRes;
      },
      delete: async (userId: number | string): Promise<stdResponse> => {
        return apiCall<UserProfileDeleteResponse>(
          () =>
            axios.post<UserProfileDeleteResponse>(
              "/api/user/profile/delete",
              { userId: Number(userId) },
              {
                headers: { Authorization: `Bearer ${JWT.token}` },
              },
            ),
          (response) => {
            if (response.status !== 200 || !response.data.success) {
              return { message: response.data.message || "删除用户失败" };
            }
            return { data: response.data, message: "删除用户成功" };
          },
          "删除用户失败",
          { success: false, message: "" },
        );
      },
      list: async (
        page: number,
      ): Promise<stdResponse<UserProfileListResponse>> => {
        return apiCall<UserProfileListResponse>(
          () =>
            axios.get<UserProfileListResponse>("/api/user/profile/list", {
              params: { pageNum: page, pageSize: 10 },
            }),
          (response) => {
            if (response.status !== 200) return { message: "获取用户列表失败" };
            response.data.currentPage = page;
            return {
              data: response.data,
              message: response.data.message || "获取用户列表成功",
            };
          },
          "获取用户列表失败",
          { total: 0, totalPage: 0, currentPage: page, list: [] },
        );
      },
      moveGroup: async (
        request: UserProfileMoveGroupRequest,
      ): Promise<stdResponse> => {
        return apiCall(
          () =>
            axios.post<UserProfileMoveGroupResponse>(
              "/api/user/profile/move-group",
              request,
              {
                headers: { Authorization: `Bearer ${JWT.token}` },
              },
            ),
          (response) => {
            if (response.status !== 200) return { message: "移动用户组失败" };
            return { message: response.data.message || "移动用户组成功" };
          },
          "移动用户组失败",
          null,
        );
      },
      setEmailEnabled: async (
        userId: number,
        enabled: boolean,
      ): Promise<stdResponse> => {
        return apiCall(
          () =>
            axios.post(
              "/api/user/profile/set-email-enabled",
              { userId, enabled },
              {
                headers: { Authorization: `Bearer ${JWT.token}` },
              },
            ),
          (response) => {
            if (response.status !== 200) return { message: "设置邮箱通知失败" };
            return { message: response.data.message || "设置邮箱通知成功" };
          },
          "设置邮箱通知失败",
          null,
        );
      },
    },
    role: {
      list: async (): Promise<stdResponse<UserRoleListResponse>> => {
        return apiCall<UserRoleListResponse>(
          () => axios.get<UserRoleListResponse>("/api/user/role/list"),
          (response) => {
            if (response.status !== 200) return { message: "获取角色列表失败" };
            return { data: response.data, message: "" };
          },
          "获取角色列表失败",
          { roles: [] },
        );
      },
      setUserRole: async (
        request: UserRoleSetRequest,
      ): Promise<stdResponse> => {
        return apiCall(
          () =>
            axios.post<UserRoleSetResponse>(
              "/api/user/role/set-user-role",
              request,
              {
                headers: { Authorization: `Bearer ${JWT.token}` },
              },
            ),
          (response) => {
            if (response.status !== 200) return { message: "设置角色失败" };
            return { message: response.data.message || "设置角色成功" };
          },
          "设置角色失败",
          null,
        );
      },
    },
    group: {
      list: async (
        page: number,
      ): Promise<stdResponse<UserGroupListResponse>> => {
        return apiCall<UserGroupListResponse>(
          () =>
            axios.get<UserGroupListResponse>("/api/user/group/list", {
              params: { pageNum: page, pageSize: 5 },
              headers: { Authorization: `Bearer ${JWT.token}` },
            }),
          (response) => {
            if (response.status !== 200) return { message: "获取分组列表失败" };
            response.data.currentPage = page;
            return {
              data: response.data,
              message: response.data.message || "获取分组列表成功",
            };
          },
          "获取分组列表失败",
          { list: [], total: 0, totalPage: 0, currentPage: page },
        );
      },
      create: async (
        request: UserGroupCreateRequest,
      ): Promise<stdResponse<UserGroupCreateResponse>> => {
        return apiCall<UserGroupCreateResponse>(
          () =>
            axios.post<UserGroupCreateResponse>(
              "/api/user/group/create",
              request,
              {
                headers: { Authorization: `Bearer ${JWT.token}` },
              },
            ),
          (response) => {
            if (response.status !== 200) return { message: "创建分组失败" };
            return {
              data: response.data,
              message: response.data.message || "创建分组成功",
            };
          },
          "创建分组失败",
          { id: 0, message: "" },
        );
      },
      delete: async (
        id: number,
      ): Promise<stdResponse<UserGroupDeleteResponse>> => {
        return apiCall<UserGroupDeleteResponse>(
          () =>
            axios.post<UserGroupDeleteResponse>(
              `/api/user/group/delete`,
              { id },
              {
                headers: { Authorization: `Bearer ${JWT.token}` },
              },
            ),
          (response) => {
            if (!response.data.success) return { message: "删除分组失败" };
            return { data: response.data, message: "删除分组成功" };
          },
          "删除分组失败",
          { success: false },
        );
      },
      update: async (
        request: UserGroupUpdateRequest,
      ): Promise<stdResponse<UserGroupUpdateResponse>> => {
        return apiCall<UserGroupUpdateResponse>(
          () =>
            axios.post<UserGroupUpdateResponse>(
              `/api/user/group/update`,
              request,
              {
                headers: { Authorization: `Bearer ${JWT.token}` },
              },
            ),
          (response) => {
            if (response.status !== 200) return { message: "更新分组失败" };
            return { data: response.data, message: "更新分组成功" };
          },
          "更新分组失败",
          { success: false },
        );
      },
      get: async (id: number): Promise<stdResponse<UserGroupGetResponse>> => {
        return apiCall<UserGroupGetResponse>(
          () =>
            axios.get<UserGroupGetResponse>(`/api/user/group/get`, {
              params: { id },
              headers: { Authorization: `Bearer ${JWT.token}` },
            }),
          (response) => {
            if (response.status !== 200) return { message: "获取分组失败" };
            return { data: response.data, message: "获取分组成功" };
          },
          "获取分组失败",
          { id: 0, name: "", describe: "", users: [] },
        );
      },
    },
    team: {
      detail: async (
        groupId: number,
      ): Promise<stdResponse<UserTeamDetailResponse>> => {
        return apiCall<UserTeamDetailResponse>(
          () =>
            axios.get<UserTeamDetailResponse>("/api/user/team/detail", {
              params: { groupId },
            }),
          (response) => {
            if (response.status !== 200) return { message: "获取团队信息失败" };
            return { data: response.data, message: "获取团队信息成功" };
          },
          "获取团队信息失败",
          {
            success: false,
            id: 0,
            name: "无团队",
            avatar: "",
            describe: "",
            ownerId: 0,
            users: [],
          },
        );
      },
      create: async (
        request: UserTeamCreateRequest,
      ): Promise<stdResponse<UserTeamCreateResponse>> => {
        return apiCall<UserTeamCreateResponse>(
          () =>
            axios.post<UserTeamCreateResponse>(
              "/api/user/team/create",
              request,
              {
                headers: { Authorization: `Bearer ${JWT.token}` },
              },
            ),
          (response) => {
            if (response.status !== 200 || !response.data.success) {
              return { message: response.data.message || "创建团队失败" };
            }
            return {
              data: response.data,
              message: response.data.message || "团队创建成功",
            };
          },
          "创建团队失败",
          {
            success: false,
            id: 0,
            name: "",
            avatar: "",
            describe: "",
            ownerId: 0,
            users: [],
            message: "",
          },
        );
      },
      update: async (request: UserTeamUpdateRequest): Promise<stdResponse> => {
        return apiCall(
          () =>
            axios.post("/api/user/team/update", request, {
              headers: { Authorization: `Bearer ${JWT.token}` },
            }),
          (response) => {
            if (response.status !== 200 || !response.data.success) {
              return { message: response.data.message || "更新团队失败" };
            }
            return {
              data: response.data,
              message: response.data.message || "团队资料已更新",
            };
          },
          "更新团队失败",
          null,
        );
      },
      invite: async (inviteeId: number): Promise<stdResponse> => {
        return apiCall(
          () =>
            axios.post(
              "/api/user/team/invite",
              { inviteeId },
              {
                headers: { Authorization: `Bearer ${JWT.token}` },
              },
            ),
          (response) => {
            if (response.status !== 200 || !response.data.success) {
              return { message: response.data.message || "发送邀请失败" };
            }
            return {
              data: response.data,
              message: response.data.message || "邀请已发送",
            };
          },
          "发送邀请失败",
          null,
        );
      },
      removeMember: async (userId: number): Promise<stdResponse> => {
        return apiCall(
          () =>
            axios.post(
              "/api/user/team/member/remove",
              { userId },
              {
                headers: { Authorization: `Bearer ${JWT.token}` },
              },
            ),
          (response) => {
            if (response.status !== 200 || !response.data.success) {
              return { message: response.data.message || "移除成员失败" };
            }
            return {
              data: response.data,
              message: response.data.message || "成员已移出团队",
            };
          },
          "移除成员失败",
          null,
        );
      },
      invites: async (): Promise<stdResponse<UserTeamInviteListResponse>> => {
        return apiCall<UserTeamInviteListResponse>(
          () =>
            axios.get("/api/user/team/invites", {
              headers: { Authorization: `Bearer ${JWT.token}` },
            }),
          (response) => {
            if (response.status !== 200 || !response.data.success) {
              return { message: response.data.message || "获取团队邀请失败" };
            }
            return { data: response.data, message: "获取团队邀请成功" };
          },
          "获取团队邀请失败",
          { success: false, list: [] },
        );
      },
      respondInvite: async (
        inviteId: number,
        accept: boolean,
      ): Promise<stdResponse> => {
        return apiCall(
          () =>
            axios.post(
              "/api/user/team/invite/respond",
              { inviteId, accept },
              {
                headers: { Authorization: `Bearer ${JWT.token}` },
              },
            ),
          (response) => {
            if (response.status !== 200 || !response.data.success) {
              return { message: response.data.message || "处理邀请失败" };
            }
            return {
              data: response.data,
              message: response.data.message || "处理邀请成功",
            };
          },
          "处理邀请失败",
          null,
        );
      },
    },
    system: {
      getRegisterInviteCode: async (): Promise<
        stdResponse<UserSystemRegisterInviteCodeResponse>
      > => {
        return apiCall<UserSystemRegisterInviteCodeResponse>(
          () =>
            axios.get("/api/user/system/register-invite-code", {
              headers: { Authorization: `Bearer ${JWT.token}` },
            }),
          (response) => {
            if (response.status !== 200 || !response.data.success) {
              return { message: response.data.message || "获取邀请码失败" };
            }
            return {
              data: response.data,
              message: response.data.message || "获取邀请码成功",
            };
          },
          "获取邀请码失败",
          { success: false, message: "", inviteCode: "" },
        );
      },
      updateRegisterInviteCode: async (
        request: UserSystemRegisterInviteCodeRequest,
      ): Promise<stdResponse<UserSystemRegisterInviteCodeResponse>> => {
        return apiCall<UserSystemRegisterInviteCodeResponse>(
          () =>
            axios.post("/api/user/system/register-invite-code", request, {
              headers: { Authorization: `Bearer ${JWT.token}` },
            }),
          (response) => {
            if (response.status !== 200 || !response.data.success) {
              return { message: response.data.message || "更新邀请码失败" };
            }
            return {
              data: response.data,
              message: response.data.message || "邀请码已更新",
            };
          },
          "更新邀请码失败",
          { success: false, message: "", inviteCode: "" },
        );
      },
    },
  };

  static core = {
    submitLog: {
      getById: async (
        id: number,
        cursor: number,
        limit: number = 50,
      ): Promise<stdResponse<CoreSubmitLogGetByIdResponse>> => {
        return apiCall<CoreSubmitLogGetByIdResponse>(
          () =>
            axios.get<CoreSubmitLogGetByIdResponse>(
              "/api/core/submit-log/get-by-id",
              {
                params: { userId: id, limit, cursor },
              },
            ),
          (response) => {
            if (response.status !== 200)
              return { message: "获取用户提交记录失败" };
            return {
              data: response.data,
              message: response.data.message || "获取用户提交记录成功",
            };
          },
          "获取用户提交记录失败",
          { data: [] },
        );
      },
    },
    spider: {
      set: async (request: CodeSpiderSetRequest): Promise<stdResponse> => {
        const stdRes: stdResponse = {
          message: "",
          success: false,
          data: null,
        };

        if (!JWT.isValid()) {
          stdRes.message = "用户未登录";
          return stdRes;
        }

        if (request.username === "") {
          stdRes.message = "用户名不能为空";
          return stdRes;
        }

        return apiCall(
          () =>
            axios.post<CodeSpiderSetResponse>("/api/core/spider/set", request, {
              headers: { Authorization: `Bearer ${JWT.token}` },
            }),
          (response) => {
            if (response.status !== 200) return { message: "绑定 OJ 账号失败" };
            return { message: response.data.message || "绑定 OJ 账号成功" };
          },
          "绑定 OJ 账号失败",
          null,
        );
      },
      update: async (userId: number): Promise<stdResponse> => {
        const stdRes: stdResponse = {
          message: "",
          success: false,
          data: null,
        };

        if (!JWT.isValid()) {
          stdRes.message = "用户未登录";
          return stdRes;
        }

        return apiCall(
          () =>
            axios.post<CodeSpiderUpdateResponse>(
              "/api/core/spider/update",
              { userId },
              { headers: { Authorization: `Bearer ${JWT.token}` } },
            ),
          (response) => {
            if (response.status !== 200) return { message: "更新数据失败" };
            return { message: response.data.message || "更新数据成功" };
          },
          "更新数据失败",
          null,
        );
      },
    },
    statistic: {
      heatmap: async (
        request: CoreStatisticHeatmapRequest,
      ): Promise<stdResponse<CoreStatisticHeatmapResponse>> => {
        return apiCall<CoreStatisticHeatmapResponse>(
          () =>
            axios.get<CoreStatisticHeatmapResponse>(
              "/api/core/statistic/heatmap",
              {
                params: request,
              },
            ),
          (response) => {
            if (response.status !== 200) return { message: "获取热力图失败" };
            return {
              data: response.data,
              message: response.data.message || "获取热力图成功",
            };
          },
          "获取热力图失败",
          { code: "", data: [] },
        );
      },
      period: async (
        userId: number,
      ): Promise<stdResponse<CoreStatisticPeriodResponse>> => {
        const emptyPeriodItem = {
          lastMonth: 0,
          lastWeek: 0,
          lastYear: 0,
          thisMonth: 0,
          thisWeek: 0,
          thisYear: 0,
          today: 0,
          total: 0,
        };
        return apiCall<CoreStatisticPeriodResponse>(
          () =>
            axios.get<CoreStatisticPeriodResponse>(
              "/api/core/statistic/period",
              {
                params: { userId },
              },
            ),
          (response) => {
            if (response.status !== 200) return { message: "获取统计数据失败" };
            return {
              data: response.data,
              message: response.data.message || "获取统计数据成功",
            };
          },
          "获取统计数据失败",
          { code: "", data: { ac: emptyPeriodItem, submit: emptyPeriodItem } },
        );
      },
      platformPeriod: async (
        userId: number,
      ): Promise<stdResponse<CoreStatisticPlatformPeriodResponse>> => {
        return apiCall<CoreStatisticPlatformPeriodResponse>(
          () =>
            axios.get<CoreStatisticPlatformPeriodResponse>(
              "/api/core/statistic/platform-period",
              {
                params: { userId },
              },
            ),
          (response) => {
            if (response.status !== 200)
              return { message: "获取平台统计数据失败" };
            return {
              data: response.data,
              message: response.data.message || "获取平台统计数据成功",
            };
          },
          "获取平台统计数据失败",
          { code: "", data: [] },
        );
      },
    },
    contest: {
      list: async (
        request: CoreContestListRequest,
      ): Promise<stdResponse<CoreContestListResponse>> => {
        return apiCall<CoreContestListResponse>(
          () =>
            axios.get<CoreContestListResponse>("/api/core/contest/list", {
              params: request,
            }),
          (response) => {
            if (response.data.code !== "0")
              return { message: "获取比赛列表失败" };
            response.data.data.forEach((item: CoreContestListData) => {
              const time = Number(item.time) * 1000;
              item.time = new Date(time).toLocaleString();
            });
            return { data: response.data, message: "获取比赛列表成功" };
          },
          "获取比赛列表失败",
          { code: "", message: "", data: [], total: 0 },
        );
      },
      ranking: async (
        request: CoreContestRankingRequest,
      ): Promise<stdResponse<CoreContestRankingResponse>> => {
        return apiCall<CoreContestRankingResponse>(
          () =>
            axios.get<CoreContestRankingResponse>("/api/core/contest/ranking", {
              params: {
                contest_id: request.contestId,
                limit: request.limit,
                offset: request.offset,
                groupId: request.groupId,
              },
            }),
          (response) => {
            if (response.data.code !== "0")
              return { message: "获取比赛排名失败" };
            const time = Number(response.data.contest.time) * 1000;
            response.data.contest.time = new Date(time).toLocaleString();
            return { data: response.data, message: "获取比赛排名成功" };
          },
          "获取比赛排名失败",
          {
            code: "",
            message: "",
            contest: {
              id: 0,
              platform: "NowCoder" as platform,
              contestId: "",
              contestName: "",
              contestUrl: "",
              avatar: "",
              totalCount: 0,
              time: "",
            },
            data: [],
            total: 0,
          },
        );
      },
    },
    bulletin: {
      list: async (
        page: number = 1,
        pageSize: number = 10,
      ): Promise<stdResponse<BulletinListResponse>> => {
        const stdRes: stdResponse<BulletinListResponse> = {
          message: "",
          success: false,
          data: { data: [], total: 0, page, pageSize },
        };
        try {
          const response = await axios.get("/api/core/bulletin/list", {
            params: { page, pageSize },
          });
          if (String(response.data.code) === "0") {
            stdRes.success = true;
            stdRes.message = response.data.message || "获取公告列表成功";
            stdRes.data = {
              data: response.data.data || [],
              total: Number(response.data.total) || 0,
              page: Number(response.data.page) || page,
              pageSize: Number(response.data.pageSize) || pageSize,
            };
          } else {
            stdRes.message = response.data.message || "获取公告列表失败";
          }
        } catch (error: any) {
          console.error(error);
          stdRes.message = "获取公告列表失败";
        }
        return stdRes;
      },
      get: async (id: number): Promise<stdResponse<BulletinInfo>> => {
        return apiCall<BulletinInfo>(
          () => axios.get("/api/core/bulletin/get", { params: { id } }),
          (response) => {
            if (String(response.data.code) !== "0")
              return { message: response.data.message || "获取公告失败" };
            return {
              data: response.data.data,
              message: response.data.message || "获取公告成功",
            };
          },
          "获取公告失败",
          {
            id: 0,
            title: "",
            content: "",
            authorId: 0,
            authorName: "",
            isPinned: false,
            createdAt: 0,
            updatedAt: 0,
          },
        );
      },
      create: async (request: {
        title: string;
        content: string;
        isPinned?: boolean;
      }): Promise<stdResponse<BulletinInfo>> => {
        return apiCall<BulletinInfo>(
          () =>
            axios.post("/api/core/bulletin/create", request, {
              headers: { Authorization: `Bearer ${JWT.token}` },
            }),
          (response) => {
            if (String(response.data.code) !== "0")
              return { message: response.data.message || "创建公告失败" };
            return {
              data: response.data.data,
              message: response.data.message || "创建公告成功",
            };
          },
          "创建公告失败",
          {
            id: 0,
            title: "",
            content: "",
            authorId: 0,
            authorName: "",
            isPinned: false,
            createdAt: 0,
            updatedAt: 0,
          },
        );
      },
      update: async (request: {
        id: number;
        title?: string;
        content?: string;
        isPinned?: boolean;
      }): Promise<stdResponse<BulletinInfo>> => {
        return apiCall<BulletinInfo>(
          () =>
            axios.post("/api/core/bulletin/update", request, {
              headers: { Authorization: `Bearer ${JWT.token}` },
            }),
          (response) => {
            if (String(response.data.code) !== "0")
              return { message: response.data.message || "更新公告失败" };
            return {
              data: response.data.data,
              message: response.data.message || "更新公告成功",
            };
          },
          "更新公告失败",
          {
            id: 0,
            title: "",
            content: "",
            authorId: 0,
            authorName: "",
            isPinned: false,
            createdAt: 0,
            updatedAt: 0,
          },
        );
      },
      delete: async (id: number): Promise<stdResponse> => {
        return apiCall(
          () =>
            axios.delete("/api/core/bulletin/delete", {
              params: { id },
              headers: { Authorization: `Bearer ${JWT.token}` },
            }),
          (response) => {
            if (String(response.data.code) !== "0")
              return { message: response.data.message || "删除公告失败" };
            return { message: response.data.message || "删除公告成功" };
          },
          "删除公告失败",
          null,
        );
      },
    },
  };

  static agent = {
    summary: {
      recent: async (
        userId: number,
      ): Promise<stdResponse<AgentSummaryRecentData>> => {
        return apiCall<AgentSummaryRecentData>(
          () =>
            axios.get<AgentSummaryRecentResponse>("/api/agent/summary/recent", {
              params: { userId },
            }),
          (response) => {
            if (response.status !== 200) return { message: "获取AI总结失败" };
            if (response.data.code === 1) {
              return {
                data: { msg: [response.data.msg], updateTime: "" },
                message: "AI总结生成中",
              };
            }
            const data = JSON.parse(
              response.data.resp,
            ) as AgentSummaryRecentData;
            return { data, message: "获取AI总结成功" };
          },
          "获取AI总结失败",
          { msg: [], updateTime: "" },
        );
      },
    },
  };
}
