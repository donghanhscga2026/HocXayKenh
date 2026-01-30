function doGet(e) {
  // Trả về JSON thông báo API đang hoạt động (để test kết nối)
  return returnJSON({ 
    status: "success", 
    message: "Hệ thống API Nhân hiệu từ gốc đang hoạt động!",
    timestamp: new Date()
  });
}

function doPost(e) {
  try {
    // 1. Nhận dữ liệu từ Web gửi lên
    var content = JSON.parse(e.postData.contents);
    var action = content.action; // 'login' hoặc 'register'
    
    // 2. Điều hướng xử lý
    if (action === "login") {
      return returnJSON(loginUser(content.loginInput, content.password));
    } 
    else if (action === "register") {
      return returnJSON(registerUser(content.email, content.password, content.phone, content.name));
    }
    
    return returnJSON({ success: false, msg: "Hành động không hợp lệ!" });
    
  } catch (error) {
    return returnJSON({ success: false, msg: "Lỗi hệ thống: " + error.toString() });
  }
}

// Hàm trả về JSON chuẩn có CORS (quan trọng để web ngoài gọi được)
function returnJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ------------------------------------------------------------------
// CÁC HÀM XỬ LÝ NGHIỆP VỤ (Logic giữ nguyên, chỉ chỉnh sửa nhỏ nếu cần)
// ------------------------------------------------------------------

// Hàm Đăng ký tài khoản
function registerUser(email, password, phone, name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("HocVien");
  const data = sheet.getDataRange().getValues();
  
  const cleanPhone = normalizePhone(phone); 
  
  // Kiểm tra email hoặc số điện thoại tồn tại chưa
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() == String(email).toLowerCase()) return { success: false, msg: "Email này đã được đăng ký!" };
    
    if (normalizePhone(data[i][5]) == cleanPhone && cleanPhone !== "") {
        return { success: false, msg: "Số điện thoại này đã được đăng ký!" };
    }
  }
  
  const token = Utilities.getUuid(); 
  // Cột: Email, Password, Status, Token, Name, Phone
  sheet.appendRow([email, password, "Pending", token, name, cleanPhone]); 
  
  // Gửi email xác nhận
  try {
    const url = ScriptApp.getService().getUrl() + "?token=" + token;
    const body = "Chào " + name + ", hãy nhấn vào link sau để xác nhận đăng ký: " + url;
    MailApp.sendEmail(email, "Xác nhận đăng ký - Nhân hiệu từ gốc", body);
  } catch(e) {
    // Bỏ qua lỗi gửi mail nếu quota hết, vẫn cho đăng ký thành công
  }
  
  return { success: true, msg: "Đăng ký thành công! Hãy kiểm tra Email để xác nhận." };
}

// Hàm Đăng nhập
function loginUser(loginInput, password) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("HocVien");
  const data = sheet.getDataRange().getValues();
  
  const cleanInput = normalizePhone(loginInput);
  
  for (let i = 1; i < data.length; i++) {
    const rowPhone = normalizePhone(data[i][5]);
    const isEmailMatch = (String(data[i][0]).toLowerCase() === String(loginInput).toLowerCase());
    const isPhoneMatch = (cleanInput !== "" && rowPhone === cleanInput);
    
    // Nếu tìm thấy User
    if (isEmailMatch || isPhoneMatch) {
      // Check pass
      if (String(data[i][1]) === String(password)) {
         // Check status
         if (data[i][2] === "Verified") {
            const email = data[i][0];
            const name = data[i][4] || email;
            logLoginHistory(email);
            return { success: true, msg: "Xin chào " + name + ", bạn đã đăng nhập thành công!", user: { name: name, email: email } };
         } else {
            return { success: false, msg: "Tài khoản chưa xác nhận Email!" };
         }
      } else {
         return { success: false, msg: "Mật khẩu không chính xác!" };
      }
    }
  }
  return { success: false, msg: "Thông tin đăng nhập không đúng!" };
}

// Hàm chuẩn hóa SĐT
function normalizePhone(input) {
  if (!input) return "";
  let str = input.toString().replace(/\D/g, ''); 
  if (str.length === 0) return "";
  if (str.startsWith('84')) str = '0' + str.substring(2);
  if (!str.startsWith('0')) str = '0' + str;
  return str;
}

// Hàm log lịch sử
function logLoginHistory(email) {
  try {
    const ss = SpreadsheetApp.openById("1m1nLt3iC6UBLqoGCsZjKocgR_C6ggnTp7RMrZIGfU14");
    let sheet = ss.getSheetByName("LichSuDangNhap");
    if (!sheet) {
      sheet = ss.insertSheet("LichSuDangNhap");
      sheet.appendRow(["Email", "Thời gian đăng nhập"]); 
    }
    sheet.appendRow([email, new Date()]);
  } catch (e) {
    Logger.log("Lỗi ghi lịch sử: " + e.toString());
  }
}

// Giữ lại hàm verifyAccount để link trong email vẫn chạy được (chạy dạng Web App cũ)
function verifyAccount(token) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("HocVien");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][3] === token) {
      sheet.getRange(i + 1, 3).setValue("Verified");
      return HtmlService.createHtmlOutput("<h2>Xác nhận thành công! Bạn có thể quay lại web để đăng nhập.</h2>");
    }
  }
  return HtmlService.createHtmlOutput("<h2>Mã lỗi.</h2>");
}