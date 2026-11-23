# 09. Việc cần làm và câu hỏi cần chốt

## Quyết định cần có

1. Tên bot và phong cách giao diện (màu, biểu tượng, giọng văn).
2. Tên chính xác của hai role xác minh — đề xuất `Chưa xác minh` và `Đã xác minh`.
3. Role ID/nhóm quyền: Admin, Quản trị viên, Moderator, người tạo sự kiện, người duyệt.
4. Kênh ID: log, kiểm duyệt riêng, công khai (nếu có), chào mừng, CAPTCHA, nhạc/sự kiện.
5. Nhật ký tin nhắn: lưu nội dung, chỉ lưu metadata, hay tắt; thời hạn lưu theo từng nhóm.
6. Danh sách luật kiểm duyệt nghiêm trọng và allowlist; cách xử lý báo cáo không chắc chắn.
7. Danh sách 8 kênh lobby voice, category đích, mẫu tên, giới hạn và quyền mặc định.
8. Định nghĩa “phòng ẩn/khóa”: ai được mời, ai được phép nhập ID, và hành vi khóa khi có người đang ở phòng.
9. Cách thành viên đăng ký sinh nhật và mức công khai.
10. Múi giờ server; mốc nhắc sự kiện; quy tắc lặp.
11. Nhà cung cấp thời tiết và nguồn nhạc/radio được phép.
12. Nơi chạy bot, database, ngân sách vận hành, quy trình backup.
13. Có cần giới hạn số yêu cầu nhạc, poll, ticket hoặc báo cáo theo thành viên không.
14. Dashboard web ở giai đoạn sau: domain, branding và nhóm người được phép cấu hình.

## Backlog đề xuất

### Ưu tiên P0
- Setup và permission model.
- Nhật ký nền tảng và kênh kiểm duyệt.
- Quy trình đề xuất moderation không tự xử phạt.
- CAPTCHA và role tương ứng.

### Ưu tiên P1
- Chào mừng/tạm biệt.
- Lịch sự kiện, nhắc, bình chọn.
- Voice tạm nhiều lobby và tự xóa.

### Ưu tiên P2
- Sinh nhật, poll, ticket, FAQ, thời tiết.
- Thống kê voice và tiện ích cộng đồng.

### Ưu tiên P3
- Nhạc/radio theo nguồn phù hợp.
- Website mời bot và dashboard cấu hình.

## Rủi ro cần quản lý

- Bot có thể thiếu quyền hoặc không nhận được một số sự kiện Discord.
- Tên lệnh tiếng Việt có dấu/có khoảng trắng cần đối chiếu giới hạn Slash Command.
- Log nội dung có thể tạo rủi ro riêng tư; cấu hình mặc định nên tối thiểu.
- Phòng ẩn/ID phải thiết kế để không lách quyền chủ phòng.
- Nhắc lịch, xóa phòng và sự kiện lặp cần chống gửi trùng sau lỗi/restart.
- Nguồn nhạc có thể thay đổi khả năng truy cập hoặc điều khoản; cần mô-đun có thể tắt.
