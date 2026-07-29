import { useGetStats } from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Building2, Server, Link as LinkIcon, Activity } from "lucide-react"

export default function Dashboard() {
  const { data: stats, isLoading, isError } = useGetStats()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold font-mono tracking-tight">/system/overview</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24"></CardHeader>
              <CardContent className="h-12"></CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (isError || !stats) {
    return (
      <div className="p-6 border border-destructive/50 bg-destructive/10 rounded text-destructive font-mono">
        &gt; SYSTEM_ERROR: Failed to fetch telemetry.
      </div>
    )
  }

  const cards = [
    { title: "Active Sessions", value: stats.sessions, icon: Activity, color: "text-primary" },
    { title: "Total Users", value: stats.users, icon: Users, color: "text-blue-500" },
    { title: "Registered Companies", value: stats.companies, icon: Building2, color: "text-emerald-500" },
    { title: "Active Servers", value: stats.servers, icon: Server, color: "text-purple-500" },
    { title: "Spoof URLs", value: stats.spoof_urls, icon: LinkIcon, color: "text-orange-500" },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-1">
        <h1 className="text-2xl font-bold font-mono tracking-tight">/system/overview</h1>
        <p className="text-muted-foreground text-sm">Real-time infrastructure telemetry</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Card key={card.title} className="bg-card/50 backdrop-blur border-border/50 hover:border-border transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-mono font-bold">{card.value.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
