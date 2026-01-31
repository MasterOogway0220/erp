"use client"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { Bell, Search, Loader2, CheckCircle, AlertCircle, Info, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from "date-fns"

interface PageLayoutProps {
  children: React.ReactNode
  title: string
}

const notificationIcons = {
  info: <Info className="h-4 w-4 text-blue-500" />,
  success: <CheckCircle className="h-4 w-4 text-green-500" />,
  warning: <AlertCircle className="h-4 w-4 text-amber-500" />,
  error: <XCircle className="h-4 w-4 text-red-500" />,
}

export function PageLayout({ children, title }: PageLayoutProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showSearch, setShowSearch] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Notifications logic
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?unread=true')
      const data = await res.json()
      if (res.ok) {
        setNotifications(data.data.notifications || [])
        setUnreadCount(data.data.unreadCount || 0)
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000) // Polling every min
    return () => clearInterval(interval)
  }, [])

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'mark_read' })
      })
      setNotifications([])
      setUnreadCount(0)
    } catch (err) {
      console.error("Failed to mark notifications read", err)
    }
  }

  // Search logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true)
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
          const data = await res.json()
          if (res.ok) setSearchResults(data.data || [])
          setShowSearch(true)
        } catch (err) {
          console.error("Search failed", err)
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
        setShowSearch(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearch(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-sm font-medium">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block" ref={searchRef}>
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Global search..."
                className="w-64 pl-8 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowSearch(true)}
              />

              {showSearch && (
                <div className="absolute top-full left-0 w-full mt-1 bg-popover border rounded-md shadow-lg z-50 overflow-hidden">
                  <ScrollArea className="max-h-[300px]">
                    <div className="p-2 space-y-1">
                      {isSearching ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className="p-4 text-sm text-center text-muted-foreground">
                          No results found
                        </div>
                      ) : (
                        searchResults.map((res) => (
                          <button
                            key={`${res.type}-${res.id}`}
                            className="w-full text-left px-3 py-2 rounded-sm hover:bg-accent transition-colors block"
                            onClick={() => {
                              router.push(res.href)
                              setShowSearch(false)
                              setSearchQuery("")
                            }}
                          >
                            <div className="font-medium text-sm">{res.title}</div>
                            <div className="text-[10px] text-muted-foreground">{res.subtitle}</div>
                          </button>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                  <h4 className="font-semibold text-sm">Notifications</h4>
                  {unreadCount > 0 && (
                    <Button variant="ghost" className="h-auto p-0 text-[10px] text-primary" onClick={markAllRead}>
                      Mark all as read
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-80">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                      <Bell className="h-8 w-8 mb-2 opacity-20" />
                      <p className="text-xs">No unread notifications</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.map((n) => (
                        <div key={n.id} className="p-4 hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => n.reference_id && router.push(`/${n.reference_type}/${n.reference_id}`)}>
                          <div className="flex gap-3">
                            <div className="mt-0.5">
                              {notificationIcons[n.type as keyof typeof notificationIcons] || notificationIcons.info}
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-medium leading-none">{n.title}</p>
                              <p className="text-xs text-muted-foreground">{n.message}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                <div className="p-2 border-t text-center">
                  <Button variant="ghost" className="w-full text-xs h-8">View All</Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
