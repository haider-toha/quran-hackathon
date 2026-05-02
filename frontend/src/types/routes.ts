// Single source of truth for the in-app route literal union. Every place that
// hardcodes "/", "/ask", etc. (Sidebar nav, CommandPalette commands, AppShell
// shortcut map, Crumbs lookup) imports this so adding a route is a one-file
// change.
export type AppRoute = "/" | "/ask" | "/journal" | "/library" | "/research" | "/settings";
