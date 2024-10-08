/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as TableImport } from './routes/table'
import { Route as ShadcnTableImport } from './routes/shadcnTable'
import { Route as ConfigImport } from './routes/config'
import { Route as IndexImport } from './routes/index'

// Create/Update Routes

const TableRoute = TableImport.update({
  path: '/table',
  getParentRoute: () => rootRoute,
} as any)

const ShadcnTableRoute = ShadcnTableImport.update({
  path: '/shadcnTable',
  getParentRoute: () => rootRoute,
} as any)

const ConfigRoute = ConfigImport.update({
  path: '/config',
  getParentRoute: () => rootRoute,
} as any)

const IndexRoute = IndexImport.update({
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/config': {
      id: '/config'
      path: '/config'
      fullPath: '/config'
      preLoaderRoute: typeof ConfigImport
      parentRoute: typeof rootRoute
    }
    '/shadcnTable': {
      id: '/shadcnTable'
      path: '/shadcnTable'
      fullPath: '/shadcnTable'
      preLoaderRoute: typeof ShadcnTableImport
      parentRoute: typeof rootRoute
    }
    '/table': {
      id: '/table'
      path: '/table'
      fullPath: '/table'
      preLoaderRoute: typeof TableImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/config': typeof ConfigRoute
  '/shadcnTable': typeof ShadcnTableRoute
  '/table': typeof TableRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/config': typeof ConfigRoute
  '/shadcnTable': typeof ShadcnTableRoute
  '/table': typeof TableRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexRoute
  '/config': typeof ConfigRoute
  '/shadcnTable': typeof ShadcnTableRoute
  '/table': typeof TableRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/config' | '/shadcnTable' | '/table'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/config' | '/shadcnTable' | '/table'
  id: '__root__' | '/' | '/config' | '/shadcnTable' | '/table'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  ConfigRoute: typeof ConfigRoute
  ShadcnTableRoute: typeof ShadcnTableRoute
  TableRoute: typeof TableRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  ConfigRoute: ConfigRoute,
  ShadcnTableRoute: ShadcnTableRoute,
  TableRoute: TableRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* prettier-ignore-end */

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/config",
        "/shadcnTable",
        "/table"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/config": {
      "filePath": "config.tsx"
    },
    "/shadcnTable": {
      "filePath": "shadcnTable.tsx"
    },
    "/table": {
      "filePath": "table.tsx"
    }
  }
}
ROUTE_MANIFEST_END */
