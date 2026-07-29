import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Read-only star rating display. `value` may be fractional (e.g. 4.3). */
export function StarRating({
  value,
  size = 16,
  className,
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  const rounded = Math.round(value * 2) / 2; // nearest half
  return (
    <div className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = rounded >= i;
        const half = !filled && rounded >= i - 0.5;
        return (
          <span key={i} className="relative" style={{ width: size, height: size }}>
            <Star className="absolute text-muted-foreground/30" style={{ width: size, height: size }} />
            {(filled || half) && (
              <span
                className="absolute overflow-hidden"
                style={{ width: half ? size / 2 : size, height: size }}
              >
                <Star
                  className="fill-amber-500 text-amber-500"
                  style={{ width: size, height: size }}
                />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
