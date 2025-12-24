import { NextResponse } from 'next/server';
import { getFunnelAnalytics } from '@/lib/google-sheets';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from') || undefined;
        const to = searchParams.get('to') || undefined;

        const analytics = await getFunnelAnalytics({ from, to });
        return NextResponse.json(analytics);
    } catch (error) {
        console.error('Error fetching funnel analytics:', error);
        return NextResponse.json({ error: 'Failed to fetch funnel analytics' }, { status: 500 });
    }
}
