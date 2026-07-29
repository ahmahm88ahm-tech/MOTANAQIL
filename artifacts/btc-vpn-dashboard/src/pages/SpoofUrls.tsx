import { useState } from "react"
import { useGetSpoofUrls, useCreateSpoofUrl, useDeleteSpoofUrl, useGetCompanies, getGetSpoofUrlsQueryKey } from "@workspace/api-client-react"
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
import { Plus, Trash2, Link as LinkIcon } from "lucide-react"

const spoofUrlSchema = z.object({
  company_id: z.coerce.number().min(1, "Company is required"),
  url: z.string().url("Must be a valid URL"),
  description: z.string().nullable().optional(),
})

type SpoofUrlFormValues = z.infer<typeof spoofUrlSchema>

export default function SpoofUrls() {
  const queryClient = useQueryClient()
  const { data: spoofUrlsResponse, isLoading } = useGetSpoofUrls()
  const { data: companiesResponse } = useGetCompanies()
  
  const spoofUrls = spoofUrlsResponse?.data || []
  const companies = companiesResponse?.data || []

  const createMutation = useCreateSpoofUrl()
  const deleteMutation = useDeleteSpoofUrl()

  const [isAddOpen, setIsAddOpen] = useState(false)

  const form = useForm<SpoofUrlFormValues>({
    resolver: zodResolver(spoofUrlSchema),
    defaultValues: {
      company_id: 0,
      url: "",
      description: "",
    },
  })

  const onSubmit = (values: SpoofUrlFormValues) => {
    createMutation.mutate(
      { data: { ...values, description: values.description || null } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSpoofUrlsQueryKey() })
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
          queryClient.invalidateQueries({ queryKey: getGetSpoofUrlsQueryKey() })
        },
      }
    )
  }

  const handleOpenChange = (open: boolean) => {
    setIsAddOpen(open)
    if (!open) {
      form.reset({
        company_id: 0,
        url: "",
        description: "",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-tight">/spoof-urls</h1>
          <p className="text-muted-foreground text-sm">Manage traffic masquerading endpoints</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              ADD_URL
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-mono flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-primary" />
                ADD_SPOOF_URL
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
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." className="font-mono" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Zero-rating endpoint" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "ADDING..." : "ADD"}
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
              <TableHead>Company</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : spoofUrls.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No spoof URLs configured.
                </TableCell>
              </TableRow>
            ) : (
              spoofUrls.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-muted-foreground">{item.id}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {item.company_name || `Company #${item.company_id}`}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-sm text-primary">{item.url}</div>
                    {item.description && (
                      <div className="text-xs text-muted-foreground mt-1">{item.description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.is_active ? "default" : "secondary"} className="font-mono text-[10px] uppercase">
                      {item.is_active ? "ACTIVE" : "INACTIVE"}
                    </Badge>
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
                          <AlertDialogTitle className="font-mono">DELETE_URL</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this spoof URL? Traffic depending on this endpoint may drop.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>CANCEL</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono"
                            onClick={() => handleDelete(item.id)}
                          >
                            EXECUTE_DELETE
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
