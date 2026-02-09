# 📖 Hướng Dẫn Sử Dụng BRK AI YouTube Manager

## 🎯 Tổng Quan

**BRK AI YouTube Manager** là công cụ quản lý video YouTube giúp bạn:
- ✅ Thêm video YouTube vào khóa học
- ✅ Quản lý nội dung (transcript, description)
- ✅ Import hàng loạt video từ CSV
- ✅ BRK AI tự động học từ transcript video để hỗ trợ học viên

---

## 🚀 Bước 1: Truy Cập YouTube Manager

### Cách 1: Trực tiếp truy cập URL
```
http://localhost:3000/youtube-manager.html
```

### Cách 2: Thêm link vào dashboard (Optional)
Bạn có thể thêm nút link vào `index.html` hoặc trang admin để dễ truy cập.

---

## 📝 Bước 2: Thêm Video YouTube Thủ Công

### Điền Thông Tin:

| Trường | Yêu Cầu | Ví Dụ |
|-------|--------|-------|
| **YouTube URL** | ✅ Bắt buộc | `https://www.youtube.com/watch?v=abc123` |
| **Mã Khóa Học** | ✅ Bắt buộc | `KH001` |
| **Mã Bài** | ✅ Bắt buộc | `BAI001` |
| **Transcript/Nội Dung** | ⚠️ Tùy chọn | Dán transcript hoặc nội dung chính |

### Bước Chi Tiết:

1. **Mở tab "Thêm Video Mới"**
   
2. **Nhập YouTube URL**
   ```
   https://www.youtube.com/watch?v=dQw4w9WgXcQ
   ```

3. **Click nút "Lấy Metadata"**
   - Tự động lấy tiêu đề video
   - Lấy description từ YouTube
   - Kiểm tra xem video có tồn tại không

4. **Chọn Khóa Học**
   - Dropdown menu có sẵn các khóa học
   - Hoặc nhập mã khóa học mới

5. **Nhập Mã Bài**
   ```
   BAI001 hoặc BAI_Python_01
   ```

6. **Thêm Transcript (Optional)**
   - Dán transcript video từ YouTube
   - Hoặc dán nội dung chính của bài học
   - **💡 Việc này rất quan trọng! BRK AI sẽ học từ đây**

7. **Click "Lưu Video"**
   - Nếu thành công: ✅ Thông báo "Lưu video thành công!"
   - Video sẽ được lưu vào database

---

## 📊 Bước 3: Import Bulk từ CSV (Nhanh Nhất)

### Chuẩn Bị File CSV:

Tạo file `.csv` với format sau:

```csv
youtube_url,course_id,lesson_id,transcript
https://www.youtube.com/watch?v=abc123,KH001,BAI001,Nội dung bài 1 về Python cơ bản
https://www.youtube.com/watch?v=def456,KH001,BAI002,Nội dung bài 2 về biến và kiểu dữ liệu
https://www.youtube.com/watch?v=ghi789,KH002,BAI001,Nội dung bài 1 về JavaScript
```

**⚠️ Lưu ý:**
- Dòng đầu tiên là header (tên cột)
- Bắt buộc: youtube_url, course_id, lesson_id
- Tùy chọn: transcript (nội dung bài)
- Mỗi dòng là 1 video

### Excel → CSV Chuyển Đổi:

1. Mở file Excel
2. **File → Save As**
3. Chọn **CSV (Comma delimited) (.csv)**
4. Lưu file

### Import vào BRK AI:

1. **Mở tab "Import Bulk"**

2. **Kéo file CSV vào khung upload**
   - Hoặc click vào khung để chọn file

3. **Xem preview dữ liệu**
   - Kiểm tra các bài được liệt kê
   - Kiểm tra transcript có đầy đủ không

4. **Click "Xác Nhận Import"**
   - Đợi notification: ✅ "Import thành công X video!"

---

## 📋 Bước 4: Xem & Quản Lý Video

### Tab "Danh Sách Video":

1. **Mở tab "Danh Sách Video"**
   - Tự động load tất cả video đã thêm

2. **Thông Tin Video**
   - Thumbnail YouTube preview
   - Mã bài, khóa học
   - Link YouTube
   - Nội dung transcript (100 ký tự đầu)
   - Ngày thêm + tác giả

3. **Hành Động**
   - **Sửa**: Thay đổi thông tin video
   - **Xóa**: Xóa video khỏi hệ thống

---

## 🧠 Bước 5: BRK AI Sử Dụng Dữ Liệu

### Cách BRK AI Hoạt Động:

1. **Học Viên Chat Với BRK AI**
   
2. **BRK AI Tự Động**
   - Lấy danh sách khóa học đã kích hoạt của học viên
   - Lấy tất cả transcript từ video YouTube của khóa học
   - Sử dụng text này làm **context** để trả lời

3. **Chỉ Trợ Giúp Trong Phạm Vi**
   - ✅ "Python là gì?" → BRK AI trả lời (có trong transcript)
   - ✅ "Loop trong Python?" → BRK AI trả lời (có trong transcript)
   - ❌ "Làm sao nấu cơm?" → BRK AI từ chối (ngoài phạm vi)

### Ví Dụ Workflow:

```
Học Viên:
└─ Kích hoạt khóa học "KH001 - Python"
   └─ Khóa có 3 video:
      ├─ BAI001: Giới thiệu Python
      ├─ BAI002: Biến và kiểu dữ liệu  
      └─ BAI003: Hàm và Module

Chat với BRK AI:
Học Viên: "Hàm trong Python là gì?"
BRK AI: "Lấy transcript từ BAI003 → Trả lời dựa vào nội dung"

Học Viên: "Phương trình bậc 2?"
BRK AI: "Không trong transcript → Từ chối (ngoài phạm vi)"
```

---

## 💡 Best Practices

### 1️⃣ Transcript Chất Lượng Cao

**Tốt:**
```
Hàm trong Python là một khối code có tên, thực hiện công việc cụ thể.
Cách định nghĩa: def tên_hàm(tham_số):
Ví dụ: def chào_mừng(tên): print(f"Xin chào {tên}")
```

**Tệ:**
```
Video nói về hàm
```

### 2️⃣ Tổ Chức Khóa Học

```
KH001 - Lập Trình Python
├─ BAI001 - Giới Thiệu Python
├─ BAI002 - Cài Đặt & Cấu Hình
├─ BAI003 - Biến & Kiểu Dữ Liệu
├─ BAI004 - Vòng Lặp
├─ BAI005 - Hàm & Module
└─ BAI006 - Xử Lý File
```

### 3️⃣ Cập Nhật Liên Tục

- Thêm video mới khi có nội dung mới
- Update transcript khi có bản cải tiến
- Xóa video cũ không còn dùng

---

## 🔧 Troubleshooting

### ❌ Lỗi: "URL YouTube không hợp lệ"

**Nguyên nhân:** URL không đúng format

**Giải pháp:**
```
✅ Đúng:
https://www.youtube.com/watch?v=abc123
https://youtu.be/abc123
https://www.youtube.com/embed/abc123

❌ Sai:
youtube.com/watch?v=abc123 (thiếu https://)
https://youtube.com/abc123 (format sai)
```

### ❌ Lỗi: "Video đã được thêm rồi"

**Nguyên nhân:** Video ID đã tồn tại trong database

**Giải pháp:**
- Kiểm tra danh sách video
- Xóa video cũ nếu muốn thêm lại
- Hoặc sử dụng link khác cùng video

### ❌ Lỗi: "Import không thành công"

**Nguyên nhân:** File CSV format sai

**Giải pháp:**
1. Kiểm tra header dòng đầu
2. Kiểm tra delimiter (phân cách) là dấu phẩy
3. Không có dòng trống
4. Kiểm tra encoding (UTF-8)

---

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra Console (F12 → Console)
2. Xem error message chi tiết
3. Liên hệ admin với screenshot lỗi

---

## 🎉 Hoàn Tất!

Sau khi cấu hình, BRK AI sẽ:
- 🧠 Học từ tất cả video YouTube
- 💬 Trả lời câu hỏi dựa trên nội dung
- 🎓 Hỗ trợ học viên hiệu quả hơn
- 🔒 Chỉ trợ giúp trong phạm vi khóa học

**Chúc bạn thành công! 🚀**
