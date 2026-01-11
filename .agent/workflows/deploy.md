---
description: Cách triển khai ứng dụng Google Sheets MCQ Web App lên server
---

# Hướng dẫn triển khai (Deployment Guide)

Để đưa ứng dụng này lên mạng (Production), bạn có hai lựa chọn phổ biến nhất cho dự án Next.js:

## Cách 1: Triển khai lên Vercel (Khuyên dùng - Nhanh nhất)
Vercel là nền tảng tối ưu nhất cho Next.js, hoàn toàn miễn phí cho cá nhân.

1.  Đưa mã nguồn của bạn lên GitHub/GitLab.
2.  Truy cập [vercel.com](https://vercel.com) và nhập dự án từ GitHub.
3.  Trong phần **Environment Variables**, hãy thêm tất cả các biến từ file `.env.local`:
    - `AUTH_SECRET`: Mã bí mật bạn tự tạo.
    - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Lấy từ Google Cloud Console.
    - `GOOGLE_SERVICE_ACCOUNT_KEY`: Copy toàn bộ nội dung file JSON của Service Account.
    - `GOOGLE_SHEET_ID`: ID của sheet bạn dùng.
    - `NEXTAUTH_URL`: Địa chỉ tên miền của bạn (ví dụ: `https://my-quiz-app.vercel.app`).
4.  Nhấn **Deploy**.

---

## Cách 2: Triển khai lên VPS (Ubuntu/CentOS...)
Nếu bạn dùng server riêng, hãy cài đặt **Node.js** và **PM2**.

1.  **Build ứng dụng**:
    // turbo
    ```powershell
    npm run build
    ```
2.  **Cấu hình môi trường**:
    Đảm bảo file `.env.production` hoặc các biến môi trường hệ thống đã có đủ thông tin như file `.env.local`.
3.  **Chạy với PM2**:
    ```bash
    pm2 start npm --name "mcq-app" -- start
    ```
4.  **Cấu hình Nginx**:
    Sử dụng Nginx làm Reverse Proxy để chuyển hướng port 80/443 về port 3000 của ứng dụng.

---

## Lưu ý quan trọng về Google Auth
Tại [Google Cloud Console](https://console.cloud.google.com/):
- Cập nhật **Authorized redirect URIs** thành: `https://your-domain.com/api/auth/callback/google`
- Đảm bảo **Google Sheets API** đã được kích hoạt (Enabled).
