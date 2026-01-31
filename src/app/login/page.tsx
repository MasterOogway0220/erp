"use client"
// cache-bust-v1
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20" />
      
      <Card className="w-full max-w-md mx-4 relative border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-[0_0_20px_rgba(var(--primary),0.3)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary-foreground"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">ERP Software</CardTitle>
          <CardDescription className="text-slate-400">
            Secure access to your enterprise dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20 animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@erp.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-primary"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" title="password" className="text-slate-200">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-primary"
              />
            </div>
            
            <Button type="submit" className="w-full h-11 text-base font-semibold transition-all hover:scale-[1.02]" disabled={loading}>
              {loading ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Authenticating...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-slate-400">
            Need an account?{" "}
            <Link href="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Create one now
            </Link>
          </div>
          
          <div className="mt-6 p-4 bg-slate-950/50 border border-slate-800/50 rounded-xl">
            <p className="text-[10px] text-slate-500 text-center font-mono uppercase tracking-widest mb-2">
              Demo Access
            </p>
            <div className="flex justify-between items-center px-2">
              <span className="text-xs text-slate-400">admin@erp.local</span>
              <span className="text-[10px] text-slate-600">/</span>
              <span className="text-xs text-slate-400">admin123</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
