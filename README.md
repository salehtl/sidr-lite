# SIDR Family Tree PWA

A privacy-focused, performant Progressive Web App for building and managing family trees.

## Features

- **Privacy First**: All data stored locally in IndexedDB. Export/import for cloud backup.
- **Mobile Optimized**: Touch-friendly interface with bottom sheet editor on mobile.
- **Offline Support**: Full PWA functionality with service worker caching.
- **High Performance**: Optimized rendering, debounced auto-save, and code splitting.

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
  components/     # React components
  hooks/          # Custom React hooks
  utils/          # Utility functions
  types.ts        # TypeScript type definitions
  App.tsx         # Main app component
  main.tsx        # Entry point
```

## PWA Setup

The app uses Vite PWA plugin for service worker and manifest generation. Icons need to be added to `public/icons/`:
- `icon-192x192.png`
- `icon-512x512.png`

## Storage

- **Local**: IndexedDB (auto-saves every 500ms)
- **Export/Import**: JSON format via file download/upload

## Mobile Interactions

- **Tap canvas**: Add new node
- **Tap node**: Select and edit
- **Long-press node**: Delete (mobile)
- **Right-click node**: Delete (desktop)
- **Drag between nodes**: Create link (desktop)

