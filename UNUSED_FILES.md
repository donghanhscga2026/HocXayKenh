UNUSED / CANDIDATE FILES TO REMOVE

Tôi đã quét toàn repo để tìm tham chiếu giữa các file. Dưới đây là danh sách file mà tôi khuyến nghị kiểm tra kỹ và có thể xóa để nhẹ repo. Trước khi xóa: 1) commit/backup; 2) nếu muốn tôi có thể di chuyển sang thư mục `archive/` thay vì xóa.

Danh sách (path) — lý do tóm tắt — độ tin cậy

- index_old.html — trang cũ/legacy, không phải entry hiện tại — High
- QLHTBRK.code-workspace — VSCode workspace file (IDE config), không cần cho deploy — High
- QLHTBRK.xlsx — file dữ liệu/backup, không tham chiếu trong code — High
- sync_code.bat — script Windows (utility), không thấy tham chiếu; nếu không dùng trên Windows có thể xóa — High
- youtube-sample.csv — ví dụ dữ liệu, không tham chiếu — High
- Backend_FROM_GIT.gs — dường như bản sao/phiên bản cũ của `Backend.gs` (văn bản khác, không tham chiếu) — High
- auto_sync.ps1, update_api_url.ps1 — script PowerShell/utility; nếu không dùng có thể xóa hoặc di chuyển — Medium
- adai.html — trang độc lập (không thấy tham chiếu trong repo); kiểm tra nếu cần giữ — Medium

Tài liệu / hướng dẫn (không phải code runtime): giữ trừ khi muốn dọn sạch docs
- YOUTUBE_AI_GUIDE.md, YOUTUBE_SETUP.md, COMPLETE_SETUP.md, DEPLOY_GUIDE.md, TEST_GUIDE.md, GIT_GUIDE.md, DEVELOPMENT_RULES.md, ADMIN_DATA_IMPORT_*.md, README.md — là tài liệu; không xóa nếu cần giữ hướng dẫn — High (docs)

Các file trong `thamkhaocode/`
- `ma.gs` — được dùng (có gọi `email_master_welcome.html`) — Keep
- `vinhdanh.gs` — tồn tại, không thấy tham chiếu bên ngoài nhưng có thể chứa hàm được gọi từ Apps Script UI — Check (Medium)
- Các file HTML template/email: `email_master_welcome.html`, `email_welcome_14day.html`, `email_welcome_86day.html`, `email_affiliate_invitation.html`, `email_upgrade_confirmation.html` — nhiều khả năng là template được dùng bởi Google Apps Script (thường via HtmlService); `email_master_welcome.html` được tham chiếu rõ ràng — Keep (unless you confirm)
- Các landing/pages trong `thamkhaocode/` (`chuyenlopngan.html`, `dangky.html`, `timkiem.html`, `hocvien.html`, `nangcap.html`, `nhanmach.html`) — là trang landing/email/marketing; một số được tham chiếu nội bộ hoặc qua links; đánh dấu là "Possibly used" — Check (Medium)

Các file runtime rõ ràng — KHÔNG XOÁ
- `Backend.gs`, `Backend_addTextContent.gs`, `appsscript.json`, `index.html`, `course-play.html`, `dashboard.html`, `youtube-manager.html`, `login.html`, `forgot_password.html` — có tham chiếu hoặc là backend, giữ.

Khuyến nghị ngắn:
- Hành động an toàn: tạo nhánh git mới/commit, hoặc di chuyển file không chắc chắn vào `archive/` trước khi xóa hoàn toàn.
- Nếu bạn muốn, tôi có thể:
  - 1) Commit `UNUSED_FILES.md` rồi tạo `archive/` và di chuyển những file có confidence=High vào đó.
  - 2) Hoặc chỉ liệt kê thêm chi tiết (dòng/điểm tham chiếu) cho từng file.

Bạn muốn tôi (chọn 1):
- A: Di chuyển các file confidence=High vào `archive/` (tạo commit). (recommended)
- B: Chỉ cung cấp thêm chi tiết tham chiếu cho từng file trước khi hành động.
- C: Không làm gì thêm (chỉ lưu `UNUSED_FILES.md`).
