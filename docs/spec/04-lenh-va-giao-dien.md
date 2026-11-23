# 04. Lệnh và giao diện

## Nguyên tắc thiết kế lệnh

- Lệnh và mô tả hiển thị bằng tiếng Việt có dấu, chia nhóm theo tác vụ.
- Không tạo một danh sách dài lộn xộn; dùng nhóm lệnh, autocomplete, danh mục trợ giúp và nút điều hướng.
- Quyền được kiểm tra ở cả giao diện lẫn backend. Ẩn lệnh khỏi người không có quyền là tốt, nhưng không thay thế kiểm tra quyền khi thực thi.
- Discord có quy tắc đặt tên Slash Command và bản địa hóa khác với cách gõ tự do. Khi triển khai phải xác nhận tên kỹ thuật hợp lệ; nếu `/phát nhạc` không hợp lệ, dùng nhóm lệnh như `/nhạc phát` hoặc tên kỹ thuật tương thích, nhưng vẫn giữ tiếng Việt trong mô tả/nhãn/nút nếu nền tảng hỗ trợ.

## Cây lệnh đề xuất

Tên dưới đây là nhãn/ngữ nghĩa mong muốn; cấu trúc chính xác sẽ chốt sau khi kiểm tra giới hạn Discord.

### Thiết lập
- `/thiết lập bắt đầu` — trình hướng dẫn setup ban đầu.
- `/thiết lập nhật ký` — chọn kênh và sự kiện được ghi.
- `/thiết lập kiểm duyệt` — cấu hình luật, kênh duyệt, role duyệt.
- `/thiết lập xác minh` — CAPTCHA, role Chưa xác minh/Đã xác minh, quyền kênh.
- `/thiết lập chào mừng` — chào/tạm biệt và mẫu tin.
- `/thiết lập sự kiện` — lịch, múi giờ và nhắc.
- `/thiết lập phòng tạm` — cấu hình tối đa nhiều lobby.
- `/thiết lập tiện ích` — poll, ticket, thời tiết, nhạc và các mô-đun.
- `/thiết lập quyền` — ma trận quyền theo lệnh.

### Nhật ký và kiểm duyệt
- `/nhật ký xem` — xem log theo loại/thời gian nếu được phép.
- `/kiểm duyệt hàng chờ` — danh sách vụ việc cần xem.
- `/kiểm duyệt vụ việc` — mở một mã vụ việc.
- `/kiểm duyệt báo cáo` — thành viên gửi báo cáo.
- `/kiểm duyệt lịch sử` — lịch sử xử lý theo thành viên nếu được phép.
- Các nút trên thẻ: **Chấp thuận đề xuất**, **Để treo**, **Từ chối**, **Ghi chú**, **Đóng vụ việc**.

### Thành viên và xác minh
- `/xác minh` — bắt đầu hoặc mở CAPTCHA.
- `/xác minh cấp` — cấp trạng thái đã xác minh thủ công, chỉ role có quyền.
- `/sinh nhật đặt`, `/sinh nhật sửa`, `/sinh nhật xóa`.
- `/hướng dẫn` — hướng dẫn server hoặc FAQ.

### Sự kiện
- `/sự kiện tạo`, `/sự kiện sửa`, `/sự kiện hủy`.
- `/sự kiện lịch` — hiển thị 30 ngày trước và 30 ngày tới.
- `/sự kiện tham gia`, `/sự kiện quan tâm`, `/sự kiện rút`.
- `/sự kiện bình chọn` — tạo bình chọn/hoạt động tương tác.

### Phòng tạm
- `/phòng tạo` hoặc vào lobby đã cấu hình.
- `/phòng cài đặt` — chủ phòng chỉnh phòng của mình.
- `/phòng mời`, `/phòng khóa`, `/phòng mở`, `/phòng ẩn`, `/phòng hiện`.
- `/phòng vào id` — kiểm tra quyền và trạng thái khóa trước khi chuyển thành viên.
- `/phòng quản trị` — dành cho quản trị viên được cấp quyền.

### Âm nhạc, thời tiết và tiện ích
- `/nhạc phát` — tên bài hoặc URL hợp lệ.
- `/nhạc hàng đợi`, `/nhạc tạm dừng`, `/nhạc tiếp`, `/nhạc dừng`, `/nhạc âm lượng`.
- `/thời tiết` — địa điểm.
- `/bình chọn tạo`, `/nhắc tạo`, `/ticket tạo`, `/ticket đóng`.

## Mẫu phản hồi âm nhạc

Embed/card nên có:
- Tên bài hát và ảnh bìa nếu nhà cung cấp có.
- Nguồn/độ dài nếu được cung cấp.
- Người yêu cầu, vị trí trong hàng đợi và trạng thái phát.
- Nút **Phát/Tạm dừng**, **Bài tiếp theo**, **Hàng đợi**, **Dừng**.

## Chuẩn thẻ kiểm duyệt

- Tiêu đề: `Cần xem xét · Vụ việc #ID`.
- Nội dung ngắn: loại tín hiệu, thành viên, thời gian, kênh và lý do gắn cờ.
- Trích dẫn nội dung chỉ khi cấu hình cho phép và quyền xem phù hợp.
- Nút duyệt có xác nhận phụ khi cần; ghi danh tính người bấm và thời điểm.
- Không dùng màu sắc làm thông tin duy nhất; cần nhãn trạng thái rõ.

## Nguyên tắc giao diện

- Nhất quán màu, biểu tượng, tiêu đề, khoảng trắng và định dạng thời gian.
- Không giả lập thông tin; hiển thị trạng thái đang xử lý, lỗi quyền hoặc thiếu cấu hình rõ ràng.
- Các nút phải có thời hạn/kiểm tra quyền, xử lý thao tác lặp và báo lỗi thân thiện.
- Trả lời riêng tư (ephemeral) với dữ liệu cấu hình/cá nhân; công khai ở kênh chỉ khi phù hợp.
