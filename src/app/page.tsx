'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Question, QuizSettings } from '@/types/quiz';

export default function Home() {
  const { data: session } = useSession();
  const [quizInfo, setQuizInfo] = useState<{ settings: QuizSettings, count: number } | null>(null);
  const [restriction, setRestriction] = useState<{ error: string, alreadyCompleted?: boolean } | null>(null);

  useEffect(() => {
    async function fetchInfo() {
      try {
        const userEmail = session?.user?.email || '';
        const res = await fetch(`/api/quiz?email=${encodeURIComponent(userEmail)}`);
        const data = await res.json();

        if (res.ok) {
          setQuizInfo({
            settings: data.settings,
            count: data.questions.length
          });
          setRestriction(null);
        } else if (res.status === 403) {
          setRestriction({ error: data.error, alreadyCompleted: data.alreadyCompleted });
          if (data.settings) {
            setQuizInfo({ settings: data.settings, count: 0 }); // Or handle appropriately
          }
        }
      } catch (e) {
        console.error("Failed to fetch quiz info", e);
      }
    }
    fetchInfo();
  }, [session]);

  const isRestricted = !!restriction;

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', minHeight: '90vh' }}>
      <div style={{ flex: 1 }}>
        <header className="text-center mb-4">
          <h1 style={{ fontSize: '3rem', background: 'linear-gradient(90deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '2rem 0' }}>
            MCQ Quiz Master
          </h1>
          <p className="muted-foreground">Lấy dữ liệu từ Google Sheets, đăng nhập Google và làm bài trắc nghiệm chuyên nghiệp.</p>

          {session && (
            <div className="flex" style={{ justifyContent: 'center', marginTop: '1rem' }}>
              <p>Xin chào, <strong>{session.user?.name}</strong>!</p>
              <button className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', backgroundColor: 'var(--border)', color: 'var(--foreground)', marginLeft: '10px' }} onClick={() => signOut()}>Đăng xuất</button>
            </div>
          )}
        </header>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginTop: '3rem' }}>
          <div className="card glass">
            <h3>Sẵn sàng bắt đầu?</h3>
            <p className="muted-foreground mb-4">
              {restriction?.error || 'Đăng nhập bằng tài khoản Google của bạn để bắt đầu làm bài trắc nghiệm và lưu kết quả.'}
            </p>

            {session ? (
              <Link href={isRestricted ? "#" : "/quiz"}>
                <button
                  className="btn-primary"
                  style={{ width: '100%', opacity: isRestricted ? 0.5 : 1, cursor: isRestricted ? 'not-allowed' : 'pointer' }}
                  disabled={isRestricted}
                >
                  {restriction?.alreadyCompleted ? 'Bạn đã hoàn thành bài thi' : isRestricted ? 'Chưa đến giờ làm bài' : 'Bắt đầu làm bài ngay'}
                </button>
              </Link>
            ) : (
              <div className="grid" style={{ gap: '0.5rem' }}>
                <button className="btn-primary" style={{ width: '100%' }} onClick={() => signIn('google')}>
                  Đăng nhập với Google
                </button>
              </div>
            )}
          </div>

          <div className="card">
            <h3>Tính năng MCQ</h3>
            <ul style={{ listStyleType: 'none', padding: '1rem 0' }}>
              <li style={{ marginBottom: '0.8rem' }}>
                ✅ <strong>Câu hỏi:</strong> {quizInfo ? `Lấy ${quizInfo.settings.questionCount || quizInfo.count} câu ngẫu nhiên` : 'Đang tải...'}
              </li>
              <li style={{ marginBottom: '0.8rem' }}>
                ✅ <strong>Thời gian làm bài:</strong> {quizInfo ? `${quizInfo.settings.durationMinutes} phút` : 'Đang tải...'}
              </li>
              <li style={{ marginBottom: '0.8rem' }}>
                ✅ <strong>Chế độ:</strong> {quizInfo ? (quizInfo.settings.mode === 'Study' ? 'Ôn tập (Hiện giải thích)' : 'Thi cử (Bảo mật 1 lần duy nhất)') : 'Đang tải...'}
              </li>
              {quizInfo?.settings.availableFrom && (
                <li style={{ marginBottom: '0.8rem' }}>
                  📅 <strong>Bắt đầu:</strong> {quizInfo.settings.availableFrom}
                </li>
              )}
              {quizInfo?.settings.availableUntil && (
                <li style={{ marginBottom: '0.8rem' }}>
                  ⏳ <strong>Kết thúc:</strong> {quizInfo.settings.availableUntil}
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <footer style={{ marginTop: 'auto', padding: '2rem 0', textAlign: 'center', borderTop: '1px solid var(--border)', opacity: 0.7, fontSize: '0.9rem' }}>
        <p>Đây là sáng kiến cải tiến của <strong>BS Tiến</strong> (bstien@pnt.edu.vn), năm 2026</p>
        <p style={{ fontSize: '0.7rem', marginTop: '0.5rem' }}>Power by Antigravity AI Engine</p>
      </footer>
    </div>
  );
}
