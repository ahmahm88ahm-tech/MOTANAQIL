import { useState } from "react"
import { useGetCompanies, useCreateCompany, useDeleteCompany, getGetCompaniesQueryKey } from "@workspace/api-client-react"
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
import { Plus, Trash2 } from "lucide-react"

const companySchema = z.object({
  name: z.string().min(1, "Name is required"),
  name_ar: z.string().min(1, "Arabic name is required"),
  logo_url: z.string().nullable().optional(),
  prefixes: z.string().nullable().optional(),
})

type CompanyFormValues = z.infer<typeof companySchema>

export default function Companies() {
  const queryClient = useQueryClient()
  const { data: companiesResponse, isLoading } = useGetCompanies()
  const companies = companiesResponse?.data || []

  const createMutation = useCreateCompany()
  const deleteMutation = useDeleteCompany()

  const [isAddOpen, setIsAddOpen] = useState(false)

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      name_ar: "",
      logo_url: "",
      prefixes: "",
    },
  })

  const onSubmit = (values: CompanyFormValues) => {
    const payload = {
      name: values.name,
      name_ar: values.name_ar,
      logo_url: values.logo_url || null,
      prefixes: values.prefixes || null,
    }

    createMutation.mutate(
      { data: payload },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCompaniesQueryKey() })
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
          queryClient.invalidateQueries({ queryKey: getGetCompaniesQueryKey() })
        },
      }
    )
  }

  const handleOpenChange = (open: boolean) => {
    setIsAddOpen(open)
    if (!open) {
      form.reset()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-tight">/companies</h1>
          <p className="text-muted-foreground text-sm">Mobile operators and ISPs</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              ADD_COMPANY
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-mono">ADD_COMPANY</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Vodafone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name_ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name (Arabic)</FormLabel>
                      <FormControl>
                        <Input placeholder="فودافون" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prefixes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prefixes (comma separated)</FormLabel>
                      <FormControl>
                        <Input placeholder="010, 011" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="logo_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} value={field.value || ""} />
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
              <TableHead>Prefixes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No companies found.
                </TableCell>
              </TableRow>
            ) : (
              companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-mono text-muted-foreground">{company.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {company.logo_url && (
                        <img src={company.logo_url} alt={company.name} className="w-6 h-6 object-contain" />
                      )}
                      <div>
                        <div className="font-medium">{company.name}</div>
                        <div className="text-xs text-muted-foreground">{company.name_ar}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {company.prefixes || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={company.is_active ? "default" : "secondary"} className="font-mono text-[10px] uppercase">
                      {company.is_active ? "ACTIVE" : "INACTIVE"}
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
                          <AlertDialogTitle className="font-mono">CONFIRM_DELETE</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete company "{company.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>CANCEL</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono"
                            onClick={() => handleDelete(company.id)}
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
