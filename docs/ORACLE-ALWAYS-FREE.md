# Triển khai bot trên Oracle Cloud Always Free

Tài liệu này hướng dẫn chạy bot bằng Docker Compose trên một Oracle Cloud Infrastructure (OCI) Compute VM. Đây là phương án miễn phí có thể chạy tiến trình Discord Gateway liên tục, nhưng không phải cam kết uptime: OCI giới hạn năng lực theo khu vực và có thể thu hồi máy ảo Always Free bị xem là nhàn rỗi. Bot ít hoạt động có thể không đạt ngưỡng sử dụng mà OCI quy định. Không dùng hướng dẫn này nếu bot cần SLA hoặc không thể chấp nhận gián đoạn.

## 1. Tạo máy ảo

Trong Oracle Cloud Console, đăng ký Free Tier nếu bạn chưa có tài khoản. Khi tạo Compute instance, chọn **home region**, image Ubuntu Server được đánh dấu đủ điều kiện Always Free, shape **VM.Standard.A1.Flex**, và phân bổ trong hạn mức miễn phí. Ví dụ 1 OCPU và 6 GB RAM đủ để bắt đầu với bot này. Không chọn shape hay tài nguyên có nhãn tính phí. Nếu gặp lỗi hết năng lực, Oracle hướng dẫn thử availability domain khác hoặc đợi rồi thử lại.

Tạo hoặc tải SSH key khi khởi tạo instance và lưu private key an toàn. Trong VCN/security list, chỉ mở inbound TCP 22 từ địa chỉ IP quản trị cần thiết. Bot dùng kết nối đi tới Discord; không cần mở cổng HTTP hay cổng bot inbound. Không gửi SSH private key, token Discord hoặc thông tin thẻ vào repo hay chat.

## 2. Cài Docker và lấy source

Kết nối SSH vào Ubuntu VM. Cài Git và Docker Engine cùng plugin Docker Compose theo hướng dẫn chính thức dành cho Ubuntu tại [Docker Engine installation](https://docs.docker.com/engine/install/ubuntu/). Sau đó clone repo:

```bash
git clone https://github.com/hosangxs85-design/Discord-qu-n-tr-.git
cd Discord-qu-n-tr-
cp .env.example .env
chmod 600 .env
nano .env
```

Điền `DISCORD_TOKEN`, `DISCORD_CLIENT_ID` và `DISCORD_TEST_GUILD_ID` vào `.env`. Dùng ID của server thử nghiệm trước. Không bỏ `DISCORD_TEST_GUILD_ID` cho tới khi đã xác minh lệnh và quyền trên server thử nghiệm.

## 3. Đăng ký slash command và chạy bot

Từ thư mục repo, build image công cụ và đăng ký command vào server thử nghiệm:

```bash
docker compose --profile tools run --rm commands
```

Sau đó build và chạy bot:

```bash
docker compose up -d --build
docker compose logs -f bot
```

Kiểm tra container sau khi thoát khỏi chế độ xem log:

```bash
docker compose ps
docker compose logs --tail=100 bot
```

Compose đặt `restart: unless-stopped` để Docker khởi chạy lại tiến trình sau khi thoát hoặc sau khi VM khởi động lại, miễn là Docker được bật cùng hệ thống. Bot không mở cổng inbound. SQLite được lưu trong Docker named volume `bot-data`, vì vậy dữ liệu không nằm trong lớp filesystem tạm của container.

## 4. Cập nhật và sao lưu

Cập nhật source có chủ ý rồi triển khai lại:

```bash
git pull --ff-only
docker compose up -d --build
```

Trước khi cập nhật lớn, sao lưu SQLite và giữ bản sao ở nơi riêng tư, ngoài VM. SQLite chứa dữ liệu cấu hình và thành viên của server; không commit file database, bản sao lưu hoặc `.env`. Kiểm tra restore định kỳ trên môi trường thử nghiệm.

Nếu token Discord từng bị lộ, reset token trong Developer Portal rồi cập nhật `.env` trên VM và chạy lại `docker compose up -d`.

## Giới hạn gói miễn phí

OCI công bố Compute Always Free trong home region, nhưng dung lượng có thể hết ở khu vực/availability domain đang chọn. Theo tài liệu OCI, VM Always Free có thể bị thu hồi khi trong 7 ngày các chỉ số sử dụng liên quan đều dưới ngưỡng idle; tài liệu nêu CPU p95 dưới 20% và network dưới 20%, đồng thời kiểm tra memory dưới 20% với shape A1. Một bot cộng đồng ít sự kiện có nguy cơ bị coi là idle. Không tạo tải giả để né chính sách thu hồi. Gói miễn phí cũng không nên được xem là dịch vụ có SLA.

Tài liệu tham khảo:

- [OCI Always Free Resources](https://docs.oracle.com/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)
- [OCI Free Tier FAQ](https://www.oracle.com/cloud/free/faq/)
- [Docker Engine installation for Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
