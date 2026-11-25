import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({ children }: LayoutProps<"/">) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 print:max-w-none print:gap-0 print:p-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
