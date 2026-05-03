import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#f7f8fa",
        ink: "#111827",
      },
      boxShadow: {
        panel: "0 1px 2px rgba(17, 24, 39, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
