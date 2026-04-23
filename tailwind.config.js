/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'studio-green': '#023020',
        'studio-green-darker': '#011a12',
        'rich-yellow': '#e9b20a',
        'beige': '#f5ecd0',
        // Windows 95 color palette
        'win95-gray': '#c0c0c0',
        'win95-gray-dark': '#808080',
        'win95-gray-light': '#dfdfdf',
        'win95-blue': '#000080',
        'win95-blue-light': '#0000ff',
        'win95-white': '#ffffff',
        'win95-black': '#000000',
        'win95-red': '#ff0000',
        'win95-green': '#008000',
        'win95-yellow': '#ffff00',
        // Winamp/Media Player color palette
        'winamp-bg': '#0a0a0a',
        'winamp-panel': '#1a1a1a',
        'winamp-border': '#333333',
        'winamp-border-light': '#555555',
        'winamp-display-bg': '#000000',
        'winamp-display-text': '#00ff00',
        'winamp-button': '#2a2a2a',
        'winamp-button-hover': '#3a3a3a',
        'winamp-button-active': '#1a1a1a',
        'winamp-title-bar': '#4a4a4a',
        'winamp-playlist-bg': '#1e1e1e',
        'winamp-playlist-selected': '#0066cc',
        'winamp-orange': '#ff6600',
      },
      fontFamily: {
        'heading': ['Oswald', '"Arial Black"', 'Arial', 'sans-serif'],
        'body': ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'sans-serif'],
        'win95': ['MS Sans Serif', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'win95-inset': 'inset -1px -1px #0a0a0a, inset 1px 1px #dfdfdf, inset -2px -2px #808080, inset 2px 2px #ffffff',
        'win95-outset': 'inset -1px -1px #808080, inset 1px 1px #ffffff, inset -2px -2px #0a0a0a, inset 2px 2px #dfdfdf',
        'win95-pressed': 'inset -1px -1px #ffffff, inset 1px 1px #0a0a0a, inset -2px -2px #dfdfdf, inset 2px 2px #808080',
        'win95-window': '2px 2px 4px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
