# Deployment notes — v6.0.0

## Yêu cầu

- Node.js 22 trở lên và Corepack/pnpm 11.25.0.
- Persistent storage cho SQLite (`DATABASE_PATH`, mặc định `./data/bot.sqlite`). Không đặt production database trên filesystem tạm thời.
- Kết nối mạng ra Discord Gateway/API và Open-Meteo nếu cần thời tiết.
- Bot cần chạy liên tục để nhận sự kiện và gửi nhắc đúng giờ. Android/Termux là phương án thử nghiệm, không bảo đảm uptime.
- Triển khai Docker Compose trên Oracle Cloud Always Free được hướng dẫn tại [`docs/ORACLE-ALWAYS-FREE.md`](docs/ORACLE-ALWAYS-FREE.md). Oracle có thể thu hồi VM Always Free bị đánh giá idle; gói miễn phí không bảo đảm uptime hoặc SLA.

## Cài và chạy trên Linux/VM

Trong thư mục source:

```bash
corepack enable
corepack prepare pnpm@11.25.0 --activate
pnpm install --frozen-lockfile
cp .env.example .env
```

Điền `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_TEST_GUILD_ID` trong `.env` trên máy chạy bot. Hạn chế quyền đọc file, không commit file bí mật. Sau đó:

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm deploy:commands
pnpm start
```

Ưu tiên đăng ký lệnh vào guild thử nghiệm qua `DISCORD_TEST_GUILD_ID`. Chỉ bỏ biến này khi chủ bot chủ động muốn đăng ký toàn cục. Nếu chạy bằng systemd/process manager, lưu database ở đường dẫn bền vững và bật auto-restart có giới hạn; không để hai tiến trình bot cùng dùng chung SQLite file.

## Discord intents và permission

Bật **Server Members Intent** trong Developer Portal. Source sử dụng guild, guild members, guild messages, guild moderation và guild voice states; **Message Content Intent không được bật**. Cần kiểm tra portal intents và quyền cài đặt bot.

Permission theo tính năng: View Channels, Send Messages, Embed Links, Read Message History, Manage Roles cho xác minh, Manage Channels cho phòng voice tạm và tạo ticket, Move Members để chuyển thành viên từ lobby sang phòng vừa tạo. Không cấp Administrator mặc định. Đưa role bot lên trên role xác minh. Giới hạn quyền Manage Channels/Move Members ở server thử nghiệm trước.

OAuth scopes: `bot`, `applications.commands`.

## Cấu hình khởi đầu

1. Dùng `/thiết-lập` để cấu hình kênh log, xác minh, sự kiện, sinh nhật và role cơ bản.
2. Đặt quyền kênh sao cho role `Chưa xác minh` chỉ thấy kênh CAPTCHA; role `Đã xác minh` thấy các kênh thành viên. Bot không tự sửa permission toàn server.
3. Dùng `/thiết-lập-phòng thêm` cho từng lobby (có thể cấu hình tám lobby).
4. Tạo sự kiện thử nghiệm với thời gian ISO 8601 kèm offset, ví dụ `2026-12-01T19:30:00+07:00`.
5. Thử log, nút review, chuyển voice, khóa/ẩn/mã phòng, xóa phòng trống, poll, birthday opt-in, FAQ và restart trước khi dùng server thật.
6. Cấu hình ticket bằng `/hỗ-trợ cấu-hình`, kiểm tra người ngoài không thấy kênh, rồi xác nhận đóng ticket giữ lại lịch sử.

## Sao lưu và khôi phục

Dừng tiến trình hoặc dùng checkpoint/backup SQLite phù hợp với WAL; script Termux có `scripts/termux-backup.sh`. Bản sao lưu chứa dữ liệu server, cần giữ riêng tư và không commit. Sau khi khôi phục, chạy bot trên server thử nghiệm để xác nhận migration và dữ liệu trước khi chuyển về production.

## Release checklist

- [ ] `pnpm install --frozen-lockfile` thành công.
- [ ] `pnpm typecheck`, `pnpm test`, `pnpm build` thành công.
- [ ] Slash commands đăng ký được lên guild thử nghiệm.
- [ ] Không có đường xử lý tự ban/kick/timeout.
- [ ] Người không có quyền không thể xem/duyệt vụ việc hay quản lý phòng người khác.
- [ ] CAPTCHA/role/channel permissions kiểm thử trên server thật.
- [ ] Event timezone, reminders và lịch trong cửa sổ ±30 ngày kiểm thử.
- [ ] 8 lobby, mã riêng, rate limit, dọn phòng trống và recovery sau restart kiểm thử.
- [ ] Birthday opt-in/remove và lịch 09:00 theo múi giờ kiểm thử; poll chỉ ghi một phiếu/member.
- [ ] Ticket private overwrites, người được quyền đóng và giữ lại channel history kiểm thử.
- [ ] FAQ chỉ người có quyền được thêm/sửa/gỡ.
- [ ] Backup/restore và retention policy được chủ server xác nhận.
- [ ] Chỉ sau khi hoàn tất mới cân nhắc đưa lên server chính.
