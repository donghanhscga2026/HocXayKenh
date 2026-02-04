# Hướng dẫn Deploy - Hệ thống Đăng ký Tài khoản BRK

## 📋 Tổng quan

Hệ thống gồm 2 phần:
- **Backend**: Google Apps Script (`Backend.gs`)
- **Frontend**: HTML files trên Vercel

---

## 🔧 BƯỚC 1: Deploy Backend (Google Apps Script)

### 1.1. Mở Google Apps Script Editor

1. Truy cập: https://script.google.com
2. Tạo project mới hoặc mở project hiện tại
3. Copy toàn bộ nội dung file `Backend.gs` vào editor

### 1.2. Kiểm tra cấu hình

Đảm bảo các constant đúng:

```javascript
const DB_ID = "1VWskTJhF6G_Y5SFMdaHsckeCn2H7hc03bEnGQ7UNn9A";
```

### 1.3. Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Chọn type: **Web app**
3. Cấu hình:
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy**
5. **Copy URL deployment** (dạng: `https://script.google.com/macros/s/ABC123.../exec`)

### 1.4. Cập nhật cột trong Google Sheets

Mở sheet `Dky` và đảm bảo có đủ 31 cột:

| Cột | Tên | Mô tả |
|-----|-----|-------|
| A | Timestamp | Thời gian đăng ký |
| B | CODE | Mã học viên |
| C | Name | Họ tên |
| D-E | ... | (Các cột khác) |
| F | Phone | Số điện thoại |
| G | Email | Email |
| ... | ... | ... |
| Y | Password | Mật khẩu |
| Z | Status | Trạng thái |
| AA | Token | Token xác thực |
| AB | ReferralCode | Mã giới thiệu |
| AC | ReferrerName | Tên người giới thiệu |
| AD | AffiliateLink | Link giới thiệu |
| AE | ActivationStatus | Trạng thái kích hoạt |

---

## 🌐 BƯỚC 2: Deploy Frontend (Vercel)

### 2.1. Cập nhật API URL

Mở các file HTML và thay `YOUR_DEPLOYMENT_ID`:

**File cần sửa:**
- `dangky_account.html`
- `login.html`
- `forgot_password.html`

**Tìm dòng:**
```javascript
const API_URL = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";
```

**Thay bằng URL thực tế từ bước 1.3:**
```javascript
const API_URL = "https://script.google.com/macros/s/ABC123xyz.../exec";
```

### 2.2. Push lên GitHub

```bash
cd C:\Users\CoachCuong\Desktop\QLHTBRK
git add .
git commit -m "Add account registration system"
git push origin main
```

### 2.3. Deploy trên Vercel

1. Truy cập: https://vercel.com
2. Import project từ GitHub
3. Vercel sẽ tự động deploy
4. Copy URL website (VD: `https://yourproject.vercel.app`)

### 2.4. Cập nhật link trong email

Mở `Backend.gs`, tìm hàm `activateAccount()` và sửa:

```javascript
<a href="https://yourdomain.vercel.app/login.html" class="btn">Đăng nhập ngay →</a>
```

Thay `yourdomain.vercel.app` bằng domain thực tế.

---

## ✅ BƯỚC 3: Test hệ thống

### 3.1. Test đăng ký

1. Truy cập: `https://yourproject.vercel.app/dangky_account.html`
2. Điền thông tin:
   - Họ tên: Test User
   - SĐT: 0912345678
   - Email: test@example.com
   - Mã giới thiệu: (để trống hoặc nhập mã có sẵn)
   - Mật khẩu: Brk@3773 (hoặc tự đặt)
3. Click **Đăng ký ngay**
4. Kiểm tra:
   - Modal hiển thị mã CODE
   - Email chào mừng được gửi
   - Dữ liệu lưu vào sheet `Dky`

### 3.2. Test kích hoạt

1. Mở email vừa nhận
2. Click vào link kích hoạt
3. Kiểm tra:
   - Trang kích hoạt hiển thị thành công
   - Cột `ActivationStatus` trong sheet = "Đã kích hoạt"

### 3.3. Test đăng nhập

1. Truy cập: `https://yourproject.vercel.app/login.html`
2. Nhập Email/SĐT + Mật khẩu
3. Kiểm tra:
   - Đăng nhập thành công
   - Chuyển hướng đến dashboard

### 3.4. Test quên mật khẩu

1. Truy cập: `https://yourproject.vercel.app/forgot_password.html`
2. Nhập email
3. Kiểm tra:
   - Email gửi mật khẩu mặc định
   - Mật khẩu trong sheet reset về `Brk@3773`

---

## 🔗 BƯỚC 4: Test link giới thiệu

### 4.1. Lấy link affiliate

Sau khi đăng ký thành công, copy link giới thiệu (VD: `https://go.giautoandien.site/r/1234`)

### 4.2. Tạo redirect (Tùy chọn)

Nếu muốn dùng domain `go.giautoandien.site`, cần:

1. Tạo trang redirect đơn giản:

```html
<!-- redirect.html -->
<script>
  const code = window.location.pathname.split('/').pop();
  window.location.href = `https://yourproject.vercel.app/dangky_account.html?ref=${code}`;
</script>
```

2. Deploy lên subdomain `go.giautoandien.site`

### 4.3. Test referral

1. Truy cập: `https://yourproject.vercel.app/dangky_account.html?ref=1234`
2. Kiểm tra:
   - Ô "Mã người giới thiệu" tự động điền `1234`
   - Sau khi đăng ký, cột `ReferrerName` có tên người giới thiệu

---

## 📧 BƯỚC 5: Tùy chỉnh Email Template

### 5.1. Sửa email chào mừng

Mở `Backend.gs`, tìm hàm `sendWelcomeEmail()`:

```javascript
const subject = "🎉 Chào mừng bạn đến với BRK - Nhân hiệu từ gốc!";
const body = `...`; // Sửa nội dung ở đây
```

### 5.2. Sửa email quên mật khẩu

Tìm hàm `sendPasswordResetEmail()`:

```javascript
const subject = "🔑 Lấy lại mật khẩu - BRK";
const body = `...`; // Sửa nội dung ở đây
```

---

## 🐛 Troubleshooting

### Lỗi: "Lỗi kết nối hệ thống"

**Nguyên nhân:** API URL sai hoặc Apps Script chưa deploy

**Giải pháp:**
1. Kiểm tra lại URL trong file HTML
2. Đảm bảo Apps Script đã deploy với quyền "Anyone"

### Lỗi: "Email này đã được đăng ký"

**Nguyên nhân:** Email/SĐT đã tồn tại trong sheet

**Giải pháp:**
- Dùng chức năng "Quên mật khẩu" để lấy lại mật khẩu
- Hoặc xóa dòng trong sheet để test lại

### Lỗi: Không nhận được email

**Nguyên nhân:** Gmail bị giới hạn quota hoặc email vào spam

**Giải pháp:**
1. Kiểm tra thư mục Spam
2. Kiểm tra quota Gmail: https://script.google.com/home/executions
3. Nếu vượt quota, đợi 24h hoặc dùng Gmail khác

---

## 📝 Checklist Deploy

- [ ] Copy `Backend.gs` vào Apps Script
- [ ] Deploy Apps Script as Web App
- [ ] Copy URL deployment
- [ ] Cập nhật API URL trong 3 file HTML
- [ ] Cập nhật link đăng nhập trong `activateAccount()`
- [ ] Push code lên GitHub
- [ ] Deploy lên Vercel
- [ ] Test đăng ký
- [ ] Test email kích hoạt
- [ ] Test đăng nhập
- [ ] Test quên mật khẩu
- [ ] Test link giới thiệu

---

## 🎉 Hoàn tất!

Hệ thống đã sẵn sàng sử dụng. Người dùng có thể:

1. ✅ Đăng ký tài khoản miễn phí
2. ✅ Nhận mã CODE tự động
3. ✅ Kích hoạt qua email
4. ✅ Đăng nhập bằng Email/SĐT
5. ✅ Lấy lại mật khẩu
6. ✅ Nhận link giới thiệu để chia sẻ

---

**Liên hệ hỗ trợ:**
- 📞 Hotline: 0876.473.257
- 📧 Email: support@giautoandien.site
