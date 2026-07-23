"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Full-page form scaffold used by the "add / edit" flows (Fresha-style).
 *
 * A sticky top bar keeps the title and the primary/secondary actions in view
 * no matter how long the form is, and the body scrolls independently — so the
 * submit button can never be pushed off-screen the way it was in the old
 * modal dialogs.
 *
 * `backHref` is where Cancel / the close button navigates to. If omitted the
 * shell falls back to `router.back()`.
 */
export function FormPageShell({
  title,
  description,
  backHref,
  actions,
  children,
}: {
  title: string;
  description?: string;
  backHref?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const router = useRouter();

  const goBack = React.useCallback(() => {
    if (backHref) router.push(backHref);
    else router.back();
  }, [backHref, router]);

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
      <header className="flex items-center gap-4 border-b px-4 py-3 sm:px-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={goBack}
          aria-label="Close"
          className="shrink-0"
        >
          <X className="size-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-lg font-semibold tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="truncate text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>

      <div className="flex-1 overflow-y-auto scroll-thin">
        <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
      </div>
    </div>
  );
}
