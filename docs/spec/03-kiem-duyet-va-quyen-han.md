# 03. Kiểm duyệt và quyền hạn

## Nguyên tắc không tự xử phạt

Trong phạm vi đặc tả hiện tại, bot tuyệt đối không tự áp dụng ban, kick hoặc timeout. Bot có thể phát hiện tín hiệu, gửi cảnh báo/đề xuất và ghi nhận quyết định của người quản trị. Nút “Chấp thuận” xác nhận đề xuất hoặc ghi nhận quyết định; nó không gọi API xử phạt.

## Luồng xử lý vụ việc

1. **Phát hiện:** sự kiện hoặc báo cáo khớp với luật.
2. **Tạo vụ việc:** sinh mã vụ việc duy nhất, ghi thời gian, thành viên, luật liên quan và thông tin đủ để xem xét.
3. **Thông báo riêng:** gửi vào kênh kiểm duyệt đã cấu hình, giới hạn người xem cho Admin/Quản trị/nhóm được cấp quyền.
4. **Xem xét:** người có quyền chọn Chấp thuận đề xuất, Để treo, Từ chối; có thể ghi chú nội bộ.
5. **Công khai (tùy chọn):** chỉ các loại kết quả được cấu hình mới đăng kênh công khai; tránh đưa thông tin cá nhân hoặc nội dung nhạy cảm.
6. **Đóng/lưu:** lưu trạng thái và người quyết định; xóa/ẩn dữ liệu theo chính sách lưu trữ.

## Trạng thái vụ việc

- `Chờ duyệt`: mới tạo, chưa có quyết định.
- `Để treo`: cần thêm thông tin hoặc chờ người có quyền.
- `Đã chấp thuận`: người duyệt xác nhận nhận định/đề xuất; không đồng nghĩa bot tự thi hành hình phạt.
- `Từ chối`: người duyệt không chấp nhận đề xuất.
- `Đã đóng`: xử lý xong hoặc không còn cần xem xét.
- `Hết hạn`: vượt thời gian xử lý theo cấu hình; không tự chuyển thành hình phạt.

## Vai trò và quyền đề xuất

| Năng lực | Admin/Chủ server | Quản trị/Moderator | Thành viên | Chủ phòng tạm |
|---|---:|---:|---:|---:|
| Cấu hình toàn bộ bot | Có | Chỉ khi được cấp | Không | Không |
| Xem kênh kiểm duyệt | Có | Theo role được cấp | Không | Không |
| Duyệt/từ chối/treo vụ việc | Có | Theo cấu hình | Không | Không |
| Công khai kết quả | Cấu hình | Nếu được cấp | Không | Không |
| Dùng lệnh kiểm duyệt | Có | Theo cấu hình | Không | Không |
| Setup sự kiện | Có | Có thể cấp | Tùy chọn | Không |
| Settings phòng của mình | Có | Theo cấu hình | Không | Có |
| Settings lobby/voice server | Có | Theo cấu hình | Không | Không |
| Dùng tiện ích công khai | Có | Có | Có nếu bật | Có |

Ma trận trên là mặc định đề xuất; cấu hình thực tế theo server. Bot không được tự cấp quyền Discord cao hơn quyền mà server cho phép.

## Nội dung kiểm duyệt

- Tách danh sách từ khóa nghiêm trọng khỏi từ ngữ thông tục.
- Cho phép allowlist, ngoại lệ theo ngữ cảnh/kênh/role và mức độ.
- Mặc định không chặn riêng các ví dụ người dùng nêu: “đjt”, “địt”, “mẹ”. Cần đánh giá toàn câu/ngữ cảnh thay vì chỉ dò chuỗi.
- Có chế độ thử nghiệm/quan sát (chỉ tạo báo cáo, không thay đổi nội dung hoặc quyền thành viên).
- Có giới hạn chống spam cảnh báo và khả năng gộp sự kiện trùng lặp.

## Kênh công khai

- Tắt mặc định cho đến khi Admin cấu hình.
- Có thể công khai thông báo chung đã được duyệt mà không công khai bằng chứng/nội dung riêng tư.
- Cho phép người bị nhắc đến được biết thông tin theo quy tắc server, nhưng không công khai nội dung nhạy cảm cho toàn cộng đồng mặc định.
