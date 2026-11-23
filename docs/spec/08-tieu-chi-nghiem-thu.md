# 08. Tiêu chí nghiệm thu và kiểm thử

## Nhật ký
- [ ] Có thể chọn một kênh log chung hoặc định tuyến từng loại sự kiện đến kênh khác nhau.
- [ ] Tắt log ở kênh/loại sự kiện được loại trừ.
- [ ] Log ghi đúng guild, thời gian, loại sự kiện và dữ liệu được phép.
- [ ] Bot không khẳng định ghi được sự kiện ngoài API/quyền hoặc lịch sử trước khi cài.
- [ ] Nội dung log không hiện cho thành viên không có quyền.

## Kiểm duyệt
- [ ] Bot tạo đề xuất và đăng vào kênh kiểm duyệt.
- [ ] Không có bất kỳ đường lệnh/tác vụ nào tự ban, kick hoặc timeout.
- [ ] Người có quyền có thể Chấp thuận, Để treo hoặc Từ chối; mỗi hành động lưu người và thời gian.
- [ ] Người không có quyền không thể xem hoặc bấm quyết định thành công.
- [ ] Chấp thuận không gọi API xử phạt.
- [ ] Các từ ví dụ “đjt”, “địt”, “mẹ” không tự động gây xử phạt; kiểm thử ngữ cảnh, allowlist và luật nghiêm trọng.
- [ ] Công khai kết quả tắt mặc định và chỉ hoạt động khi cấu hình.

## CAPTCHA và role
- [ ] Thành viên mới nhận trạng thái Chưa xác minh.
- [ ] Chưa xác minh chỉ thấy kênh CAPTCHA theo permission thực tế của Discord.
- [ ] Hoàn tất xác minh gỡ role Chưa xác minh và cấp Đã xác minh.
- [ ] Không tồn tại đồng thời hai role trạng thái.
- [ ] Lệnh cấp thủ công bị chặn với người không có quyền và được ghi log khi hợp lệ.

## Sự kiện
- [ ] Lịch hiển thị đúng cửa sổ 30 ngày trước/30 ngày tới.
- [ ] Ngày giờ thể hiện rõ giây và múi giờ.
- [ ] Kiểm thử giờ mùa hè/múi giờ nếu hỗ trợ vùng có DST; lưu UTC.
- [ ] Nhắc lặp không gửi trùng sau restart/retry.
- [ ] Sửa/hủy sự kiện cập nhật thông báo và lịch sử đúng.

## Voice tạm thời
- [ ] Cấu hình được ít nhất 8 lobby độc lập.
- [ ] Người vào mỗi lobby tạo đúng phòng và được chuyển vào phòng.
- [ ] ID duy nhất trong phạm vi guild; nhập ID không vượt quyền khóa.
- [ ] Chủ phòng chỉ chỉnh phòng của mình; Admin/Quản trị chỉ theo quyền được cấp.
- [ ] Phòng trống được xóa sau 5 giây; bot nhạc không giữ phòng.
- [ ] Thành viên vào lại trong 5 giây làm hủy tác vụ xóa.
- [ ] Xử lý được bot restart, kênh bị xóa thủ công và quyền Discord thiếu.

## Lệnh và giao diện
- [ ] Nhóm lệnh nhất quán, trợ giúp dễ tìm và quyền được kiểm tra phía server.
- [ ] Tên lệnh tuân thủ giới hạn Discord sau khi đăng ký thử.
- [ ] Embed có trạng thái/nhãn rõ; nút lỗi thời hoặc tương tác lặp được xử lý an toàn.
- [ ] Phản hồi riêng tư cho thao tác cấu hình/dữ liệu cá nhân khi phù hợp.
- [ ] Lệnh nhạc hiển thị thông tin bài, ảnh bìa nếu có, hàng đợi và nút điều khiển.

## Bảo mật và vận hành
- [ ] Không có token/secret trong mã nguồn, log, tài liệu hoặc artifact công khai.
- [ ] Quyền tối thiểu; không yêu cầu Administrator nếu không cần.
- [ ] Kiểm thử phân tách dữ liệu giữa hai guild.
- [ ] Dọn dữ liệu quá hạn đúng chính sách.
- [ ] Có health check, báo lỗi và hướng dẫn tắt mô-đun/khôi phục.
