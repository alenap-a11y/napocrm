/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx}"],
  corePlugins: {
    preflight: false, // CRITIQUE : ne pas reset le CSS global, le reste de l'app (Dashboard, SideBar, AppShell...) tourne en CSS classique/inline
  },
  theme: {
    extend: {
      colors: {
        navy: '#0B1830',
        primary: '#1689E8',
        pale: '#EAF6FF',
        bg: '#F7FAFC',
        card: '#FFFFFF',
        accent: '#18B7A0',
        warm: '#F0A04B',
        mystic: '#7C5CFC',
        rose: '#F5F0FF',
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
}
