import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';

// Import the generated route tree
import './index.css';
import { ThemeProvider } from '@services/providers/Theme-provider';
import { queryClient, QueryProvider } from '@services/providers/QueryProvider';
import './i18n/config';
import { routeTree } from './routeTree.gen';

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  defaultPreload: 'intent',
  // Since we're using React Query, we don't want loader calls to ever be stale
  // This will ensure that the loader is always called when the route is preloaded or visited
  defaultPreloadStaleTime: 0,
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function InnerApp() {
  return <RouterProvider router={router} />;
}

function App() {
  return (
      <QueryProvider>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <InnerApp />
        </ThemeProvider>
      </QueryProvider>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} else {
  throw new Error(
    "Root element with ID 'root' was not found in the document. Ensure there is a corresponding HTML element with the ID 'root' in your HTML file.",
  );
}
