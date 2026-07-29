"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

/** Inline "leave a review" control shown on a completed, un-reviewed booking. */
export function ReviewForm({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [hover, setHover] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function submit() {
    if (rating < 1) {
      toast({ title: "Pick a star rating", variant: "error" });
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/reviews", {
        method: "POST",
        body: JSON.stringify({ appointmentId, rating, comment }),
      });
      toast({ title: "Thanks for your review!", variant: "success" });
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast({
        title: "Couldn't submit review",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Star className="size-4" />
        Leave a review
      </Button>
    );
  }

  return (
    <div className="w-full space-y-3 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${i} star${i > 1 ? "s" : ""}`}
          >
            <Star
              className={cn(
                "size-6 transition-colors",
                (hover || rating) >= i ? "fill-amber-500 text-amber-500" : "text-muted-foreground/40",
              )}
            />
          </button>
        ))}
      </div>
      <Textarea
        rows={2}
        placeholder="Tell others about your experience (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={saving}>
          Cancel
        </Button>
        <Button size="sm" onClick={submit} disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          Submit
        </Button>
      </div>
    </div>
  );
}
