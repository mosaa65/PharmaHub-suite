import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  Users,
  UserCircle2,
  FileText,
  Stethoscope,
  Wallet,
  BarChart3,
  Building2,
  LogOut,
  Languages,
  Pill,
  ChevronLeft,
  Bell,
  Undo2,
  ClipboardCheck,
  ArrowLeftRight,
  Database,
  Settings,
  Tag,
  History,
  ArrowLeft,
} from "lucide-react";
import { useI18n } from "@/i18n";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function BrandHeader() {
  const { t } = useI18n();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  return (
    <div className="flex items-center gap-3 px-2 py-3 overflow-hidden">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl gradient-primary shadow-elegant transition-transform duration-300 hover:scale-105">
        <Pill className="h-5 w-5 text-primary-foreground" />
      </div>
      <div
        className={`min-w-0 transition-all duration-300 ${
          collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
        }`}
      >
        <div className="font-extrabold text-sidebar-foreground truncate leading-tight">
          {t("appName")}
        </div>
        <div className="text-[11px] text-muted-foreground truncate">
          {t("appTagline")}
        </div>
      </div>
    </div>
  );
}

function NavMenu() {
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { state, setOpenMobile, isMobile } = useSidebar();
  const collapsed = state === "collapsed";

  const nav = [
    { to: "/dashboard", icon: LayoutDashboard, label: t("dashboard") },
    { to: "/pos", icon: ShoppingCart, label: t("pos") },
    { to: "/inventory", icon: Package, label: t("inventory") },
    { to: "/purchases", icon: Truck, label: t("purchases") },
    { to: "/suppliers", icon: Building2, label: t("suppliers") },
    { to: "/customers", icon: Users, label: t("customers") },
    { to: "/prescriptions", icon: FileText, label: t("prescriptions") },
    { to: "/returns", icon: Undo2, label: t("returns") },
    { to: "/stock-take", icon: ClipboardCheck, label: t("stockTake") },
    { to: "/transfers", icon: ArrowLeftRight, label: t("transfers") },
    { to: "/pharmacist", icon: Stethoscope, label: t("pharmacist") },
    { to: "/finance", icon: Wallet, label: t("finance") },
    { to: "/reports", icon: BarChart3, label: t("reports") },
    { to: "/alerts", icon: Bell, label: t("alerts") },
    { to: "/backup", icon: Database, label: t("backupExport") },
    { to: "/barcode", icon: Tag, label: t("barcodeLabels") },
    { to: "/sales", icon: History, label: t("salesHistory") },
    { to: "/settings", icon: Settings, label: t("settings") },
    { to: "/staff", icon: UserCircle2, label: t("staff") },
  ];

  return (
    <SidebarMenu className="gap-1">
      {nav.map((item, idx) => {
        const active = pathname === item.to;
        const Icon = item.icon;
        const button = (
          <SidebarMenuButton
            asChild
            isActive={active}
            className={`group relative h-10 rounded-xl transition-all duration-300 ${
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
                : "hover:bg-sidebar-accent hover:translate-x-0.5 rtl:hover:-translate-x-0.5"
            }`}
          >
            <Link
              to={item.to}
              onClick={() => isMobile && setOpenMobile(false)}
              className="flex items-center gap-3"
            >
              {active && (
                <span className="absolute inset-y-2 start-0 w-1 rounded-full bg-primary-foreground/80 animate-fade-in" />
              )}
              <Icon className="h-4.5 w-4.5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
              <span className="truncate font-medium">{item.label}</span>
            </Link>
          </SidebarMenuButton>
        );

        return (
          <SidebarMenuItem
            key={item.to}
            className="animate-fade-in"
            style={{ animationDelay: `${idx * 30}ms`, animationFillMode: "both" }}
          >
            {collapsed && !isMobile ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            ) : (
              button
            )}
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

type SectionKey = "pharmacist" | "settings" | "purchases";

const SECTION_NAV: Record<SectionKey, { label: string; to: string }[]> = {
  pharmacist: [
    { to: "/pharmacist?tab=interactions", label: "فحص التداخلات" },
    { to: "/pharmacist?tab=dosage", label: "مستشار الجرعات" },
    { to: "/pharmacist?tab=allergy", label: "فحص الحساسية" },
    { to: "/pharmacist?tab=refill", label: "متتبع إعادة الصرف" },
  ],
  settings: [
    { to: "/settings?tab=pharmacy", label: "معلومات الصيدلية" },
    { to: "/settings?tab=tax", label: "الضرائب" },
    { to: "/settings?tab=print", label: "الطباعة" },
  ],
  purchases: [
    { to: "/purchases?tab=orders", label: "طلبات الشراء" },
    { to: "/purchases?tab=invoices", label: "فواتير الشراء" },
    { to: "/purchases?tab=suppliers", label: "أرصدة الموردين" },
  ],
};

function SectionMenu() {
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isMobile, setOpenMobile } = useSidebar();

  const active = pathname.replace("/_authenticated", "").replace(/^\//, "") as SectionKey;
  const items = SECTION_NAV[active];
  if (!items) return null;

  return (
    <div className="space-y-3">
      <Button
        variant="ghost"
        className="w-full justify-start gap-2 rounded-full bg-sidebar-accent/40 hover:bg-sidebar-accent"
        asChild
      >
        <Link
          to="/dashboard"
          onClick={() => isMobile && setOpenMobile(false)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t("back")}
        </Link>
      </Button>
      <SidebarMenu className="gap-1">
        {items.map((item) => {
          const [itemPath] = item.to.split("?");
          const isActive = pathname === itemPath;
          return (
            <SidebarMenuItem key={item.to}>
              <SidebarMenuButton asChild isActive={isActive} className="h-10 rounded-full">
                <Link
                  to={item.to as any}
                  onClick={() => isMobile && setOpenMobile(false)}
                  className="flex items-center gap-3"
                >
                  <span className="truncate font-medium">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </div>
  );
}

function UserFooter() {
  const { t, lang, toggle } = useI18n();
  const { user, signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <div className="space-y-2 p-2">
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 rounded-xl transition-all hover:bg-sidebar-accent"
        onClick={toggle}
      >
        <Languages className="h-4 w-4 shrink-0" />
        {!collapsed && <span>{lang === "ar" ? "English" : "العربية"}</span>}
      </Button>
      <div
        className={`flex items-center gap-2 rounded-xl bg-sidebar-accent/60 p-2 transition-all ${
          collapsed ? "justify-center" : ""
        }`}
      >
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full gradient-primary text-primary-foreground text-xs font-bold shadow-soft">
          {(user?.email ?? "U").slice(0, 2).toUpperCase()}
        </div>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1 text-xs">
              <div className="truncate font-medium">{user?.email}</div>
            </div>
            <button
              onClick={signOut}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all hover:scale-110"
              aria-label={t("signOut")}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t, dir } = useI18n();
  const side = dir === "rtl" ? "right" : "left";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isSection = ["/pharmacist", "/settings", "/purchases"].includes(pathname);

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background" dir={dir}>
          <Sidebar
            side={side}
            collapsible="icon"
            className="border-sidebar-border"
          >
            <SidebarHeader className="border-b border-sidebar-border">
              <BrandHeader />
            </SidebarHeader>
            <SidebarContent className="px-2 py-3">
              <SidebarGroup>
                <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                  {isSection ? t("sections") : t("appName")}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  {isSection ? <SectionMenu /> : <NavMenu />}
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="border-t border-sidebar-border">
              <UserFooter />
            </SidebarFooter>
          </Sidebar>

          <SidebarInset className="flex flex-col min-w-0">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-card/80 backdrop-blur-md px-3 lg:px-4">
              <SidebarTrigger className="rounded-lg hover:bg-accent transition-all hover:scale-105">
                <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
              </SidebarTrigger>
              <div className="flex items-center gap-2 min-w-0">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg gradient-primary lg:hidden">
                  <Pill className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold truncate lg:hidden">
                  {t("appName")}
                </span>
              </div>
            </header>
            <main className="flex-1 min-w-0">
              <div className="mx-auto max-w-7xl p-4 lg:p-8 animate-fade-in">
                {children}
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
