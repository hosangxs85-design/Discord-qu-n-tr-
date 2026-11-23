# Bộ tài liệu dự án bot Discord đa năng

Bộ tài liệu này chuyển yêu cầu ban đầu thành đặc tả có thể dùng để lập kế hoạch, thiết kế và phát triển bot Discord. Đây là **tài liệu dự án**, chưa bao gồm mã nguồn bot đã chạy.

## Bắt đầu từ đâu

1. Đọc `01-muc-tieu-va-pham-vi.md` để thống nhất mục tiêu và giới hạn.
2. Đọc `02-dac-ta-tinh-nang.md` để nắm các nhóm tính năng.
3. Đọc `03-kiem-duyet-va-quyen-han.md` trước khi xây moderation, cảnh báo và quy trình duyệt.
4. Đọc `04-lenh-va-giao-dien.md` để thiết kế lệnh tiếng Việt và phản hồi Discord.
5. Đọc `05-kien-truc-va-du-lieu.md` và `06-lo-trinh-trien-khai.md` để định hướng kỹ thuật và chia giai đoạn.
6. Dùng `07-rieng-tu-bao-mat.md` và `08-tieu-chi-nghiem-thu.md` làm checklist triển khai.

## Quy ước

- “Admin” và “Quản trị viên” chỉ các vai trò do từng server cấu hình; tên/ID role thực tế chưa được cung cấp.
- Bot **không tự động ban, kick hoặc timeout**. Bot phát hiện/đề xuất và chờ người có quyền quyết định.
- Mọi tính năng phải được cấu hình theo server, phân quyền rõ và chỉ xin quyền Discord tối thiểu cần thiết.
- Nhật ký chỉ ghi những sự kiện Discord cung cấp cho bot trong phạm vi quyền/cấu hình; không hứa ghi được tuyệt đối mọi hoạt động hoặc lịch sử trước khi bot được thêm.
- Tính năng website mời bot và dashboard cài đặt nằm ở giai đoạn sau.

## Tình trạng

- Đặc tả: bản đầu tiên dựa trên yêu cầu đã thống nhất trong cuộc trò chuyện.
- Chưa chốt: tên bot, nền tảng triển khai, role ID, kênh ID, nguồn nhạc/radio, nhà cung cấp thời tiết, chính sách lưu trữ cụ thể.
- Các mục này được ghi thành quyết định cần chốt trong `06-lo-trinh-trien-khai.md`.
