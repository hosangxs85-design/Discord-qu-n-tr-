# Triển khai bot trên Render

Repo có hai Blueprint tách biệt:

- `render-free.yaml`: Web Service gói Free để thử nghiệm. Dùng Dockerfile hiện có, bind cổng HTTP do Render cấp và health check tại `/healthz`. SQLite được đặt ở `/tmp/bot.sqlite`; không có disk bền vững.
- `render.yaml`: Background Worker có disk SQLite, dành cho phương án trả phí liên tục. Không chọn Blueprint này trong lần thử nghiệm Free.

## Render Free để thử nghiệm

Gói Free chỉ phù hợp để thử. Web Service có thể ngủ sau 15 phút không nhận inbound traffic, cần khoảng một phút để khởi động lại, có thể bị Render restart bất kỳ lúc nào, và filesystem bị xóa khi service ngủ, restart hoặc redeploy. Vì vậy dữ liệu SQLite và cấu hình/ticket/poll/birthday lưu trong đó có thể mất; không dùng server chính hay dữ liệu quan trọng. Mỗi workspace có 750 giờ chạy Free mỗi tháng; khi hết hạn mức, dịch vụ có thể bị tạm dừng. Free không có persistent disk, SSH/shell hoặc pre-deploy command. Xem [giới hạn Free](https://render.com/docs/free) và [quy trình deploy](https://render.com/docs/deploys).

Bot là một Discord Gateway client nhưng cần được triển khai như Web Service trên Free. Endpoint `/healthz` chỉ xác nhận tiến trình HTTP đang sống; nó không đảm bảo bot đã kết nối Discord. Hãy xác nhận log `Bot online as ...` trong Render. `REGISTER_COMMANDS_ON_START=true` đăng ký slash commands vào server thử nghiệm sau mỗi lần khởi động hoặc wake; việc đăng ký dùng Discord API và có thể mất vài giây.

### Tạo Blueprint Free

1. Trong Render chọn **New → Blueprint**, chọn repo `hosangxs85-design/Discord-qu-n-tr-` và nhánh `main`. Khi được hỏi vị trí Blueprint, chọn `render-free.yaml`.
2. Trước khi tiếp tục, kiểm tra service là **Web Service**, compute plan là **Free**, không có disk và không có tài nguyên trả phí. Không thêm thẻ hoặc nâng cấp plan cho lần thử này.
3. Nhập `DISCORD_TOKEN` trực tiếp vào secret field của Render. Không gửi token trong chat, không commit token vào GitHub. Nhập `DISCORD_TEST_GUILD_ID` của server Discord thử nghiệm vào biến môi trường. Application ID `1574581219906293780` đã được điền trong file Blueprint.
4. Đảm bảo bot được cài vào server thử nghiệm với OAuth2 scopes `bot` và `applications.commands`, và chỉ cấp quyền cần dùng. **Server Members Intent** đã bật trong Discord Developer Portal. Không cấp Administrator mặc định.
5. Deploy Blueprint. Render build Docker image, khởi động health endpoint, đăng ký slash commands cho server thử nghiệm, rồi kết nối bot. Kiểm tra log đăng ký lệnh và log `Bot online as ...`; mở URL `/healthz` để xác nhận HTTP health check trả `200`.

`DISCORD_TEST_GUILD_ID` được giữ riêng để commands được đăng ký ngay vào server thử nghiệm thay vì đợi đồng bộ commands toàn cục. Nhập Snowflake ID của server, không phải tên server. Khi service ngủ hoặc restart, đăng ký lại cùng bộ commands là thao tác ghi đè idempotent.

## Discord app và server thử nghiệm

Trong Discord Developer Portal, tạo hoặc dùng application `quản gia`, mở mục **Bot** và tạo/reset token khi cần. Đưa token trực tiếp vào Render secret field. Khi mời bot, dùng scopes `bot` và `applications.commands`; chỉ cấp quyền cần dùng. Source cần Manage Roles cho xác minh, Manage Channels cho ticket/phòng voice, Move Members khi tạo phòng từ lobby và các quyền đọc/gửi tin cần thiết. Đưa role bot lên trên role xác minh.

Chỉ sau khi kiểm tra slash commands, quyền kênh, ticket private, reminder và tính năng voice trên server thử nghiệm mới cân nhắc cài bot lên server chính.

## Lựa chọn trả phí sau này

`render.yaml` giữ cấu hình Background Worker có disk 1 GB tại `/data`, SQLite bền vững hơn qua restart/redeploy, và compute plan `0.5c-512mb`. Tài liệu Render hiện liệt kê mức khoảng **$7 USD/tháng** cho compute và **$0.25 USD/GB/tháng** cho disk; giá có thể thay đổi. Chỉ dùng Blueprint này sau khi chủ repo chủ động chọn paid plan. Paid Worker không cần HTTP health endpoint để nhận traffic, nhưng code có thể giữ endpoint mà không ảnh hưởng.

## Nguồn chính thức

- [Render Free](https://render.com/docs/free)
- [Render Web Services](https://render.com/docs/web-services)
- [Render Docker](https://render.com/docs/docker)
- [Render Blueprints](https://render.com/docs/blueprint-spec)
- [Render deploys và pre-deploy commands](https://render.com/docs/deploys)
- [Render pricing](https://render.com/pricing)
- [Render persistent disks](https://render.com/docs/disks)
