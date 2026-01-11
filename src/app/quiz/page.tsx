'use client';

import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import Quiz from '@/components/Quiz';
import { Question, QuizSettings, QuizResult } from '@/types/quiz';
import { redirect } from 'next/navigation';

export default function QuizPage() {
    const { data: session, status } = useSession();
    const [data, setData] = useState<{ questions: Question[], settings: QuizSettings } | null>(null);
    const [result, setResult] = useState<QuizResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        // Tắt chuyển hướng để cho phép chạy thử không cần đăng nhập
        // if (status === 'unauthenticated') {
        //   redirect('/');
        // }
    }, [status]);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch('/api/quiz');
                const quizData = await res.json();

                if (!res.ok) {
                    throw new Error(quizData.error || 'Failed to fetch');
                }

                setData(quizData);
            } catch (error: any) {
                console.error("Failed to load quiz data", error);
                setErrorMsg(error.message);
            } finally {
                setLoading(false);
            }
        }
        // Cho phép load dữ liệu ngay cả khi chưa login (cho mục đích chạy thử)
        load();
    }, [status]);

    const handleComplete = async (quizResult: QuizResult) => {
        setResult(quizResult);
        try {
            await fetch('/api/quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(quizResult),
            });
        } catch (error) {
            console.error("Failed to save result", error);
        }
    };

    if (status === 'loading' || loading) return <div className="container text-center"><h2>Đang tải bài thi...</h2></div>;
    if (errorMsg) return <div className="container text-center"><h2 style={{ color: 'var(--secondary)' }}>Lỗi: {errorMsg}</h2><button className="btn-primary mt-4" onClick={() => window.location.reload()}>Thử lại</button></div>;
    if (!data) return <div className="container text-center"><h2>Lỗi không xác định khi tải dữ liệu.</h2></div>;

    const displayUser = session?.user || { name: 'Thí sinh Thử nghiệm', email: 'test@example.com' };

    if (result) {
        return (
            <div className="container" style={{ maxWidth: '600px', textAlign: 'center' }}>
                <h1 className="mb-4">Kết Quả</h1>
                <div className="card glass">
                    <div style={{ fontSize: '4rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                        {result.score} / {result.totalQuestions}
                    </div>
                    <p className="muted-foreground">Bạn đã hoàn thành bài thi.</p>
                    <div className="mt-4" style={{ textAlign: 'left', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                        <p><strong>Người làm:</strong> {result.userName}</p>
                        <p><strong>Email:</strong> {result.userEmail}</p>
                        <p><strong>Bắt đầu:</strong> {new Date(result.startTime).toLocaleTimeString()}</p>
                        <p><strong>Kết thúc:</strong> {new Date(result.endTime).toLocaleTimeString()}</p>
                    </div>
                </div>
                <button className="btn-primary mt-4" onClick={() => window.location.href = '/'}>Về trang chủ</button>
            </div>
        );
    }

    return (
        <Quiz
            questions={data.questions}
            settings={data.settings}
            user={{ name: displayUser.name || 'User', email: displayUser.email || '' }}
            onComplete={handleComplete}
        />
    );
}
