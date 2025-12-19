"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

type Student = {
    id: string
    studentId: string
    name: string
    phone: string | null
}

type Product = {
    id: string
    name: string
    price: number
}

export function SalesForm() {
    const [students, setStudents] = useState<Student[]>([])
    const [products, setProducts] = useState<Product[]>([])

    // Selection States
    const [selectedStudentId, setSelectedStudentId] = useState("")
    const [selectedProductId, setSelectedProductId] = useState("")
    const [quantity, setQuantity] = useState("1")
    const [loading, setLoading] = useState(false)
    const [studentOpen, setStudentOpen] = useState(false)

    useEffect(() => {
        // Load initial data
        const fetchData = async () => {
            const [sRes, pRes] = await Promise.all([
                fetch('/api/students'),
                fetch('/api/products')
            ])
            const sData = await sRes.json()
            const pData = await pRes.json()
            setStudents(sData)
            setProducts(pData)
        }
        fetchData()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedStudentId || !selectedProductId) {
            toast.error("請選擇學生和課程")
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: selectedStudentId,
                    productId: selectedProductId,
                    quantity: Number(quantity)
                })
            })

            if (res.ok) {
                toast.success("成交紀錄已新增")
                // Reset form partial
                setSelectedProductId("")
                setQuantity("1")
            } else {
                toast.error("新增失敗")
            }
        } catch (err) {
            toast.error("系統錯誤")
        } finally {
            setLoading(false)
        }
    }

    // Find selected student name for display
    const selectedStudent = students.find(s => s.id === selectedStudentId)

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>新增成交紀錄</CardTitle>
                <CardDescription>請輸入學生與購買課程資料</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="space-y-2 flex flex-col">
                        <Label>學生 (Student)</Label>
                        <Popover open={studentOpen} onOpenChange={setStudentOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={studentOpen}
                                    className="w-full justify-between"
                                >
                                    {selectedStudentId
                                        ? students.find((s) => s.id === selectedStudentId)?.name + ` (${students.find((s) => s.id === selectedStudentId)?.studentId})`
                                        : "搜尋學生..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0">
                                <Command>
                                    <CommandInput placeholder="輸入姓名或學號..." />
                                    <CommandList>
                                        <CommandEmpty>找不到學生</CommandEmpty>
                                        <CommandGroup>
                                            {students.map((student) => (
                                                <CommandItem
                                                    key={student.id}
                                                    value={student.name + " " + student.studentId}
                                                    onSelect={(currentValue) => {
                                                        setSelectedStudentId(student.id)
                                                        setStudentOpen(false)
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedStudentId === student.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {student.name} ({student.studentId})
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <Label>課程 (Course)</Label>
                        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                            <SelectTrigger>
                                <SelectValue placeholder="選擇課程" />
                            </SelectTrigger>
                            <SelectContent>
                                {products.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name} (${p.price})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>數量 (Quantity)</Label>
                        <Input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={e => setQuantity(e.target.value)}
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "處理中..." : "送出紀錄 (Submit)"}
                    </Button>

                </form>
            </CardContent>
        </Card>
    )
}
