'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import Link from 'next/link';

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="container">
      <header className="text-center mb-4">
        <h1 style={{ fontSize: '3rem', background: 'linear-gradient(90deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '2rem 0' }}>
          MCQ Quiz Master
        </h1>
        <p className="muted-foreground">Lấy dữ liệu từ Google Sheets, đăng nhập Google và làm bài trắc nghiệm chuyên nghiệp.</p>

        {session && (
          <div className="flex" style={{ justifyContent: 'center', marginTop: '1rem' }}>
            <p>Xin chào, <strong>{session.user?.name}</strong>!</p>
            <button className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', backgroundColor: 'var(--border)', color: 'var(--foreground)' }} onClick={() => signOut()}>Đăng xuất</button>
          </div>
        )}
      </header>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginTop: '3rem' }}>
        <div className="card glass">
          <h3>Sẵn sàng bắt đầu?</h3>
          <p className="muted-foreground mb-4">Đăng nhập bằng tài khoản Google của bạn để bắt đầu làm bài trắc nghiệm và lưu kết quả.</p>

          {session ? (
            <Link href="/quiz">
              <button className="btn-primary" style={{ width: '100%' }}>Bắt đầu làm bài ngay</button>
            </Link>
          ) : (
            <div className="grid" style={{ gap: '0.5rem' }}>
              <button className="btn-primary" style={{ width: '100%' }} onClick={() => signIn('google')}>
                Đăng nhập với Google
              </button>
              <Link href="/quiz" style={{ width: '100%' }}>
                <button className="btn-primary" style={{ width: '100%', backgroundColor: 'var(--secondary)' }}>
                  Chạy thử nhanh (Không cần đăng nhập)
                </button>
              </Link>
            </div>
          )}
        </div>

        <div className="card">
          <h3>Tính năng chính</h3>
          <ul style={{ listStyleType: 'none', padding: '1rem 0' }}>
            <li style={{ marginBottom: '0.5rem' }}>✅ Đảo câu hỏi & đáp án</li>
            <li style={{ marginBottom: '0.5rem' }}>✅ Cài đặt thời gian làm bài</li>
            <li style={{ marginBottom: '0.5rem' }}>✅ Tự động nộp bài khi hết giờ</li>
            <li style={{ marginBottom: '0.5rem' }}>✅ Đồng bộ điểm số với Google Sheets</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
