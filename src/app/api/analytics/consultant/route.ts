import { NextResponse } from 'next/server';
import { getConsultantPerformance } from '@/lib/google-sheets';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from') || undefined;
        const to = searchParams.get('to') || undefined;

        const performance = await getConsultantPerformance({ from, to });
        return NextResponse.json(performance);
    } catch (error) {
        console.error('Error fetching consultant performance:', error);
        return NextResponse.json({ error: 'Failed to fetch consultant performance' }, { status: 500 });
    }
}
