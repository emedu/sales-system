"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DateRangePickerProps {
    from?: string;
    to?: string;
    onRangeChange: (from?: string, to?: string) => void;
    className?: string;
}

export function DateRangePicker({
    from,
    to,
    onRangeChange,
    className,
}: DateRangePickerProps) {
    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[300px] justify-start text-left font-normal",
                            !from && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {from ? (
                            to ? (
                                <>
                                    {from} ~ {to}
                                </>
                            ) : (
                                from
                            )
                        ) : (
                            <span>選擇日期範圍</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">自訂篩選區間</h4>
                            <p className="text-sm text-muted-foreground">
                                設定開始與結束日期以過濾數據
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <div className="grid grid-cols-3 items-center gap-4">
                                <Label htmlFor="from">從</Label>
                                <Input
                                    id="from"
                                    type="date"
                                    value={from || ""}
                                    className="col-span-2 h-8"
                                    onChange={(e) => onRangeChange(e.target.value, to)}
                                />
                            </div>
                            <div className="grid grid-cols-3 items-center gap-4">
                                <Label htmlFor="to">至</Label>
                                <Input
                                    id="to"
                                    type="date"
                                    value={to || ""}
                                    className="col-span-2 h-8"
                                    onChange={(e) => onRangeChange(from, e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRangeChange(undefined, undefined)}
                            >
                                重設
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
