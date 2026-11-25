"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { isNavItemActive, navigation } from "@/config/navigation";

type SidebarNavLinksProps = {
  /** `null` tant que l'URL n'est pas connue (rendu de secours). */
  pathname: string | null;
};

function SidebarNavLinks({ pathname }: SidebarNavLinksProps) {
  const { isMobile, setOpenMobile } = useSidebar();

  return navigation.map((group) => (
    <SidebarGroup key={group.label}>
      <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {group.items.map((item) => {
            const isActive =
              pathname !== null && isNavItemActive(item, pathname);

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.title}
                >
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => {
                      if (isMobile) setOpenMobile(false);
                    }}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  ));
}

/** Navigation principale avec mise en évidence de la page courante. */
export function SidebarNav() {
  const pathname = usePathname();
  return <SidebarNavLinks pathname={pathname} />;
}

/**
 * Rendu utilisé pendant le prérendu lorsque l'URL n'est pas encore connue
 * (routes dynamiques) : mêmes liens, sans état actif.
 */
export function SidebarNavFallback() {
  return <SidebarNavLinks pathname={null} />;
}
