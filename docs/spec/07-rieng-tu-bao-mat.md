# 07. Riêng tư và bảo mật

## Nguyên tắc dữ liệu

- Minh bạch với thành viên về những nhóm log được bật và kênh log có quyền xem.
- Tắt mặc định việc lưu nội dung tin nhắn nếu không cần; cân nhắc chỉ lưu metadata hoặc trích đoạn tối thiểu.
- Không ghi DM, mật khẩu, token, thông tin xác thực hoặc ghi âm voice hội thoại bí mật.
- Không thu thập ngày sinh nếu thành viên không chọn tham gia; cung cấp cách sửa/xóa.
- Có thời hạn lưu, tác vụ xóa định kỳ và quy trình xử lý yêu cầu xóa phù hợp chính sách server.
- Giới hạn quyền xem dữ liệu; tách kênh moderation khỏi kênh cộng đồng.

## Quyền Discord

- Chỉ yêu cầu permission và Gateway Intents cần cho tính năng đã bật.
- Không yêu cầu quyền Administrator nếu có thể chạy với quyền thấp hơn.
- Hướng dẫn server tạo role bot và thứ tự role an toàn.
- Kiểm tra permission trước mọi thao tác, trả lỗi rõ ràng và ghi sự kiện cấu hình thiếu quyền.
- Không để lệnh thành viên thường sửa cấu hình quản trị hoặc truy cập kênh kín.

## Bảo vệ tương tác

- Kiểm tra người bấm nút có quyền và tương tác còn hiệu lực.
- Nút duyệt phải chống bấm lặp; thao tác lưu quyết định theo transaction hoặc idempotency key.
- Không đưa dữ liệu nhạy cảm vào custom_id, URL hoặc thông báo công khai.
- Rate-limit lệnh và xử lý lỗi đầu vào; không tin nội dung do người dùng gửi.
- Lưu audit của thay đổi cấu hình: ai, khi nào, mục nào đổi; tránh lưu bí mật.

## Xác minh

- Cấu hình permission channels cần được kiểm thử tự động: role Chưa xác minh chỉ xem kênh xác minh; role Đã xác minh thấy kênh theo quyền server.
- Chuyển trạng thái role theo thao tác an toàn, đảm bảo không tồn tại đồng thời cả hai role.
- Lệnh cấp thủ công phải giới hạn quyền và tạo log.
- Không coi CAPTCHA là biện pháp chống mọi lạm dụng; cho phép xử lý ngoại lệ cho người dùng cần hỗ trợ.

## Giới hạn nền tảng và minh bạch

- Bot chỉ ghi nhận các Gateway/API events khả dụng và sự kiện nhận được khi online/được cấp quyền.
- Không cam kết khôi phục toàn bộ lịch sử cũ hoặc các hành động không có sự kiện tương ứng.
- Phần voice chỉ theo dõi hoạt động tham gia/rời nếu được Discord cung cấp; không ghi âm hội thoại.
- Nhạc/radio sử dụng nguồn phù hợp điều khoản; không lách hạn chế truy cập hoặc bản quyền.

## Ứng phó sự cố

- Thu hồi token và thay token khi nghi ngờ lộ.
- Có kế hoạch tắt mô-đun riêng hoặc bot toàn server khi xảy ra sự cố.
- Giữ log lỗi kỹ thuật tối thiểu cần thiết, tránh dump payload nhạy cảm.
- Backup có kiểm soát truy cập và kiểm tra khả năng khôi phục định kỳ.
