import { NextRequest, NextResponse } from 'next/server';
import { getQuizData, saveQuizResult, getUserAttempts } from '@/lib/sheets';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const sheetId = process.env.GOOGLE_SHEET_ID || 'mock-id';

    try {
        const data = await getQuizData(sheetId);
        const { settings } = data;
        const now = new Date();

        // 1. Check availability window
        if (settings.availableFrom && now < new Date(settings.availableFrom)) {
            return NextResponse.json({
                error: `Bài thi chưa mở. Sẽ bắt đầu vào: ${settings.availableFrom}`,
                isRestricted: true
            }, { status: 403 });
        }
        if (settings.availableUntil && now > new Date(settings.availableUntil)) {
            return NextResponse.json({
                error: `Bài thi đã kết thúc vào: ${settings.availableUntil}`,
                isRestricted: true
            }, { status: 403 });
        }

        // 2. Check attempt limit (only for Exam mode)
        if (settings.mode === 'Exam' && email) {
            const attempts = await getUserAttempts(sheetId, email);
            if (attempts >= 1) {
                return NextResponse.json({
                    error: 'Bạn đã hoàn thành bài thi này. Mỗi người chỉ được tham gia 1 lần.',
                    isRestricted: true,
                    alreadyCompleted: true
                }, { status: 403 });
            }
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('API GET Error:', error.message);
        return NextResponse.json({ error: error.message || 'Lỗi không xác định khi tải dữ liệu' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const sheetId = process.env.GOOGLE_SHEET_ID || 'mock-id';
    try {
        const result = await req.json();

        // Re-verify attempt limit server-side for safety
        const data = await getQuizData(sheetId);
        if (data.settings.mode === 'Exam') {
            const attempts = await getUserAttempts(sheetId, result.userEmail);
            if (attempts >= 1) {
                throw new Error('Bạn đã nộp bài rồi, không thể nộp thêm.');
            }
        }

        await saveQuizResult(sheetId, result);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('API POST Error:', error.message);
        return NextResponse.json({ error: error.message || 'Lỗi khi lưu kết quả' }, { status: 500 });
    }
}
