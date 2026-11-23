# 05. Kiến trúc và dữ liệu

## Kiến trúc tham khảo

- **Bot gateway:** Node.js + TypeScript với thư viện Discord được duy trì; xử lý interaction, sự kiện và quyền.
- **Cơ sở dữ liệu:** PostgreSQL cho cấu hình theo guild, vụ việc, lịch, phòng tạm, role trạng thái và sự kiện cần lưu.
- **Hàng đợi/tác vụ nền:** Redis/queue tương đương cho nhắc sự kiện, hết hạn vụ việc, dọn phòng, thông báo và retry có kiểm soát.
- **Worker:** có thể tách lịch/nhạc/nhắc thông báo khỏi tiến trình nhận sự kiện để bot ổn định.
- **Secrets:** token Discord và API keys chỉ trong secret store/environment; tuyệt đối không đưa vào repository, log hay ZIP tài liệu.
- **Quan sát:** log kỹ thuật có cấu trúc, metrics, health check, cảnh báo lỗi và hướng dẫn khôi phục.
- **Website dashboard:** không thuộc MVP; bổ sung sau với Discord OAuth, kiểm tra quyền quản lý guild và API backend an toàn.

Đây là gợi ý kiến trúc, chưa chốt nhà cung cấp host, cơ sở dữ liệu hay hạ tầng.

## Tách mô-đun

1. `config` — thiết lập guild, role, channel, feature flags.
2. `audit` — nhận sự kiện, lọc, định dạng và gửi log.
3. `moderation` — luật phát hiện, vụ việc, hàng chờ và quyết định người duyệt; không có executor xử phạt.
4. `verification` — CAPTCHA, role đối ứng, kiểm tra quyền truy cập.
5. `community` — chào mừng, sinh nhật, FAQ, poll, ticket.
6. `events` — sự kiện, lặp lại, múi giờ, nhắc và lịch.
7. `temporary_voice` — lobby, phòng, ID, quyền, dọn phòng.
8. `music` / `radio` — adapter riêng cho nguồn hợp lệ; có thể tắt độc lập.
9. `weather` — adapter nhà cung cấp dự báo.
10. `permissions` — kiểm tra quyền tập trung trước mọi thao tác.

## Mô hình dữ liệu khái quát

- `guild_config`: guild_id, timezone, language, feature_flags, retention_policy.
- `channel_routes`: guild_id, event_type, channel_id, enabled.
- `role_permissions`: guild_id, role_id, capability.
- `audit_event`: guild_id, event_type, actor_id, subject_id, channel_id, occurred_at, redacted_payload.
- `moderation_case`: case_id, guild_id, subject_id, rule_id, status, created_at, assigned_to, decision_by, decision_at, notes.
- `verification_state`: guild_id, user_id, state, updated_at; role Discord được đồng bộ theo trạng thái.
- `birthday_profile`: guild_id, user_id, date data cần thiết, visibility, timezone; cho phép xóa.
- `event`: event_id, guild_id, title, start_at_utc, end_at_utc, timezone, recurrence, status.
- `event_rsvp`: event_id, user_id, response.
- `voice_lobby`: guild_id, source_channel_id, category_id, template, settings.
- `temporary_room`: room_id, guild_id, voice_channel_id, owner_id, visibility, locked, created_at, empty_since.
- `scheduled_job`: job_id, guild_id, type, due_at, status, idempotency_key.

Không lưu dữ liệu nào nếu không có mục đích rõ ràng. Ưu tiên lưu metadata; nội dung tin nhắn và sinh nhật cần chính sách rõ.

## Tính nhất quán và phục hồi

- Dùng khóa idempotency cho nhắc lịch, log có thể gửi lại và tác vụ dọn phòng.
- Phòng tạm có thể được tái đồng bộ với kênh thực sau khi bot khởi động lại.
- Nếu không tìm thấy kênh/role đã cấu hình, báo lỗi riêng cho Admin và không thực hiện thao tác nguy hiểm.
- Khi bot mất kết nối, không giả định đã xử lý hết sự kiện; ghi nhận hạn chế và cung cấp trạng thái.
- Có backup dữ liệu cấu hình và quy trình khôi phục; giới hạn quyền truy cập bản sao lưu.

## Cấu hình mẫu (minh họa)

```yaml
guild:
  timezone: "Asia/Ho_Chi_Minh"
  moderation:
    auto_punishment: false
    review_channel_id: null
    public_announcement: false
  verification:
    enabled: false
    unverified_role_id: null
    verified_role_id: null
    visible_channels: []
  temporary_voice:
    enabled: false
    empty_delete_after_seconds: 5
    lobbies: []
  privacy:
    message_content_logging: false
    retention_days: 30
```

Cấu hình mẫu chỉ là khung; ID thực tế chưa được cung cấp. `auto_punishment: false` là bất biến theo đặc tả hiện tại, không phải tùy chọn bật/tắt.
