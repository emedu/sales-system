import { NextResponse } from 'next/server'
import { getProducts } from '@/lib/google-sheets'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const products = await getProducts()
        return NextResponse.json(products)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }
}
