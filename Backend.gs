function doGet(e) {
  // 1. Xử lý xác nhận đổi Email
  if (e.parameter.action === "verifyEmailChange") {
    return verifyEmailChange(e.parameter.token);
  }

  // 2. Mặc định trả về JSON check status
  return returnJSON({ 
    status: "success", 
    message: "Hệ thống API Nhân hiệu từ gốc đang hoạt động!",
    timestamp: new Date()
  });
}

function doPost(e) {
  try {
    var content = JSON.parse(e.postData.contents);
    var action = content.action;
    
    if (action === "login") {
      return returnJSON(loginUser(content.loginInput, content.password));
    } 
    else if (action === "register") {
      return returnJSON(registerUser(content.email, content.password, content.phone, content.name));
    }
    else if (action === "updateProfile") {
      return returnJSON(updateProfile(content.email, content.oldPassword, content.newName, content.newPhone, content.newPassword));
    }
    else if (action === "requestEmailChange") {
      return returnJSON(requestEmailChange(content.email, content.newEmail));
    }
    else if (action === "getProfile") {
      return returnJSON(getProfile(content.email));
    }
    else if (action === "getCourses") {
      return returnJSON(getCourses(content.email));
    }
    // === NEW ROADMAP APIs ===
    else if (action === "getRoadmap") {
      return returnJSON(getRoadmap(content.email));
    }
    else if (action === "updateCheckpoint") {
      return returnJSON(updateCheckpoint(content.email, content.checkpointId, content.status, content.submissionData));
    }
    
    return returnJSON({ success: false, msg: "Hành động không hợp lệ!" });
    
  } catch (error) {
    return returnJSON({ success: false, msg: "Lỗi hệ thống: " + error.toString() });
  }
}

// ------------------------------------------------------------------
// CONFIG: DATABASE ID
// ------------------------------------------------------------------
const DB_ID = "1VWskTJhF6G_Y5SFMdaHsckeCn2H7hc03bEnGQ7UNn9A"; // New Data Source

function getDB() {
  return SpreadsheetApp.openById(DB_ID);
}

// ... (returnJSON giữ nguyên)

// ------------------------------------------------------------------
// CÁC HÀM XỬ LÝ NGHIỆP VỤ
// ------------------------------------------------------------------

// ... (registerUser, loginUser giữ nguyên)

// ... (logLoginHistory, normalizePhone giữ nguyên)

// ... (verifyAccount giữ nguyên)

// === TÍNH NĂNG MỚI: CẬP NHẬT THÔNG TIN ===

function getProfile(email) {
  const sheet = getDB().getSheetByName("HocVien");
  if (!sheet) return { success: false, msg: "Lỗi: Không tìm thấy sheet HocVien" };
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == email) {
      return { 
        success: true, 
        data: {
          name: data[i][4],
          phone: data[i][5],
          email: data[i][0]
        }
      };
    }
  }
  return { success: false, msg: "Không tìm thấy user" };
}

function updateProfile(email, oldPassword, newName, newPhone, newPassword) {
  const sheet = getDB().getSheetByName("HocVien");
  const data = sheet.getDataRange().getValues();
  const cleanNewPhone = normalizePhone(newPhone);

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == email && String(data[i][1]) == String(oldPassword)) {
      
      // Kiểm tra trùng SĐT nếu có thay đổi
      if (newPhone && normalizePhone(data[i][5]) !== cleanNewPhone) {
         // Check toàn bộ sheet xem SĐT mới này có ai dùng chưa
         for (let j = 1; j < data.length; j++) {
            if (i !== j && normalizePhone(data[j][5]) === cleanNewPhone) {
               return { success: false, msg: "Số điện thoại mới đã được sử dụng bởi người khác!" };
            }
         }
      }

      // Cập nhật thông tin
      if (newName) sheet.getRange(i + 1, 5).setValue(newName); // Cột E (Index 5)
      if (newPhone) sheet.getRange(i + 1, 6).setValue(cleanNewPhone); // Cột F (Index 6)
      
      // Đổi mật khẩu nếu có
      if (newPassword && newPassword.trim() !== "") {
        sheet.getRange(i + 1, 2).setValue(newPassword); // Cột B (Index 2)
      }
      
      return { success: true, msg: "Cập nhật thông tin thành công!" };
    }
  }
  return { success: false, msg: "Mật khẩu cũ không đúng hoặc tài khoản không tồn tại!" };
}

function requestEmailChange(currentEmail, newEmail) {
  const sheet = getDB().getSheetByName("HocVien");
  const data = sheet.getDataRange().getValues();
  
  // Kiểm tra email mới đã tồn tại chưa
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == newEmail) return { success: false, msg: "Email mới này đã có người sử dụng!" };
  }

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == currentEmail) {
      const changeToken = Utilities.getUuid();
      
      // Lưu Email mới chờ xác nhận vào Cột G (7) và Token vào Cột H (8)
      sheet.getRange(i + 1, 7).setValue(newEmail);
      sheet.getRange(i + 1, 8).setValue(changeToken);
      
      // Gửi mail về EMAIL CŨ
      const url = ScriptApp.getService().getUrl() + "?action=verifyEmailChange&token=" + changeToken;
      const body = `Chào bạn,\n\nBạn vừa yêu cầu đổi email đăng nhập thành: ${newEmail}.\n\nNếu đúng là bạn, hãy bấm vào link sau để XÁC NHẬN:\n${url}\n\n(Nếu không phải bạn, hãy bỏ qua email này).`;
      
      MailApp.sendEmail(currentEmail, "Xác nhận thay đổi Email - Nhân hiệu từ gốc", body);
      
      return { success: true, msg: "Vui lòng kiểm tra hộp thư của Email CŨ để xác nhận thay đổi." };
    }
  }
  return { success: false, msg: "Lỗi không tìm thấy tài khoản." };
}

function verifyEmailChange(token) {
  const sheet = getDB().getSheetByName("HocVien");
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    // Check cột H (Index 7) chứa token
    if (data[i][7] == token) {
       const newEmail = data[i][6]; // Cột G
       
       if (newEmail) {
         sheet.getRange(i + 1, 1).setValue(newEmail); // Update Email chính (Cột A)
         sheet.getRange(i + 1, 7).clearContent(); // Xóa temp
         sheet.getRange(i + 1, 8).clearContent(); // Xóa token
         
         return HtmlService.createHtmlOutput("<h2>Đổi Email thành công! Email mới: " + newEmail + ". Bạn hãy đăng nhập bằng email mới nhé.</h2>");
       }
    }
  }
  return HtmlService.createHtmlOutput("<h2>Link xác nhận không hợp lệ hoặc đã hết hạn.</h2>");
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
  // const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ss = getDB();
  const sheet = ss.getSheetByName("HocVien");
  if (!sheet) return { success: false, msg: "Lỗi: Không tìm thấy sheet HocVien" };
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
  const sheet = getDB().getSheetByName("HocVien");
  if (!sheet) return { success: false, msg: "Lỗi: Không tìm thấy sheet HocVien" };
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
  const sheet = getDB().getSheetByName("HocVien");
  if (!sheet) return HtmlService.createHtmlOutput("<h2>Lỗi kết nối DB.</h2>");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][3] === token) {
      sheet.getRange(i + 1, 3).setValue("Verified");
      return HtmlService.createHtmlOutput("<h2>Xác nhận thành công! Bạn có thể quay lại web để đăng nhập.</h2>");
    }
  }
  return HtmlService.createHtmlOutput("<h2>Mã lỗi.</h2>");
}

// --- COURSES FEATURE ---
function getCourses(email) {
  // 1. Lấy danh sách khóa học từ Sheet "KhoaHoc"
  var ss = getDB();
  var courseSheet = ss.getSheetByName("KhoaHoc");
  if (!courseSheet) {
    // Nếu chưa có Sheet, tự tạo và thêm dữ liệu mẫu
    courseSheet = ss.insertSheet("KhoaHoc");
    courseSheet.appendRow(["ID", "Name", "Description", "ImageIcon", "StatusDefault"]);
    courseSheet.appendRow(["C01", "Thấu Hiểu Bản Thân", "Khám phá điểm mạnh, điểm yếu", "fa-compass", "Open"]);
    courseSheet.appendRow(["C02", "Xây Dựng Nhân Hiệu", "Định hình phong cách cá nhân", "fa-fingerprint", "Open"]);
    courseSheet.appendRow(["C03", "Kỹ Năng Content", "Viết thu hút", "fa-pen-fancy", "Closed"]);
  }
  
  var courses = courseSheet.getDataRange().getValues();
  var courseList = [];
  
  // Bỏ qua header, duyệt từ dòng 2
  for (var i = 1; i < courses.length; i++) {
    courseList.push({
      id: courses[i][0],
      title: courses[i][1],
      desc: courses[i][2],
      icon: courses[i][3] || "fa-book",
      isRegistered: checkRegistration(email, courses[i][0]) // Hàm kiểm tra đăng ký
    });
  }
  
  return { success: true, data: courseList };
}

// Hàm giả định kiểm tra đăng ký (Sau này sẽ check sheet "DangKy")
  if (courseId === "C01") return true; // Demo: Đã đăng ký khóa 1
  return false;
}

// ------------------------------------------------------------------
// ROADMAP FEATURE (Lộ Trình)
// ------------------------------------------------------------------

function getRoadmap(email) {
  const ss = getDB();
  let sheet = ss.getSheetByName("LoTrinh");
  if (!sheet) {
    sheet = ss.insertSheet("LoTrinh");
    sheet.appendRow(["Email", "CheckpointID", "Status", "SubmissionData", "TeacherNote", "LastUpdated"]);
  }
  
  const data = sheet.getDataRange().getValues();
  const roadmap = {};
  
  // Start from 1 to skip header
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == email) {
      const code = data[i][1];
      roadmap[code] = {
        status: data[i][2],
        data: data[i][3],
        note: data[i][4],
        updated: data[i][5]
      };
    }
  }
  
  return { success: true, data: roadmap };
}

function updateCheckpoint(email, checkpointId, status, submissionData) {
  const ss = getDB();
  let sheet = ss.getSheetByName("LoTrinh");
  if (!sheet) {
    sheet = ss.insertSheet("LoTrinh");
    sheet.appendRow(["Email", "CheckpointID", "Status", "SubmissionData", "TeacherNote", "LastUpdated"]);
  }
  
  const data = sheet.getDataRange().getValues();
  const timestamp = new Date();
  
  // Find existing
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == email && data[i][1] == checkpointId) {
      if (status) sheet.getRange(i + 1, 3).setValue(status);
      if (submissionData) sheet.getRange(i + 1, 4).setValue(submissionData);
      sheet.getRange(i + 1, 6).setValue(timestamp);
      return { success: true, msg: "Cập nhật tiến độ thành công!" };
    }
  }
  
  // Not found -> Create new
  sheet.appendRow([email, checkpointId, status || "Pending", submissionData || "", "", timestamp]);
  return { success: true, msg: "Đã tạo mới tiến độ!" };
}