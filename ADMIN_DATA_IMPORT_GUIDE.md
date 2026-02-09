# 🔐 Admin Data Import Module - BRK AI

## 📋 Tổng Quan

**Admin Data Import Module** là công cụ chuyên dụng cho admin/quản lý viên để nạp dữ liệu huấn luyện **BRK AI** với 5 phương pháp linh hoạt:

1. 📝 **Copy-Paste Text** - Dán trực tiếp văn bản
2. 📄 **Upload File** - Upload TXT, CSV, Markdown
3. ☁️ **Google Drive** - Kết nối Drive (đang phát triển)
4. 🎥 **YouTube Bulk** - Import hàng loạt video
5. 📊 **Manage Data** - Quản lý & export dữ liệu

---

## 🔐 Bảo Mật & Authentication

### Đăng Nhập Admin

**Credentials mặc định (QUIck Demo):**
```
Email: admin@brk.edu
Password: password123

Hoặc:
Email: admin@hocvien.edu
Password: admin2024
```

**⚠️ QUAN TRỌNG:** 
- Đổi password ngay sau lần đầu
- Thêm admin khác trong Backend.gs (ADMIN_CREDENTIALS object)
- Sử dụng session token thay vì hardcode credentials (tuỳ chỉnh)

### Thêm Admin Mới

Mở `admin-data-import.html`, tìm:
```javascript
const ADMIN_CREDENTIALS = {
    'admin@brk.edu': 'password123',
    'admin@hocvien.edu': 'admin2024'  // Thêm dòng này
};
```

Thêm new admin:
```javascript
const ADMIN_CREDENTIALS = {
    'admin@brk.edu': 'password123',
    'admin@hocvien.edu': 'admin2024',
    'new.admin@brk.edu': 'newPassword123'  // Thêm mới
};
```

---

## 🚀 Cách Sử Dụng

### Bước 1: Truy Cập Admin Panel

```
http://localhost:3000/admin-data-import.html
```

### Bước 2: Đăng Nhập
- Nhập email admin
- Nhập mật khẩu
- Click "Đăng Nhập"

### Bước 3: Chọn Phương Pháp Nạp Dữ Liệu

---

## 📝 Phương Pháp 1: Copy-Paste Text

**Khi nào dùng:**
- Thêm nội dung bài học nhanh
- Dán nội dung từ email, documents
- Không cần file

**Cách thực hiện:**

1. **Mở tab "Copy-Paste Text"**

2. **Dán nội dung vào ô "Nội Dung"**
   ```
   Ví dụ:
   Bài học về Python Strings
   
   String là dữ liệu dạng text trong Python.
   Cách định nghĩa: text = "Hello World"
   Hàm thường dùng: len(), upper(), lower(), split()
   ```

3. **Nhập (Optional):**
   - Khóa Học: `KH001`
   - Bài Học: `BAI003`

4. **Click "Xem Preview"** - Kiểm tra nội dung

5. **Click "Lưu Nội Dung"** - Lưu vào database

---

## 📄 Phương Pháp 2: Upload File

**Hỗ trợ Format:**
- ✅ `.txt` - Plain text
- ✅ `.csv` - Comma-separated (khóa học, bài, nội dung)
- ✅ `.md` - Markdown
- ✅ `.json` - JSON format (tuỳ chỉnh)

**Cách thực hiện:**

1. **Chuẩn Bị File CSV:**
   ```csv
   course_id,lesson_id,title,content
   KH001,BAI001,Giới Thiệu Python,Python là ngôn ngữ lập trình...
   KH001,BAI002,Variables,Biến là container chứa dữ liệu...
   KH002,BAI001,HTML Basics,HTML là ngôn ngữ đánh dấu...
   ```

2. **Mở Tab "Upload File"**

3. **Kéo file vào khung upload hoặc click chọn**

4. **Xem preview dữ liệu**

5. **Click "Lưu File"**

**💡 Từ Google Docs/Sheets:**
- Google Docs: Download as .txt hoặc .docx
- Google Sheets: Download as .csv
- Hoặc dùng tab "Google Drive" (đang phát triển)

---

## 🎥 Phương Pháp 3: YouTube Bulk Import

**Khi nào dùng:**
- Thêm nhiều video YouTube cùng lúc
- Import danh sách video từ playlist
- Tự động extract metadata

**Cách thực hiện:**

1. **Mở Tab "YouTube Bulk"**

2. **Dán danh sách YouTube URLs**
   ```
   https://www.youtube.com/watch?v=abc123
   https://www.youtube.com/watch?v=def456
   https://www.youtube.com/watch?v=ghi789
   ```
   (Một URL mỗi dòng)

3. **Chọn/Nhập Khóa Học**
   ```
   KH001
   ```

4. **Click "Extract Metadata"**
   - Tự động lấy tiêu đề từ YouTube
   - Kiểm tra link hợp lệ
   - Hiện preview

5. **Click "Lưu Tất Cả Videos"**

---

## ☁️ Phương Pháp 4: Google Drive (Đang Phát Triển)

**Tính năng sắp có:**
- Kết nối Google Drive
- List tất cả file trong folder
- Tự động download & process
- Support Docs, Sheets, PDF

**Chuẩn bị:**
- Tạo folder trong Google Drive
- Share folder cho tài khoản GAS
- Lấy Folder ID từ URL

---

## 📊 Phương Pháp 5: Quản Lý Dữ Liệu

**Tính năng:**

### Xem Thống Kê
- Tổng video YouTube
- Tổng khóa học
- Tổng nội dung dạy
- BRK AI status

### Tải & Xem Tất Cả
- Click "Tải Dữ Liệu"
- Xem table toàn bộ nội dung
- Tìm kiếm & filter

### Export CSV
- Click "Export CSV"
- File sẽ download
- Có thể import lại sau

### Xóa Dữ Liệu
```
⚠️ CẢNH BÁO:
- Xóa 1 mục: Click nút Xóa trong table
- Xóa tất cả: Click "Xóa Toàn Bộ"
- Hành động KHÔNG thể hoàn tác!
```

---

## 📝 Format Data Tối Ưu

### CSV Format (Khuyó Nghị Nhất)

```csv
youtube_url,course_id,lesson_id,transcript
https://youtu.be/abc123,KH001,BAI001,Nội dung bài 1
https://youtu.be/def456,KH001,BAI002,Nội dung bài 2
```

### JSON Format

```json
[
  {
    "courseId": "KH001",
    "lessonId": "BAI001",
    "title": "Giới Thiệu",
    "content": "Bài học về..."
  }
]
```

### Plain Text Format

```
---
Course: KH001
Lesson: BAI001
---

Tiêu Đề Bài Học

Nội dung chi tiết bài học...
```

---

## 🧠 Cách BRK AI Sử Dụng Dữ Liệu

**Workflow:**

1. Admin nạp dữ liệu qua Admin Module
   ↓
2. Dữ liệu được lưu vào Google Sheet
   ↓
3. BRK AI tự động:
   - Lấy khóa học đã kích hoạt của học viên
   - Lấy tất cả nội dung từ khóa học
   - Sử dụng làm **context** để trả lời
   ↓
4. Học viên chat → BRK AI trả lời dựa trên dữ liệu👍

---

## 💡 Best Practices

### ✅ Nên Làm

1. **Nội dung Chi Tiết**
   ```
   ✓ Hàm sum() trong Python là hàm tính tổng các phần tử 
   trong list. Cú pháp: sum([1,2,3]) = 6
   
   ✗ Nói về hàm
   ```

2. **Tổ Chức Rõ Ràng**
   ```
   ✓ KH001 - Python Cơ Bản
     ├─ BAI001 - Giới Thiệu
     ├─ BAI002 - Variables
     └─ BAI003 - Functions
   ```

3. **Cập Nhật Thường Xuyên**
   - Thêm nội dung mới
   - Sửa lỗi, cập nhật
   - Export backup định kỳ

4. **Transcript Chất Lượng**
   ```
   ✓ Video nói gì → Ghi lại đầy đủ
   ✓ Thêm ví dụ code, công thức
   ✓ Ghi key points chính
   ```

### ❌ Không Nên Làm

1. **Nội dung Quá Ngắn**
   ```
   ✗ "Python là ngôn ngữ lập trình"
   ```

2. **Quá Dài, Rối Rắm**
   ```
   ✗ Dán toàn bộ tài liệu 50 trang
   ```

3. **Quên Update**
   ```
   ✗ Lưu video cũ không còn dùng
   ```

---

## 📊 Database Structure

### Sheet: `AI_Content`
```
ID | Type | Course ID | Lesson ID | Title | Content | Source | Added Date | Added By
```

### Sheet: `YT_Videos`
```
Video ID | URL | Course ID | Lesson ID | Title | Transcript | Description | Added Date | Updated
```

### Sheet: `KH` (Khóa Học)
```
Course ID | Course Name | ...
```

---

## 🔧 Troubleshooting

### ❌ Lỗi: "API_URL không cấu hình"

**Giải pháp:**
1. Mở `admin-data-import.html`
2. Tìm dòng: `const API_URL = ...`
3. Update Deployment ID từ Backend.gs deploy

### ❌ Lỗi: "File quá lớn"

**Giải pháp:**
- Max 10MB
- Chia nhỏ file lớn
- Xóa phần thừa

### ❌ Lỗi: "Login không thành công"

**Giải pháp:**
1. Kiểm tra credentials
2. Xóa localStorage: `localStorage.clear()`
3. Reload trang
4. Thử lại

### ❌ CSV Import không đúng

**Giải pháp:**
1. Kiểm tra delimiter là dấu phẩy (,)
2. Encoding phải UTF-8
3. Không có dòng trống
4. Header dòng đầu

---

## 🔐 Security Tips

1. **Đổi Password Ngay**
   ```javascript
   'admin@brk.edu': 'newSecurePassword123'
   ```

2. **Giới Hạn Quyền Truy Cập**
   - Chia sẻ URL chỉ cho admin
   - Không public URL trên web

3. **Backup Thường Xuyên**
   - Export CSV định kỳ
   - Lưu trữ an toàn

4. **Audit Logs**
   - Kiểm tra ai thêm dữ liệu lúc nào
   - Xem "Added By" column

---

## 📈 Performance Tips

**Tối Ưu Hóa:**
- Import bulk thay vì từng cái
- CSV nhanh hơn text paste
- Giữ mỗi content < 10,000 ký tự
- Xóa dữ liệu cũ không dùng

---

## 🎉 Hoàn Tất!

Bạn đã setup Admin Module! Giờ có thể:
- ✅ Nạp dữ liệu qua 5 phương pháp
- ✅ Quản lý toàn bộ nội dung
- ✅ BRK AI học từ dữ liệu
- ✅ Export backup an toàn

**Chúc quản lý dữ liệu thuận lợi! 🚀**
