'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Student {
    id: string;
    studentId: string;
    name: string;
    phone?: string;
}

interface FunnelRecord {
    studentId: string;
    currentStage: string;
    mainCourse: string;
    consultant: string;
}

export default function FunnelUpdatePage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState("");
    const [studentOpen, setStudentOpen] = useState(false);
    const [funnelData, setFunnelData] = useState<FunnelRecord | null>(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form states
    const [targetStage, setTargetStage] = useState("");
    const [mainCourse, setMainCourse] = useState("");
    const [notes, setNotes] = useState("");
    const [amount, setAmount] = useState("");

    const STAGES = [
        '1. 首次洽詢',
        '2.1 聯繫成功',
        '2.2 聯繫失敗',
        '3.1 邀約成功',
        '3.2 邀約失敗',
        '4.1 到訪成功',
        '4.2 未到訪',
        '5. 成交'
    ];

    const COURSES = ['美丙', '美乙', '髮丙', '造型', '美甲', '紋繡', 'SPA', '除毛', '美睫', '刺青', '美醫', '個彩'];

    useEffect(() => {
        fetch('/api/students').then(res => res.json()).then(setStudents);
    }, []);

    useEffect(() => {
        if (selectedStudentId) {
            setLoading(true);
            fetch(`/api/student/${selectedStudentId}/stage`)
                .then(res => res.json())
                .then(data => {
                    setFunnelData(data);
                    setMainCourse(data?.mainCourse || "");
                    // Suggest next logical stage? For now just stay blank
                })
                .finally(() => setLoading(false));
        }
    }, [selectedStudentId]);

    const handleUpdate = async () => {
        if (!selectedStudentId || !targetStage) {
            toast.error("請選擇學生與目標階段");
            return;
        }

        setSubmitting(true);
        try {
            // 1. Update Funnel Stage
            const funnelRes = await fetch(`/api/student/${selectedStudentId}/stage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    stage: targetStage,
                    mainCourse: mainCourse,
                    notes: notes,
                    conversionAmount: targetStage === '5. 成交' ? Number(amount) : undefined
                })
            });

            if (!funnelRes.ok) throw new Error("Funnel update failed");

            // 2. If Transition to Stage 5, also create a Sales Record
            if (targetStage === '5. 成交') {
                await fetch('/api/sales', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        studentId: selectedStudentId,
                        productId: mainCourse, // Using main course as product id
                        quantity: 1
                    })
                });
            }

            toast.success("進度更新成功");
            // Reset or Refresh
            setSelectedStudentId("");
            setTargetStage("");
            setNotes("");
            setAmount("");
        } catch (err) {
            console.error(err);
            toast.error("更新過程中發生錯誤");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-6">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">銷售漏斗進度回報</h2>
                <p className="text-muted-foreground">
                    搜尋學員並更新其目前的洽詢階段
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>1. 選擇學員 (Search Student)</CardTitle>
                </CardHeader>
                <CardContent>
                    <Popover open={studentOpen} onOpenChange={setStudentOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between h-12 text-lg"
                            >
                                {selectedStudentId
                                    ? students.find((s) => s.id === selectedStudentId)?.name + ` (${selectedStudentId})`
                                    : "🔍 輸入姓名或學號搜尋..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="搜尋姓名或學號..." />
                                <CommandList>
                                    <CommandEmpty>找不到學員</CommandEmpty>
                                    <CommandGroup>
                                        {students.map((s) => (
                                            <CommandItem
                                                key={s.id}
                                                value={s.name + " " + s.studentId}
                                                onSelect={() => {
                                                    setSelectedStudentId(s.id);
                                                    setStudentOpen(false);
                                                }}
                                            >
                                                <Check className={cn("mr-2 h-4 w-4", selectedStudentId === s.id ? "opacity-100" : "opacity-0")} />
                                                <div className="flex flex-col">
                                                    <span>{s.name}</span>
                                                    <span className="text-xs text-muted-foreground">學號: {s.studentId}</span>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </CardContent>
            </Card>

            {selectedStudentId && (
                <Card className="animate-in fade-in slide-in-from-top-4 duration-300">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            2. 更新狀態
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        </CardTitle>
                        {funnelData && (
                            <div className="mt-2 p-3 bg-secondary/50 rounded-lg text-sm">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>目前階段: <span className="font-bold">{funnelData.currentStage || "無"}</span></div>
                                    <div>主洽課程: <span className="font-bold">{funnelData.mainCourse || "尚未設定"}</span></div>
                                </div>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>目標階段 (Target Stage)</Label>
                            <Select value={targetStage} onValueChange={setTargetStage}>
                                <SelectTrigger className="h-12 text-lg">
                                    <SelectValue placeholder="選擇新階段..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {STAGES.map(s => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>主要洽詢課程 (Main Course)</Label>
                            <Select value={mainCourse} onValueChange={setMainCourse}>
                                <SelectTrigger>
                                    <SelectValue placeholder="選擇課程..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {COURSES.map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {targetStage === '5. 成交' && (
                            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-4 animate-in zoom-in-95 duration-200">
                                <h4 className="font-bold text-primary flex items-center gap-2">
                                    💰 成交回報資訊 (Sales Report)
                                </h4>
                                <div className="space-y-2">
                                    <Label>成交金額 (Amount)</Label>
                                    <Input
                                        type="number"
                                        placeholder="請輸入成交金額"
                                        className="h-10 text-lg"
                                        value={amount}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>備註 (Notes)</Label>
                            <Textarea
                                placeholder="輸入互動細節..."
                                value={notes}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                            />
                        </div>

                        <Button
                            className="w-full h-12 text-lg font-bold"
                            size="lg"
                            disabled={submitting}
                            onClick={handleUpdate}
                        >
                            {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "確認送出 (Confirm Update)"}
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
