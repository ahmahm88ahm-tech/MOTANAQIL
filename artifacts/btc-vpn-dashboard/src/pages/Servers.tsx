import { useState } from "react"
import { useGetServers, useCreateServer, useDeleteServer, useGetCompanies, getGetServersQueryKey } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Trash2, Server as ServerIcon } from "lucide-react"

const serverSchema = z.object({
  company_id: z.coerce.number().min(1, "Company is required"),
  display_name: z.string().min(1, "Display name is required"),
  host: z.string().min(1, "Host is required"),
  port: z.coerce.number().default(443),
  protocol: z.string().default("vless"),
  server_type: z.string().default("cdn"),
  sni_hostname: z.string().min(1, "SNI is required"),
  payload: z.string().min(1, "Payload is required"),
})

type ServerFormValues = z.infer<typeof serverSchema>

export default function Servers() {
  const queryClient = useQueryClient()
  const { data: serversResponse, isLoading } = useGetServers()
  const { data: companiesResponse } = useGetCompanies()
  
  const servers = serversResponse?.servers || []
  const companies = companiesResponse?.data || serversResponse?.companies || []

  const createMutation = useCreateServer()
  const deleteMutation = useDeleteServer()

  const [isAddOpen, setIsAddOpen] = useState(false)

  const form = useForm<ServerFormValues>({
    resolver: zodResolver(serverSchema),
    defaultValues: {
      company_id: 0,
      display_name: "",
      host: "",
      port: 443,
      protocol: "vless",
      server_type: "cdn",
      sni_hostname: "",
      payload: "",
    },
  })

  const onSubmit = (values: ServerFormValues) => {
    createMutation.mutate(
      { data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetServersQueryKey() })
          setIsAddOpen(false)
        },
      }
    )
  }

  const handleDelete = (id: number) => {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetServersQueryKey() })
        },
      }
    )
  }

  const handleOpenChange = (open: boolean) => {
    setIsAddOpen(open)
    if (!open) {
      form.reset({
        company_id: 0,
        display_name: "",
        host: "",
        port: 443,
        protocol: "vless",
        server_type: "cdn",
        sni_hostname: "",
        payload: "",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-tight">/servers</h1>
          <p className="text-muted-foreground text-sm">VPN node infrastructure</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              PROVISION_NODE
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-mono flex items-center gap-2">
                <ServerIcon className="w-5 h-5 text-primary" />
                PROVISION_NODE
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="company_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        {...field}
                      >
                        <option value={0} disabled>Select a company</option>
                        {companies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="display_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Cairo-Node-1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3">
                    <FormField
                      control={form.control}
                      name="host"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Host / IP</FormLabel>
                          <FormControl>
                            <Input placeholder="192.168.1.1" className="font-mono" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-1">
                    <FormField
                      control={form.control}
                      name="port"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Port</FormLabel>
                          <FormControl>
                            <Input type="number" className="font-mono" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="protocol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Protocol</FormLabel>
                        <FormControl>
                          <Input className="font-mono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="server_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <FormControl>
                          <Input className="font-mono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="sni_hostname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SNI Hostname</FormLabel>
                      <FormControl>
                        <Input className="font-mono" placeholder="cloudflare.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payload"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payload</FormLabel>
                      <FormControl>
                        <Input className="font-mono text-xs" placeholder="GET / HTTP/1.1\r\n..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "PROVISIONING..." : "PROVISION"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Server</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Host:Port</TableHead>
              <TableHead>Config</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : servers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No servers provisioned.
                </TableCell>
              </TableRow>
            ) : (
              servers.map((server) => (
                <TableRow key={server.id}>
                  <TableCell className="font-mono text-muted-foreground">{server.id}</TableCell>
                  <TableCell className="font-medium">
                    {server.display_name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {server.company_name || `Company #${server.company_id}`}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {server.host}<span className="text-primary">:{server.port}</span>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground font-mono">
                      {server.protocol} / {server.server_type} <br/>
                      SNI: {server.sni_hostname}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-mono">TERMINATE_NODE</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete server "{server.display_name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>CANCEL</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono"
                            onClick={() => handleDelete(server.id)}
                          >
                            EXECUTE_TERMINATION
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
