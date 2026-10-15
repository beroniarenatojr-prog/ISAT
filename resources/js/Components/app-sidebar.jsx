import * as React from "react"
import { usePage } from '@inertiajs/react'
import {
  Home,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { roleLabel, isPrincipal, isAdministrator, hasRole } from "@/lib/roleLabels"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar"

// Base admin navigation. Each entry names a Ziggy route; `superAdminOnly` /
// `administratorOnly` entries are filtered by role below. Routes are resolved
// lazily inside the component (not at module load) and guarded with
// `route().has()` so a name missing from the Ziggy payload — e.g. a stale
// server-side route cache right after a deploy — hides that one item instead
// of throwing and blanking the whole authenticated shell.
const baseItems = [
  { title: "Dashboard", route: 'admin.dashboard' },
  { title: "Teacher Management", route: 'admin.teachers.index' },
  { title: "User Management", route: 'admin.users.index', superAdminOnly: true },
  { title: "Assessment Tools", route: 'admin.assessment-tools', administratorOnly: true },
  { title: "IPCRF Submissions", route: 'admin.ipcrf.submissions' },
  { title: "Signed IPCRF", route: 'admin.signed-ipcrf' },
  { title: "IPCRF History", route: 'admin.ipcrf-history' },
  { title: "Questionnaire Results", route: 'admin.questionnaire-results' },
  { title: "IPCRF Configuration", route: 'admin.ipcrf.configuration' },
  { title: "Audit Logs", route: 'admin.audit-logs.index' },
]

// Resolve a Ziggy route name to a URL, or null if it isn't in the payload.
const safeRoute = (name) => {
  try {
    return route().has(name) ? route(name) : null;
  } catch {
    return null;
  }
}

export function AppSidebar({
  ...props
}) {
  const { auth } = usePage().props
  const roles = auth?.roles ?? auth?.user?.roles
  const principal = isPrincipal(roles)
  const administrator = isAdministrator(roles, auth?.user)
  // A Master Teacher holds both admin + teacher roles.
  const alsoTeacher = hasRole(roles, 'teacher')

  const items = baseItems
    .filter((item) =>
      (!item.superAdminOnly || principal) && (!item.administratorOnly || administrator)
    )
    .map((item) => ({ title: item.title, url: safeRoute(item.route) }))
    .filter((item) => item.url !== null)
  if (alsoTeacher) {
    const teacherUrl = safeRoute('teacher.dashboard')
    if (teacherUrl) {
      items.push({ title: "→ My Teacher Panel", url: teacherUrl })
    }
  }

  const navMain = [
    {
      title: "Menu",
      icon: Home,
      isActive: true,
      items,
    },
  ]

  const user = {
    name: auth?.user?.name ?? "User",
    email: auth?.user?.email ?? "",
    avatar: auth?.user?.profile_picture ?? "/pictures/isat.tmp",
    roleLabel: auth?.roleLabel ?? roleLabel(roles, auth?.user),
  }

  return (
    <Sidebar collapsible="icon" {...props} className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-sidebar-accent">
              <a href={safeRoute('admin.dashboard') ?? '/dashboard'} className="flex items-center gap-3">
                <div className="flex aspect-square size-9 items-center justify-center rounded-full bg-white p-0.5 ring-2 ring-yellow-300">
                  <img
                    src="/pictures/isat.tmp"
                    alt="ISAT"
                    className="size-8 rounded-full object-cover"
                  />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-[15px] font-bold tracking-tight text-white">ISAT e-TRACES</span>
                  <span className="truncate text-[11px] font-semibold uppercase tracking-wider text-yellow-300">{user.roleLabel} Panel</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-1 py-2">
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
