import {
  ChannelType, Locale, PermissionFlagsBits, SlashCommandBuilder, SlashCommandSubcommandBuilder
} from 'discord.js';

const localizeCommand = (command: SlashCommandBuilder, name: string) =>
  command.setNameLocalizations({ [Locale.Vietnamese]: name });
const localizeSubcommand = (command: SlashCommandSubcommandBuilder, name: string) =>
  command.setNameLocalizations({ [Locale.Vietnamese]: name });

const setup = localizeCommand(
  new SlashCommandBuilder().setName('setup').setDescription('Thiết lập các kênh, vai trò và nội dung cơ bản.'),
  'thiết-lập'
).setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addChannelOption(o => o.setName('kenh_log').setNameLocalizations({ [Locale.Vietnamese]: 'kênh-log' }).setDescription('Kênh nhật ký server').addChannelTypes(ChannelType.GuildText))
  .addChannelOption(o => o.setName('kenh_duyet').setNameLocalizations({ [Locale.Vietnamese]: 'kênh-duyệt' }).setDescription('Kênh hàng đợi kiểm duyệt').addChannelTypes(ChannelType.GuildText))
  .addChannelOption(o => o.setName('kenh_chao_mung').setNameLocalizations({ [Locale.Vietnamese]: 'kênh-chào-mừng' }).setDescription('Kênh chào thành viên mới').addChannelTypes(ChannelType.GuildText))
  .addChannelOption(o => o.setName('kenh_tam_biet').setNameLocalizations({ [Locale.Vietnamese]: 'kênh-tạm-biệt' }).setDescription('Kênh thông báo thành viên rời server').addChannelTypes(ChannelType.GuildText))
  .addChannelOption(o => o.setName('kenh_xac_minh').setNameLocalizations({ [Locale.Vietnamese]: 'kênh-xác-minh' }).setDescription('Kênh đăng bảng xác minh').addChannelTypes(ChannelType.GuildText))
  .addChannelOption(o => o.setName('kenh_su_kien').setNameLocalizations({ [Locale.Vietnamese]: 'kênh-sự-kiện' }).setDescription('Kênh đăng sự kiện và nhắc lịch').addChannelTypes(ChannelType.GuildText))
  .addChannelOption(o => o.setName('kenh_sinh_nhat').setNameLocalizations({ [Locale.Vietnamese]: 'kênh-sinh-nhật' }).setDescription('Kênh thông báo sinh nhật thành viên đã đăng ký').addChannelTypes(ChannelType.GuildText))
  .addRoleOption(o => o.setName('role_chua_xac_minh').setNameLocalizations({ [Locale.Vietnamese]: 'role-chưa-xác-minh' }).setDescription('Role dành cho thành viên chưa xác minh'))
  .addRoleOption(o => o.setName('role_da_xac_minh').setNameLocalizations({ [Locale.Vietnamese]: 'role-đã-xác-minh' }).setDescription('Role sau khi xác minh'))
  .addRoleOption(o => o.setName('role_duyet').setNameLocalizations({ [Locale.Vietnamese]: 'role-duyệt' }).setDescription('Role được quyền duyệt vụ việc'))
  .addStringOption(o => o.setName('loi_chao').setNameLocalizations({ [Locale.Vietnamese]: 'lời-chào' }).setDescription('Mẫu chào; dùng {user} và {server}').setMaxLength(500))
  .addStringOption(o => o.setName('loi_tam_biet').setNameLocalizations({ [Locale.Vietnamese]: 'lời-tạm-biệt' }).setDescription('Mẫu tạm biệt; dùng {user} và {server}').setMaxLength(500))
  .addStringOption(o => o.setName('mui_gio').setNameLocalizations({ [Locale.Vietnamese]: 'múi-giờ' }).setDescription('Tên múi giờ IANA, ví dụ Asia/Ho_Chi_Minh').setMaxLength(80));

const eventCommand = localizeCommand(
  new SlashCommandBuilder().setName('event').setDescription('Tạo sự kiện và xem lịch server.'),
  'sự-kiện'
)
  .addSubcommand(sub => localizeSubcommand(sub.setName('create').setDescription('Tạo một sự kiện mới.'), 'tạo')
    .addStringOption(o => o.setName('tieu_de').setNameLocalizations({ [Locale.Vietnamese]: 'tiêu-đề' }).setDescription('Tên sự kiện').setRequired(true).setMaxLength(100))
    .addStringOption(o => o.setName('bat_dau').setNameLocalizations({ [Locale.Vietnamese]: 'bắt-đầu' }).setDescription('ISO có múi giờ, ví dụ 2026-12-01T19:30:00+07:00').setRequired(true).setMaxLength(40))
    .addStringOption(o => o.setName('mo_ta').setNameLocalizations({ [Locale.Vietnamese]: 'mô-tả' }).setDescription('Mô tả tùy chọn').setMaxLength(1500)))
  .addSubcommand(sub => localizeSubcommand(sub.setName('list').setDescription('Xem sự kiện từ 30 ngày trước đến 30 ngày tới.'), 'lịch'))
  .addSubcommand(sub => localizeSubcommand(sub.setName('cancel').setDescription('Hủy một sự kiện do bạn tạo hoặc có quyền quản lý.'), 'hủy')
    .addIntegerOption(o => o.setName('ma').setNameLocalizations({ [Locale.Vietnamese]: 'mã' }).setDescription('Mã sự kiện').setRequired(true).setMinValue(1)));

const lobbyCommand = localizeCommand(
  new SlashCommandBuilder().setName('voice-lobby').setDescription('Cấu hình các kênh tạo phòng voice tạm.'),
  'thiết-lập-phòng'
).setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand(sub => localizeSubcommand(sub.setName('add').setDescription('Thêm một kênh lobby tạo phòng.'), 'thêm')
    .addChannelOption(o => o.setName('kenh').setNameLocalizations({ [Locale.Vietnamese]: 'kênh' }).setDescription('Kênh voice lobby').setRequired(true).addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice))
    .addIntegerOption(o => o.setName('xoa_sau_giay').setNameLocalizations({ [Locale.Vietnamese]: 'xóa-sau-giây' }).setDescription('Thời gian phòng trống trước khi xóa (mặc định 5 giây)').setMinValue(5).setMaxValue(300)))
  .addSubcommand(sub => localizeSubcommand(sub.setName('remove').setDescription('Gỡ một kênh lobby.'), 'gỡ')
    .addChannelOption(o => o.setName('kenh').setNameLocalizations({ [Locale.Vietnamese]: 'kênh' }).setDescription('Kênh lobby cần gỡ').setRequired(true).addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)))
  .addSubcommand(sub => localizeSubcommand(sub.setName('list').setDescription('Liệt kê các kênh lobby đã cấu hình.'), 'danh-sách'));

const roomCommand = localizeCommand(
  new SlashCommandBuilder().setName('room').setDescription('Quản lý phòng voice tạm thời.'),
  'phòng'
)
  .addSubcommand(sub => localizeSubcommand(sub.setName('lock').setDescription('Khóa kết nối thường; người có mã phòng vẫn có thể xin vào.'), 'khóa'))
  .addSubcommand(sub => localizeSubcommand(sub.setName('open').setDescription('Mở kết nối phòng cho thành viên server.'), 'mở'))
  .addSubcommand(sub => localizeSubcommand(sub.setName('hide').setDescription('Ẩn phòng khỏi danh sách kênh thông thường.'), 'ẩn'))
  .addSubcommand(sub => localizeSubcommand(sub.setName('show').setDescription('Hiện phòng trong danh sách kênh.'), 'hiện'))
  .addSubcommand(sub => localizeSubcommand(sub.setName('code').setDescription('Xem mã riêng của phòng bạn đang sở hữu.'), 'mã'))
  .addSubcommand(sub => localizeSubcommand(sub.setName('rename').setDescription('Đổi tên phòng của bạn.'), 'đổi-tên')
    .addStringOption(o => o.setName('ten').setNameLocalizations({ [Locale.Vietnamese]: 'tên' }).setDescription('Tên phòng mới').setRequired(true).setMaxLength(90)))
  .addSubcommand(sub => localizeSubcommand(sub.setName('limit').setDescription('Đặt giới hạn người trong phòng.'), 'giới-hạn')
    .addIntegerOption(o => o.setName('so_nguoi').setNameLocalizations({ [Locale.Vietnamese]: 'số-người' }).setDescription('0 nghĩa là không giới hạn').setRequired(true).setMinValue(0).setMaxValue(99)))
  .addSubcommand(sub => localizeSubcommand(sub.setName('enter').setDescription('Nhập mã để được cấp quyền vào phòng riêng.'), 'vào-mã')
    .addStringOption(o => o.setName('ma').setNameLocalizations({ [Locale.Vietnamese]: 'mã' }).setDescription('Mã phòng do chủ phòng chia sẻ').setRequired(true).setMinLength(6).setMaxLength(16)))
  .addSubcommand(sub => localizeSubcommand(sub.setName('manage').setDescription('Admin/Quản trị cài đặt phòng tạm bất kỳ.'), 'quản-trị')
    .addChannelOption(o => o.setName('kenh').setNameLocalizations({ [Locale.Vietnamese]: 'kênh' }).setDescription('Phòng voice cần quản lý').setRequired(true).addChannelTypes(ChannelType.GuildVoice))
    .addStringOption(o => o.setName('thao_tac').setNameLocalizations({ [Locale.Vietnamese]: 'thao-tác' }).setDescription('Chọn cài đặt cần áp dụng').setRequired(true)
      .addChoices({ name: 'Khóa', value: 'lock' }, { name: 'Mở khóa', value: 'open' }, { name: 'Ẩn', value: 'hide' }, { name: 'Hiện', value: 'show' })));

const weatherCommand = localizeCommand(
  new SlashCommandBuilder().setName('weather').setDescription('Xem thời tiết hiện tại theo thành phố.'),
  'thời-tiết'
).addStringOption(o => o.setName('dia_diem').setNameLocalizations({ [Locale.Vietnamese]: 'địa-điểm' }).setDescription('Ví dụ: Hà Nội, Đà Nẵng').setRequired(true).setMaxLength(100));

const birthdayCommand = localizeCommand(
  new SlashCommandBuilder().setName('birthday').setDescription('Đăng ký hoặc xem sinh nhật tự nguyện.'),
  'sinh-nhật'
)
  .addSubcommand(sub => localizeSubcommand(sub.setName('set').setDescription('Đăng ký ngày sinh để được chúc mừng.'), 'đăng-ký')
    .addIntegerOption(o => o.setName('month').setNameLocalizations({ [Locale.Vietnamese]: 'tháng' }).setDescription('Tháng sinh (1–12)').setRequired(true).setMinValue(1).setMaxValue(12))
    .addIntegerOption(o => o.setName('day').setNameLocalizations({ [Locale.Vietnamese]: 'ngày' }).setDescription('Ngày sinh').setRequired(true).setMinValue(1).setMaxValue(31)))
  .addSubcommand(sub => localizeSubcommand(sub.setName('remove').setDescription('Xóa đăng ký sinh nhật của bạn.'), 'xóa'))
  .addSubcommand(sub => localizeSubcommand(sub.setName('list').setDescription('Xem các sinh nhật đã tự nguyện đăng ký.'), 'danh-sách'));

const pollCommand = localizeCommand(
  new SlashCommandBuilder().setName('poll').setDescription('Tạo và quản lý bình chọn cộng đồng.'),
  'bình-chọn'
)
  .addSubcommand(sub => localizeSubcommand(sub.setName('create').setDescription('Tạo bình chọn có từ hai đến bốn lựa chọn.'), 'tạo')
    .addStringOption(o => o.setName('question').setNameLocalizations({ [Locale.Vietnamese]: 'câu-hỏi' }).setDescription('Câu hỏi bình chọn').setRequired(true).setMaxLength(200))
    .addStringOption(o => o.setName('option1').setNameLocalizations({ [Locale.Vietnamese]: 'lựa-chọn-1' }).setDescription('Lựa chọn thứ nhất').setRequired(true).setMaxLength(80))
    .addStringOption(o => o.setName('option2').setNameLocalizations({ [Locale.Vietnamese]: 'lựa-chọn-2' }).setDescription('Lựa chọn thứ hai').setRequired(true).setMaxLength(80))
    .addStringOption(o => o.setName('option3').setNameLocalizations({ [Locale.Vietnamese]: 'lựa-chọn-3' }).setDescription('Lựa chọn thứ ba (tùy chọn)').setMaxLength(80))
    .addStringOption(o => o.setName('option4').setNameLocalizations({ [Locale.Vietnamese]: 'lựa-chọn-4' }).setDescription('Lựa chọn thứ tư (tùy chọn)').setMaxLength(80)))
  .addSubcommand(sub => localizeSubcommand(sub.setName('close').setDescription('Đóng bình chọn do bạn tạo hoặc có quyền quản lý.'), 'đóng')
    .addIntegerOption(o => o.setName('id').setNameLocalizations({ [Locale.Vietnamese]: 'mã' }).setDescription('Mã bình chọn').setRequired(true).setMinValue(1)));

const ticketCommand = localizeCommand(
  new SlashCommandBuilder().setName('ticket').setDescription('Mở ticket hỗ trợ riêng tư cho server.'),
  'hỗ-trợ'
)
  .addSubcommand(sub => localizeSubcommand(sub.setName('configure').setDescription('Cấu hình role và danh mục ticket.'), 'cấu-hình')
    .addRoleOption(o => o.setName('support_role').setNameLocalizations({ [Locale.Vietnamese]: 'role-hỗ-trợ' }).setDescription('Role được xem và xử lý ticket').setRequired(true))
    .addChannelOption(o => o.setName('category').setNameLocalizations({ [Locale.Vietnamese]: 'danh-mục' }).setDescription('Danh mục tạo ticket (tùy chọn)').addChannelTypes(ChannelType.GuildCategory)))
  .addSubcommand(sub => localizeSubcommand(sub.setName('open').setDescription('Tạo kênh hỗ trợ riêng tư.'), 'mở')
    .addStringOption(o => o.setName('subject').setNameLocalizations({ [Locale.Vietnamese]: 'chủ-đề' }).setDescription('Chủ đề cần hỗ trợ').setRequired(true).setMaxLength(80)))
  .addSubcommand(sub => localizeSubcommand(sub.setName('close').setDescription('Đóng ticket trong kênh hiện tại, không xóa lịch sử.'), 'đóng'));

const faqCommand = localizeCommand(
  new SlashCommandBuilder().setName('faq').setDescription('Tra cứu câu trả lời thường gặp của server.'),
  'câu-hỏi'
)
  .addSubcommand(sub => localizeSubcommand(sub.setName('add').setDescription('Thêm mục FAQ (Admin/Quản trị).'), 'thêm')
    .addStringOption(o => o.setName('key').setNameLocalizations({ [Locale.Vietnamese]: 'mã' }).setDescription('Mã ngắn, chỉ dùng chữ thường, số và dấu gạch ngang').setRequired(true).setMinLength(2).setMaxLength(32))
    .addStringOption(o => o.setName('question').setNameLocalizations({ [Locale.Vietnamese]: 'câu-hỏi' }).setDescription('Câu hỏi hiển thị').setRequired(true).setMaxLength(150))
    .addStringOption(o => o.setName('answer').setNameLocalizations({ [Locale.Vietnamese]: 'câu-trả-lời' }).setDescription('Câu trả lời').setRequired(true).setMaxLength(1800)))
  .addSubcommand(sub => localizeSubcommand(sub.setName('remove').setDescription('Xóa mục FAQ (Admin/Quản trị).'), 'gỡ')
    .addStringOption(o => o.setName('key').setNameLocalizations({ [Locale.Vietnamese]: 'mã' }).setDescription('Mã FAQ').setRequired(true).setMinLength(2).setMaxLength(32)))
  .addSubcommand(sub => localizeSubcommand(sub.setName('list').setDescription('Liệt kê các mục FAQ.'), 'danh-sách'))
  .addSubcommand(sub => localizeSubcommand(sub.setName('show').setDescription('Xem câu trả lời theo mã FAQ.'), 'xem')
    .addStringOption(o => o.setName('key').setNameLocalizations({ [Locale.Vietnamese]: 'mã' }).setDescription('Mã FAQ').setRequired(true).setMinLength(2).setMaxLength(32)));

export const commands = [
  localizeCommand(new SlashCommandBuilder().setName('ping').setDescription('Kiểm tra trạng thái phản hồi của bot.'), 'kiểm-tra'),
  setup,
  localizeCommand(new SlashCommandBuilder().setName('verify-panel').setDescription('Đăng bảng CAPTCHA tại kênh đã cấu hình.'), 'bảng-xác-minh')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  localizeCommand(new SlashCommandBuilder().setName('status').setDescription('Xem trạng thái cấu hình của bot.'), 'trạng-thái'),
  localizeCommand(new SlashCommandBuilder().setName('verify-grant').setDescription('Cấp trạng thái đã xác minh thủ công.'), 'cấp-xác-minh')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(o => o.setName('thanh_vien').setNameLocalizations({ [Locale.Vietnamese]: 'thành-viên' }).setDescription('Thành viên cần xác minh').setRequired(true)),
  localizeCommand(new SlashCommandBuilder().setName('report').setDescription('Gửi báo cáo để quản trị viên xem xét.'), 'báo-cáo')
    .addUserOption(o => o.setName('thanh_vien').setNameLocalizations({ [Locale.Vietnamese]: 'thành-viên' }).setDescription('Thành viên cần báo cáo').setRequired(true))
    .addStringOption(o => o.setName('ly_do').setNameLocalizations({ [Locale.Vietnamese]: 'lý-do' }).setDescription('Mô tả ngắn gọn, không đăng thông tin nhạy cảm').setRequired(true).setMaxLength(800)),
  localizeCommand(new SlashCommandBuilder().setName('cases').setDescription('Xem các vụ việc đang chờ duyệt.'), 'vụ-việc'),
  eventCommand,
  lobbyCommand,
  roomCommand,
  weatherCommand,
  birthdayCommand,
  pollCommand,
  ticketCommand,
  faqCommand
];
