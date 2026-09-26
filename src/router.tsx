import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";

function DefaultNotFound() {
  return <main className="error-screen"><span>404</span><h1>Seite nicht gefunden</h1><p>Die angeforderte Route gehört nicht zum Ishar Construction Kit.</p></main>;
}

export function getRouter() {
  return createRouter({
    routeTree,
    defaultErrorComponent: AppErrorComponent,
    defaultNotFoundComponent: DefaultNotFound,
  });
}
