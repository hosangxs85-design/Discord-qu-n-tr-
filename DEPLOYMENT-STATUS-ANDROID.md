# Trạng thái triển khai Android — v6.0.0

## Đã chuẩn bị

- Hướng dẫn đưa ZIP vào Termux và script kiểm tra kiến trúc ARM64.
- Script cài Node.js LTS, toolchain native, pnpm đã ghim và dependency từ lockfile.
- Script chạy typecheck, tests và build trước khi khởi động.
- Script đăng ký slash commands vào guild thử nghiệm và chạy bot.
- Script backup SQLite.
- Source có logging metadata, moderation review, xác minh, chào/tạm biệt, sự kiện, thời tiết, voice tạm, birthday opt-in, poll, ticket và FAQ.

## Chưa xác nhận

- Chưa chạy trên thiết bị Android/Termux của người dùng.
- Chưa xác nhận phiên bản Android, kiến trúc CPU hoặc khả năng cài native `better-sqlite3` trên thiết bị.
- Chưa nhập Discord Token, chưa đăng ký lệnh và chưa kết nối Discord Gateway thật.
- Chưa kiểm tra quyền channel/role và voice trên server thật.
- Chạy điện thoại không đảm bảo online 24/7; Android có thể dừng tiến trình nền.

## Cổng nghiệm thu

1. Chạy `bash scripts/termux-setup.sh` trong Termux; xử lý lỗi build native nếu có.
2. Nhập secret trực tiếp vào `.env` cục bộ, không gửi qua chat/GitHub.
3. Chạy `bash scripts/termux-start.sh` trên server thử nghiệm.
4. Xác nhận bot online, lệnh `/kiểm-tra` hoạt động, rồi kiểm thử review/verify/event/voice/weather/birthday/poll/ticket/FAQ.
5. Chỉ đánh dấu triển khai Android thành công sau khi tất cả bước trên được thực hiện trên thiết bị thật.
