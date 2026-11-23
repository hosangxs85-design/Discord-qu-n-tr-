# Kết nối GitHub và quản lý dự án bằng Android

## Trạng thái

Đây là bộ source đã chuẩn bị để đưa lên GitHub. Repository chưa được tạo hoặc cập nhật tự động vì tài khoản GitHub chưa được kết nối với ChatGPT trong phiên làm việc này.

## Kết nối an toàn

1. Mở phần kết nối ứng dụng trong ChatGPT và chọn GitHub.
2. Đăng nhập trên trang GitHub chính thức.
3. Chỉ cấp quyền cho repository dự án khi có thể chọn phạm vi repository.
4. Không gửi mật khẩu, mã OTP, Personal Access Token hoặc recovery code trong cuộc trò chuyện.
5. Sau khi kết nối, yêu cầu trợ lý kiểm tra repository hiện có trước khi tạo mới hoặc ghi đè.

## Tạo repository lần đầu nếu chưa có

- Tên gợi ý: `discord-community-suite`.
- Visibility: **Private** trong giai đoạn phát triển.
- Không khởi tạo README/license/gitignore khác nếu đang upload bộ source đã có sẵn.
- Đưa toàn bộ nội dung thư mục gốc đã giải nén từ ZIP 6.0.0 lên repository.
- Nhánh mặc định: `main`.

## Bật bảo vệ nhánh

Trong Settings → Branches / Rulesets, tạo quy tắc cho `main`:
- Require a pull request before merging.
- Require status checks; chọn job `verify` sau lần CI đầu tiên.
- Block force pushes.
- Không cho xóa nhánh mặc định.

## CI tự động

Workflow `.github/workflows/ci.yml` chạy khi push/PR vào `main` và khi chạy thủ công. Nó cài dependencies rồi chạy typecheck, tests và build. Kết quả build được lưu thành artifact 7 ngày.

## Quan trọng

GitHub Actions là CI, không phải hosting bot 24/7. Không dùng runner GitHub làm tiến trình Gateway chạy thường trực. Triển khai production cần một máy chủ/host riêng có tiến trình nền và persistent storage cho SQLite, hoặc chuyển sang PostgreSQL theo kiến trúc đã chọn.
