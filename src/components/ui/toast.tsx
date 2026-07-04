"use client";

import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "error";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (opts: { title: string; description?: string; variant?: ToastVariant }) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const icons = {
  default: Info,
  success: CheckCircle2,
  error: AlertCircle,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const toast = React.useCallback(
    ({ title, description, variant = "default" }: { title: string; description?: string; variant?: ToastVariant }) => {
      const id = Math.random().toString(36).slice(2);
      setItems((prev) => [...prev, { id, title, description, variant }]);
    },
    [],
  );

  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitives.Provider swipeDirection="right" duration={4000}>
        {children}
        {items.map((item) => {
          const Icon = icons[item.variant];
          return (
            <ToastPrimitives.Root
              key={item.id}
              onOpenChange={(open) => !open && remove(item.id)}
              className={cn(
                "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border bg-card p-4 shadow-lg",
                "data-[state=open]:animate-fade-up data-[swipe=end]:animate-fade-in",
              )}
            >
              <Icon
                className={cn(
                  "mt-0.5 size-5 shrink-0",
                  item.variant === "success" && "text-success",
                  item.variant === "error" && "text-destructive",
                  item.variant === "default" && "text-muted-foreground",
                )}
              />
              <div className="flex-1">
                <ToastPrimitives.Title className="text-sm font-semibold">
                  {item.title}
                </ToastPrimitives.Title>
                {item.description && (
                  <ToastPrimitives.Description className="mt-1 text-sm text-muted-foreground">
                    {item.description}
                  </ToastPrimitives.Description>
                )}
              </div>
              <ToastPrimitives.Close className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100">
                <X className="size-4" />
              </ToastPrimitives.Close>
            </ToastPrimitives.Root>
          );
        })}
        <ToastPrimitives.Viewport className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-sm" />
      </ToastPrimitives.Provider>
    </ToastContext.Provider>
  );
}
