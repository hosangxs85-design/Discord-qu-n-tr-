# Chạy Discord Community Suite trên Android bằng Termux

Đây là phương án **thử nghiệm miễn phí**, không phải hosting 24/7 được bảo đảm. Điện thoại phải có Internet và Android có thể dừng tiến trình nền, đặc biệt trên Android 12 trở lên.

## 1. Cài Termux

- Chỉ cài từ trang F-Droid chính thức: https://f-droid.org/packages/com.termux/ hoặc GitHub chính thức của dự án Termux.
- Không cài các bản Termux từ website APK không rõ nguồn.
- Nếu dùng plugin Termux khác trong tương lai, các ứng dụng Termux nên đến từ cùng một nguồn phát hành để tránh xung đột chữ ký.

## 2. Đưa source vào điện thoại

1. Tải file ZIP của dự án về điện thoại.
2. Mở Termux và chạy:

```bash
termux-setup-storage
```

3. Chấp thuận quyền truy cập tệp khi Android hỏi.
4. Giải nén ZIP bằng ứng dụng quản lý tệp Android vào `Download`.
5. Trong Termux, chuyển đến thư mục đã giải nén. Ví dụ:

```bash
cd ~/storage/downloads/discord-community-suite-6.0.0
```

Tên thư mục có thể khác tùy ứng dụng giải nén. Có thể chạy `ls ~/storage/downloads` để xem tên thực tế.

## 3. Cài và kiểm tra

```bash
bash scripts/termux-setup.sh
```

Script sẽ cài Node.js LTS, công cụ build cần thiết, dependencies, sau đó chạy typecheck, test và build. Nếu có bước nào lỗi, dừng tại đó; không tiếp tục đăng ký lệnh hoặc chạy bot. Gửi lại phần thông báo lỗi cuối cùng, nhưng tuyệt đối không gửi Token hay nội dung `.env`.

## 4. Cấu hình bí mật trên điện thoại

Mở file cấu hình cục bộ:

```bash
nano .env
```

Điền ba giá trị:

- `DISCORD_TOKEN`: token bot trong Developer Portal.
- `DISCORD_CLIENT_ID`: Application ID.
- `DISCORD_TEST_GUILD_ID`: ID server thử nghiệm.

Token chỉ nhập trực tiếp vào Termux trên điện thoại. Không dán Token vào ChatGPT, Discord, ảnh chụp màn hình, GitHub hoặc file công khai.

Lưu trong nano: `Ctrl+O`, Enter; thoát: `Ctrl+X`.

## 5. Cài bot vào server và chạy

Nếu bot chưa ở trong server thử nghiệm, dùng Developer Portal để tạo link cài đặt với scopes `bot` và `applications.commands`, chỉ cấp quyền tối thiểu theo README. Không cấp Administrator. Đảm bảo role bot nằm trên hai role xác minh.

Sau khi đã cài bot và cấu hình `.env`, chạy:

```bash
bash scripts/termux-start.sh
```

Khi log báo bot online, mở server thử nghiệm và chạy `/ping`. Giữ Termux mở trong lần thử nghiệm. Nhấn `Ctrl+C` trong Termux để dừng bot.

## 6. Sao lưu

Trước khi cập nhật source hoặc thử migration, chạy:

```bash
bash scripts/termux-backup.sh
```

Các bản sao lưu nằm trong `backups/`. Không xóa thư mục `data/` hoặc `backups/` khi chưa chắc chắn.

## 7. Giới hạn Android

- Điện thoại không phải máy chủ chuyên dụng; Wi-Fi/4G mất kết nối hoặc Android dừng tiến trình sẽ làm bot offline.
- Không có cam kết uptime 24/7.
- Không nên chạy các tác vụ nặng hoặc nhiều bot cùng lúc trên điện thoại.
- Chỉ dùng server thử nghiệm trong giai đoạn này.
- Khi có máy chủ cloud phù hợp, có thể chuyển source và database theo quy trình migration/backup.
