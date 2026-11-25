import { Suspense } from "react";

import {
  HeaderBreadcrumb,
  HeaderBreadcrumbFallback,
} from "@/components/layout/header-breadcrumb";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center border-b bg-background/80 backdrop-blur-sm md:rounded-t-xl print:hidden">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" aria-label="Afficher ou masquer la navigation" />
        <Separator
          orientation="vertical"
          className="mx-1 data-[orientation=vertical]:h-4"
        />
        <Suspense fallback={<HeaderBreadcrumbFallback />}>
          <HeaderBreadcrumb />
        </Suspense>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
