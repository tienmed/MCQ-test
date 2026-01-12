import { NextRequest, NextResponse } from 'next/server';
import { getQuizData, saveQuizResult, getUserAttempts, getAllowlist } from '@/lib/sheets';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const sheetId = process.env.GOOGLE_SHEET_ID || 'mock-id';

    try {
        const data = await getQuizData(sheetId);
        const { settings } = data;
        const now = new Date();

        // 1. Check Allowlist (Only if enabled)
        if (settings.allowlistEnabled && email) {
            const allowlist = await getAllowlist(sheetId);
            if (allowlist.length > 0 && !allowlist.includes(email.toLowerCase())) {
                return NextResponse.json({
                    error: `Email (${email}) không có trong danh sách được phép tham gia. Vui lòng liên hệ BS Tiến.`,
                    isRestricted: true
                }, { status: 403 });
            }
        }

        // 2. Check availability window (Only if values are present and not empty)
        if (settings.availableFrom && settings.availableFrom.trim() !== '') {
            const fromDate = new Date(settings.availableFrom);
            if (!isNaN(fromDate.getTime()) && now < fromDate) {
                return NextResponse.json({
                    error: `Bài thi chưa mở. Sẽ bắt đầu vào: ${settings.availableFrom}`,
                    isRestricted: true
                }, { status: 403 });
            }
        }

        if (settings.availableUntil && settings.availableUntil.trim() !== '') {
            const untilDate = new Date(settings.availableUntil);
            if (!isNaN(untilDate.getTime()) && now > untilDate) {
                return NextResponse.json({
                    error: `Bài thi đã kết thúc vào: ${settings.availableUntil}`,
                    isRestricted: true
                }, { status: 403 });
            }
        }

        // 3. Check attempt limit (only for Exam mode)
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

        // Safety checks
        const data = await getQuizData(sheetId);

        // 1. Check Allowlist (Only if enabled)
        if (data.settings.allowlistEnabled) {
            const allowlist = await getAllowlist(sheetId);
            if (allowlist.length > 0 && !allowlist.includes(result.userEmail.toLowerCase())) {
                throw new Error('Email của bạn không có quyền nộp bài.');
            }
        }

        // 2. Re-verify attempt limit server-side for safety
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
