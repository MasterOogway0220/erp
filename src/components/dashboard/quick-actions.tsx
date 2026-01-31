"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Plus,
  FileText,
  ShoppingCart,
  Package,
  ClipboardList,
  Receipt,
  Truck,
} from "lucide-react"
import Link from "next/link"

const quickActions = [
  {
    label: "New Enquiry",
    icon: FileText,
    href: "/sales/enquiries/new",
    color: "bg-blue-600 hover:bg-blue-700",
  },
  {
    label: "New Quotation",
    icon: FileText,
    href: "/sales/quotations/new",
    color: "bg-indigo-600 hover:bg-indigo-700",
  },
  {
    label: "New Sales Order",
    icon: ShoppingCart,
    href: "/sales/orders/new",
    color: "bg-purple-600 hover:bg-purple-700",
  },
  {
    label: "New Purchase Order",
    icon: ClipboardList,
    href: "/purchase/orders/new",
    color: "bg-emerald-600 hover:bg-emerald-700",
  },
  {
    label: "Create GRN",
    icon: Package,
    href: "/inventory/grn/new",
    color: "bg-amber-600 hover:bg-amber-700",
  },
  {
    label: "Create Invoice",
    icon: Receipt,
    href: "/finance/invoices/new",
    color: "bg-rose-600 hover:bg-rose-700",
  },
]

export function QuickActions() {
  return (
    <Card className="animate-fade-in" style={{ animationDelay: "300ms" }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              asChild
              className={`h-auto flex-col gap-2 py-4 ${action.color} text-white`}
            >
              <Link href={action.href}>
                <action.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{action.label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
