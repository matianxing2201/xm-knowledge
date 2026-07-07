import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import Layout from "./Layout.vue";
import "vitepress-plugin-folder-tree/style.css";
import "./style.css";

export default {
  extends: DefaultTheme,
  Layout,
} satisfies Theme;
