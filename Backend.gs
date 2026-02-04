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

function doPost(e) {
  try {
    var content = JSON.parse(e.postData.contents);
    var action = content.action;
    
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
    else if (action === "getAllAvailableCourses") {
      return returnJSON(getAllAvailableCourses());
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
  const courseList = [];
  
  // Mapping columns for KH sheet:
  const C_TITLE = 1;    // Cột B: Tên khóa học
  const C_ID = 3;       // Cột D: Mã khóa
  const C_AVAILABLE = 4; // Cột E: Có sẵn (TRUE/FALSE)
  const C_DESC = 5;     // Cột F: Mô tả ngắn
  const C_IS_FREE = 14; // Cột O: isFree

  // Bỏ qua header, duyệt từ dòng 2
  for (let i = 1; i < courses.length; i++) {
    // Chỉ lấy khóa học có Có sẵn (cột E) = TRUE
    if (courses[i][C_AVAILABLE] === true && courses[i][C_ID]) {
      const courseId = String(courses[i][C_ID]);
      const courseName = String(courses[i][C_TITLE] || "");
      const compositeKey = courseName + "|" + courseId;
      
      courseList.push({
        id: courseId,
        title: courseName,
        desc: String(courses[i][C_DESC] || ""),
        icon: "fa-book",
        isFree: courses[i][C_IS_FREE] === true,
        isActivated: activatedCourses.includes(compositeKey)
      });
    }
  }
  
  return { success: true, data: courseList };
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
  const availableCourses = [];
  
  // Column mapping (adjust based on your actual sheet structure)
  const COL_ID = 3;        // Cột D: Mã khóa
  const COL_TITLE = 1;     // Cột B: Tên khóa học
  const COL_AVAILABLE = 4; // Cột E: Có sẵn (TRUE/FALSE)
  const COL_DESC = 5;      // Cột F: Mô tả ngắn
  const COL_IS_FREE = 14;  // Cột O: isFree (TRUE/FALSE)
  
  for (let i = 1; i < data.length; i++) {
    // Chỉ lấy khóa học có Có sẵn (cột E) = TRUE
    if (data[i][COL_AVAILABLE] === true && data[i][COL_ID]) {
      availableCourses.push({
        id: String(data[i][COL_ID]),
        title: String(data[i][COL_TITLE] || ""),
        desc: String(data[i][COL_DESC] || ""),
        icon: "fa-book",
        isFree: data[i][COL_IS_FREE] === true,
        isActivated: false // Public view, không có thông tin kích hoạt
      });
    }
  }
  
  return { success: true, data: availableCourses };
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
    // Cột B: MÃ CODE (index 1)
    // Cột O: Ma_Lop (index 14)
    // Cột K: Trạng thái duyệt (index 10)
    const maHocVien = String(lsData[i][1]).trim();
    const maLop = String(lsData[i][14]).trim();
    const trangThaiDuyet = String(lsData[i][10]).trim();
    
    if (maHocVien === String(studentCode)) {
      Logger.log("Row " + (i+1) + ": Ma_Lop = '" + maLop + "', Trạng thái = '" + trangThaiDuyet + "'");
    }
    
    // Chấp nhận cả "Đã duyệt" và "Đã duyệt (Dữ liệu cũ)"
    const isDuyet = trangThaiDuyet.startsWith("Đã duyệt");
    
    if (maHocVien === String(studentCode) && 
        isDuyet &&
        maLop) {
      maLopList.push(maLop);
    }
  }
  
  Logger.log("Ma_Lop đã duyệt: " + JSON.stringify(maLopList));
  
  // Nếu không tìm thấy Ma_Lop nào
  if (maLopList.length === 0) {
    Logger.log("Không tìm thấy Ma_Lop đã duyệt");
    return [];
  }
  
  // Kiểm tra xem có Ma_Lop = "86D" không (kích hoạt tất cả)
  const hasVIPAccess = maLopList.some(ml => ml === "86D");
  
  if (hasVIPAccess) {
    Logger.log("Phát hiện Ma_Lop = 86D - Kích hoạt TẤT CẢ khóa học");
    // Kích hoạt TẤT CẢ khóa học
    const allCourses = [];
    for (let i = 1; i < khData.length; i++) {
      const courseId = String(khData[i][3]); // Cột D: Mã khóa (index 3)
      if (courseId) {
        allCourses.push(courseId);
      }
    }
    return allCourses;
  }
  
  // Nếu không có 86D, đối chiếu Ma_Lop với sheet KH
  const activatedCourses = [];
  
  Logger.log("=== Đối chiếu với sheet KH ===");
  
  for (let i = 1; i < khData.length; i++) {
    // Cột D: Mã khóa (index 3)
    // Cột B: Tên khóa (index 1)
    // Cột P: Ma_Lop (index 15)
    const courseId = String(khData[i][3]).trim();
    const courseName = String(khData[i][1]).trim();
    const courseMaLop = String(khData[i][15]).trim();
    
    if (courseId && courseMaLop) {
      const isActivated = maLopList.includes(courseMaLop);
      if (isActivated) {
        Logger.log("✅ Khóa '" + courseName + "' (ID: " + courseId + ") - Ma_Lop: '" + courseMaLop + "' - KÍCH HOẠT");
        // Sử dụng composite key: courseName + "|" + courseId để tránh trùng lặp
        activatedCourses.push(courseName + "|" + courseId);
      } else {
        Logger.log("❌ Khóa '" + courseName + "' (ID: " + courseId + ") - Ma_Lop: '" + courseMaLop + "' - CHƯA kích hoạt");
      }
    }
  }
  
  Logger.log("=== Tổng số khóa kích hoạt: " + activatedCourses.length + " ===");
  
  return activatedCourses;
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