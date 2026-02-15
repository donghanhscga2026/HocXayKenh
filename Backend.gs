function doGet(e) {
  // Handle preflight CORS requests
  if (e && e.parameter && e.parameter.origin) {
    var output = ContentService.createTextOutput('');
    output.setMimeType(ContentService.MimeType.TEXT);
    output.setHeader('Access-Control-Allow-Origin', '*');
    output.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    output.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return output;
  }
  
  // Guard: khi chạy trực tiếp từ editor, `e` có thể undefined
  if (!e || typeof e !== 'object') {
    Logger.log('doGet called without event object');
    return returnJSON({
      status: 'error',
      message: 'No event object provided. Invoke this function via the webapp URL or provide an event object when testing.',
      timestamp: new Date()
    });
  }

  e.parameter = e.parameter || {};

  // 1. Xử lý kích hoạt tài khoản
  if (e.parameter.action === "activate") {
    return activateAccount(e.parameter.token);
  }

  // 2. Xử lý xác nhận đổi Email
  if (e.parameter.action === "verifyEmailChange") {
    return verifyEmailChange(e.parameter.token);
  }

  // 3. Mặc định trả về JSON check status
  return returnJSON({ 
    status: "success", 
    message: "Hệ thống API Nhân hiệu từ gốc đang hoạt động!",
    timestamp: new Date()
  });
}

// Helper to trigger UrlFetchApp authorization from the Apps Script editor.
// Run this function in the Apps Script UI (Run -> authorizeUrlFetchTest) and
// accept the permission prompt. It performs a simple GET to httpbin.org.
function authorizeUrlFetchTest() {
  try {
    var resp = UrlFetchApp.fetch('https://httpbin.org/get', { muteHttpExceptions: true });
    Logger.log('authorizeUrlFetchTest response code: ' + resp.getResponseCode());
    return returnJSON({ success: true, code: resp.getResponseCode() });
  } catch (err) {
    Logger.log('authorizeUrlFetchTest error: ' + err.toString());
    return returnJSON({ success: false, error: err.toString() });
  }
}

// ------------------------------------------------------------------
// LOGGING SYSTEM
// ------------------------------------------------------------------

function logErrorToSheet(action, errorMsg, data) {
  try {
    const ss = getDB();
    let sheet = ss.getSheetByName("System_Logs");
    
    // Nếu chưa có sheet logs, tự tạo và thêm header
    if (!sheet) {
      sheet = ss.insertSheet("System_Logs");
      sheet.appendRow(["Timestamp", "Action", "Error Message", "Input Data"]);
      sheet.setColumnWidth(1, 150);
      sheet.setColumnWidth(2, 150);
      sheet.setColumnWidth(3, 300);
      sheet.setColumnWidth(4, 300);
    }
    
    // Ghi log
    sheet.appendRow([
      new Date(),
      action || "Unknown",
      errorMsg,
      JSON.stringify(data || {})
    ]);
    
  } catch (e) {
    // Nếu lỗi khi ghi log thì... chịu, chỉ console.log
    Logger.log("Failed to write to System_Logs: " + e.toString());
  }
}

function doPost(e) {
  var content = {};
  var action = "";
  try {
    // Handle CORS preflight OPTIONS request
    if (e.requestMethod === 'OPTIONS') {
      var output = ContentService.createTextOutput('');
      output.setMimeType(ContentService.MimeType.TEXT);
      output.setHeader('Access-Control-Allow-Origin', '*');
      output.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      output.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return output;
    }
    
    if (!e || !e.postData || !e.postData.contents) {
        return returnJSON({ success: false, msg: "No post data received" });
    }
    
    content = JSON.parse(e.postData.contents);
    action = content.action;
    
    if (action === "login") {
      return returnJSON(loginUser(content.loginInput, content.password));
    } 
    else if (action === "register") {
      return returnJSON(registerUser(content.email, content.password, content.phone, content.name, content.referralCode));
    }
    else if (action === "updateProfile") {
      return returnJSON(updateProfile(content.email, content.oldPassword, content.newName, content.newPhone, content.newPassword));
    }
    else if (action === "requestEmailChange") {
      return returnJSON(requestEmailChange(content.email, content.newEmail));
    }
    else if (action === "getProfile") {
      return returnJSON(getProfile(content.studentCode));
    }
    else if (action === "getCourses") {
      return returnJSON(getCourses(content.studentCode));
    }
    // === NEW ROADMAP APIs ===
    else if (action === "getRoadmap") {
      // Frontend must pass 'studentCode' now
      return returnJSON(getRoadmap(content.studentCode));
    }
    else if (action === "updateCheckpoint") {
      return returnJSON(updateCheckpoint(content.studentCode, content.checkpointId, content.status, content.submissionData));
    }
    else if (action === "forgotPassword") {
      return returnJSON(sendPasswordResetEmail(content.email));
    }
    else if (action === "getReferrerInfo") {
      return returnJSON(getReferrerInfo(content.referralCode));
    }
    else if (action === "activateCourse") {
      return returnJSON(activateCourse(content));
    }
    else if (action === "getCourseDepositInfo") {
      return returnJSON(getCourseDepositInfo(content.courseId));
    }
    else if (action === "getCourseContent") {
      return returnJSON(getCourseContent(content.studentCode, content.courseId));
    }
    else if (action === "updateVideoProgress") {
      return returnJSON(updateVideoProgress(content.studentCode, content.courseId, content.lessonId, content.currentTime, content.duration));
    }
    else if (action === "chatWithAI") {
      return returnJSON(chatWithAI(content.message, content.conversationHistory, content.studentCode));
    }
    else if (action === "addVideoToCourse") {
      return returnJSON(addVideoToCourse(content));
    }
    else if (action === "getYoutubeVideos") {
      return returnJSON(getYoutubeVideos());
    }
    else if (action === "deleteVideo") {
      return returnJSON(deleteVideo(content.videoId));
    }
    else if (action === "bulkAddVideos") {
      return returnJSON(bulkAddVideos(content.videos));
    }
    else if (action === "addTextContent") {
      return returnJSON(addTextContent(content));
    }
    else if (action === "addFileContent") {
      return returnJSON(addFileContent(content));
    }
    else if (action === "extractYoutubeBulk") {
      return returnJSON(extractYoutubeBulk(content.urls, content.courseId));
    }
    else if (action === "addYoutubeVideos") {
      return returnJSON(addYoutubeVideos(content.videos, content.courseId));
    }
    else if (action === "getDataStats") {
      return returnJSON(getDataStats());
    }
    else if (action === "getAllData") {
      return returnJSON(getAllData());
    }
    else if (action === "deleteContent") {
      return returnJSON(deleteContent(content.id));
    }
    else if (action === "clearAllData") {
      return returnJSON(clearAllData());
    }
    else if (action === "submitAssignment") {
      return returnJSON(submitAssignment(
        content.studentCode, 
        content.courseId, 
        content.lessonId, 
        content.reflection, 
        content.link1, 
        content.link2, 
        content.link3,
        content.disciplineSupport1,
        content.disciplineSupport2,
        content.videoMaxTime,
        content.duration
      ));
    }
    else if (action === "getAllAvailableCourses") {
      return returnJSON(getAllAvailableCourses());
    }

    // Nếu không khớp action nào
    logErrorToSheet(action, "Invalid Action (Action not found in doPost)", content);
    return returnJSON({ success: false, msg: "Hành động không hợp lệ: " + action });
    
  } catch (error) {
    logErrorToSheet(action, "System Error: " + error.toString(), content);
    return returnJSON({ success: false, msg: "Lỗi hệ thống: " + error.toString() });
  }
}

// ------------------------------------------------------------------
// CONFIG: DATABASE ID
// ------------------------------------------------------------------
const DB_ID = "1VWskTJhF6G_Y5SFMdaHsckeCn2H7hc03bEnGQ7UNn9A"; // New Data Source
const FOLDER_ID = ""; // TODO: Thêm ID của Google Drive folder để lưu các file tài liệu học viên

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

function getProfile(studentCode) {
  const sheet = getDB().getSheetByName("Dky"); // Map sheet Dky
  if (!sheet) return { success: false, msg: "Lỗi: Không tìm thấy sheet Dky" };
  const data = sheet.getDataRange().getValues();
  
  // Use config constants defined below or hardcode for this scope if circular
  // Re-declare for safety in case of scope issues in specific copy-paste
  const C_CODE = 1;  // MÃ CODE
  const C_NAME = 2;
  const C_PHONE = 5;
  const C_EMAIL = 6;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][C_CODE]) == String(studentCode)) {
      return { 
        success: true, 
        data: {
          code: data[i][C_CODE],
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
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  output.setHeader('Access-Control-Allow-Origin', '*');
  output.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return output;
}

// ------------------------------------------------------------------
// CÁC HÀM XỬ LÝ NGHIỆP VỤ (Logic giữ nguyên, chỉ chỉnh sửa nhỏ nếu cần)
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// CONFIG: DATABASE MAPPING (Sheet: Dky)
// ------------------------------------------------------------------
// SỬ DỤNG TÊN CỘT THAY VÌ INDEX - Tối ưu hơn, không sợ lỗi khi chèn/xóa cột
// Hàm lấy index cột theo tên header
function getColumnIndex(sheet, columnName) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  for (let i = 0; i < headers.length; i++) {
    if (String(headers[i]).trim().toLowerCase() === columnName.toLowerCase()) {
      return i;
    }
  }
  return -1; // Không tìm thấy
}

// Cache column indexes for performance (call once per request)
let COL_CACHE = null;

function getColumnIndexes(sheet) {
  if (COL_CACHE) return COL_CACHE;
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const indexes = {};
  
  for (let i = 0; i < headers.length; i++) {
    const name = String(headers[i]).trim();
    indexes[name] = i;
  }
  
  COL_CACHE = indexes;
  return indexes;
}

// Fallback to hardcoded indexes if header not found
const COL_CODE = 1;
const COL_NAME = 2;
const COL_REFERRAL_CODE = 3;  // Cột D (Mã giới thiệu)
const COL_REFERRER_NAME = 4;  // Cột E (Tên người giới thiệu)
const COL_PHONE = 5;
const COL_EMAIL = 6;
const COL_AFFILIATE_LINK = 13; // Cột N (Link tiếp thị)
const COL_NOTE = 22;
const COL_PASS = 24;
const COL_STATUS = 25; // Cột Z (Đã kích hoạt)
const COL_TOKEN = 26;
const COL_ACTIVATION_STATUS = 25; // Cùng cột Z, không cần 2 cột

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
  let maxCode = 0; // Start from 0 to find actual max
  
  // Skip header, start from row 1
  for (let i = 1; i < data.length; i++) {
    const codeVal = data[i][COL_CODE];
    const noteVal = data[i][COL_NOTE];
    
    // Skip completely empty rows
    if (!codeVal && !data[i][COL_NAME] && !data[i][COL_EMAIL]) {
      continue;
    }
    
    // Logic: Chỉ xét các mã là số và KHÔNG phải là VIP
    // Nếu note có chứa chữ VIP thì bỏ qua
    const isVip = noteVal && String(noteVal).toUpperCase().includes("VIP");
    
    if (!isVip && codeVal) {
      const num = Number(codeVal);
      if (!isNaN(num) && num > 0 && num > maxCode) {
        maxCode = num;
      }
    }
  }
  
  // If no valid code found, start from 1000
  if (maxCode === 0) {
    maxCode = 1000;
  }
  
  return maxCode + 1;
}

// Hàm Đăng ký tài khoản
function registerUser(email, password, phone, name, referralCode) {
  const ss = getDB();
  const sheet = ss.getSheetByName("Dky");
  if (!sheet) return { success: false, msg: "Lỗi: Không tìm thấy sheet Dky" };
  const data = sheet.getDataRange().getValues();
  
  const cleanPhone = normalizePhone(phone);
  const finalPassword = password || "Brk@3773"; // Mật khẩu mặc định
  
  // Kiểm tra email hoặc số điện thoại
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][COL_EMAIL]).toLowerCase() == String(email).toLowerCase()) {
      return { success: false, msg: "Email này đã được đăng ký!", isDuplicate: true };
    }
    if (normalizePhone(data[i][COL_PHONE]) == cleanPhone && cleanPhone !== "") {
      return { success: false, msg: "Số điện thoại này đã được đăng ký!", isDuplicate: true };
    }
  }
  
  const token = Utilities.getUuid(); 
  const timestamp = new Date();
  const newCode = generateStudentCode(sheet);
  const affiliateLink = "https://go.giautoandien.site/r/" + newCode;
  
  // Tra cứu tên người giới thiệu
  const referrerName = getReferrerName(sheet, referralCode);

  // Find the correct row to insert (right after last data row)
  let nextRow = sheet.getLastRow() + 1;
  
  // Ghi dữ liệu vào từng cột cụ thể (tránh lỗi mapping)
  sheet.getRange(nextRow, 1).setValue(timestamp);                    // Cột A: Timestamp
  sheet.getRange(nextRow, COL_CODE + 1).setValue(newCode);           // Cột B: Code
  sheet.getRange(nextRow, COL_NAME + 1).setValue(name);              // Cột C: Name
  sheet.getRange(nextRow, COL_REFERRAL_CODE + 1).setValue(referralCode || ""); // Cột D: Mã giới thiệu
  sheet.getRange(nextRow, COL_REFERRER_NAME + 1).setValue(referrerName);        // Cột E: Tên người giới thiệu
  sheet.getRange(nextRow, COL_PHONE + 1).setValue(cleanPhone);       // Cột F: Phone
  sheet.getRange(nextRow, COL_EMAIL + 1).setValue(email);            // Cột G: Email
  sheet.getRange(nextRow, COL_AFFILIATE_LINK + 1).setValue(affiliateLink);      // Cột N: Link tiếp thị
  sheet.getRange(nextRow, COL_NOTE + 1).setValue("");                // Cột W: Note (trống)
  sheet.getRange(nextRow, COL_PASS + 1).setValue(finalPassword);     // Cột Y: Password
  sheet.getRange(nextRow, COL_STATUS + 1).setValue("Chưa kích hoạt"); // Cột Z: Status
  sheet.getRange(nextRow, COL_TOKEN + 1).setValue(token);            // Cột AA: Token
 
  
  // Gửi email chào mừng
  sendWelcomeEmail(email, name, newCode, finalPassword, affiliateLink, token);
  
  return { 
    success: true, 
    msg: "Đăng ký thành công! Mã học viên: " + newCode + ". Vui lòng kiểm tra email để kích hoạt tài khoản.",
    code: newCode,
    affiliateLink: affiliateLink
  };
}

// Hàm Đăng nhập
function loginUser(loginInput, password) {
  const sheet = getDB().getSheetByName("Dky"); // Sửa thành sheet Dky
  if (!sheet) return { success: false, msg: "Lỗi: Không tìm thấy sheet Dky" };
  const data = sheet.getDataRange().getValues();
  
  const cleanInput = normalizePhone(loginInput);
  
  for (let i = 1; i < data.length; i++) {
    const rowPhone = normalizePhone(data[i][COL_PHONE]);
    const rowCode = String(data[i][COL_CODE]).trim();
    const isEmailMatch = (String(data[i][COL_EMAIL]).toLowerCase() === String(loginInput).toLowerCase());
    const isPhoneMatch = (cleanInput !== "" && rowPhone === cleanInput);
    const isCodeMatch = (rowCode !== "" && rowCode === String(loginInput).trim());
    
    // Nếu tìm thấy User (Email, Phone, hoặc CODE)
    if (isEmailMatch || isPhoneMatch || isCodeMatch) {
      // Check pass
      if (String(data[i][COL_PASS]) === String(password)) {
         // Check activation status
         const activationStatus = data[i][COL_ACTIVATION_STATUS];
         const status = data[i][COL_STATUS];
         
         // Chấp nhận: "Đã kích hoạt", "Verified", "Active", hoặc rỗng (user cũ)
         if (activationStatus === "Đã kích hoạt" || status === "Verified" || status === "Active" || status === "" || activationStatus === "") {
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
            return { success: false, msg: "Tài khoản chưa được kích hoạt! Vui lòng kiểm tra email để kích hoạt." };
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
function getCourses(studentCode) {
  // 1. Kiểm tra thông tin học viên
  if (!studentCode) {
    return { success: false, msg: "Không tìm thấy mã học viên!" };
  }
  
  // 2. Lấy danh sách khóa học từ Sheet "KH"
  const ss = getDB();
  const courseSheet = ss.getSheetByName("KH");
  if (!courseSheet) return { success: false, msg: "Chưa có dữ liệu khóa học" };
  
  const courses = courseSheet.getDataRange().getValues();
  if (courses.length < 2) return { success: true, data: [] };

  const headers = courses[0];
  
  // Helper: Find column index by name (case-insensitive, trimmed)
  const findIndex = (name) => {
    return headers.findIndex(h => String(h).trim().toLowerCase() === name.toLowerCase());
  };

  // Dynamic Column Mapping
  const COL_MA_LOP = findIndex("Ma_Lop");
  const COL_TEN_KHOA_HOC = findIndex("Tên khóa học");
  const COL_TEN_LOP_HOC = findIndex("Tên lớp học");
  const COL_CO_SAN = findIndex("Có sẵn");
  const COL_MO_TA = findIndex("Mo_Ta_Ngan");
  const COL_PHI_COC = findIndex("Phí cọc");
  const COL_LINK_ANH = findIndex("Link_Anh_Lop");
  
  // Lấy danh sách khóa đã kích hoạt từ LS_DangKy
  let activatedCourses = [];
  try {
    activatedCourses = getActivatedCoursesFromLS(studentCode) || [];
  } catch (e) {
    Logger.log("Lỗi lấy khóa đã kích hoạt: " + e.toString());
    activatedCourses = [];
  }
  
  const courseList = [];
  
  // Duyệt qua danh sách khóa học
  for (let i = 1; i < courses.length; i++) {
    const row = courses[i];
    
    // Check Availability
    let isAvailable = false;
    if (COL_CO_SAN !== -1) {
       const val = row[COL_CO_SAN];
       isAvailable = (val === true || String(val).toUpperCase() === "TRUE" || val === 1);
    }

    const courseMaLop = (COL_MA_LOP !== -1) ? String(row[COL_MA_LOP] || "").trim() : "";
    
    // Chỉ lấy khóa học có Có sẵn = TRUE và có Ma_Lop
    if (isAvailable && courseMaLop) {
      const courseId = courseMaLop;
      
      // Title Logic: Prioritize Tên lớp học > Tên khóa học
      let courseName = "";
      if (COL_TEN_LOP_HOC !== -1 && row[COL_TEN_LOP_HOC]) {
        courseName = String(row[COL_TEN_LOP_HOC]);
      } else if (COL_TEN_KHOA_HOC !== -1) {
        courseName = String(row[COL_TEN_KHOA_HOC] || "");
      }

      // Logic kích hoạt
      const has86D = activatedCourses.includes("86D");
      const isActivated = has86D || activatedCourses.includes(courseId);
      
      // Fee Logic
      let isFree = false;
      if (COL_PHI_COC !== -1) {
        const fee = Number(row[COL_PHI_COC]);
        isFree = (isNaN(fee) || fee <= 0);
      }
      
      let percentComplete = 0;
      if (isActivated) {
        try {
          percentComplete = calculateCourseProgress(studentCode, courseId, ss);
        } catch (e) {
          Logger.log("Lỗi tính tiến độ cho khóa " + courseId + ": " + e.toString());
          percentComplete = 0;
        }
      }
      
      // Image Logic
      let imageUrl = "";
      if (COL_LINK_ANH !== -1) imageUrl = String(row[COL_LINK_ANH] || "");

      courseList.push({
        id: courseId,
        title: courseName || "Khóa học",
        desc: (COL_MO_TA !== -1) ? String(row[COL_MO_TA] || "") : "",
        imageUrl: imageUrl,
        icon: "fa-book",
        isFree: isFree,
        isActivated: isActivated,
        canActivate: !isActivated && !isFree,
        percentComplete: percentComplete
      });
    }
  }
  
  return { success: true, data: courseList };
}

// --- CONFIG: KH_TienDo COLUMN NAMES ---
const COL_NAME_GHI_NHAN = "Thoi_Gian_Ghi_Nhan";
const COL_NAME_MA_CODE = "Ma_Code";
const COL_NAME_EMAIL = "Email";
const COL_NAME_TEN_HV = "Ten_HV";
const COL_NAME_MA_KH = "Ma_KH";
const COL_NAME_MA_BAI = "Ma_Bai";
const COL_NAME_HIEN_TAI = "Thoi_Diem_Hien_Tai";
const COL_NAME_XA_NHAT = "Diem_Xem_Xa_Nhat";
const COL_NAME_DIEM_VIDEO = "Diem_Video";
const COL_NAME_BHTDN = "BHTDN";
const COL_NAME_DIEM_BHTDN = "Diem_BHTDN";
const COL_NAME_LINK_1 = "Link_Video1";
const COL_NAME_LINK_2 = "Link_Video2";
const COL_NAME_LINK_3 = "Link_Video3";
const COL_NAME_DIEM_LINK = "Diem_Link";
const COL_NAME_HO_TRO_1 = "Ho_Tro1";
const COL_NAME_HO_TRO_2 = "Ho_Tro2";
const COL_NAME_DIEM_DUNG_HAN = "Diem_Dung_Han";
const COL_NAME_TONG_DIEM = "Tong_Diem";
const COL_NAME_XEP_LOAI = "Xep_Loai"; // Wait, user sheet doesn't seem to show Xep_Loai in the partial view, but usually it's there.
const COL_NAME_TRANG_THAI = "Trang_Thai"; // Need to check if this exists or if it's derived.

function calculateCourseProgress(studentCode, courseId, ss) {
  try {
    const contentSheet = ss.getSheetByName("KH_NoiDung");
    const progressSheet = ss.getSheetByName("KH_TienDo");
    if (!contentSheet || !progressSheet) return 0;

    const content = contentSheet.getDataRange().getValues();
    let totalLessons = 0;
    for (let i = 1; i < content.length; i++) {
      if (content[i][0] == courseId) totalLessons++;
    }
    if (totalLessons === 0) return 0;

    // Use Dynamic Column Index
    const idxStudentCode = getColumnIndex(progressSheet, COL_NAME_MA_CODE);
    const idxCourse = getColumnIndex(progressSheet, COL_NAME_MA_KH);
    let idxStatus = getColumnIndex(progressSheet, COL_NAME_TRANG_THAI);
    
    // Fallback nếu không tìm được Trang_Thai
    if (idxStatus === -1) idxStatus = getColumnIndex(progressSheet, "Trang_Thai");
    if (idxStatus === -1) idxStatus = getColumnIndex(progressSheet, "Status");
    
    if (idxStudentCode === -1 || idxCourse === -1 || idxStatus === -1) {
      Logger.log(`calculateCourseProgress: Thiếu cột (Code=${idxStudentCode}, Course=${idxCourse}, Status=${idxStatus})`);
      return 0;
    }

    const progress = progressSheet.getDataRange().getValues();
    let completedCount = 0;
    for (let i = 1; i < progress.length; i++) {
      const rowStudentCode = String(progress[i][idxStudentCode]);
      const rowCourse = String(progress[i][idxCourse]);
      
      if (rowStudentCode === String(studentCode) && rowCourse == courseId) {
        const currentStatus = progress[i][idxStatus];
        if (currentStatus == "Completed" || currentStatus == "Approved" || currentStatus == "Done") {
          completedCount++;
        }
      }
    }

    return Math.round((completedCount / totalLessons) * 100);
  } catch (error) {
    Logger.log("Lỗi calculateCourseProgress: " + error.toString());
    return 0;
  }
}

function getCourseContent(studentCode, courseId) {
  const ss = getDB();
  const contentSheet = ss.getSheetByName("KH_NoiDung");
  const progressSheet = ss.getSheetByName("KH_TienDo");
  
  if (!contentSheet) return { success: false, msg: "Sheet nội dung không tồn tại" };
  
  const contentData = contentSheet.getDataRange().getValues();
  // FORCE reading ALL columns to ensure we catch new columns added by user
  const progressData = (progressSheet && progressSheet.getLastRow() > 0) ? progressSheet.getDataRange().getValues() : [];
  
  const curriculum = [];
  for (let i = 1; i < contentData.length; i++) {
    if (contentData[i][0] == courseId) {
      const lessonId = String(contentData[i][1]);
      
      // Tìm tiến độ của học viên cho bài này
      let userProgress = { currentTime: 0, maxTime: 0, status: "Locked" };
      
      // Get Dynamic Column Indexes
      const idxStudentCode = getColumnIndex(progressSheet, COL_NAME_MA_CODE);
      const idxCourse = getColumnIndex(progressSheet, COL_NAME_MA_KH);
      const idxLesson = getColumnIndex(progressSheet, COL_NAME_MA_BAI);
      
      // Data Columns
      const idxCurTime = getColumnIndex(progressSheet, COL_NAME_HIEN_TAI);
      const idxMaxTime = getColumnIndex(progressSheet, COL_NAME_XA_NHAT);
      const idxStatus = getColumnIndex(progressSheet, COL_NAME_TRANG_THAI);
      const idxLink1 = getColumnIndex(progressSheet, COL_NAME_LINK_1);
      const idxVidScore = getColumnIndex(progressSheet, COL_NAME_DIEM_VIDEO);
      const idxReflect = getColumnIndex(progressSheet, COL_NAME_BHTDN);
      const idxLink2 = getColumnIndex(progressSheet, COL_NAME_LINK_2);
      const idxLink3 = getColumnIndex(progressSheet, COL_NAME_LINK_3);
      const idxTotal = getColumnIndex(progressSheet, COL_NAME_TONG_DIEM);
      const idxGrade = getColumnIndex(progressSheet, COL_NAME_XEP_LOAI);
      const idxSupp1 = getColumnIndex(progressSheet, COL_NAME_HO_TRO_1);
      const idxSupp2 = getColumnIndex(progressSheet, COL_NAME_HO_TRO_2);
      
      if (idxStudentCode !== -1 && idxCourse !== -1 && idxLesson !== -1) {
          for (let j = 1; j < progressData.length; j++) {
            const pStudentCode = String(progressData[j][idxStudentCode]);
            const pCourseId = String(progressData[j][idxCourse]);
            const pLessonId = String(progressData[j][idxLesson]);
            
            if (pStudentCode === String(studentCode) && pCourseId === courseId && pLessonId === lessonId) {
              
              const getVal = (idx) => (idx !== -1 ? progressData[j][idx] : undefined);
              const getNum = (idx) => (idx !== -1 ? Number(progressData[j][idx] || 0) : 0);
              const getBool = (idx) => {
                  if (idx === -1) return false;
                  const v = progressData[j][idx];
                  return v === true || v === "true" || v === 1;
              };

              userProgress = {
                currentTime: getNum(idxCurTime),
                maxTime: getNum(idxMaxTime),
                status: getVal(idxStatus) || "In Progress",
                link1: getVal(idxLink1) || "",
                videoScore: getNum(idxVidScore),
                reflection: getVal(idxReflect) || "",
                link2: getVal(idxLink2) || "",
                link3: getVal(idxLink3) || "",
                totalScore: getNum(idxTotal),
                grade: getVal(idxGrade) || "",
                disciplineSupport1: getBool(idxSupp1),
                disciplineSupport2: getBool(idxSupp2)
              };
              break;
            }
          }
      }
      
      curriculum.push({
        id: lessonId,
        title: String(contentData[i][2]),
        youtubeId: String(contentData[i][3]),
        summary: String(contentData[i][4]),
        assignmentType: String(contentData[i][5]),
        order: Number(contentData[i][6] || i),
        progress: userProgress
      });
    }
  }
  
  // Sắp xếp theo order
  curriculum.sort((a, b) => a.order - b.order);
  
  // Logic khóa bài: Bài n+1 chỉ mở khi bài n hoàn thành
  for (let i = 0; i < curriculum.length; i++) {
    if (i === 0) {
      if (curriculum[i].progress.status === "Locked") curriculum[i].progress.status = "Available";
    } else {
      const prevLessonStatus = curriculum[i-1].progress.status;
      if (prevLessonStatus === "Completed" || prevLessonStatus === "Approved") {
        if (curriculum[i].progress.status === "Locked") curriculum[i].progress.status = "Available";
      }
    }
  }
  
  return { success: true, data: curriculum };
}



// Hàm giả định kiểm tra đăng ký (Sau này sẽ check sheet "DangKy")
function checkRegistration(email, courseId) {
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

// ------------------------------------------------------------------
// NEW ACCOUNT REGISTRATION FUNCTIONS
// ------------------------------------------------------------------

// Tra cứu tên người giới thiệu
function getReferrerName(sheet, referralCode) {
  if (!referralCode) return "";
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][COL_CODE]) === String(referralCode)) {
      return data[i][COL_NAME] || "";
    }
  }
  return "";
}

// Gửi email chào mừng với link kích hoạt
function sendWelcomeEmail(email, name, code, password, affiliateLink, token) {
  const activateUrl = ScriptApp.getService().getUrl() + "?action=activate&token=" + token;
  
  const subject = "🎉 Chào mừng bạn đến với BRK - Nhân hiệu từ gốc!";
  const body = `
Xin chào ${name},

Chúc mừng bạn đã đăng ký thành công tài khoản!

📌 THÔNG TIN TÀI KHOẢN:
━━━━━━━━━━━━━━━━━━━━━━━━━━
• Mã học viên: ${code}
• Email: ${email}
• Mật khẩu: ${password}

⚠️ QUAN TRỌNG: Vui lòng kích hoạt tài khoản bằng cách click vào link sau:
👉 ${activateUrl}

━━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 LINK GIỚI THIỆU CỦA BẠN:
${affiliateLink}

Hãy chia sẻ link này với bạn bè để cùng tham gia cộng đồng BRK!
Mỗi người bạn giới thiệu thành công, bạn sẽ nhận được ưu đãi đặc biệt.

━━━━━━━━━━━━━━━━━━━━━━━━━━

Nếu cần hỗ trợ, vui lòng liên hệ:
📞 Hotline: 0876.473.257
📧 Email: support@giautoandien.site

Trân trọng,
Ban Tổ Chức BRK
  `;
  
  try {
    MailApp.sendEmail({
      to: email,
      subject: subject,
      body: body
    });
    Logger.log("Đã gửi email chào mừng đến: " + email);
  } catch(e) {
    Logger.log("Lỗi gửi email: " + e.toString());
  }
}

// Xử lý kích hoạt tài khoản
function activateAccount(token) {
  const sheet = getDB().getSheetByName("Dky");
  if (!sheet) {
    return HtmlService.createHtmlOutput("<h2>❌ Lỗi kết nối hệ thống.</h2>");
  }
  
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][COL_TOKEN] === token) {
      // Cập nhật cả 2 cột status
      sheet.getRange(i + 1, COL_STATUS + 1).setValue("Đã kích hoạt");
      sheet.getRange(i + 1, COL_ACTIVATION_STATUS + 1).setValue("Đã kích hoạt");
      
      const name = data[i][COL_NAME];
      const code = data[i][COL_CODE];
      
      return HtmlService.createHtmlOutput(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
            .container { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); text-align: center; max-width: 500px; }
            .icon { font-size: 80px; margin-bottom: 20px; }
            h1 { color: #10B981; margin: 0 0 10px 0; font-size: 2em; }
            p { color: #6B7280; font-size: 1.1em; line-height: 1.6; margin: 15px 0; }
            .code { background: #F3F4F6; padding: 15px; border-radius: 10px; font-size: 1.3em; font-weight: bold; color: #F59E0B; margin: 20px 0; }
            .btn { display: inline-block; background: #F59E0B; color: white; padding: 15px 40px; border-radius: 10px; text-decoration: none; font-weight: bold; margin-top: 20px; transition: all 0.3s; }
            .btn:hover { background: #D97706; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(245, 158, 11, 0.3); }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">✅</div>
            <h1>Kích hoạt thành công!</h1>
            <p>Xin chào <strong>${name}</strong>,</p>
            <p>Tài khoản của bạn đã được kích hoạt thành công!</p>
            <div class="code">Mã học viên: ${code}</div>
            <p>Bạn có thể đăng nhập ngay bây giờ để bắt đầu hành trình học tập.</p>
            <a href="https://yourdomain.vercel.app/login.html" class="btn">Đăng nhập ngay →</a>
          </div>
        </body>
        </html>
      `);
    }
  }
  
  return HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
        .container { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); text-align: center; max-width: 500px; }
        .icon { font-size: 80px; margin-bottom: 20px; }
        h1 { color: #EF4444; margin: 0 0 10px 0; font-size: 2em; }
        p { color: #6B7280; font-size: 1.1em; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">❌</div>
        <h1>Link không hợp lệ</h1>
        <p>Link kích hoạt không đúng hoặc đã hết hạn.</p>
        <p>Vui lòng kiểm tra lại email hoặc liên hệ hỗ trợ.</p>
      </div>
    </body>
    </html>
  `);
}

// Gửi lại mật khẩu (Quên mật khẩu)
function sendPasswordResetEmail(email) {
  const sheet = getDB().getSheetByName("Dky");
  if (!sheet) return { success: false, msg: "Lỗi kết nối hệ thống!" };
  
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][COL_EMAIL]).toLowerCase() === email.toLowerCase()) {
      const name = data[i][COL_NAME];
      const code = data[i][COL_CODE];
      
      // Reset về mật khẩu mặc định
      sheet.getRange(i + 1, COL_PASS + 1).setValue("Brk@3773");
      
      const subject = "🔑 Lấy lại mật khẩu - BRK";
      const body = `
Xin chào ${name},

Bạn vừa yêu cầu lấy lại mật khẩu tài khoản.

📌 THÔNG TIN ĐĂNG NHẬP:
━━━━━━━━━━━━━━━━━━━━━━━━━━
• Mã học viên: ${code}
• Email: ${email}
• Mật khẩu mặc định: Brk@3773

⚠️ VUI LÒNG:
1. Đăng nhập bằng mật khẩu mặc định trên
2. Vào phần "Cài đặt" để đổi mật khẩu mới

━━━━━━━━━━━━━━━━━━━━━━━━━━

Nếu bạn không yêu cầu lấy lại mật khẩu, vui lòng bỏ qua email này.

Trân trọng,
Ban Tổ Chức BRK
      `;
      
      try {
        MailApp.sendEmail({
          to: email,
          subject: subject,
          body: body
        });
        return { success: true, msg: "Đã gửi mật khẩu mặc định vào email của bạn! Vui lòng kiểm tra hộp thư." };
      } catch(e) {
        return { success: false, msg: "Lỗi gửi email: " + e.toString() };
      }
    }
  }
  
  return { success: false, msg: "Không tìm thấy email này trong hệ thống!" };
}

// Lấy thông tin người giới thiệu (cho frontend)
function getReferrerInfo(referralCode) {
  const sheet = getDB().getSheetByName("Dky");
  if (!sheet) return { success: false, msg: "Lỗi kết nối hệ thống!" };
  
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][COL_CODE]) === String(referralCode)) {
      return { 
        success: true, 
        name: data[i][COL_NAME] || "Không xác định",
        code: data[i][COL_CODE]
      };
    }
  }
  
  return { success: false, msg: "Không tìm thấy mã giới thiệu!" };
}

// ------------------------------------------------------------------
// LANDING PAGE APIs
// ------------------------------------------------------------------

// Lấy tất cả khóa học có sẵn (cho landing page - public)
function getAllAvailableCourses() {
  const ss = getDB();
  const courseSheet = ss.getSheetByName("KH");
  
  if (!courseSheet) {
    return { success: false, msg: "Sheet KH không tồn tại!" };
  }
  
  const data = courseSheet.getDataRange().getValues();
  if (data.length < 2) return { success: true, data: [] };
  
  const headers = data[0];
  const availableCourses = [];
  const debugLog = []; // Array to store debug info
  
  debugLog.push("Headers found: " + JSON.stringify(headers));

  // Helper: Find column index by name (case-insensitive, trimmed)
  const findIndex = (name) => {
    return headers.findIndex(h => String(h).trim().toLowerCase() === name.toLowerCase());
  };

  // Map columns based on User's provided structure
  const COL_MA_LOP = findIndex("Ma_Lop");
  const COL_TEN_KHOA_HOC = findIndex("Tên khóa học");
  const COL_TEN_LOP_HOC = findIndex("Tên lớp học"); // New preference
  const COL_CO_SAN = findIndex("Có sẵn");
  const COL_MO_TA = findIndex("Mo_Ta_Ngan");
  const COL_PHI_COC = findIndex("Phí cọc");
  const COL_LINK_ANH = findIndex("Link_Anh_Lop");
  const COL_LINK_ANH_ALT = findIndex("Link_Anh");

  debugLog.push(`Indices: Ma_Lop=${COL_MA_LOP}, TenLop=${COL_TEN_LOP_HOC}, TenKhoa=${COL_TEN_KHOA_HOC}, CoSan=${COL_CO_SAN}`);

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const logPrefix = `Row ${i + 1}: `;
    
    // 1. Check Availability
    let isAvailable = false;
    if (COL_CO_SAN !== -1) {
       const val = row[COL_CO_SAN];
       isAvailable = (val === true || String(val).toUpperCase() === "TRUE" || val === 1);
    } else {
        debugLog.push(logPrefix + "Cot 'Co san' khong tim thay");
    }
    
    // 2. Get ID (Ma_Lop)
    const courseId = (COL_MA_LOP !== -1) ? String(row[COL_MA_LOP] || "").trim() : "";
    
    // Debug logic failure
    if (!isAvailable) debugLog.push(logPrefix + `Skipped (Not Available: ${row[COL_CO_SAN]})`);
    else if (!courseId) debugLog.push(logPrefix + `Skipped (No Ma_Lop)`);
    else debugLog.push(logPrefix + `OK (ID: ${courseId})`);

    if (isAvailable && courseId) {
      // 3. Determine isFree
      let isFree = false;
      if (COL_PHI_COC !== -1) {
        const fee = Number(row[COL_PHI_COC]);
        isFree = (isNaN(fee) || fee <= 0);
      }
      
      // 4. Get Title (Prioritize Tên lớp học > Tên khóa học)
      let title = "";
      if (COL_TEN_LOP_HOC !== -1 && row[COL_TEN_LOP_HOC]) {
        title = String(row[COL_TEN_LOP_HOC]);
      } else if (COL_TEN_KHOA_HOC !== -1) {
        title = String(row[COL_TEN_KHOA_HOC] || "");
      }
      
      // 5. Get Image
      let imageUrl = "";
      if (COL_LINK_ANH !== -1) imageUrl = String(row[COL_LINK_ANH] || "");
      else if (COL_LINK_ANH_ALT !== -1) imageUrl = String(row[COL_LINK_ANH_ALT] || "");

      availableCourses.push({
        id: courseId,
        title: title || "Khóa học",
        desc: (COL_MO_TA !== -1) ? String(row[COL_MO_TA] || "") : "",
        imageUrl: imageUrl,
        icon: "fa-book",
        isFree: isFree,
        isActivated: false,
        percentComplete: 0
      });
    }
  }
  
  // Return debug log in response
  return { success: true, data: availableCourses, debug: debugLog };
}

// Helper: Lấy mã học viên từ email
function getStudentCodeByEmail(email) {
  const sheet = getDB().getSheetByName("Dky");
  if (!sheet) return null;
  
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][COL_EMAIL]).toLowerCase() === email.toLowerCase()) {
      return String(data[i][COL_CODE]);
    }
  }
  return null;
}

// Helper: Lấy danh sách khóa đã kích hoạt từ sheet LS_DangKy
function getActivatedCoursesFromLS(studentCode) {
  try {
    const ss = getDB();
    const lsDangKySheet = ss.getSheetByName("LS_DangKy");
    
    if (!lsDangKySheet) {
      Logger.log("Sheet LS_DangKy không tồn tại - trả về danh sách rỗng");
      return [];
    }
    
    const lsData = lsDangKySheet.getDataRange().getValues();
    
    if (lsData.length < 2) {
      Logger.log("Sheet LS_DangKy rỗng");
      return [];
    }
    
    Logger.log("=== DEBUG: Kiểm tra kích hoạt cho CODE: " + studentCode + " ===");
    Logger.log("LS Headers: " + JSON.stringify(lsData[0]));
    
    // Dynamic column lookup - tìm cột chứa mã học viên
    const lsHeaders = lsData[0];
    const findLSIndex = (name) => {
      return lsHeaders.findIndex(h => String(h).trim().toLowerCase() === name.toLowerCase());
    };
    
    // Tìm cột MÃ CODE (cột 1 trong LS_DangKy)
    let COL_MA_CODE = findLSIndex("MÃ CODE");
    if (COL_MA_CODE === -1) COL_MA_CODE = findLSIndex("Ma_Code");
    if (COL_MA_CODE === -1) COL_MA_CODE = findLSIndex("Code");
    if (COL_MA_CODE === -1) COL_MA_CODE = 1; // Fallback: cột thứ 2 (index 1)
    
    // Tìm cột Ma_Lop (cột 14 trong LS_DangKy)
    const COL_MA_LOP = findLSIndex("Ma_Lop");
    
    // Tìm cột Trạng thái duyệt (cột 10 trong LS_DangKy)
    let COL_TRANG_THAI_DUYET = findLSIndex("Trạng thái duyệt");
    if (COL_TRANG_THAI_DUYET === -1) COL_TRANG_THAI_DUYET = findLSIndex("Trang_Thai");
    if (COL_TRANG_THAI_DUYET === -1) COL_TRANG_THAI_DUYET = 10; // Fallback
    
    Logger.log(`DEBUG Columns: COL_MA_CODE=${COL_MA_CODE}, COL_MA_LOP=${COL_MA_LOP}, COL_TRANG_THAI_DUYET=${COL_TRANG_THAI_DUYET}`);
    
    // Nếu không tìm được cột Ma_Lop, không tiếp tục
    if (COL_MA_LOP === -1) {
      Logger.log("Không tìm cột Ma_Lop");
      return [];
    }
    
    let maLopList = [];
    
    for (let i = 1; i < lsData.length; i++) {
      const maHocVien = String(lsData[i][COL_MA_CODE] || "").trim();
      const maLop = String(lsData[i][COL_MA_LOP] || "").trim();
      const trangThaiDuyet = String(lsData[i][COL_TRANG_THAI_DUYET] || "").trim();
      
      Logger.log(`Row ${i}: Code=${maHocVien}, MaLop=${maLop}, Status=${trangThaiDuyet}`);
      
      if (maHocVien === String(studentCode) && maLop) {
        // Chấp nhận: trạng thái bắt đầu với "Đã duyệt" hoặc là "Approved"
        if (trangThaiDuyet.startsWith("Đã duyệt") || trangThaiDuyet === "Approved") {
          if (!maLopList.includes(maLop)) {
            maLopList.push(maLop);
            Logger.log(`Thêm khóa: ${maLop}`);
          }
        }
      }
    }
    
    Logger.log("Mã lớp đã kích hoạt cho học viên " + studentCode + ": " + JSON.stringify(maLopList));
    return maLopList;
  } catch (error) {
    Logger.log("Lỗi getActivatedCoursesFromLS: " + error.toString());
    return [];
  }
}


// ------------------------------------------------------------------
// COURSE ACTIVATION FEATURE
// ------------------------------------------------------------------

/**
 * Kiểm tra học viên có đang tham gia lộ trình 86 ngày không
 * @param {string} studentCode - Mã học viên
 * @returns {boolean} - true nếu đang tham gia 86 ngày
 */
function checkIfStudent86Days(studentCode) {
  const ss = getDB();
  const lsSheet = ss.getSheetByName("LS_DangKy");
  
  if (!lsSheet) {
    return false;
  }
  
  const data = lsSheet.getDataRange().getValues();
  const headers = data[0];
  
  // Tìm index các cột cần thiết
  const codeIndex = headers.indexOf("Mã học viên");
  const maLopIndex = headers.indexOf("Ma_Lop");
  const statusIndex = headers.indexOf("Trạng thái");
  
  if (codeIndex === -1 || maLopIndex === -1 || statusIndex === -1) {
    Logger.log("Không tìm thấy cột cần thiết trong LS_DangKy");
    return false;
  }
  
  // Duyệt qua các dòng để tìm
  for (let i = 1; i < data.length; i++) {
    const rowCode = String(data[i][codeIndex] || "").trim();
    const maLop = String(data[i][maLopIndex] || "").trim();
    const status = String(data[i][statusIndex] || "").trim();
    
    // Kiểm tra: đúng mã học viên, Ma_Lop = "86D", trạng thái đã duyệt
    if (rowCode === studentCode && 
        maLop === "86D" && 
        (status === "Đã duyệt" || status === "Đã duyệt (Dữ liệu cũ)")) {
      return true;
    }
  }
  
  return false;
}

/**
 * Lấy thông tin cọc của khóa học từ sheet KH
 * @param {string} courseId - Mã khóa học
 * @returns {Object} - Thông tin cọc hoặc null nếu không tìm thấy
 */
/**
 * Láy thông tin cọc của khóa học từ sheet KH
 * @param {string} courseId - Mã khóa học
 * @returns {Object} - Thông tin cọc hoặc null nếu không tìm thấy
 */
function getCourseDepositInfo(courseId) {
  const ss = getDB();
  const khSheet = ss.getSheetByName("KH");
  
  if (!khSheet) {
    return null;
  }
  
  const data = khSheet.getDataRange().getValues();
  if (data.length < 2) return null;

  const headers = data[0];
  
  // Helper: Find column index by name (case-insensitive, trimmed)
  const findIndex = (name) => {
    return headers.findIndex(h => String(h).trim().toLowerCase() === name.toLowerCase());
  };
  
  // Map columns based on Verified User Schema
  const COL_MA_LOP = findIndex("Ma_Lop");
  const COL_TEN_KHOA_HOC = findIndex("Tên khóa học");
  const COL_TEN_LOP_HOC = findIndex("Tên lớp học"); // Prioritized Title
  
  const COL_PHI_COC = findIndex("Phí cọc");
  const COL_STK = findIndex("STK");
  const COL_TEN_CHU_TK = findIndex("Tên chủ TK");
  const COL_NGAN_HANG = findIndex("Ngân hàng");
  const COL_QR_LINK = findIndex("Link QR Code"); // Corrected from 'Link QR'
  const COL_ZALO_LINK = findIndex("Link Zalo");
  const COL_CONTENT_CK = findIndex("Nội dung CK"); // Optional, for dynamic content

  if (COL_MA_LOP === -1) {
    return null; // Cannot verify course ID
  }
  
  // Tìm khóa học theo Ma_Lop
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowMaLop = String(row[COL_MA_LOP] || "").trim();
    
    if (rowMaLop === courseId) {
      // Parse depositFee
      let depositFee = 0;
      if (COL_PHI_COC !== -1) {
        let rawFee = String(row[COL_PHI_COC]);
        // Remove non-numeric characters (keep digits)
        let cleanFee = rawFee.replace(/[^0-9]/g, "");
        depositFee = Number(cleanFee) || 0;
      }
      
      let title = "";
      if (COL_TEN_LOP_HOC !== -1 && row[COL_TEN_LOP_HOC]) {
        title = String(row[COL_TEN_LOP_HOC]);
      } else if (COL_TEN_KHOA_HOC !== -1) {
        title = String(row[COL_TEN_KHOA_HOC] || "");
      }

      return {
        id: courseId,
        title: title || "Khóa học",
        depositFee: depositFee,
        stk: COL_STK !== -1 ? String(row[COL_STK] || "") : "",
        tenChuTK: COL_TEN_CHU_TK !== -1 ? String(row[COL_TEN_CHU_TK] || "") : "",
        nganHang: COL_NGAN_HANG !== -1 ? String(row[COL_NGAN_HANG] || "") : "",
        qrLink: COL_QR_LINK !== -1 ? String(row[COL_QR_LINK] || "") : "",
        zaloLink: COL_ZALO_LINK !== -1 ? String(row[COL_ZALO_LINK] || "") : "",
        paymentContent: COL_CONTENT_CK !== -1 ? String(row[COL_CONTENT_CK] || "") : `Coc ${courseId}`
      };
    }
  }
  
  return null;
}

/**
 * Kích hoạt khóa học cho học viên
 * @param {Object} data - { email, courseId, fileData, fileName, fileType }
 * @returns {Object} - { success, message, zaloLink }
 */
function activateCourse(data) {
  try {
    // 1. Validate input
    if (!data.email || !data.courseId) {
      return { success: false, message: "Thiếu thông tin email hoặc mã khóa học!" };
    }
    
    // 2. Lấy thông tin học viên
    const studentCode = getStudentCodeByEmail(data.email);
    if (!studentCode) {
      return { success: false, message: "Không tìm thấy thông tin học viên!" };
    }
    
    const studentInfo = getStudentInfoFromEmail(data.email);
    if (!studentInfo) {
      return { success: false, message: "Không tìm thấy thông tin học viên!" };
    }
    
    // 3. Lấy thông tin khóa học
    const courseInfo = getCourseDepositInfo(data.courseId);
    if (!courseInfo) {
      return { success: false, message: "Không tìm thấy thông tin khóa học!" };
    }
    
    // 4. Kiểm tra đã kích hoạt chưa
    const activatedCourses = getActivatedCoursesFromLS(studentCode);
    const compositeKey = courseInfo.title + "|" + data.courseId;
    
    if (activatedCourses.includes(compositeKey)) {
      return { success: false, message: "Bạn đã kích hoạt khóa học này rồi!" };
    }
    
    // 5. Kiểm tra miễn cọc (học viên 86 ngày)
    const is86DaysStudent = checkIfStudent86Days(studentCode);
    const isWaived = is86DaysStudent || courseInfo.depositFee === 0;
    
    // 6. Validate file upload (nếu không miễn cọc)
    if (!isWaived && (!data.fileData || !data.fileName)) {
      return { success: false, message: "Vui lòng upload ảnh minh chứng thanh toán!" };
    }
    
    // 7. Upload ảnh lên Drive (nếu có)
    let imageUrl = "";
    if (data.fileData && data.fileName) {
      try {
        imageUrl = uploadFileToDrive(
          data.fileData,
          data.fileName,
          data.fileType || "image/jpeg",
          studentCode,
          studentInfo.name
        );
      } catch (uploadError) {
        Logger.log("Lỗi upload file: " + uploadError);
        return { success: false, message: "Lỗi upload ảnh: " + uploadError.message };
      }
    }
    
    // 8. Ghi vào LS_DangKy
    const ss = getDB();
    const lsSheet = ss.getSheetByName("LS_DangKy");
    
    if (!lsSheet) {
      return { success: false, message: "Sheet LS_DangKy không tồn tại!" };
    }
    
    const newRow = [
      "", // STT - để trống, sẽ tự động
      new Date(), // Ngày đăng ký
      studentInfo.name, // Tên
      studentCode, // Mã học viên
      data.email, // Email
      studentInfo.phone || "", // SĐT
      courseInfo.title, // Tên khóa học
      data.courseId, // Mã khóa
      isWaived ? 0 : courseInfo.depositFee, // Phí cọc
      imageUrl, // Link ảnh minh chứng
      "Chờ duyệt", // Trạng thái
      "", // Người giới thiệu
      isWaived ? "Miễn cọc (Học viên 86 ngày)" : "", // Ghi chú
      "", // Ngày duyệt
      courseInfo.maLop || "" // Ma_Lop
    ];
    
    lsSheet.appendRow(newRow);
    
    // 9. Gửi email xác nhận (optional - có thể bật sau)
    // sendActivationConfirmationEmail(studentInfo, courseInfo);
    
    // 10. Trả về kết quả
    return {
      success: true,
      message: isWaived 
        ? "Kích hoạt thành công! Bạn được miễn cọc." 
        : "Gửi yêu cầu kích hoạt thành công! Vui lòng chờ BTC duyệt.",
      zaloLink: courseInfo.zaloLink || ""
    };
    
  } catch (error) {
    Logger.log("Lỗi activateCourse: " + error);
    return { 
      success: false, 
      message: "Lỗi hệ thống: " + error.message 
    };
  }
}

/**
 * Helper: Upload file lên Drive
 * (Sử dụng lại function có sẵn hoặc tạo mới)
 */
function uploadFileToDrive(base64Data, fileName, fileType, studentCode, studentName) {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const blob = Utilities.newBlob(
    Utilities.base64Decode(base64Data),
    fileType,
    fileName
  );
  
  const file = folder.createFile(blob);
  file.setName(`${studentCode}_${studentName}_${fileName}`);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  return file.getUrl();
}

/**
 * Helper: Lấy thông tin học viên từ Email
 */
function getStudentInfoFromEmail(email) {
  const ss = getDB();
  const sheet = ss.getSheetByName("Dky");
  if (!sheet) return { code: "", name: "" };
  
  // Use getColumnIndex or assume standard layout if Dky has headers
  // Based on registerUser:
  // Col B (Index 1) => Code
  // Col C (Index 2) => Name
  // Col G (Index 6) => Email
  // Let's safe read headers just in case
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idxEmail = headers.indexOf("Email"); // Or usage of constants if available globally
  const idxCode = headers.indexOf("Ma_Code") > -1 ? headers.indexOf("Ma_Code") : 1; // Fallback to 1 (Col B)
  const idxName = headers.indexOf("Ten_HV") > -1 ? headers.indexOf("Ten_HV") : 2;   // Fallback to 2 (Col C)
  
  if (idxEmail === -1) return { code: "", name: "" };
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idxEmail]).toLowerCase() === String(email).toLowerCase()) {
      return { 
        code: data[i][idxCode], 
        name: data[i][idxName] 
      };
    }
  }
  return { code: "", name: "" };
}

/**
 * Cập nhật tiến độ xem video
 */
function updateVideoProgress(studentCode, courseId, lessonId, currentTime, duration) {
  const ss = getDB();
  const sheet = ss.getSheetByName("KH_TienDo");
  if (!sheet) return { success: false, msg: "Sheet KH_TienDo không tồn tại" };
  
  // Get Dynamic Column Indexes
  const idxStudentCode = getColumnIndex(sheet, COL_NAME_MA_CODE);
  const idxCourse = getColumnIndex(sheet, COL_NAME_MA_KH);
  const idxLesson = getColumnIndex(sheet, COL_NAME_MA_BAI);
  
  if (idxStudentCode === -1 || idxCourse === -1 || idxLesson === -1) {
    return { success: false, msg: "Cấu trúc Sheet không đúng (thiếu cột định danh)" };
  }

  const idxCurTime = getColumnIndex(sheet, COL_NAME_HIEN_TAI);
  const idxMaxTime = getColumnIndex(sheet, COL_NAME_XA_NHAT);
  const idxStatus = getColumnIndex(sheet, COL_NAME_TRANG_THAI);
  const idxVideoScore = getColumnIndex(sheet, COL_NAME_DIEM_VIDEO);
  const idxTimestamp = getColumnIndex(sheet, COL_NAME_GHI_NHAN);
  
  // New Columns for Student Info
  const idxEmail = getColumnIndex(sheet, COL_NAME_EMAIL);
  const idxStudentName = getColumnIndex(sheet, COL_NAME_TEN_HV);
  
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  const now = new Date();
  const timestampStr = now.toLocaleString("vi-VN", {timeZone: "Asia/Ho_Chi_Minh"});

  // Tìm dòng tương ứng: StudentCode + CourseId + LessonId
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idxStudentCode]) === String(studentCode) && 
        String(data[i][idxCourse]) === courseId && 
        String(data[i][idxLesson]) === lessonId) {
      rowIndex = i;
      break;
    }
  }
  
  const progressRatio = duration > 0 ? (currentTime / duration) : 0;
  let newStatus = "In Progress";
  
  // Calculate Video Score
  let currentMax = 0;
  if (rowIndex !== -1 && idxMaxTime !== -1) {
      currentMax = Number(data[rowIndex][idxMaxTime]) || 0;
  }
  
  let maxTime = Math.max(currentMax, currentTime);
  
  let videoScore = 0;
  if (duration > 0) {
    const watchedPercent = (maxTime / duration) * 100;
    if (watchedPercent >= 95 || (duration - maxTime < 10)) videoScore = 2; // Xem hết 100% (+2)
    else if (watchedPercent >= 50) videoScore = 1; // Xem trên 50% (+1)
    else videoScore = 0;
  }
  
  if (rowIndex === -1) {
    // Thêm mới row
    // We have studentCode, email can be optional
    
    // Create array with empty strings for all columns
    const lastCol = sheet.getLastColumn();
    const newRow = new Array(lastCol).fill("");
    
    // Map values to correct indices using our handy indexes
    if (idxTimestamp !== -1) newRow[idxTimestamp] = timestampStr;
    if (idxStudentCode !== -1) newRow[idxStudentCode] = studentCode;
    if (idxCourse !== -1) newRow[idxCourse] = courseId;
    if (idxLesson !== -1) newRow[idxLesson] = lessonId;
    
    if (idxCurTime !== -1) newRow[idxCurTime] = currentTime;
    if (idxMaxTime !== -1) newRow[idxMaxTime] = maxTime;
    
    // For new row, other scores are 0, so Total = Video Score
    // Status is likely "In Progress" (max 2 pts < 5)
    if (idxStatus !== -1) newRow[idxStatus] = "In Progress";
    if (idxVideoScore !== -1) newRow[idxVideoScore] = videoScore;
    if (getColumnIndex(sheet, COL_NAME_TONG_DIEM) !== -1) newRow[getColumnIndex(sheet, COL_NAME_TONG_DIEM)] = videoScore;
    
    sheet.appendRow(newRow);
  } else {
    // Cập nhật existing row
    const rowNum = rowIndex + 1;
    
    // Update Record Time
    if (idxTimestamp !== -1) sheet.getRange(rowNum, idxTimestamp + 1).setValue(timestampStr);
    
    if (idxCurTime !== -1) sheet.getRange(rowNum, idxCurTime + 1).setValue(currentTime);
    if (idxMaxTime !== -1 && maxTime > currentMax) {
        sheet.getRange(rowNum, idxMaxTime + 1).setValue(maxTime);
    }
    
    // Update Video Score
    if (idxVideoScore !== -1) sheet.getRange(rowNum, idxVideoScore + 1).setValue(videoScore);
    
    // --- RECALCULATE TOTAL SCORE & STATUS ---
    // Read other scores
    const getNum = (name) => {
        const idx = getColumnIndex(sheet, name);
        if (idx === -1) return 0;
        return Number(data[rowIndex][idx]) || 0;
    };
    
    const diemBHTDN = getNum(COL_NAME_DIEM_BHTDN);
    const diemLink = getNum(COL_NAME_DIEM_LINK);
    const hoTro1 = getNum(COL_NAME_HO_TRO_1); // Should be 0 or 1
    const hoTro2 = getNum(COL_NAME_HO_TRO_2); // Should be 0 or 1
    const diemDungHan = getNum(COL_NAME_DIEM_DUNG_HAN);
    
    let tongDiem = videoScore + diemBHTDN + diemLink + hoTro1 + hoTro2 + diemDungHan;
    if (tongDiem > 10) tongDiem = 10;
    
    // Update Total Score
    const idxTotal = getColumnIndex(sheet, COL_NAME_TONG_DIEM);
    if (idxTotal !== -1) sheet.getRange(rowNum, idxTotal + 1).setValue(tongDiem);
    
    // Update Classification (Xep_Loai)
    let xepLoai = "Chưa hoàn thành";
    if (tongDiem >= 10) xepLoai = "Xuất sắc";
    else if (tongDiem >= 8) xepLoai = "Hoàn thành Tốt";
    else if (tongDiem >= 6) xepLoai = "Hoàn thành Khá";
    else if (tongDiem >= 5) xepLoai = "Hoàn thành";
    
    const idxXepLoai = getColumnIndex(sheet, COL_NAME_XEP_LOAI);
    if (idxXepLoai !== -1) sheet.getRange(rowNum, idxXepLoai + 1).setValue(xepLoai);
    
    // Update Status
    // Rule: Total >= 5 => Completed.
    const newComputedStatus = (tongDiem >= 5) ? "Completed" : "In Progress";
    
    // Only update status if it changes or if we are upgrading (In Progress -> Completed)
    // Avoid downgrading Completed -> In Progress (though unlikely if scores only go up)
    if (idxStatus !== -1) {
        const currentStatus = data[rowIndex][idxStatus];
        if (currentStatus !== "Completed" && currentStatus !== "Approved") {
             sheet.getRange(rowNum, idxStatus + 1).setValue(newComputedStatus);
        }
    }
  }
  
  return { success: true };
}

/**
 * Nộp bài tập
 */
// Xử lý nộp bài tập (Assignment Submission) - Daily Discipline Grading
function submitAssignment(studentCode, courseId, lessonId, reflection, link1, link2, link3, disciplineSupport1, disciplineSupport2, videoMaxTime, duration) {
  const ss = getDB();
  const sheet = ss.getSheetByName("KH_TienDo");
  
  if (!sheet) return { success: false, message: "Lỗi hệ thống: Không tìm thấy Sheet tiến độ." };
  
  // Get Dynamic Indexes
  const idxStudentCode = getColumnIndex(sheet, COL_NAME_MA_CODE);
  const idxCourse = getColumnIndex(sheet, COL_NAME_MA_KH);
  const idxLesson = getColumnIndex(sheet, COL_NAME_MA_BAI);

  if (idxStudentCode === -1 || idxCourse === -1 || idxLesson === -1) {
      return { success: false, message: "Cấu trúc Sheet không đúng (thiếu các cột định danh)." };
  }
  
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  
  // Find row
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idxStudentCode]) === String(studentCode) && 
        String(data[i][idxCourse]) === courseId && 
        String(data[i][idxLesson]) === lessonId) {
      rowIndex = i;
      break;
    }
  }
  
  if (rowIndex === -1) {
    return { success: false, message: "Bạn chưa bắt đầu học bài này (chưa có dữ liệu xem video)." };
  }
  
  const rowNum = rowIndex + 1;
  const idxVideoScore = getColumnIndex(sheet, COL_NAME_DIEM_VIDEO);
  const idxMaxTime = getColumnIndex(sheet, COL_NAME_XA_NHAT);
  
  // --- GRADING LOGIC (10 Point Scale - User Requested Formula) ---
  
  // 1. Diem_Video (Max 2)
  let diemVideo = 0;
  // Initialize with existing score if no new play data
  if (idxVideoScore !== -1) diemVideo = Number(data[rowIndex][idxVideoScore]) || 0;
  
  if (duration > 0) {
    const watchedPercent = (videoMaxTime / duration) * 100;
    if (watchedPercent >= 95 || (duration - videoMaxTime < 10)) diemVideo = 2; // Xem hết 100% (+2) Note: >95% is effectively 100%
    else if (watchedPercent >= 50) diemVideo = 1; // Xem trên 50% (+1)
    else diemVideo = 0;
    
    // Save new video score immediately
    if (idxMaxTime !== -1) sheet.getRange(rowNum, idxMaxTime + 1).setValue(videoMaxTime);
    if (idxVideoScore !== -1) sheet.getRange(rowNum, idxVideoScore + 1).setValue(diemVideo);
  }
  
  // 2. Diem_BHTDN (Max 2)
  let diemBHTDN = 0;
  const refLen = reflection ? String(reflection).trim().length : 0;
  if (refLen >= 50) diemBHTDN = 2; // Trên 50 ký tự (+2)
  else if (refLen > 10) diemBHTDN = 1; // Trên 10 ký tự (+1)
  
  // 3. Diem_Link (Max 3)
  let diemLink = 0;
  if (link1 && String(link1).trim().length > 5) diemLink++; // Link 1 (+1)
  if (link2 && String(link2).trim().length > 5) diemLink++; // Link 2 (+1)
  if (link3 && String(link3).trim().length > 5) diemLink++; // Link 3 (+1)
  
  // 4. Ho_Tro_1 & Ho_Tro_2 (Max 2)
  let hoTro1 = disciplineSupport1 ? 1 : 0; // Tích hỗ trợ tuyến 1 (+1)
  let hoTro2 = disciplineSupport2 ? 1 : 0; // Tích hỗ trợ tuyến 2 (+1)
  
  // 5. Diem_Dung_Han (+1 or -1)
  let diemDungHan = 1; // Mặc định +1 (Nộp đúng hạn)
  // Logic: Nếu có deadline, kiểm tra tại đây. Hiện tại luôn +1.
  
  // 6. Calculate Tong_Diem
  // Formula: Tong_Diem = Diem_Video + Diem_BHTDN + Diem_Link + Ho_Tro1 + Ho_Tro2 + DIem_DungHan
  let tongDiem = diemVideo + diemBHTDN + diemLink + hoTro1 + hoTro2 + diemDungHan;
  
  // Cap at 10
  if (tongDiem > 10) tongDiem = 10; 
  if (tongDiem < 0) tongDiem = 0;
  
  // 7. Classification
  let xepLoai = "Chưa hoàn thành";
  if (tongDiem >= 10) xepLoai = "Xuất sắc"; // 10
  else if (tongDiem >= 8) xepLoai = "Hoàn thành Tốt"; // 8-9
  else if (tongDiem >= 6) xepLoai = "Hoàn thành Khá"; // 6-7
  else if (tongDiem >= 5) xepLoai = "Hoàn thành"; // 5
  
  const status = (tongDiem >= 5) ? "Completed" : "Pending";
  const timestamp = new Date().toLocaleString("vi-VN", {timeZone: "Asia/Ho_Chi_Minh"});
  
  // --- UPDATE SHEET with Dynamic Columns ---
  const setValue = (colName, val) => {
      const idx = getColumnIndex(sheet, colName);
      if (idx !== -1) sheet.getRange(rowNum, idx + 1).setValue(val);
  };
  
  // Ensure Student Info is present
  // Since we have studentCode, we can set it directly. Name can come from data if needed
  const idxEmail = getColumnIndex(sheet, COL_NAME_EMAIL);
  if (idxStudentCode !== -1 && !data[rowIndex][idxStudentCode]) {
    setValue(COL_NAME_MA_CODE, studentCode);
  }
  
  setValue(COL_NAME_TRANG_THAI, status);
  setValue(COL_NAME_GHI_NHAN, timestamp);
  
  setValue(COL_NAME_LINK_1, link1 || "");
  setValue(COL_NAME_LINK_2, link2 || "");
  setValue(COL_NAME_LINK_3, link3 || "");
  
  setValue(COL_NAME_BHTDN, reflection || "");
  
  // Scores
  setValue(COL_NAME_DIEM_VIDEO, diemVideo);
  setValue(COL_NAME_DIEM_BHTDN, diemBHTDN);
  setValue(COL_NAME_DIEM_LINK, diemLink);
  setValue(COL_NAME_DIEM_DUNG_HAN, diemDungHan);
  
  setValue(COL_NAME_TONG_DIEM, tongDiem);
  setValue(COL_NAME_XEP_LOAI, xepLoai);
  
  // Save Discipline Checkboxes
  setValue(COL_NAME_HO_TRO_1, hoTro1);
  setValue(COL_NAME_HO_TRO_2, hoTro2);
  
  SpreadsheetApp.flush(); 

  return { 
    success: true, 
    message: `Đã nộp bài! Điểm: ${tongDiem}/10 (${xepLoai}).`,
    score: tongDiem,
    grade: xepLoai,
    details: {
      video: diemVideo,
      reflection: diemBHTDN,
      practice: diemLink,
      discipline: hoTro1 + hoTro2 + diemDungHan,
      total: tongDiem
    }
  };
}

// ------------------------------------------------------------------
// AI CHATBOT - GOOGLE GEMINI INTEGRATION
// ------------------------------------------------------------------

// ⚠️ QUAN TRỌNG: Cần cấu hình API key
// 1. Lấy API key từ: https://aistudio.google.com/app/apikeys
// 2. Mở Apps Script Project Settings
// 3. Thêm Script Property: GEMINI_API_KEY = "your-api-key-here"

function chatWithAI(message, conversationHistory = [], studentCode = "") {
  try {
    const GEMINI_API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === "") {
      Logger.log("⚠️ GEMINI_API_KEY is missing or empty!");
      return { 
        success: false, 
        message: "⚠️ Chưa cấu hình API Key. Liên hệ admin để khắc phục!" 
      };
    }
    
    Logger.log("✅ GEMINI_API_KEY exists: " + GEMINI_API_KEY.substring(0, 10) + "...");


    if (!message || message.trim() === "") {
      return { 
        success: false, 
        message: "Vui lòng nhập tin nhắn!" 
      };
    }

    // Lấy nội dung khóa học để làm context - USING RAG!
    let courseContexts = "";
    
    try {
      const relevantChunks = findRelevantChunks(message, studentCode, 5); // Back to 5 chunks for quality
      
      if (relevantChunks && relevantChunks.length > 0) {
        courseContexts = "📚 NỘI DUNG LIÊN QUAN:\n\n";
        relevantChunks.forEach((chunk, idx) => {
          // Limit chunk text to 1000 chars for better context
          const chunkPreview = chunk.text.substring(0, 1000);
          courseContexts += `${idx + 1}. [Khóa ${chunk.courseId}]\n${chunkPreview}\n\n`;
        });
        Logger.log(`✅ RAG provided ${relevantChunks.length} chunks`);
      } else {
        Logger.log("⚠️ RAG returned 0 chunks, using fallback");
        courseContexts = getAllActivatedCoursesContent(studentCode);
      }
    } catch (ragError) {
      Logger.log("⚠️ RAG error, falling back to old method:", ragError);
      courseContexts = getAllActivatedCoursesContent(studentCode);
    }
    
    // Prepare conversation history for Gemini (tối đa 10 tin nhắn gần nhất)
    const recentHistory = conversationHistory.slice(-20).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Add system prompt với course context
    const systemPrompt = `Bạn là assistant hỗ trợ học viên Học viện BRK.

🎯 NHIỆM VỤ:
- CHỈ trả lời dựa trên nội dung được cung cấp
- Trả lời ĐẦY ĐỦ, CHI TIẾT
- BẮT BUỘC format theo quy tắc dưới đây

📝 QUY TẮC FORMAT (BẮT BUỘC):
1. Mở đầu: 1 câu ngắn gọn
2. Nội dung chính: PHẢI có cấu trúc:

**Ví dụ format chuẩn:**
Tiêu chí chọn sản phẩm "Win" gồm:

**1. Đang bán chạy:**
- Chọn sản phẩm có >10,000 lượt bán
- Đảm bảo xu hướng đang hot

**2. Đánh giá tốt:**
- Shop có rating ≥4.5 sao
- Tránh shop có nhiều review xấu

**3. Hoa hồng:**
- Từ 10-15%

**4. Giá sản phẩm:**
- Ưu tiên <150-200k VNĐ

3. Kết: 1 câu động viên (nếu phù hợp)

⚠️ LƯU Ý:
- BẮT BUỘC xuống dòng sau mỗi mục
- BẮT BUỘC in đậm tiêu đề (**text**)
- BẮT BUỘC để trống 1 dòng giữa các mục

📚 NỘI DUNG CÁC KHÓA HỌC:
${courseContexts}

🔒 Hạn chế: Bạn KHÔNG được trả lời về các chủ đề khác ngoài các khóa học được ghi nhớ ở trên.`;

    const payload = {
      contents: [
        ...recentHistory,
        {
          role: 'user',
          parts: [
            { text: systemPrompt + "\n\nNgười dùng: " + message }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048  // Increased from 500 to allow full responses
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    };

    // Call Gemini API - Using gemini-flash-latest (stable, fast)
    const response = UrlFetchApp.fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      }
    );

    const result = JSON.parse(response.getContentText());

    // Check for errors
    if (response.getResponseCode() !== 200) {
      const errorCode = response.getResponseCode();
      const errorBody = response.getContentText();
      
      Logger.log(`❌ Gemini API Error ${errorCode}`);
      Logger.log(`Error body: ${errorBody}`);
      Logger.log(`Request tokens estimate: ${JSON.stringify(payload).length} chars`);
      
      return { 
        success: false, 
        message: `Có lỗi khi xử lý câu hỏi. Vui lòng thử lại! (Code: ${errorCode})`,
        debug: {
          errorCode: errorCode,
          errorPreview: errorBody.substring(0, 200)
        }
      };
    }

    // Extract response
    const candidate = result.candidates?.[0];
    const finishReason = candidate?.finishReason;
    const aiMessage = candidate?.content?.parts?.[0]?.text || "Xin lỗi, tôi không thể xử lý câu hỏi này.";
    
    // Debug logging
    Logger.log("✅ Gemini API Response received");
    Logger.log("📊 Finish Reason: " + finishReason);
    Logger.log("📏 Message length: " + aiMessage.length + " characters");
    Logger.log("📝 Full message: " + aiMessage);
    
    // Check if response was cut due to token limit
    if (finishReason === "MAX_TOKENS") {
      Logger.log("⚠️ WARNING: Response truncated due to MAX_TOKENS limit!");
    }

    return {
      success: true,
      message: aiMessage,
      timestamp: new Date(),
      // Debug info
      debug: {
        finishReason: finishReason,
        messageLength: aiMessage.length,
        maxTokensConfig: 2048
      }
    };

  } catch (error) {
    Logger.log("ChatBot Error:", error.toString());
    return {
      success: false,
      message: "Lỗi: " + error.toString()
    };
  }
}

// Lấy nội dung của tất cả khóa học đã kích hoạt của học viên
function getAllActivatedCoursesContent(studentCode) {
  try {
    if (!studentCode) return "❌ Không có mã học viên. Vui lòng đăng nhập!";
    
    const ss = getDB();
    const contentSheet = ss.getSheetByName("AI_Content"); // Changed from KH_NoiDung
    const youtubeSheet = ss.getSheetByName("YT_Videos");
    
    if (!contentSheet) return "⚠️ Không tìm thấy sheet nội dung khóa học";
    
    // Lấy danh sách khóa học đã kích hoạt của học viên
    const activatedCourses = getActivatedCoursesFromLS(studentCode);
    
    if (!activatedCourses || activatedCourses.length === 0) {
      return "📚 Bạn chưa kích hoạt khóa học nào.";
    }
    
    const contentData = contentSheet.getDataRange().getValues();
    const youtubeData = youtubeSheet ? youtubeSheet.getDataRange().getValues() : [];
    
    let courseContexts = [];
    
    // Lấy nội dung của từng khóa học đã kích hoạt
    activatedCourses.forEach(courseId => {
      let courseTitle = "";
      let lessonsContent = [];
      let videoContent = [];
      
      // Lấy nội dung bài học từ AI_Content sheet
      // AI_Content columns: ID(0), Type(1), Course ID(2), Lesson ID(3), Title(4), Content(5), Source(6), Added Date(7), Added By(8), Last Updated(9)
      for (let i = 1; i < contentData.length; i++) {
        if (String(contentData[i][2]) === String(courseId)) { // Column C = Course ID (index 2)
          if (!courseTitle) {
            courseTitle = getCourseTitle(courseId) || `Khóa học ${courseId}`;
          }
          
          const lessonTitle = String(contentData[i][4] || ""); // Column E = Title (index 4)
          const lessonContent = String(contentData[i][5] || ""); // Column F = Content (index 5)
          
          if (lessonContent) {
            // Use content with title if available
            // Increased limit to 8000 chars to capture full ebook content
            const contentPreview = lessonContent.substring(0, 8000);
            lessonsContent.push(`- Bài: ${lessonTitle || 'Nội dung khóa học'}\n  📝 ${contentPreview}${lessonContent.length > 8000 ? '...' : ''}`);
          }
        }
      }
      
      // Lấy nội dung video YouTube từ YT_Videos sheet
      if (youtubeData.length > 1) {
        for (let i = 1; i < youtubeData.length; i++) {
          if (String(youtubeData[i][2]) === String(courseId)) { // Column C = Course ID
            const lessonId = youtubeData[i][3];
            const transcript = youtubeData[i][5] || youtubeData[i][6] || ""; // Transcript or Description
            const youtubeUrl = youtubeData[i][1];
            
            if (transcript) {
              videoContent.push(`- Video (${lessonId}): ${youtubeUrl}\n  📹 ${transcript.substring(0, 300)}${transcript.length > 300 ? '...' : ''}`);
            }
          }
        }
      }
      
      // Kết hợp nội dung
      let courseSectionContent = `\n📖 Khóa học: ${courseTitle}`;
      
      if (lessonsContent.length > 0) {
        courseSectionContent += `\n📚 Bài học:\n${lessonsContent.join("\n")}`;
      }
      
      if (videoContent.length > 0) {
        courseSectionContent += `\n🎥 Video YouTube:\n${videoContent.join("\n")}`;
      }
      
      if (lessonsContent.length > 0 || videoContent.length > 0) {
        courseContexts.push(courseSectionContent);
      }
    });
    
    return courseContexts.length > 0 
      ? courseContexts.join("\n") 
      : "📚 Không tìm thấy nội dung khóa học.";
    
  } catch (error) {
    Logger.log("Error in getAllActivatedCoursesContent:", error);
    return "⚠️ Lỗi khi tải nội dung khóa học.";
  }
}

// Lấy danh sách khóa học đã kích hoạt của học viên
function getStudentActivatedCourses(studentCode) {
  try {
    // studentCode already provided - no need to look it up
    if (!studentCode) {
      Logger.log("❌ No studentCode provided");
      return [];
    }
    
    const ss = getDB();
    
    // Find activated courses in LS_DangKy using MÃ CODE
    // LS_DangKy columns: MÃ CODE (B/1), Ma_Lop (O/14)
    
    const lsDangKySheet = ss.getSheetByName("LS_DangKy");
    if (!lsDangKySheet) {
      Logger.log("⚠️ Sheet LS_DangKy not found");
      return [];
    }
    
    const lsData = lsDangKySheet.getDataRange().getValues();
    const activatedCourses = [];
    
    for (let i = 1; i < lsData.length; i++) {
      const rowMaCode = String(lsData[i][1] || "").trim();   // Column B: MÃ CODE
      const maLop = String(lsData[i][14] || "").trim();       // Column O: Ma_Lop
      
      if (rowMaCode === String(studentCode) && maLop) {
        if (!activatedCourses.includes(maLop)) {
          activatedCourses.push(maLop);
        }
      }
    }
    
    Logger.log(`✅ Found ${activatedCourses.length} activated courses for MÃ CODE ${studentCode}: ${activatedCourses.join(', ')}`);
    return activatedCourses;
    
  } catch (error) {
    Logger.log("❌ Error in getStudentActivatedCourses:", error);
    return [];
  }
}

// Lấy tên khóa học từ ID
function getCourseTitle(courseId) {
  try {
    const ss = getDB();
    const sheet = ss.getSheetByName("KH");
    
    if (!sheet) return null;
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(courseId)) {
        return String(data[i][1] || `Khóa học ${courseId}`);
      }
    }
    
    return null;
  } catch (error) {
    Logger.log("Error in getCourseTitle:", error);
    return null;
  }
}

// ------------------------------------------------------------------
// YOUTUBE VIDEO MANAGEMENT FOR BRK AI
// ------------------------------------------------------------------

// Lấy hoặc tạo sheet YouTube Videos
function getOrCreateYoutubeSheet() {
  const ss = getDB();
  let sheet = ss.getSheetByName("YT_Videos");
  
  if (!sheet) {
    sheet = ss.insertSheet("YT_Videos");
    sheet.appendRow([
      "Video ID",
      "YouTube URL",
      "Course ID",
      "Lesson ID",
      "Lesson Title",
      "Transcript",
      "Description",
      "Added Date",
      "Added By",
      "Last Updated"
    ]);
  }
  
  return sheet;
}

// Thêm video YouTube vào khóa học
function addVideoToCourse(data) {
  try {
    if (!data.videoId || !data.courseId || !data.lessonId) {
      return { success: false, message: "Thiếu thông tin bắt buộc" };
    }
    
    const sheet = getOrCreateYoutubeSheet();
    
    // Kiểm tra video đã tồn tại chưa
    const allData = sheet.getDataRange().getValues();
    for (let i = 1; i < allData.length; i++) {
      if (String(allData[i][0]) === String(data.videoId)) {
        return { success: false, message: "Video này đã được thêm rồi" };
      }
    }
    
    // Thêm video mới
    sheet.appendRow([
      data.videoId,
      data.youtubeUrl || `https://www.youtube.com/watch?v=${data.videoId}`,
      data.courseId,
      data.lessonId,
      data.lessonTitle || data.lessonId,
      data.transcript || "",
      data.description || "",
      new Date(),
      "Admin",
      new Date()
    ]);
    
    return {
      success: true,
      message: "Thêm video thành công!",
      videoId: data.videoId
    };
    
  } catch (error) {
    Logger.log("Error in addVideoToCourse:", error);
    return { success: false, message: "Lỗi: " + error.toString() };
  }
}

// Lấy tất cả video YouTube
function getYoutubeVideos() {
  try {
    const sheet = getOrCreateYoutubeSheet();
    const allData = sheet.getDataRange().getValues();
    
    const videos = [];
    for (let i = 1; i < allData.length; i++) {
      videos.push({
        videoId: allData[i][0],
        youtubeUrl: allData[i][1],
        courseId: allData[i][2],
        lessonId: allData[i][3],
        lessonTitle: allData[i][4],
        transcript: allData[i][5],
        description: allData[i][6],
        addedDate: allData[i][7],
        addedBy: allData[i][8],
        lastUpdated: allData[i][9]
      });
    }
    
    return { success: true, data: videos };
    
  } catch (error) {
    Logger.log("Error in getYoutubeVideos:", error);
    return { success: false, data: [], message: "Lỗi: " + error.toString() };
  }
}

// Xóa video YouTube
function deleteVideo(videoId) {
  try {
    const sheet = getOrCreateYoutubeSheet();
    const allData = sheet.getDataRange().getValues();
    
    for (let i = 1; i < allData.length; i++) {
      if (String(allData[i][0]) === String(videoId)) {
        sheet.deleteRow(i + 1);
        return { success: true, message: "Xóa video thành công!" };
      }
    }
    
    return { success: false, message: "Video không tìm thấy" };
    
  } catch (error) {
    Logger.log("Error in deleteVideo:", error);
    return { success: false, message: "Lỗi: " + error.toString() };
  }
}

// Thêm nhiều video cùng lúc (Bulk Import)
function bulkAddVideos(videos) {
  try {
    if (!videos || videos.length === 0) {
      return { success: false, message: "Không có video nào để import" };
    }
    
    const sheet = getOrCreateYoutubeSheet();
    let addedCount = 0;
    let errors = [];
    
    videos.forEach((video, index) => {
      try {
        if (!video.videoId && video.youtubeUrl) {
          const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
          const match = video.youtubeUrl.match(regex);
          video.videoId = match ? match[1] : `VIDEO_${index}`;
        }
        
        if (!video.videoId || !video.courseId || !video.lessonId) {
          errors.push(`Row ${index + 1}: Thiếu thông tin bắt buộc`);
          return;
        }
        
        // Kiểm tra trùng
        const allData = sheet.getDataRange().getValues();
        for (let i = 1; i < allData.length; i++) {
          if (String(allData[i][0]) === String(video.videoId)) {
            errors.push(`Row ${index + 1}: Video đã tồn tại`);
            return;
          }
        }
        
        // Thêm video
        sheet.appendRow([
          video.videoId,
          video.youtubeUrl || `https://www.youtube.com/watch?v=${video.videoId}`,
          video.courseId,
          video.lessonId,
          video.lessonTitle || video.lessonId,
          video.transcript || "",
          video.description || "",
          new Date(),
          "Bulk Import",
          new Date()
        ]);
        
        addedCount++;
        
      } catch (e) {
        errors.push(`Row ${index + 1}: ${e.toString()}`);
      }
    });
    
    let message = `Import thành công ${addedCount}/${videos.length} video`;
    if (errors.length > 0) {
      message += `. Lỗi: ${errors.join('; ')}`;
    }
    
    return {
      success: addedCount > 0,
      count: addedCount,
      message: message,
      errors: errors
    };
    
  } catch (error) {
    Logger.log("Error in bulkAddVideos:", error);
    return { success: false, message: "Lỗi: " + error.toString() };
  }
}

// Lấy nội dung video từ transcript (dùng cho BRK AI)
function getVideoTranscriptForAI(courseId) {
  try {
    const sheet = getOrCreateYoutubeSheet();
    const allData = sheet.getDataRange().getValues();
    
    let videoContent = [];
    
    for (let i = 1; i < allData.length; i++) {
      if (String(allData[i][2]) === String(courseId)) {
        const lessonId = allData[i][3];
        const transcript = allData[i][5] || allData[i][6] || "";
        
        if (transcript) {
          videoContent.push({
            lessonId: lessonId,
            transcript: transcript
          });
        }
      }
    }
    
    return videoContent;
    
  } catch (error) {
    Logger.log("Error in getVideoTranscriptForAI:", error);
    return [];
  }
}

// ------------------------------------------------------------------
// ADMIN DATA IMPORT MODULE
// ------------------------------------------------------------------

// Sheet quản lý tất cả nội dung (Text, File, Video)
function getOrCreateContentSheet() {
  const ss = getDB();
  let sheet = ss.getSheetByName("AI_Content");
  
  if (!sheet) {
    sheet = ss.insertSheet("AI_Content");
    sheet.appendRow([
      "ID",
      "Type",
      "Course ID",
      "Lesson ID",
      "Title",
      "Content",
      "Source",
      "Added Date",
      "Added By"
    ]);
  }
  
  return sheet;
}

// Function to add text content from Admin Data Import module
function addTextContent(data) {
  try {
    if (!data.courseId || !data.content) {
      return { success: false, message: "Thiếu thông tin bắt buộc: courseId và content" };
    }
    
    const ss = getDB();
    let sheet = ss.getSheetByName("AI_Content");
    
    // Create sheet if missing
    if (!sheet) {
      sheet = ss.insertSheet("AI_Content");
      sheet.appendRow(["ID", "Type", "Course ID", "Lesson ID", "Title", "Content", "Source", "Added Date", "Added By", "Last Updated"]);
    }
    
    const contentId = `CONTENT_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    // 1. Lưu nội dung gốc
    sheet.appendRow([
      contentId, "text_content", data.courseId, 
      data.lessonId || `BAI_${Date.now()}`, 
      data.title || `Bài học ${data.courseId}`, 
      data.content, 
      data.source || "Admin Data Import", 
      new Date(), "Admin", new Date()
    ]);
    
    Logger.log(`✅ Added text content: ${contentId}`);
    
    // 2. KÍCH HOẠT AI HỌC NGAY LẬP TỨC (QUAN TRỌNG)
    // Đoạn này giúp nội dung vừa nạp vào sẽ được AI dùng để trả lời ngay
    const processResult = processContentToChunksV2(data.courseId, data.lessonId || contentId, data.content, data.title);
    
    return {
      success: true,
      message: "Đã lưu và AI đã học xong nội dung này!",
      contentId: contentId,
      aiStats: processResult
    };
    
  } catch (error) {
    Logger.log("❌ Error in addTextContent:", error);
    return { success: false, message: "Lỗi: " + error.toString() };
  }
}

// Thêm nội dung từ file upload
function addFileContent(data) {
  try {
    const sheet = getOrCreateContentSheet();
    const id = `FILE_${Date.now()}`;
    
    // Parse file content (detect format)
    let content = data.content;
    let count = 1;
    
    // Nếu là CSV, thêm từng dòng
    if (data.fileName.endsWith('.csv')) {
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (index > 0 && line.trim()) {
          const cols = line.split(',');
          sheet.appendRow([
            `FILE_${Date.now()}_${index}`,
            "file",
            (cols[0] || "GENERAL").trim(),
            (cols[1] || "").trim(),
            (cols[2] || data.fileName).trim(),
            (cols[3] || line).substring(0, 500),
            "upload_csv",
            new Date(),
            "Admin"
          ]);
          count++;
        }
      });
    } else {
      // Plain text/markdown
      sheet.appendRow([
        id,
        "file",
        "GENERAL",
        "",
        data.fileName,
        content.substring(0, 10000),
        "upload_text",
        new Date(),
        "Admin"
      ]);
    }
    
    return {
      success: true,
      message: "Thêm nội dung file thành công",
      count: count,
      id: id
    };
  } catch (error) {
    Logger.log("Error in addFileContent:", error);
    return { success: false, message: "Lỗi: " + error.toString() };
  }
}

// Extract metadata từ YouTube URLs (Bulk)
function extractYoutubeBulk(urls, courseId) {
  try {
    const videos = [];
    
    urls.forEach(url => {
      const videoId = extractVideoId(url);
      if (videoId) {
        videos.push({
          videoId: videoId,
          youtubeUrl: url,
          courseId: courseId,
          // Metadata sẽ được lấy sau khi save
          title: `Video ${videoId}`,
          channel: "Unknown"
        });
      }
    });
    
    if (videos.length === 0) {
      return { success: false, message: "Không tìm được video nào từ URLs" };
    }
    
    return {
      success: true,
      videos: videos,
      message: `Tìm được ${videos.length} video`
    };
  } catch (error) {
    Logger.log("Error in extractYoutubeBulk:", error);
    return { success: false, message: "Lỗi: " + error.toString() };
  }
}

// Thêm bulk YouTube videos
function addYoutubeVideos(videos, courseId) {
  try {
    const sheet = getOrCreateYoutubeSheet();
    let count = 0;
    
    videos.forEach(video => {
      if (!video.videoId) return;
      
      // Extract proper video ID if needed
      const videoId = video.videoId.replace(/[^a-zA-Z0-9_-]/g, '');
      
      sheet.appendRow([
        videoId,
        video.youtubeUrl,
        courseId,
        `BAI_${videoId.substring(0, 8)}`,
        video.title || `Video ${videoId}`,
        video.transcript || "",
        video.description || "",
        new Date(),
        "Bulk Import",
        new Date()
      ]);
      
      count++;
    });
    
    return {
      success: true,
      count: count,
      message: `Thêm ${count} video thành công`
    };
  } catch (error) {
    Logger.log("Error in addYoutubeVideos:", error);
    return { success: false, message: "Lỗi: " + error.toString() };
  }
}

// Lấy thống kê dữ liệu
function getDataStats() {
  try {
    const contentSheet = getOrCreateContentSheet();
    const youtubeSheet = getOrCreateYoutubeSheet();
    const khSheet = getDB().getSheetByName("KH");
    
    const contentData = contentSheet.getDataRange().getValues();
    const youtubeData = youtubeSheet ? youtubeSheet.getDataRange().getValues() : [];
    const khData = khSheet ? khSheet.getDataRange().getValues() : [];
    
    return {
      success: true,
      stats: {
        content: contentData.length - 1, // Exclude header
        videos: youtubeData.length - 1,
        courses: khData.length - 1
      }
    };
  } catch (error) {
    Logger.log("Error in getDataStats:", error);
    return {
      success: false,
      stats: { content: 0, videos: 0, courses: 0 }
    };
  }
}

// Lấy tất cả dữ liệu
function getAllData() {
  try {
    const contentSheet = getOrCreateContentSheet();
    const contentData = contentSheet.getDataRange().getValues();
    
    const allData = [];
    for (let i = 1; i < contentData.length; i++) {
      allData.push({
        id: contentData[i][0],
        type: contentData[i][1],
        courseId: contentData[i][2],
        lessonId: contentData[i][3],
        title: contentData[i][4],
        content: contentData[i][5],
        source: contentData[i][6],
        addedDate: contentData[i][7],
        addedBy: contentData[i][8]
      });
    }
    
    return {
      success: true,
      data: allData
    };
  } catch (error) {
    Logger.log("Error in getAllData:", error);
    return { success: false, data: [] };
  }
}

// Xóa 1 content
function deleteContent(id) {
  try {
    const sheet = getOrCreateContentSheet();
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(id)) {
        sheet.deleteRow(i + 1);
        return { success: true, message: "Đã xóa" };
      }
    }
    
    return { success: false, message: "Không tìm thấy ID" };
  } catch (error) {
    Logger.log("Error in deleteContent:", error);
    return { success: false, message: "Lỗi: " + error.toString() };
  }
}

// Xóa tất cả dữ liệu
function clearAllData() {
  try {
    const ss = getDB();
    const contentSheet = ss.getSheetByName("AI_Content");
    const youtubeSheet = ss.getSheetByName("YT_Videos");
    
    if (contentSheet && contentSheet.getLastRow() > 1) {
      contentSheet.deleteRows(2, contentSheet.getLastRow() - 1);
    }
    
    if (youtubeSheet && youtubeSheet.getLastRow() > 1) {
      youtubeSheet.deleteRows(2, youtubeSheet.getLastRow() - 1);
    }
    
    return { success: true, message: "Đã xóa tất cả dữ liệu" };
  } catch (error) {
    Logger.log("Error in clearAllData:", error);
    return { success: false, message: "Lỗi: " + error.toString() };
  }
}



// ========================================
// RAG SYSTEM - PHASE 1: CONTENT CHUNKING
// ========================================

 function chunkContent(content, chunkSize = 800, overlap = 100) {
  if (!content || content.trim() === "") {
    return [];
  }
  
  const chunks = [];
  let startIndex = 0;
  
  while (startIndex < content.length) {
    let endIndex = Math.min(startIndex + chunkSize, content.length);
    
    // Smart splitting: try to end at paragraph or sentence boundary
    if (endIndex < content.length) {
      // Look for paragraph break within last 100 chars
      const searchStart = Math.max(endIndex - 100, startIndex);
      const segment = content.substring(searchStart, endIndex);
      
      // Try to find paragraph break (\n\n)
      const paragraphBreak = segment.lastIndexOf('\n\n');
      if (paragraphBreak > 0) {
        endIndex = searchStart + paragraphBreak + 2;
      } else {
        // Try to find sentence end (. ! ?)
        const sentenceEnd = Math.max(
          segment.lastIndexOf('. '),
          segment.lastIndexOf('! '),
          segment.lastIndexOf('? ')
        );
        if (sentenceEnd > 0) {
          endIndex = searchStart + sentenceEnd + 2;
        }
      }
    }
    
    const chunkText = content.substring(startIndex, endIndex).trim();
    
    if (chunkText) {
      chunks.push({
        text: chunkText,
        index: chunks.length,
        startPos: startIndex,
        endPos: endIndex,
        length: chunkText.length
      });
    }
    
    // Move to next chunk with overlap
    startIndex = endIndex - overlap;
    
    // Prevent infinite loop
    if (startIndex >= content.length - overlap) {
      break;
    }
  }
  
  Logger.log(`✅ Created ${chunks.length} chunks from ${content.length} chars`);
  return chunks;
}

/**
 * Extract metadata from content (title, keywords, chapter info)
 * @param {string} content - Chunk text
 * @param {number} chunkIndex - Index of chunk in sequence
 * @returns {Object} Metadata object
 */
function extractChunkMetadata(content, chunkIndex) {
  const metadata = {
    chunkIndex: chunkIndex,
    hasHeading: false,
    headingLevel: null,
    title: "",
    keywords: []
  };
  
  // Detect markdown headings
  const lines = content.split('\n');
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const line = lines[i].trim();
    
    // Check for markdown heading
    if (line.startsWith('#')) {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        metadata.hasHeading = true;
        metadata.headingLevel = match[1].length;
        metadata.title = match[2].trim();
        break;
      }
    }
    
    // Check for bold text as pseudo-heading
    if (line.startsWith('**') && line.endsWith('**')) {
      metadata.title = line.replace(/\*\*/g, '').trim();
      break;
    }
  }
  
  // Extract keywords (simple: take bold/emphasized text)
  const boldMatches = content.match(/\*\*([^*]+)\*\*/g) || [];
  metadata.keywords = boldMatches
    .map(m => m.replace(/\*\*/g, '').trim())
    .filter(k => k.length > 2 && k.length < 50)
    .slice(0, 10); // Max 10 keywords
  
  return metadata;
}

/**
 * Get embedding vector for text using Gemini API
 * @param {string} text - Text to embed
 * @returns {Array} 768-dimensional vector or null on error
 */
function getEmbedding(text) {
  try {
    const GEMINI_API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      Logger.log("❌ GEMINI_API_KEY not found");
      return null;
    }
    
    const payload = {
      content: {
        parts: [{ text: text }]
      }
    };
    
    const response = UrlFetchApp.fetch(
      `https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      }
    );
    
    if (response.getResponseCode() !== 200) {
      Logger.log(`❌ Embedding API error: ${response.getResponseCode()}`);
      Logger.log(response.getContentText());
      return null;
    }
    
    const result = JSON.parse(response.getContentText());
    const embedding = result.embedding?.values;
    
    if (!embedding || !Array.isArray(embedding)) {
      Logger.log("❌ Invalid embedding response");
      return null;
    }
    
    Logger.log(`✅ Generated embedding: ${embedding.length} dimensions`);
    return embedding;
    
  } catch (error) {
    Logger.log("❌ Error in getEmbedding:", error);
    return null;
  }
}

/**
 * Cosine similarity between two vectors
 * @param {Array} vecA - First vector
 * @param {Array} vecB - Second vector
 * @returns {number} Similarity score (0-1)
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Process course content into chunks with embeddings
 * @param {string} courseId - Course ID
 * @param {string} lessonId - Lesson ID
 * @param {string} content - Full content
 * @param {string} title - Lesson title
 * @returns {Object} Processing result
 */
function processContentToChunks(courseId, lessonId, content, title = "") {
  try {
    Logger.log(`🔄 Processing course ${courseId}, lesson ${lessonId}...`);
    
    // 1. Chunk the content
    const chunks = chunkContent(content, 800, 100);
    Logger.log(`✅ Created ${chunks.length} chunks`);
    
    if (chunks.length === 0) {
      return { success: false, message: "No chunks created" };
    }
    
    // 2. Get or create AI_Content_Chunks sheet
    const ss = getDB();
    let chunkSheet = ss.getSheetByName("AI_Content_Chunks");
    
    if (!chunkSheet) {
      chunkSheet = ss.insertSheet("AI_Content_Chunks");
      chunkSheet.appendRow([
        "Chunk ID",
        "Course ID",
        "Lesson ID",
        "Chunk Text",
        "Chunk Index",
        "Embedding",
        "Metadata",
        "Created Date"
      ]);
      Logger.log("✅ Created AI_Content_Chunks sheet");
    }
    
    // 3. Process each chunk
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Generate embedding
      Logger.log(`  Processing chunk ${i + 1}/${chunks.length}...`);
      const embedding = getEmbedding(chunk.text);
      
      if (!embedding) {
        Logger.log(`  ❌ Failed to generate embedding for chunk ${i + 1}`);
        failCount++;
        continue;
      }
      
      // Extract metadata
      const metadata = extractChunkMetadata(chunk.text, i);
      metadata.title = title;
      metadata.courseId = courseId;
      metadata.lessonId = lessonId;
      
      // Generate unique chunk ID
      const chunkId = `CHUNK_${courseId}_${lessonId}_${i}_${Date.now()}`;
      
      // Save to sheet
      const row = [
        chunkId,
        courseId,
        lessonId,
        chunk.text,
        i,
        JSON.stringify(embedding),
        JSON.stringify(metadata),
        new Date()
      ];
      
      chunkSheet.appendRow(row);
      successCount++;
      
      // Rate limiting: wait 100ms between API calls
      Utilities.sleep(100);
    }
    
    Logger.log(`\n✅ Processing complete: ${successCount} success, ${failCount} failed`);
    
    return {
      success: true,
      message: `Processed ${successCount}/${chunks.length} chunks`,
      chunksCreated: successCount,
      chunksFailed: failCount
    };
    
  } catch (error) {
    Logger.log("❌ Error in processContentToChunks:", error);
    return {
      success: false,
      message: "Error: " + error.toString()
    };
  }
}

// ========================================
// RAG SYSTEM - PHASE 3: KEYWORD EXTRACTION
// ========================================

/**
 * Extract keywords from text using markdown structure + word frequency
 * NO API calls - fast and reliable!
 * @param {string} text - Text to extract keywords from
 * @returns {Array} Array of keywords
 */
function extractKeywords(text) {
  try {
    const keywords = new Set();
    
    // 1. Extract from markdown headings (# ## ###)
    const headingMatches = text.match(/^#{1,6}\s+(.+)$/gm) || [];
    headingMatches.forEach(heading => {
      const cleaned = heading.replace(/^#+\s*/, '').replace(/[:#*]/g, '').trim().toLowerCase();
      if (cleaned.length > 3 && cleaned.length < 50) {
        keywords.add(cleaned);
        // Also add individual words from headings
        cleaned.split(/\s+/).forEach(word => {
          if (word.length > 3) keywords.add(word);
        });
      }
    });
    
    // 2. Extract from bold text (**text**)
    const boldMatches = text.match(/\*\*([^*]+)\*\*/g) || [];
    boldMatches.forEach(bold => {
      const cleaned = bold.replace(/\*\*/g, '').trim().toLowerCase();
      if (cleaned.length > 3 && cleaned.length < 50 && !cleaned.includes(':')) {
        keywords.add(cleaned);
        // Add individual words
        cleaned.split(/[,\s]+/).forEach(word => {
          if (word.length > 3) keywords.add(word);
        });
      }
    });
    
    // 3. Extract numbered list items (common in Vietnamese content)
    const listMatches = text.match(/^\d+\.\s*\*?\*?([^:\n]+)/gm) || [];
    listMatches.forEach(item => {
      const cleaned = item.replace(/^\d+\.\s*\*?\*?/, '').replace(/[:#*]/g, '').trim().toLowerCase();
      if (cleaned.length > 3 && cleaned.length < 50) {
        keywords.add(cleaned);
      }
    });
    
    // 4. Word frequency analysis (top nouns/verbs)
    const words = text.toLowerCase()
      .replace(/[^\w\sàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);
    
    // Common stop words (Vietnamese)
    const stopWords = new Set(['của', 'và', 'các', 'cho', 'với', 'trong', 'là', 'được', 'có', 'này', 'để', 'từ', 'theo', 'như', 'khi', 'về', 'hoặc', 'bởi', 'những', 'một', 'không', 'sẽ', 'tại', 'đã', 'cũng', 'trên', 'vào', 'sau', 'thì', 'bạn', 'mà']);
    
    const wordFreq = {};
    words.forEach(word => {
      if (!stopWords.has(word) && word.length > 3) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    // Top 10 most frequent words
    const topWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(entry => entry[0]);
    
    topWords.forEach(word => keywords.add(word));
    
    // Convert to array and limit
    const keywordArray = Array.from(keywords).slice(0, 20);
    
    Logger.log(`✅ Extracted ${keywordArray.length} keywords: ${keywordArray.slice(0, 5).join(', ')}...`);
    return keywordArray;
    
  } catch (error) {
    Logger.log("❌ Error in extractKeywords:", error);
    return [];
  }
}

/**
 * Calculate keyword match score between query and chunk
 * @param {Array} queryKeywords - Keywords from query
 * @param {Array} chunkKeywords - Keywords from chunk  
 * @returns {number} Match score (0-1)
 */
function calculateKeywordScore(queryKeywords, chunkKeywords) {
  if (!queryKeywords.length || !chunkKeywords.length) {
    return 0;
  }
  
  let matches = 0;
  const querySet = new Set(queryKeywords.map(k => k.toLowerCase()));
  const chunkSet = new Set(chunkKeywords.map(k => k.toLowerCase()));
  
  querySet.forEach(qk => {
    // Exact match
    if (chunkSet.has(qk)) {
      matches += 1.0;
      return;
    }
    
    // Word-level matching for Vietnamese phrases
    const qWords = qk.split(' ').filter(w => w.length > 2);
    
    chunkSet.forEach(ck => {
      const cWords = ck.split(' ').filter(w => w.length > 2);
      
      // Count common words
      let commonWords = 0;
      qWords.forEach(qw => {
        if (cWords.includes(qw)) {
          commonWords++;
        }
      });
      
      if (commonWords > 0) {
        // Partial match score based on overlap ratio
        const overlapRatio = commonWords / Math.max(qWords.length, cWords.length);
        matches += overlapRatio * 0.7; // Weight partial matches less than exact
      }
    });
  });
  
  return Math.min(matches / queryKeywords.length, 1.0);
}

/**
 * Process course content into chunks with keywords
 * @param {string} courseId - Course ID
 * @param {string} lessonId - Lesson ID
 * @param {string} content - Full content
 * @param {string} title - Lesson title
 * @returns {Object} Processing result
 */
function processContentToChunksV2(courseId, lessonId, content, title = "") {
  try {
    Logger.log(`🔄 Processing course ${courseId}, lesson ${lessonId}...`);
    
    // 1. Chunk the content
    const chunks = chunkContent(content, 800, 100);
    Logger.log(`✅ Created ${chunks.length} chunks`);
    
    if (chunks.length === 0) {
      return { success: false, message: "No chunks created" };
    }
    
    // 2. Get or create AI_Content_Chunks sheet
    const ss = getDB();
    let chunkSheet = ss.getSheetByName("AI_Content_Chunks");
    
    if (!chunkSheet) {
      chunkSheet = ss.insertSheet("AI_Content_Chunks");
      chunkSheet.appendRow([
        "Chunk ID",
        "Course ID",
        "Lesson ID",
        "Chunk Text",
        "Chunk Index",
        "Keywords",
        "Metadata",
        "Created Date"
      ]);
      Logger.log("✅ Created AI_Content_Chunks sheet");
    }
    
    // 3. Process each chunk
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Extract keywords
      Logger.log(`  Processing chunk ${i + 1}/${chunks.length}...`);
      const keywords = extractKeywords(chunk.text);
      
      if (keywords.length === 0) {
        Logger.log(`  ⚠️ No keywords extracted for chunk ${i + 1}, using manual metadata`);
        // Fallback to manual keyword extraction from metadata
        const metadata = extractChunkMetadata(chunk.text, i);
        keywords.push(...metadata.keywords);
      }
      
      // Extract metadata
      const metadata = extractChunkMetadata(chunk.text, i);
      metadata.title = title;
      metadata.courseId = courseId;
      metadata.lessonId = lessonId;
      
      // Generate unique chunk ID
      const chunkId = `CHUNK_${courseId}_${lessonId}_${i}_${Date.now()}`;
      
      // Save to sheet
      const row = [
        chunkId,
        courseId,
        lessonId,
        chunk.text,
        i,
        JSON.stringify(keywords),
        JSON.stringify(metadata),
        new Date()
      ];
      
      chunkSheet.appendRow(row);
      successCount++;
      
      // Rate limiting: wait 1 second between API calls (Gemini quota)
      Utilities.sleep(1000);
    }
    
    Logger.log(`\n✅ Processing complete: ${successCount} success, ${failCount} failed`);
    
    return {
      success: true,
      message: `Processed ${successCount}/${chunks.length} chunks`,
      chunksCreated: successCount,
      chunksFailed: failCount
    };
    
  } catch (error) {
    Logger.log("❌ Error in processContentToChunksV2:", error);
    return {
      success: false,
      message: "Error: " + error.toString()
    };
  }
}

// ========================================
// RAG SYSTEM - PHASE 4: SEMANTIC SEARCH
// ========================================

/**
 * Find relevant chunks for a query using keyword matching
 * @param {string} query - User's question
 * @param {string} userEmail - User email to filter activated courses
 * @param {number} topK - Number of top chunks to return (default: 5)
 * @returns {Array} Array of relevant chunks with scores
 */
function findRelevantChunks(query, studentCode, topK = 5) {
  try {
    Logger.log(`🔍 Searching for: "${query}"`);
    
    // 1. Extract keywords from query
    const queryKeywords = extractKeywords(query);
    Logger.log(`📝 Query keywords: ${queryKeywords.join(', ')}`);
    
    if (queryKeywords.length === 0) {
      Logger.log("⚠️ No keywords extracted from query");
      return [];
    }
    
    // 2. Get activated courses
    const activatedCourses = getActivatedCoursesFromLS(studentCode);
    Logger.log(`📚 Activated courses: ${activatedCourses.join(', ')}`);
    
    if (activatedCourses.length === 0) {
      Logger.log("⚠️ No activated courses");
      return [];
    }
    
    // 3. Load chunks from AI_Content_Chunks
    const ss = getDB();
    const chunkSheet = ss.getSheetByName("AI_Content_Chunks");
    
    if (!chunkSheet) {
      Logger.log("⚠️ AI_Content_Chunks sheet not found");
      return [];
    }
    
    const data = chunkSheet.getDataRange().getValues();
    Logger.log(`📊 Total chunks in sheet: ${data.length - 1}`);
    
    // 4. Calculate scores for each chunk
    const scores = [];
    
    for (let i = 1; i < data.length; i++) {
      const courseId = String(data[i][1] || "").trim();
      
      // Filter by activated courses
      if (!activatedCourses.includes(courseId)) {
        continue;
      }
      
      const chunkId = data[i][0];
      const chunkText = data[i][3];
      const keywordsJson = data[i][5];
      
      let chunkKeywords = [];
      try {
        chunkKeywords = JSON.parse(keywordsJson);
      } catch (e) {
        // Fallback: extract keywords from chunk text
        chunkKeywords = extractKeywords(chunkText);
      }
      
      // Calculate similarity score
      const score = calculateKeywordScore(queryKeywords, chunkKeywords);
      
      if (score > 0) {
        scores.push({
          chunkId: chunkId,
          courseId: courseId,
          text: chunkText,
          keywords: chunkKeywords,
          score: score
        });
      }
    }
    
    // 5. Sort by score and return top K
    scores.sort((a, b) => b.score - a.score);
    const topChunks = scores.slice(0, topK);
    
    Logger.log(`\n✅ Found ${topChunks.length} relevant chunks:`);
    topChunks.forEach((chunk, idx) => {
      Logger.log(`  ${idx + 1}. [${chunk.courseId}] Score: ${chunk.score.toFixed(2)}`);
      Logger.log(`     Preview: ${chunk.text.substring(0, 100)}...`);
    });
    
    return topChunks;
    
  } catch (error) {
    Logger.log("❌ Error in findRelevantChunks:", error);
    return [];
  }
}

// ========== TESTING FUNCTION (để test, có thể xóa sau) ==========
// Chạy hàm này trong Apps Script Editor (Run -> testGetCoursesList)
function testGetCoursesList() {
  Logger.log("========== BẮT ĐẦU TEST GETCOURSES ==========");
  
  try {
    // 1. Lấy danh sách học viên từ sheet Dky
    const dkySheet = getDB().getSheetByName("Dky");
    if (!dkySheet) {
      Logger.log("❌ Lỗi: Không tìm thấy sheet Dky");
      return;
    }
    
    const dkyData = dkySheet.getDataRange().getValues();
    Logger.log(`📋 Sheet Dky có ${dkyData.length} hàng (gồm header)`);
    Logger.log(`📊 Header: ${JSON.stringify(dkyData[0])}`);
    
    if (dkyData.length < 2) {
      Logger.log("❌ Sheet Dky không có dữ liệu học viên");
      return;
    }
    
    // 2. Lấy mã CODE của học viên đầu tiên
    const studentCode = String(dkyData[1][COL_CODE]).trim();
    Logger.log(`\n📌 Test với mã học viên: ${studentCode}`);
    
    if (!studentCode) {
      Logger.log("❌ Không tìm thấy mã học viên trong dòng 2");
      return;
    }
    
    // 3. Gọi hàm getCourses
    Logger.log(`\n🔍 Gọi getCourses(${studentCode})...`);
    const result = getCourses(studentCode);
    
    Logger.log(`\n✅ KẾT QUẢ:`);
    Logger.log(`Success: ${result.success}`);
    Logger.log(`Số khóa học: ${result.data ? result.data.length : 0}`);
    
    // 4. Chi tiết từng khóa học
    if (result.data && result.data.length > 0) {
      Logger.log(`\n📚 DANH SÁCH KHÓA HỌC:`);
      result.data.forEach((course, index) => {
        Logger.log(`\n  [${index + 1}] ${course.title}`);
        Logger.log(`     - ID: ${course.id}`);
        Logger.log(`     - Activated: ${course.isActivated}`);
        Logger.log(`     - Can Activate: ${course.canActivate}`);
        Logger.log(`     - Progress: ${course.percentComplete}%`);
        Logger.log(`     - Free: ${course.isFree}`);
      });
    } else {
      Logger.log(`\n⚠️  Không có khóa học nào được tìm thấy`);
    }
    
    // 5. Test hàm getActivatedCoursesFromLS
    Logger.log(`\n\n========== TEST getActivatedCoursesFromLS ==========`);
    const activatedList = getActivatedCoursesFromLS(studentCode);
    Logger.log(`Khóa đã kích hoạt: ${JSON.stringify(activatedList)}`);
    
  } catch (error) {
    Logger.log(`\n❌ LỖI: ${error.toString()}`);
    Logger.log(`Stack: ${error.stack}`);
  }
  
  Logger.log("\n========== KẾT THÚC TEST ==========");
}

// Hàm test thêm - kiểm tra cấu trúc sheet
function testSheetStructure() {
  Logger.log("========== KIỂM TRA CẤU TRÚC SHEET ==========\n");
  
  try {
    const ss = getDB();
    
    // Kiểm tra Dky
    Logger.log("📌 SHEET DKY:");
    const dkySheet = ss.getSheetByName("Dky");
    if (dkySheet) {
      const dkyHeaders = dkySheet.getRange(1, 1, 1, dkySheet.getLastColumn()).getValues()[0];
      Logger.log(`  Columns: ${JSON.stringify(dkyHeaders)}`);
    } else {
      Logger.log("  ❌ Sheet Dky không tồn tại");
    }
    
    // Kiểm tra KH
    Logger.log("\n📌 SHEET KH:");
    const khSheet = ss.getSheetByName("KH");
    if (khSheet) {
      const khHeaders = khSheet.getRange(1, 1, 1, khSheet.getLastColumn()).getValues()[0];
      Logger.log(`  Columns: ${JSON.stringify(khHeaders)}`);
      Logger.log(`  Tổng khóa học: ${khSheet.getLastRow() - 1}`);
    } else {
      Logger.log("  ❌ Sheet KH không tồn tại");
    }
    
    // Kiểm tra LS_DangKy
    Logger.log("\n📌 SHEET LS_DANGKY:");
    const lsSheet = ss.getSheetByName("LS_DangKy");
    if (lsSheet) {
      const lsHeaders = lsSheet.getRange(1, 1, 1, lsSheet.getLastColumn()).getValues()[0];
      Logger.log(`  Columns: ${JSON.stringify(lsHeaders)}`);
      Logger.log(`  Tổng đơn kích hoạt: ${lsSheet.getLastRow() - 1}`);
    } else {
      Logger.log("  ❌ Sheet LS_DangKy không tồn tại");
    }
    
    // Kiểm tra KH_TienDo
    Logger.log("\n📌 SHEET KH_TIENDO:");
    const progressSheet = ss.getSheetByName("KH_TienDo");
    if (progressSheet) {
      const progressHeaders = progressSheet.getRange(1, 1, 1, progressSheet.getLastColumn()).getValues()[0];
      Logger.log(`  Columns: ${JSON.stringify(progressHeaders)}`);
    } else {
      Logger.log("  ❌ Sheet KH_TienDo không tồn tại");
    }
    
  } catch (error) {
    Logger.log(`❌ LỖI: ${error.toString()}`);
  }
  
  Logger.log("\n========== KẾT THÚC ==========");
}

// Hàm test CORS headers
function testCORS() {
  Logger.log("========== TEST CORS HEADERS ==========");
  Logger.log("\n🧪 Gọi getAllAvailableCourses()...");
  
  try {
    const result = getAllAvailableCourses();
    Logger.log(`✅ SUCCESS: ${result.success}`);
    Logger.log(`📊 Số khóa học: ${result.data.length}`);
    Logger.log(`📝 Debug logs:`);
    if (result.debug && Array.isArray(result.debug)) {
      result.debug.forEach(log => Logger.log(`   - ${log}`));
    }
  } catch (error) {
    Logger.log(`❌ LỖI: ${error.toString()}`);
  }
  
  Logger.log("\n⚠️  LƯỚI ỲU: Nếu test này thành công nhưng API vẫn bị CORS error:");
  Logger.log("   1. Hãy DEPLOY Backend.gs lại (Deploy > New Deployment)");
  Logger.log("   2. Copy URL mới nếu có");
  Logger.log("   3. Hard refresh browser (Ctrl+F5)");
  Logger.log("   4. Xóa cache của browser");
}