function doGet(e) {
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
      return returnJSON(getCourseContent(content.email, content.courseId));
    }
    else if (action === "updateVideoProgress") {
      return returnJSON(updateVideoProgress(content.email, content.courseId, content.lessonId, content.currentTime, content.duration));
    }
    else if (action === "submitAssignment") {
      return returnJSON(submitAssignment(content.email, content.courseId, content.lessonId, content.assignmentLink));
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
function getCourses(email) {
  // 1. Lấy mã học viên từ email
  const studentCode = getStudentCodeByEmail(email);
  if (!studentCode) {
    return { success: false, msg: "Không tìm thấy thông tin học viên!" };
  }
  
  // 2. Lấy danh sách khóa đã kích hoạt từ LS_DangKy
  const activatedCourses = getActivatedCoursesFromLS(studentCode);
  
  // 3. Lấy danh sách khóa học từ Sheet "KH"
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
  const COL_TEN_LOP_HOC = findIndex("Tên lớp học"); // Prioritized Title
  const COL_CO_SAN = findIndex("Có sẵn");
  const COL_MO_TA = findIndex("Mô tả ngắn");
  const COL_PHI_COC = findIndex("Phí cọc");
  const COL_LINK_ANH = findIndex("Link_Anh_Lop");
  
  const courseList = [];
  
  // Bỏ qua header
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
        percentComplete = calculateCourseProgress(email, courseId, ss);
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

function calculateCourseProgress(email, courseId, ss) {
  const contentSheet = ss.getSheetByName("KH_NoiDung");
  const progressSheet = ss.getSheetByName("KH_TienDo");
  if (!contentSheet || !progressSheet) return 0;

  const content = contentSheet.getDataRange().getValues();
  let totalLessons = 0;
  for (let i = 1; i < content.length; i++) {
    if (content[i][0] == courseId) totalLessons++;
  }
  if (totalLessons === 0) return 0;

  const progress = progressSheet.getDataRange().getValues();
  let completedCount = 0;
  for (let i = 1; i < progress.length; i++) {
    if (progress[i][0] == email && progress[i][1] == courseId) {
      const currentStatus = progress[i][5];
      if (currentStatus == "Completed" || currentStatus == "Approved") {
        completedCount++;
      }
    }
  }

  return Math.round((completedCount / totalLessons) * 100);
}

function getCourseContent(email, courseId) {
  const ss = getDB();
  const contentSheet = ss.getSheetByName("KH_NoiDung");
  const progressSheet = ss.getSheetByName("KH_TienDo");
  
  if (!contentSheet) return { success: false, msg: "Sheet nội dung không tồn tại" };
  
  const contentData = contentSheet.getDataRange().getValues();
  const progressData = progressSheet ? progressSheet.getDataRange().getValues() : [];
  
  const curriculum = [];
  for (let i = 1; i < contentData.length; i++) {
    if (contentData[i][0] == courseId) {
      const lessonId = String(contentData[i][1]);
      
      // Tìm tiến độ của học viên cho bài này
      let userProgress = { currentTime: 0, maxTime: 0, status: "Locked" };
      for (let j = 1; j < progressData.length; j++) {
        if (progressData[j][0] == email && progressData[j][1] == courseId && progressData[j][2] == lessonId) {
          userProgress = {
            currentTime: Number(progressData[j][3] || 0),
            maxTime: Number(progressData[j][4] || 0),
            status: progressData[j][5] || "In Progress"
          };
          break;
        }
      }
      
      curriculum.push({
        id: lessonId,
        title: contentData[i][2],
        youtubeId: contentData[i][3],
        summary: contentData[i][4],
        assignmentType: contentData[i][5],
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

function updateVideoProgress(email, courseId, lessonId, currentTime, duration) {
  const ss = getDB();
  let progressSheet = ss.getSheetByName("KH_TienDo");
  if (!progressSheet) {
    progressSheet = ss.insertSheet("KH_TienDo");
    progressSheet.appendRow(["Email", "Ma_KH", "Ma_Bai", "Thoi_Diem_Hien_Tai", "Diem_Xem_Xa_Nhat", "Trang_Thai"]);
  }
  
  const data = progressSheet.getDataRange().getValues();
  let foundRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == email && data[i][1] == courseId && data[i][2] == lessonId) {
      foundRow = i + 1;
      break;
    }
  }
  
  const percent = (currentTime / duration) * 100;
  const isFinishedVideo = percent > 95;
  
  if (foundRow > 0) {
    const lastMax = Number(data[foundRow-1][4] || 0);
    const newMax = Math.max(lastMax, currentTime);
    
    progressSheet.getRange(foundRow, 4).setValue(currentTime);
    progressSheet.getRange(foundRow, 5).setValue(newMax);
    
    // Nếu xem xong video mà chưa có trạng thái hoặc đang "Available" thì chuyển sang "In Progress"
    const currentStatus = data[foundRow-1][5];
    if (isFinishedVideo && (currentStatus == "Available" || currentStatus == "Locked" || !currentStatus)) {
       progressSheet.getRange(foundRow, 6).setValue("In Progress"); 
    }
  } else {
    progressSheet.appendRow([email, courseId, lessonId, currentTime, currentTime, "In Progress"]);
  }
  
  return { success: true };
}

function submitAssignment(email, courseId, lessonId, assignmentLink) {
  const ss = getDB();
  const progressSheet = ss.getSheetByName("KH_TienDo");
  const data = progressSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == email && data[i][1] == courseId && data[i][2] == lessonId) {
      progressSheet.getRange(i + 1, 6).setValue("Submitted");
      return { success: true, message: "Đã nộp bài tập thành công!" };
    }
  }
  return { success: false, message: "Vui lòng xem video trước khi nộp bài tập!" };
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
  const COL_MO_TA = findIndex("Mô tả ngắn");
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
  const ss = getDB();
  const lsDangKySheet = ss.getSheetByName("LS_DangKy");
  const khSheet = ss.getSheetByName("KH");
  
  if (!lsDangKySheet) {
    Logger.log("Sheet LS_DangKy không tồn tại!");
    return [];
  }
  
  if (!khSheet) {
    Logger.log("Sheet KH không tồn tại!");
    return [];
  }
  
  const lsData = lsDangKySheet.getDataRange().getValues();
  const khData = khSheet.getDataRange().getValues();
  
  Logger.log("=== DEBUG: Kiểm tra kích hoạt cho CODE: " + studentCode + " ===");
  
  // Tìm Ma_Lop của học viên trong LS_DangKy
  let maLopList = [];
  
  for (let i = 1; i < lsData.length; i++) {
    // Cột B: MÃ CODE (index 1) - Theo yêu cầu thống nhất
    // Cột O: Ma_Lop (index 14)
    // Cột K: Trạng thái duyệt (index 10)
    const maHocVien = String(lsData[i][1]).trim();
    const maLop = String(lsData[i][14]).trim();
    const trangThaiDuyet = String(lsData[i][10]).trim();
    
    // Chấp nhận các trạng thái "Đã duyệt..."
    const isDuyet = trangThaiDuyet.startsWith("Đã duyệt");
    
    if (maHocVien === String(studentCode) && isDuyet && maLop) {
      if (!maLopList.includes(maLop)) {
        maLopList.push(maLop);
      }
    }
  }
  
  Logger.log("Mã lớp đã kích hoạt cho học viên " + studentCode + ": " + JSON.stringify(maLopList));
  return maLopList;
}

// ===================================================================
// TEST FUNCTION - Chỉ dùng để debug, xóa sau khi xong
// ===================================================================
function testActivation838() {
  Logger.log("=== BẮT ĐẦU TEST ===");
  const result = getActivatedCoursesFromLS("838");
  Logger.log("Kết quả: " + JSON.stringify(result));
  Logger.log("=== KẾT THÚC TEST ===");
  return result;
}

function testActivation470() {
  Logger.log("=== BẮT ĐẦU TEST CODE 470 ===");
  const result = getActivatedCoursesFromLS("470");
  Logger.log("Kết quả: " + JSON.stringify(result));
  Logger.log("=== KẾT THÚC TEST ===");
  return result;
}

// Function để check version
function checkVersion() {
  Logger.log("=== VERSION INFO ===");
  Logger.log("Deployment Time: " + new Date());
  Logger.log("Logic: Sử dụng Ma_Lop (cột O LS_DangKy, cột P KH)");
  Logger.log("Version: 2.0 - Ma_Lop Based Activation");
  return {
    version: "2.0",
    logic: "Ma_Lop based",
    timestamp: new Date()
  };
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
    
    const studentInfo = getStudentInfo(data.email);
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
 * Cập nhật tiến độ xem video
 */
function updateVideoProgress(email, courseId, lessonId, currentTime, duration) {
  const ss = getDB();
  const sheet = ss.getSheetByName("KH_TienDo");
  if (!sheet) return { success: false, msg: "Sheet KH_TienDo không tồn tại" };
  
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  
  // Tìm dòng tương ứng: Email + CourseId + LessonId
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === email && 
        String(data[i][1]) === courseId && 
        String(data[i][2]) === lessonId) {
      rowIndex = i;
      break;
    }
  }
  
  const progressRatio = duration > 0 ? (currentTime / duration) : 0;
  // Nếu > 95% coi như hoàn thành Video (nhưng chưa xong bài học nếu có bài tập)
  // Logic: Nếu chưa có Status -> "In Progress"
  // Nếu đã Completed/Pending -> Giữ nguyên
  
  let newStatus = "In Progress";
  
  if (rowIndex === -1) {
    // Thêm mới
    sheet.appendRow([
      email, 
      courseId, 
      lessonId, 
      currentTime, 
      currentTime, // Max time
      newStatus,
      "" // Link bài tập
    ]);
  } else {
    // Cập nhật
    // Cột D (index 3): Thời điểm hiện tại
    // Cột E (index 4): Điểm xem xa nhất
    // Cột F (index 5): Trạng thái
    
    // Update current time
    sheet.getRange(rowIndex + 1, 4).setValue(currentTime);
    
    // Update max time if greater
    const currentMax = Number(data[rowIndex][4]) || 0;
    if (currentTime > currentMax) {
      sheet.getRange(rowIndex + 1, 5).setValue(currentTime);
    }
    
    // Update Status logic handled mainly by frontend or completion check? - Keep simple here
  }
  
  return { success: true };
}

/**
 * Nộp bài tập
 */
function submitAssignment(email, courseId, lessonId, link) {
  const ss = getDB();
  const sheet = ss.getSheetByName("KH_TienDo");
  if (!sheet) return { success: false, msg: "Sheet KH_TienDo không tồn tại" };
  
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === email && 
        String(data[i][1]) === courseId && 
        String(data[i][2]) === lessonId) {
      rowIndex = i;
      break;
    }
  }
  
  const status = "Completed"; // Tạm thời auto-complete khi nộp, hoặc "Pending" nếu cần duyệt
  
  if (rowIndex === -1) {
    // Nếu chưa có dòng tiến độ (trường hợp hiếm, thường đã xem video rồi)
    sheet.appendRow([
      email, 
      courseId, 
      lessonId, 
      0, 
      0, 
      status, 
      link
    ]);
  } else {
    // Cập nhật trạng thái và link
    sheet.getRange(rowIndex + 1, 6).setValue(status); // Cột F: Trạng thái
    sheet.getRange(rowIndex + 1, 7).setValue(link);   // Cột G: Link bài tập
  }
  
  return { success: true, message: "Nộp bài thành công! Bạn có thể chuyển sang bài tiếp theo." };
}

// ------------------------------------------------------------------
// DEBUGGING / TESTING AREA
// ------------------------------------------------------------------
// Hướng dẫn: 
// 1. Chọn hàm 'debug_testDepositInfo' trên thanh công cụ bên trên.
// 2. Nhấn nút 'Run' (Chạy).
// 3. Xem kết quả ở phần 'Execution Log' (Nhật ký thực thi) phía dưới.

function debug_testDepositInfo() {
  const courseId = "NH"; // Thay bằng mã khóa học bạn muốn test (ví dụ: 86D, NH, AF...)
  
  Logger.log("🚀 Bắt đầu test lấy thông tin cọc cho khóa: " + courseId);
  
  const result = getCourseDepositInfo(courseId);
  
  if (result) {
    Logger.log("✅ KẾT QUẢ TÌM THẤY:");
    Logger.log("--------------------------------");
    Logger.log("Mã: " + result.id);
    Logger.log("Tên: " + result.title);
    Logger.log("Phí cọc (Số tiền): " + result.depositFee);
    Logger.log("Chủ TK: " + result.tenChuTK);
    Logger.log("STK: " + result.stk);
    Logger.log("Ngân hàng: " + result.nganHang);
    Logger.log("Nội dung CK: " + result.paymentContent);
    Logger.log("Link QR: " + result.qrLink);
    Logger.log("Link Zalo: " + result.zaloLink);
    Logger.log("--------------------------------");
  } else {
    Logger.log("❌ KHÔNG TÌM THẤY thông tin cho khóa: " + courseId);
    Logger.log("Nguyên nhân có thể: Mã khóa sai, hoặc Sheet KH chưa đúng cấu trúc cột.");
  }
}
