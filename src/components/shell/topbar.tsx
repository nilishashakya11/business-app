"use client";

import { signOut } from "next-auth/react";
import { Menu, Store, LogOut, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./theme-toggle";
import { useBranch } from "./branch-context";
import { initials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface TopbarProps {
  user: { name: string; email: string; role: string };
  onMenu: () => void;
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrator",
  MANAGER: "Manager",
  TEAM_MEMBER: "Team member",
};

export function Topbar({ user, onMenu }: TopbarProps) {
  const { branches, activeBranch, activeBranchId, setActiveBranchId } = useBranch();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md lg:px-6">
      <button
        onClick={onMenu}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      {/* Branch switcher */}
      {branches.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Store className="size-4 text-muted-foreground" strokeWidth={1.75} />
              <span className="max-w-[10rem] truncate">{activeBranch?.name ?? "Select branch"}</span>
              <ChevronDown className="size-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Branches</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {branches.map((b) => (
              <DropdownMenuItem
                key={b.id}
                onSelect={() => setActiveBranchId(b.id)}
                className="justify-between"
              >
                {b.name}
                <Check
                  className={cn(
                    "size-4 text-primary",
                    b.id === activeBranchId ? "opacity-100" : "opacity-0",
                  )}
                />
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-muted">
              <Avatar>
                <AvatarFallback>{initials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-tight">{user.name}</p>
                <p className="text-[11px] leading-tight text-muted-foreground">
                  {ROLE_LABEL[user.role] ?? user.role}
                </p>
              </div>
              <ChevronDown className="hidden size-3.5 opacity-60 sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span>{user.name}</span>
              <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => signOut({ callbackUrl: "/login" })}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
