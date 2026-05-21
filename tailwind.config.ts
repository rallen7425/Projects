import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2d59a6",
        accent: "#e87820",
        surface: "#f7f8fa",
        border: "#dde1e8",
        "text-primary": "#0f1117",
        "text-secondary": "#475066",
        "text-tertiary": "#7a8499",
        critical: "#E24B4A",
        "your-day": "#185FA5",
        "on-radar": "#0F6E56",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};
export default config;
