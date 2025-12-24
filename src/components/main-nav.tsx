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
                href="/dashboard"
                className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
                )}
            >
                戰情儀表板 (Dashboard)
            </Link>
            <Link
                href="/funnel"
                className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === "/funnel" ? "text-primary" : "text-muted-foreground"
                )}
            >
                銷售漏斗 (Funnel)
            </Link>
            <Link
                href="/funnel/performance"
                className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === "/funnel/performance" ? "text-primary" : "text-muted-foreground"
                )}
            >
                績效分析 (Performance)
            </Link>
            <Link
                href="/funnel/update"
                className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === "/funnel/update" ? "text-primary" : "text-muted-foreground"
                )}
            >
                進度回報 (Update)
            </Link>
        </nav>
    )
}
