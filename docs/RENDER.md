# Triển khai trên Render

Repo có `render.yaml` để tạo một Render Background Worker từ Dockerfile. Worker không cần cổng inbound; nó giữ kết nối Discord Gateway và dùng disk 1 GB gắn tại `/data` cho SQLite. Blueprint chọn compute plan `0.5c-512mb` tại Singapore và chỉ tự deploy sau khi các GitHub checks trên `main` thành công.

## Chi phí và giới hạn

Render liệt kê compute plan Starter tương ứng `0.5c-512mb` ở mức **$7 USD/tháng**. Disk được tính **$0.25 USD/GB/tháng**; cấu hình repo dùng 1 GB. Thuế, phí mạng hoặc thay đổi giá theo tài khoản có thể phát sinh. Không chọn Free Web Service cho bot này: free service ngủ khi không có inbound request và filesystem của nó tạm thời, nên không phù hợp với Gateway bot hoặc SQLite.

Render nói background worker là tiến trình chạy liên tục, không nhận traffic inbound. Paid workers có thể gắn persistent disk. Disk gắn với một service instance, vì vậy giữ `numInstances: 1` khi dùng SQLite.

## Tạo Blueprint

1. Đăng nhập Render, chọn **New → Blueprint** và kết nối GitHub nếu Render hỏi.
2. Chọn repo `hosangxs85-design/Discord-qu-n-tr-`, nhánh `main`, rồi xem trước Blueprint. Không triển khai nếu plan không hiện `0.5c-512mb` hoặc disk không được gắn tại `/data`.
3. Render yêu cầu điền ba giá trị được khai báo `sync: false`: `DISCORD_TOKEN`, `DISCORD_CLIENT_ID` và `DISCORD_TEST_GUILD_ID`. Nhập chúng trực tiếp vào Render, không commit vào GitHub hay gửi qua chat. Dùng token của bot và Application ID trong Discord Developer Portal; `DISCORD_TEST_GUILD_ID` phải là server thử nghiệm.
4. Xác nhận đúng plan paid `$7/tháng` cộng disk 1 GB, rồi chọn **Deploy Blueprint**. Render sẽ build Docker image, chạy `node dist/deploy-commands.js` trước deploy để đăng ký slash commands vào server thử nghiệm, rồi chạy bot.

## Discord app và server thử nghiệm

Trong Discord Developer Portal bật **Server Members Intent** cho app. Cài bot vào server thử nghiệm với scopes `bot` và `applications.commands`; chỉ cấp quyền cần dùng, không cấp Administrator mặc định. Source dùng Manage Roles cho xác minh, Manage Channels cho ticket/phòng voice, Move Members khi tạo phòng từ lobby và các quyền đọc/gửi tin cần thiết. Đưa role bot lên trên role xác minh.

Chỉ sau khi kiểm tra lệnh, quyền kênh, ticket private, reminder và tính năng voice trên server thử nghiệm mới cân nhắc dùng server chính. `DISCORD_TEST_GUILD_ID` được giữ trong biến môi trường để lệnh không bị đăng ký toàn cục.

## Kiểm tra và vận hành

Trong Render, xem tab **Events** và **Logs** của worker. Thành công khi pre-deploy hoàn tất, log báo bot đăng nhập Discord và số guild phù hợp. Bot tự khởi động lại theo cấu hình Render khi tiến trình lỗi hoặc service được khởi động lại; SQLite nằm trên persistent disk.

Cập nhật code qua GitHub. Render tự build `main` sau khi GitHub Actions hoàn tất thành công. Trước khi deploy bản lớn, sao lưu dữ liệu SQLite; lưu bản sao bên ngoài Render và không commit nó.

Tham khảo tài liệu chính thức:

- [Render pricing](https://render.com/pricing)
- [Compute plans](https://render.com/docs/compute-plans)
- [Background workers](https://render.com/docs/background-workers)
- [Persistent disks](https://render.com/docs/disks)
- [Blueprints](https://render.com/docs/infrastructure-as-code)
- [Pre-deploy commands](https://render.com/docs/deploys)
