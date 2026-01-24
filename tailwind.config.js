/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          500: "#f97316", // ✅ màu bg-orange-500
          600: "#ea580c", // ✅ thêm màu hover cam đậm hơn
        },
      },
    },
  },
  plugins: [],
};
