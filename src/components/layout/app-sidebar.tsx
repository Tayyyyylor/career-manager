import Link from "next/link";
import { Suspense } from "react";
import { Compass } from "lucide-react";

import {
  SidebarNav,
  SidebarNavFallback,
} from "@/components/layout/sidebar-nav";
import { UserMenu } from "@/components/layout/user-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarRail,
} from "@/components/ui/sidebar";
import { siteConfig } from "@/config/site";
import { requireUser } from "@/lib/session";

async function SidebarUser() {
  const user = await requireUser();
  return <UserMenu name={user.name} email={user.email} />;
}

export function AppSidebar() {
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip={siteConfig.name}>
              <Link href="/">
                <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Compass className="size-4" />
                </span>
                <span className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-semibold tracking-tight">
                    {siteConfig.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {siteConfig.tagline}
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <Suspense fallback={<SidebarNavFallback />}>
          <SidebarNav />
        </Suspense>
      </SidebarContent>

      <SidebarFooter>
        <Suspense fallback={<SidebarMenuSkeleton showIcon />}>
          <SidebarUser />
        </Suspense>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
