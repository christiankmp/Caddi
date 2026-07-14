/** @type {import('tailwindcss').Config} */
// Brand tokens are fixed by design direction — see AGENTS.md "Brand and design tokens".
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#F7F4EC',
          deep: '#F0EBDD',
        },
        ink: {
          DEFAULT: '#20261F',
          soft: '#4B5248',
        },
        pine: {
          DEFAULT: '#2C4A34',
          deep: '#1D3324',
        },
        sage: {
          DEFAULT: '#E1E3D2',
          line: '#C9CDB4',
        },
        brass: {
          DEFAULT: '#B98D42',
          deep: '#8F6A2E',
        },
        rust: '#A8503A',
      },
      fontFamily: {
        display: ['Fraunces_600SemiBold'],
        'display-black': ['Fraunces_900Black'],
        body: ['Inter_400Regular'],
        'body-medium': ['Inter_500Medium'],
        'body-semibold': ['Inter_600SemiBold'],
        mono: ['JetBrainsMono_400Regular'],
        'mono-medium': ['JetBrainsMono_500Medium'],
      },
    },
  },
  plugins: [],
};
