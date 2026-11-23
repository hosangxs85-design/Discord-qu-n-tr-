# QA report — Discord Community Suite 6.0.0

## Kiểm tra đã chạy trong sandbox

| Kiểm tra | Kết quả | Ghi chú |
|---|---|---|
| Cài dependencies | PASS | `pnpm install --frozen-lockfile`. |
| TypeScript typecheck | PASS | `pnpm typecheck`. |
| Regression/policy tests | PASS | 16 tests; kiểm tra không tự ban/kick/timeout, localization, birthday opt-in/tháng-ngày và xóa dữ liệu khi rời server, poll voting, ticket và FAQ permissions. |
| Production build | PASS | `pnpm build`. |
| Slash command serialization | PASS | 15 command roots; Vietnamese localizations được kiểm tra bằng test. |
| SQLite schema smoke test | PASS | Tạo bảng 6.0, kiểm tra migration từ guild_config v0.5 cũ, một phiếu/member và unique index cho ticket đang mở. |
| Secret hygiene | PASS | Không có token người dùng; `.env`, database và backups không nằm trong source bundle. |
| GitHub workflow | PRESENT | Workflow có trong source; chưa được chạy trên GitHub. |
| Source ZIP | PASS | ZIP 6.0.0 có 69 mục; `unzip -t` thành công; source/tài liệu và `.env.example` có mặt; `.env`, database, `node_modules`, `dist`, `data`, `backups` và `.git` bị loại trừ. |

## Chưa xác minh

| Kiểm tra | Trạng thái | Ghi chú |
|---|---|---|
| Discord REST command registration | NOT RUN | Cần token, Application ID và server thử nghiệm. |
| Discord Gateway/live server | NOT RUN | Không có credentials được cung cấp hoặc sử dụng. |
| Quyền/role/intents thật | NOT RUN | Cần kiểm tra trong một server riêng. |
| Birthday schedule delivery | NOT RUN | Cần bot online, timezone và quyền gửi tại kênh cấu hình. |
| Ticket private overwrites | NOT RUN | Phải kiểm tra trên channel/category và role thực tế; quyền Administrator có thể vượt overwrite. |
| Event reminders và voice lifecycle | NOT RUN | Cần thử REST/Gateway, quyền và chạy bot thật. |
| Android/Termux native build | NOT RUN | Chưa thử trên thiết bị người dùng. |
| GitHub CI, hosting 24/7, backup/restore production | NOT RUN | Chưa kết nối repo hoặc chọn môi trường chạy. |

## Kết luận phát hành

Source ZIP 6.0.0 đã được đóng gói và kiểm tra integrity; các kiểm tra cục bộ đã sẵn sàng để người dùng tải và thử nghiệm. Đây **chưa phải bot đã cài hoặc chạy online trên Discord**. Trước khi dùng server chính, chủ bot cần tạo Application, cấu hình secret tại máy chạy, đăng ký lệnh vào server thử nghiệm và kiểm tra quyền cùng từng module.
