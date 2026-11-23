# 06. Lộ trình triển khai

## Giai đoạn 0 — Chốt yêu cầu

- Chọn tên bot và tên role trạng thái xác minh.
- Chốt role Admin/Quản trị/Moderator và ai được duyệt vụ việc.
- Chọn kênh log, kênh kiểm duyệt, kênh công khai (nếu có), kênh chào mừng và kênh CAPTCHA.
- Chốt chính sách lưu log, nội dung tin nhắn, sinh nhật và thời hạn lưu.
- Liệt kê 8 kênh lobby voice hiện có, danh mục phòng, quyền mặc định và cài đặt ID.
- Chọn dịch vụ thời tiết, phương án hosting/DB và xem xét nguồn nhạc/radio hợp lệ.

## Giai đoạn 1 — Nền tảng an toàn (MVP)

- Đăng ký bot, lệnh tiếng Việt/nhóm lệnh và kiểm tra quyền.
- Setup cơ bản theo guild; cấu hình kênh/role.
- Nhật ký sự kiện ưu tiên và thử nghiệm quyền.
- Hàng đợi kiểm duyệt với Chờ duyệt/Để treo/Chấp thuận/Từ chối; không tự phạt.
- CAPTCHA và role Chưa xác minh/Đã xác minh, kiểm thử quyền xem kênh.
- Chào mừng/tạm biệt.

## Giai đoạn 2 — Cộng đồng và quản trị

- Sự kiện, lịch 30 ngày trước/30 ngày tới, múi giờ, nhắc và lặp lại.
- Sinh nhật tùy chọn, poll, ticket, FAQ và công cụ quản trị.
- Luật kiểm duyệt có allowlist, chế độ quan sát và chống cảnh báo lặp.

## Giai đoạn 3 — Voice tạm

- Tích hợp đủ 8 lobby.
- Tạo phòng, quyền chủ phòng, cài đặt quản trị, ID, ẩn/khóa và luồng vào phòng.
- Tự xóa sau 5 giây trống kể cả khi bot nhạc còn hiện diện.
- Khôi phục trạng thái sau restart, kiểm thử cạnh tranh và bảng xếp hạng tùy chọn.

## Giai đoạn 4 — Thời tiết, âm nhạc và mở rộng

- Thời tiết và lịch gửi nếu được yêu cầu.
- Adapter phát nhạc/radio, giao diện hàng đợi và nút điều khiển; chỉ triển khai khi nguồn phù hợp.
- Thống kê, tự động hóa phi trừng phạt và tối ưu vận hành.

## Giai đoạn 5 — Website quản trị (sau)

- Discord OAuth, chọn guild người dùng có quyền quản lý.
- Dashboard cấu hình các mô-đun, nhật ký thay đổi cấu hình, phân quyền, lưu trữ và mời bot.
- Không xây website trước khi mô hình cấu hình và quyền trong bot ổn định.

## Các quyết định cần chốt trước khi code

| Quyết định | Trạng thái |
|---|---|
| Tên bot | Chưa chốt |
| Role “Đã xác minh” (tên/ID) | Chưa chốt; yêu cầu ban đầu ghi trùng tên “Chưa xác minh” |
| Role Admin/Quản trị/Moderator và quyền duyệt | Chưa chốt |
| Kênh log/kênh kiểm duyệt/kênh công khai | Chưa chốt |
| Chính sách log nội dung tin nhắn và thời hạn lưu | Chưa chốt |
| Danh sách 8 lobby voice và danh mục tạo phòng | Cần cung cấp khi triển khai |
| Múi giờ mặc định | Đề xuất Asia/Ho_Chi_Minh, cần xác nhận cấu hình server |
| Dịch vụ thời tiết | Chưa chốt |
| Nguồn nhạc/radio | Chưa chốt; cần xác nhận điều khoản/kỹ thuật |
| Hosting và database | Chưa chốt |
| Cách đặt tên Slash Command hợp lệ | Cần kiểm tra theo quy tắc Discord hiện hành khi đăng ký |

## Quy tắc phát hành

Mỗi giai đoạn cần có kiểm thử quyền, kiểm thử dữ liệu, hướng dẫn quản trị và phương án tắt mô-đun. Không bật công khai tính năng mới trên tất cả server cùng lúc nếu chưa có giai đoạn thử nghiệm.
