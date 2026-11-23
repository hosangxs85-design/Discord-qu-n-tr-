# Trạng thái dự án — Discord Community Suite

Ngày cập nhật: 2026-11-23  
Phiên bản source: 6.0.0  
Nền tảng: Node.js 22+, TypeScript, discord.js v14, SQLite, pnpm 11.25.0.  
Cơ sở yêu cầu: bộ đặc tả gốc trong `docs/spec/` được giữ nguyên.

## Đã triển khai trong source 6.0.0

- Slash commands phân nhóm, có bản địa hóa tiếng Việt; tên kỹ thuật tuân theo giới hạn API Discord.
- `/thiết-lập` lưu kênh log, duyệt, chào mừng, tạm biệt, xác minh, sự kiện, sinh nhật; role xác minh/duyệt; mẫu chào/tạm biệt; múi giờ.
- Nhật ký metadata thành viên vào/rời, nickname/role, kênh/role, voice, ban/unban; sửa/xóa tin nhắn chỉ ghi metadata, không lưu nội dung.
- Báo cáo moderation vào hàng đợi người duyệt; không có đường tự ban/kick/timeout.
- CAPTCHA số học, role Chưa xác minh/Đã xác minh, cấp thủ công bởi người đủ quyền.
- Lịch sự kiện 30 ngày trước/30 ngày tới; tạo/hủy, RSVP, ISO timestamp có timezone, nhắc mặc định 24h/1h/10m.
- Thời tiết hiện tại theo thành phố qua Open-Meteo.
- Voice tạm: nhiều lobby, chủ phòng settings, quản trị settings, khóa/mở, ẩn/hiện, mã 16 ký tự, rate limit 5 lần/phút, xóa phòng trống sau tối thiểu 5 giây và không tính bot làm người giữ phòng.
- Sinh nhật opt-in: lưu tháng/ngày, không lưu năm; list/xóa đăng ký; lời chúc tại kênh cấu hình lúc 09:00 theo múi giờ server.
- Bình chọn 2–4 lựa chọn qua nút; mỗi thành viên một phiếu có thể đổi; người tạo hoặc Admin/Quản trị có thể đóng.
- Ticket riêng tư theo người mở, role/danh mục cấu hình, tối đa một ticket đang mở mỗi thành viên; đóng giữ kênh/lịch sử.
- FAQ theo server, quản trị tạo/sửa/gỡ; thành viên xem danh sách và tra cứu bằng slash command.
- SQLite migration cộng thêm; thêm 16 kiểm thử chính sách/regression.

## Chưa triển khai trong source

Sự kiện lặp lại/bình chọn thời gian, role tự chọn, bộ lọc nội dung có ngữ cảnh và chế độ quan sát, âm nhạc/radio, bảng xếp hạng voice, xuất transcript ticket, lưu log theo thời hạn và dashboard web vẫn là backlog. Chưa có ghi âm voice. Bot không tự sửa permission toàn bộ server; cấu hình CAPTCHA cần Admin kiểm tra quyền kênh thủ công.

## Kiểm chứng hiện tại

- `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm test`, `pnpm build`: ghi nhận trong `QA-REPORT.md`.
- SQLite smoke test chạy trên cơ sở dữ liệu tạm: tạo bảng v6.0, kiểm tra một phiếu/member và giới hạn ticket đang mở.
- Chưa đăng ký command lên Discord, chưa kết nối Gateway, chưa dùng token, chưa xác nhận role/channel permissions trên server thật.
- Chưa xác nhận cài đặt trên thiết bị Android/Termux của người dùng hoặc hosting 24/7.

## Cổng trước khi dùng server chính

1. Chạy kiểm tra/build sạch từ pnpm lockfile.
2. Tạo Discord Application/Bot và nhập token cục bộ; bật intents cần thiết.
3. Đăng ký slash commands vào server thử nghiệm.
4. Kiểm thử role/channels, hàng đợi kiểm duyệt, welcome, event reminders, birthday consent/schedule, poll, ticket private overwrites, FAQ, voice creation, backup/restore.
5. Chỉ chuyển sang server chính sau khi kiểm thử quyền và riêng tư.

## Bất biến an toàn

- Không commit `.env`, token, database/backup riêng tư.
- Không cấp Administrator mặc định.
- Không tự động ban, kick hoặc timeout.
- Không dùng Message Content Intent ở bản hiện tại.
- Sinh nhật là opt-in, chỉ lưu tháng/ngày và có lệnh xóa đăng ký.
- Ticket tạo kênh riêng, đóng không xóa lịch sử.
- Không đưa code lên server chính trước khi kiểm thử server thử nghiệm.
