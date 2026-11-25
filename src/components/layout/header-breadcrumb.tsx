"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { findNavItem, routes } from "@/config/navigation";
import { siteConfig } from "@/config/site";

export function HeaderBreadcrumb() {
  const pathname = usePathname();
  const current = findNavItem(pathname);
  const isHome = current?.href === routes.dashboard.href;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {!isHome && (
          <>
            <BreadcrumbItem className="hidden md:inline-flex">
              <BreadcrumbLink asChild>
                <Link href="/">{siteConfig.name}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
          </>
        )}
        <BreadcrumbItem>
          <BreadcrumbPage>{current?.title ?? siteConfig.name}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function HeaderBreadcrumbFallback() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbPage>{siteConfig.name}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
