# Technical audit — 6.0.0

## Nguồn chuẩn và phạm vi

Bộ đặc tả gốc trong `docs/spec/` được giữ nguyên. Audit này mô tả source và kiểm thử trong sandbox; không phải xác nhận triển khai production. Bản 6.0.0 là mốc phát hành source theo yêu cầu, không đồng nghĩa bot đã được đăng ký hoặc chạy trên Discord thật.

## Phần đã có mã

Bot giữ các module moderation cần người duyệt, CAPTCHA, chào/tạm biệt, audit metadata, sự kiện/RSVP/nhắc, thời tiết và voice tạm từ 0.5.0. Không bật Message Content Intent, không lưu nội dung tin nhắn, không tự ban/kick/timeout.

Mốc 6.0 bổ sung bốn tiện ích: sinh nhật opt-in chỉ lưu tháng/ngày; poll 2–4 lựa chọn với một phiếu có thể đổi cho mỗi thành viên; ticket tạo kênh riêng theo người mở, role hỗ trợ có thể cấu hình và đóng không xóa lịch sử; FAQ theo server chỉ cho người có quyền chỉnh sửa. Database mở rộng bằng bảng mới và cột birthday channel migration cộng thêm.

## Kiểm chứng cục bộ

- `pnpm install --frozen-lockfile`, typecheck, 16 tests, build, command serialization và SQLite smoke test: PASS; chi tiết trong `QA-REPORT.md`.
- Policy tests kiểm tra không có API tự xử phạt; localization các slash roots; invariants cơ bản của poll, ticket và opt-in birthday.
- SQLite smoke test dùng DB tạm và kiểm tra schema mới, upsert một phiếu/member cùng unique index một ticket mở/member.

## Chưa kiểm tra trên Discord/Android

- Chưa gọi Discord REST để đăng ký slash commands; cần token, Application ID và guild thử nghiệm.
- Chưa kết nối Discord Gateway hoặc kiểm tra permissions, intents, embeds, buttons và permission overwrites trên server thật.
- Chưa xác nhận gửi lời chúc đúng giờ theo múi giờ thật; scheduler chỉ chạy khi bot online.
- Chưa kiểm thử tạo ticket trên role/category và permission layout cụ thể của server người dùng.
- Chưa kiểm thử Termux/Android thật, build native `better-sqlite3`, host 24/7, load hoặc backup/restore production.

## Rủi ro và giới hạn còn mở

- CAPTCHA là câu hỏi số học cơ bản, không phải CAPTCHA chống bot tinh vi.
- `/thiết-lập` không tự sửa permission toàn server; Admin tự cấu hình role/channels để tránh khóa nhầm server.
- Quyền Administrator Discord có thể vượt permission overwrite của phòng/ticket theo thiết kế nền tảng.
- Ticket đóng không xóa channel; chưa có transcript export hoặc retention automation.
- Birthday registration lưu tháng/ngày opt-in; ngày 29/2 chỉ khớp vào năm nhuận.
- Sự kiện lặp lại/bình chọn giờ, music/radio, role tự chọn, bộ lọc nội dung có ngữ cảnh, bảng xếp hạng voice và web dashboard chưa được triển khai.
- Nhắc sự kiện/sinh nhật cần bot online, network và quyền gửi tin; cần thử quy trình recovery thực tế.
- Audit/case/ticket cần retention policy do chủ server quyết định; SQLite cần quyền file và backup riêng tư.
