"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"

type UserRole = 'admin' | 'sales' | 'purchase' | 'stores' | 'quality' | 'accounts' | 'management'

const roles: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Administrator' },
  { value: 'sales', label: 'Sales' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'stores', label: 'Stores' },
  { value: 'quality', label: 'Quality Control' },
  { value: 'accounts', label: 'Accounts' },
  { value: 'management', label: 'Management' },
]

// Force-Rebuild-ID: NO-LUCIDE-REG-V5
export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole>("sales")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        email: email,
        full_name: fullName,
        role: role,
      })

      if (profileError) {
        setError(profileError.message)
        setLoading(false)
        return
      }
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Card className="w-full max-w-md mx-4 border-slate-800 bg-slate-900/50 backdrop-blur-xl animate-in zoom-in-95 duration-300">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white">Account Created!</CardTitle>
            <CardDescription className="text-slate-400">
              Your account has been created. Please sign in to access the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full h-11 text-base font-semibold">
              <Link href="/login">Go to Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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
          <CardTitle className="text-2xl font-bold tracking-tight text-white">Create Account</CardTitle>
          <CardDescription className="text-slate-400">
            Register for ERP Software access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20 animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-200">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
                className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-primary"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
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
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
                className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-primary"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role" className="text-slate-200">Functional Role</Label>
              <Select value={role} onValueChange={(val) => setRole(val as UserRole)} disabled={loading}>
                <SelectTrigger className="bg-slate-950/50 border-slate-800 text-white focus:ring-primary">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                  {roles.map((r) => (
                    <SelectItem key={r.value} value={r.value} className="focus:bg-slate-800 focus:text-white">
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button type="submit" className="w-full h-11 text-base font-semibold transition-all hover:scale-[1.02]" disabled={loading}>
              {loading ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
