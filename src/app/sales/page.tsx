import { SalesForm } from "@/components/sales-form"

export default function SalesPage() {
    return (
        <div className="container py-10">
            <div className="flex flex-col items-center gap-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight">成交回報系統</h1>
                    <p className="text-muted-foreground mt-2">請業務同仁輸入成交紀錄</p>
                </div>
                <SalesForm />
            </div>
        </div>
    )
}
