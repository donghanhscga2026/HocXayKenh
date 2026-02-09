# ⚡ Quick Start - Cấu Hình BRK AI YouTube Manager

## 📋 Checklist Cấu Hình (15 phút)

- [ ] **Bước 1:** Deploy Backend.gs
- [ ] **Bước 2:** Lấy Deployment ID
- [ ] **Bước 3:** Update API_URL
- [ ] **Bước 4:** Mở YouTube Manager
- [ ] **Bước 5:** Test thêm video

---

## 🔧 Bước 1: Deploy Backend.gs

### Nếu chưa deploy:

1. Mở **Backend.gs** trong Google Apps Script
2. Click **"Deploy"** → **"New deployment"**
3. Chọn loại: **Web app**
4. Execute as: **[Chọn email của bạn]**
5. Who has access: **Anyone**
6. **Deploy**

### Nếu đã deploy, update:

1. Click **"Deploy"** → **"Manage deployments"**
2. Chọn deployment cũ
3. Click "Redeploy"
4. **Deploy**

---

## 🔑 Bước 2: Lấy Deployment ID

Sau khi Deploy, bạn sẽ thấy URL như này:

```
https://script.google.com/macros/s/AKfycbw1A2B3C4D5E6F7G8H9I0J/usercallable
                           ↑
                    Deployment ID
```

**Copy phần này:**
```
AKfycbw1A2B3C4D5E6F7G8H9I0J
```

---

## 📝 Bước 3: Update API_URL

### Trong youtube-manager.html:

1. Mở file **youtube-manager.html**
2. Tìm dòng:
   ```javascript
   const API_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/usercallable';
   ```

3. Replace:
   ```javascript
   const API_URL = 'https://script.google.com/macros/s/AKfycbw1A2B3C4D5E6F7G8H9I0J/usercallable';
   ```

4. **Save file**

---

## 🌐 Bước 4: Mở YouTube Manager

### Truy cập:
```
http://localhost:3000/youtube-manager.html
```

Nếu máy chủ HTTP chưa chạy:
```bash
cd /workspaces/HocXayKenh
python3 -m http.server 3000
```

---

## ✅ Bước 5: Test Thêm Video

### Test Nhanh:

1. **Mở YouTube Manager**

2. **Tab "Thêm Video Mới"** → Điền:
   - YouTube URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
   - Khóa Học: `KH001`
   - Mã Bài: `TEST001`
   - Transcript: `Test video transcript`

3. **Click "Lấy Metadata"**
   - Nên thấy thông tin video

4. **Click "Lưu Video"**
   - Thành công: ✅ "Lưu video thành công!"
   - Lỗi: ❌ Kiểm tra console (F12)

---

## 🎉 Hoàn Tất!

Bây giờ bạn có thể:
- ✅ Thêm video YouTube
- ✅ Import bulk từ CSV
- ✅ BRK AI học từ video

---

## 🆘 Troubleshooting

### ❌ Lỗi: "Failed to fetch"

**Nguyên nhân:** API_URL sai hoặc Backend chưa deploy

**Giải pháp:**
1. Kiểm tra `const API_URL` trong youtube-manager.html
2. Kiểm tra Deployment ID có đúng không
3. Redeploy Backend.gs

### ❌ Lỗi: "Sheet không tồn tại"

**Nguyên nhân:** Chưa tạo Google Sheet database

**Giải pháp:**
1. Mở Google Sheet (trong Backend.gs code: DB_ID)
2. Chạy lần đầu tiên, nó sẽ tự tạo sheet
3. Hoặc thêm button "Create Sheets" vào UI

### ❌ Lỗi: "URL YouTube không hợp lệ"

**Nguyên nhân:** Format URL sai

**Giải pháp:**
```
✅ Hợp lệ:
https://www.youtube.com/watch?v=dQw4w9WgXcQ
https://youtu.be/dQw4w9WgXcQ

❌ Không hợp lệ:
youtube.com/watch?v=dQw4w9WgXcQ
```

---

## 📞 Cần Giúp?

Dùng Console Debug (F12 → Console) để xem lỗi chi tiết

Hoặc tham khảo: **YOUTUBE_AI_GUIDE.md**
