import { NextRequest, NextResponse } from 'next/server';
import { getQuizData, saveQuizResult } from '@/lib/sheets';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
    // Bỏ qua kiểm tra session để chạy thử
    // const session = await auth();
    // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sheetId = process.env.GOOGLE_SHEET_ID || 'mock-id';
    try {
        const data = await getQuizData(sheetId);
        return NextResponse.json(data);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    // Bỏ qua kiểm tra session để chạy thử
    // const session = await auth();
    // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sheetId = process.env.GOOGLE_SHEET_ID || 'mock-id';
    const result = await req.json();
    try {
        await saveQuizResult(sheetId, result);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }
}
