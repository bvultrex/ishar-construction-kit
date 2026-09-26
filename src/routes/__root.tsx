import { createRootRoute, HeadContent, Link, Outlet, Scripts } from "@tanstack/react-router";
import { useEffect } from "react";
import { useKit } from "@/lib/store";
import appCss from "../styles.css?url";

const APP_NAME = "Ishar Construction Kit";

const nav = [
  ["/", "Overview"],
  ["/author", "Adventure Builder"],
  ["/playtest", "Playtest"],
  ["/assets", "Asset Lab"],
  ["/characters", "Character Lab"],
  ["/files", "File Lab"],
  ["/knowledge", "Knowledge"],
  ["/project", "Project"],
] as const;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "theme-color", content: "#12100e" },
      { name: "description", content: "Audit-first construction kit for Ishar-style RPG data and authoring." },
    ],
    links: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }, { rel: "stylesheet", href: appCss }],
  }),
  component: Root,
});

function Root() {
  const hydrateProject = useKit((s) => s.hydrateProject);
  useEffect(() => hydrateProject(), [hydrateProject]);

  return (
    <html lang="de" suppressHydrationWarning>
      <head><HeadContent /></head>
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <div className="brand-lockup">
              <img src="/favicon.svg" alt="" width="32" height="32" />
              <div><strong>Ishar</strong><span>Construction Kit</span></div>
            </div>
            <nav>
              {nav.map(([to, label]) => (
                <Link key={to} to={to} activeProps={{ className: "active" }} activeOptions={{ exact: to === "/" }}>
                  {label}
                </Link>
              ))}
            </nav>
            <div className="sidebar-note">Audit first. Edit second.</div>
          </aside>
          <main className="workspace"><Outlet /></main>
        </div>
        <Scripts />
      </body>
    </html>
  );
}
