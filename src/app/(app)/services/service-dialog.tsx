"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  durationMinutes: z.coerce.number().int().min(5, "At least 5 minutes"),
  price: z.coerce.number().min(0),
  taxRate: z.coerce.number().min(0).max(100),
  isActive: z.boolean(),
});
type FormValues = z.infer<typeof formSchema>;

export interface ServiceRecord {
  id: string;
  name: string;
  categoryId: string | null;
  description: string | null;
  durationMinutes: number;
  price: string | number;
  taxRate: string | number;
  isActive: boolean;
}

export interface CategoryOption {
  id: string;
  name: string;
}

export function ServiceDialog({
  open,
  onOpenChange,
  service,
  branchId,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: ServiceRecord | null;
  branchId: string;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const editing = Boolean(service);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  React.useEffect(() => {
    if (open) {
      reset({
        name: service?.name ?? "",
        categoryId: service?.categoryId ?? undefined,
        description: service?.description ?? "",
        durationMinutes: service?.durationMinutes ?? 30,
        price: service ? Number(service.price) : 0,
        taxRate: service ? Number(service.taxRate) : 13,
        isActive: service?.isActive ?? true,
      });
    }
  }, [open, service, reset]);

  async function onSubmit(values: FormValues) {
    try {
      await apiFetch(editing ? `/api/services/${service!.id}` : "/api/services", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify({ ...values, branchId }),
      });
      toast({ title: editing ? "Service updated" : "Service created", variant: "success" });
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast({
        title: "Something went wrong",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    }
  }

  const categoryId = watch("categoryId");
  const isActive = watch("isActive");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit service" : "New service"}</DialogTitle>
          <DialogDescription>
            Services are specific to the currently selected branch.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={categoryId ?? ""}
              onValueChange={(v) => setValue("categoryId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Uncategorized" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="durationMinutes">Duration (min)</Label>
              <Input id="durationMinutes" type="number" {...register("durationMinutes")} />
              {errors.durationMinutes && (
                <p className="text-xs text-destructive">{errors.durationMinutes.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (NPR)</Label>
              <Input id="price" type="number" step="0.01" {...register("price")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax %</Label>
              <Input id="taxRate" type="number" step="0.01" {...register("taxRate")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={2} {...register("description")} />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">
                Inactive services can't be booked or billed.
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={(v) => setValue("isActive", v)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Save changes" : "Create service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
