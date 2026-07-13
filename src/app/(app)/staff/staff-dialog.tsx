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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";

const createSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  role: z.enum(["ADMIN", "MANAGER", "TEAM_MEMBER"]),
  commissionRate: z.coerce.number().min(0).max(100),
  color: z.string().optional(),
  password: z.string().min(8, "At least 8 characters").optional().or(z.literal("")),
});
type FormValues = z.infer<typeof createSchema>;

export interface StaffRecord {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  jobTitle: string | null;
  role: string;
  commissionRate: string | number;
  color: string | null;
}

const COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#ef4444", "#ec4899"];

export function StaffDialog({
  open,
  onOpenChange,
  staff,
  branchId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff?: StaffRecord | null;
  branchId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const editing = Boolean(staff);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(createSchema) });

  React.useEffect(() => {
    if (open) {
      reset({
        name: staff?.name ?? "",
        email: staff?.email ?? "",
        phone: staff?.phone ?? "",
        jobTitle: staff?.jobTitle ?? "",
        role: (staff?.role as FormValues["role"]) ?? "TEAM_MEMBER",
        commissionRate: staff ? Number(staff.commissionRate) : 0,
        color: staff?.color ?? COLORS[0],
        password: "",
      });
    }
  }, [open, staff, reset]);

  async function onSubmit(values: FormValues) {
    try {
      if (editing) {
        await apiFetch(`/api/staff/${staff!.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: values.name,
            phone: values.phone,
            jobTitle: values.jobTitle,
            role: values.role,
            commissionRate: values.commissionRate,
            color: values.color,
          }),
        });
      } else {
        await apiFetch("/api/staff", {
          method: "POST",
          body: JSON.stringify({ ...values, branchId }),
        });
      }
      toast({ title: editing ? "Staff updated" : "Staff added", variant: "success" });
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

  const role = watch("role");
  const color = watch("color");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit team member" : "New team member"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update this team member's details."
              : "Create a login and staff profile for this branch."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" disabled={editing} {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job title</Label>
              <Input id="jobTitle" {...register("jobTitle")} placeholder="Senior Stylist" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commissionRate">Commission %</Label>
              <Input
                id="commissionRate"
                type="number"
                step="0.01"
                {...register("commissionRate")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setValue("role", v as FormValues["role"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEAM_MEMBER">Team member</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Calendar color</Label>
              <div className="flex items-center gap-2 pt-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setValue("color", c)}
                    className="size-6 rounded-full ring-offset-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      outline: color === c ? `2px solid ${c}` : "none",
                    }}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {!editing && (
            <div className="space-y-2">
              <Label htmlFor="password">Temporary password</Label>
              <Input
                id="password"
                type="text"
                placeholder="Leave blank for Password123!"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Save changes" : "Add team member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
