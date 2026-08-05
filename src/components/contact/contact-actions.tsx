"use client";

import * as React from "react";
import { Phone, Mail, MessageCircle, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/** Strip a phone number down to digits (and a leading +) for tel:/wa.me/viber links. */
function normalizePhone(raw: string) {
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^0-9]/g, "");
  return { display: raw, e164: (hasPlus ? "+" : "") + digits, digits };
}

/**
 * Phone contact with quick actions: Call, WhatsApp, Viber.
 * Renders a small dropdown so staff can reach a client the way that suits them.
 */
export function PhoneActions({
  phone,
  className,
  compact,
}: {
  phone: string;
  className?: string;
  compact?: boolean;
}) {
  const { display, e164, digits } = normalizePhone(phone);
  // WhatsApp / Viber expect the number without a leading "+".
  const waNumber = e164.replace(/^\+/, "");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md text-sm transition-colors hover:text-primary",
          className,
        )}
      >
        <Phone className="size-3.5" />
        {!compact && <span>{display}</span>}
        <ChevronDown className="size-3 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuItem asChild>
          <a href={`tel:${e164}`}>
            <Phone className="size-4" />
            Call
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="size-4 text-emerald-600" />
            WhatsApp
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`viber://chat?number=%2B${digits}`}>
            <MessageCircle className="size-4 text-purple-600" />
            Viber
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Email contact that opens the user's mail client. */
export function EmailAction({
  email,
  className,
  compact,
}: {
  email: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <a
      href={`mailto:${email}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md text-sm transition-colors hover:text-primary",
        className,
      )}
    >
      <Mail className="size-3.5" />
      {!compact && <span>{email}</span>}
    </a>
  );
}
