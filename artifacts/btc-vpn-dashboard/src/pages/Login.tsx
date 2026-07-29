import { useState, useEffect } from "react"
import { useLocation } from "wouter"
import { useLogin } from "@workspace/api-client-react"
import { saveToken, getToken } from "@/lib/auth"
import { ShieldAlert, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function Login() {
  const [, setLocation] = useLocation()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  
  const loginMutation = useLogin()

  useEffect(() => {
    if (getToken()) {
      setLocation("/dashboard")
    }
  }, [setLocation])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")
    
    if (!username || !password) {
      setErrorMsg("Please enter username and password")
      return
    }

    loginMutation.mutate({ data: { username, password } }, {
      onSuccess: (res) => {
        if (res.success && res.data?.token) {
          saveToken(res.data.token)
          setLocation("/dashboard")
        } else {
          setErrorMsg(res.message || "Invalid credentials")
        }
      },
      onError: () => {
        setErrorMsg("Connection error. Server might be unreachable.")
      }
    })
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <ShieldAlert className="w-12 h-12 text-primary" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold font-mono tracking-tight text-foreground">
          B.T.C_VPN_ADMIN
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Command Center Access
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-border">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="username">Operator ID</Label>
              <div className="mt-2">
                <Input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="font-mono"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Passkey</Label>
              <div className="mt-2">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="font-mono"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="text-sm text-destructive font-mono bg-destructive/10 p-3 rounded border border-destructive/20">
                &gt; ERR: {errorMsg}
              </div>
            )}

            <div>
              <Button
                type="submit"
                className="w-full font-mono font-bold"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    AUTHENTICATING...
                  </>
                ) : (
                  "INITIALIZE_SESSION"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
