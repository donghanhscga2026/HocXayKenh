# 🧪 HƯỚNG DẪN TEST HỆ THỐNG - CẬP NHẬT MỚI

## 📂 Cấu trúc trang MỚI

```
hocxaykenh/
├── Index.html             ← TRANG CHỦ - Đăng nhập/Đăng ký
├── dashboard.html         ← Dashboard (sau khi đăng nhập)
├── forgot_password.html   ← Quên mật khẩu
├── dangky_account.html    ← (Không dùng nữa - đã tích hợp vào Index.html)
├── login.html             ← (Không dùng nữa - đã tích hợp vào Index.html)
└── home.html              ← (Landing page - tùy chọn)
```

---

## 🚀 CÁCH TEST

### **Bước 1: Mở trang chủ**

Double-click vào file:
```
C:\Users\CoachCuong\Desktop\QLHTBRK\hocxaykenh\Index.html
```

### **Bước 2: Đăng ký tài khoản mới**

1. Click **"Chưa có tài khoản? Đăng ký ngay"**
2. Form sẽ chuyển sang chế độ đăng ký
3. Điền thông tin:
   - **Email:** test@example.com *(dùng email thật)*
   - **Họ tên:** Nguyễn Văn Test
   - **SĐT:** 0912345678
   - **Mã giới thiệu:** *(để trống hoặc nhập mã có sẵn)*
   - **Mật khẩu:** Brk@3773
4. Click **"ĐĂNG KÝ"**

**Kết quả:**
- ✅ Thông báo: "Đăng ký thành công! Mã học viên: XXXX. Vui lòng kiểm tra email..."
- ✅ Form tự động chuyển về chế độ đăng nhập sau 3 giây
- ✅ Nhận email chào mừng

### **Bước 3: Kích hoạt tài khoản**

1. Mở email vừa nhận
2. Click vào **link kích hoạt**
3. Trang hiển thị: "Kích hoạt thành công!"

### **Bước 4: Đăng nhập**

1. Quay lại `Index.html`
2. Nhập:
   - **Email/SĐT:** test@example.com
   - **Mật khẩu:** Brk@3773
3. Click **"ĐĂNG NHẬP"**

**Kết quả:**
- ✅ Thông báo: "Xin chào Nguyễn Văn Test!"
- ✅ **Tự động chuyển sang `dashboard.html`**
- ✅ Hiển thị dashboard với thông tin user

### **Bước 5: Kiểm tra dashboard**

Trong dashboard, anh sẽ thấy:
- ✅ Tên user ở sidebar
- ✅ 4 tab: Trang Chủ, Bản Đồ, Khóa Học, Cài Đặt
- ✅ Nút đăng xuất

### **Bước 6: Đăng xuất**

1. Click **"Đăng Xuất"** ở sidebar
2. Confirm
3. **Tự động quay về `Index.html`**

### **Bước 7: Kiểm tra bảo vệ dashboard**

1. Thử truy cập trực tiếp `dashboard.html` (khi chưa đăng nhập)
2. **Kết quả:** Tự động redirect về `Index.html`

---

## 🔄 QUY TRÌNH HOẠT ĐỘNG

```
Index.html (Auth)
    ├─ Đăng ký → Email kích hoạt → Đăng nhập
    └─ Đăng nhập → dashboard.html
                      ├─ Trang chủ
                      ├─ Bản đồ học tập
                      ├─ Khóa học
                      ├─ Cài đặt
                      └─ Đăng xuất → Index.html
```

---

## ✅ CHECKLIST TEST

- [ ] Mở được `Index.html`
- [ ] Chuyển đổi giữa đăng nhập/đăng ký
- [ ] Đăng ký tài khoản thành công
- [ ] Nhận email chào mừng
- [ ] Kích hoạt tài khoản
- [ ] Đăng nhập thành công
- [ ] **Tự động chuyển sang `dashboard.html`**
- [ ] Dashboard hiển thị đúng thông tin
- [ ] Đăng xuất quay về `Index.html`
- [ ] **Không thể truy cập `dashboard.html` khi chưa đăng nhập**
- [ ] Quên mật khẩu hoạt động
- [ ] Đăng ký với mã giới thiệu (URL: `Index.html?ref=1001`)

---

## 🎯 ĐIỂM KHÁC BIỆT SO VỚI PHIÊN BẢN CŨ

| Tính năng | Cũ | Mới |
|-----------|-----|-----|
| Trang chủ | `home.html` | `Index.html` |
| Đăng nhập | `login.html` | `Index.html` (toggle) |
| Đăng ký | `dangky_account.html` | `Index.html` (toggle) |
| Dashboard | Trong `Index.html` | `dashboard.html` (riêng) |
| Bảo vệ | Không | Có (redirect nếu chưa login) |
| Tốc độ | Nặng | Nhẹ hơn (tách biệt) |

---

**Nếu tất cả test đều PASS → Hệ thống hoạt động hoàn hảo! 🎉**
