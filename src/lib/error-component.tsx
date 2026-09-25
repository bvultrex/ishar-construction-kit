import type { ErrorComponentProps } from "@tanstack/react-router";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  const message = error instanceof Error ? error.message : String(error || "Unbekannter Fehler");
  return <main className="error-screen"><span aria-hidden="true">⚠</span><h1>Workbench-Fehler</h1><p>{message}</p></main>;
}
