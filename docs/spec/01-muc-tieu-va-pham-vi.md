# 01. Mục tiêu và phạm vi

## Tầm nhìn

Xây dựng một bot Discord đa năng, có thể thay thế nhiều bot chuyên dụng trong server: nhật ký, kiểm duyệt có người duyệt, chào mừng/xác minh, sự kiện, voice tạm, âm nhạc/radio, thời tiết và tiện ích cộng đồng. Bot cần dễ tìm lệnh, giao diện chỉn chu, cấu hình sâu theo server và quyền hạn minh bạch.

## Mục tiêu sản phẩm

1. **Một nơi quản lý:** tập trung các công cụ server thường dùng, có nhóm lệnh rõ ràng.
2. **Con người quyết định hình phạt:** bot nhận diện và đề xuất; người có quyền chấp thuận, để treo hoặc từ chối.
3. **Cấu hình theo server:** chọn kênh, role, ngưỡng, mẫu nội dung, thời gian lưu và quyền sử dụng riêng cho từng server.
4. **Trải nghiệm Discord đẹp:** embed/cards, nút tương tác, menu chọn và modal thay vì phản hồi văn bản lộn xộn.
5. **Riêng tư và tối thiểu quyền:** chỉ thu thập/lưu dữ liệu cần thiết; chỉ xin quyền bot thực sự cần.
6. **Mở rộng có kiểm soát:** ưu tiên lõi ổn định trước, sau đó mới bổ sung dashboard web, nhạc/radio và tự động hóa nâng cao.

## Phạm vi dự kiến

### Trong phạm vi
- Nhật ký các sự kiện Discord/API cho phép và được cấu hình.
- Kiểm duyệt đề xuất, hàng đợi duyệt và nhật ký quyết định.
- Chào mừng/tạm biệt, CAPTCHA xác minh, role trạng thái xác minh.
- Sinh nhật tùy chọn.
- Sự kiện, bình chọn, nhắc lịch, lịch sử và sự kiện lặp lại.
- Tối đa nhiều voice lobby; server hiện có 8 kênh tạo phòng tạm thời.
- Phòng voice có ID, khóa/mở, ẩn/hiện, cài đặt chủ phòng và cài đặt quản trị.
- Phòng trống tự xóa sau 5 giây; bot phát nhạc không giữ phòng.
- Tiện ích, thời tiết, nhạc/radio nếu tìm được nguồn và tích hợp hợp lệ.
- Cấu hình bằng lệnh; website dashboard để giai đoạn sau.

### Ngoài phạm vi mặc định
- Thu thập/ghi âm DM hoặc voice hội thoại một cách bí mật.
- Cam kết ghi lại toàn bộ mọi hoạt động mà Discord không cung cấp cho bot.
- Tự động xử phạt thành viên bằng ban/kick/timeout.
- Lấy lại đầy đủ lịch sử server đã diễn ra trước thời điểm bot được cài.
- Vượt cơ chế bảo vệ hoặc điều khoản sử dụng của nguồn nhạc.

## Định nghĩa vai trò

- **Chủ server/Admin:** quyền cấu hình cấp cao; quyết định ai có thể duyệt đề xuất.
- **Quản trị viên/Moderator:** xử lý vụ việc theo phạm vi được cấp. Tên role và quyền thực tế do server cấu hình.
- **Thành viên:** sử dụng các tiện ích được mở; có thể là chủ phòng tạm thời.
- **Bot:** ghi nhận sự kiện khả dụng, phát hiện theo luật, tạo đề xuất và thi hành các thao tác phi trừng phạt đã được cho phép.

## Nguyên tắc thành công

- Lệnh có nhóm rõ ràng và dễ khám phá.
- Không có đường xử lý moderation nào tự áp dụng hình phạt.
- Mỗi đề xuất có trạng thái: Chờ duyệt / Đã chấp thuận / Từ chối / Hết hạn hoặc Đóng.
- Không thể cấu hình nhầm để role Chưa xác minh nhìn thấy các kênh nội dung.
- Phòng voice trống được xóa sau đúng khoảng chờ cấu hình (mặc định 5 giây), bất kể bot phát nhạc còn kết nối.
- Các tác vụ nền, lịch và cấu hình vẫn an toàn sau khi bot khởi động lại.
