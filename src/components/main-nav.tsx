"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function MainNav({
    className,
    ...props
}: React.HTMLAttributes<HTMLElement>) {
    const pathname = usePathname()

    return (
        <nav
            className={cn("flex items-center space-x-4 lg:space-x-6", className)}
            {...props}
        >
            <Link
                href="/sales"
                className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === "/sales" ? "text-primary" : "text-muted-foreground"
                )}
            >
                成交回報 (Sales)
            </Link>
            <Link
                href="/dashboard"
                className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
                )}
            >
                戰情儀表板 (Dashboard)
            </Link>
        </nav>
    )
}
