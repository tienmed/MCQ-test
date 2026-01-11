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
    } catch (error: any) {
        console.error('API GET Error:', error.message);
        return NextResponse.json({ error: error.message || 'Lỗi không xác định khi tải dữ liệu' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    // Bỏ qua kiểm tra session để chạy thử
    // const session = await auth();
    // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sheetId = process.env.GOOGLE_SHEET_ID || 'mock-id';
    try {
        const result = await req.json();
        await saveQuizResult(sheetId, result);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('API POST Error:', error.message);
        return NextResponse.json({ error: error.message || 'Lỗi khi lưu kết quả' }, { status: 500 });
    }
}
