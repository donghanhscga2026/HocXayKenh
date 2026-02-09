# 🚀 Complete BRK AI System - Setup & Deployment Guide

## 📋 Tổng Quan Hệ Thống

BRK AI là hệ thống AI chatbot thông minh cho Học viện BRK với 3 thành phần chính:

```
┌─────────────────────────────────┐
│   BRK AI Chatbot                │ ← Hỗ trợ học viên trực tiếp
│   (Tích hợp sẵn index.html)     │
└──────────────┬──────────────────┘
               │
        ┌──────┴──────┐
        ↓             ↓
┌──────────────────┐  ┌──────────────────────┐
│ YouTube Manager  │  │ Admin Data Import    │
│ (youtube-       │  │ (admin-data-        │
│  manager.html)  │  │  import.html)        │
└──────────────────┘  └──────────────────────┘
        │                     │
        └──────────┬──────────┘
                   ↓
        ┌──────────────────┐
        │  Backend.gs      │
        │ Google Apps      │
        │ Script           │
        └────────┬─────────┘
                 ↓
        ┌──────────────────┐
        │ Google Sheets    │
        │ Database         │
        └──────────────────┘
```

---

## 📦 File Được Tạo/Cập Nhật

### Frontend (HTML)
| File | Mục Đích | Status |
|------|---------|--------|
| `youtube-manager.html` | Quản lý video YouTube | ✅ Hoàn tất |
| `admin-data-import.html` | Admin nạp dữ liệu | ✅ Hoàn tất |
| `index.html` | Trang chủ + BRK AI chatbot | ✅ Cập nhật |

### Backend (Google Apps Script)
| Function | Mục Đích |
|----------|---------|
| `chatWithAI()` | BRK AI respond |
| `getAllActivatedCoursesContent()` | Lấy content cho AI |
| `addVideoToCourse()` | Thêm video YouTube |
| `addTextContent()` | Nạp text content |
| `addFileContent()` | Nạp file CSV/TXT |
| `bulkAddVideos()` | Import bulk video |
| `getDataStats()` | Thống kê dữ liệu |
| ... | (Total 30+ functions) |

### Documentation
| File | Nội Dung |
|------|---------|
| `YOUTUBE_SETUP.md` | Quick start YouTube Manager |
| `YOUTUBE_AI_GUIDE.md` | Hướng dẫn chi tiết YouTube |
| `ADMIN_DATA_IMPORT_GUIDE.md` | Hướng dẫn Admin Module |
| `COMPLETE_SETUP.md` | **File này - toàn bộ setup** |

### Database (Google Sheets)
| Sheet | Chứa |
|-------|------|
| `YT_Videos` | Videos YouTube |
| `AI_Content` | Nội dung text/file |
| `KH` | Thông tin khóa học |
| `KH_NoiDung` | Nội dung bài học |
| ... | (Sheets hiện có) |

---

## ⚡ Quick Start (30 phút)

### Bước 1: Deploy Backend (5 phút)

```bash
1. Mở Backend.gs trong Google Apps Script
2. Click Deploy → New Deployment
3. Chọn: Web app
4. Execute as: [Chọn email]
5. Access: Anyone
6. Click Deploy
7. Copy URL deployment
```

**URL Format:**
```
https://script.google.com/macros/s/[DEPLOYMENT_ID]/usercallable
```

### Bước 2: Update API URLs (5 phút)

**Trong `index.html` (dòng ~900):**
```javascript
const API_URL = 'https://script.google.com/macros/s/[YOUR_DEPLOYMENT_ID]/usercallable';
```

**Trong `youtube-manager.html` (dòng ~840):**
```javascript
const API_URL = 'https://script.google.com/macros/s/[YOUR_DEPLOYMENT_ID]/usercallable';
```

**Trong `admin-data-import.html` (dòng ~650):**
```javascript
const API_URL = 'https://script.google.com/macros/s/[YOUR_DEPLOYMENT_ID]/usercallable';
```

### Bước 3: Setup Gemini API (5 phút)

```bash
1. Go to: https://aistudio.google.com/app/apikeys
2. Create API Key
3. Mở Backend.gs
4. Click Settings (icon bánh răng)
5. Thêm Script Property:
   - Name: GEMINI_API_KEY
   - Value: [Your API Key]
6. Save
```

### Bước 4: Kiểm Tra (15 phút)

**Mở trang web:**
```
http://localhost:3000/index.html
```

**Test BRK AI:**
1. Đăng nhập
2. Kích hoạt khóa học
3. Click nút 💬 AI
4. Chat test

**Test YouTube Manager:**
```
http://localhost:3000/youtube-manager.html
```

**Test Admin Module:**
```
http://localhost:3000/admin-data-import.html
```
Credentials: `admin@brk.edu` / `password123`

---

## 📊 Cách Nạp Dữ Liệu (Workflow)

### Workflow 1: YouTube Videos

```
Admin → YouTube Manager
  │
  ├─ Thêm 1 video: Input URL → Extract metadata → Save
  │
  └─ Import bulk: Paste URLs → Extract all → Save

  ↓

Backend.gs: addVideoToCourse() → YT_Videos Sheet

  ↓

BRK AI: Tự động lấy transcript từ video
```

### Workflow 2: Text/Content

```
Admin → Admin Data Import
  │
  ├─ Copy-Paste: Dán text → Save
  │
  ├─ Upload file: Chọn CSV/TXT → Read → Save
  │
  └─ YouTube bulk: Paste URLs → Extract → Save

  ↓

Backend.gs: addTextContent() / addFileContent() → AI_Content Sheet

  ↓

BRK AI: Sử dụng làm context để train
```

### Workflow 3: BRK AI Usage

```
Học Viên:
  │
  ├─ Chat: "Hàm sum() là gì?"
  └─ Backend: chatWithAI()
      │
      ├─ Lấy khóa học đã kích hoạt
      ├─ Lấy content từ AI_Content + YT_Videos
      ├─ Tạo system prompt với context
      └─ Call Gemini API
          │
          └─ Return: Trả lời dựa trên content
              │
              └─ Học viên nhận answer ✅
```

---

## 🎯 Sử Dụng Thực Tế

### Scenario 1: Thêm Khóa Học Mới

```
1. YouTube Manager:
   - Thêm 5 video YouTube của khóa học
   - Nhập transcript cho từng video

2. Admin Module:
   - Copy-paste nội dung bài từ document
   - Upload file CSV có toàn bộ nội dung

3. Dashboard:
   - Admin xem stats
   - Verify dữ liệu đầy đủ
```

### Scenario 2: Học Viên Chat

```
1. Học viên: "Loop trong Python là gì?"

2. BRK AI:
   - Tìm khóa học: KH001 (Python)
   - Tìm content: Loop → video_transcript
   - Create context:
     - System: "Chỉ trợ giúp trong Python"
     - Context: "Loop là cấu trúc lặp..."
   - Call Gemini
   - Return: "Loop dùng để lặp code..."

3. Học viên: "Nấu cơm thế nào?"

4. BRK AI:
   - Tìm khóa học
   - Tìm content: "Nấu cơm"
   - Không tìm thấy
   - Return: "Xin lỗi, câu hỏi này ngoài phạm vi"
```

---

## 🔧 Cấu Hình Nâng Cao

### Thêm Admin Mới

**Trong `admin-data-import.html`:**

```javascript
// Line 650
const ADMIN_CREDENTIALS = {
    'admin@brk.edu': 'password123',
    'admin@hocvien.edu': 'admin2024',
    'new.admin@brk.edu': 'newPassword456'  // ← Thêm
};
```

### Tùy Chỉnh BRK AI Prompts

**Trong `Backend.gs` - `chatWithAI()` function:**

```javascript
const systemPrompt = `Bạn là assistant hỗ trợ học viên Học viện BRK.
Đặc điểm:
- Chỉ hỗ trợ trong nội dung khóa học
- Trả lời bằng tiếng Việt
- Ngắn gọn, dễ hiểu
- Nếu ngoài phạm vi: từ chối lịch sự

📚 Nội dung khóa học:
${courseContexts}`;
```

### Google Drive Integration (Tuỳ Chỉnh)

```javascript
// Trong `admin-data-import.html` - `loadFromGDrive()` function
// Đây là chỗ implement Google Drive API
async function loadFromGDrive() {
  // Cần: Google Drive API key
  // Cần: gapi library
  // Code đang ở placeholder state
}
```

---

## 📈 Monitoring & Maintenance

### Kiểm Tra Sức Khỏe Hệ Thống

**Hàng ngày:**
- Kiểm tra BRK AI response
- Monitor error logs
- Xem stats dữ liệu

**Command Check:**
```bash
# Trong Admin Module:
Tab "Manage Data" → Click "Tải Dữ Liệu" → Xem stats
```

### Backup Dữ Liệu

**Hàng tuần:**
- Admin Module → Export CSV
- Lưu file backup
- Test recovery

```bash
# Trong Admin Module:
Tab "Manage Data" → Click "Export CSV" → Save file
```

### Performance Optimization

**Tips:**
1. Xóa dữ liệu cũ không dùng
2. Keep transcript < 5000 ký tự
3. Cache BRK AI responses
4. Monitor Gemini API usage

---

## 🆘 Troubleshooting

### ❌ BRK AI không respond

**Debug:**
```
1. Kiểm tra API_URL đúng
2. Kiểm tra GEMINI_API_KEY cấu hình
3. Kiểm tra user logged in
4. Xem console (F12) → Network tab
```

**Giải pháp:**
- Redeploy Backend.gs
- Verify Gemini API key
- Check Google Sheets quyền hạn

### ❌ YouTube metadata không lấy được

**Debug:**
```
1. YouTube URL hợp lệ?
2. Video công khai?
3. API quota hết?
```

**Giải pháp:**
- Dùng publicly shared video
- Wait và retry
- Contact YouTube support

### ❌ Admin login không được

**Debug:**
```
1. Credentials đúng?
2. localStorage bị xóa?
3. Browser sạch (không cache)?
```

**Giải pháp:**
```javascript
// Console (F12):
localStorage.clear();
// Reload trang
```

---

## 📚 Tài Liệu Liên Quan

| Document | Read Time | Mục Đích |
|----------|-----------|---------|
| `YOUTUBE_SETUP.md` | 5 min | YouTube Manager quick start |
| `YOUTUBE_AI_GUIDE.md` | 15 min | YouTube Manager chi tiết |
| `ADMIN_DATA_IMPORT_GUIDE.md` | 20 min | Admin Module chi tiết |
| `COMPLETE_SETUP.md` | 30 min | **File này - toàn bộ hệ thống** |

---

## 🎉 Checklist Hoàn Tất

- [ ] Deploy Backend.gs
- [ ] Cấu hình GEMINI_API_KEY
- [ ] Update API_URL trong 3 files
- [ ] Test BRK AI chatbot
- [ ] Test YouTube Manager
- [ ] Test Admin Module
- [ ] Thêm data test
- [ ] Verify BRK AI response
- [ ] Đổi admin password
- [ ] Backup database

---

## 📞 Support Issues

Các vấn đề thường gặp:

| Issue | Solution |
|-------|----------|
| 🔴 API 404 | Redeploy Backend, verify Deployment ID |
| 🔴 Gemini not working | Check API key, quota limit |
| 🔴 Database connection | Verify Sheet permissions |
| 🔴 File upload failed | Check file size < 10MB, UTF-8 encoding |
| 🔴 YouTube URL invalid | Use standard YouTube URL format |

---

## 🚀 Bước Tiếp Theo

Sau khi setup hoàn tất:

1. **Production Deployment**
   - Migrate sang production
   - Setup backup automatic
   - Monitor performance

2. **Expand Data**
   - Import tất cả khóa học hiện có
   - Thêm transcripts
   - Train BRK AI

3. **Optimize AI**
   - Fine-tune prompts
   - Improve responses
   - Gather feedback từ users

4. **Advanced Features**
   - Multi-language support
   - Advanced analytics
   - Feedback system
   - Rating & improvement

---

## 📝 Changelog

### v1.0 - Complete System (2026-02-09)

**New Features:**
- ✅ BRK AI Chatbot
- ✅ YouTube Manager
- ✅ Admin Data Import Module
- ✅ Multiple input methods
- ✅ Google Sheets integration
- ✅ Gemini API integration

**Files Created:**
- youtube-manager.html
- admin-data-import.html
- 3 markdown guides
- 30+ Backend functions

**Status:** 🟢 Production Ready

---

## 🎓 Credits

**BRK AI System v1.0**
- Built with: Google Apps Script, HTML5, CSS3, JavaScript
- AI Engine: Google Gemini
- Database: Google Sheets
- Deploy: Google Apps Script Web Apps

---

## 📄 License

Internal use only - Học viện BRK

---

**🎉 Chúc mừng bạn đã setup hoàn bộ BRK AI System!**

**Liên hệ admin nếu cần hỗ trợ thêm!**
