import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
import ToastPlugin from "./plugins/toast";

// JetBrains Mono 字体
import "@fontsource/jetbrains-mono"; // Defaults to weight 400
import "@fontsource/jetbrains-mono/400.css"; // Specify weight
import "@fontsource/jetbrains-mono/400-italic.css"; // Specify weight and style

import "@chinese-fonts/maple-mono-cn/dist/MapleMono-CN-Regular/result.css";

// FontAwesome 图标库
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import {
  faUser,
  faHome,
  faSun,
  faMoon,
  faTrophy,
  faCrosshairs,
  faGlobe,
  faGaugeHigh,
  faChartLine,
  faPeopleGroup,
  faFlag,
  faStar,
  faList,
  faComment,
  faCalendarDays,
  faBullhorn,
  faBell,
  faThumbtack,
  faArrowRight,
  faNewspaper,
  faEnvelope,
  faKey,
  faServer,
  faDatabase,
  faArrowsRotate,
  faMagnifyingGlassChart,
  faClipboardList,
} from "@fortawesome/free-solid-svg-icons";

// 主题
import "./assets/css/theme.css";
// 字号
import "./assets/css/fontsize.css";
// 设计系统与历史按钮兼容层
import "./assets/css/design-system.css";

library.add(
  faUser,
  faHome,
  faSun,
  faMoon,
  faTrophy,
  faCrosshairs,
  faGlobe,
  faGaugeHigh,
  faChartLine,
  faPeopleGroup,
  faFlag,
  faStar,
  faList,
  faComment,
  faCalendarDays,
  faBullhorn,
  faBell,
  faEnvelope,
  faKey,
  faServer,
  faDatabase,
  faArrowsRotate,
  faMagnifyingGlassChart,
  faClipboardList,
  faThumbtack,
  faArrowRight,
  faNewspaper,
);

const pinia = createPinia();
const app = createApp(App);

app.component("font-awesome-icon", FontAwesomeIcon);
app.use(pinia);
app.use(router);
app.use(ToastPlugin);

app.mount("#app");
