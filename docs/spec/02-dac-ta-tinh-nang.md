# 02. Đặc tả tính năng

## A. Nhật ký server

Quản trị viên thiết lập một kênh tổng hoặc nhiều kênh theo nhóm. Có thể bật/tắt từng sự kiện, loại trừ kênh/role và chọn mức nội dung được lưu.

Nhóm sự kiện dự kiến:
- Tin nhắn được sửa/xóa; nội dung chỉ lưu nếu cấu hình cho phép và Discord cung cấp sự kiện.
- Thành viên vào/rời; thay đổi nickname hoặc role.
- Tạo, sửa, xóa kênh/role và thay đổi cấu hình mà bot nhận được.
- Tham gia/rời/chuyển voice khi sự kiện phù hợp được cung cấp.
- Các thao tác kiểm duyệt do người quản trị hoặc bot thực hiện.
- Các thao tác cấu hình và lỗi đáng chú ý của chính bot.

Mỗi log nên có thời gian, người liên quan, đối tượng, loại sự kiện và liên kết/ngữ cảnh phù hợp. Nội dung nhạy cảm được che hoặc bỏ qua theo cài đặt.

## B. Kiểm duyệt hỗ trợ quyết định

- Luật cấu hình: spam/flood, nhắc lặp, link theo danh sách, nội dung độc hại/đe dọa/quấy rối, mạo danh hoặc luật riêng của server.
- Bộ lọc từ khóa có danh sách cho phép, ngoại lệ theo ngữ cảnh/kênh/role và mức nghiêm trọng.
- Từ thông tục hoặc tiêu cực nhẹ không mặc định là vi phạm. Các ví dụ người dùng yêu cầu cho phép mặc định: “đjt”, “địt”, “mẹ”. Admin có thể chỉnh chính sách của server.
- Khi phát hiện, tạo thẻ trong kênh kiểm duyệt: nội dung/sự kiện liên quan, lý do gắn cờ, độ tin cậy nếu có, thành viên, thời điểm và nút xử lý.
- Nút quyết định: **Chấp thuận đề xuất**, **Để treo**, **Từ chối**. Không nút nào tự động thực hiện ban/kick/timeout. Nếu sau này người dùng muốn thực thi hình phạt qua bot thì cần một yêu cầu và đặc tả riêng; thiết kế hiện tại không bao gồm việc đó.
- Lưu người duyệt, thời gian, quyết định và ghi chú. Cho phép chỉ công khai những loại thông báo đã được cấu hình và duyệt.
- Hỗ trợ báo cáo từ thành viên, phân công người xử lý, ghi chú nội bộ và đóng vụ việc.

## C. Chào mừng, xác minh và sinh nhật

### Chào mừng/tạm biệt
- Thiết lập kênh, nội dung, embed, ảnh/banner tùy chọn và hành động sau khi gia nhập.
- Thông báo rời server tùy chọn; tránh công khai dữ liệu không cần thiết.

### Xác minh CAPTCHA
- Hai role trạng thái: `Chưa xác minh` và `Đã xác minh` (tên có thể tùy chỉnh nhưng phải khai báo rõ; yêu cầu ban đầu lặp tên role thứ hai, tài liệu dùng “Đã xác minh” làm trạng thái đối ứng).
- Một thành viên chỉ được có một trong hai role này.
- Role `Chưa xác minh` chỉ thấy khu vực xác minh; không thấy nội dung server.
- Hoàn tất CAPTCHA: gỡ role Chưa xác minh, cấp Đã xác minh.
- Người có quyền được cấp role Đã xác minh thủ công bằng lệnh quản trị; thao tác phải được ghi log.
- Có xử lý CAPTCHA hết hạn, thử lại, báo cáo không xác minh được và cấu hình vai trò/kênh.

### Sinh nhật
- Thành viên tự khai báo/ngày sinh bằng quy trình riêng; có lựa chọn không công khai năm sinh hoặc không tham gia.
- Cấu hình kênh, lời chúc, múi giờ, role sinh nhật trong ngày và quyền xem.
- Dữ liệu sinh nhật là tùy chọn, có thể sửa/xóa và không nên hiển thị quá mức.

## D. Sự kiện và lịch

- Tạo/sửa/hủy sự kiện; sự kiện thường, bình chọn và hoạt động cộng đồng.
- Thời gian hiển thị đầy đủ ngày/tháng/năm/giờ/giây và múi giờ; lưu thời điểm theo chuẩn UTC và hiển thị theo múi giờ server/người xem.
- Lịch xem được 30 ngày trước và 30 ngày tiếp theo; có phân trang hoặc bộ lọc.
- Nhắc trước theo các mốc do server chọn; thông báo khi thay đổi/hủy.
- Hỗ trợ sự kiện lặp lại, ghi danh, nút Quan tâm/Tham gia/Rút, giới hạn chỗ và bình chọn.
- Lịch sử sự kiện rõ ràng, không xóa mất lịch sử khi sự kiện kết thúc; có trạng thái đã diễn ra/hủy.
- Phân quyền tạo, sửa, nhắc, hủy và quản lý người tham gia.

## E. Voice tạm thời

- Cấu hình nhiều kênh lobby (server hiện có 8 lobby cần hỗ trợ).
- Khi thành viên vào lobby, tạo một phòng mới theo mẫu và chuyển thành viên vào đó.
- Chủ phòng: đổi tên, giới hạn người, khóa/mở, ẩn/hiện, cho phép/thu hồi quyền vào, mời thành viên và chuyển chủ nếu được cho phép.
- Admin/Quản trị: cấu hình lobby, mẫu tên, quyền mặc định, thời gian xóa và xử lý phòng.
- Mỗi phòng có ID ổn định, duy nhất trong server; tra cứu ID không được tiết lộ thông tin quá mức.
- Phòng khóa/ẩn chỉ vào được qua luồng nhập ID và kiểm tra quyền do server thiết lập; nếu khóa tuyệt đối thì nhập ID cũng không vượt khóa. “Vào bằng ID” không được trở thành cách lách quyền của chủ phòng.
- Khi không còn người dùng thực trong phòng, bắt đầu bộ đếm mặc định 5 giây; nếu vẫn trống thì xóa. Bot phát nhạc không được tính là người dùng để giữ phòng. Nếu người dùng quay lại trước khi hết hạn, hủy việc xóa.
- Bảng xếp hạng voice tùy chọn, có giới hạn chống farm, có thể tắt và không theo dõi ngoài các sự kiện voice khả dụng.

## F. Tiện ích cộng đồng/quản trị

- Poll, nhắc việc, FAQ, ticket hỗ trợ, role tự chọn/role theo nút, bộ đếm, gợi ý lệnh.
- Tổng quan server, bảng thống kê hoạt động và dashboard trạng thái bot trong Discord.
- Lịch sử vụ việc, phân công mod, ghi chú nội bộ và tổng hợp theo thời gian.
- Quy tắc tự động hóa theo sự kiện, nhưng không tự xử phạt.
- Xuất/nhập cấu hình không gồm bí mật, token hoặc dữ liệu riêng tư không cần thiết.

## G. Thời tiết, nhạc và radio

- `/thời tiết` tra cứu địa điểm; kết quả gồm điều kiện hiện tại và dự báo nếu nhà cung cấp hỗ trợ. Có thể hẹn lịch đăng.
- Phát nhạc theo tên hoặc URL nguồn hợp lệ; phản hồi có tên bài, ảnh bìa khi có, người yêu cầu, hàng đợi và nút Phát/Tạm dừng/Chuyển bài/Dừng.
- Quyền dùng nhạc, giới hạn yêu cầu, âm lượng và hàng đợi cấu hình được.
- Radio là mô-đun riêng, dùng nguồn phù hợp điều khoản; không vượt bảo vệ/giới hạn của nền tảng nguồn.

## H. Thiết lập và dashboard tương lai

- Tất cả tính năng có cài đặt phù hợp: kênh, role, quyền, mẫu, thời hạn, lịch và ngưỡng.
- Một số setup/settings chỉ Admin; một số tiện ích có thể mở cho thành viên hoặc chủ phòng.
- Dashboard web để giai đoạn sau: đăng nhập Discord, chọn server đủ quyền, cấu hình tính năng, phân quyền, riêng tư/lưu trữ và mời bot.
