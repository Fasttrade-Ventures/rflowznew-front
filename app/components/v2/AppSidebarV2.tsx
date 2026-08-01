import { Link, NavLink, useLocation } from "@remix-run/react";

import classes from "./v2.module.css";

function SidebarIcon({ name }: { name: "dashboard" | "projects" | "library" }) {
  const paths = {
    dashboard: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3" y="3" width="7" height="9" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="14" y="3" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="14" y="12" width="7" height="9" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="3" y="16" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    projects: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ),
    library: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" />
        <path
          d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ),
  };
  return <span className={classes.navIcon}>{paths[name]}</span>;
}

export function AppSidebarV2({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const isDashboard = pathname === "/";
  const isProjects =
    pathname === "/home/projects" || pathname.startsWith("/paper/new");
  const isLibrary = pathname.startsWith("/home/library");

  return (
    <aside className={classes.sidebar}>
      <Link to="/" className={classes.logo} aria-label="RFlowz" />

      <NavLink
        to="/"
        end
        onClick={onNavigate}
        className={() =>
          `${classes.navLink}${isDashboard ? ` ${classes.navLinkActive}` : ""}`
        }
      >
        <SidebarIcon name="dashboard" />
        Dashboard
      </NavLink>

      <div className={classes.navLabel}>Workspace</div>

      <div
        className={`${classes.navLink}${isProjects ? ` ${classes.navLinkActive}` : ""}`}
        aria-current={isProjects ? "page" : undefined}
      >
        <SidebarIcon name="projects" />
        Projects
      </div>

      <NavLink
        to="/home/projects"
        onClick={onNavigate}
        className={({ isActive }) =>
          `${classes.navSubLink}${isActive ? ` ${classes.navSubLinkActive}` : ""}`
        }
      >
        All projects
      </NavLink>
      <NavLink
        to="/paper/new/purpose"
        onClick={onNavigate}
        className={({ isActive }) =>
          `${classes.navSubLink}${isActive ? ` ${classes.navSubLinkActive}` : ""}`
        }
      >
        Create project
      </NavLink>

      <div
        className={`${classes.navLink}${isLibrary ? ` ${classes.navLinkActive}` : ""}`}
        aria-current={isLibrary ? "page" : undefined}
      >
        <SidebarIcon name="library" />
        Library
      </div>
      <NavLink
        to="/home/library"
        onClick={onNavigate}
        className={({ isActive }) =>
          `${classes.navSubLink}${isActive ? ` ${classes.navSubLinkActive}` : ""}`
        }
      >
        All citations
      </NavLink>
    </aside>
  );
}
