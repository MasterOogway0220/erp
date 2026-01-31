"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Warehouse,
  ClipboardCheck,
  Receipt,
  BarChart3,
  Users,
  Settings,
  ChevronDown,
  Shield,
  LogOut,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { useAuth, rolePermissions, UserRole } from "@/lib/auth-context"

const navigationItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
    permission: "dashboard",
  },
  {
    title: "Sales",
    icon: ShoppingCart,
    permission: "enquiries",
    items: [
      { title: "Enquiries", href: "/sales/enquiries" },
      { title: "Quotations", href: "/sales/quotations" },
      { title: "Sales Orders", href: "/sales/orders" },
    ],
  },
  {
    title: "Purchase",
    icon: ClipboardList,
    permission: "purchase-orders",
    items: [
      { title: "Purchase Requests", href: "/purchase/requests" },
      { title: "Purchase Orders", href: "/purchase/orders" },
    ],
  },
  {
    title: "Inventory",
    icon: Warehouse,
    permission: "inventory",
    items: [
      { title: "Stock Overview", href: "/inventory/stock" },
      { title: "GRN", href: "/inventory/grn" },
      { title: "Dispatch", href: "/inventory/dispatch" },
    ],
  },
  {
    title: "Quality Control",
    icon: ClipboardCheck,
    permission: "inspections",
    items: [
      { title: "Inspections", href: "/qc/inspections" },
      { title: "MTC Management", href: "/qc/mtc" },
      { title: "NCR", href: "/qc/ncr" },
    ],
  },
  {
    title: "Finance",
    icon: Receipt,
    permission: "invoices",
    items: [
      { title: "Invoices", href: "/finance/invoices" },
      { title: "Payments", href: "/finance/payments" },
      { title: "Outstanding", href: "/finance/outstanding" },
    ],
  },
  {
    title: "Reports & MIS",
    icon: BarChart3,
    permission: "reports",
    items: [
      { title: "Standard Reports", href: "/reports" },
      { title: "KPI Dashboard", href: "/dashboard/configurable" },
    ],
  },
  {
    title: "Masters",
    icon: Settings,
    permission: "customers",
    items: [
      { title: "Companies", href: "/masters/companies" },
      { title: "Employees", href: "/masters/employees" },
      { title: "Customers", href: "/masters/customers" },
      { title: "Buyers", href: "/masters/buyers" },
      { title: "Vendors", href: "/masters/vendors" },
      { title: "Products", href: "/masters/products" },
    ],
  },
]

const roleLabels: Record<UserRole, string> = {
  admin: "Administrator",
  sales: "Sales",
  purchase: "Purchase",
  stores: "Stores",
  quality: "Quality Control",
  accounts: "Accounts",
  management: "Management",
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, signOut, hasRole } = useAuth()

  const handleLogout = async () => {
    await signOut()
    router.push("/login")
    router.refresh()
  }

  const hasPermission = (permission: string) => {
    if (!profile) return true
    const permissions = rolePermissions[profile.role]
    return permissions.includes("*") || permissions.includes(permission)
  }

  const filteredNavItems = navigationItems.filter(item => hasPermission(item.permission))

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">ERP Software</span>
          </div>
        </Link>
      </SidebarHeader>


      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-widest">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => {
                if (item.href) {
                  const isActive = pathname === item.href
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                }

                const isGroupActive = item.items?.some(sub => pathname.startsWith(sub.href))

                return (
                  <Collapsible key={item.title} defaultOpen={isGroupActive} className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => {
                            const isSubActive = pathname === subItem.href
                            return (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild isActive={isSubActive}>
                                  <Link href={subItem.href} className="flex items-center justify-between">
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            )
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent">
              <Users className="h-4 w-4 text-sidebar-accent-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-sidebar-foreground">
                {profile?.full_name || "User"}
              </span>
              <span className="text-[10px] text-sidebar-foreground/60">
                {profile?.role ? roleLabels[profile.role] : ""}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
