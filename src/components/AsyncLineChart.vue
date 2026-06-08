<template>
  <VChart v-bind="$attrs" :option="option" :autoresize="autoresize" />
</template>

<script setup lang="ts">
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { LineChart } from "echarts/charts";
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
} from "echarts/components";
import VChart from "vue-echarts";

defineOptions({
  inheritAttrs: false,
});

defineProps<{
  option: any;
  autoresize?: boolean;
}>();

use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  ToolboxComponent,
  DataZoomComponent,
]);
</script>
