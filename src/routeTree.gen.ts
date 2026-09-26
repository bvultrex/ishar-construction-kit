/* eslint-disable */
// @ts-nocheck
import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as AuthorRouteImport } from './routes/author'
import { Route as PlaytestRouteImport } from './routes/playtest'
import { Route as AssetsRouteImport } from './routes/assets'
import { Route as CharactersRouteImport } from './routes/characters'
import { Route as FilesRouteImport } from './routes/files'
import { Route as KnowledgeRouteImport } from './routes/knowledge'
import { Route as ProjectRouteImport } from './routes/project'

const IndexRoute = IndexRouteImport.update({ id: '/', path: '/', getParentRoute: () => rootRouteImport } as any)
const AuthorRoute = AuthorRouteImport.update({ id: '/author', path: '/author', getParentRoute: () => rootRouteImport } as any)
const PlaytestRoute = PlaytestRouteImport.update({ id: '/playtest', path: '/playtest', getParentRoute: () => rootRouteImport } as any)
const AssetsRoute = AssetsRouteImport.update({ id: '/assets', path: '/assets', getParentRoute: () => rootRouteImport } as any)
const CharactersRoute = CharactersRouteImport.update({ id: '/characters', path: '/characters', getParentRoute: () => rootRouteImport } as any)
const FilesRoute = FilesRouteImport.update({ id: '/files', path: '/files', getParentRoute: () => rootRouteImport } as any)
const KnowledgeRoute = KnowledgeRouteImport.update({ id: '/knowledge', path: '/knowledge', getParentRoute: () => rootRouteImport } as any)
const ProjectRoute = ProjectRouteImport.update({ id: '/project', path: '/project', getParentRoute: () => rootRouteImport } as any)

export interface FileRoutesByFullPath { '/': typeof IndexRoute; '/author': typeof AuthorRoute; '/playtest': typeof PlaytestRoute; '/assets': typeof AssetsRoute; '/characters': typeof CharactersRoute; '/files': typeof FilesRoute; '/knowledge': typeof KnowledgeRoute; '/project': typeof ProjectRoute }
export interface FileRoutesByTo { '/': typeof IndexRoute; '/author': typeof AuthorRoute; '/playtest': typeof PlaytestRoute; '/assets': typeof AssetsRoute; '/characters': typeof CharactersRoute; '/files': typeof FilesRoute; '/knowledge': typeof KnowledgeRoute; '/project': typeof ProjectRoute }
export interface FileRoutesById { __root__: typeof rootRouteImport; '/': typeof IndexRoute; '/author': typeof AuthorRoute; '/playtest': typeof PlaytestRoute; '/assets': typeof AssetsRoute; '/characters': typeof CharactersRoute; '/files': typeof FilesRoute; '/knowledge': typeof KnowledgeRoute; '/project': typeof ProjectRoute }
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/author' | '/playtest' | '/assets' | '/characters' | '/files' | '/knowledge' | '/project'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/author' | '/playtest' | '/assets' | '/characters' | '/files' | '/knowledge' | '/project'
  id: '__root__' | '/' | '/author' | '/playtest' | '/assets' | '/characters' | '/files' | '/knowledge' | '/project'
  fileRoutesById: FileRoutesById
}
export interface RootRouteChildren { IndexRoute: typeof IndexRoute; AuthorRoute: typeof AuthorRoute; PlaytestRoute: typeof PlaytestRoute; AssetsRoute: typeof AssetsRoute; CharactersRoute: typeof CharactersRoute; FilesRoute: typeof FilesRoute; KnowledgeRoute: typeof KnowledgeRoute; ProjectRoute: typeof ProjectRoute }

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': { id: '/'; path: '/'; fullPath: '/'; preLoaderRoute: typeof IndexRouteImport; parentRoute: typeof rootRouteImport }
    '/author': { id: '/author'; path: '/author'; fullPath: '/author'; preLoaderRoute: typeof AuthorRouteImport; parentRoute: typeof rootRouteImport }
    '/playtest': { id: '/playtest'; path: '/playtest'; fullPath: '/playtest'; preLoaderRoute: typeof PlaytestRouteImport; parentRoute: typeof rootRouteImport }
    '/assets': { id: '/assets'; path: '/assets'; fullPath: '/assets'; preLoaderRoute: typeof AssetsRouteImport; parentRoute: typeof rootRouteImport }
    '/characters': { id: '/characters'; path: '/characters'; fullPath: '/characters'; preLoaderRoute: typeof CharactersRouteImport; parentRoute: typeof rootRouteImport }
    '/files': { id: '/files'; path: '/files'; fullPath: '/files'; preLoaderRoute: typeof FilesRouteImport; parentRoute: typeof rootRouteImport }
    '/knowledge': { id: '/knowledge'; path: '/knowledge'; fullPath: '/knowledge'; preLoaderRoute: typeof KnowledgeRouteImport; parentRoute: typeof rootRouteImport }
    '/project': { id: '/project'; path: '/project'; fullPath: '/project'; preLoaderRoute: typeof ProjectRouteImport; parentRoute: typeof rootRouteImport }
  }
}
const rootRouteChildren: RootRouteChildren = { IndexRoute, AuthorRoute, PlaytestRoute, AssetsRoute, CharactersRoute, FilesRoute, KnowledgeRoute, ProjectRoute }
export const routeTree = rootRouteImport._addFileChildren(rootRouteChildren)._addFileTypes<FileRouteTypes>()

import type { getRouter } from './router.tsx'
declare module '@tanstack/react-start' {
  interface Register { ssr: true; router: Awaited<ReturnType<typeof getRouter>> }
}
