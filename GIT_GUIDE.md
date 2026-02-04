# 🚀 HƯỚNG DẪN ĐỒNG BỘ CODE LÊN GITHUB

## Bước 1: Cài đặt Git

### **Tải Git cho Windows:**
1. Truy cập: https://git-scm.com/download/win
2. Tải phiên bản **64-bit Git for Windows Setup**
3. Chạy file cài đặt
4. Chọn **Next** cho tất cả các bước (giữ mặc định)
5. Sau khi cài xong, mở **PowerShell** hoặc **Command Prompt** mới

### **Kiểm tra Git đã cài thành công:**
```powershell
git --version
```
Nếu hiển thị version (ví dụ: `git version 2.43.0`) → Cài thành công! ✅

---

## Bước 2: Cấu hình Git (Lần đầu tiên)

```powershell
# Thay YOUR_NAME và YOUR_EMAIL bằng thông tin của anh
git config --global user.name "YOUR_NAME"
git config --global user.email "YOUR_EMAIL@example.com"
```

---

## Bước 3: Tạo Repository trên GitHub

1. Truy cập: https://github.com
2. Đăng nhập (hoặc đăng ký nếu chưa có tài khoản)
3. Click nút **"New"** (góc trên bên trái) hoặc **"+"** → **"New repository"**
4. Điền thông tin:
   - **Repository name:** `QLHTBRK` (hoặc tên khác)
   - **Description:** "Hệ thống quản lý học tập BRK"
   - **Public** hoặc **Private** (tùy chọn)
   - **KHÔNG** tick "Initialize this repository with a README"
5. Click **"Create repository"**

---

## Bước 4: Đồng bộ Code lên GitHub

### **Mở PowerShell tại thư mục dự án:**
```powershell
cd C:\Users\CoachCuong\Desktop\QLHTBRK
```

### **Khởi tạo Git repository:**
```powershell
git init
```

### **Thêm tất cả file vào Git:**
```powershell
git add .
```

### **Commit lần đầu:**
```powershell
git commit -m "Initial commit: Auth refactoring & registration system"
```

### **Kết nối với GitHub repository:**
```powershell
# Thay YOUR_USERNAME và YOUR_REPO bằng thông tin thực tế
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
```

### **Đẩy code lên GitHub:**
```powershell
git branch -M main
git push -u origin main
```

**Lưu ý:** Nếu GitHub yêu cầu đăng nhập, anh cần tạo **Personal Access Token** (PAT):
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token → Chọn quyền `repo`
3. Copy token và dùng làm mật khẩu khi push

---

## Bước 5: Cập nhật code sau này

Mỗi khi có thay đổi, chạy các lệnh sau:

```powershell
# 1. Thêm file đã thay đổi
git add .

# 2. Commit với message mô tả
git commit -m "Fix: Column mapping in Backend.gs"

# 3. Đẩy lên GitHub
git push
```

---

## 📋 TÓM TẮT LỆNH NHANH

```powershell
# Lần đầu tiên
cd C:\Users\CoachCuong\Desktop\QLHTBRK
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main

# Các lần sau
git add .
git commit -m "Your message here"
git push
```

---

## ⚠️ LƯU Ý

1. **File nhạy cảm:** Nếu có file chứa API key, password, thêm vào `.gitignore`:
   ```
   # Tạo file .gitignore
   echo "*.env" > .gitignore
   echo "config.json" >> .gitignore
   ```

2. **Xem trạng thái:**
   ```powershell
   git status
   ```

3. **Xem lịch sử commit:**
   ```powershell
   git log --oneline
   ```

---

**Nếu anh gặp lỗi hoặc cần hỗ trợ, báo em nhé!** 🙏
