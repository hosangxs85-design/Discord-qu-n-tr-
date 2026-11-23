# Discord Community Suite 6.0.0

Bot Discord đa năng bằng TypeScript/discord.js, nâng cấp từ source 0.5.0 theo mốc 6.0 bạn yêu cầu. Đây là **gói source có hướng dẫn chạy và các module MVP đã kiểm thử cục bộ**, chưa phải triển khai online: muốn kết nối Discord cần tự tạo Application/Bot, nhập token vào `.env` ở thiết bị chạy và cài bot vào một server thử nghiệm.

## Có trong bản 6.0.0

| Nhóm | Đã triển khai |
|---|---|
| An toàn moderation | `/báo-cáo` tạo vụ việc; Admin/Quản trị xem kênh duyệt và chọn Chấp thuận/Để treo/Từ chối. Bot không tự ban, kick hoặc timeout. |
| Nhật ký | Thành viên vào/rời, biệt danh/role, kênh/role, voice, ban/unban nhận được từ Discord; sửa/xóa tin nhắn chỉ log metadata, không lưu nội dung. |
| Xác minh | CAPTCHA số học, role Chưa xác minh/Đã xác minh, cấp thủ công bởi người có quyền. |
| Chào/tạm biệt | Chọn kênh, tùy chỉnh mẫu `{user}` và `{server}`. |
| Sự kiện | Tạo/hủy, lịch 30 ngày trước và sau, RSVP Tham gia/Quan tâm, hiển thị múi giờ, nhắc mặc định 24 giờ/1 giờ/10 phút; nhắc quá hạn trên 5 phút bị bỏ qua để tránh gửi dồn khi bot offline. |
| Phòng voice tạm | Cấu hình nhiều lobby (có thể thêm đủ 8), khóa/mở, ẩn/hiện, mã riêng 16 ký tự, cài đặt chủ phòng và quản trị, xóa sau ít nhất 5 giây trống; bot phát nhạc không giữ phòng. |
| Thời tiết | `/thời-tiết` tra cứu theo thành phố qua Open-Meteo, không cần API key. |
| Sinh nhật | Thành viên tự nguyện đăng ký ngày/tháng; bot chúc mừng tại kênh đã cấu hình lúc 09:00 theo múi giờ server; có thể xem danh sách riêng tư hoặc gỡ đăng ký. Không lưu năm sinh; xóa đăng ký và lịch gửi khi thành viên rời server. |
| Bình chọn | Poll 2–4 lựa chọn bằng nút; mỗi người có một phiếu và có thể đổi lựa chọn; người tạo hoặc Admin/Quản trị được đóng. |
| Ticket hỗ trợ | Tạo kênh riêng tư theo từng người, role hỗ trợ được cấu hình; đóng ticket sẽ giữ kênh/lịch sử, không xóa transcript. |
| FAQ | Admin/Quản trị thêm/sửa/gỡ mục FAQ theo mã; thành viên tra cứu câu trả lời bằng lệnh slash, không cần bật đọc nội dung tin nhắn. |
| Lệnh | Slash Command có bản địa hóa tên tiếng Việt; cấu trúc phân nhóm, embed và nút tương tác. |

## Lệnh chính

Tên hiển thị có dấu khi ứng dụng Discord đặt tiếng Việt. Do giới hạn cấu trúc Slash Command, tên lệnh không thể viết như câu có dấu cách tùy ý; bot dùng tên nhóm và lệnh con, ví dụ `/sự-kiện lịch`, `/phòng khóa`, `/thiết-lập-phòng thêm`.

| Lệnh hiển thị | Mục đích |
|---|---|
| `/kiểm-tra` | Ping/độ trễ bot |
| `/thiết-lập` | Cấu hình kênh log, duyệt, chào/tạm biệt, xác minh, sự kiện, role và múi giờ |
| `/trạng-thái` | Xem cấu hình |
| `/báo-cáo` | Gửi báo cáo riêng đến hàng đợi xem xét |
| `/vụ-việc` | Xem hàng đợi (chỉ người có quyền) |
| `/bảng-xác-minh` | Đăng bảng CAPTCHA |
| `/cấp-xác-minh` | Cấp trạng thái đã xác minh thủ công |
| `/sự-kiện tạo`, `/sự-kiện lịch`, `/sự-kiện hủy` | Quản lý sự kiện |
| `/thiết-lập-phòng thêm/gỡ/danh-sách` | Cấu hình nhiều kênh lobby voice |
| `/phòng khóa/mở/ẩn/hiện/mã/vào-mã/đổi-tên/giới-hạn/quản-trị` | Quản lý phòng voice tạm |
| `/thời-tiết` | Tra cứu thời tiết |
| `/sinh-nhật đăng-ký/xóa/danh-sách` | Tự nguyện đăng ký, gỡ hoặc xem ngày sinh đã đăng ký |
| `/bình-chọn tạo/đóng` | Tạo poll, xem số phiếu trực tiếp, đóng poll |
| `/hỗ-trợ cấu-hình/mở/đóng` | Cấu hình role hỗ trợ, mở ticket riêng tư, đóng ticket |
| `/câu-hỏi thêm/gỡ/danh-sách/xem` | Quản trị và tra cứu FAQ của server |

Khi nhập ngày sự kiện, phải dùng ISO 8601 có múi giờ, ví dụ `2026-12-01T19:30:00+07:00`. Lịch hiển thị ngày, giờ, giây và múi giờ đã cài trong `/thiết-lập`.

## Cài đặt và chạy

Yêu cầu Node.js 22 trở lên, pnpm 11.25.0 và internet. Trong thư mục gốc vừa giải nén, dùng Corepack nếu có; nếu không có, cài pnpm bằng npm:

```bash
corepack enable
corepack prepare pnpm@11.25.0 --activate
# Nếu Corepack không có: npm install --global pnpm@11.25.0
pnpm install --frozen-lockfile
cp .env.example .env
```

Điền `.env` **trên thiết bị chạy bot**:

```dotenv
DISCORD_TOKEN=token_bot
DISCORD_CLIENT_ID=application_id
DISCORD_TEST_GUILD_ID=id_server_thu_nghiem
DATABASE_PATH=./data/bot.sqlite
LOG_LEVEL=info
```

Không gửi token cho người khác, không commit `.env`, không đưa token vào ảnh chụp hoặc GitHub. Sau đó kiểm tra, đăng ký slash command vào server thử nghiệm và chạy:

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm deploy:commands
pnpm start
```

`DISCORD_TEST_GUILD_ID` giúp lệnh cập nhật nhanh vào server thử nghiệm. Nếu bỏ giá trị này, script sẽ đăng ký lệnh toàn cục; không dùng trước khi đã kiểm tra ở server thử nghiệm.

## Discord Developer Portal và quyền cần thiết

Bật **Server Members Intent** trong Developer Portal. Bot cần các quyền tối thiểu theo tính năng đã bật: View Channels, Send Messages, Embed Links, Read Message History, Manage Roles (xác minh), Manage Channels (phòng tạm và ticket), Move Members (tạo/chuyển thành viên từ lobby) và Connect nếu bot thực sự tham gia voice ở phiên bản sau. Bật intent moderation/voice phù hợp với nhật ký. **Không cấp Administrator mặc định.** Đưa role bot cao hơn hai role xác minh.

Để CAPTCHA giới hạn thành viên mới đúng yêu cầu, cấu hình permission của các kênh server: role `Chưa xác minh` chỉ được xem kênh xác minh; role `Đã xác minh` được xem các kênh thành viên. `/thiết-lập` lưu role và kênh nhưng không tự sửa permission toàn bộ server, nhằm tránh khóa nhầm các kênh hiện có.

## Cấu hình theo thứ tự

1. Cài bot vào server thử nghiệm với scopes `bot` và `applications.commands`.
2. Chạy `/thiết-lập`, chọn kênh log/kiểm duyệt/chào/tạm biệt/xác minh/sự kiện/sinh nhật, role xác minh/duyệt và múi giờ.
3. Tạo các role `Chưa xác minh` và `Đã xác minh`, cấu hình quyền kênh thủ công, rồi chạy `/bảng-xác-minh`.
4. Thêm từng lobby bằng `/thiết-lập-phòng thêm`; có thể thêm 8 kênh khác nhau và đặt thời gian xóa từ 5 giây trở lên.
5. Kiểm tra `/báo-cáo`, các nút duyệt, xác minh, sự kiện, voice ẩn/khóa, sinh nhật, poll, ticket, FAQ và `/thời-tiết` trên server thử nghiệm trước.

Để dùng ticket, Admin/Quản trị cấu hình `/hỗ-trợ cấu-hình` với role hỗ trợ và tùy chọn danh mục. Người dùng mở ticket bằng `/hỗ-trợ mở`; chỉ người tạo, role hỗ trợ và Admin/Quản trị có thể đóng. Đóng không xóa kênh. Để dùng FAQ, quản trị thêm mục bằng `/câu-hỏi thêm` rồi thành viên xem danh sách hoặc tra theo mã.

Mã phòng voice là mã mời riêng ngẫu nhiên 16 ký tự hex. Người nhập mã được cấp quyền kênh riêng; hệ thống giới hạn 5 lần thử/phút. Admin/Quản trị dùng `/phòng quản-trị` với kênh và thao tác. Quyền Administrator Discord có thể vượt permission overwrite theo thiết kế nền tảng.

## Bảo mật và dữ liệu

Bot không xin Message Content Intent và không lưu nội dung tin nhắn. Bản này ghi metadata về sự kiện sửa/xóa; Discord có thể không gửi một số sự kiện khi bot offline, thiếu intent hoặc thiếu quyền. Không hỗ trợ ghi âm voice hoặc đọc DM.

Moderation chỉ tạo đề xuất và ghi nhận quyết định của người có quyền. “Chấp thuận” không thi hành hình phạt. Bộ lọc từ cấm tự động chưa được bật trong bản này; các ví dụ từ thông tục người dùng muốn cho phép không bị bot tự xử lý vì không có bộ lọc nội dung. Sinh nhật là opt-in, chỉ lưu tháng/ngày; khi đăng ký thành viên đồng ý được nhắc tên tại kênh sinh nhật. Kênh ticket được đặt private; đóng ticket giữ lại nội dung tại Discord nhưng không có công cụ xuất transcript. Dữ liệu lưu cục bộ trong SQLite ở `data/bot.sqlite`; hãy sao lưu và bảo vệ máy chạy bot.

## Chưa có trong 6.0.0

Website mời bot/dashboard, sự kiện lặp lại, bình chọn thời gian sự kiện, bộ lọc từ cấm có ngữ cảnh và chế độ quan sát, âm nhạc/radio, bảng xếp hạng voice, role tự chọn, ticket transcript/export, lưu trữ log theo hạn và tự động hóa mở rộng vẫn là backlog. Không mô tả những phần này như đã hoàn thành.

## Kiểm thử và triển khai

```bash
pnpm typecheck
pnpm test
pnpm build
```

Trên Android xem `TERMUX-ANDROID.md` (điện thoại không đảm bảo chạy 24/7). Xem `DEPLOYMENT-NOTES.md` nếu triển khai trên máy chủ Linux. GitHub Actions chỉ kiểm thử/build, không giữ bot online.
Để chạy bot bằng Docker Compose trên Oracle Cloud Always Free, xem [`docs/ORACLE-ALWAYS-FREE.md`](docs/ORACLE-ALWAYS-FREE.md). Gói miễn phí có thể bị thu hồi nếu VM bị xem là idle và không cung cấp bảo đảm uptime.

## Nguồn yêu cầu

Bộ đặc tả ban đầu được giữ trong `docs/spec/`. Thay đổi triển khai và giới hạn của phiên bản nằm trong `CHANGELOG.md`, `PROJECT-STATUS.md` và `QA-REPORT.md`.
