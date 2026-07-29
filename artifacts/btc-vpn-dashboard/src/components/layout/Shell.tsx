import { Link, useLocation } from "wouter"
import { Activity, Users, Building2, Server, Link as LinkIcon, LogOut, ShieldAlert } from "lucide-react"
import { useLogout } from "@workspace/api-client-react"
import { clearToken } from "@/lib/auth"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Activity },
  { name: "Users", href: "/users", icon: Users },
  { name: "Companies", href: "/companies", icon: Building2 },
  { name: "Servers", href: "/servers", icon: Server },
  { name: "Spoof URLs", href: "/spoof-urls", icon: LinkIcon },
]

export function Shell({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation()
  const logoutMutation = useLogout()

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        clearToken()
        setLocation("/login")
      }
    })
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      <div className="w-full md:w-64 bg-card border-r border-border shrink-0 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <ShieldAlert className="w-6 h-6 text-primary mr-3" />
          <span className="font-mono font-bold text-lg tracking-tight">B.T.C_VPN</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location === item.href
            return (
              <Link key={item.name} href={item.href} className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
                <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                {item.name}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
