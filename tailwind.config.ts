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
        bg:         "#09090e",
        surface:    "#111117",
        "surface-2": "#17171f",
        "surface-3": "#1e1e28",
        text:       "#eeeef2",
        "text-2":   "rgba(238,238,242,0.58)",
        "text-3":   "rgba(238,238,242,0.30)",
        sports:     "#52C97A",
        local:      "#5B9CF6",
        maine:      "#EF9F27",
        tech:       "#A78BFA",
        finance:    "#34D399",
        work:       "#94A3B8",
        entertainment: "#F472B6",
        critical:   "#E24B4A",
        primary:    "#ffffff",
        "primary-text":   "#0a0a0f",
        "primary-subtle": "rgba(255,255,255,0.08)",
        "primary-border": "rgba(255,255,255,0.18)",
      },
      borderRadius: {
        card: "16px",
      },
    },
  },
  plugins: [],
};
export default config;
