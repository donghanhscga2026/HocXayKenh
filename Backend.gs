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
      // Frontend must pass 'studentCode' now
      return returnJSON(getRoadmap(content.studentCode));
    }
    else if (action === "updateCheckpoint") {
      return returnJSON(updateCheckpoint(content.studentCode, content.checkpointId, content.status, content.submissionData));
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
  const sheet = getDB().getSheetByName("Dky"); // Map sheet Dky
  if (!sheet) return { success: false, msg: "Lỗi: Không tìm thấy sheet Dky" };
  const data = sheet.getDataRange().getValues();
  
  // Use config constants defined below or hardcode for this scope if circular
  // Re-declare for safety in case of scope issues in specific copy-paste
  const C_EMAIL = 6; 
  const C_NAME = 2;
  const C_PHONE = 5;

  for (let i = 1; i < data.length; i++) {
    if (data[i][C_EMAIL] == email) {
      return { 
        success: true, 
        data: {
          name: data[i][C_NAME],
          phone: data[i][C_PHONE],
          email: data[i][C_EMAIL]
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

// ------------------------------------------------------------------
// CONFIG: DATABASE MAPPING (Sheet: Dky)
// ------------------------------------------------------------------
// Base on Log Step 253: 0:Time, 1:Code, 2:Name, 5:Phone, 6:Email, 22:Note, 24:Pass, 25:Status, 26:Token
const COL_CODE = 1;
const COL_NAME = 2;
const COL_PHONE = 5;
const COL_EMAIL = 6;
const COL_NOTE = 22;
const COL_PASS = 24;
const COL_STATUS = 25;
const COL_TOKEN = 26;

function normalizePhone(input) {
  if (!input) return "";
  let str = input.toString().replace(/\D/g, ''); 
  if (str.length === 0) return "";
  if (str.startsWith('84')) str = '0' + str.substring(2);
  if (!str.startsWith('0')) str = '0' + str;
  return str;
}

// Hàm sinh mã học viên tự động
function generateStudentCode(sheet) {
  const data = sheet.getDataRange().getValues();
  let maxCode = 1000; // Start from 1000 if empty
  
  // Skip header, start from row 1
  for (let i = 1; i < data.length; i++) {
    const codeVal = data[i][COL_CODE];
    const noteVal = data[i][COL_NOTE];
    
    // Logic: Chỉ xét các mã là số và KHÔNG phải là VIP
    // Nếu note có chứa chữ VIP thì bỏ qua (hoặc chính xác là "VIP")
    const isVip = String(noteVal).toUpperCase().includes("VIP");
    
    if (!isVip && !isNaN(codeVal) && Number(codeVal) > 0) {
      const num = Number(codeVal);
      if (num > maxCode) maxCode = num;
    }
  }
  return maxCode + 1;
}

// Hàm Đăng ký tài khoản
function registerUser(email, password, phone, name) {
  const ss = getDB();
  const sheet = ss.getSheetByName("Dky");
  if (!sheet) return { success: false, msg: "Lỗi: Không tìm thấy sheet Dky" };
  const data = sheet.getDataRange().getValues();
  
  const cleanPhone = normalizePhone(phone); 
  
  // Kiểm tra email hoặc số điện thoại
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][COL_EMAIL]).toLowerCase() == String(email).toLowerCase()) return { success: false, msg: "Email này đã được đăng ký!" };
    if (normalizePhone(data[i][COL_PHONE]) == cleanPhone && cleanPhone !== "") {
        return { success: false, msg: "Số điện thoại này đã được đăng ký!" };
    }
  }
  
  const token = Utilities.getUuid(); 
  const timestamp = new Date();
  const newCode = generateStudentCode(sheet); // Auto-gen Code

  // Tạo row mới với cấu trúc chuẩn
  let newRow = new Array(28).fill(""); // Ensure enough columns
  
  newRow[0] = timestamp;
  newRow[COL_CODE] = newCode; 
  newRow[COL_NAME] = name;
  newRow[COL_PHONE] = cleanPhone;
  newRow[COL_EMAIL] = email;
  newRow[COL_PASS] = password;
  newRow[COL_STATUS] = "Pending";
  newRow[COL_TOKEN] = token;
  
  sheet.appendRow(newRow); 
  
  // Gửi email xác nhận
  try {
    const url = ScriptApp.getService().getUrl() + "?token=" + token;
    const body = "Chào " + name + " (Mã HV: " + newCode + "), hãy nhấn vào link sau để xác nhận đăng ký: " + url;
    MailApp.sendEmail(email, "Xác nhận đăng ký - Nhân hiệu từ gốc", body);
  } catch(e) {
  }
  
  return { success: true, msg: "Đăng ký thành công! Mã học viên: " + newCode + ". Kiểm tra email để xác nhận." };
}

// Hàm Đăng nhập
function loginUser(loginInput, password) {
  const sheet = getDB().getSheetByName("Dky"); // Sửa thành sheet Dky
  if (!sheet) return { success: false, msg: "Lỗi: Không tìm thấy sheet Dky" };
  const data = sheet.getDataRange().getValues();
  
  const cleanInput = normalizePhone(loginInput);
  
  for (let i = 1; i < data.length; i++) {
    const rowPhone = normalizePhone(data[i][COL_PHONE]);
    const isEmailMatch = (String(data[i][COL_EMAIL]).toLowerCase() === String(loginInput).toLowerCase());
    const isPhoneMatch = (cleanInput !== "" && rowPhone === cleanInput);
    
    // Nếu tìm thấy User
    if (isEmailMatch || isPhoneMatch) {
      // Check pass
      if (String(data[i][COL_PASS]) === String(password)) {
         // Check status
         const status = data[i][COL_STATUS];
         if (status === "Verified" || status === "Active" || status === "") { // Chap nhan Active hoac rong cho user cu
            const email = data[i][COL_EMAIL];
            const name = data[i][COL_NAME] || email;
            const code = data[i][COL_CODE];
            logLoginHistory(email);
            return { 
                success: true, 
                msg: "Xin chào " + name + "!", 
                user: { 
                    name: name, 
                    email: email, 
                    phone: data[i][COL_PHONE],
                    code: code // Return Code for Frontend
                } 
            };
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
  const sheet = getDB().getSheetByName("Dky");
  if (!sheet) return HtmlService.createHtmlOutput("<h2>Lỗi kết nối DB.</h2>");
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][COL_TOKEN] === token) {
      sheet.getRange(i + 1, COL_STATUS + 1).setValue("Verified"); // +1 for 1-based index
      return HtmlService.createHtmlOutput("<h2>Xác nhận thành công! Bạn có thể quay lại web để đăng nhập.</h2>");
    }
  }
  return HtmlService.createHtmlOutput("<h2>Mã lỗi hoặc Token không đúng.</h2>");
}

// --- COURSES FEATURE ---
function getCourses(email) {
  // 1. Lấy danh sách khóa học từ Sheet "KH"
  var ss = getDB();
  var courseSheet = ss.getSheetByName("KH");
  if (!courseSheet) return { success: false, msg: "Chưa có dữ liệu khóa học" };
  
  var courses = courseSheet.getDataRange().getValues();
  var courseList = [];
  
  // Mapping columns for KH sheet:
  // 0: Tên lớp học, 1: Tên khóa học (Title), 3: Mã khóa (ID), 5: Mô tả ngắn
  const C_TITLE = 1;
  const C_ID = 3;
  const C_DESC = 5;

  // Bỏ qua header, duyệt từ dòng 2
  for (var i = 1; i < courses.length; i++) {
    // Chỉ lấy dòng có ID khóa học
    if(courses[i][C_ID]) {
        courseList.push({
        id: courses[i][C_ID],
        title: courses[i][C_TITLE],
        desc: courses[i][C_DESC] || "",
        icon: "fa-book", // Default icon as sheet doesn't have it
        isRegistered: checkRegistration(email, courses[i][C_ID])
        });
    }
  }
  
  return { success: true, data: courseList };
}

// Hàm giả định kiểm tra đăng ký (Sau này sẽ check sheet "DangKy")
  if (courseId === "C01") return true; // Demo: Đã đăng ký khóa 1
  return false;
}

// ------------------------------------------------------------------
// ROADMAP FEATURE (Lộ Trình) - Using Student CODE
// ------------------------------------------------------------------

function getRoadmap(studentCode) {
  const ss = getDB();
  let sheet = ss.getSheetByName("LoTrinh");
  if (!sheet) {
    sheet = ss.insertSheet("LoTrinh");
    sheet.appendRow(["StudentCode", "CheckpointID", "Status", "SubmissionData", "TeacherNote", "LastUpdated"]);
  }
  
  const data = sheet.getDataRange().getValues();
  const roadmap = {};
  
  // Start from 1 to skip header
  for (let i = 1; i < data.length; i++) {
    // Column 0 is now StudentCode
    if (String(data[i][0]) == String(studentCode)) {
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

function updateCheckpoint(studentCode, checkpointId, status, submissionData) {
  const ss = getDB();
  let sheet = ss.getSheetByName("LoTrinh");
  if (!sheet) {
    sheet = ss.insertSheet("LoTrinh");
    sheet.appendRow(["StudentCode", "CheckpointID", "Status", "SubmissionData", "TeacherNote", "LastUpdated"]);
  }
  
  const data = sheet.getDataRange().getValues();
  const timestamp = new Date();
  
  // Find existing by StudentCode + CheckpointID
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) == String(studentCode) && data[i][1] == checkpointId) {
      if (status) sheet.getRange(i + 1, 3).setValue(status);
      if (submissionData) sheet.getRange(i + 1, 4).setValue(submissionData);
      sheet.getRange(i + 1, 6).setValue(timestamp);
      return { success: true, msg: "Cập nhật tiến độ thành công!" };
    }
  }
  
  // Not found -> Create new
  sheet.appendRow([studentCode, checkpointId, status || "Pending", submissionData || "", "", timestamp]);
  return { success: true, msg: "Đã tạo mới tiến độ!" };
}