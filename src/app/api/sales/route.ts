import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { studentId, productId, quantity } = body

        if (!studentId || !productId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const sale = await prisma.salesRecord.create({
            data: {
                studentId,
                productId,
                quantity: Number(quantity) || 1
            }
        })
        return NextResponse.json(sale)
    } catch (error) {
        console.error('Sales create error:', error)
        return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 })
    }
}
