import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // 治愈风调色板（暖、低饱和、柔光感）
      colors: {
        bg: {
          DEFAULT: "#FAF7F2",       // 主背景: 米白
          subtle: "#F2EDE3",        // 卡片底色
          warm: "#EFE6D6",          // 强调底色
        },
        ink: {
          DEFAULT: "#2D2A24",       // 主文字: 深棕近黑
          soft: "#5C564B",          // 次要文字
          mute: "#94897A",          // 弱化文字
        },
        accent: {
          DEFAULT: "#C97C4F",       // 主调: 暖陶土橙
          soft: "#E0A578",          // 浅
          deep: "#A05A30",          // 深
        },
        moss: {
          DEFAULT: "#7A8B6B",       // 苔绿: 用于成长/等级
          soft: "#A8B59A",
        },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "'PingFang SC'", "'Microsoft YaHei'", "sans-serif"],
      },
      borderRadius: {
        lg: "12px",
        xl: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
