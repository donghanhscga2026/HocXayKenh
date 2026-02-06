// =================================================================
// PHẦN 1: CÁC HẰNG SỐ CẤU HÌNH - BẠN CẦN THAY ĐỔI CÁC GIÁ TRỊ NÀY
// =================================================================

const SPREADSHEET_ID = "1VWskTJhF6G_Y5SFMdaHsckeCn2H7hc03bEnGQ7UNn9A";
const SHEET_NAME = "DKy";
const COURSE_SHEET_NAME = "KH";
const EMAIL_TEMPLATE_ID = '1L-1U7w69DfbaSajNRm8GWY2RaBOH97PKyT4HPDdRpFM';
const EMAIL_ATTACHMENT_FOLDER_ID = '1J3jbmIzwdCgEqpkMsbOhfU_MPPjRy0L6';
const QR_CODE_FOLDER_ID = "13gQ7eeIws37SbJXHSpjMcbnnD6njCuhl"; 
// [QUAN TRỌNG] Dán ID của thư mục Google Drive bạn vừa tạo vào đây
const DEPOSIT_RECEIPT_FOLDER_ID = "1pmSPDR38bGdgGtUjTWUxfbtT98BfnOGL"; 
const DAILY_SEND_LIMIT = 80; //
const HV86_SHEET_NAME = "HV86"; // [MỚI] Tên sheet cho học viên lớp 86 ngày
const CUSTOM_UPGRADE_DOMAIN = 'https://go.giautoandien.site/5s'; // URL đích TỰ NHIÊN (Không dùng /r/)

const CUSTOM_AFFILIATE_DOMAIN = "https://go.giautoandien.site/r/"; // << Đảm bảo có dấu "/" ở cuối

// =================================================================
// PHẦN 2: HÀM CHÍNH - XỬ LÝ HIỂN THỊ VÀ GỬI FORM
// =================================================================

function doGet(e) {
  const page = e.parameter.page || 'dangky'; // Mặc định là trang 'dangky'

  switch (page.toLowerCase()) {
    //case 'chuyenlopngan':
  //return HtmlService.createHtmlOutputFromFile('chuyenlopngan')
  //  .setTitle("Đăng ký khóa học mới")
  //  .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  //  case 'nangcap':
   //   return showNangCapPage(e);
  //  case 'timkiem': // <--- CASE MỚI CHO TRANG TRA CỨU
   //   return showTimKiemPage();
case 'vinhdanh':
      return showVinhDanhPage();
case 'hocvien': 
      return showHocVienPage();
case 'nhanmach': // [MỚI] Lối rẽ cho Sơ đồ Cây
      return showNhanMachPage();
    case 'dangky':
    default:
      return showDangKyPage(e);
  }
}
// [MỚI] Hiển thị trang Cổng Học Viên
function showHocVienPage() {
  return HtmlService.createTemplateFromFile('hocvien')
    .evaluate()
    .setTitle('Cổng Thông Tin Học Viên')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function showNhanMachPage() {
  return HtmlService.createTemplateFromFile('nhanmach')
    .evaluate()
    .setTitle('Sơ đồ cây nhânmachj')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
// [HÀM MỚI] Hiển thị trang Tra cứu
function showTimKiemPage() {
  return HtmlService.createTemplateFromFile('timkiem')
    .evaluate()
    .setTitle('Tra cứu thông tin & Nâng cấp Lộ trình')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function showDangKyPage(e) {
  const template = HtmlService.createTemplateFromFile('dangky');
  template.referrerId = '';
  template.referrerInfoText = '';
  const refCode = e.parameter.ref;

  if (refCode !== null && refCode !== undefined && refCode !== "") {
    try {
      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const referrerInfo = findReferrerInfo(refCode, sheet, headers);

      if (referrerInfo) {
        template.referrerId = refCode;
        template.referrerInfoText = `${refCode} - ${referrerInfo.name}`;
      }
    } catch (err) {
      Logger.log("Lỗi khi tìm kiếm người giới thiệu: " + err.message);
    }
  }

  return template.evaluate()
    .setTitle('Làm chủ Bản đồ Kinh doanh Online')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function showNangCapPage(e) {
  const template = HtmlService.createTemplateFromFile('nangcap');
  const userCode = e.parameter.code;
  
  template.upgradeStatus = 'NOT_FOUND';
  template.name = '';
  template.code = userCode || '';
  template.remainingAmount = '1.000.000';

  if (userCode) {
    try {
      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const userInfo = findUserInfoByCode(userCode, sheet, headers);

      if (userInfo) {
        template.name = userInfo.name;

        // [NÂNG CẤP] Thêm một trạng thái mới là PENDING
        if (userInfo.hasPendingUpgrade) {
          template.upgradeStatus = 'PENDING';
        } else if (userInfo.classStatus && String(userInfo.classStatus).toLowerCase().includes('86 ngày')) {
          template.upgradeStatus = 'ALREADY_UPGRADED';
        } else {
          template.upgradeStatus = 'ELIGIBLE';
        }
      }
    } catch (err) {
      Logger.log("Lỗi khi tìm thông tin nâng cấp: " + err.message);
      template.upgradeStatus = 'NOT_FOUND';
    }
  }
  return template.evaluate()
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setTitle("Nâng cấp Lộ trình");
}
/**
 * [HÀM MỚI] Tìm kiếm thông tin học viên bằng SĐT hoặc Email.
 * @param {string} searchInput - Số điện thoại hoặc Email từ người dùng.
 * @returns {Object} Thông tin học viên và trạng thái (status)
 */
function findStudentInfoByPhoneOrEmail(searchInput) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet || sheet.getLastRow() < 2) {
        return { status: 'ERROR', message: "Hệ thống chưa có dữ liệu học viên để tra cứu." };
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const data = sheet.getDataRange().getValues(); // Lấy tất cả dữ liệu
    
    const codeColIndex = headers.indexOf("MÃ CODE");
    const nameColIndex = headers.indexOf("Họ và tên");
    const emailColIndex = headers.indexOf("Địa chỉ email");
    const phoneColIndex = headers.indexOf("Số điện thoại");
    const classColIndex = headers.indexOf("Lớp đăng ký");
    const courseCodeColIndex = headers.indexOf("Mã lớp");
    // Cần thêm Mã lớp vào danh sách kiểm tra
    if ([codeColIndex, nameColIndex, emailColIndex, phoneColIndex, classColIndex, courseCodeColIndex].includes(-1)) {
      // Đảm bảo message lỗi rõ ràng
      return { status: 'ERROR', message: "Thiếu một hoặc nhiều cột cần thiết (MÃ CODE, Họ và tên, Địa chỉ email, Số điện thoại, Lớp đăng ký, Mã lớp)." };
    }
    
    // Giả sử hàm normalizePhoneNumber đã được định nghĩa
    let isEmail = searchInput.includes('@');
    let searchNormalized = isEmail ? String(searchInput).trim().toLowerCase() : normalizePhoneNumber(searchInput);
    
    for (let i = 1; i < data.length; i++) {
      let found = false;
      const rowData = data[i];
      
      if (isEmail) {
        // Tìm kiếm theo Email
        const emailInSheet = String(rowData[emailColIndex]).trim().toLowerCase();
        if (emailInSheet === searchNormalized) {
          found = true;
        }
      } else {
        // Tìm kiếm theo Số điện thoại
        const phoneInSheetRaw = rowData[phoneColIndex];
        const phoneInSheetNormalized = normalizePhoneNumber(phoneInSheetRaw);
        if (phoneInSheetNormalized === searchNormalized) {
          found = true;
        }
      }
      
      if (found) {
        const studentName = rowData[nameColIndex];
        const studentCode = String(rowData[codeColIndex]).replace(/'/g, ''); // Loại bỏ ký tự '
        const classStatus = String(rowData[classColIndex] || "");
        
        let status = 'ELIGIBLE'; // Mặc định là đủ điều kiện
        
        if (classStatus.includes('86 ngày đồng hành')) {
          status = 'ALREADY_UPGRADED';
        }
        
        return {
          status: status,
          name: studentName,
          code: studentCode,
          // [CẬP NHẬT URL Ở ĐÂY]
          // Đảm bảo biến CUSTOM_UPGRADE_DOMAIN đã được định nghĩa ở ngoài hàm
          upgradeUrl: `${CUSTOM_UPGRADE_DOMAIN}?code=${studentCode}` 
        };
      }
    }
    
    // **********************************************
    // [ĐOẠN CODE CẦN THÊM]
    // Nếu vòng lặp kết thúc mà không tìm thấy, trả về NOT_FOUND
    return {
      status: 'NOT_FOUND',
      message: 'Không tìm thấy thông tin đăng ký với liên hệ này.'
    };
    // **********************************************
    
  } catch (error) {
    Logger.log("Lỗi trong findStudentInfoByPhoneOrEmail: " + error.message);
    return { status: 'ERROR', message: "Lỗi hệ thống: " + error.message };
  }
}
// THAY THẾ TOÀN BỘ HÀM handleUpgradeSubmit CŨ BẰNG HÀM NÀY

/**
 * Xử lý khi học viên gửi form NÂNG CẤP lên 86 ngày.
 * Sẽ tra cứu lớp/khóa cũ và ghi vào LS_DangKy.
 */
function handleUpgradeSubmit(upgradeData) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const dkySheet = ss.getSheetByName(SHEET_NAME);
    const lsSheet = ss.getSheetByName("LS_DangKy");

    if (!dkySheet || !lsSheet) {
      throw new Error("Không tìm thấy sheet DKy hoặc LS_DangKy.");
    }

    // 1. Tìm thông tin HV hiện tại trong DKy
    const dkyHeaders = dkySheet.getRange(1, 1, 1, dkySheet.getLastColumn()).getValues()[0];
    // Dùng hàm findUserInfoByCode để lấy thông tin chi tiết
    const studentInfo = findUserInfoByCode(upgradeData.code, dkySheet, dkyHeaders); 

    if (!studentInfo) {
      throw new Error(`Không tìm thấy học viên với mã code ${upgradeData.code}.`);
    }
    
    // Lấy thông tin Lớp/Khóa cũ từ studentInfo
    const oldClass = studentInfo.classStatus || "Không rõ"; // Lớp hiện tại
    const oldCourse = studentInfo.course || "Không rõ";   // Khóa hiện tại
    Logger.log(`HV ${studentInfo.name} (Mã: ${studentInfo.code}) đang nâng cấp từ: ${oldClass} - ${oldCourse}`);


    // 2. Lấy thông tin của khóa học 86 ngày (khóa mới)
    const courseInfo = _getCourseInfo("86D"); // Mã cứng cho 86 ngày
    if (!courseInfo) {
      throw new Error("Không tìm thấy thông tin cho lộ trình 86 ngày trong sheet KH.");
    }
    
    // 3. Upload ảnh cọc nâng cấp (nếu có)
    let newReceiptLink = 'Đã cọc bổ sung (không có ảnh)';
    if (upgradeData.fileData && upgradeData.fileName && upgradeData.fileType) {
      newReceiptLink = uploadFileToDrive(upgradeData.fileData, upgradeData.fileName, upgradeData.fileType, upgradeData.code, studentInfo.name + "_NangCap");
    }
    
    // 4. GHI YÊU CẦU VÀO SHEET LS_DangKy ĐỂ CHỜ DUYỆT
    const lsHeaders = lsSheet.getRange(1, 1, 1, lsSheet.getLastColumn()).getValues()[0];
    const lsHeaderMap = {};
    lsHeaders.forEach((h, i) => lsHeaderMap[h.trim()] = i);

    // Kiểm tra xem LS_DangKy đã có cột "Lớp học cũ", "Khóa học cũ" chưa
    if (lsHeaderMap["Lớp học cũ"] === undefined || lsHeaderMap["Khóa học cũ"] === undefined) {
         Logger.log("Lỗi: Sheet LS_DangKy thiếu cột 'Lớp học cũ' hoặc 'Khóa học cũ'. Sẽ tiếp tục nhưng không ghi được thông tin cũ.");
         SpreadsheetApp.getActiveSpreadsheet().toast("Cảnh báo: Sheet LS_DangKy thiếu cột Lớp/Khóa học cũ.", "Lỗi Cột", 10);
    }

    const lsData = {
      "Dấu thời gian": new Date(),
      "MÃ CODE": studentInfo.code,
      "Họ và tên": studentInfo.name,
      "Lớp học cũ": oldClass,   // <<< ĐÃ THÊM
      "Khóa học cũ": oldCourse,  // <<< ĐÃ THÊM
      "Lớp ĐK mới": courseInfo.topic, // Lớp 86 ngày
      "Khóa ĐK mới": courseInfo.name, // Khóa 86 ngày
      "Mã lớp mới": courseInfo.code,  // Mã 86D
      "Phí cọc mới": courseInfo.depositFee,
      "Link ảnh cọc mới": newReceiptLink,
      "Trạng thái duyệt": "Chờ duyệt" 
    };
    const lsRowData = lsHeaders.map(header => lsData[header] !== undefined ? lsData[header] : '');
    lsSheet.appendRow(lsRowData);
    Logger.log(`Đã ghi yêu cầu nâng cấp (kèm thông tin cũ) cho HV ${studentInfo.code} vào LS_DangKy.`);

    // 5. GHI VÀO HV86 (Giữ nguyên)
    const studentDataForHV86 = {
      "MÃ CODE": studentInfo.code,
      "Họ và tên": studentInfo.name,
      "Số điện thoại": studentInfo.phone, 
      "Ngày bắt đầu": new Date(), 
      "Mã giới thiệu": studentInfo.referrerId, 
      "Người giới thiệu": studentInfo.referrerName, 
      "Link ảnh cọc": newReceiptLink
    };
    _addStudentToHV86Sheet(studentDataForHV86); 

   sendToTelegram("YÊU CẦU NÂNG CẤP VIP 86", {
      code: upgradeData.code,
      name: studentInfo.name,
      phone: studentInfo.phone,
      courseInfo: "Nâng cấp lên Lộ trình 86 Ngày",
      imageLink: newReceiptLink, // <-- Thêm dòng này (Lưu ý: biến tên là newReceiptLink)
      action: "👉 Kiểm tra ảnh cọc"
    });

    // 6. Trả về thông báo thành công
    return { 
      success: true, 
      message: "Yêu cầu nâng cấp của bạn đã được gửi thành công và đang chờ xác nhận." 
    };

  } catch (error) {
    Logger.log("Lỗi trong handleUpgradeSubmit: " + error.message + " Stack: " + error.stack);
    return { success: false, message: "Lỗi hệ thống: " + error.message };
  }
}
// THAY THẾ TOÀN BỘ HÀM handleSubmit CŨ

function handleSubmit(formData) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const dkySheet = ss.getSheetByName(SHEET_NAME);
    const lsSheet = ss.getSheetByName("LS_DangKy");

    if (!dkySheet || !lsSheet) {
      throw new Error("Không tìm thấy sheet DKy hoặc LS_DangKy.");
    }
    
    const normalizedPhone = normalizePhoneNumber(formData.phone); 
    if (!normalizedPhone) {
         return { success: false, message: "⚠️ Số điện thoại không hợp lệ." };
    }

    if (checkPhoneDuplicate(normalizedPhone) || checkEmailDuplicate(formData.email)) {
      return { success: false, message: "⚠️ Số điện thoại hoặc Email này đã được đăng ký!" };
    }

    const dkyHeaders = dkySheet.getRange(1, 1, 1, dkySheet.getLastColumn()).getValues()[0];
    const lsHeaders = lsSheet.getRange(1, 1, 1, lsSheet.getLastColumn()).getValues()[0];
    const newId = calculateNewId(dkySheet, dkyHeaders); // <<< Mã số mới được tạo ở đây
    const timestamp = new Date();

    let receiptLink = '';
    let statusDuyet = "Chờ thanh toán"; // Mặc định là chờ
    const paymentStatus = formData.paymentStatus; 

    // Nếu có file ảnh gửi lên luôn (Trường hợp khách vẫn chọn up ngay)
    if (formData.fileData) {
        receiptLink = uploadFileToDrive(formData.fileData, formData.fileName, formData.fileType, newId, formData.name);
        statusDuyet = "Đã duyệt tự động"; // Hoặc "Chờ duyệt" tùy bạn
    } else {
        // Nếu không có ảnh -> Ghi chú là chờ
        receiptLink = "Chờ bổ sung ảnh";
    }
    // -----------------------------------
    
    const courseInfo = _getCourseInfo(formData.courseCode);
    if (!courseInfo) { throw new Error(`Không tìm thấy thông tin cho mã khóa: ${formData.courseCode}`); }

    // 1. Ghi vào Lịch sử
    const lsData = {
      "Dấu thời gian": timestamp, "MÃ CODE": newId, "Họ và tên": formData.name,
      "Lớp ĐK mới": courseInfo.topic, "Khóa ĐK mới": courseInfo.name, "Mã lớp mới": courseInfo.code, 
      "Phí cọc mới": (paymentStatus === "Miễn phí") ? 0 : courseInfo.depositFee,
      "Link ảnh cọc mới": receiptLink, "Trạng thái duyệt": statusDuyet
    };
    const lsRowData = lsHeaders.map(header => lsData[header] || ''); 
    lsSheet.appendRow(lsRowData);

    // 2. Ghi vào sheet DKy (Giữ nguyên logic cũ, chỉ thay đổi receiptLink)
    let finalReferrerId = formData.referrerId || (formData.network ? formData.network.toString().split('-')[0].trim() : "");
    let referrerName = "";
    if (finalReferrerId) {
        const referrerInfo = findUserInfoByCode(finalReferrerId, dkySheet, dkyHeaders);
        if (referrerInfo) { referrerName = referrerInfo.name; }
    }
    const affiliateLink = CUSTOM_AFFILIATE_DOMAIN + newId;
    const dkyData = {
      "MÃ CODE": "'" + newId, "Dấu thời gian": timestamp, "Họ và tên": formData.name.toUpperCase(),
      "Mã giới thiệu": finalReferrerId, "Người giới thiệu": referrerName, 
      "Số điện thoại": "'" + normalizedPhone, 
      "Địa chỉ email": formData.email, "Lớp đăng ký": courseInfo.topic, "Khoá đăng ký": courseInfo.name,
      "Mã lớp": courseInfo.code, "Cam kết khi tham gia": formData.commitment, 
      "Trạng thái cọc": paymentStatus, 
      "Link ảnh cọc": receiptLink, "Link Affiliate": affiliateLink, "Số lượt giới thiệu": 0
    };
    const dkyRowData = dkyHeaders.map(header => dkyData[header] !== undefined ? dkyData[header] : '');
    dkySheet.appendRow(dkyRowData);

    // 3. Ghi vào HV86 (Nếu cần - Giữ nguyên)
    if (formData.courseCode === '86D') { _addStudentToHV86Sheet(dkyData); }

    // 4. Gửi email: Tách logic, nếu chưa có ảnh thì gửi email "Nhắc thanh toán", có rồi thì "Welcome"
    // (Ở đây để đơn giản tôi giữ nguyên sendMasterWelcomeEmail, bạn có thể custom lại sau)
    try {
        sendMasterWelcomeEmail(
          formData.name, formData.email, newId, 
          courseInfo.topic, courseInfo.name, 
          courseInfo.startDate, affiliateLink, courseInfo.zaloLink, courseInfo.emailContent, true 
        );
    } catch(e) { Logger.log("Lỗi gửi mail: " + e.message); }
    
    sendToTelegram("CÓ ĐĂNG KÝ MỚI!", {
      code: newId,
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      courseInfo: courseInfo.name,
      //imageLink: receiptLink, // <-- Thêm dòng này (biến receiptLink đã có sẵn ở trên)
      action: "⚠️ Chưa gửi ảnh cọc"
    });

    // --- QUAN TRỌNG: TRẢ VỀ THÔNG TIN ĐỂ HIỆN QR ---
    return { 
      success: true, 
      newId: newId,
      studentName: formData.name, // Trả về tên để hiển thị
      qrInfo: { // Trả về thông tin QR
          link: courseInfo.qrLink,
          amount: courseInfo.depositFee,
          content: courseInfo.paymentContent,
          stk: courseInfo.stk,
          bank: courseInfo.nganHang,
          stk: courseInfo.stk,           
          bank: courseInfo.nganHang,
          accountName: courseInfo.tenChuTK
      },
      zaloLink: courseInfo.zaloLink,
      courseChoice: formData.courseChoice      
    };

  } catch (error) {
    Logger.log("Lỗi trong handleSubmit: " + error.message);
    return { success: false, message: "Lỗi hệ thống: " + error.message };
  }
}
function updatePaymentEvidence(studentCode, fileData, fileName, fileType) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const dkySheet = ss.getSheetByName(SHEET_NAME);
    const lsSheet = ss.getSheetByName("LS_DangKy");
    const khSheet = ss.getSheetByName("KH"); 

    // 1. Upload ảnh lên Drive
    const receiptLink = uploadFileToDrive(fileData, fileName, fileType, studentCode, "BoSung_SauDK");

    let foundCourseCode = ""; 
    let zaloGroupLink = "";
    
    // Khởi tạo biến để lưu Tên và SĐT tìm được
    let foundName = "Chưa cập nhật";
    let foundPhone = "Chưa cập nhật";

    // --- 2. XỬ LÝ SHEET ĐĂNG KÝ (DKy) ---
    const dkyHeaders = dkySheet.getRange(1, 1, 1, dkySheet.getLastColumn()).getValues()[0];
    const codeColIndex = dkyHeaders.indexOf("MÃ CODE");
    const linkColIndex = dkyHeaders.indexOf("Link ảnh cọc");
    const depositStatusColIndex = dkyHeaders.indexOf("Trạng thái cọc");
    
    // Lấy chỉ số cột Tên và SĐT
    const nameColIndex = dkyHeaders.indexOf("Họ và tên");
    const phoneColIndex = dkyHeaders.indexOf("Số điện thoại");

    let courseCodeColIndex = dkyHeaders.indexOf("Mã Lớp");
    if (courseCodeColIndex === -1) courseCodeColIndex = dkyHeaders.indexOf("Mã lớp");
    if (courseCodeColIndex === -1) courseCodeColIndex = dkyHeaders.indexOf("Mã khóa");

    const data = dkySheet.getDataRange().getValues();
    
    // Duyệt tìm học viên
    for (let i = 1; i < data.length; i++) {
        // So sánh Mã code (cắt bỏ ký tự ' nếu có)
        if (String(data[i][codeColIndex]).replace("'","").trim() == String(studentCode).trim()) {
            
            // Cập nhật link ảnh vào sheet
            dkySheet.getRange(i + 1, linkColIndex + 1).setValue(receiptLink);
            
            if (depositStatusColIndex > -1) {
                 dkySheet.getRange(i + 1, depositStatusColIndex + 1).setValue("Đã chuyển phí (Bổ sung ảnh)");
            }
            
            // Lấy Mã lớp
            if (courseCodeColIndex > -1) {
                foundCourseCode = data[i][courseCodeColIndex];
            }

            // --- [QUAN TRỌNG] LẤY TÊN VÀ SĐT RA ---
            if (nameColIndex > -1) foundName = data[i][nameColIndex];
            if (phoneColIndex > -1) foundPhone = data[i][phoneColIndex];
            // --------------------------------------

            break; // Tìm thấy rồi thì dừng vòng lặp
        }
    }

    // --- 3. CẬP NHẬT SHEET LỊCH SỬ (LS_DangKy) ---
    const lsHeaders = lsSheet.getRange(1, 1, 1, lsSheet.getLastColumn()).getValues()[0];
    const lsCodeCol = lsHeaders.indexOf("MÃ CODE");
    const lsLinkCol = lsHeaders.indexOf("Link ảnh cọc mới");
    const lsStatusCol = lsHeaders.indexOf("Trạng thái duyệt");
    
    const lsData = lsSheet.getDataRange().getValues();
    for (let i = lsData.length - 1; i >= 1; i--) {
        if (String(lsData[i][lsCodeCol]).replace("'","").trim() == String(studentCode).trim()) {
             lsSheet.getRange(i + 1, lsLinkCol + 1).setValue(receiptLink);
             lsSheet.getRange(i + 1, lsStatusCol + 1).setValue("Đã bổ sung ảnh (Chờ duyệt)");
             break;
        }
    }

    // --- 4. TÌM LINK ZALO ---
    if (foundCourseCode && khSheet) {
        const khData = khSheet.getDataRange().getValues();
        const khHeaders = khData[0];
        const khCodeIdx = khHeaders.indexOf("Mã khóa");       
        const khZaloIdx = khHeaders.indexOf("Link Zalo"); 
        if (khCodeIdx > -1 && khZaloIdx > -1) {
            for (let k = 1; k < khData.length; k++) {
                let codeInSheet = String(khData[k][khCodeIdx]).trim();
                let codeLookingFor = String(foundCourseCode).trim();
                if (codeInSheet.toUpperCase() === codeLookingFor.toUpperCase()) {
                    zaloGroupLink = khData[k][khZaloIdx];
                    break;
                }
            }
        }
    }
    if (!zaloGroupLink) { zaloGroupLink = "https://zalo.me/0876473257"; }

    // --- 5. GỬI THÔNG BÁO TELEGRAM ---
    sendToTelegram("KHÁCH ĐÃ NỘP ẢNH CỌC", {
      code: studentCode,
      name: foundName,
      phone: foundPhone,
      courseInfo: foundCourseCode || "Đang tra cứu",
      
      imageLink: receiptLink, // <--- BIẾN NÀY CHỨA LINK ẢNH, QUAN TRỌNG NHẤT
      
      action: "👉 Kiểm tra ảnh cọc và duyệt đơn"
    });

    return { success: true, zaloGroupLink: zaloGroupLink };

  } catch (e) {
      Logger.log("🔥 LỖI CRITICAL: " + e.message);
      return { success: false, message: e.message };
  }
}
// --- HÀM MỚI: KIỂM TRA ĐƠN ĐANG TREO (PENDING) ---
function checkPendingRegistration(phone) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const dkySheet = ss.getSheetByName(SHEET_NAME);
    if (!dkySheet) return { found: false };

    const data = dkySheet.getDataRange().getValues();
    const headers = data[0];
    
    // Map tên cột để tìm cho chuẩn
    const colMap = {};
    headers.forEach((h, i) => colMap[h.trim()] = i);

    // Chuẩn hóa SĐT đầu vào
    const inputPhone = normalizePhoneNumber(phone); 

    // Duyệt ngược từ dưới lên (lấy đơn mới nhất)
    for (let i = data.length - 1; i >= 1; i--) {
      const row = data[i];
      const sheetPhone = String(row[colMap["Số điện thoại"]] || "").replace(/'/g, "");
      
      // So sánh SĐT
      if (normalizePhoneNumber(sheetPhone) === inputPhone) {
        
        // Kiểm tra trạng thái cọc
        const statusCoc = String(row[colMap["Trạng thái cọc"]] || "").toLowerCase();
        
        // Nếu trạng thái là "chờ" hoặc chưa có gì -> Cho phép nộp tiếp
        if (statusCoc.includes("chờ") || statusCoc === "") {
            
            // Lấy thông tin khóa học để hiện lại QR
            const courseCode = row[colMap["Mã lớp"]] || row[colMap["Mã khóa"]]; // Dự phòng cả 2 tên cột
            const courseInfo = _getCourseInfo(courseCode); // Hàm lấy thông tin khóa học bạn đã có
            
            return {
                found: true,
                canResume: true,
                studentName: row[colMap["Họ và tên"]],
                newId: String(row[colMap["MÃ CODE"]]).replace("'", ""),
                
                // Trả về thông tin để render lại màn hình thanh toán
                qrInfo: courseInfo ? {
                    link: courseInfo.qrLink,
                    amount: courseInfo.depositFee,
                    content: courseInfo.paymentContent,
                    bank: courseInfo.nganHang,
                    stk: courseInfo.stk,
                    accountName: courseInfo.tenChuTK
                } : null,
                zaloLink: courseInfo ? courseInfo.zaloLink : ""
            };
        } else {
            // Đã thanh toán rồi -> Báo duplicate như bình thường
            return { found: true, canResume: false };
        }
      }
    }
    return { found: false }; // SĐT chưa từng đăng ký

  } catch (e) {
    Logger.log("Lỗi checkPending: " + e.message);
    return { found: false };
  }
}
// --- HÀM MỚI: KIỂM TRA PENDING BẰNG EMAIL ---
function checkPendingRegistrationByEmail(email) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const dkySheet = ss.getSheetByName(SHEET_NAME);
    if (!dkySheet) return { found: false };

    const data = dkySheet.getDataRange().getValues();
    const headers = data[0];
    const colMap = {};
    headers.forEach((h, i) => colMap[h.trim()] = i);

    const inputEmail = String(email).trim().toLowerCase();
    const emailColIdx = colMap["Địa chỉ email"]; // Đảm bảo tên cột trong Sheet đúng là "Địa chỉ email"

    if (emailColIdx === undefined) return { found: false };

    // Duyệt ngược từ dưới lên để lấy đơn mới nhất
    for (let i = data.length - 1; i >= 1; i--) {
      const row = data[i];
      const sheetEmail = String(row[emailColIdx] || "").trim().toLowerCase();
      
      if (sheetEmail === inputEmail) {
        // Kiểm tra trạng thái cọc
        const statusCoc = String(row[colMap["Trạng thái cọc"]] || "").toLowerCase();
        
        // Nếu đang CHỜ -> Cho phép Resume
        if (statusCoc.includes("chờ") || statusCoc === "") {
            const courseCode = row[colMap["Mã lớp"]] || row[colMap["Mã khóa"]];
            const courseInfo = _getCourseInfo(courseCode);
            
            return {
                found: true,
                canResume: true,
                studentName: row[colMap["Họ và tên"]],
                newId: String(row[colMap["MÃ CODE"]]).replace("'", ""),
                qrInfo: courseInfo ? {
                    link: courseInfo.qrLink,
                    amount: courseInfo.depositFee,
                    content: courseInfo.paymentContent,
                    bank: courseInfo.nganHang,
                    stk: courseInfo.stk,
                    accountName: courseInfo.tenChuTK
                } : null,
                zaloLink: courseInfo ? courseInfo.zaloLink : ""
            };
        } else {
            // Đã xong -> Báo trùng
            return { found: true, canResume: false };
        }
      }
    }
    return { found: false };

  } catch (e) {
    Logger.log("Lỗi checkPendingEmail: " + e.message);
    return { found: false };
  }
}
// =================================================================
// PHẦN 3: CÁC HÀM PHỤ TRỢ
// =================================================================
/**
 * [HÀM MỚI] Kiểm tra xem email đã tồn tại trong sheet chưa.
 * @param {string} email - Email cần kiểm tra.
 * @returns {boolean} - Trả về true nếu email đã tồn tại.
 */
function checkEmailDuplicate(email) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return false;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const emailColumnIndex = headers.indexOf("Địa chỉ email");
  if (emailColumnIndex === -1) return false;

  const existingEmails = sheet.getRange(2, emailColumnIndex + 1, sheet.getLastRow() - 1, 1).getValues()
    .flat()
    .map(e => String(e).trim().toLowerCase());
    
  const submittedEmail = String(email).trim().toLowerCase();
  return existingEmails.includes(submittedEmail);
}
function _getCourseInfo(courseCode) {
  try {
    // 1. Kiểm tra đầu vào
    if (!courseCode) return null;
    const searchCode = String(courseCode).trim(); // Tìm chính xác mã gửi lên
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const courseSheet = ss.getSheetByName(COURSE_SHEET_NAME);
    if (!courseSheet) return null;

    const data = courseSheet.getDataRange().getValues();
    const headers = data.shift(); // Lấy hàng tiêu đề
    const headerMap = {};
    
    // Map tiêu đề về chữ thường để dễ tìm
    headers.forEach((h, i) => {
      headerMap[String(h).trim().toLowerCase()] = i;
    });

    // 2. Tìm vị trí cột "Mã khóa" (Chỉ cần cột này tồn tại là chạy được)
    const colCodeIndex = headerMap["mã khóa"]; 

    if (colCodeIndex === undefined) {
        Logger.log("Lỗi: Không tìm thấy cột 'Mã khóa'");
        return null;
    }

    // 3. Hàm lấy giá trị an toàn (Không bao giờ lỗi dù thiếu cột)
    const getValue = (row, colName) => {
        const idx = headerMap[colName.toLowerCase()];
        // Nếu cột đó có trong sheet thì lấy, không thì trả về rỗng ""
        return idx !== undefined ? row[idx] : "";
    };

    // 4. Duyệt tìm
    for (const row of data) {
      // Lấy mã trong sheet (So sánh linh hoạt không phân biệt hoa thường)
      const rowCode = String(row[colCodeIndex]).trim();
      
      if (rowCode.toUpperCase() === searchCode.toUpperCase()) {
        
        // Xử lý ngày tháng (nếu có)
        let dateStr = "";
        const rawDate = getValue(row, "ngày khai giảng");
        if (rawDate && rawDate instanceof Date) {
            dateStr = Utilities.formatDate(rawDate, Session.getScriptTimeZone(), "dd/MM/yyyy");
        } else if (rawDate) {
            dateStr = String(rawDate);
        }

        // Trả về dữ liệu (Thiếu cột nào thì để trống cột đó, không báo lỗi)
        return {
          code: rowCode, // Trả về mã gốc trong sheet
          topic: getValue(row, "tên lớp học"),
          name: getValue(row, "tên khóa học"),
          
          // Các trường mới (sẽ là chuỗi rỗng nếu chưa thêm cột vào sheet)
          startDate: dateStr,
          description: getValue(row, "mô tả ngắn"),
          
          // Các trường cũ
          zaloLink: getValue(row, "link zalo"),
          depositFee: getValue(row, "phí cọc"),
          qrLink: getValue(row, "link qr code"),    
          paymentContent: getValue(row, "nội dung ck"),
          emailContent: getValue(row, "nội dung email"),
          stk: getValue(row, "stk"),
          tenChuTK: getValue(row, "tên chủ tk"),
          nganHang: getValue(row, "ngân hàng")
        };
      }
    }
    return null; // Không tìm thấy mã

  } catch (e) {
    Logger.log("Lỗi _getCourseInfo: " + e.message);
    return null;
  }
}
/**
 * [HÀM TRỢ GIÚP ĐÃ NÂNG CẤP]
 * Ghi thông tin của một học viên vào sheet HV86, bao gồm cả thông tin giới thiệu.
 */
// THAY THẾ TOÀN BỘ HÀM _addStudentToHV86Sheet CŨ
function _addStudentToHV86Sheet(studentData) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const hv86Sheet = ss.getSheetByName(HV86_SHEET_NAME);
    if (!hv86Sheet) {
      Logger.log(`Cảnh báo: Không tìm thấy sheet "${HV86_SHEET_NAME}".`);
      return;
    }

    // Nếu sheet trống, tạo hàng tiêu đề mới đã được tinh gọn
    if (hv86Sheet.getLastRow() === 0) {
      hv86Sheet.appendRow(["MÃ CODE", "Họ và tên", "Ngày bắt đầu", "Link ảnh cọc"]);
    }
    const headers = hv86Sheet.getRange(1, 1, 1, hv86Sheet.getLastColumn()).getValues()[0];
    
    // [ĐÃ SỬA] - Chỉ lấy các trường dữ liệu cần thiết
    const hv86Data = {
      "MÃ CODE": String(studentData["MÃ CODE"] || studentData.code || '').replace("'", ""),
      "Họ và tên": studentData["Họ và tên"] || studentData.name,
      "Ngày bắt đầu": studentData["Ngày bắt đầu"] || new Date(),
      "Link ảnh cọc": studentData["Link ảnh cọc"]
    };

    const rowData = headers.map(header => hv86Data[header] !== undefined ? hv86Data[header] : '');
    hv86Sheet.appendRow(rowData);
    Logger.log(`Đã thêm HV ${hv86Data["Họ và tên"]} vào sheet ${HV86_SHEET_NAME}.`);

  } catch (e) {
    Logger.log(`Lỗi khi ghi vào sheet ${HV86_SHEET_NAME}: ${e.message}`);
  }
}

function uploadFileToDrive(base64Data, fileName, fileType, newId, userName) {
  const folder = DriveApp.getFolderById(DEPOSIT_RECEIPT_FOLDER_ID);
  const decodedData = Utilities.base64Decode(base64Data);
  const blob = Utilities.newBlob(decodedData, fileType, fileName);
  const newFileName = `${newId}_${userName}_${fileName}`;
  const file = folder.createFile(blob);
  file.setName(newFileName);
  return file.getUrl();
}
/**
 * [HÀM ĐÃ ĐỔI TÊN VÀ NÂNG CẤP]
 * Tìm thông tin người dùng theo MÃ CODE, lấy thêm cả trạng thái lớp học.
 */
// THAY THẾ TOÀN BỘ HÀM findUserInfoByCode CŨ
// THAY THẾ TOÀN BỘ HÀM findUserInfoByCode CŨ
function findUserInfoByCode(userCode, sheet, headers) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;

  const headerMap = {};
  headers.forEach((h, i) => headerMap[h] = i);
  
  const data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  const codeToFind = parseInt(userCode, 10);
  if (isNaN(codeToFind)) return null;

  for (let i = 0; i < data.length; i++) {
    const rowData = data[i];
    const codeInSheet = parseInt(rowData[headerMap["MÃ CODE"]], 10);
    
    if (codeInSheet === codeToFind) {
      const studentInfo = {
        name: rowData[headerMap["Họ và tên"]],
        phone: normalizePhoneNumber(rowData[headerMap["Số điện thoại"]]),
        email: rowData[headerMap["Địa chỉ email"]],
        row: i + 2,
        classStatus: rowData[headerMap["Lớp đăng ký"]] || "",
        course: rowData[headerMap["Khoá đăng ký"]] || "",
        affiliateLink: rowData[headerMap["Link Affiliate"]] || "",
        code: userCode,
        referrerId: rowData[headerMap["Mã giới thiệu"]],
        referrerName: rowData[headerMap["Người giới thiệu"]],
        registeredCourseTopics: [],
        hasPendingUpgrade: false // [NÂNG CẤP] Thêm thuộc tính mới, mặc định là false
      };

      const lsSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("LS_DangKy");
      const lsData = lsSheet.getDataRange().getValues();
      const lsHeaders = lsData.shift();
      const lsHeaderMap = {};
      lsHeaders.forEach((h, i) => lsHeaderMap[h] = i);

      const registeredTopics = new Set();
      for (const lsRow of lsData) {
        if (String(lsRow[lsHeaderMap["MÃ CODE"]]).trim() === userCode) {
            const topicName = String(lsRow[lsHeaderMap["Lớp ĐK mới"]]).trim();
            const status = String(lsRow[lsHeaderMap["Trạng thái duyệt"]]).toLowerCase();

            if (topicName) {
                if (status.includes("duyệt")) {
                    registeredTopics.add(topicName);
                }
                // [NÂNG CẤP] Kiểm tra nếu có yêu cầu nâng cấp "86 ngày" đang chờ duyệt
                if (status.includes("chờ duyệt") && topicName.toLowerCase().includes("86 ngày")) {
                    studentInfo.hasPendingUpgrade = true;
                }
            }
        }
      }
      
      if (studentInfo.classStatus) {
        registeredTopics.add(studentInfo.classStatus.trim());
      }

      studentInfo.registeredCourseTopics = Array.from(registeredTopics);
      return studentInfo;
    }
  }
  return null;
}
function findReferrerInfo(referrerId, sheet, headers) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  const codeColIndex = headers.indexOf("MÃ CODE");
  const nameColIndex = headers.indexOf("Họ và tên");
  const phoneColIndex = headers.indexOf("Số điện thoại");

  if (codeColIndex === -1 || nameColIndex === -1 || phoneColIndex === -1) {
    throw new Error("Không tìm thấy một trong các cột bắt buộc: 'MÃ CODE', 'Họ và tên', 'Số điện thoại'.");
  }
  const data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  const codeFromUrl = parseInt(referrerId, 10);
  if (isNaN(codeFromUrl)) {
    return null;
  }
  for (let i = 0; i < data.length; i++) {
    const codeInSheet = parseInt(data[i][codeColIndex], 10);
    if (codeInSheet === codeFromUrl) {
      const normalizedPhone = String(data[i][phoneColIndex]).replace(/'/g, '');
      return { name: data[i][nameColIndex], phone: normalizedPhone, row: i + 2 };
    }
  }
  return null;
}

function recalculateAllReferralCounts() {
  Logger.log("Bắt đầu tính toán lại số lượt giới thiệu...");
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) {
    Logger.log(`Lỗi: Không tìm thấy sheet có tên "${SHEET_NAME}". Dừng thao tác.`);
    return;
  }
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    Logger.log("Không có dữ liệu để tính toán. Dừng thao tác.");
    return;
  }
  const dataRange = sheet.getRange(1, 1, lastRow, sheet.getLastColumn());
  const allData = dataRange.getValues();
  const headers = allData[0];
  const referrerIdColIndex = headers.indexOf("Mã giới thiệu");
  const userCodeColIndex = headers.indexOf("MÃ CODE");
  const referralCountColIndex = headers.indexOf("Số lượt giới thiệu");
  if (referrerIdColIndex === -1 || userCodeColIndex === -1 || referralCountColIndex === -1) {
    Logger.log("Lỗi: Không tìm thấy một trong các cột cần thiết. Dừng thao tác.");
    return;
  }
  const referralCounts = {};
  for (let i = 1; i < allData.length; i++) {
    const rawValue = allData[i][referrerIdColIndex];
    if (rawValue !== null && rawValue !== "") {
      const trimmedValue = String(rawValue).trim();
      const parsedId = parseInt(trimmedValue, 10);
      if (!isNaN(parsedId)) {
        referralCounts[parsedId] = (referralCounts[parsedId] || 0) + 1;
      }
    }
  }
  const newCountsColumn = [];
  for (let i = 1; i < allData.length; i++) {
    const userCode = parseInt(allData[i][userCodeColIndex], 10);
    const count = referralCounts[userCode] || 0;
    newCountsColumn.push([count]);
  }
  const targetRange = sheet.getRange(2, referralCountColIndex + 1, newCountsColumn.length, 1);
  targetRange.setValues(newCountsColumn);
  SpreadsheetApp.flush();
  Logger.log(`Hoàn tất! Đã cập nhật lại thành công số lượt giới thiệu cho ${newCountsColumn.length} dòng.`);
}

function fixMaCodeFormat() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) { Logger.log("Không tìm thấy sheet."); return; }
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) { Logger.log("Không có dữ liệu."); return; }
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const codeColIndex = headers.indexOf("MÃ CODE");
  if (codeColIndex === -1) { Logger.log("Không tìm thấy cột 'MÃ CODE'."); return; }
  const range = sheet.getRange(2, codeColIndex + 1, lastRow - 1, 1);
  range.setNumberFormat('@');
  SpreadsheetApp.flush();
  Logger.log("Hoàn tất! Đã chuyển đổi thành công cột 'MÃ CODE' sang định dạng Văn bản.");
}

function calculateNewId(sheet, headers) {
  let newId = 1;
  const lastRow = sheet.getLastRow();
  const idColumnIndex = headers.indexOf("MÃ CODE");

  // 🔑 Danh sách mã đặc biệt cần bỏ qua
  const specialCodes = [8286, 9999, 7777];  

  if (idColumnIndex !== -1 && lastRow > 1) {
    const idValues = sheet
      .getRange(2, idColumnIndex + 1, lastRow - 1, 1)
      .getValues()
      .flat();

    // Chỉ giữ lại những mã không nằm trong danh sách đặc biệt
    const normalIds = idValues
      .map(val => parseInt(val, 10))
      .filter(num => !isNaN(num) && !specialCodes.includes(num));

    const maxId = normalIds.length > 0 ? Math.max(...normalIds) : 0;

    newId = maxId + 1;
  }
  return newId;
}


function checkPhoneDuplicate(phone) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return false;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const phoneColumnIndex = headers.indexOf("Số điện thoại");
  if (phoneColumnIndex === -1) return false;
  const existingPhonesRaw = sheet.getRange(2, phoneColumnIndex + 1, sheet.getLastRow() - 1, 1).getValues().flat();
  const existingPhonesNormalized = existingPhonesRaw.map(p => normalizePhoneNumber(p));
  const submittedPhoneNormalized = normalizePhoneNumber(phone);
  return existingPhonesNormalized.includes(submittedPhoneNormalized);
}

function normalizePhoneNumber(rawPhone) {
  if (!rawPhone) return '';
  let phone = String(rawPhone).replace(/[^\d+]/g, ""); // Giữ lại số và dấu +

  // 1. Chuẩn hóa SĐT Việt Nam (ưu tiên)
  if (phone.startsWith('0') && phone.length >= 10 && phone.length <= 11) { // SĐT VN thường 10 hoặc 11 số (kể cả 0)
    phone = '+84' + phone.substring(1);
  } 
  // 2. Xử lý trường hợp nhập 84... (thiếu +)
  else if (phone.startsWith('84') && phone.length >= 11 && phone.length <= 12 && !phone.startsWith('+')) {
     phone = '+' + phone;
  }
  // 3. Xử lý trường hợp có thể đã có dấu +
  else if (!phone.startsWith('+') && phone.length >= 9) { 
      // Không tự động thêm '+' cho các số không rõ nguồn gốc
      // Nếu bạn muốn ép buộc thêm '+' cho mọi số không bắt đầu bằng '+', hãy thêm dòng: phone = '+' + phone;
      // Nhưng điều này có thể không chính xác cho SĐT quốc gia khác nếu nhập thiếu mã quốc gia
      // Hiện tại: chỉ chuẩn hóa VN hoặc giữ nguyên nếu đã có +
  }

   // 4. Loại bỏ dấu + thừa (ví dụ: ++84...)
   if (phone.startsWith('++')) {
        phone = phone.substring(1);
   }

   // 5. Kiểm tra định dạng cuối cùng cơ bản
   const pattern = /^\+\d{7,15}$/; 
   if (pattern.test(phone)) {
       return phone;
   } else {
       Logger.log("Số điện thoại không hợp lệ sau khi chuẩn hóa: " + rawPhone + " -> " + phone);
       return ""; // Trả về rỗng nếu cuối cùng vẫn không hợp lệ
   }
}

/**
 * [HÀM ĐÃ HOÀN THIỆN] Gửi email đăng ký KÈM MÃ QR.
 */
// HÀM GỬI EMAIL ĐA NĂNG MỚI
function sendMasterWelcomeEmail(name, email, code, classTopic, courseName, startDate, affiliateLink, zaloLink, courseContent, isNewStudent) {
  try {
    // --- BƯỚC GỠ LỖI ---
    Logger.log("--- BẮT ĐẦU GỠ LỖI EMAIL ---");
    Logger.log("1. Dữ liệu đọc trực tiếp từ Sheet (biến courseContent):");
    Logger.log(courseContent);
    // --------------------
    const subject = `Chúc mừng ${name} đã đăng ký thành công lớp học ${classTopic}!`;
    const template = HtmlService.createTemplateFromFile('email_master_welcome.html');
    template.name = name;
    template.code = code;
    template.classTopic = classTopic;
    template.courseName = courseName;
    template.startDate = startDate; // [MỚI] Truyền ngày khai giảng sang HTML
    template.courseContent = courseContent;
    template.affiliateLink = affiliateLink;
    template.zaloLink = zaloLink;
    template.isNewStudent = isNewStudent;

    let attachments = [];
    let inlineImages = {};

    // Chỉ tạo Chứng nhận cho học viên mới
    if (isNewStudent) {
        const copy = DriveApp.getFileById(EMAIL_TEMPLATE_ID).makeCopy(`ChungNhan_${code}_${name}`);
        const slide = SlidesApp.openById(copy.getId());
        slide.getSlides()[0].replaceAllText('{{name}}', name.toUpperCase());
        slide.getSlides()[0].replaceAllText('{{code}}', code);
        slide.saveAndClose();
        const pdf = copy.getAs('application/pdf').setName(`ChungNhan_${code}_${name}.pdf`);
        attachments.push(pdf);
        copy.setTrashed(true);
    }
    
    // Luôn tạo QR Code
    try {
        const encodedLink = encodeURIComponent(affiliateLink);
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodedLink}`;
        const response = UrlFetchApp.fetch(qrApiUrl);
        if (response.getResponseCode() == 200) {
            inlineImages['qrImage'] = response.getBlob();
        }
    } catch (err) {
        Logger.log(`Không thể tạo mã QR cho ${name}: ${err.message}`);
    }

    const htmlBody = template.evaluate().getContent();

      // --- BƯỚC GỠ LỖI ---
    Logger.log("2. Nội dung HTML cuối cùng trước khi gửi (biến htmlBody):");
    Logger.log(htmlBody);
    Logger.log("--- KẾT THÚC GỠ LỖI ---");
    // --------------------
    
    GmailApp.sendEmail(email, subject, "", {
      htmlBody: htmlBody,
      name: "BTC Dự Án BRK",
      attachments: attachments,
      inlineImages: inlineImages,
      charset: 'UTF-8' // <-- Dòng này sẽ sửa lỗi hiển thị ký tự
    });

  } catch (e) {
    Logger.log(`Lỗi khi gửi email đa năng cho ${name}: ${e.message}`);
  }
}

/**
 * [HÀM MỚI] Tạo menu tùy chỉnh trên giao diện Google Sheet.
 * Hàm này sẽ tự động chạy mỗi khi bạn mở file Sheet.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Công cụ Affiliate')
    .addItem('Tính lại số lượt giới thiệu', 'recalculateAllReferralCounts')
    .addSeparator()
    .addItem('Tạo & Lưu mã QR hàng loạt', 'generateAndSaveQRCodes')
    .addSeparator()
    .addItem('Tạo/Cập nhật Link Affiliate cho dữ liệu cũ', 'generateMissingAffiliateLinks')
    .addSeparator()
    .addItem('Gửi lại Email Chúc mừng', 'resendWelcomeEmail')
    .addSeparator()
    .addItem('Gửi email link aff hàng loạt', 'sendAffiliateLinksToOldUsers')
    .addSeparator()
    .addItem('Gửi email link aff riêng cho 1 mã', 'sendManualAffiliateEmail')
    .addSeparator()
    .addItem('Gửi test email cho hv cũ', 'sendTestAffiliateEmail')
    //.addSeparator()
    //.addItem('🔥 [CHẠY MỘT LẦN] Phục dựng lịch sử cũ', 'kiemTraLichSuHocVien')
    //.addSeparator()
    //.addItem('🔥 [ĐẠI TU] Phục dựng Dòng thời gian Hoàn chỉnh', 'phucDungDongThoiGianHoanChinh')
    //.addSeparator()
    
    .addToUi();
    // Tạo menu mới cho quản lý học viên
  SpreadsheetApp.getUi()
    .createMenu('Công cụ HV') 
    .addItem('Đăng ký Bảo lưu cho 1 HV', 'promptAndProcessBaoLuu') 
    .addSeparator()
    .addItem('Đăng ký Bảo lưu (Hàng loạt)', 'processBaoLuuBatch') 
    .addSeparator()
    .addItem('Xếp lớp 1 HV cũ', 'promptAndProcessReturnFromBaoLuu') 
    .addSeparator()
    .addItem('Xếp lớp HV cũ (Hàng loạt, cùng mã khóa)', 'promptAndProcessReturnBatch')
    .addSeparator()
    .addItem('⬇️ Hạ cấp HV khỏi CLB 5 Sao', 'haCapHocVien')
    .addSeparator()
    .addItem('📊 Tổng hợp Lịch sử HV (Timeline)', 'taoBaoCaoLichSuHocVien')
    .addSeparator()
    .addItem('💰 Xử lý Hoàn cọc (Từng người)', 'promptAndProcessRefund') 
    .addSeparator()
    .addItem('💰 Xử lý Hoàn cọc (HÀNG LOẠT)', 'processBatchRefund')   
    .addToUi();
  SpreadsheetApp.getUi()
  .createMenu('Công cụ Thống kê')
    .addItem('💎 Tìm HV Đăng ký thẳng VIP', 'baoCaoHocVienThangVIP')
    .addSeparator()
    .addItem('🌿 Báo cáo Tài chính NH (Chọn lớp)', 'menu_BaoCaoNH') 
    .addSeparator()
    .addItem('💰 Báo cáo Dòng tiền AF & KD (Chọn lớp)', 'menu_BaoCaoAFKD')
    .addSeparator()
    .addItem('🔴 Báo cáo Lớp LiveStream (Chọn lớp)', 'menu_BaoCaoLS')
    .addSeparator()
    .addItem('🟣 Báo cáo Quỹ VIP 86D (Chọn lớp trích)', 'menu_BaoCao86D')
    .addToUi();
    // Tạo menu mới cho quản lý học viên
  SpreadsheetApp.getUi()
  .createMenu('Công cụ Khác')
    .addItem('Chốt Danh sách Lớp sang DS HV GG Sheet', 'promptAndCreateFixedList') 
    .addSeparator()
    .addItem('Cập nhật "Chọn học viên" cho Form Nộp Bài LỚP BẢN ĐỒ', 'promptAndUpdateFixedForm') 
    .addSeparator()
    .addItem('Cập nhật Danh sách HV cho Form Nộp Bài Tùy chỉnh', 'promptAndUpdateFlexibleForm') 
    .addSeparator()
    .addItem('Cập nhật Ngày nộp cho Form LỚP BẢN ĐỒ', 'promptAndUpdateFixedDateText') 
    .addSeparator()
    .addItem('Cập nhật Ngày nộp cho Form Tùy chỉnh', 'promptAndUpdateFlexibleDateText') 
    .addToUi();
    
}

/**
 * Sử dụng một API tạo QR mới và đang hoạt động để tránh lỗi 404.
 */
function generateAndSaveQRCodes() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert("Xác nhận", "Hành động này sẽ tạo và lưu các file ảnh QR Code vào Google Drive, sau đó điền link vào cột 'Link Tải QR Code'. Quá trình có thể mất thời gian. Bạn có chắc chắn muốn tiếp tục?", ui.ButtonSet.YES_NO);
  if (response !== ui.Button.YES) {
    ui.alert("Đã hủy thao tác.");
    return;
  }

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) {
    ui.alert("Lỗi", `Không tìm thấy sheet có tên "${SHEET_NAME}".`, ui.ButtonSet.OK);
    return;
  }

  try {
    const qrFolder = DriveApp.getFolderById(QR_CODE_FOLDER_ID);
    
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      ui.alert("Thông báo", "Không có dữ liệu để tạo mã QR.", ui.ButtonSet.OK);
      return;
    }

    const dataRange = sheet.getRange(1, 1, lastRow, sheet.getLastColumn());
    const allData = dataRange.getValues();
    const headers = allData[0];

    const affiliateLinkColIndex = headers.indexOf("Link Affiliate");
    const userCodeColIndex = headers.indexOf("MÃ CODE");
    const nameColIndex = headers.indexOf("Họ và tên");
    const qrLinkColIndex = headers.indexOf("Link Tải QR Code");

    if ([affiliateLinkColIndex, qrLinkColIndex, userCodeColIndex, nameColIndex].includes(-1)) {
      ui.alert("Lỗi", "Không tìm thấy một trong các cột cần thiết: 'Link Affiliate', 'MÃ CODE', 'Họ và tên', 'Link Tải QR Code'.", ui.ButtonSet.OK);
      return;
    }
    
    const qrLinks = [];
    
    for (let i = 1; i < allData.length; i++) {
      const affiliateLink = allData[i][affiliateLinkColIndex];
      let fileUrl = ""; 

      if (affiliateLink && String(affiliateLink).trim() !== "") {
        try {
          const userCode = String(allData[i][userCodeColIndex]).replace("'", "");
          const name = allData[i][nameColIndex];
          const encodedLink = encodeURIComponent(affiliateLink);
          
          // [SỬA LỖI] Sử dụng link API mới của qrserver.com
          const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodedLink}`;
          
          const imageBlob = UrlFetchApp.fetch(qrApiUrl).getBlob();
          const fileName = `QR_Code_${userCode}_${name}.png`;
          const file = qrFolder.createFile(imageBlob).setName(fileName);
          fileUrl = file.getUrl();
        } catch (e) {
          Logger.log(`Lỗi khi tạo QR cho dòng ${i+1}: ${e.message}`);
          fileUrl = `Lỗi: ${e.message}`;
        }
      }
      qrLinks.push([fileUrl]);
    }

    const targetRange = sheet.getRange(2, qrLinkColIndex + 1, qrLinks.length, 1);
    targetRange.setValues(qrLinks);
    
    ui.alert("Hoàn tất!", `Đã tạo và lưu thành công mã QR cho ${qrLinks.length} dòng.`, ui.ButtonSet.OK);

  } catch (e) {
    Logger.log(`Lỗi nghiêm trọng: ${e.message}`);
    ui.alert("Lỗi nghiêm trọng", `Đã có lỗi xảy ra. Chi tiết: ${e.message}`, ui.ButtonSet.OK);
  }
}
/**
Gửi email hàng loạt chứa link affiliate cho người dùng cũ.
 */
function sendAffiliateLinksToOldUsers() {
  const ui = SpreadsheetApp.getUi();
  const promptResult = ui.prompt('Thiết lập Giới hạn Gửi', `Nhập số lượng email tối đa bạn muốn gửi lần này:`, ui.ButtonSet.OK_CANCEL);
  if (promptResult.getSelectedButton() !== ui.Button.OK) {
    ui.alert('Đã hủy thao tác.');
    return;
  }
  const batchSize = parseInt(promptResult.getResponseText(), 10) || 10;
  if (isNaN(batchSize) || batchSize <= 0) {
    ui.alert('Lỗi', 'Vui lòng nhập một con số hợp lệ lớn hơn 0.', ui.ButtonSet.OK);
    return;
  }
  const response = ui.alert("Xác nhận", `Bạn sắp gửi tối đa ${batchSize} email. Bạn có chắc chắn muốn tiếp tục?`, ui.ButtonSet.YES_NO);
  if (response !== ui.Button.YES) {
    ui.alert("Đã hủy thao tác.");
    return;
  }

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const dataRange = sheet.getDataRange();
  const allData = dataRange.getValues();
  const headers = allData.shift();

  const nameColIndex = headers.indexOf("Họ và tên");
  const emailColIndex = headers.indexOf("Địa chỉ email");
  const userCodeColIndex = headers.indexOf("MÃ CODE");
  const sentStatusColIndex = headers.indexOf("Email Giới thiệu Đã Gửi");

  if ([nameColIndex, emailColIndex, userCodeColIndex, sentStatusColIndex].includes(-1)) {
    ui.alert("Lỗi", "Không tìm thấy một trong các cột cần thiết.", ui.ButtonSet.OK);
    return;
  }
  
  let emailsSentCount = 0;
  
  for (let index = 0; index < allData.length; index++) {
    if (emailsSentCount >= batchSize) {
      break;
    }
    
    const row = allData[index];
    const sentStatus = row[sentStatusColIndex];
    const email = row[emailColIndex];
    
    if (email && String(email).includes('@') && sentStatus !== "Đã gửi") {
      const name = row[nameColIndex] || "bạn";
      const userCode = String(row[userCodeColIndex]).replace("'", "");
      const affiliateLink = CUSTOM_AFFILIATE_DOMAIN + userCode;
      
      let qrImageBlob = null;
      try {
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(affiliateLink)}`;
        qrImageBlob = UrlFetchApp.fetch(qrApiUrl).getBlob();
      } catch (e) {
        Logger.log(`Không thể tạo mã QR cho ${email}: ${e.message}`);
      }

      const inlineImages = qrImageBlob ? { 'qrImage': qrImageBlob } : {};

      const template = HtmlService.createTemplateFromFile('email_affiliate_invitation');
      template.name = name;
      template.affiliateLink = affiliateLink;
      template.hasQrCode = (qrImageBlob != null);
      const htmlBody = template.evaluate().getContent();
      
      const subject = `Zero 2 Hero: Bản đồ thành công cho kinh doanh online 2025`;

      try {
        GmailApp.sendEmail(email, subject, "", { htmlBody: htmlBody, name: "BTC Dự Án BRK", inlineImages: inlineImages });
        sheet.getRange(index + 2, sentStatusColIndex + 1).setValue("Đã gửi");
        emailsSentCount++;
        Utilities.sleep(5000); // Tạm dừng 5 giây
      } catch (e) {
        Logger.log(`Lỗi khi gửi email đến ${email}: ${e.message}`);
        sheet.getRange(index + 2, sentStatusColIndex + 1).setValue(`Lỗi`);
        if (e.message.includes("Service invoked too many times")) {
            // [SỬA LỖI] - Hiển thị đúng thông báo cảnh báo
            ui.alert("Cảnh báo", "Đã đạt đến hạn mức gửi email hàng ngày của Google. Vui lòng thử lại sau 24 giờ.", ui.ButtonSet.OK);
            return; // Dừng toàn bộ hàm
        }
      }
    }
  }
  ui.alert("Hoàn tất!", `Đã gửi thành công ${emailsSentCount} email.`, ui.ButtonSet.OK);
}

function resendWelcomeEmail() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt(
    'Gửi lại Email Chúc mừng',
    'Vui lòng nhập MÃ CODE của học viên:',
    ui.ButtonSet.OK_CANCEL);

  const button = result.getSelectedButton();
  const userCodeToFind = result.getResponseText();

  if (button !== ui.Button.OK || userCodeToFind === '') {
    ui.alert('Đã hủy thao tác.');
    return;
  }

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) {
    ui.alert("Lỗi", `Không tìm thấy sheet có tên "${SHEET_NAME}".`, ui.ButtonSet.OK);
    return;
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const studentData = findUserInfoByCode(userCodeToFind, sheet, headers);

  if (studentData) {
    // [LOGIC MỚI] - Thêm câu hỏi xác nhận
    const firstSendConfirmation = ui.alert(
      'Xác nhận loại email',
      'Đây có phải là lần gửi ĐẦU TIÊN cho học viên mới không (kèm Giấy chứng nhận)?\n\n- Chọn "Yes" nếu học viên gõ sai email và bạn muốn gửi lại lần đầu.\n- Chọn "No" nếu chỉ gửi lại thông thường (không kèm chứng nhận).',
      ui.ButtonSet.YES_NO
    );

    const isFirstSend = (firstSendConfirmation === ui.Button.YES); // isFirstSend sẽ là true nếu bạn bấm "Yes"

    const confirmation = ui.alert(
      'Xác nhận gửi',
      `Bạn sắp gửi lại email đến:\n\nTên: ${studentData.name}\nEmail: ${studentData.email}\nLoại email: ${isFirstSend ? 'Lần đầu (có chứng nhận)' : 'Gửi lại thông thường'}`,
      ui.ButtonSet.YES_NO
    );

    if (confirmation === ui.Button.YES) {
      try {
        if (String(studentData.classStatus).includes('86 ngày')) {
            // Trường hợp lớp 86 ngày, gửi email nâng cấp (không có chứng nhận)
            const subject = `Chúc mừng ${studentData.name} đã nâng cấp thành công Lộ trình 86 ngày!`;
            const template = HtmlService.createTemplateFromFile('email_upgrade_confirmation');
            template.name = studentData.name;
            template.affiliateLink = studentData.affiliateLink;

            let inlineImages = {};
            try {
                const encodedLink = encodeURIComponent(studentData.affiliateLink);
                const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedLink}`;
                const response = UrlFetchApp.fetch(qrApiUrl);
                if (response.getResponseCode() == 200) {
                    inlineImages['qrImage'] = response.getBlob();
                }
            } catch (err) { Logger.log(`Lỗi tạo QR: ${err.message}`); }
            
            template.qrImageBlob = inlineImages['qrImage'] ? true : false;
            const htmlBody = template.evaluate().getContent();
            GmailApp.sendEmail(studentData.email, subject, "", { htmlBody: htmlBody, name: "BTC Dự Án BRK", inlineImages: inlineImages });

        } else {
            // Trường hợp lớp ngắn ngày
            const courseInfo = _getCourseInfoByCourseName(studentData.course);
            if (!courseInfo) {
                throw new Error(`Không tìm thấy thông tin cho khóa học "${studentData.course}".`);
            }
            
            sendMasterWelcomeEmail(
                studentData.name,
                studentData.email,
                studentData.code,
                studentData.classStatus,
                studentData.course,
                courseInfo.startDate,
                studentData.affiliateLink,
                courseInfo.zaloLink,
                courseInfo.emailContent,
                isFirstSend // <-- Truyền vào lựa chọn của bạn
            );
        }
        
        ui.alert('Thành công!', `Đã gửi lại email đến ${studentData.name} (${studentData.email}).`, ui.ButtonSet.OK);

      } catch (e) {
        Logger.log(`Lỗi khi gửi lại email: ${e.message}`);
        ui.alert('Thất bại', `Đã có lỗi xảy ra: ${e.message}`, ui.ButtonSet.OK);
      }
    } else {
      ui.alert('Đã hủy thao tác.');
    }
  } else {
    ui.alert('Không tìm thấy', `Không tìm thấy học viên nào có MÃ CODE là "${userCodeToFind}".`, ui.ButtonSet.OK);
  }
}
/**
 * Gửi một email affiliate duy nhất để kiểm tra, có kèm mã QR.
 */
function sendTestAffiliateEmail() {
  const ui = SpreadsheetApp.getUi();
  
  const emailResult = ui.prompt(
    'Gửi Email Test',
    'Vui lòng nhập địa chỉ email bạn muốn gửi đến:',
    ui.ButtonSet.OK_CANCEL);

  if (emailResult.getSelectedButton() !== ui.Button.OK || emailResult.getResponseText() === '') {
    ui.alert('Đã hủy thao tác.');
    return;
  }
  const testEmail = emailResult.getResponseText().trim();

  const codeResult = ui.prompt(
    'Gửi Email Test',
    'Nhập một MÃ CODE ví dụ để tạo link (ví dụ: 123):',
    ui.ButtonSet.OK_CANCEL);

  if (codeResult.getSelectedButton() !== ui.Button.OK || codeResult.getResponseText() === '') {
    ui.alert('Đã hủy thao tác.');
    return;
  }
  const testCode = codeResult.getResponseText().trim();
  const testName = "Thành viên Mẫu"; // Dùng tên mẫu
  const affiliateLink = CUSTOM_AFFILIATE_DOMAIN + testCode;

  // Tạo mã QR
  let qrImageBlob = null;
  try {
    const encodedLink = encodeURIComponent(affiliateLink);
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedLink}`;
    qrImageBlob = UrlFetchApp.fetch(qrApiUrl).getBlob();
  } catch (e) {
    Logger.log(`Không thể tạo mã QR cho link test: ${e.message}`);
  }

  const inlineImages = {};
  if (qrImageBlob) {
    inlineImages['qrImage'] = qrImageBlob;
  }

// [THAY ĐỔI] - Sử dụng file template
  const template = HtmlService.createTemplateFromFile('email_affiliate_invitation');
  template.name = testName;
  template.affiliateLink = affiliateLink;
  template.hasQrCode = (qrImageBlob != null);
  const htmlBody = template.evaluate().getContent();

  const subject = `[TEST] Link giới thiệu cá nhân của bạn đã sẵn sàng!`;

  try {
    GmailApp.sendEmail(testEmail, subject, "", { htmlBody: htmlBody, name: "BTC Dự Án BRK", inlineImages: inlineImages });
    ui.alert('Thành công!', `Đã gửi email test đến ${testEmail}.`, ui.ButtonSet.OK);
  } catch (e) {
    Logger.log(`Lỗi khi gửi email test: ${e.message}`);
    ui.alert('Thất bại', `Đã có lỗi xảy ra: ${e.message}`, ui.ButtonSet.OK);
  }
}
/**
 * [HÀM MỚI] Gửi email mời giới thiệu (giống email cho người cũ) đến một người dùng cụ thể.
 */
function sendManualAffiliateEmail() {
  const ui = SpreadsheetApp.getUi();
  
  const codeResult = ui.prompt(
    'Gửi Email Mời Giới thiệu',
    'Vui lòng nhập MÃ CODE của học viên bạn muốn gửi email:',
    ui.ButtonSet.OK_CANCEL);

  if (codeResult.getSelectedButton() !== ui.Button.OK || codeResult.getResponseText() === '') {
    ui.alert('Đã hủy thao tác.');
    return;
  }
  const userCodeToFind = codeResult.getResponseText().trim();

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) {
    ui.alert("Lỗi", `Không tìm thấy sheet có tên "${SHEET_NAME}".`, ui.ButtonSet.OK);
    return;
  }
  
  const dataRange = sheet.getDataRange();
  const allData = dataRange.getValues();
  const headers = allData[0];
  const rows = allData.slice(1);

  const userCodeColIndex = headers.indexOf("MÃ CODE");
  const nameColIndex = headers.indexOf("Họ và tên");
  const emailColIndex = headers.indexOf("Địa chỉ email");
  
  if ([userCodeColIndex, nameColIndex, emailColIndex].includes(-1)) {
    ui.alert("Lỗi", "Thiếu một trong các cột cần thiết: MÃ CODE, Họ và tên, Địa chỉ email.", ui.ButtonSet.OK);
    return;
  }

  let studentData = null;
  for (const row of rows) {
    if (parseInt(row[userCodeColIndex], 10) === parseInt(userCodeToFind, 10)) {
      studentData = {
        name: row[nameColIndex],
        email: row[emailColIndex],
        code: userCodeToFind
      };
      break;
    }
  }

  if (studentData) {
    const confirmation = ui.alert(
      'Xác nhận gửi',
      `Bạn sắp gửi email mời giới thiệu đến:\n\nTên: ${studentData.name}\nEmail: ${studentData.email}\n\nBạn có chắc chắn muốn tiếp tục?`,
      ui.ButtonSet.YES_NO
    );

    if (confirmation === ui.Button.YES) {
      try {
        const affiliateLink = CUSTOM_AFFILIATE_DOMAIN + studentData.code;
        
        let qrImageBlob = null;
        try {
          const encodedLink = encodeURIComponent(affiliateLink);
          const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedLink}`;
          qrImageBlob = UrlFetchApp.fetch(qrApiUrl).getBlob();
        } catch (e) {
          Logger.log(`Không thể tạo mã QR cho ${studentData.email}: ${e.message}`);
        }

        const inlineImages = {};
        if (qrImageBlob) {
          inlineImages['qrImage'] = qrImageBlob;
        }
        
        // [THAY ĐỔI] - Sử dụng file template
        const template = HtmlService.createTemplateFromFile('email_affiliate_invitation');
        template.name = studentData.name;
        template.affiliateLink = affiliateLink;
        template.hasQrCode = (qrImageBlob != null);
        const htmlBody = template.evaluate().getContent();

        const subject = `Zero 2 Hero: Bản đồ thành công cho kinh doanh online 2025`;
        GmailApp.sendEmail(studentData.email, subject, "", { htmlBody: htmlBody, name: "BTC Dự Án BRK", inlineImages: inlineImages });
        
        ui.alert('Thành công!', `Đã gửi email mời giới thiệu đến ${studentData.name} (${studentData.email}).`, ui.ButtonSet.OK);
      } catch (e) {
        Logger.log(`Lỗi khi gửi lại email: ${e.message}`);
        ui.alert('Thất bại', `Đã có lỗi xảy ra: ${e.message}`, ui.ButtonSet.OK);
      }
    }
  }
  else { // <-- Thêm khối else này
    ui.alert('Không tìm thấy', `Không tìm thấy học viên nào có MÃ CODE là "${userCodeToFind}".`, ui.ButtonSet.OK);
  }
}
/**
 * [HÀM MỚI]
 * Quét toàn bộ sheet, tìm những dòng chưa có link affiliate và tạo mới hàng loạt.
 */
function generateMissingAffiliateLinks() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert("Xác nhận", "Hành động này sẽ quét toàn bộ sheet và tạo link affiliate cho những dòng còn trống. Các link đã có sẽ không bị thay đổi. Bạn có muốn tiếp tục?", ui.ButtonSet.YES_NO);
  if (response !== ui.Button.YES) {
    ui.alert("Đã hủy thao tác.");
    return;
  }

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) {
    ui.alert("Lỗi", `Không tìm thấy sheet có tên "${SHEET_NAME}".`, ui.ButtonSet.OK);
    return;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    ui.alert("Thông báo", "Không có dữ liệu để xử lý.", ui.ButtonSet.OK);
    return;
  }

  // Lấy toàn bộ dữ liệu (trừ header) để xử lý trong bộ nhớ, hiệu quả hơn
  const dataRange = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
  const data = dataRange.getValues();
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const userCodeColIndex = headers.indexOf("MÃ CODE");
  const affiliateLinkColIndex = headers.indexOf("Link Affiliate");

  if (userCodeColIndex === -1 || affiliateLinkColIndex === -1) {
    ui.alert("Lỗi", "Không tìm thấy cột 'MÃ CODE' hoặc 'Link Affiliate'. Vui lòng kiểm tra lại tên cột.", ui.ButtonSet.OK);
    return;
  }
  
  let updatedCount = 0;

  // Lặp qua mảng dữ liệu đã lấy
  data.forEach(row => {
    const existingLink = row[affiliateLinkColIndex];
    // Chỉ xử lý nếu ô link trống
    if (!existingLink || String(existingLink).trim() === "") {
      const userCode = String(row[userCodeColIndex]).replace("'", "").trim();
      if (userCode) {
        // Tạo link mới và cập nhật lại giá trị trong mảng
        row[affiliateLinkColIndex] = CUSTOM_AFFILIATE_DOMAIN + userCode;
        updatedCount++;
      }
    }
  });

  // Ghi lại toàn bộ mảng dữ liệu đã được cập nhật vào Sheet trong một thao tác
  dataRange.setValues(data);

  ui.alert("Hoàn tất!", `Đã tạo và cập nhật thành công ${updatedCount} link affiliate mới.`, ui.ButtonSet.OK);
}


/**
 * [HÀM MỚI]
 * Xử lý dữ liệu từ Sheet và trả về cấu trúc cây JSON cho D3.js.
 */
function getReferralTreeData(startStr, endStr) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet || sheet.getLastRow() < 2) return null;

    const data = sheet.getDataRange().getValues();
    const headers = data.shift();

    const codeCol = headers.indexOf("MÃ CODE");
    const nameCol = headers.indexOf("Họ và tên");
    const refCol = headers.indexOf("Mã giới thiệu");
    const timeCol = headers.indexOf("Dấu thời gian");

    if ([codeCol, nameCol, refCol, timeCol].includes(-1)) {
      throw new Error("Thiếu các cột cần thiết: MÃ CODE, Họ và tên, Mã giới thiệu, Dấu thời gian.");
    }
    
    const startDate = new Date(startStr + "T00:00:00");
    const endDate = new Date(endStr + "T23:59:59");
    
    const filteredRows = data.filter(row => {
      const rowDate = new Date(row[timeCol]);
      return rowDate >= startDate && rowDate <= endDate;
    });

    const nodeMap = {};
    const rootNodes = [];

    filteredRows.forEach(row => {
      const id = String(row[codeCol]).replace("'", "").trim();
      if (id) {
        nodeMap[id] = {
          id: id,
          name: `${id} - ${row[nameCol]}`,
          children: []
        };
      }
    });

    filteredRows.forEach(row => {
      const id = String(row[codeCol]).replace("'", "").trim();
      const parentId = String(row[refCol] || "").trim();
      
      if (!id || !nodeMap[id]) return;

      const node = nodeMap[id];

      if (parentId && nodeMap[parentId]) {
        // Check for duplicates before pushing
        if (!nodeMap[parentId].children.some(child => child.id === node.id)) {
            nodeMap[parentId].children.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    // Remove duplicates from rootNodes as well
    const uniqueRootNodes = rootNodes.filter((node, index, self) =>
        index === self.findIndex((t) => (t.id === node.id))
    );

    return {
      name: "Hệ thống Nhân mạch",
      children: uniqueRootNodes
    };
    
  } catch(e) {
    Logger.log("Lỗi trong getReferralTreeData: " + e.message);
    throw new Error("Lỗi máy chủ khi xử lý dữ liệu cây.");
  }
}
function getAvailableCourses() {
  const courseSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(COURSE_SHEET_NAME);
  if (!courseSheet) return [];
  const data = courseSheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const header = data[0];
  const courseNameIndex = header.indexOf("Tên khóa học");
  const availableIndex = header.indexOf("Có sẵn");
  if (courseNameIndex === -1 || availableIndex === -1) return [];
  const availableCourses = [];
  for (let i = 1; i < data.length; i++) {
    const courseName = data[i][courseNameIndex];
    const available = data[i][availableIndex];
    if ((available === true || String(available).toUpperCase() === 'TRUE') && String(courseName).trim() !== "") {
      availableCourses.push(String(courseName).trim());
    }
  }
  return availableCourses;
}
/**
 * [HÀM MỚI] Lấy danh sách các "Tên lớp học" duy nhất và có sẵn để hiển thị trên form.
 * @returns {string[]} Một mảng chứa tên các lớp học.
 */
function getAvailableClassTopics(cacheBuster) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const courseSheet = ss.getSheetByName(COURSE_SHEET_NAME);
    if (!courseSheet) return [];

    const data = courseSheet.getDataRange().getValues();
    if (data.length < 2) return [];

    const headers = data[0];
    const topicCol = headers.indexOf("Tên lớp học");
    const availableCol = headers.indexOf("Có sẵn");

    if (topicCol === -1 || availableCol === -1) {
      Logger.log("Thiếu cột 'Tên lớp học' hoặc 'Có sẵn' trong sheet KH.");
      return [];
    }

    const classTopics = new Set(); // Dùng Set để tự động loại bỏ các tên trùng lặp
    for (let i = 1; i < data.length; i++) {
      const isAvailable = data[i][availableCol];
      if (isAvailable === true || String(isAvailable).toUpperCase() === 'TRUE') {
        const topic = data[i][topicCol].trim();
        if (topic) {
          classTopics.add(topic);
        }
      }
    }

    return Array.from(classTopics); // Chuyển Set thành mảng để trả về
  } catch (e) {
    Logger.log("Lỗi trong getAvailableClassTopics: " + e.message);
    return [];
  }
}

/**
 * [HÀM MỚI] Lấy danh sách các khóa học (ví dụ: K01, K02) có sẵn của một lớp học cụ thể.
 * @param {string} classTopic - Tên lớp học được người dùng chọn.
 * @returns {Object[]} Một mảng các object, mỗi object chứa tên và mã của khóa học.
 */
function getAvailableCoursesByTopic(classTopic) {
  if (!classTopic) return [];
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const courseSheet = ss.getSheetByName(COURSE_SHEET_NAME);
    if (!courseSheet) return [];

    const data = courseSheet.getDataRange().getValues();
    if (data.length < 2) return [];

    const headers = data[0];
    const topicCol = headers.indexOf("Tên lớp học");
    const courseNameCol = headers.indexOf("Tên khóa học");
    const courseCodeCol = headers.indexOf("Mã khóa");
    const availableCol = headers.indexOf("Có sẵn");

    if ([topicCol, courseNameCol, courseCodeCol, availableCol].includes(-1)) {
      Logger.log("Thiếu một trong các cột cần thiết trong sheet KH.");
      return [];
    }

    const courses = [];
    for (let i = 1; i < data.length; i++) {
      const isAvailable = data[i][availableCol];
      const topicInSheet = data[i][topicCol].trim();

      if ((isAvailable === true || String(isAvailable).toUpperCase() === 'TRUE') && topicInSheet === classTopic.trim()) {
        courses.push({
          name: data[i][courseNameCol].trim(), // Ví dụ: "K01 (29/09/2025)"
          code: data[i][courseCodeCol].trim()  // Ví dụ: "KD01"
        });
      }
    }
    return courses;
  } catch (e) {
    Logger.log("Lỗi trong getAvailableCoursesByTopic: " + e.message);
    return [];
  }
}
function findStudentByContact(contact) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const dkySheet = ss.getSheetByName(SHEET_NAME);
    const lsSheet = ss.getSheetByName("LS_DangKy");

    if (!dkySheet || !lsSheet) return null;

    const dkyData = dkySheet.getDataRange().getValues();
    const dkyHeaders = dkyData[0]; 
    const dkyMap = getHeaderMap(dkyHeaders);

    if (dkyMap["MÃ CODE"] === undefined || dkyMap["Số điện thoại"] === undefined || dkyMap["Địa chỉ email"] === undefined) {
       return null;
    }

    // Hàm chuẩn hóa SĐT (Giữ nguyên)
    const getSmartCorePhone = (str) => {
        if (!str) return "";
        let nums = String(str).replace(/\D/g, ''); 
        if (nums.startsWith("84") && nums.length >= 10) nums = nums.substring(2);
        else if (nums.startsWith("0")) nums = nums.substring(1);
        return nums;
    };

    let studentInfo = null;
    const searchTerm = String(contact).trim().toLowerCase();
    const isSearchEmail = searchTerm.includes('@');
    const searchCore = getSmartCorePhone(searchTerm); 

    // [THAY ĐỔI QUAN TRỌNG] Dùng Set để tự động loại bỏ trùng lặp
    const uniqueRegistered = new Set();
    const uniquePending = new Set();

    // 1. Quét DKy
    for (let i = 1; i < dkyData.length; i++) {
      const row = dkyData[i];
      const email = String(row[dkyMap["Địa chỉ email"]] || "").trim().toLowerCase();
      const sheetRawPhone = row[dkyMap["Số điện thoại"]];
      const sheetCore = getSmartCorePhone(sheetRawPhone);

      let isMatch = false;
      if (isSearchEmail) {
         isMatch = (email === searchTerm);
      } else {
         if (searchCore.length > 6 && sheetCore.length > 6) {
             isMatch = (searchCore === sheetCore);
         }
      }

      if (isMatch) {
        studentInfo = {
          name: row[dkyMap["Họ và tên"]],
          code: String(row[dkyMap["MÃ CODE"]]).replace("'", "").trim(),
          phone: String(sheetRawPhone || ""), 
          email: email
        };
        
        // Thêm lớp hiện tại vào Set
        const currentClass = row[dkyMap["Lớp đăng ký"]];
        if (currentClass) uniqueRegistered.add(currentClass.trim());
        
        break; 
      }
    }

    if (!studentInfo) return null;

    // 2. Quét LS_DangKy
    const lsData = lsSheet.getDataRange().getValues();
    const lsMap = getHeaderMap(lsData[0]);

    if (lsMap["MÃ CODE"] !== undefined && lsMap["Lớp ĐK mới"] !== undefined) {
        lsData.forEach(row => {
            const rowCode = String(row[lsMap["MÃ CODE"]]).trim();
            if (rowCode === studentInfo.code) {
                const topic = String(row[lsMap["Lớp ĐK mới"]] || "").trim();
                const status = String(row[lsMap["Trạng thái duyệt"]]).toLowerCase();
                
                if (topic) {
                    if (status.includes("duyệt")) {
                        uniqueRegistered.add(topic); // Set sẽ tự động bỏ qua nếu đã có
                    } else if (status.includes("chờ")) {
                        uniquePending.add(topic);
                    }
                }
            }
        });
    }

    // Chuyển Set về Array để trả về cho Client
    studentInfo.registeredCourseTopics = Array.from(uniqueRegistered);
    studentInfo.pendingCourseTopics = Array.from(uniquePending);

    return studentInfo;

  } catch (e) {
    Logger.log("Lỗi findStudentByContact: " + e.message);
    return null;
  }
}
function handleReRegistrationSubmit(formData) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const lsSheet = ss.getSheetByName("LS_DangKy");
    const dkySheet = ss.getSheetByName(SHEET_NAME); 

    if (!lsSheet || !dkySheet) {
        throw new Error("Không tìm thấy sheet LS_DangKy hoặc DKy.");
    }

    const newCourseInfo = _getCourseInfo(formData.newCourseCode);
    if (!newCourseInfo) {
        throw new Error("Không tìm thấy thông tin khóa học mới: " + formData.newCourseCode);
    }

    // --- KHAI BÁO BIẾN ĐỂ LƯU THÔNG TIN TÌM ĐƯỢC ---
    let oldClass = "Không rõ";
    let oldCourse = "Không rõ";
    let foundPhone = "Đã có trong hệ thống"; // Mặc định
    let foundEmail = "Đã có trong hệ thống"; // Mặc định

    // --- TÌM THÔNG TIN HỌC VIÊN CŨ ---
    if (formData.studentCode) {
        const dkyHeaders = dkySheet.getRange(1, 1, 1, dkySheet.getLastColumn()).getValues()[0];
        const studentInfo = findUserInfoByCode(formData.studentCode, dkySheet, dkyHeaders);
        
        if (studentInfo) {
            oldClass = studentInfo.classStatus || oldClass; 
            oldCourse = studentInfo.course || oldCourse;
            
            // [MỚI] Lấy SĐT và Email ra
            if (studentInfo.phone) foundPhone = studentInfo.phone;
            if (studentInfo.email) foundEmail = studentInfo.email;
        }
    }

    const waiverCheck = kiemTraDieuKienMienCoc(formData.studentCode, formData.newCourseCode);
    const isWaived = waiverCheck.isWaived;

    let receiptLink = '';
    if (!isWaived && formData.fileData) { 
      receiptLink = uploadFileToDrive(formData.fileData, formData.fileName, formData.fileType, formData.studentCode, `${formData.studentName}_DKLai`);
    } else if (isWaived) {
        receiptLink = waiverCheck.reason || "Miễn cọc"; 
    }

    const lsHeaders = lsSheet.getRange(1, 1, 1, lsSheet.getLastColumn()).getValues()[0];
    const lsData = {
      "Dấu thời gian": new Date(),
      "MÃ CODE": formData.studentCode,
      "Họ và tên": formData.studentName,
      "Lớp học cũ": oldClass, 
      "Khóa học cũ": oldCourse, 
      "Lớp ĐK mới": newCourseInfo.topic,
      "Khóa ĐK mới": newCourseInfo.name,
      "Mã lớp mới": newCourseInfo.code,
      "Phí cọc mới": isWaived ? 0 : newCourseInfo.depositFee, 
      "Link ảnh cọc mới": receiptLink,
      "Trạng thái duyệt": "Chờ duyệt"
    };

    const lsRowData = lsHeaders.map(header => lsData[header] !== undefined ? lsData[header] : '');
    lsSheet.appendRow(lsRowData);
    
    // --- GỬI THÔNG BÁO TELEGRAM (ĐÃ CẬP NHẬT SĐT) ---
    sendToTelegram("YÊU CẦU CHUYỂN LỚP", {
      code: formData.studentCode,
      name: formData.studentName,
      phone: foundPhone, // <-- Sử dụng biến chứa SĐT lấy từ Sheet
      email: foundEmail, // <-- Sử dụng biến chứa Email lấy từ Sheet
      courseInfo: newCourseInfo.name + (isWaived ? " (Miễn cọc)" : ""),
      imageLink: receiptLink, // Link ảnh bill (nếu có)
      action: "👉 Kiểm tra ảnh cọc và duyệt đơn"
    });
    // ----------------------------------

    return { 
      success: true, 
      message: "Yêu cầu đăng ký khóa học mới của bạn đã được gửi. Vui lòng tham gia nhóm Zalo và chờ duyệt.",
      zaloLink: newCourseInfo.zaloLink 
    };
  } catch (e) {
    Logger.log("Lỗi trong handleReRegistrationSubmit: " + e.message);
    return { success: false, message: "Lỗi hệ thống: " + e.message };
  }
}
function _getCourseInfoByCourseName(courseName) {
  try {
    const courseSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(COURSE_SHEET_NAME);
    if (!courseSheet) return null;

    const data = courseSheet.getDataRange().getValues();
    const headers = data.shift(); // Lấy hàng tiêu đề
    
    // Tìm chỉ số các cột
    const nameCol = headers.indexOf("Tên khóa học");
    const zaloCol = headers.indexOf("Link Zalo");
    const contentCol = headers.indexOf("Nội dung Email");
    const startDateCol = headers.indexOf("Ngày khai giảng"); // [MỚI]

    if (nameCol === -1 || zaloCol === -1 || startDateCol === -1) {
      Logger.log("Lỗi: Thiếu cột 'Tên khóa học', 'Link Zalo' hoặc 'Ngày khai giảng' trong sheet KH.");
      return null;
    }
    
    for(const row of data){
      if(String(row[nameCol]).trim() === String(courseName).trim()){
        
        // Xử lý ngày tháng hiển thị
        let dateStr = "";
        const rawDate = row[startDateCol];
        if (rawDate instanceof Date) {
            dateStr = Utilities.formatDate(rawDate, Session.getScriptTimeZone(), "dd/MM/yyyy");
        } else {
            dateStr = String(rawDate);
        }

        return { 
            zaloLink: row[zaloCol],
            emailContent: row[contentCol],
            startDate: dateStr // [MỚI] Trả về ngày khai giảng
        };
      }
    }
    return null; 
  } catch(e) {
    Logger.log("Lỗi trong _getCourseInfoByCourseName: " + e.message);
    return null;
  }
}
function kiemTraDieuKienMienCoc(studentCode, newCourseCode) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const dkySheet = ss.getSheetByName(SHEET_NAME);
    const lsSheet = ss.getSheetByName("LS_DangKy");

    const newCourseInfo = _getCourseInfo(newCourseCode);
    if (!newCourseInfo) return { isWaived: false };

    const dkyData = dkySheet.getDataRange().getValues();
    const dkyHeaders = dkyData.shift();
    const codeColDky = dkyHeaders.indexOf("MÃ CODE");
    const classTopicColDky = dkyHeaders.indexOf("Lớp đăng ký");
    
    const studentRow = dkyData.find(row => String(row[codeColDky]).replace("'", "") === String(studentCode));
    
    if (!studentRow) return { isWaived: false };

    // --- BẮT ĐẦU KIỂM TRA CÁC ĐIỀU KIỆN ---

    // Điều kiện 1: Đang học 86 ngày thì được miễn cọc các lớp ngắn ngày khác.
    const currentClass = studentRow[classTopicColDky].trim();
    if (currentClass.toLowerCase() === "86 ngày đồng hành" && newCourseInfo.topic.toLowerCase() !== "86 ngày đồng hành") {
      return { isWaived: true, reason: "Bạn được miễn cọc vì đang tham gia Lộ trình 86 ngày." };
    }

    // Lấy danh sách các lớp đã học từ LS_DangKy
    const lsData = lsSheet.getDataRange().getValues();
    const lsHeaders = lsData.shift();
    const codeColLs = lsHeaders.indexOf("MÃ CODE");
    const classTopicColLs = lsHeaders.indexOf("Lớp ĐK mới");
    const statusColLs = lsHeaders.indexOf("Trạng thái duyệt");

    const registeredTopics = new Set();
    for (const row of lsData) {
        if (String(row[codeColLs]).trim() === studentCode && String(row[statusColLs]).toLowerCase().includes("Đã duyệt")) {
            const topicName = String(row[classTopicColLs]).trim().toLowerCase(); 
            if (topicName) registeredTopics.add(topicName);
        }
    }
    if (currentClass) registeredTopics.add(currentClass.toLowerCase());

    const newTopic = newCourseInfo.topic.trim().toLowerCase();

    // Điều kiện 2: Đã học lớp này rồi thì được miễn cọc.
    if (registeredTopics.has(newTopic)) {
      return { isWaived: true, reason: `Bạn được miễn cọc vì đã tham gia lớp "${newCourseInfo.topic}" trước đó.` };
    }

    // Điều kiện 3: [SỬA ĐỔI] Đã học "Video ra đơn" VÀ Đang đăng ký "Tiếp thị liên kết"
    if (registeredTopics.has("video ra đơn") && newTopic.includes("tiếp thị liên kết")) {
      return { isWaived: true, reason: 'Bạn được miễn cọc lớp "Tiếp thị liên kết" vì đã tham gia lớp "Video ra đơn".' };
    }

    // Nếu không thỏa mãn điều kiện nào
    return { isWaived: false };

  } catch (e) {
    Logger.log("Lỗi trong kiemTraDieuKienMienCoc: " + e.message);
    return { isWaived: false };
  }
}
// HÀM CHẨN ĐOÁN LỖI LỊCH SỬ HỌC VIÊN
function kiemTraLichSuHocVien() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt(
    'Kiểm tra Lịch sử Học viên',
    'Nhập SĐT hoặc Email của một học viên cũ mà bạn biết chắc chắn đã học nhiều lớp:',
    ui.ButtonSet.OK_CANCEL
  );

  if (result.getSelectedButton() !== ui.Button.OK || result.getResponseText() === '') {
    return;
  }
  const contact = result.getResponseText();
  
  Logger.log(`--- BẮT ĐẦU KIỂM TRA LỊCH SỬ CHO: "${contact}" ---`);
  
  // Gọi hàm gốc để thực thi và ghi log chi tiết
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const dkySheet = ss.getSheetByName(SHEET_NAME);
    const lsSheet = ss.getSheetByName("LS_DangKy");

    const dkyData = dkySheet.getDataRange().getValues();
    const dkyHeaders = dkyData[0];
    const codeColDky = dkyHeaders.indexOf("MÃ CODE");
    const nameColDky = dkyHeaders.indexOf("Họ và tên");
    const emailColDky = dkyHeaders.indexOf("Địa chỉ email");
    const phoneColDky = dkyHeaders.indexOf("Số điện thoại");
    const classTopicColDky = dkyHeaders.indexOf("Lớp đăng ký");
    
    let studentInfo = null;
    let studentCode = "";

    const searchTerm = String(contact).trim();
    const isEmail = searchTerm.includes('@');

    // Tìm trong DKy
    for (let i = 1; i < dkyData.length; i++) {
      const row = dkyData[i];
      let match = (isEmail && String(row[emailColDky]).trim().toLowerCase() === searchTerm.toLowerCase()) || 
                  (!isEmail && normalizePhoneNumber(row[phoneColDky]) === normalizePhoneNumber(searchTerm));
      if (match) {
        studentCode = String(row[codeColDky]).replace("'", "");
        studentInfo = { name: row[nameColDky], code: studentCode };
        break;
      }
    }

    if (!studentInfo) {
      Logger.log("❌ LỖI: Không tìm thấy học viên này trong sheet DKy.");
      return;
    }
    Logger.log(`✅ Tìm thấy HV: ${studentInfo.name} (Mã: ${studentInfo.code})`);

    // Quét LS_DangKy
    Logger.log("--- Đang quét LS_DangKy ---");
    const lsData = lsSheet.getDataRange().getValues();
    const lsHeaders = lsData[0];
    const codeColLs = lsHeaders.indexOf("MÃ CODE");
    const classTopicColLs = lsHeaders.indexOf("Lớp ĐK mới");
    const statusColLs = lsHeaders.indexOf("Trạng thái duyệt");

    const registeredTopics = new Set();
    let foundInLS = false;
    for (let i = 1; i < lsData.length; i++) {
      const row = lsData[i];
      if (String(row[codeColLs]).trim() === studentCode) {
        foundInLS = true;
        const topicName = String(row[classTopicColLs]).trim();
        const status = String(row[statusColLs]).trim();
        Logger.log(` -> Dòng ${i+1} trong LS_DangKy: Tìm thấy lớp "${topicName}" với trạng thái "${status}"`);
        if (status.startsWith("Đã duyệt")) {
          registeredTopics.add(topicName);
          Logger.log(`    --> HỢP LỆ. Đã thêm vào danh sách.`);
        } else {
          Logger.log(`    --> KHÔNG HỢP LỆ. Bỏ qua vì chưa được duyệt.`);
        }
      }
    }
    if (!foundInLS) {
      Logger.log(" -> Không tìm thấy bản ghi nào trong LS_DangKy cho mã này.");
    }

    // Lấy lớp hiện tại từ DKy
    const dkyRow = dkyData.find(row => String(row[codeColDky]).replace("'", "") === studentCode);
    const currentTopic = String(dkyRow[classTopicColDky]).trim();
    Logger.log(`--- Lớp hiện tại trong DKy là: "${currentTopic}" ---`);
    if(currentTopic) registeredTopics.add(currentTopic);
    
    Logger.log(`--- KẾT QUẢ CUỐI CÙNG ---`);
    Logger.log(`Danh sách tổng hợp các lớp đã học: [${Array.from(registeredTopics).join(", ")}]`);

  } catch (e) {
    Logger.log("❌ LỖI NGHIÊM TRỌNG: " + e.message);
  }
}
// [HÀM MỚI] - XỬ LÝ HẠ CẤP HỌC VIÊN KHỎI CLB 5 SAO
function haCapHocVien() {
  const ui = SpreadsheetApp.getUi();
  
  const codeResult = ui.prompt('Hạ cấp Học viên', 'Nhập MÃ CODE của học viên cần hạ cấp khỏi CLB 5 Sao:', ui.ButtonSet.OK_CANCEL);
  if (codeResult.getSelectedButton() !== ui.Button.OK || !codeResult.getResponseText()) {
    ui.alert('Thông báo', 'Đã hủy thao tác.', ui.ButtonSet.OK);
    return;
  }
  const studentCode = codeResult.getResponseText().trim();

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const dkySheet = ss.getSheetByName(SHEET_NAME);
    const lsSheet = ss.getSheetByName("LS_DangKy");

    // [SỬA LỖI] - Dùng đúng hàm findUserInfoByCode để tìm bằng Mã số
    const dkyHeaders = dkySheet.getRange(1, 1, 1, dkySheet.getLastColumn()).getValues()[0];
    const studentInfo = findUserInfoByCode(studentCode, dkySheet, dkyHeaders);

    if (!studentInfo || studentInfo.classStatus.toLowerCase().trim() !== "86 ngày đồng hành") {
      ui.alert('Lỗi', `Không tìm thấy học viên có mã "${studentCode}" hoặc họ không ở trong Lộ trình 86 ngày.`, ui.ButtonSet.OK);
      return;
    }

    const shortTermClasses = studentInfo.registeredCourseTopics.filter(topic => topic.toLowerCase().trim() !== "86 ngày đồng hành");
    if (shortTermClasses.length === 0) {
      ui.alert('Thông báo', 'Học viên này chưa tham gia lớp ngắn ngày nào để có thể hạ cấp về.', ui.ButtonSet.OK);
      return;
    }

    const selectedClass = ui.prompt(
      'Chọn lớp để hạ cấp về',
      `Chọn một lớp học cũ để cập nhật lại trạng thái chính cho học viên "${studentInfo.name}".\n\nCác lựa chọn có sẵn:\n${shortTermClasses.join('\n')}`,
      ui.ButtonSet.OK_CANCEL
    ).getResponseText();

    if (!selectedClass || !shortTermClasses.includes(selectedClass.trim())) {
      ui.alert('Thông báo', 'Đã hủy hoặc lựa chọn không hợp lệ.', ui.ButtonSet.OK);
      return;
    }
    const finalClass = selectedClass.trim();
    
    // Cập nhật sheet DKy
    dkySheet.getRange(studentInfo.row, dkyHeaders.indexOf("Lớp đăng ký") + 1).setValue(finalClass);
    
    // Ghi lịch sử vào LS_DangKy
    const lsHeaders = lsSheet.getRange(1, 1, 1, lsSheet.getLastColumn()).getValues()[0];
    const historyRecord = {
      "Dấu thời gian": new Date(),
      "MÃ CODE": studentCode,
      "Họ và tên": studentInfo.name,
      "Lớp ĐK mới": "Rời CLB 5 Sao",
      "Khóa ĐK mới": `Quay về: ${finalClass}`,
      "Trạng thái duyệt": "Đã duyệt (Hạ cấp)"
    };
    const rowData = lsHeaders.map(header => historyRecord[header] || "");
    lsSheet.appendRow(rowData);

    ui.alert('Thành công!', `Đã hạ cấp thành công học viên ${studentInfo.name} về lớp "${finalClass}".`, ui.ButtonSet.OK);

  } catch(e) {
    Logger.log("Lỗi khi hạ cấp: " + e.message);
    ui.alert('Lỗi', 'Đã có lỗi xảy ra: ' + e.message, ui.ButtonSet.OK);
  }
}
// HÀM CHẨN ĐOÁN LỖI DỮ LIỆU - CHỈ CHẠY MỘT LẦN
/*function kiemTraDuLieuLichSu() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const dkySheet = ss.getSheetByName(SHEET_NAME);
    const lsCuSheet = ss.getSheetByName("LS_Cu");

    if (!dkySheet || !lsCuSheet) {
      Logger.log('Lỗi: Không tìm thấy sheet DKy hoặc LS_Cu.');
      return;
    }

    const dkyData = dkySheet.getDataRange().getValues();
    const lsCuData = lsCuSheet.getDataRange().getValues();
    const dkyHeaders = dkyData.shift();
    const lsCuHeaders = lsCuData.shift();

    // <<< [QUAN TRỌNG] HÃY KIỂM TRA LẠI TÊN CỘT TRONG NGOẶC KÉP CHO KHỚP >>>
    const codeColDky = dkyHeaders.indexOf("MÃ CODE");
    const codeColCu = lsCuHeaders.indexOf("Mã học viên");
    // -----------------------------------------------------------------

    if (codeColCu === -1) { Logger.log('Lỗi: Không tìm thấy cột "Mã học viên" trong sheet "LS_Cu".'); return; }
    if (codeColDky === -1) { Logger.log('Lỗi: Không tìm thấy cột "MÃ CODE" trong sheet "DKy".'); return; }

    const dkyCodes = new Set(dkyData.map(row => String(row[codeColDky]).replace("'", "").trim()));
    const lsCuCodes = new Set(lsCuData.map(row => String(row[codeColCu]).replace("'", "").trim()));

    Logger.log(`--- BẮT ĐẦU KIỂM TRA DỮ LIỆU ---`);
    Logger.log(`Tổng số mã HV trong DKy: ${dkyCodes.size}`);
    Logger.log(`Tổng số mã HV trong LS_Cu: ${lsCuCodes.size}`);
    Logger.log(`---------------------------------`);

    let notFoundCount = 0;
    for (const code of lsCuCodes) {
      if (!dkyCodes.has(code)) {
        Logger.log(`-> Mã "${code}" từ LS_Cu KHÔNG TÌM THẤY trong DKy.`);
        notFoundCount++;
      }
    }
    
    if (notFoundCount > 0) {
      Logger.log(`--- KẾT QUẢ: Có ${notFoundCount} mã từ LS_Cu không khớp với DKy. Đây là nguyên nhân lỗi. ---`);
    } else {
      Logger.log(`--- KẾT QUẢ: TUYỆT VỜI! Tất cả ${lsCuCodes.size} mã từ LS_Cu đều được tìm thấy trong DKy. ---`);
    }

  } catch (e) {
    Logger.log("Lỗi khi kiểm tra dữ liệu: " + e.message);
  }
}*/
// THAY THẾ TOÀN BỘ HÀM CŨ BẰNG PHIÊN BẢN HOÀN CHỈNH NÀY
/*function phucDungDongThoiGianHoanChinh() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert('Xác nhận Phục dựng Lịch sử', 'Hành động này sẽ XÓA SẠCH sheet "LS_DangKy" và TÁI TẠO LẠI toàn bộ lịch sử từ các sheet DKy, LS_Cu, và HV86.\n\nQUAN TRỌNG: Thao tác này chỉ nên chạy MỘT LẦN.\n\nBạn có chắc chắn muốn tiếp tục?', ui.ButtonSet.YES_NO);
  if (response !== ui.Button.YES) {
    ui.alert('Thông báo', 'Đã hủy thao tác.', ui.ButtonSet.OK);
    return;
  }

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const dkySheet = ss.getSheetByName(SHEET_NAME);
    const lsCuSheet = ss.getSheetByName("LS_Cu");
    const hv86Sheet = ss.getSheetByName(HV86_SHEET_NAME);
    const lsSheet = ss.getSheetByName("LS_DangKy");

    if (!dkySheet || !lsCuSheet || !hv86Sheet || !lsSheet) {
      ui.alert('Lỗi', 'Không tìm thấy một trong các sheet bắt buộc.', ui.ButtonSet.OK);
      return;
    }

    // --- 1. Đọc TOÀN BỘ dữ liệu và tiêu đề ---
    const dkyData = dkySheet.getDataRange().getValues();
    const lsCuData = lsCuSheet.getDataRange().getValues();
    const hv86Data = hv86Sheet.getDataRange().getValues();

    const dkyHeaders = dkyData.shift();
    const lsCuHeaders = lsCuData.shift();
    const hv86Headers = hv86Data.shift();
    const lsHeaders = lsSheet.getRange(1, 1, 1, lsSheet.getLastColumn()).getValues()[0];
    
    // --- 2. Xây dựng "Hồ sơ Học viên" và suy luận sự kiện đầu tiên ---
    const studentProfiles = {};
    const hv86TimestampMap = new Map();
    hv86Data.forEach(row => {
        const code = String(row[hv86Headers.indexOf("MÃ CODE")]).trim();
        const timestamp = new Date(row[hv86Headers.indexOf("Ngày bắt đầu")]);
        if (code && timestamp.getTime()) hv86TimestampMap.set(code, { timestamp, linkAnhCoc: row[hv86Headers.indexOf("Link ảnh cọc")] });
    });

    dkyData.forEach(row => {
      const code = String(row[dkyHeaders.indexOf("MÃ CODE")]).replace("'", "").trim();
      if (code) {
        const originalTimestamp = new Date(row[dkyHeaders.indexOf("Dấu thời gian")]);
        const cutoffDate = new Date("2025-09-25T00:00:00");
        let firstEventTopic = "1K Follow"; // Mặc định là 1K Follow cho dữ liệu cũ

        // Áp dụng quy tắc suy luận của bạn
        if (originalTimestamp >= cutoffDate) {
            // Sau 25/9, lớp đầu tiên là lớp hiện tại trong DKy
            firstEventTopic = row[dkyHeaders.indexOf("Lớp đăng ký")];
        } else {
            const hv86Info = hv86TimestampMap.get(code);
            if (hv86Info) {
                // So sánh cùng ngày, bỏ qua giờ phút giây
                const d1 = new Date(originalTimestamp).setHours(0,0,0,0);
                const d2 = new Date(hv86Info.timestamp).setHours(0,0,0,0);
                if (d1 === d2) {
                    firstEventTopic = "86 ngày đồng hành";
                }
            }
        }
        
        studentProfiles[code] = {
          name: row[dkyHeaders.indexOf("Họ và tên")],
          email: row[dkyHeaders.indexOf("Địa chỉ email")],
          originalTimestamp: originalTimestamp,
          currentClass: row[dkyHeaders.indexOf("Lớp đăng ký")],
          currentCourse: row[dkyHeaders.indexOf("Khoá đăng ký")],
          linkAnhCocGoc: row[dkyHeaders.indexOf("Link ảnh cọc")],
          events: [{ // Ghi nhận sự kiện đầu tiên đã suy luận
            timestamp: originalTimestamp,
            topic: firstEventTopic,
            course: (firstEventTopic === "1K Follow" || firstEventTopic === "86 ngày đồng hành") ? firstEventTopic : row[dkyHeaders.indexOf("Khoá đăng ký")],
            linkAnhCoc: row[dkyHeaders.indexOf("Link ảnh cọc")]
          }]
        };
      }
    });

    // --- 3. Thêm các sự kiện nâng cấp ---
    // Nâng cấp lên Video ra đơn
    lsCuData.forEach(row => {
      const code = String(row[lsCuHeaders.indexOf("Mã học viên")]).trim();
      if (studentProfiles[code]) {
        studentProfiles[code].events.push({
          timestamp: new Date(row[lsCuHeaders.indexOf("Dấu thời gian")]),
          topic: "Video ra đơn", course: "Video ra đơn",
          linkAnhCoc: row[lsCuHeaders.indexOf("Link ảnh cọc")] || ""
        });
      }
    });

    // Nâng cấp lên 86 ngày (chỉ thêm nếu không phải là sự kiện đầu tiên)
    hv86TimestampMap.forEach((hv86Info, code) => {
        if (studentProfiles[code]) {
            const isFirstEvent = studentProfiles[code].events.some(event => event.topic === "86 ngày đồng hành");
            if (!isFirstEvent) {
                studentProfiles[code].events.push({
                    timestamp: hv86Info.timestamp,
                    topic: "86 ngày đồng hành", course: "86 ngày đồng hành",
                    linkAnhCoc: hv86Info.linkAnhCoc
                });
            }
        }
    });

    // Giai đoạn "Bê nguyên": đảm bảo trạng thái cuối cùng trong DKy được ghi nhận
    for (const code in studentProfiles) {
        const profile = studentProfiles[code];
        const hasCurrentClassInEvents = profile.events.some(event => event.topic === profile.currentClass);
        // Nếu lớp hiện tại trong DKy chưa được ghi nhận trong các sự kiện
        if (profile.currentClass && !hasCurrentClassInEvents) {
             profile.events.push({
                timestamp: profile.originalTimestamp, // Dùng tạm timestamp gốc
                topic: profile.currentClass,
                course: profile.currentCourse,
                linkAnhCoc: profile.linkAnhCocGoc
            });
        }
    }

    // --- 4. Chuyển đổi và sắp xếp ---
    let allHistoryRecords = [];
    for (const code in studentProfiles) {
      const profile = studentProfiles[code];
      // Loại bỏ các sự kiện trùng lặp theo TÊN LỚP, giữ lại sự kiện có thời gian mới nhất
      const uniqueEvents = [...new Map(profile.events.map(item => [item.topic, item])).values()];

      uniqueEvents.forEach(event => {
        const record = {
          "Dấu thời gian": event.timestamp, "MÃ CODE": code, "Họ và tên": profile.name, "Email": profile.email,
          "Lớp ĐK mới": event.topic, "Khóa ĐK mới": event.course, 
          "Link ảnh cọc mới": event.linkAnhCoc || "",
          "Trạng thái duyệt": "Đã duyệt (Dữ liệu cũ)"
        };
        allHistoryRecords.push(lsHeaders.map(h => record[h] || ""));
      });
    }
    
    allHistoryRecords.sort((a, b) => new Date(a[0]) - new Date(b[0]));

    // --- 5. Xóa sạch và ghi lại lịch sử mới ---
    if (allHistoryRecords.length > 0) {
      if (lsSheet.getLastRow() > 1) {
        lsSheet.getRange(2, 1, lsSheet.getLastRow() - 1, lsSheet.getLastColumn()).clearContent();
      }
      lsSheet.getRange(2, 1, allHistoryRecords.length, lsHeaders.length).setValues(allHistoryRecords);
      ui.alert('Thành công!', `Đã phục dựng và tạo lại thành công ${allHistoryRecords.length} bản ghi lịch sử.`, ui.ButtonSet.OK);
    } else {
      ui.alert('Thông báo', 'Không có dữ liệu cũ nào để phục dựng.', ui.ButtonSet.OK);
    }

  } catch (e) {
    Logger.log("Lỗi khi phục dựng lịch sử: " + e.message);
    ui.alert('Lỗi', 'Đã có lỗi xảy ra: ' + e.message, ui.ButtonSet.OK);
  }
}*/
// [HÀM MỚI] - Lấy toàn bộ thông tin chi tiết của TẤT CẢ các khóa học có sẵn
function getAllCourseDetails(cacheBuster) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const courseSheet = ss.getSheetByName(COURSE_SHEET_NAME);
    if (!courseSheet || courseSheet.getLastRow() < 2) return {};

    const data = courseSheet.getDataRange().getValues();
    const headers = data.shift();
    const headerMap = {};
    headers.forEach((header, index) => { headerMap[header.trim()] = index; });

    const courses = {}; // Dùng object để tra cứu nhanh hơn
    data.forEach(row => {
      const isAvailable = row[headerMap["Có sẵn"]];
      if (isAvailable === true || String(isAvailable).toUpperCase() === 'TRUE') {
        const courseCode = String(row[headerMap["Mã khóa"]]).trim();
        if (courseCode) {
          courses[courseCode] = {
            topic: row[headerMap["Tên lớp học"]],
            name: row[headerMap["Tên khóa học"]],
            description: row[descriptionCol] || "",
            code: courseCode,
            zaloLink: row[headerMap["Link Zalo"]],
            depositFee: row[headerMap["Phí cọc"]],
            qrLink: row[headerMap["Link QR Code"]],
            paymentContent: row[headerMap["Nội dung CK"]]
          };
        }
      }
    });
    return courses;
  } catch (e) {
    Logger.log("Lỗi trong getAllCourseDetails: " + e.message);
    return {};
  }
}
function getAllCourseDetails() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const courseSheet = ss.getSheetByName(COURSE_SHEET_NAME); // Đảm bảo biến này là "KH"
    if (!courseSheet || courseSheet.getLastRow() < 2) return {};

    const data = courseSheet.getDataRange().getValues();
    const headers = data.shift(); // Lấy hàng tiêu đề
    const headerMap = {};
    headers.forEach((header, index) => { headerMap[header.trim()] = index; });

    // Kiểm tra các cột bắt buộc
    if (headerMap["Có sẵn"] === undefined || headerMap["Mã khóa"] === undefined) {
        Logger.log("Lỗi: Thiếu cột 'Có sẵn' hoặc 'Mã khóa' trong sheet KH");
        return {};
    }

    const courses = {}; 
    
    data.forEach(row => {
      const isAvailable = row[headerMap["Có sẵn"]];
      // Kiểm tra điều kiện hiện thị: True hoặc string "TRUE"
      if (isAvailable === true || String(isAvailable).toUpperCase() === 'TRUE') {
        
        const courseCode = String(row[headerMap["Mã khóa"]]).trim();
        
        if (courseCode) {
          // Xử lý ngày khai giảng
          let dateStr = "";
          if (headerMap["Ngày khai giảng"] !== undefined) {
              const rawDate = row[headerMap["Ngày khai giảng"]];
              if (rawDate instanceof Date) {
                  dateStr = Utilities.formatDate(rawDate, Session.getScriptTimeZone(), "dd/MM/yyyy");
              } else {
                  dateStr = String(rawDate);
              }
          }

          courses[courseCode] = {
            topic: row[headerMap["Tên lớp học"]],
            name: row[headerMap["Tên khóa học"]],
            code: courseCode,
            startDate: dateStr,
            description: headerMap["Mô tả ngắn"] !== undefined ? row[headerMap["Mô tả ngắn"]] : "", // Lấy mô tả
            zaloLink: row[headerMap["Link Zalo"]],
            depositFee: row[headerMap["Phí cọc"]],
            qrLink: row[headerMap["Link QR Code"]],
            paymentContent: row[headerMap["Nội dung CK"]],
            stk: row[headerMap["STK"]] || null,
            tenChuTK: row[headerMap["Tên chủ TK"]] || null,
            nganHang: row[headerMap["Ngân hàng"]] || null
          };
        }
      }
    });
    
    return courses;
  } catch (e) {
    Logger.log("Lỗi trong getAllCourseDetails: " + e.message);
    return {};
  }
}
/**
 * [HÀM MỚI] Lấy thông tin khóa học và kiểm tra miễn cọc trong một lần gọi.
 * @param {string} studentCode - Mã số của học viên.
 * @param {string} courseCode - Mã khóa học mới.
 * @returns {object} - Một object chứa thông tin chi tiết.
 */
function getCourseAndWaiverInfo(studentCode, courseCode) {
  try {
    // 1. Lấy thông tin chi tiết của khóa học đang được chọn
    const courseDetails = _getCourseInfo(courseCode);
    if (!courseDetails) {
      // Dừng lại và báo lỗi nếu không tìm thấy mã khóa trong sheet KH
      throw new Error(`Không tìm thấy thông tin cho mã khóa học "${courseCode}" trong sheet KH.`);
    }

    // 2. Kiểm tra điều kiện miễn cọc
    const waiverDetails = kiemTraDieuKienMienCoc(studentCode, courseCode);

    // 3. Trả về một gói dữ liệu hoàn chỉnh
    return {
      success: true,
      courseDetails: courseDetails,
      waiverDetails: waiverDetails
    };

  } catch (e) {
    Logger.log(`Lỗi trong getCourseAndWaiverInfo: ${e.message}`);
    // Trả về lỗi một cách rõ ràng để client có thể hiển thị
    return { success: false, message: `Lỗi hệ thống: ${e.message}` };
  }
}
/**
 * [HÀM CHẨN ĐOÁN] - Dùng để kiểm tra tại sao không tìm thấy mã khóa học.
 * Hãy chạy hàm này trực tiếp từ trình soạn thảo Apps Script.
 */
function test_timMaKhoaHoc() {
  const maKhoaCanTim = "LS01"; // <<--- [QUAN TRỌNG] Nhập chính xác mã khóa đang bị lỗi vào đây
  const tenSheet = "KH";

  Logger.log(`--- BẮT ĐẦU CHẨN ĐOÁN ---`);
  Logger.log(`Tìm kiếm mã khóa: "${maKhoaCanTim}" trong sheet "${tenSheet}"`);
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const courseSheet = ss.getSheetByName(tenSheet);
    if (!courseSheet) {
      Logger.log(`❌ LỖI NGHIÊM TRỌNG: Không tìm thấy sheet có tên "${tenSheet}".`);
      return;
    }

    const data = courseSheet.getDataRange().getValues();
    const headers = data.shift(); // Lấy hàng tiêu đề
    const headerName = "Mã khóa";
    const maKhoaColIndex = headers.indexOf(headerName);

    if (maKhoaColIndex === -1) {
      Logger.log(`❌ LỖI CỘT: Không tìm thấy cột nào có tên chính xác là "${headerName}".`);
      Logger.log(`Các cột tìm thấy là: [${headers.join(", ")}]`);
      return;
    }

    Logger.log(`✅ Đã tìm thấy cột "${headerName}" tại vị trí số ${maKhoaColIndex + 1}.`);
    Logger.log(`--- Đang quét dữ liệu từng hàng... ---`);

    let daTimThay = false;
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const maKhoaTrongSheet = String(row[maKhoaColIndex]).trim();
      const soSanh = (maKhoaTrongSheet === maKhoaCanTim);
      
      // Ghi log cho mỗi hàng để kiểm tra
      Logger.log(`Hàng ${i + 2}: Lấy ra mã là "${maKhoaTrongSheet}". So sánh với "${maKhoaCanTim}" => Kết quả: ${soSanh}`);
      
      if (soSanh) {
        daTimThay = true;
        Logger.log(`🎉🎉🎉 ĐÃ TÌM THẤY KẾT QUẢ TRÙNG KHỚP TẠI HÀNG ${i + 2}!`);
        break; // Dừng lại khi đã tìm thấy
      }
    }

    if (!daTimThay) {
      Logger.log(`--- KẾT QUẢ ---`);
      Logger.log(`❌ KHÔNG TÌM THẤY mã "${maKhoaCanTim}" sau khi quét toàn bộ sheet.`);
      Logger.log(`Gợi ý: Hãy kiểm tra kỹ các mã đã được ghi log ở trên. Có thể có ký tự ẩn hoặc sự khác biệt rất nhỏ mà mắt thường không thấy.`);
    }

  } catch (e) {
    Logger.log("Lỗi ngoại lệ: " + e.message);
  }
}
/**
 * [HÀM CHẨN ĐOÁN CUỐI CÙNG] - Dùng để kiểm tra dữ liệu gốc và quá trình lọc.
 * Hãy chạy hàm này trực tiếp từ trình soạn thảo Apps Script.
 */
function test_layVaLocTenLop() {
  try {
    // [ĐÃ SỬA LỖI] Sửa lại tên biến SPREADSHEET_ID cho đúng
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID); 
    const courseSheet = ss.getSheetByName(COURSE_SHEET_NAME);
    
    Logger.log("--- BẮT ĐẦU CHẨN ĐOÁN DỮ LIỆU ---");

    if (!courseSheet) {
      Logger.log(`❌ LỖI: Không tìm thấy sheet có tên "${COURSE_SHEET_NAME}".`);
      return;
    }

    const data = courseSheet.getDataRange().getValues();
    const headers = data.shift();
    const topicCol = headers.indexOf("Tên lớp học");
    const availableCol = headers.indexOf("Có sẵn");

    if (topicCol === -1) {
      Logger.log("❌ LỖI: Không tìm thấy cột 'Tên lớp học' trong sheet KH.");
      return;
    }

    // 1. Lấy ra TẤT CẢ tên lớp gốc (kể cả trùng lặp)
    const danhSachGoc = data
      .filter(row => row[availableCol] === true || String(row[availableCol]).toUpperCase() === 'TRUE')
      .map(row => row[topicCol]);
    
    Logger.log("1. Danh sách gốc các 'Tên lớp học' lấy từ Sheet KH:");
    Logger.log(danhSachGoc);

    // 2. Tạo danh sách duy nhất (mô phỏng lại logic của code)
    const danhSachDuyNhat = [...new Set(danhSachGoc)];
    Logger.log("\n2. Danh sách sau khi loại bỏ trùng lặp (Set):");
    Logger.log(danhSachDuyNhat);

    // 3. Thực hiện lọc
    const danhSachDaLoc = danhSachDuyNhat.filter(t => t && !t.toLowerCase().includes("86 ngày"));
    Logger.log("\n3. Danh sách CUỐI CÙNG sau khi lọc bỏ những tên chứa '86 ngày':");
    Logger.log(danhSachDaLoc);

    // 4. Tìm ra những mục đã bị loại bỏ
    const mucBiLoaiBo = danhSachDuyNhat.filter(t => t && t.toLowerCase().includes("86 ngày"));
    Logger.log("\n4. Các mục ĐÃ BỊ LỌC BỎ:");
    Logger.log(mucBiLoaiBo.length > 0 ? mucBiLoaiBo : "Không có mục nào bị lọc bỏ.");

    Logger.log("\n--- KẾT THÚC CHẨN ĐOÁN ---");
    Logger.log("Gợi ý: Hãy kiểm tra kỹ 'Danh sách gốc'. Nếu bạn thấy một tên lớp liên quan đến 86 ngày mà không xuất hiện trong mục 'ĐÃ BỊ LỌC BỎ', đó chính là nguyên nhân gây lỗi.");

  } catch (e) {
    Logger.log("Lỗi ngoại lệ: " + e.message);
  }
}
/**
 * [HÀM CHẨN ĐOÁN CUỐI CÙNG] - Kiểm tra toàn bộ cấu trúc của sheet KH.
 * Hãy chạy hàm này trực tiếp từ trình soạn thảo Apps Script.
 */
function test_docSheetKH() {
  Logger.log("--- BẮT ĐẦU CHẨN ĐOÁN SHEET 'KH' ---");
  
  const requiredHeaders = [
    "Mã khóa", 
    "Tên lớp học", 
    "Tên khóa học", 
    "Link Zalo", 
    "Phí cọc", 
    "Link QR Code", 
    "Nội dung CK",
    "Có sẵn" 
    // "File Email Template", "Nội dung Email" - Các cột này không bắt buộc cho việc hiển thị form
  ];

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const courseSheet = ss.getSheetByName(COURSE_SHEET_NAME);

    if (!courseSheet) {
      Logger.log(`❌ LỖI NGHIÊM TRỌNG: Không tìm thấy sheet có tên là "${COURSE_SHEET_NAME}". Vui lòng kiểm tra lại biến COURSE_SHEET_NAME.`);
      return;
    }
    Logger.log(`✅ Đã tìm thấy sheet: "${COURSE_SHEET_NAME}".`);

    const actualHeaders = courseSheet.getRange(1, 1, 1, courseSheet.getLastColumn()).getValues()[0];
    Logger.log("Các cột thực tế đang có trong sheet KH là:");
    Logger.log(actualHeaders);

    let allFound = true;
    Logger.log("\n--- Đang kiểm tra các cột bắt buộc ---");
    requiredHeaders.forEach(header => {
      if (actualHeaders.indexOf(header) === -1) {
        Logger.log(`❌ LỖI: Không tìm thấy cột "${header}"`);
        allFound = false;
      } else {
        Logger.log(`✅ OK: Cột "${header}" đã được tìm thấy.`);
      }
    });

    if (allFound) {
      Logger.log("\n✅ TUYỆT VỜI! TẤT CẢ CÁC CỘT BẮT BUỘC ĐỀU HỢP LỆ.");
      Logger.log("Nếu lỗi vẫn xảy ra, vấn đề có thể nằm ở dữ liệu bên trong các hàng (ví dụ: cột 'Có sẵn' không có giá trị TRUE nào).");
    } else {
      Logger.log("\n❌ LỖI CẤU TRÚC: Một hoặc nhiều cột quan trọng đã bị thiếu hoặc đổi tên. Đây chính là nguyên nhân gây ra lỗi. Vui lòng sửa lại tên cột trong Google Sheet cho khớp với danh sách ở trên.");
    }

  } catch (e) {
    Logger.log("Lỗi ngoại lệ khi thực thi: " + e.message);
  }
}
/**
 * [HÀM CHẨN ĐOÁN CUỐI CÙNG] - Kiểm tra giá trị và kiểu dữ liệu của cột "Có sẵn".
 * Hãy chạy hàm này trực tiếp từ trình soạn thảo Apps Script.
 */
function test_giaTriCotCoSan() {
  Logger.log("--- BẮT ĐẦU KIỂM TRA GIÁ TRỊ CỘT 'CÓ SẴN' ---");
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const courseSheet = ss.getSheetByName(COURSE_SHEET_NAME);

    if (!courseSheet) {
      Logger.log(`❌ LỖI: Không tìm thấy sheet "${COURSE_SHEET_NAME}".`);
      return;
    }

    const data = courseSheet.getDataRange().getValues();
    const headers = data.shift();
    const topicCol = headers.indexOf("Tên lớp học");
    const availableCol = headers.indexOf("Có sẵn");

    if (topicCol === -1 || availableCol === -1) {
      Logger.log("❌ LỖI: Không tìm thấy cột 'Tên lớp học' hoặc 'Có sẵn'.");
      return;
    }

    Logger.log("Đang quét từng hàng trong sheet KH...");
    Logger.log("--------------------------------------------------");

    data.forEach((row, index) => {
      const tenLop = row[topicCol];
      const giaTriCoSan = row[availableCol];
      const kieuDuLieu = typeof giaTriCoSan;

      // So sánh theo logic hiện tại của code
      const dieuKien1 = (giaTriCoSan === true);
      const dieuKien2 = (String(giaTriCoSan).toUpperCase() === 'TRUE');
      const duocHienThi = dieuKien1 || dieuKien2;

      Logger.log(`Hàng ${index + 2}:`);
      Logger.log(`  - Tên lớp học: "${tenLop}"`);
      Logger.log(`  - Giá trị gốc của cột 'Có sẵn': ${giaTriCoSan}`);
      Logger.log(`  - Kiểu dữ liệu: ${kieuDuLieu}`);
      Logger.log(`  - Kết quả kiểm tra: ${duocHienThi ? "✅ SẼ HIỂN THỊ" : "❌ BỊ LỌC BỎ"}`);
      Logger.log("--------------------------------------------------");
    });

  } catch (e) {
    Logger.log("Lỗi ngoại lệ khi thực thi: " + e.message);
  }
}
/**
 * =================================================================
 * HÀM TỰ ĐỘNG DUYỆT (ON EDIT) - PHIÊN BẢN 13 (CÓ CHECK MIỄN PHÍ)
 * =================================================================
 */
function autoDuyetHocVien(e) {
  const range = e.range;
  const sheet = range.getSheet();
  const sheetName = sheet.getName();
  Logger.log(`Trigger started by edit in sheet: ${sheetName}, range: ${range.getA1Notation()}`);

  // 1. Check sheet and column
  if (sheetName !== "LS_DangKy") { 
      Logger.log("Edit not in LS_DangKy sheet. Exiting.");
      return; 
  }
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const headerMap = {}; 
  headers.forEach((h, i) => headerMap[h] = i);
  
  const statusColIndex = headers.indexOf("Trạng thái duyệt");
  
  if (statusColIndex === -1) { 
      Logger.log("ERROR: Column 'Trạng thái duyệt' not found in LS_DangKy. Exiting.");
      return;
  }
  
  if (range.getColumn() !== statusColIndex + 1) { 
      Logger.log(`Edit not in 'Trạng thái duyệt' column (${statusColIndex + 1}). Edited column: ${range.getColumn()}. Exiting.`);
      return; 
  }

  const newValue = range.getValue().toString().trim(); 
  const newValueLower = newValue.toLowerCase(); 
  Logger.log(`New status value: "${newValue}"`);

  if (!newValueLower.startsWith("đã duyệt")) { 
      Logger.log("New status does not start with 'đã duyệt'. Exiting.");
      return; 
  }

  const isBaoLuu = newValueLower.includes("bảo lưu"); 
  Logger.log(`Is Bảo Lưu case? ${isBaoLuu}`); 

  try {
    const editedRow = range.getRow();
    const rowData = sheet.getRange(editedRow, 1, 1, headers.length).getValues()[0];
    Logger.log(`Processing row ${editedRow} in LS_DangKy.`);

    // 2. Get data from LS_DangKy row
    const studentCode = rowData[headerMap["MÃ CODE"]];
    if (!studentCode) { 
        Logger.log(`Error: Missing MÃ CODE in LS_DangKy row ${editedRow}.`);
        SpreadsheetApp.getActiveSpreadsheet().toast(`Lỗi dòng ${editedRow}: Thiếu MÃ CODE.`, "❌ Lỗi", 10);
        return; 
    }
    Logger.log(`Student Code: ${studentCode}`);
    
    const newCourseTopic = rowData[headerMap["Lớp ĐK mới"]];
    const newCourseName = rowData[headerMap["Khóa ĐK mới"]];
    const newDepositLink = rowData[headerMap["Link ảnh cọc mới"]];
    const newCourseCode = rowData[headerMap["Mã lớp mới"]];
    const oldCourseFromThisBaoLuu = isBaoLuu ? (rowData[headerMap["Khóa học cũ"]] || "") : ""; 
    Logger.log(`New Topic=${newCourseTopic}, New Course=${newCourseName}, Old Course (from LS row)=${oldCourseFromThisBaoLuu}`);

    // 3. Find student info in DKy sheet
    const dkySheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!dkySheet) throw new Error("Không tìm thấy sheet " + SHEET_NAME);
    const dkyHeaders = dkySheet.getRange(1, 1, 1, dkySheet.getLastColumn()).getValues()[0];
    const dkyHeaderMap = {}; 
    dkyHeaders.forEach((h, i) => dkyHeaderMap[h.trim()] = i); 
    Logger.log("DKy Headers Map: " + JSON.stringify(dkyHeaderMap)); 
    
    const studentInfo = findUserInfoByCode(String(studentCode), dkySheet, dkyHeaders); 
    if (!studentInfo) { 
        Logger.log(`Error: Cannot find student ${studentCode} in DKy sheet.`);
        SpreadsheetApp.getActiveSpreadsheet().toast(`Lỗi nghiêm trọng: Không tìm thấy HV ${studentCode} trong sheet ${SHEET_NAME}.`, "❌ Lỗi Mã HV", 15);
        return; 
    }
    
    const studentEmail = studentInfo.email; 
    const studentName = studentInfo.name; 
    const studentRowIndex = studentInfo.row; 
    const currentClass = studentInfo.classStatus || ""; 
    const affiliateLink = studentInfo.affiliateLink; 
    Logger.log(`Found Student in DKy: Name=${studentName}, Current Class=${currentClass}, Row=${studentRowIndex}`); 

    const baoLuuStatusCol = "Trạng thái Bảo lưu"; 
    const baoLuuStatusColIndex = dkyHeaderMap[baoLuuStatusCol];
    const upgradeTimeColIndex = dkyHeaderMap["Thời gian nâng cấp"]; 
    
    if (baoLuuStatusColIndex === undefined || baoLuuStatusColIndex === -1) {
         Logger.log(`Warning: Column '${baoLuuStatusCol}' not found in DKy sheet. Cannot clear status.`);
    }

    // 4. Update DKy Sheet based on case
    let shouldUpdateDKyClassCourse = false; 
    let updateDepositStatus = ""; 
    let toastMessage = "";

    if (isBaoLuu) {
        // --- XỬ LÝ BẢO LƯU ---
        Logger.log("Handling Bảo Lưu case...");
        const baoLuuNote = newDepositLink || ""; 
        const isHocLaiKHC = baoLuuNote.toUpperCase().includes("KHC"); 
        Logger.log(`Bảo lưu note: "${baoLuuNote}", Is KHC: ${isHocLaiKHC}`);

        updateDepositStatus = isHocLaiKHC ? "Học lại (KHC)" : "Bảo lưu (Đã CK)";

        if (currentClass.trim().toLowerCase() === "86 ngày đồng hành") {
            shouldUpdateDKyClassCourse = false; 
            updateDepositStatus = isHocLaiKHC ? "VIP - Học lại (KHC)" : "VIP - Học lớp bảo lưu";
            toastMessage = `HV ${studentName} (VIP) học thêm lớp ${isHocLaiKHC ? 'học lại (KHC)' : 'bảo lưu'}. Trạng thái chính không đổi.`;
            Logger.log(`VIP case: Not updating DKy Class/Course. Setting deposit status to: ${updateDepositStatus}`);
        } else {
            shouldUpdateDKyClassCourse = true; 
            toastMessage = `Đã xếp lớp ${isHocLaiKHC ? 'học lại (KHC)' : 'bảo lưu'} cho HV ${studentName}.`;
            Logger.log(`Non-VIP case: Updating DKy Class/Course. Setting deposit status to: ${updateDepositStatus}`);
        }

        // Luôn cố gắng xóa trạng thái bảo lưu tương ứng
        if (baoLuuStatusColIndex !== undefined && baoLuuStatusColIndex !== -1) { 
            if (oldCourseFromThisBaoLuu) { 
                try {
                    const cell = dkySheet.getRange(studentRowIndex, baoLuuStatusColIndex + 1);
                    let currentCombinedStatus = cell.getValue().toString().trim();
                    const statusToRemove = `Đang bảo lưu (Từ ${oldCourseFromThisBaoLuu})`;
                    
                    let updatedStatus = currentCombinedStatus;
                    updatedStatus = updatedStatus.replace(statusToRemove + "; ", "").replace("; " + statusToRemove, "").replace(statusToRemove, "").trim(); 

                    if (updatedStatus !== currentCombinedStatus) {
                        cell.setValue(updatedStatus); 
                        Logger.log(`Successfully updated status in ${cell.getA1Notation()}`); 
                    }
                } catch (updateError) { 
                    Logger.log(`ERROR updating bảo lưu status: ${updateError.message}`); 
                 }
            }
        } 
        
    } else { // isBaoLuu is false
        // --- XỬ LÝ DUYỆT THÔNG THƯỜNG (HOẶC NÂNG CẤP) ---
        Logger.log("Handling regular approval case...");
        
        // [LOGIC MỚI] Kiểm tra xem lớp mới có phải MIỄN PHÍ không
        const courseInfoCheck = _getCourseInfo(newCourseCode);
        // Kiểm tra phí cọc (nếu = 0 hoặc không có thì coi là miễn phí)
        const isFreeCourse = courseInfoCheck && (courseInfoCheck.depositFee === 0 || Number(courseInfoCheck.depositFee) === 0);
        
        shouldUpdateDKyClassCourse = true; 
        
        if (currentClass.trim().toLowerCase() === "86 ngày đồng hành") {
            // 1. Nếu là VIP -> Không đổi lớp chính
            shouldUpdateDKyClassCourse = false; 
            updateDepositStatus = "VIP - Học lớp mới"; 
            toastMessage = `HV ${studentName} (VIP) học thêm lớp mới. Trạng thái chính không đổi.`;
            Logger.log(`VIP regular case: NOT updating DKy Class/Course.`);
            
        } else if (isFreeCourse) {
            // 2. [MỚI] Nếu là Lớp Miễn Phí -> Không đổi lớp chính
            shouldUpdateDKyClassCourse = false;
            updateDepositStatus = "Đã duyệt (Lớp miễn phí)";
            toastMessage = `HV ${studentName} đăng ký lớp miễn phí (${newCourseName}). Giữ nguyên trạng thái lớp cũ.`;
            Logger.log(`Free course detected (${newCourseCode}). NOT updating DKy Class/Course.`);
            
        } else {
            // 3. Lớp thường có phí -> Cập nhật lớp chính
             if (newDepositLink) {
                 if (newDepositLink.toLowerCase().startsWith("http") || newDepositLink.toLowerCase().startsWith("drive.google.com")) {
                     const linkCocCell = dkySheet.getRange(studentRowIndex, dkyHeaderMap["Link ảnh cọc"] + 1);
                     if (linkCocCell) linkCocCell.setValue(newDepositLink); 
                     updateDepositStatus = "Đã CK (ĐK lớp mới)"; 
                     Logger.log(`Updated 'Link ảnh cọc'.`);
                 } else {
                     updateDepositStatus = "ĐK lớp mới (Dùng cọc cũ?)"; 
                 }
             } else {
                 updateDepositStatus = "ĐK lớp mới (Chưa CK?)"; 
             }
             toastMessage = `Đã duyệt & cập nhật DKy cho HV ${studentName}.`;
        }
        
        // Ghi thời gian nâng cấp nếu là 86D
        if (newCourseTopic === "86 ngày đồng hành") {
            if (upgradeTimeColIndex !== undefined && upgradeTimeColIndex !== -1) {
                dkySheet.getRange(studentRowIndex, upgradeTimeColIndex + 1).setValue(new Date());
                Logger.log(`Updated 'Thời gian nâng cấp' in DKy row ${studentRowIndex}`);
            }
        }
    }

    // --- Thực hiện cập nhật DKy dựa trên biến cờ ---
    if (shouldUpdateDKyClassCourse) {
        const lopDKColIdx = dkyHeaderMap["Lớp đăng ký"];
        const khoaDKColIdx = dkyHeaderMap["Khoá đăng ký"];
        const maLopColIdx = dkyHeaderMap["Mã lớp"];
        if (lopDKColIdx !== undefined && lopDKColIdx !== -1) {
             dkySheet.getRange(studentRowIndex, lopDKColIdx + 1).setValue(newCourseTopic);
        }
        if (khoaDKColIdx !== undefined && khoaDKColIdx !== -1) {
             dkySheet.getRange(studentRowIndex, khoaDKColIdx + 1).setValue(newCourseName);
        }
        if (maLopColIdx !== undefined && maLopColIdx !== -1) {
             dkySheet.getRange(studentRowIndex, maLopColIdx + 1).setValue(newCourseCode); 
        }
        Logger.log(`ACTION: Updated Lớp/Khóa/Mã Lớp in DKy row ${studentRowIndex}`);
    } else {
         Logger.log(`ACTION: SKIPPED updating Lớp/Khóa in DKy row ${studentRowIndex}`);
    }
    
    // Cập nhật Trạng thái cọc
    const depositStatusColIndex = dkyHeaderMap["Trạng thái cọc"];
    if (depositStatusColIndex !== undefined && depositStatusColIndex !== -1 && updateDepositStatus) {
         dkySheet.getRange(studentRowIndex, depositStatusColIndex + 1).setValue(updateDepositStatus);
         Logger.log(`ACTION: Updated 'Trạng thái cọc' to: ${updateDepositStatus}`);
    }

    if (toastMessage) {
        SpreadsheetApp.getActiveSpreadsheet().toast(toastMessage, "Thông báo", 7);
    }

    // 5. Gửi email chào mừng
    if (studentEmail) { 
        Logger.log(`Attempting to send email to ${studentEmail}`);
        
        if (newCourseTopic === "86 ngày đồng hành" && !isBaoLuu) { 
             Logger.log("Preparing 86-day upgrade email...");
             const subject = `Chúc mừng ${studentName} đã nâng cấp thành công Lộ trình 86 ngày!`;
             const template = HtmlService.createTemplateFromFile('email_upgrade_confirmation');
             template.name = studentName;
             template.affiliateLink = affiliateLink; 
            
             let inlineImages = {};
             try { 
                 if (affiliateLink) {
                     const encodedLink = encodeURIComponent(affiliateLink);
                     const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedLink}`;
                     const response = UrlFetchApp.fetch(qrApiUrl);
                     if (response.getResponseCode() == 200) {
                         inlineImages['qrImage'] = response.getBlob();
                     } 
                 } 
             } catch (err) { Logger.log(`Error generating QR: ${err.message}`); }

             template.qrImageBlob = inlineImages['qrImage'] ? true : false;
             const htmlBody = template.evaluate().getContent();
             GmailApp.sendEmail(studentEmail, subject, "", { htmlBody: htmlBody, name: "BTC Dự Án BRK", inlineImages: inlineImages, charset: 'UTF-8' });
             Logger.log("Sent 86-day upgrade email.");

        } else if (newCourseTopic !== "86 ngày đồng hành") { 
             Logger.log(`Preparing short course email for: ${newCourseName}`);
             const courseInfo = _getCourseInfoByCourseName(newCourseName); 
             if (courseInfo) { 
                 sendMasterWelcomeEmail(
                     studentName, studentEmail, String(studentCode), 
                     newCourseTopic, newCourseName, courseInfo.startDate, affiliateLink, 
                     courseInfo.zaloLink, courseInfo.emailContent, 
                     false 
                 );
                 Logger.log(`Sent short course email for ${newCourseName}.`); 
              } else { 
                 Logger.log(`ERROR: Could not find course info for "${newCourseName}" in KH sheet.`);
              }
        } 
    } else {
         Logger.log(`Skipping email for HV ${studentCode} because email is missing.`);
    }

  } catch (err) {
    Logger.log("ERROR in autoDuyetHocVien: " + err.message + " Stack: " + err.stack);
    SpreadsheetApp.getActiveSpreadsheet().toast("Lỗi autoDuyet: " + err.message, "❌ Lỗi hệ thống", 15);
  } finally {
     Logger.log("autoDuyetHocVien finished execution."); 
  }
}
/**
 * Hiển thị hộp thoại để nhập Mã Code và xử lý đăng ký bảo lưu.
 */
function promptAndProcessBaoLuu() {
  const ui = SpreadsheetApp.getUi();
  
  // Hỏi Mã Code
  const codeResult = ui.prompt('Đăng ký Bảo lưu', 'Nhập MÃ CODE của học viên cần bảo lưu:', ui.ButtonSet.OK_CANCEL);
  
  if (codeResult.getSelectedButton() !== ui.Button.OK || !codeResult.getResponseText()) {
    ui.alert('Đã hủy thao tác.');
    return;
  }
  const studentCode = codeResult.getResponseText().trim();

  // (Tùy chọn) Hỏi lý do
  const reasonResult = ui.prompt('Lý do Bảo lưu (Tùy chọn)', `Nhập lý do bảo lưu cho HV ${studentCode} (để trống nếu không có):`, ui.ButtonSet.OK_CANCEL);
  const reason = (reasonResult.getSelectedButton() === ui.Button.OK) ? reasonResult.getResponseText().trim() : "";

  // Gọi hàm xử lý chính
  try {
    const resultMessage = processBaoLuu(studentCode, reason);
    ui.alert(resultMessage);
  } catch (error) {
    Logger.log("Lỗi khi xử lý bảo lưu: " + error.message + " Stack: " + error.stack);
    ui.alert('Lỗi nghiêm trọng: ' + error.message);
  }
}
/**
 * [ĐÃ NÂNG CẤP] Xử lý logic cập nhật bảo lưu.
 * Tự động lấy MÃ LỚP hiện tại của HV để ghi vào LS_DangKy -> Giúp báo cáo chạy đúng.
 */
function processBaoLuu(studentCode, reason) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const dkySheet = ss.getSheetByName(SHEET_NAME); // Sheet DKy
  const lsSheet = ss.getSheetByName("LS_DangKy"); // Sheet Lịch sử

  if (!dkySheet || !lsSheet) {
    throw new Error("Không tìm thấy sheet DKy hoặc LS_DangKy.");
  }

  // --- 1. Tìm Học viên và Lấy thông tin hiện tại trong DKy ---
  const dkyHeaders = dkySheet.getRange(1, 1, 1, dkySheet.getLastColumn()).getValues()[0];
  const dkyHeaderMap = {};
  dkyHeaders.forEach((h, i) => dkyHeaderMap[h.trim()] = i); 

  const studentInfo = findUserInfoByCode(studentCode, dkySheet, dkyHeaders);

  if (!studentInfo) {
    throw new Error(`Không tìm thấy học viên nào có MÃ CODE là "${studentCode}" trong sheet ${SHEET_NAME}.`);
  }

  const studentName = studentInfo.name;
  const studentRowIndex = studentInfo.row;
  
  // Lấy thông tin lớp học hiện tại
  const oldClass = studentInfo.classStatus || "Không rõ"; 
  const oldCourse = studentInfo.course || "Không rõ"; 
  
  // [QUAN TRỌNG] Lấy MÃ LỚP hiện tại (Ví dụ: KD02, 86D...) từ DKy
  let currentClassCode = "";
  if (dkyHeaderMap["Mã lớp"] !== undefined) {
      currentClassCode = dkySheet.getRange(studentRowIndex, dkyHeaderMap["Mã lớp"] + 1).getValue();
  }

  // --- 2. Cập nhật trạng thái vào Sheet DKy (Ghi chú thêm) ---
  const baoLuuStatusCol = "Trạng thái Bảo lưu"; 
  const ghiChuBaoLuuCol = "Ghi chú Bảo lưu"; 

  const baoLuuStatusColIndex = dkyHeaderMap[baoLuuStatusCol]; 
  const ghiChuBaoLuuColIndex = dkyHeaderMap[ghiChuBaoLuuCol]; 

  if (baoLuuStatusColIndex === undefined) { 
    throw new Error(`Không tìm thấy cột "${baoLuuStatusCol}" trong sheet ${SHEET_NAME}.`);
  }

  const newBaoLuuStatusText = `Đang bảo lưu (Từ ${oldCourse})`; 
  if (baoLuuStatusColIndex !== -1) { 
      const cell = dkySheet.getRange(studentRowIndex, baoLuuStatusColIndex + 1);
      const currentStatus = cell.getValue().toString().trim(); 
      // Nối chuỗi nếu chưa có
      if (!currentStatus.includes(newBaoLuuStatusText)) {
          let finalStatus = (currentStatus === "") ? newBaoLuuStatusText : (currentStatus + "; " + newBaoLuuStatusText); 
          cell.setValue(finalStatus); 
      }
  }
  
  if (ghiChuBaoLuuColIndex !== undefined && ghiChuBaoLuuColIndex !== -1 && reason) { 
      dkySheet.getRange(studentRowIndex, ghiChuBaoLuuColIndex + 1).setValue(reason);
  }

  // --- 3. Ghi dòng Lịch sử vào LS_DangKy ---
  const lsHeaders = lsSheet.getRange(1, 1, 1, lsSheet.getLastColumn()).getValues()[0];
  const lsHeaderMap = {};
  lsHeaders.forEach((h, i) => lsHeaderMap[h.trim()] = i);

  const lsData = {
    "Dấu thời gian": new Date(),
    "MÃ CODE": studentCode,
    "Họ và tên": studentName,
    "Lớp học cũ": oldClass, 
    "Khóa học cũ": oldCourse, 
    
    // [QUAN TRỌNG] Ghi Mã lớp cũ vào đây để Báo cáo biết đường trừ quân số
    "Mã lớp mới": currentClassCode, 
    
    "Lớp ĐK mới": `Bảo lưu (Từ ${oldClass})`, 
    "Khóa ĐK mới": `Bảo lưu (Từ ${oldCourse})`, 
    "Phí cọc mới": 0, 
    "Link ảnh cọc mới": reason || "Bảo lưu", 
    "Trạng thái duyệt": "Đã xác nhận bảo lưu", // Trạng thái chuẩn để đếm bảo lưu
  };

  const lsRowData = lsHeaders.map(header => lsData[header] !== undefined ? lsData[header] : ''); 
  lsSheet.appendRow(lsRowData);
  
  Logger.log(`Đã xử lý bảo lưu cho ${studentName} - Mã lớp: ${currentClassCode}`);

  return studentName; 
}
/**
 * Chạy bảo lưu hàng loạt bằng cách NHẬP DANH SÁCH Mã Code.
 */
function processBaoLuuBatch() {
  const ui = SpreadsheetApp.getUi();
  
  // --- THAY ĐỔI BẮT ĐẦU TỪ ĐÂY ---
  // 1. Hiển thị hộp thoại yêu cầu nhập danh sách Mã Code
  const promptResult = ui.prompt(
    'Bảo lưu hàng loạt', 
    'Sao chép (Copy) và Dán (Paste) danh sách MÃ CODE cần bảo lưu vào đây.\n(Mỗi mã code nên ở 1 dòng riêng, hoặc cách nhau bằng dấu phẩy/dấu cách)', 
    ui.ButtonSet.OK_CANCEL
  );

  if (promptResult.getSelectedButton() !== ui.Button.OK || !promptResult.getResponseText()) {
    ui.alert('Đã hủy thao tác.');
    return;
  }

  // 2. Xử lý danh sách Mã Code được dán vào
  const inputText = promptResult.getResponseText();
  // Tách chuỗi bằng dấu xuống dòng, dấu phẩy, hoặc dấu cách
  // Sau đó lọc bỏ các phần tử rỗng (ví dụ: các dòng trống)
  const studentCodes = inputText
                          .split(/[\n, ]+/) // Tách bằng newline, comma, hoặc space
                          .filter(code => String(code).trim() !== "") // Lọc bỏ chuỗi rỗng
                          .map(code => String(code).trim()); // Trim khoảng trắng mỗi mã code

  // --- KẾT THÚC THAY ĐỔI ---

  if (studentCodes.length === 0) {
    ui.alert('Không tìm thấy Mã Code nào hợp lệ trong danh sách bạn đã nhập.');
    return;
  }

  // 3. Hỏi lý do chung (Giữ nguyên)
  const reasonResult = ui.prompt(
    'Bảo lưu hàng loạt', 
    `Bạn sắp bảo lưu cho ${studentCodes.length} học viên.\n\nNhập lý do chung (ví dụ: "Học lại - KHC" hoặc để trống):`, 
    ui.ButtonSet.OK_CANCEL
  );

  if (reasonResult.getSelectedButton() !== ui.Button.OK) {
    ui.alert('Đã hủy thao tác.');
    return;
  }
  const reason = reasonResult.getResponseText().trim();

  // 4. Chạy vòng lặp và xử lý (Giữ nguyên)
  SpreadsheetApp.getActiveSpreadsheet().toast(`Đang xử lý bảo lưu cho ${studentCodes.length} học viên...`, "Bắt đầu", -1);
  let successCount = 0;
  let failCount = 0;
  let errorMessages = [];

  for (const code of studentCodes) {
    // const studentCodeStr = String(code).trim(); // Đã trim() ở bước 2
    try {
      // Gọi hàm xử lý đơn lẻ (đã sửa)
      const studentName = processBaoLuu(code, reason); // Dùng code đã trim
      successCount++;
      Logger.log(`Bảo lưu hàng loạt: Thành công cho ${studentName} (${code})`);
    } catch (e) {
      failCount++;
      errorMessages.push(`- HV Mã ${code}: ${e.message}`);
      Logger.log(`Bảo lưu hàng loạt: Thất bại cho ${code}. Lỗi: ${e.message}`);
    }
  }

  // 5. Thông báo kết quả (Giữ nguyên)
  SpreadsheetApp.getActiveSpreadsheet().toast('Hoàn tất!', 'Xong', 5);
  let summary = `Hoàn tất bảo lưu hàng loạt.\n\nThành công: ${successCount}\nThất bại: ${failCount}`;
  if (failCount > 0) {
      summary += `\n\nChi tiết lỗi:\n${errorMessages.join('\n')}`;
  }
  ui.alert(summary);
}
/**
 * Hiển thị hộp thoại hỏi Mã Code HV, LOẠI XẾP LỚP (Bảo lưu/Học lại), 
 * và thông tin cần thiết, sau đó gọi hàm xử lý tương ứng.
 */
function promptAndProcessReturnFromBaoLuu() {
  const ui = SpreadsheetApp.getUi();
  
  // 1. Hỏi Mã Code HV
  const codeResult = ui.prompt('Xếp lớp HV cũ', 'Nhập MÃ CODE của học viên cần xếp lớp:', ui.ButtonSet.OK_CANCEL);
  if (codeResult.getSelectedButton() !== ui.Button.OK || !codeResult.getResponseText()) {
    ui.alert('Đã hủy thao tác.');
    return;
  }
  const studentCode = codeResult.getResponseText().trim();

  // --- TÌM THÔNG TIN HV TRƯỚC ---
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const dkySheet = ss.getSheetByName(SHEET_NAME); 
  if (!dkySheet) { ui.alert("Lỗi: Không tìm thấy sheet DKy."); return; }
  const dkyHeaders = dkySheet.getRange(1, 1, 1, dkySheet.getLastColumn()).getValues()[0];
  const studentInfo = findUserInfoByCode(studentCode, dkySheet, dkyHeaders);
  if (!studentInfo) {
    ui.alert(`Không tìm thấy học viên nào có MÃ CODE là "${studentCode}".`);
    return;
  }
  const studentName = studentInfo.name; // Lấy tên để hiển thị

  // 2. Hỏi LOẠI XẾP LỚP
  const typePrompt = ui.prompt(
    `Xếp lớp cho HV: ${studentName} (${studentCode})`,
    'Chọn loại xếp lớp:\n1. Quay lại từ Bảo lưu (Giữ ĐK hoàn cọc)\n2. Chỉ Học lại (Không hoàn cọc - KHC)\n\nNhập số 1 hoặc 2:', 
    ui.ButtonSet.OK_CANCEL
  );
  if (typePrompt.getSelectedButton() !== ui.Button.OK || !typePrompt.getResponseText()) {
    ui.alert('Đã hủy thao tác.');
    return;
  }
  const typeChoice = typePrompt.getResponseText().trim();

  let selectedOldCourse = null; // Sẽ lấy giá trị nếu là bảo lưu
  let processType = ""; // Loại xử lý: 'bao_luu' hoặc 'hoc_lai'

  // 3. Xử lý dựa trên lựa chọn loại
  if (typeChoice === '1') {
      // --- Xử lý Quay lại từ Bảo lưu ---
      processType = 'bao_luu';
      // Lấy danh sách khóa đang bảo lưu (từ code cũ)
      const dkyHeaderMap = {};
      dkyHeaders.forEach((h, i) => dkyHeaderMap[h.trim()] = i);
      const baoLuuStatusCol = "Trạng thái Bảo lưu";
      const baoLuuStatusColIndex = dkyHeaderMap[baoLuuStatusCol];
      let reservedCourses = []; 
      if (baoLuuStatusColIndex !== undefined && baoLuuStatusColIndex > -1) {
          const currentBaoLuuStatus = dkySheet.getRange(studentInfo.row, baoLuuStatusColIndex + 1).getValue().toString().trim();
          if (currentBaoLuuStatus) {
              const statuses = currentBaoLuuStatus.split(';'); 
              statuses.forEach(status => {
                  status = status.trim();
                  if (status.startsWith("Đang bảo lưu (Từ ")) {
                      try {
                          const courseName = status.substring("Đang bảo lưu (Từ ".length, status.length - 1).trim();
                          if (courseName) reservedCourses.push(courseName);
                      } catch (ex) { Logger.log("Lỗi tách tên khóa từ: " + status);}
                  }
              });
          }
      }
      if (reservedCourses.length === 0) {
          ui.alert(`Học viên này hiện không có khóa học nào đang bảo lưu trong sheet DKy.`);
          return;
      }
      // Hỏi chọn khóa bảo lưu muốn dùng
      let promptMessage = `HV ${studentName} đang bảo lưu các khóa:\n`;
      reservedCourses.forEach((course, index) => { promptMessage += `${index + 1}. ${course}\n`; });
      promptMessage += `\nNhập SỐ THỨ TỰ của khóa bảo lưu muốn SỬ DỤNG:`;
      const selectedIndexResult = ui.prompt('Chọn Khóa Bảo Lưu Sử Dụng', promptMessage, ui.ButtonSet.OK_CANCEL);
      if (selectedIndexResult.getSelectedButton() !== ui.Button.OK || !selectedIndexResult.getResponseText()) { ui.alert('Đã hủy.'); return; }
      const selectedIndex = parseInt(selectedIndexResult.getResponseText().trim(), 10) - 1; 
      if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= reservedCourses.length) { ui.alert('Lựa chọn không hợp lệ.'); return; }
      selectedOldCourse = reservedCourses[selectedIndex]; // Lấy tên khóa cũ được chọn

  } else if (typeChoice === '2') {
      // --- Xử lý Học lại (KHC) ---
      processType = 'hoc_lai';
      // Không cần hỏi khóa bảo lưu nào
      selectedOldCourse = null; // Đặt là null để hàm xử lý biết
  } else {
      ui.alert('Lựa chọn không hợp lệ. Vui lòng nhập 1 hoặc 2.');
      return;
  }

  // 4. Hỏi Mã Khóa học MỚI (cho cả 2 trường hợp)
  let newCoursePromptMsg = `Nhập MÃ KHÓA HỌC MỚI muốn xếp cho HV ${studentName}`;
  if (processType === 'bao_luu') {
      newCoursePromptMsg += ` (sử dụng suất từ ${selectedOldCourse}):`;
  } else {
       newCoursePromptMsg += ` (học lại, không hoàn cọc):`;
  }
  const courseCodeResult = ui.prompt('Xếp lớp HV cũ', newCoursePromptMsg, ui.ButtonSet.OK_CANCEL);
  if (courseCodeResult.getSelectedButton() !== ui.Button.OK || !courseCodeResult.getResponseText()) {
    ui.alert('Đã hủy thao tác.');
    return;
  }
  const newCourseCode = courseCodeResult.getResponseText().trim().toUpperCase(); 
  
  // 5. Hiển thị thông báo đang xử lý
  SpreadsheetApp.getActiveSpreadsheet().toast(`Đang xử lý xếp lớp cho HV ${studentCode}...`, "Vui lòng chờ", -1);

  // 6. Gọi hàm xử lý chính
  try {
    // Truyền loại xử lý, mã HV, mã khóa mới, khóa cũ (nếu có), thông tin HV
    const resultMessage = processReturnOrHocLai(processType, studentCode, newCourseCode, selectedOldCourse, studentInfo); 
    SpreadsheetApp.getActiveSpreadsheet().toast(resultMessage.split('\n')[0], "Hoàn tất", 10); // Chỉ hiện dòng đầu ở toast
    ui.alert(resultMessage); 
  } catch (error) {
    SpreadsheetApp.getActiveSpreadsheet().toast("Đã xảy ra lỗi.", "Lỗi", 10);
    Logger.log("Lỗi khi xử lý xếp lớp HV cũ: " + error.message + " Stack: " + error.stack);
    ui.alert('Lỗi nghiêm trọng: ' + error.message);
  }
}

/**
 * Thêm dòng đăng ký mới vào LS_DangKy cho HV cũ quay lại học (Bảo lưu hoặc Học lại KHC).
 * @param {string} type Loại xử lý: 'bao_luu' hoặc 'hoc_lai'.
 * @param {string} studentCode Mã Code của học viên.
 * @param {string} newCourseCode Mã Khóa học mới họ muốn tham gia.
 * @param {string | null} selectedOldCourse Tên Khóa học cũ (đã bảo lưu) được chọn (chỉ dùng cho type='bao_luu').
 * @param {object} studentInfo Thông tin HV đã tìm thấy từ DKy.
 * @returns {string} Thông báo kết quả.
 */
function processReturnOrHocLai(type, studentCode, newCourseCode, selectedOldCourse, studentInfo) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID); // Mở file chứa sheet
  const lsSheet = ss.getSheetByName("LS_DangKy");
  const khSheet = ss.getSheetByName(COURSE_SHEET_NAME); 

  if (!lsSheet || !khSheet) {
    throw new Error("Không tìm thấy một trong các sheet: LS_DangKy, KH.");
  }

  // --- Lấy thông tin từ studentInfo ---
  const studentName = studentInfo.name;
  // Lớp/Khóa cũ lấy từ trạng thái hiện tại trong DKy
  const oldClassBeforeEvent = studentInfo.classStatus || "Không rõ"; 
  const oldCourseBeforeEvent = studentInfo.course || "Không rõ"; 

  // --- Tìm thông tin Khóa học MỚI ---
  const newCourseInfo = _getCourseInfo(newCourseCode); 
  if (!newCourseInfo) {
      return `Lỗi: Không tìm thấy thông tin cho Mã Khóa học mới "${newCourseCode}" trong sheet ${COURSE_SHEET_NAME}.`;
  }

  // --- Chuẩn bị dữ liệu cho LS_DangKy dựa vào type ---
  let lsData = {
    "Dấu thời gian": new Date(),
    "MÃ CODE": studentCode,
    "Họ và tên": studentName,
    "Lớp học cũ": oldClassBeforeEvent, 
    "Khóa học cũ": "", // Sẽ gán bên dưới
    "Lớp ĐK mới": newCourseInfo.topic, 
    "Khóa ĐK mới": newCourseInfo.name, 
    "Mã lớp mới": newCourseInfo.code, 
    "Phí cọc mới": 0,
    "Link ảnh cọc mới": "", // Sẽ gán bên dưới
    "Trạng thái duyệt": "", // Sẽ gán bên dưới
    // Thêm các cột khác nếu cần
  };
  
  let resultMessage = "";

  if (type === 'bao_luu') {
      lsData["Khóa học cũ"] = selectedOldCourse; // Khóa cũ là khóa bảo lưu được chọn
      lsData["Link ảnh cọc mới"] = `Bảo lưu (Từ ${selectedOldCourse})`; 
      lsData["Trạng thái duyệt"] = "Chờ duyệt (Bảo lưu)"; 
      resultMessage = `Đã thêm dòng đăng ký khóa "${newCourseInfo.name}" cho HV ${studentName} (${studentCode}) vào LS_DangKy (sử dụng suất bảo lưu từ ${selectedOldCourse}).\n\nHãy vào sheet LS_DangKy và đổi trạng thái thành "Đã duyệt (Bảo lưu)" để hoàn tất.`;
  
  } else if (type === 'hoc_lai') {
      lsData["Khóa học cũ"] = oldCourseBeforeEvent; // Khóa cũ là khóa gần nhất họ học
      lsData["Link ảnh cọc mới"] = "Học lại - KHC"; 
      lsData["Trạng thái duyệt"] = "Đã duyệt (Học lại KHC)"; // Duyệt thẳng luôn
      resultMessage = `Đã thêm dòng đăng ký HỌC LẠI (KHC) khóa "${newCourseInfo.name}" cho HV ${studentName} (${studentCode}) vào LS_DangKy với trạng thái đã duyệt.`;
      // Lưu ý: Trạng thái này sẽ KHÔNG kích hoạt autoDuyetHocVien để cập nhật DKy hoặc gửi mail (trừ khi bạn sửa autoDuyet)
      // Bạn cần thêm HV vào Zalo thủ công nếu cần.
  } else {
      throw new Error("Loại xử lý không hợp lệ: " + type);
  }


  // --- Thêm dòng vào LS_DangKy ---
  const lsHeaders = lsSheet.getRange(1, 1, 1, lsSheet.getLastColumn()).getValues()[0];
  const lsRowData = lsHeaders.map(header => lsData[header] !== undefined ? lsData[header] : ''); 
  lsSheet.appendRow(lsRowData);
  Logger.log(`Appended record to LS_DangKy for ${studentCode}, type: ${type}, status: ${lsData["Trạng thái duyệt"]}`);

  return resultMessage; // Trả về thông báo kết quả
}
/**
 * Hiển thị hộp thoại hỏi Tên khóa học, ID Spreadsheet đích, Tên Sheet đích, Hàng/Cột bắt đầu,
 * sau đó gọi hàm tạo danh sách cố định VÀO FILE KHÁC.
 */
function promptAndCreateFixedList() {
  const ui = SpreadsheetApp.getUi();
  
  // 1. Hỏi Tên Khóa học (cần khớp với cột "Khóa ĐK mới" trong LS_DangKy)
  const courseCodeResult = ui.prompt('Chốt Danh sách Lớp', 'Nhập MÃ KHÓA cần chốt danh sách (ví dụ: KD03, LS01, 86D):', ui.ButtonSet.OK_CANCEL);
  if (courseCodeResult.getSelectedButton() !== ui.Button.OK || !courseCodeResult.getResponseText()) {
    ui.alert('Đã hủy thao tác.');
    return;
  }
  const courseCodeToFilter = courseCodeResult.getResponseText().trim().toUpperCase(); // Chuyển mã thành chữ hoa luôn

  // 2. Hỏi ID Spreadsheet Đích
  const targetIdResult = ui.prompt('Chốt Danh sách Lớp', 'Nhập ID của file Google Sheet đích (dãy ký tự trong URL):\nVí dụ: 1aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890', ui.ButtonSet.OK_CANCEL);
  if (targetIdResult.getSelectedButton() !== ui.Button.OK || !targetIdResult.getResponseText()) {
    ui.alert('Đã hủy thao tác.');
    return;
  }
  const targetSpreadsheetId = targetIdResult.getResponseText().trim(); 

  // 3. Hỏi Tên Sheet Đích
  const targetSheetNameResult = ui.prompt('Chốt Danh sách Lớp', 'Nhập Tên Sheet trong file đích muốn ghi dữ liệu vào (ví dụ: DS HV):', ui.ButtonSet.OK_CANCEL);
  if (targetSheetNameResult.getSelectedButton() !== ui.Button.OK || !targetSheetNameResult.getResponseText()) {
    ui.alert('Đã hủy thao tác.');
    return;
  }
  const targetSheetName = targetSheetNameResult.getResponseText().trim();

  // 4. Hỏi Hàng Bắt Đầu
  const startRowResult = ui.prompt('Chốt Danh sách Lớp', `Nhập SỐ HÀNG muốn bắt đầu ghi danh sách (ví dụ: 1 cho hàng đầu tiên):`, ui.ButtonSet.OK_CANCEL);
  if (startRowResult.getSelectedButton() !== ui.Button.OK || !startRowResult.getResponseText()) {
    ui.alert('Đã hủy thao tác.');
    return;
  }
  const startRow = parseInt(startRowResult.getResponseText().trim(), 10);
  if (isNaN(startRow) || startRow < 1) {
      ui.alert('Số hàng không hợp lệ. Vui lòng nhập một số lớn hơn hoặc bằng 1.');
      return;
  }

  // 5. Hỏi Cột Bắt Đầu (Nhập chữ cái)
  const startColLetterResult = ui.prompt('Chốt Danh sách Lớp', `Nhập CHỮ CÁI CỘT muốn bắt đầu ghi danh sách (ví dụ: A):`, ui.ButtonSet.OK_CANCEL);
   if (startColLetterResult.getSelectedButton() !== ui.Button.OK || !startColLetterResult.getResponseText()) {
    ui.alert('Đã hủy thao tác.');
    return;
  }
  const startColLetter = startColLetterResult.getResponseText().trim().toUpperCase();
  // Chuyển chữ cái cột thành số thứ tự (A=1, B=2, ...)
  const startCol = columnLetterToNumber_(startColLetter); 
  if (startCol === -1) {
       ui.alert('Chữ cái cột không hợp lệ. Vui lòng nhập một chữ cái (A, B, C,...).');
       return;
  }

  // 6. Hiển thị thông báo đang xử lý
SpreadsheetApp.getActiveSpreadsheet().toast(`Đang tạo danh sách cho mã khóa "${courseCodeToFilter}" vào sheet "${targetSheetName}", bắt đầu từ ${startColLetter}${startRow}...`, "Vui lòng chờ", -1);

  // 7. Gọi hàm xử lý chính
  try {
    const resultMessage = createFixedStudentList(courseCodeToFilter, targetSheetName, targetSpreadsheetId, startRow, startCol); // <-- TRUYỀN MÃ KHÓA
    SpreadsheetApp.getActiveSpreadsheet().toast(resultMessage, "Hoàn tất", 10); 
    ui.alert(resultMessage); 
  } catch (error) {
    SpreadsheetApp.getActiveSpreadsheet().toast("Đã xảy ra lỗi.", "Lỗi", 10);
    Logger.log("Lỗi khi tạo danh sách cố định: " + error.message + " Stack: " + error.stack);
    ui.alert('Lỗi nghiêm trọng: ' + error.message);
  }
}/**
 * Lọc danh sách HV, tra cứu thông tin chi tiết (Email, SĐT, NGT) từ "DKy",
 * loại bỏ trùng lặp và CHỈ THÊM HV MỚI vào sheet đích (7 CỘT - SẮP XẾP LẠI).
 * (Version 13 - Sửa lỗi 'statusColIndex is not defined')
 * @param {string} courseCodeToFilter MÃ Khóa học cần lọc (ví dụ: KD03).
 * @param {string} targetSheetName Tên của sheet đích.
 * @param {string} targetSpreadsheetId ID của file Spreadsheet đích.
 * @param {number} startRow Số hàng bắt đầu ghi (từ 1).
 * @param {number} startCol Số cột bắt đầu ghi (từ 1).
 * @returns {string} Thông báo kết quả.
 */
function createFixedStudentList(courseCodeToFilter, targetSheetName, targetSpreadsheetId, startRow, startCol) {
  // --- 1. Lấy dữ liệu từ LS_DangKy và lọc/unique ---
  const sourceSs = SpreadsheetApp.getActiveSpreadsheet();
  const lsSheet = sourceSs.getSheetByName("LS_DangKy");
  if (!lsSheet) { throw new Error("Không tìm thấy sheet LS_DangKy trong file hiện tại."); }

  const lsData = lsSheet.getDataRange().getValues();
  if (lsData.length < 2) {
      return `Sheet LS_DangKy không có dữ liệu để lọc cho mã khóa "${courseCodeToFilter}".`;
  }
  const lsHeaders = lsData.shift();
  const lsHeaderMap = {};
  lsHeaders.forEach((h, i) => lsHeaderMap[h.trim()] = i);

  const lsCodeColIndex = lsHeaderMap["MÃ CODE"];
  const lsNameColIndex = lsHeaderMap["Họ và tên"];
  const lsCourseCodeColIndex = lsHeaderMap["Mã lớp mới"];
  const lsStatusColIndex = lsHeaderMap["Trạng thái duyệt"]; // <<< ĐỊNH NGHĨA BIẾN 'lsStatusColIndex'
  
  // --- SỬA LỖI Ở ĐÂY ---
  if ([lsCodeColIndex, lsNameColIndex, lsCourseCodeColIndex, lsStatusColIndex].includes(undefined)) { // <<< SỬA: Dùng 'lsStatusColIndex'
      throw new Error("Thiếu cột (MÃ CODE, Họ và tên, Mã lớp mới, Trạng thái duyệt) trong LS_DangKy.");
  }

  const filteredData = lsData.filter(row => {
      const courseCode = row[lsCourseCodeColIndex] ? row[lsCourseCodeColIndex].toString().trim().toUpperCase() : "";
      const status = row[lsStatusColIndex] ? row[lsStatusColIndex].toString().trim().toLowerCase() : ""; // <<< SỬA: Dùng 'lsStatusColIndex'
      return courseCode === courseCodeToFilter && status.startsWith("đã duyệt");
  });
  // --- KẾT THÚC SỬA LỖI ---

  if (filteredData.length === 0) {
      return `Không tìm thấy học viên nào đã được duyệt cho mã khóa "${courseCodeToFilter}" trong LS_DangKy (tại thời điểm này).`;
  }

  const uniqueStudentsNew = new Map();
  filteredData.forEach(row => {
      const code = row[lsCodeColIndex] ? row[lsCodeColIndex].toString().trim() : "";
      const name = row[lsNameColIndex] ? row[lsNameColIndex].toString().trim() : "";
      if (code) {
          uniqueStudentsNew.set(code, name); 
      }
  });
  Logger.log(`createFixedStudentList - Found ${uniqueStudentsNew.size} unique students from LS_DangKy for code ${courseCodeToFilter}.`);
  // --- Kết thúc lấy dữ liệu LS_DangKy ---

  // --- 2. Đọc toàn bộ "DKy" để tra cứu ---
  const dkySheet = sourceSs.getSheetByName(SHEET_NAME); 
  if (!dkySheet) { throw new Error("Không tìm thấy sheet DKy."); }
  
  const dkyData = dkySheet.getDataRange().getValues();
  const dkyHeaders = dkyData.shift(); 
  const dkyHeaderMap = {};
  dkyHeaders.forEach((h, i) => dkyHeaderMap[h.trim()] = i);

  const dkyCodeCol = dkyHeaderMap["MÃ CODE"];
  const dkyNameCol = dkyHeaderMap["Họ và tên"];
  const dkyPhoneCol = dkyHeaderMap["Số điện thoại"];
  const dkyEmailCol = dkyHeaderMap["Địa chỉ email"]; 
  const dkyRefCodeCol = dkyHeaderMap["Mã giới thiệu"];
  const dkyRefNameCol = dkyHeaderMap["Người giới thiệu"];
  
  if ([dkyCodeCol, dkyNameCol, dkyPhoneCol, dkyEmailCol].includes(undefined)) { 
       throw new Error("Thiếu cột (MÃ CODE, Họ và tên, Số điện thoại, Địa chỉ email) trong DKy.");
  }
  if ([dkyRefCodeCol, dkyRefNameCol].includes(undefined)) {
       Logger.log("Cảnh báo: Thiếu cột Mã giới thiệu hoặc Người giới thiệu trong DKy. Thông tin NGT sẽ bị trống.");
  }

  const dkyDataMap = new Map();
  dkyData.forEach(row => {
      const code = row[dkyCodeCol] ? row[dkyCodeCol].toString().trim() : "";
      if (code) {
          dkyDataMap.set(code, row); 
      }
  });
  Logger.log(`Created lookup map from DKy with ${dkyDataMap.size} records.`);
  // --- Kết thúc đọc DKy ---

  // --- 3. Mở Sheet Đích và Đọc Dữ liệu Cũ ---
  let targetSs;
  try {
      targetSs = SpreadsheetApp.openById(targetSpreadsheetId); 
  } catch (err) { throw new Error(`Không thể mở file Spreadsheet đích... Lỗi: ${err.message}`); }
  
  let targetSheet = targetSs.getSheetByName(targetSheetName); 
  const headersToWrite = ["Mã Code", "Họ và tên", "Mã khóa", "Mã giới thiệu", "Người giới thiệu", "Số điện thoại", "Địa chỉ email"]; 
  const numColumnsToWrite = headersToWrite.length; // = 7
  let existingCodes = new Set(); 
  let firstEmptyRow = startRow; 

  if (!targetSheet) {
      targetSheet = targetSs.insertSheet(targetSheetName);
      Logger.log(`Created new sheet: ${targetSheetName}`);
      targetSheet.getRange(startRow, startCol, 1, numColumnsToWrite).setValues([headersToWrite]).setFontWeight("bold");
      firstEmptyRow = startRow + 1; 
  } else {
      Logger.log(`Target sheet "${targetSheetName}" found.`);
      const codeColumnValues = targetSheet.getRange(startRow, startCol, targetSheet.getMaxRows() - startRow + 1, 1).getValues();
      let lastRowWithData = startRow - 1; 
      for (let i = codeColumnValues.length - 1; i >= 0; i--) { 
          if (codeColumnValues[i][0] !== "") { 
              lastRowWithData = startRow + i; 
              break; 
          }
      }
      Logger.log(`Last row with actual data (col ${startCol}): ${lastRowWithData}`);
      
      firstEmptyRow = lastRowWithData + 1; 
      
      if (lastRowWithData < startRow) { 
           firstEmptyRow = startRow;
           Logger.log(`No existing data found at or after row ${startRow}. Writing header.`);
           targetSheet.getRange(startRow, startCol, 1, numColumnsToWrite).setValues([headersToWrite]).setFontWeight("bold");
           firstEmptyRow = startRow + 1; 
      } else { 
           const headerRowValues = targetSheet.getRange(startRow, startCol, 1, numColumnsToWrite).getValues()[0];
           const isHeaderPresent = headerRowValues && 
                                   headerRowValues[0] && headerRowValues[0].toString().trim().toLowerCase() === headersToWrite[0].toLowerCase();
           if (!isHeaderPresent) {
               Logger.log(`Header not found or mismatch at ${startRow}, ${startCol}. Writing header.`);
               targetSheet.getRange(startRow, startCol, 1, numColumnsToWrite).setValues([headersToWrite]).setFontWeight("bold");
               firstEmptyRow = startRow + 1; 
               Logger.log("Skipping reading existing codes due to header issue.");
           } else {
               Logger.log(`Header found at ${startRow}, ${startCol}.`);
               const numExistingDataRows = lastRowWithData - startRow; 
               if (numExistingDataRows > 0) {
                   const existingDataRange = targetSheet.getRange(startRow + 1, startCol, numExistingDataRows, 1); 
                   const existingCodesData = existingDataRange.getValues();
                   Logger.log(`Reading ${existingCodesData.length} existing codes from range ${existingDataRange.getA1Notation()}`);
                   existingCodesData.forEach(row => {
                       const code = row[0] ? row[0].toString().trim() : "";
                       if (code) { existingCodes.add(code); }
                   });
               } else { Logger.log("Header found, but no data rows below it."); }
               firstEmptyRow = lastRowWithData + 1; 
           }
      }
      Logger.log(`Final existing codes count: ${existingCodes.size}.`);
      Logger.log(`Determined first empty row for writing: ${firstEmptyRow}`);
  }
  
  // --- 4. Tạo Dữ liệu Mới và Tra cứu ---
  const newStudentsToAdd = []; 
  
  uniqueStudentsNew.forEach((name, code) => {
      if (!existingCodes.has(code)) {
          let studentPhone = "";
          let studentEmail = ""; 
          let refCode = "";
          let refName = "";

          const studentRow = dkyDataMap.get(code);
          if (studentRow) {
              studentPhone = (dkyPhoneCol !== undefined && studentRow[dkyPhoneCol] != null) ? studentRow[dkyPhoneCol].toString().trim().replace("'", "") : "";
              studentEmail = (dkyEmailCol !== undefined && studentRow[dkyEmailCol] != null) ? studentRow[dkyEmailCol].toString().trim() : ""; 
              refCode = (dkyRefCodeCol !== undefined && studentRow[dkyRefCodeCol] != null) ? studentRow[dkyRefCodeCol].toString().trim() : "";
              refName = (dkyRefNameCol !== undefined && studentRow[dkyRefNameCol] != null) ? studentRow[dkyRefNameCol].toString().trim() : "";
          } else {
               studentPhone = "LỖI: Không tìm thấy HV trong DKy";
               studentEmail = "LỖI: Không tìm thấy HV trong DKy";
               Logger.log(`Error: Student code ${code} (from LS_DangKy) not found in DKy map.`);
          }
          
          newStudentsToAdd.push([
              code, 
              name, 
              courseCodeToFilter, 
              refCode, 
              refName, 
              studentPhone, 
              studentEmail 
          ]);
      }
  });
  Logger.log(`Found ${newStudentsToAdd.length} new students to add (after comparing with existing).`);

  // --- 5. Ghi Học viên MỚI vào cuối danh sách ---
  if (newStudentsToAdd.length > 0) {
      Logger.log(`Writing ${newStudentsToAdd.length} new students starting from row ${firstEmptyRow}, column ${startCol}`);
      newStudentsToAdd.sort((a, b) => {
          const codeA = parseInt(a[0], 10);
          const codeB = parseInt(b[0], 10);
          if (!isNaN(codeA) && !isNaN(codeB)) { return codeA - codeB; }
          return a[0].localeCompare(b[0]);
      });
      targetSheet.getRange(firstEmptyRow, startCol, newStudentsToAdd.length, numColumnsToWrite).setValues(newStudentsToAdd); 
      Logger.log(`Append successful.`);
      
      if (firstEmptyRow === startRow + 1 && existingCodes.size === 0) { 
           targetSheet.autoResizeColumns(startCol, numColumnsToWrite); 
      }
  }

  // --- 6. Thông báo kết quả ---
  const targetFileUrl = targetSs.getUrl();
  const startColLetter = String.fromCharCode(64 + startCol); 
  if (newStudentsToAdd.length > 0) {
       return `Đã thêm ${newStudentsToAdd.length} học viên mới (7 cột) cho mã khóa "${courseCodeToFilter}" vào sheet "${targetSheetName}" (bắt đầu từ hàng ${firstEmptyRow}) trong file:\n${targetFileUrl}`;
  } else {
       return `Không có học viên mới nào cần thêm cho mã khóa "${courseCodeToFilter}". Tất cả ${uniqueStudentsNew.size} học viên tìm thấy trong LS_DangKy đều đã có trong sheet đích.\nFile: ${targetFileUrl}`;
  }
}
/**
 * Chuyển đổi chữ cái cột thành số thứ tự (A=1, B=2, Z=26, AA=27,...).
 * @param {string} columnLetter Chữ cái cột (ví dụ: "A", "C", "AA").
 * @returns {number} Số thứ tự cột (bắt đầu từ 1) hoặc -1 nếu không hợp lệ.
 * @private
 */
function columnLetterToNumber_(columnLetter) {
  columnLetter = columnLetter.toUpperCase();
  let columnNumber = 0;
  const length = columnLetter.length;
  for (let i = 0; i < length; i++) {
    const charCode = columnLetter.charCodeAt(i);
    if (charCode < 65 || charCode > 90) { // Kiểm tra nếu không phải chữ cái A-Z
      return -1; // Không hợp lệ
    }
    columnNumber = columnNumber * 26 + (charCode - 64);
  }
  return columnNumber > 0 ? columnNumber : -1; // Đảm bảo trả về số dương hoặc -1
}
/**
 * =================================================================
 * CHỨC NĂNG XẾP LỚP HÀNG LOẠT (BẢO LƯU / HỌC LẠI)
 * =================================================================
 */
/**
 * Chạy bảo lưu hàng loạt bằng cách NHẬP DANH SÁCH Mã Code.
 * (Đã sửa để hỏi Mã Khóa Cũ thay vì Tên Khóa Cũ)
 */
function promptAndProcessReturnBatch() {
  const ui = SpreadsheetApp.getUi();

  // 1. Hỏi Loại xếp lớp
  const typePrompt = ui.prompt(
    'Xếp lớp Hàng loạt',
    'Chọn loại xếp lớp:\n1. Quay lại từ Bảo lưu (Giữ ĐK hoàn cọc)\n2. Chỉ Học lại (Không hoàn cọc - KHC)\n\nNhập số 1 hoặc 2:', 
    ui.ButtonSet.OK_CANCEL
  );
  if (typePrompt.getSelectedButton() !== ui.Button.OK) { ui.alert('Đã hủy.'); return; }
  const typeChoice = typePrompt.getResponseText().trim();

  let processType = "";
  let selectedOldCourseName = null; // Sẽ lưu TÊN khóa cũ (để ghi vào LS_DangKy)

  // 2. Hỏi Mã Khóa MỚI
  const newCourseCodeResult = ui.prompt('Xếp lớp Hàng loạt', 'Nhập MÃ KHÓA HỌC MỚI (chung cho tất cả HV):', ui.ButtonSet.OK_CANCEL);
  if (newCourseCodeResult.getSelectedButton() !== ui.Button.OK || !newCourseCodeResult.getResponseText()) {
    ui.alert('Đã hủy thao tác.');
    return;
  }
  const newCourseCode = newCourseCodeResult.getResponseText().trim().toUpperCase();

  // 3. Xử lý logic theo Loại
  if (typeChoice === '1') {
      // --- XỬ LÝ QUAY LẠI TỪ BẢO LƯU ---
      processType = 'bao_luu';
      
      // --- SỬA Ở ĐÂY: HỎI MÃ KHÓA CŨ ---
      const oldCourseCodeResult = ui.prompt(
        'Xếp lớp Hàng loạt (Bảo lưu)', 
        'QUAN TRỌNG: Nhập MÃ KHÓA HỌC CŨ (bảo lưu) mà TẤT CẢ học viên trong danh sách này sẽ sử dụng suất:\n(Ví dụ: KD01, LS02)',
        ui.ButtonSet.OK_CANCEL
      );
      if (oldCourseCodeResult.getSelectedButton() !== ui.Button.OK || !oldCourseCodeResult.getResponseText()) {
        ui.alert('Đã hủy. Cần có mã khóa học cũ để xử lý bảo lưu.');
        return;
      }
      const selectedOldCourseCode = oldCourseCodeResult.getResponseText().trim().toUpperCase();
      // --- KẾT THÚC SỬA ---

      // Tra cứu Tên Khóa Cũ từ Mã Khóa Cũ
      try {
          const oldCourseInfo = _getCourseInfo(selectedOldCourseCode);
          if (!oldCourseInfo) {
              throw new Error(`Không tìm thấy thông tin cho Mã Khóa Cũ "${selectedOldCourseCode}" trong sheet KH.`);
          }
          selectedOldCourseName = oldCourseInfo.name; // Lấy TÊN khóa học cũ
          Logger.log(`Đã tìm thấy tên khóa cũ: "${selectedOldCourseName}" từ mã "${selectedOldCourseCode}"`);
      } catch (e) {
           Logger.log("Lỗi khi tìm Tên Khóa Cũ: " + e.message);
           ui.alert("Lỗi: " + e.message);
           return; // Dừng lại nếu không tìm thấy Tên Khóa Cũ
      }

  } else if (typeChoice === '2') {
      // --- Xử lý Học lại (KHC) ---
      processType = 'hoc_lai';
      selectedOldCourseName = null; // Không cần
  } else {
      ui.alert('Lựa chọn không hợp lệ. Vui lòng nhập 1 hoặc 2.');
      return;
  }

  // 4. Hỏi Danh sách Mã Code HV
  const codeListResult = ui.prompt(
    'Xếp lớp Hàng loạt', 
    `Dán danh sách MÃ CODE cần xếp lớp vào khóa ${newCourseCode}:\n(Mỗi mã code một dòng, hoặc cách nhau bằng dấu phẩy/dấu cách)`, 
    ui.ButtonSet.OK_CANCEL
  );
  if (codeListResult.getSelectedButton() !== ui.Button.OK || !codeListResult.getResponseText()) {
    ui.alert('Đã hủy thao tác.');
    return;
  }
  const inputText = codeListResult.getResponseText();
  const studentCodes = inputText.split(/[\n, ]+/).filter(code => String(code).trim() !== "").map(code => String(code).trim());

  if (studentCodes.length === 0) {
    ui.alert('Không tìm thấy Mã Code nào hợp lệ trong danh sách.');
    return;
  }

  // 5. Mở sheet DKy để tra cứu
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const dkySheet = ss.getSheetByName(SHEET_NAME); 
  if (!dkySheet) { ui.alert("Lỗi: Không tìm thấy sheet DKy."); return; }
  const dkyHeaders = dkySheet.getRange(1, 1, 1, dkySheet.getLastColumn()).getValues()[0];

  // 6. Chạy vòng lặp và xử lý
  SpreadsheetApp.getActiveSpreadsheet().toast(`Đang xử lý xếp lớp cho ${studentCodes.length} học viên...`, "Bắt đầu", -1);
  let successCount = 0;
  let failCount = 0;
  let errorMessages = [];

  for (const code of studentCodes) {
    try {
      const studentInfo = findUserInfoByCode(code, dkySheet, dkyHeaders);
      if (!studentInfo) {
          throw new Error("Không tìm thấy HV trong DKy."); 
      }
      
      // Gọi hàm xử lý đơn lẻ (truyền TÊN khóa cũ đã tra cứu vào)
      processReturnOrHocLai(processType, code, newCourseCode, selectedOldCourseName, studentInfo);
      
      successCount++;
      Logger.log(`Xếp lớp hàng loạt: Thành công cho ${studentInfo.name} (${code})`);
    
    } catch (e) {
      failCount++;
      errorMessages.push(`- HV Mã ${code}: ${e.message}`);
      Logger.log(`Xếp lớp hàng loạt: Thất bại cho ${code}. Lỗi: ${e.message}`);
    }
  }

  // 7. Thông báo kết quả
  SpreadsheetApp.getActiveSpreadsheet().toast('Hoàn tất!', 'Xong', 5);
  let summary = `Hoàn tất xếp lớp hàng loạt cho khóa ${newCourseCode}.\n\nThành công: ${successCount}\nThất bại: ${failCount}`;
  if (failCount > 0) {
      summary += `\n\nChi tiết lỗi:\n${errorMessages.join('\n')}`;
  }
  ui.alert(summary);
}
// --- CẤU HÌNH CHO CHỨC NĂNG CỐ ĐỊNH ---
// Điền ID Form và Tên câu hỏi cố định của bạn vào đây
const FIXED_FORM_ID = "13YG44h0xmcZTfB3RUrEiJEG0qPl0G_sg6AbQloTdHYQ"; 
const FIXED_FORM_QUESTION_TITLE = "Chọn học viên"; // Tên câu hỏi cố định
// --- KẾT THÚC CẤU HÌNH ---
/**
 * CHỨC NĂNG 1: CẬP NHẬT FORM CỐ ĐỊNH (NHANH)
 * Chỉ hỏi Mã Khóa.
 */
function promptAndUpdateFixedForm() {
  const ui = SpreadsheetApp.getUi();
  
  // 1. Chỉ Hỏi Mã Khóa học
  const courseCodeResult = ui.prompt('Cập nhật Form Nộp Bài (Cố định)', 'Nhập MÃ KHÓA cần lấy danh sách (ví dụ: KD03):', ui.ButtonSet.OK_CANCEL);
  if (courseCodeResult.getSelectedButton() !== ui.Button.OK || !courseCodeResult.getResponseText()) {
    ui.alert('Đã hủy thao tác.');
    return;
  }
  const courseCodeToFilter = courseCodeResult.getResponseText().trim().toUpperCase();

  // 2. Lấy thông tin cố định từ hằng số
  const targetFormId = FIXED_FORM_ID;
  const targetQuestionTitle = FIXED_FORM_QUESTION_TITLE;

  // Kiểm tra xem đã điền hằng số chưa
  if (!targetFormId || targetFormId === "DÁN_ID_CỦA_FORM_NỘP_BÀI_TẬP_VÀO_ĐÂY") {
      ui.alert('Lỗi: Bạn chưa thiết lập FIXED_FORM_ID và FIXED_FORM_QUESTION_TITLE trong file code.gs.');
      return;
  }

  // 3. Hiển thị thông báo đang xử lý
  SpreadsheetApp.getActiveSpreadsheet().toast(`Đang lấy danh sách HV cho mã khóa "${courseCodeToFilter}" và cập nhật Form Nộp Bài...`, "Vui lòng chờ", -1);

  // 4. Gọi hàm xử lý chính
  try {
    const resultMessage = updateGoogleFormChoices(targetFormId, targetQuestionTitle, courseCodeToFilter);
    SpreadsheetApp.getActiveSpreadsheet().toast(resultMessage, "Hoàn tất", 10);
    ui.alert(resultMessage);
  } catch (error) {
    SpreadsheetApp.getActiveSpreadsheet().toast("Đã xảy ra lỗi.", "Lỗi", 10);
    Logger.log("Lỗi khi cập nhật Form Cố định: " + error.message + " Stack: " + error.stack);
    ui.alert('Lỗi nghiêm trọng: ' + error.message);
  }
}


/**
 * CHỨC NĂNG 2: CẬP NHẬT FORM LINH HOẠT (CÓ BỘ NHỚ)
 * (Hàm này là hàm 'promptAndUpdateForm' cũ của bạn, được đổi tên)
 */
function promptAndUpdateFlexibleForm() {
  const ui = SpreadsheetApp.getUi();
  const userProperties = PropertiesService.getUserProperties();
  
  // 1. Hỏi Mã Khóa học
  const courseCodeResult = ui.prompt('Cập nhật Form Linh hoạt (Bước 1/3)', 'Nhập MÃ KHÓA cần lấy danh sách (ví dụ: KD03):', ui.ButtonSet.OK_CANCEL);
  if (courseCodeResult.getSelectedButton() !== ui.Button.OK || !courseCodeResult.getResponseText()) {
    ui.alert('Đã hủy thao tác.');
    return;
  }
  const courseCodeToFilter = courseCodeResult.getResponseText().trim().toUpperCase();

  // 2. Hỏi ID Form (Có gợi ý)
  const savedFormId = userProperties.getProperty('LAST_FORM_ID') || ""; 
  let formIdPrompt = 'Nhập ID của file Google Form (dãy ký tự dài trong URL):';
  if (savedFormId) {
      formIdPrompt += `\n\n(Lần trước bạn đã nhập: ${savedFormId})`;
  }
  const formIdResult = ui.prompt('Cập nhật Form Linh hoạt (Bước 2/3)', formIdPrompt, ui.ButtonSet.OK_CANCEL);
  if (formIdResult.getSelectedButton() !== ui.Button.OK) { ui.alert('Đã hủy.'); return; }
  const targetFormId = formIdResult.getResponseText().trim() || savedFormId; 
  if (!targetFormId) { ui.alert('Đã hủy vì không nhập ID Form.'); return; }
  userProperties.setProperty('LAST_FORM_ID', targetFormId); 
  
  // 3. Hỏi Tên Câu hỏi (Có gợi ý)
  const savedQuestionTitle = userProperties.getProperty('LAST_FORM_QUESTION') || ""; 
  let questionTitlePrompt = 'Nhập TÊN CHÍNH XÁC của câu hỏi Dropdown/Trắc nghiệm:';
  if (savedQuestionTitle) {
      questionTitlePrompt += `\n\n(Lần trước bạn đã nhập: ${savedQuestionTitle})`;
  }
  const questionTitleResult = ui.prompt('Cập nhật Form Linh hoạt (Bước 3/3)', questionTitlePrompt, ui.ButtonSet.OK_CANCEL);
  if (questionTitleResult.getSelectedButton() !== ui.Button.OK) { ui.alert('Đã hủy.'); return; }
  const targetQuestionTitle = questionTitleResult.getResponseText().trim() || savedQuestionTitle; 
  if (!targetQuestionTitle) { ui.alert('Đã hủy vì không nhập tên câu hỏi.'); return; }
  userProperties.setProperty('LAST_FORM_QUESTION', targetQuestionTitle);
  
  // 4. Hiển thị thông báo
  SpreadsheetApp.getActiveSpreadsheet().toast(`Đang lấy danh sách HV cho mã khóa "${courseCodeToFilter}" và cập nhật Form...`, "Vui lòng chờ", -1);

  // 5. Gọi hàm xử lý chính
  try {
    const resultMessage = updateGoogleFormChoices(targetFormId, targetQuestionTitle, courseCodeToFilter);
    SpreadsheetApp.getActiveSpreadsheet().toast(resultMessage, "Hoàn tất", 10);
    ui.alert(resultMessage);
  } catch (error) {
    SpreadsheetApp.getActiveSpreadsheet().toast("Đã xảy ra lỗi.", "Lỗi", 10);
    Logger.log("Lỗi khi cập nhật Form Linh hoạt: " + error.message + " Stack: " + error.stack);
    ui.alert('Lỗi nghiêm trọng: ' + error.message);
  }
}

/**
 * HÀM XỬ LÝ CHÍNH (DÙNG CHUNG CHO CẢ 2 CHỨC NĂNG)
 * (Version 11.1 - Sửa lỗi 'statusColIndex is not defined')
 * @param {string} targetFormId ID của Google Form cần cập nhật.
 * @param {string} targetQuestionTitle Tên chính xác của câu hỏi trong Form.
 * @param {string} courseCodeToFilter Mã Khóa học cần lọc.
 * @returns {string} Thông báo kết quả.
 */
function updateGoogleFormChoices(targetFormId, targetQuestionTitle, courseCodeToFilter) {
  // --- 1. Lấy và lọc dữ liệu từ "LS_DangKy" ---
  const sourceSs = SpreadsheetApp.getActiveSpreadsheet();
  const lsSheet = sourceSs.getSheetByName("LS_DangKy");
  if (!lsSheet) { throw new Error("Không tìm thấy sheet LS_DangKy."); }

  const lsData = lsSheet.getDataRange().getValues();
  if (lsData.length < 2) { return `Sheet LS_DangKy không có dữ liệu để lọc.`; }
  
  const lsHeaders = lsData.shift();
  const lsHeaderMap = {};
  lsHeaders.forEach((h, i) => lsHeaderMap[h.trim()] = i);

  const lsCodeColIndex = lsHeaderMap["MÃ CODE"];
  const lsNameColIndex = lsHeaderMap["Họ và tên"];
  const lsCourseCodeColIndex = lsHeaderMap["Mã lớp mới"];
  const lsStatusColIndex = lsHeaderMap["Trạng thái duyệt"]; // <<< ĐỊNH NGHĨA BIẾN 'lsStatusColIndex'
  
  // --- SỬA LỖI Ở ĐÂY ---
  if ([lsCodeColIndex, lsNameColIndex, lsCourseCodeColIndex, lsStatusColIndex].includes(undefined)) { // <<< SỬA: Dùng 'lsStatusColIndex'
      throw new Error("Thiếu cột (MÃ CODE, Họ và tên, Mã lớp mới, Trạng thái duyệt) trong LS_DangKy.");
  }

  const filteredData = lsData.filter(row => {
      const courseCode = row[lsCourseCodeColIndex] ? row[lsCourseCodeColIndex].toString().trim().toUpperCase() : "";
      const status = row[lsStatusColIndex] ? row[lsStatusColIndex].toString().trim().toLowerCase() : ""; // <<< SỬA: Dùng 'lsStatusColIndex'
      return courseCode === courseCodeToFilter && status.startsWith("đã duyệt");
  });
  // --- KẾT THÚC SỬA LỖI ---

  if (filteredData.length === 0) {
      return `Không tìm thấy học viên nào đã được duyệt cho mã khóa "${courseCodeToFilter}".`;
  }

  // Tạo Map danh sách HV duy nhất (Mã Code -> Tên)
  const uniqueStudentsNew = new Map();
  filteredData.forEach(row => {
      const code = row[lsCodeColIndex] ? row[lsCodeColIndex].toString().trim() : "";
      const name = row[lsNameColIndex] ? row[lsNameColIndex].toString().trim() : "";
      if (code) { uniqueStudentsNew.set(code, name); }
  });
  
  // Sắp xếp danh sách (tùy chọn)
  const sortedStudents = new Map([...uniqueStudentsNew.entries()].sort((a, b) => {
     const codeA = parseInt(a[0], 10);
     const codeB = parseInt(b[0], 10);
     if (!isNaN(codeA) && !isNaN(codeB)) { return codeA - codeB; }
     return a[0].localeCompare(b[0]);
  }));

  // --- 2. Tạo mảng lựa chọn cho Form ---
  const studentChoices = [];
  sortedStudents.forEach((name, code) => {
  studentChoices.push(`${code} ${name}`); // Định dạng: "Mã Code Họ và tên"
  });
  
  if (studentChoices.length === 0) {
       studentChoices.push("Không có học viên"); 
  }
  Logger.log(`Chuẩn bị cập nhật ${studentChoices.length} lựa chọn vào Form.`);

  // --- 3. Mở và cập nhật Google Form ---
  let form;
  try {
      form = FormApp.openById(targetFormId);
  } catch (e) {
      Logger.log(`Lỗi khi mở Form ID ${targetFormId}: ${e.message}`);
      throw new Error(`Không thể mở file Google Form. Kiểm tra lại ID Form và đảm bảo bạn có quyền chỉnh sửa Form.`);
  }

  // Tìm câu hỏi bằng Tiêu đề
  const question = getQuestionByTitle_(form, targetQuestionTitle);
  if (!question) {
     Logger.log(`Lỗi: Không tìm thấy câu hỏi nào có tên: "${targetQuestionTitle}" trong Form.`);
     throw new Error(`Không tìm thấy câu hỏi có tên: "${targetQuestionTitle}"`);
  }

  // 4. Cập nhật các lựa chọn cho câu hỏi (Dropdown, MultipleChoice, Checkbox)
  try {
      const itemType = question.getType();
      if (itemType == FormApp.ItemType.LIST) {
          question.asListItem().setChoiceValues(studentChoices); 
      } else if (itemType == FormApp.ItemType.MULTIPLE_CHOICE) {
           question.asMultipleChoiceItem().setChoiceValues(studentChoices);
      } else if (itemType == FormApp.ItemType.CHECKBOX) {
           question.asCheckboxItem().setChoiceValues(studentChoices);
      } else {
           throw new Error(`Loại câu hỏi "${itemType}" không được hỗ trợ.`);
      }
  } catch (e) {
      Logger.log(`Lỗi khi cập nhật lựa chọn: ${e.message}. Câu hỏi "${targetQuestionTitle}" có phải là dạng Dropdown, Trắc nghiệm, hoặc Checkbox không?`);
      throw new Error(`Lỗi: Câu hỏi "${targetQuestionTitle}" không phải là dạng có thể cập nhật lựa chọn (Dropdown, Trắc nghiệm, Checkbox).`);
  }
  
  Logger.log(`Cập nhật thành công Form ID: ${targetFormId}`);
  return `Đã cập nhật thành công ${studentChoices.length} học viên cho câu hỏi "${targetQuestionTitle}" trong Google Form.`;
}

/**
 * Hàm tiện ích: Tìm câu hỏi trong form bằng tên chính xác.
 * (Hàm này giữ nguyên như cũ, không cần sửa)
 * @param {Form} form Đối tượng Form.
 * @param {string} title Tên câu hỏi cần tìm.
 * @returns {Item | null} Đối tượng câu hỏi hoặc null.
 * @private
 */
function getQuestionByTitle_(form, title) {
  const items = form.getItems();
  for (let i = 0; i < items.length; i++) {
    if (items[i].getTitle() === title) {
      return items[i];
    }
  }
  return null; // Không tìm thấy
}
/**
 * =================================================================
 * CHỨC NĂNG TỐI ƯU: CẬP NHẬT TEXT NGÀY (GIỮ NGUYÊN LOGIC)
 * =================================================================
 */
/**
 * HÀM XỬ LÝ CHÍNH (TỐI ƯU - SỬA LỖI)
 * Cập nhật VĂN BẢN của các lựa chọn ngày bằng cách
 * tạo lại các lựa chọn mới nhưng sao chép logic điều hướng (navigation).
 */
function updateDateChoiceTextInForm(targetFormId, targetQuestionTitle, startDateStr) {
  // 1. Mở Form
  let form;
  try {
    form = FormApp.openById(targetFormId);
  } catch (e) {
    throw new Error(`Không thể mở file Google Form. Kiểm tra lại ID Form và quyền truy cập.`);
  }
  
  // 2. Tìm câu hỏi
  const question = getQuestionByTitle_(form, targetQuestionTitle);
  if (!question) {
    throw new Error(`Không tìm thấy câu hỏi nào có tên chính xác là: "${targetQuestionTitle}"`);
  }
  
  // 3. Lấy danh sách các lựa chọn HIỆN CÓ (CHOICES)
  let existingChoices;
  const itemType = question.getType();
  
  if (itemType == FormApp.ItemType.LIST) {
    existingChoices = question.asListItem().getChoices();
  } else if (itemType == FormApp.ItemType.MULTIPLE_CHOICE) {
    existingChoices = question.asMultipleChoiceItem().getChoices();
  } else if (itemType == FormApp.ItemType.CHECKBOX) {
    existingChoices = question.asCheckboxItem().getChoices();
  } else {
    throw new Error(`Loại câu hỏi "${itemType}" không được hỗ trợ.`);
  }

  const numChoices = existingChoices.length;
  if (numChoices === 0) {
    throw new Error(`Câu hỏi "${targetQuestionTitle}" không có lựa chọn nào để cập nhật.`);
  }
  
  // 4. Tạo mảng VĂN BẢN MỚI
  const newDateStrings = [];
  const startDate = new Date(startDateStr);
  if (isNaN(startDate.getTime())) {
    throw new Error(`Định dạng ngày bắt đầu "${startDateStr}" không hợp lệ. Vui lòng dùng yyyy-MM-dd.`);
  }
  
  startDate.setHours(12, 0, 0, 0); 
  const timeZone = Session.getScriptTimeZone();
  
  for (let i = 1; i <= numChoices; i++) {
    const currentDate = new Date(startDate.getTime());
    currentDate.setDate(startDate.getDate() + (i - 1));
    const formattedDate = Utilities.formatDate(currentDate, timeZone, "dd/MM/yyyy");
    const choiceString = `${i} - Ngày ${formattedDate}`;
    newDateStrings.push(choiceString);
  }
  
  // --- BẮT ĐẦU SỬA LỖI ---
  // 5. Tạo mảng Choices MỚI (kết hợp Text mới + Logic điều hướng cũ)
  const newChoicesArray = [];
  
  for (let i = 0; i < numChoices; i++) {
    const oldChoice = existingChoices[i];
    const oldNavigation = oldChoice.getGotoPage(); // Lấy logic "Chuyển đến phần..."
    const newText = newDateStrings[i];          // Lấy text "1 - Ngày 30/11/2025"
    
    let newChoice;
    // Tạo lựa chọn mới với text mới và logic cũ
    if (itemType == FormApp.ItemType.LIST) {
      newChoice = question.asListItem().createChoice(newText, oldNavigation);
    } else if (itemType == FormApp.ItemType.MULTIPLE_CHOICE) {
      newChoice = question.asMultipleChoiceItem().createChoice(newText, oldNavigation);
    } else if (itemType == FormApp.ItemType.CHECKBOX) {
      newChoice = question.asCheckboxItem().createChoice(newText, oldNavigation);
    }
    
    newChoicesArray.push(newChoice);
  }
  
  // 6. Set toàn bộ mảng Choices mới vào câu hỏi
  if (itemType == FormApp.ItemType.LIST) {
    question.asListItem().setChoices(newChoicesArray);
  } else if (itemType == FormApp.ItemType.MULTIPLE_CHOICE) {
    question.asMultipleChoiceItem().setChoices(newChoicesArray);
  } else if (itemType == FormApp.ItemType.CHECKBOX) {
    question.asCheckboxItem().setChoices(newChoicesArray);
  }
  // --- KẾT THÚC SỬA LỖI ---
  
  Logger.log(`Cập nhật thành công ${numChoices} lựa chọn ngày.`);
  return `Đã cập nhật thành công ${numChoices} lựa chọn ngày.\n(Logic "Chuyển đến phần" đã được giữ nguyên!)`;
}

/**
 * HÀM GỌI (LINH HOẠT): Hỏi ID Form, Tên câu hỏi, Ngày bắt đầu
 */
function promptAndUpdateFlexibleDateText() {
  const ui = SpreadsheetApp.getUi();
  const userProperties = PropertiesService.getUserProperties();
  
  // 1. Hỏi ID Form (Có gợi ý)
  const savedFormId = userProperties.getProperty('LAST_FORM_ID') || FIXED_FORM_ID;
  let formIdPrompt = 'Nhập ID của file Google Form:';
  if (savedFormId) { formIdPrompt += `\n\n(Đang dùng: ${savedFormId})`; }
  const formIdResult = ui.prompt('Cập nhật TEXT Ngày (Linh hoạt - 1/3)', formIdPrompt, ui.ButtonSet.OK_CANCEL);
  const targetFormId = formIdResult.getResponseText().trim() || savedFormId; 
  if (!targetFormId) { ui.alert('Đã hủy.'); return; }
  userProperties.setProperty('LAST_FORM_ID', targetFormId);
  
  // 2. Hỏi Tên Câu hỏi (Có gợi ý)
  const savedQuestionTitle = userProperties.getProperty('LAST_DATE_QUESTION') || "Chọn nộp bài tập";
  let questionTitlePrompt = 'Nhập TÊN CHÍNH XÁC của câu hỏi Ngày nộp bài:';
  if (savedQuestionTitle) { questionTitlePrompt += `\n\n(Lần trước bạn đã nhập: ${savedQuestionTitle})`; }
  const questionTitleResult = ui.prompt('Cập nhật TEXT Ngày (Linh hoạt - 2/3)', questionTitlePrompt, ui.ButtonSet.OK_CANCEL);
  const targetQuestionTitle = questionTitleResult.getResponseText().trim() || savedQuestionTitle; 
  if (!targetQuestionTitle) { ui.alert('Đã hủy.'); return; }
  userProperties.setProperty('LAST_DATE_QUESTION', targetQuestionTitle);

  // 3. Hỏi Ngày Bắt Đầu
  const defaultStartDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  const startDateResult = ui.prompt('Cập nhật TEXT Ngày (Linh hoạt - 3/3)', `Nhập Ngày Bắt Đầu (Ngày 1):\n(Định dạng: yyyy-MM-dd, ví dụ: ${defaultStartDate})`, ui.ButtonSet.OK_CANCEL);
  const startDateStr = startDateResult.getResponseText().trim();
  if (startDateResult.getSelectedButton() !== ui.Button.OK || !startDateStr) { ui.alert('Đã hủy.'); return; }
  
  // 4. Gọi hàm xử lý chính
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast(`Đang cập nhật VĂN BẢN...`, "Vui lòng chờ", -1);
    const resultMessage = updateDateChoiceTextInForm(targetFormId, targetQuestionTitle, startDateStr);
    SpreadsheetApp.getActiveSpreadsheet().toast(resultMessage, "Hoàn tất", 10);
    ui.alert(resultMessage);
  } catch (error) {
    Logger.log("Lỗi khi cập nhật TEXT Ngày: " + error.message);
    ui.alert('Lỗi nghiêm trọng: ' + error.message);
  }
}

/**
 * HÀM GỌI (CỐ ĐỊNH): Hỏi Tên câu hỏi, Ngày bắt đầu
 */
function promptAndUpdateFixedDateText() {
  const ui = SpreadsheetApp.getUi();
  const userProperties = PropertiesService.getUserProperties();
  
  // 1. Lấy ID Form CỐ ĐỊNH
  const targetFormId = FIXED_FORM_ID;
  if (!targetFormId || targetFormId.startsWith("DÁN_ID")) {
    ui.alert('Lỗi: Bạn chưa thiết lập FIXED_FORM_ID trong file code.gs.');
    return;
  }

  // 2. Hỏi Tên Câu hỏi (Có gợi ý)
  const savedQuestionTitle = userProperties.getProperty('LAST_DATE_QUESTION') || "Chọn nộp bài tập"; 
  let questionTitlePrompt = 'Nhập TÊN CHÍNH XÁC của câu hỏi Ngày nộp bài:';
  if (savedQuestionTitle) { questionTitlePrompt += `\n\n(Lần trước bạn đã nhập: ${savedQuestionTitle})`; }
  const questionTitleResult = ui.prompt('Cập nhật TEXT Ngày (Cố định - 1/2)', questionTitlePrompt, ui.ButtonSet.OK_CANCEL);
  const targetQuestionTitle = questionTitleResult.getResponseText().trim() || savedQuestionTitle; 
  if (!targetQuestionTitle) { ui.alert('Đã hủy.'); return; }
  userProperties.setProperty('LAST_DATE_QUESTION', targetQuestionTitle);

  // 3. Hỏi Ngày Bắt Đầu
  const defaultStartDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  const startDateResult = ui.prompt('Cập nhật TEXT Ngày (Cố định - 2/2)', `Nhập Ngày Bắt Đầu (Ngày 1):\n(Định dạng: yyyy-MM-dd, ví dụ: ${defaultStartDate})`, ui.ButtonSet.OK_CANCEL);
  const startDateStr = startDateResult.getResponseText().trim();
  if (startDateResult.getSelectedButton() !== ui.Button.OK || !startDateStr) { ui.alert('Đã hủy.'); return; }
  
  // 4. Gọi hàm xử lý chính
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast(`Đang cập nhật VĂN BẢN cho Form Cố định...`, "Vui lòng chờ", -1);
    const resultMessage = updateDateChoiceTextInForm(targetFormId, targetQuestionTitle, startDateStr); 
    SpreadsheetApp.getActiveSpreadsheet().toast(resultMessage, "Hoàn tất", 10);
    ui.alert(resultMessage);
  } catch (error) {
    Logger.log("Lỗi khi cập nhật TEXT Ngày (Cố định): " + error.message);
    ui.alert('Lỗi nghiêm trọng: ' + error.message);
  }
}
// =================================================================
// [MỚI] HÀM TỔNG HỢP CHO "CỔNG HỌC VIÊN"
// =================================================================

/**
 * Lấy tất cả thông tin cần thiết cho trang tổng hợp
 * (bao gồm thông tin, các lớp đã học, và trạng thái 86 ngày).
 * @param {string} contact - SĐT hoặc Email của học viên.
 * @returns {object} - Object chứa thông tin học viên và trạng thái.
 */
function getStudentDashboard(contact) {
  try {
    // 1. Gọi hàm findStudentByContact bạn đã có
    const studentInfo = findStudentByContact(contact);

    if (!studentInfo) {
      return { 
        success: false, 
        message: "Không tìm thấy thông tin. Vui lòng kiểm tra lại SĐT/Email hoặc liên hệ người giới thiệu để đăng ký mới." 
      };
    }

    // 2. Xác định trạng thái 86 ngày
    const registered = (studentInfo.registeredCourseTopics || []).map(t => t.toLowerCase().trim());
    const pending = (studentInfo.pendingCourseTopics || []).map(t => t.toLowerCase().trim());
    const keyword = "86 ngày đồng hành"; // Từ khóa của lớp 86 ngày

    if (registered.includes(keyword)) {
      studentInfo.status_86_day = "ALREADY_UPGRADED";
    } else if (pending.includes(keyword)) {
      studentInfo.status_86_day = "PENDING";
    } else {
      studentInfo.status_86_day = "ELIGIBLE";
    }
    
    // 3. Gán cờ success và trả về
    studentInfo.success = true;
    return studentInfo;

  } catch (e) {
    Logger.log("Lỗi trong getStudentDashboard: " + e.message);
    return { success: false, message: "Lỗi hệ thống: " + e.message };
  }
}
// =================================================================
// TÍNH NĂNG: TỔNG HỢP LỊCH SỬ HỌC VIÊN & TÀI CHÍNH (PHIÊN BẢN 2.0)
// =================================================================

function taoBaoCaoLichSuHocVien() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Cấu hình Sheet
  const SHEET_OUTPUT = "TongHop_LichSu";
  const SHEET_DKY = "DKy";
  const SHEET_LS = "LS_DangKy";
  
  const dkySheet = ss.getSheetByName(SHEET_DKY);
  const lsSheet = ss.getSheetByName(SHEET_LS);
  
  if (!dkySheet || !lsSheet) {
    ui.alert("Lỗi: Không tìm thấy sheet DKy hoặc LS_DangKy.");
    return;
  }

  // 2. Tạo hoặc Xóa trắng sheet đích
  let outSheet = ss.getSheetByName(SHEET_OUTPUT);
  if (!outSheet) {
    outSheet = ss.insertSheet(SHEET_OUTPUT);
  } else {
    outSheet.clear();
  }
  
  // Tạo tiêu đề (Thêm cột Ghi chú tài chính nếu cần tách riêng, ở đây ta gộp chung cho gọn)
  const headers = ["MÃ CODE", "Họ và tên", "Số điện thoại", "Email", "DÒNG THỜI GIAN (Học tập & Tài chính)"];
  outSheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setFontWeight("bold")
    .setBackground("#D9EAD3") // Màu xanh nhẹ
    .setBorder(true, true, true, true, true, true);
  
  // 3. Đọc dữ liệu & Map cột
  const dkyData = dkySheet.getDataRange().getValues();
  const lsData = lsSheet.getDataRange().getValues();
  
  const dkyHeaders = dkyData.shift();
  const lsHeaders = lsData.shift();
  
  const dkyMap = getHeaderMap(dkyHeaders);
  const lsMap = getHeaderMap(lsHeaders);
  
  // 4. Xử lý dữ liệu
  const studentTimeline = {};
  
  // --- BƯỚC A: Khởi tạo từ DKy (Sự kiện gốc) ---
  dkyData.forEach(row => {
    const code = String(row[dkyMap["MÃ CODE"]]).replace("'", "").trim();
    if (!code) return;
    
    // Lấy thông tin cơ bản
    const name = row[dkyMap["Họ và tên"]];
    const phone = row[dkyMap["Số điện thoại"]];
    const email = row[dkyMap["Địa chỉ email"]];
    const date = row[dkyMap["Dấu thời gian"]];
    const course = row[dkyMap["Khoá đăng ký"]] || "Đăng ký lần đầu";
    
    // Lấy thông tin cọc ban đầu (nếu có cột này)
    // Nếu sheet DKy chưa có cột "Phí cọc", ta lấy "Trạng thái cọc"
    const depositStatus = row[dkyMap["Trạng thái cọc"]] || "";
    let financialInfo = depositStatus ? ` | 💰 TT Cọc: ${depositStatus}` : "";

    studentTimeline[code] = {
      info: [code, name, phone, email],
      events: []
    };
    
    if (date) {
      studentTimeline[code].events.push({
        date: new Date(date),
        // Icon ngôi sao cho sự kiện khởi đầu
        desc: `✨ Đăng ký: ${course}${financialInfo}`
      });
    }
  });
  
  // --- BƯỚC B: Bổ sung từ LS_DangKy (Thay đổi & Tiền nong) ---
  lsData.forEach(row => {
    const code = String(row[lsMap["MÃ CODE"]]).trim();
    
    // Chỉ xử lý nếu mã HV tồn tại trong danh sách gốc
    if (studentTimeline[code]) {
      const status = String(row[lsMap["Trạng thái duyệt"]]).toLowerCase();
      const date = row[lsMap["Dấu thời gian"]];
      
      // Lấy các thông tin khóa học & Tiền
      const newClass = row[lsMap["Lớp ĐK mới"]] || "";
      const newCourse = row[lsMap["Khóa ĐK mới"]] || "";
      // 1. Kiểm tra tiền cọc đầu vào
      const depositAmount = row[lsMap["Phí cọc mới"]];
      let moneyText = "";
      if (depositAmount && !isNaN(depositAmount) && depositAmount > 0) {
        const formattedMoney = new Intl.NumberFormat('vi-VN').format(depositAmount);
        moneyText = ` | 💸 Cọc: ${formattedMoney}đ`;
      }
      
      // 2. Kiểm tra trạng thái HOÀN CỌC (Cột mới)
      // Nếu cột chưa được tạo trong dữ liệu cũ thì bỏ qua
      // 2. Kiểm tra trạng thái HOÀN CỌC & SỐ TIỀN THỰC TẾ
      let refundText = "";
      if (lsMap["Trạng thái hoàn cọc"] !== undefined) {
         const refundStatus = row[lsMap["Trạng thái hoàn cọc"]];
         if (refundStatus) {
            // Lấy số tiền hoàn thực tế (nếu có)
            const realRefund = row[lsMap["Số tiền Tất toán"]];
            let refundAmountStr = "";
            
            if (realRefund && !isNaN(realRefund)) {
                refundAmountStr = ` (${new Intl.NumberFormat('vi-VN').format(realRefund)}đ)`;
            } else {
                // Nếu không ghi số tiền thực tế, giả định là hoàn hết cọc gốc
                refundAmountStr = " (100%)"; 
            }
            
            refundText = ` | ✅ ${refundStatus}${refundAmountStr}`; 
         }
      }

      let descText = "";
      let icon = "➡️";

      if (status.includes("bảo lưu")) {
         icon = "⏸️";
         descText = `${icon} Bảo lưu: ${newCourse}`;
      } else if (status.includes("học lại")) {
         icon = "🔄";
         descText = `${icon} Học lại (KHC): ${newCourse}`;
      } else if (newClass.toLowerCase().includes("86 ngày")) {
         icon = "🚀";
         descText = `${icon} Nâng cấp VIP: ${newClass}`;
      } else if (status.includes("duyệt")) {
         descText = `${icon} Chuyển lớp: ${newClass} (${newCourse})`;
      } else {
         return; 
      }

      // Gộp tất cả lại
      studentTimeline[code].events.push({
        date: new Date(date),
        // Hiển thị: [Ngày] ➡️ Chuyển lớp: K01 | 💸 Cọc: 500k | ✅ Đã hoàn ngày ...
        desc: `${descText}${moneyText}${refundText}`
      });
      
      // --- [HẾT PHẦN SỬA] ---
    }
  });
  
  // --- BƯỚC C: Xuất dữ liệu ra Sheet ---
  const outputRows = [];
  
  Object.keys(studentTimeline).forEach(code => {
    const data = studentTimeline[code];
    
    // Sắp xếp sự kiện cũ -> mới
    data.events.sort((a, b) => a.date - b.date);
    
    // Tạo chuỗi text nhiều dòng
    const timelineString = data.events.map(e => {
      const dateStr = Utilities.formatDate(e.date, Session.getScriptTimeZone(), "dd/MM/yy");
      return `[${dateStr}] ${e.desc}`;
    }).join("\n"); // Xuống dòng
    
    outputRows.push([...data.info, timelineString]);
  });
  
  if (outputRows.length > 0) {
    // Sắp xếp theo Mã Code giảm dần (người mới nhất lên đầu)
    outputRows.sort((a, b) => parseInt(b[0]) - parseInt(a[0]));
    
    const targetRange = outSheet.getRange(2, 1, outputRows.length, headers.length);
    targetRange.setValues(outputRows);
    
    // Định dạng hiển thị
    outSheet.getRange(2, 5, outputRows.length, 1)
      .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP) // Tự động xuống dòng
      .setVerticalAlignment("top"); // Căn lề trên
      
    outSheet.autoResizeColumns(1, 4);
    outSheet.setColumnWidth(5, 450); // Cột lịch sử rộng ra để dễ đọc
  }
  
  ui.alert("Đã cập nhật lịch sử và thông tin tài chính học viên thành công!");
}

// Hàm phụ trợ map tiêu đề (Giữ nguyên)
function getHeaderMap(headers) {
  const map = {};
  headers.forEach((h, i) => {
    map[String(h).trim()] = i;
  });
  return map;
}
// =================================================================
// [NÂNG CẤP] XỬ LÝ HOÀN CỌC TỪNG NGƯỜI (CÓ NHẬP SỐ TIỀN)
// =================================================================

function promptAndProcessRefund() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const lsSheet = ss.getSheetByName("LS_DangKy");
  
  // 1. Hỏi Mã Code
  const codeResult = ui.prompt('Hoàn cọc Học viên', 'Nhập MÃ CODE học viên cần hoàn cọc:', ui.ButtonSet.OK_CANCEL);
  if (codeResult.getSelectedButton() !== ui.Button.OK || !codeResult.getResponseText()) return;
  const studentCode = codeResult.getResponseText().trim();
  
  // 2. Tìm lớp
  const data = lsSheet.getDataRange().getValues();
  const headers = data[0];
  const map = getHeaderMap(headers);
  
  // Kiểm tra cột
  if (map["Trạng thái hoàn cọc"] === undefined || map["Số tiền Tất toán"] === undefined) {
    ui.alert('Lỗi: Thiếu cột "Trạng thái hoàn cọc" hoặc "Số tiền Tất toán" trong sheet LS_DangKy.');
    return;
  }
  
  const refundableClasses = [];
  
  for (let i = 1; i < data.length; i++) {
    const rowCode = String(data[i][map["MÃ CODE"]]).trim();
    const status = String(data[i][map["Trạng thái duyệt"]]).toLowerCase();
    const refundStatus = String(data[i][map["Trạng thái hoàn cọc"]]);
    
    if (rowCode === studentCode && status.includes("duyệt") && !refundStatus) {
      // Lấy số tiền cọc gốc để gợi ý
      const originalDeposit = data[i][map["Phí cọc mới"]] || 0;
      
      refundableClasses.push({
        index: i,
        courseName: data[i][map["Khóa ĐK mới"]] || data[i][map["Lớp ĐK mới"]],
        date: Utilities.formatDate(new Date(data[i][map["Dấu thời gian"]]), Session.getScriptTimeZone(), "dd/MM/yyyy"),
        deposit: originalDeposit
      });
    }
  }
  
  if (refundableClasses.length === 0) {
    ui.alert(`Không tìm thấy lớp học nào khả dụng để hoàn cọc cho HV ${studentCode}.`);
    return;
  }
  
  // 3. Chọn lớp
  let promptMsg = `HV ${studentCode} có các lớp chưa hoàn cọc:\n`;
  refundableClasses.forEach((item, idx) => {
    const moneyStr = new Intl.NumberFormat('vi-VN').format(item.deposit);
    promptMsg += `${idx + 1}. ${item.courseName} (Cọc: ${moneyStr}đ)\n`;
  });
  promptMsg += `\nNhập SỐ THỨ TỰ lớp muốn hoàn:`;
  
  const choiceResult = ui.prompt('Chọn Lớp', promptMsg, ui.ButtonSet.OK_CANCEL);
  if (choiceResult.getSelectedButton() !== ui.Button.OK) return;
  const choiceIndex = parseInt(choiceResult.getResponseText().trim()) - 1;
  
  if (isNaN(choiceIndex) || choiceIndex < 0 || choiceIndex >= refundableClasses.length) {
    ui.alert("Lựa chọn không hợp lệ."); return;
  }
  
  const selectedClass = refundableClasses[choiceIndex];
  
  // 4. [MỚI] Hỏi số tiền muốn hoàn
  const defaultRefund = selectedClass.deposit;
  const moneyPrompt = ui.prompt(
    'Xác nhận Số tiền', 
    `Số tiền cọc gốc là: ${new Intl.NumberFormat('vi-VN').format(defaultRefund)}đ.\n\nNhập số tiền thực tế bạn muốn hoàn trả (nhập số liền, không dấu chấm/phẩy):\nĐể trống = Hoàn đủ 100% (${defaultRefund})`,
    ui.ButtonSet.OK_CANCEL
  );
  
  if (moneyPrompt.getSelectedButton() !== ui.Button.OK) return;
  
  let finalRefundAmount = moneyPrompt.getResponseText().trim();
  
  if (finalRefundAmount === "") {
    finalRefundAmount = defaultRefund; // Nếu để trống thì lấy mặc định
  } else {
    finalRefundAmount = parseInt(finalRefundAmount);
    if (isNaN(finalRefundAmount)) {
      ui.alert("Lỗi: Số tiền nhập vào không hợp lệ."); return;
    }
  }

  // 5. Ghi dữ liệu
  const todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy");
  const refundNote = `Đã hoàn ngày ${todayStr}`;
  
  // Ghi trạng thái
  lsSheet.getRange(selectedClass.index + 1, map["Trạng thái hoàn cọc"] + 1).setValue(refundNote);
  // Ghi số tiền thực tế
  lsSheet.getRange(selectedClass.index + 1, map["Số tiền Tất toán"] + 1).setValue(finalRefundAmount);
  
  ui.alert(`✅ Đã cập nhật: Hoàn ${new Intl.NumberFormat('vi-VN').format(finalRefundAmount)}đ cho lớp "${selectedClass.courseName}".`);
}
// =================================================================
// [NÂNG CẤP] HOÀN CỌC HÀNG LOẠT (LINH HOẠT SỐ TIỀN)
// =================================================================

function processBatchRefund() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const lsSheet = ss.getSheetByName("LS_DangKy");
  
  // 1. Nhập danh sách mã
  const codeListResult = ui.prompt('Hoàn cọc Hàng loạt (1/3)', 'Dán danh sách MÃ CODE:', ui.ButtonSet.OK_CANCEL);
  if (codeListResult.getSelectedButton() !== ui.Button.OK) return;
  const targetCodes = codeListResult.getResponseText().split(/[\n, ]+/).filter(c => c.trim() !== "").map(c => c.trim());
  if (targetCodes.length === 0) { ui.alert("Danh sách trống."); return; }

  // 2. Nhập tên khóa học
  const courseResult = ui.prompt('Hoàn cọc Hàng loạt (2/3)', `Nhập TÊN KHÓA HỌC (từ khóa) cần hoàn cọc:`, ui.ButtonSet.OK_CANCEL);
  if (courseResult.getSelectedButton() !== ui.Button.OK) return;
  const targetCourseKeyword = courseResult.getResponseText().trim().toLowerCase();
  
  // 3. [MỚI] Hỏi số tiền hoàn
  const amountResult = ui.prompt(
    'Hoàn cọc Hàng loạt (3/3)', 
    `Bạn muốn hoàn bao nhiêu tiền cho danh sách này?\n\n- Để TRỐNG: Hoàn trả 100% số tiền họ đã cọc (theo dữ liệu gốc).\n- Nhập SỐ (vd: 500000): Hoàn đúng số tiền này cho tất cả mọi người.`, 
    ui.ButtonSet.OK_CANCEL
  );
  if (amountResult.getSelectedButton() !== ui.Button.OK) return;
  
  let fixedAmount = null;
  const amountInput = amountResult.getResponseText().trim();
  if (amountInput !== "") {
    fixedAmount = parseInt(amountInput);
    if (isNaN(fixedAmount)) { ui.alert("Số tiền không hợp lệ."); return; }
  }

  // 4. Xử lý
  const dataRange = lsSheet.getDataRange();
  const data = dataRange.getValues();
  const headers = data[0];
  const map = getHeaderMap(headers);
  
  if (map["Trạng thái hoàn cọc"] === undefined || map["Số tiền Tất toán"] === undefined) {
    ui.alert('Lỗi: Thiếu cột cần thiết trong sheet LS_DangKy.'); return;
  }
  
  const todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy");
  const refundNote = `Đã hoàn ngày ${todayStr}`;
  let successCount = 0;
  let processedStudents = new Set();
  
  for (let i = 1; i < data.length; i++) {
    const rowCode = String(data[i][map["MÃ CODE"]]).trim();
    if (targetCodes.includes(rowCode)) {
      const status = String(data[i][map["Trạng thái duyệt"]]).toLowerCase();
      const courseName = String(data[i][map["Khóa ĐK mới"]] || data[i][map["Lớp ĐK mới"]]).toLowerCase();
      const currentRefundStatus = String(data[i][map["Trạng thái hoàn cọc"]]);
      
      if (status.includes("duyệt") && courseName.includes(targetCourseKeyword) && !currentRefundStatus) {
        
        // Xác định số tiền hoàn
        let amountToRefund = 0;
        if (fixedAmount !== null) {
          amountToRefund = fixedAmount; // Dùng số tiền cố định (nếu user nhập)
        } else {
          amountToRefund = data[i][map["Phí cọc mới"]] || 0; // Dùng tiền cọc gốc (nếu để trống)
        }

        // Ghi dữ liệu
        lsSheet.getRange(i + 1, map["Số tiền Tất toán"] + 1).setValue(refundNote);
        lsSheet.getRange(i + 1, map["Số tiền Tất toán"] + 1).setValue(amountToRefund);
        
        successCount++;
        processedStudents.add(rowCode);
      }
    }
  }
  
  const notFoundCount = targetCodes.length - processedStudents.size;
  ui.alert(`✅ Hoàn tất! Đã cập nhật cho ${successCount} dòng.\n⚠️ Có ${notFoundCount} mã không tìm thấy hoặc không khớp điều kiện.`);
}

// =================================================================
// [PHIÊN BẢN 16.2] BÁO CÁO TÀI CHÍNH (CẬP NHẬT CỘT: SỐ TIỀN TẤT TOÁN)
// =================================================================

function thongKeBaoCaoTCchuan() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Chọn thời gian
  const startDateInput = ui.prompt('Báo cáo Tài chính', 'Nhập NGÀY BẮT ĐẦU (dd/MM/yyyy):', ui.ButtonSet.OK_CANCEL);
  if (startDateInput.getSelectedButton() !== ui.Button.OK) return;
  const endDateInput = ui.prompt('Báo cáo Tài chính', 'Nhập NGÀY KẾT THÚC (dd/MM/yyyy):', ui.ButtonSet.OK_CANCEL);
  if (endDateInput.getSelectedButton() !== ui.Button.OK) return;
  
  const startDate = parseDateVN(startDateInput.getResponseText().trim());
  const endDate = parseDateVN(endDateInput.getResponseText().trim());
  if (!startDate || !endDate) { ui.alert("Ngày không hợp lệ."); return; }
  endDate.setHours(23, 59, 59, 999);

  const CUTOFF_DATE = new Date("2025-09-23T00:00:00");
  const REPORT_SHEET_NAME = "BaoCao_TaiChinh_Chuan";

  let reportSheet = ss.getSheetByName(REPORT_SHEET_NAME);
  if (!reportSheet) reportSheet = ss.insertSheet(REPORT_SHEET_NAME);
  else reportSheet.clear();

  const lsSheet = ss.getSheetByName("LS_DangKy");
  const khSheet = ss.getSheetByName("KH"); 
  const lsData = lsSheet.getDataRange().getValues();
  const khData = khSheet.getDataRange().getValues();
  const lsMap = getHeaderMap(lsData.shift());
  const khMap = getHeaderMap(khData.shift());

  // Kiểm tra cột mới
  if (lsMap["Số tiền Tất toán"] === undefined) {
      ui.alert("Lỗi: Không tìm thấy cột 'Số tiền Tất toán' trong LS_DangKy. Hãy đổi tên cột 'Số tiền hoàn thực tế' thành 'Số tiền Tất toán'.");
      return;
  }

  const parseMoneySafe = (val) => {
      if (val === "" || val === null || val === undefined) return NaN;
      if (typeof val === 'number') return val;
      const str = String(val).replace(/[^0-9]/g, '');
      return parseInt(str) || 0;
  };

  let courseFees = {};
  khData.forEach(row => {
      const code = String(row[khMap["Mã khóa"]]).trim().toUpperCase();
      const fee = parseMoneySafe(row[khMap["Phí cọc"]]);
      if (code) courseFees[code] = fee;
  });

  const createCourseStat = (name) => ({
    name: name,
    cashIn: 0, cashOut: 0, revenue: 0, liability: 0,
    countNew: 0, countVip: 0, details: [] 
  });

  let statsTotal = {}; let statsNew = {}; let statsOld = {};   

  const initStatsObj = (statsObj) => {
      khData.forEach(row => {
        const code = String(row[khMap["Mã khóa"]]).trim().toUpperCase();
        const name = String(row[khMap["Tên khóa học"]]).trim();
        if (code) statsObj[code] = createCourseStat(name);
      });
      if (!statsObj["KHONG_XAC_DINH"]) statsObj["KHONG_XAC_DINH"] = createCourseStat("Không xác định");
  };

  initStatsObj(statsTotal); initStatsObj(statsNew); initStatsObj(statsOld);

  let studentHistory = {}; 
  lsData.forEach(row => {
    const codeHV = String(row[lsMap["MÃ CODE"]]).trim();
    const dateRaw = row[lsMap["Dấu thời gian"]];
    if (codeHV && dateRaw) {
        if (!studentHistory[codeHV]) studentHistory[codeHV] = [];
        studentHistory[codeHV].push({ row: row, date: new Date(dateRaw) });
    }
  });

  const normalizeCourseCode = (code) => { if (!code) return ""; return code.trim().toUpperCase(); };
  const extractCodeFromText = (text) => {
      if (!text) return "";
      const match = text.toUpperCase().match(/(KD\d+|AF\d+|NH\d+|LS\d+|86D|BD)/);
      return match ? match[0] : "";
  };
  const getClassType = (courseCode) => {
      if (!courseCode) return "UNKNOWN";
      if (courseCode.includes("86")) return "VIP86"; 
      if (courseCode.startsWith("BD")) return "FREE_BD";
      return courseCode.substring(0, 2); 
  };
  const extractDateFromText = (text, defaultDate) => {
      if (!text) return defaultDate;
      const match = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (match) { return new Date(match[3], match[2] - 1, match[1]); }
      return defaultDate;
  };
  const formatMoney = (amount) => new Intl.NumberFormat('vi-VN').format(amount);

  // --- PHÂN TÍCH ---
  Object.keys(studentHistory).forEach(hvCode => {
      const transactions = studentHistory[hvCode].sort((a, b) => a.date - b.date); // Sửa lại sort gọn
      const firstDateEver = transactions[0].date;
      const isLegacy = (firstDateEver < CUTOFF_DATE);
      const targetSpecificStats = isLegacy ? statsOld : statsNew;
      const statsToUpdate = [statsTotal, targetSpecificStats];

      let previousClassType = null; 
      let isDirectVIP = false; 
      let processedCourses = new Set();

      transactions.forEach((trans, index) => {
          const row = trans.row;
          const transDate = trans.date;
          const studentName = row[lsMap["Họ và tên"]];
          const isTransInRange = (transDate >= startDate && transDate <= endDate);
          
          let rawCode = String(row[lsMap["Mã lớp mới"]] || "").trim().toUpperCase();
          if (!rawCode) rawCode = extractCodeFromText(String(row[lsMap["Khóa ĐK mới"]] || row[lsMap["Lớp ĐK mới"]] || ""));
          let courseCode = normalizeCourseCode(rawCode);
          
          if (!courseCode || !statsTotal[courseCode]) courseCode = "KHONG_XAC_DINH";
          
          const currentClassType = getClassType(courseCode);
          const status = String(row[lsMap["Trạng thái duyệt"]]).toLowerCase();
          const isEnrollment = status.includes("duyệt") && !status.includes("hoàn");
          const refundStatus = String(row[lsMap["Trạng thái hoàn cọc"]] || "").toLowerCase();
          let depositIn = parseMoneySafe(row[lsMap["Phí cọc mới"]]);
          if (currentClassType === "FREE_BD") depositIn = 0;

          const logDetail = (targetCode, type, money = 0, dateToLog = transDate, extraNote = "") => {
             const dateStr = Utilities.formatDate(dateToLog, Session.getScriptTimeZone(), "dd/MM");
             const moneyStr = money !== 0 ? ` [${money > 0 ? '+' : ''}${formatMoney(money)}]` : "";
             statsToUpdate.forEach(s => {
                 if (s[targetCode]) s[targetCode].details.push(`• ${dateStr} ${hvCode}-${studentName}: ${type}${moneyStr} ${extraNote}`);
             });
          };

          // A. GHI DANH
          if (isEnrollment) {
              if (index === 0 && currentClassType === "VIP86") isDirectVIP = true;
              if (isTransInRange) {
                  const isFirstTimeForThisCourse = !processedCourses.has(courseCode);
                  processedCourses.add(courseCode);
                  let logMsg = "Ghi danh";

                  statsToUpdate.forEach(statObj => {
                      statObj[courseCode].cashIn += depositIn;
                      statObj[courseCode].liability += depositIn; 
                      if (index === 0) {
                          if (isFirstTimeForThisCourse) statObj[courseCode].countNew++;
                          logMsg = "🟢 Ghi danh mới";
                      } else {
                          if (previousClassType === "VIP86") {
                              if (isFirstTimeForThisCourse) statObj[courseCode].countVip++;
                              if (isFirstTimeForThisCourse && courseCode.startsWith("AF") && !courseCode.includes("86") && isDirectVIP) {
                                  let allocationAmount = courseFees[rawCode] || courseFees[courseCode] || 0;
                                  if (allocationAmount > 0) {
                                      statObj[courseCode].cashIn += allocationAmount;
                                      statObj[courseCode].liability += allocationAmount; 
                                      let vipKey = Object.keys(statObj).find(k => k.includes("86"));
                                      if (vipKey && statObj[vipKey]) {
                                          statObj[vipKey].cashOut += allocationAmount;
                                          statObj[vipKey].liability -= allocationAmount; 
                                      }
                                  }
                              }
                              logMsg = "💎 HV từ VIP 86D";
                          } else {
                               logMsg = "🔵 Chuyển đến/Học lại";
                          }
                      }
                  });
                  
                  if (previousClassType === "VIP86" && isDirectVIP && courseCode.startsWith("AF") && !courseCode.includes("86")) {
                      let alloc = courseFees[rawCode] || courseFees[courseCode] || 0;
                      if (alloc > 0) {
                           logDetail(courseCode, logMsg, depositIn, transDate, `(Nhận quỹ ${formatMoney(alloc)})`);
                           statsToUpdate.forEach(s => {
                               let vipKey = Object.keys(s).find(k => k.includes("86"));
                               if(vipKey && s[vipKey]) {
                                   const dStr = Utilities.formatDate(transDate, Session.getScriptTimeZone(), "dd/MM");
                                   s[vipKey].details.push(`• ${dStr} 🔻 Trích quỹ sang ${courseCode} (HV: ${studentName}) [-${formatMoney(alloc)}]`);
                               }
                           });
                      } else { logDetail(courseCode, logMsg, depositIn, transDate, `(Lỗi giá=0)`); }
                  } else {
                      logDetail(courseCode, logMsg, depositIn);
                  }
              }
              previousClassType = currentClassType; 
          }
          
          // B. XỬ LÝ HOÀN/SUNG QUỸ (DÙNG CỘT MỚI)
          if (refundStatus) {
              const eventDate = extractDateFromText(refundStatus, transDate);
              const isInRange = (eventDate >= startDate && eventDate <= endDate);
              if (isInRange) {
                  // [THAY ĐỔI] Dùng cột "Số tiền Tất toán"
                  let moneyAmount = parseMoneySafe(row[lsMap["Số tiền Tất toán"]]); 
                  let note = "Thực tế";
                  if (isNaN(moneyAmount) || moneyAmount === 0) {
                      moneyAmount = depositIn; 
                      note = "Mặc định";
                  }

                  const isConfiscated = refundStatus.includes("sung") || refundStatus.includes("phạt") || refundStatus.includes("gieo") || refundStatus.includes("tặng") || refundStatus.includes("đền đáp");
                  const isRefunded = refundStatus.includes("hoàn");
                  
                  statsToUpdate.forEach(s => {
                      if (isRefunded) {
                          s[courseCode].cashOut += moneyAmount;
                          s[courseCode].liability -= moneyAmount; 
                      } else if (isConfiscated) {
                          s[courseCode].liability -= moneyAmount;
                          s[courseCode].revenue += moneyAmount;
                      }
                  });
                  
                  if (isRefunded) {
                      logDetail(courseCode, "💸 Chi hoàn tiền", -moneyAmount, eventDate, note);
                  } else if (isConfiscated) {
                      let reason = "Sung quỹ";
                      if(refundStatus.includes("gieo")) reason = "Gieo hạt";
                      if(refundStatus.includes("đền đáp")) reason = "Đền đáp";
                      logDetail(courseCode, `💰 ${reason} (Doanh thu)`, 0, eventDate, `(Tất toán ${formatMoney(moneyAmount)})`);
                  }
              }
          }
      });
  });

  // 6. VẼ BÁO CÁO (Giữ nguyên cấu trúc cũ)
  let r = 1;
  reportSheet.getRange(r, 1).setValue(`BÁO CÁO TÀI CHÍNH (${Utilities.formatDate(startDate, Session.getScriptTimeZone(), "dd/MM")} - ${Utilities.formatDate(endDate, Session.getScriptTimeZone(), "dd/MM/yyyy")})`).setFontSize(18).setFontWeight("bold").setFontColor("#CC0000");
  r += 2;

  reportSheet.getRange(r, 1).setValue("I. TỔNG HỢP TOÀN BỘ").setFontSize(14).setFontWeight("bold").setBackground("#CFE2F3");
  r += 2; r = drawReportSection(reportSheet, statsTotal, r); r += 3;

  reportSheet.getRange(r, 1).setValue("II. CHI TIẾT: HV MỚI").setFontSize(14).setFontWeight("bold").setBackground("#D9EAD3");
  r += 2; r = drawReportSection(reportSheet, statsNew, r); r += 3;

  reportSheet.getRange(r, 1).setValue("III. CHI TIẾT: HV CŨ").setFontSize(14).setFontWeight("bold").setBackground("#F4CCCC");
  r += 3; r = drawReportSection(reportSheet, statsOld, r);

  reportSheet.setColumnWidth(1, 180); reportSheet.setColumnWidth(2, 400);
  [3, 4, 5, 6, 7, 8].forEach(c => reportSheet.setColumnWidth(c, 130));
  ui.alert("Đã tạo báo cáo (Cột 'Số tiền Tất toán')!");
}

// --- HÀM VẼ (CẤU TRÚC CỘT MỚI) ---
function drawReportSection(sheet, statsData, startRow) {
  let currentRow = startRow;
  
  const sumHeaders = [
      "Mã Khóa", "Chi tiết giải trình", 
      "Tổng Tiền Vào (+)", // Cash In
      "Tổng Tiền Ra (-)",  // Cash Out (Hoàn + Trích)
      "SỐ DƯ TIỀN MẶT (Cash Balance)", 
      "---------------",
      "⚠️ Nợ Cọc HV (Liability)", 
      "✅ Doanh Thu Thực (Revenue)"
  ];
  sheet.getRange(currentRow, 1, 1, sumHeaders.length).setValues([sumHeaders]).setFontWeight("bold").setBackground("#EFEFEF").setHorizontalAlignment("center");
  currentRow++;
  
  let totalCashBalance = 0;
  let totalLiability = 0;
  let totalRevenue = 0;

  const sortedKeys = Object.keys(statsData).sort();
  
  sortedKeys.forEach(code => {
      const s = statsData[code];
      const cashBalance = s.cashIn - s.cashOut;
      
      // Kiểm tra lớp KD (Tạm tính)
      const isKD = code.startsWith("KD");
      
      // Logic hiển thị Nợ/Doanh thu cho lớp KD
      // Với lớp KD, vì chưa chia lớp nên toàn bộ tiền là "Nợ tạm tính", Revenue = 0
      let displayRevenue = isKD ? 0 : s.revenue;
      let displayLiability = isKD ? cashBalance : s.liability; 
      
      // Cộng tổng (Trừ KD ra khỏi tổng Revenue/Liability nếu muốn, nhưng Cash Balance thì vẫn là tiền đang giữ)
      if (!isKD) {
          totalCashBalance += cashBalance;
          totalLiability += displayLiability;
          totalRevenue += displayRevenue;
      } else {
          // Vẫn cộng Cash Balance của KD vào tổng tiền mặt (vì tiền đang nằm trong túi mình)
          totalCashBalance += cashBalance;
      }

      if (s.cashIn > 0 || s.cashOut > 0 || s.details.length > 0) {
          let displayName = isKD ? `${code} (Tạm tính)` : code;
          
          const rowData = [
              displayName,
              (s.details.length > 0 ? s.details.join("\n") : ""),
              s.cashIn,
              s.cashOut,
              cashBalance,
              "|",
              displayLiability,
              displayRevenue
          ];
          
          const range = sheet.getRange(currentRow, 1, 1, rowData.length);
          range.setValues([rowData]).setBorder(true, true, true, true, true, true);
          
          // Format tiền
          [3, 4, 5, 7, 8].forEach(c => sheet.getRange(currentRow, c).setNumberFormat("#,##0"));
          
          // Style
          sheet.getRange(currentRow, 2).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP).setFontSize(9); // Cột chi tiết
          sheet.getRange(currentRow, 5).setFontWeight("bold").setBackground(isKD ? "#F3F3F3" : "#FFF2CC"); // Cash Balance
          sheet.getRange(currentRow, 7).setFontColor("#C0392B"); // Nợ (Đỏ)
          sheet.getRange(currentRow, 8).setFontColor("#27AE60").setFontWeight("bold"); // Doanh thu (Xanh)
          
          currentRow++;
      }
  });
  
  // Tổng cộng
  sheet.getRange(currentRow, 1).setValue("TỔNG TOÀN HỆ THỐNG:").setFontWeight("bold");
  sheet.getRange(currentRow, 5).setValue(totalCashBalance).setNumberFormat("#,##0").setFontWeight("bold").setBackground("yellow");
  sheet.getRange(currentRow, 7).setValue(totalLiability).setNumberFormat("#,##0").setFontWeight("bold").setFontColor("red");
  sheet.getRange(currentRow, 8).setValue(totalRevenue).setNumberFormat("#,##0").setFontWeight("bold").setFontColor("green");
  
  return currentRow + 2;
}

// Helper
function getHeaderMap(headers) {
  const map = {};
  headers.forEach((h, i) => { map[String(h).trim()] = i; });
  return map;
}
function parseDateVN(dateStr) {
  const parts = dateStr.split('/');
  if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]);
  return null;
}
function formatMoney(amount) {
  return new Intl.NumberFormat('vi-VN').format(amount);
}
// =================================================================
// TÍNH NĂNG: TÌM HỌC VIÊN ĐĂNG KÝ THẲNG 86 NGÀY (TỪ 23/9)
// =================================================================

function baoCaoHocVienThangVIP() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Cấu hình
  const CUTOFF_DATE = new Date("2025-09-23T00:00:00"); // Mốc thời gian
  const VIP_KEYWORD = "86"; // Từ khóa nhận diện lớp VIP
  const REPORT_SHEET_NAME = "BaoCao_Direct_VIP";

  // 2. Lấy dữ liệu
  const lsSheet = ss.getSheetByName("LS_DangKy");
  const dkySheet = ss.getSheetByName("DKy"); // Để lấy SĐT, Email
  
  if (!lsSheet || !dkySheet) { ui.alert("Thiếu sheet dữ liệu."); return; }

  const lsData = lsSheet.getDataRange().getValues();
  const dkyData = dkySheet.getDataRange().getValues();
  
  const lsMap = getHeaderMap(lsData.shift());
  const dkyMap = getHeaderMap(dkyData.shift());

  // 3. Tạo Map thông tin liên lạc từ DKy (để báo cáo đầy đủ)
  let contactMap = {};
  dkyData.forEach(row => {
      const code = String(row[dkyMap["MÃ CODE"]]).replace("'","").trim();
      if(code) {
          contactMap[code] = {
              phone: row[dkyMap["Số điện thoại"]],
              email: row[dkyMap["Địa chỉ email"]]
          };
      }
  });

  // 4. Gom nhóm lịch sử giao dịch theo Mã HV
  let studentHistory = {};
  
  lsData.forEach(row => {
    const codeHV = String(row[lsMap["MÃ CODE"]]).trim();
    const dateRaw = row[lsMap["Dấu thời gian"]];
    
    if (codeHV && dateRaw) {
        if (!studentHistory[codeHV]) studentHistory[codeHV] = [];
        
        studentHistory[codeHV].push({
            row: row,
            date: new Date(dateRaw),
            timestamp: new Date(dateRaw).getTime(),
            courseName: String(row[lsMap["Khóa ĐK mới"]] || row[lsMap["Lớp ĐK mới"]] || ""),
            status: String(row[lsMap["Trạng thái duyệt"]]).toLowerCase()
        });
    }
  });

  // 5. Lọc và Xử lý
  let resultRows = [];

  Object.keys(studentHistory).forEach(hvCode => {
      // Sắp xếp lịch sử: Cũ nhất -> Mới nhất
      const transactions = studentHistory[hvCode].sort((a, b) => a.timestamp - b.timestamp);
      
      // Lấy giao dịch ĐẦU TIÊN
      const firstTrans = transactions[0];
      
      // Điều kiện 1: Ngày đăng ký đầu tiên phải >= 23/9
      if (firstTrans.date < CUTOFF_DATE) return;

      // Điều kiện 2: Lớp đầu tiên phải là VIP (chứa "86")
      // Lưu ý: Phải check trạng thái đã duyệt
      if (!firstTrans.status.includes("duyệt")) return;
      
      // Kiểm tra tên lớp đầu tiên
      // (Tìm trong cột Mã lớp hoặc Tên lớp xem có chứ 86 không)
      const firstClassCode = String(firstTrans.row[lsMap["Mã lớp mới"]] || "").toUpperCase();
      const firstClassName = firstTrans.courseName.toUpperCase();
      
      const isDirectVIP = firstClassCode.includes(VIP_KEYWORD) || firstClassName.includes(VIP_KEYWORD);

      if (isDirectVIP) {
          // ==> ĐÂY LÀ ĐỐI TƯỢNG CẦN TÌM
          const contact = contactMap[hvCode] || { phone: "", email: "" };
          
          // Tổng hợp toàn bộ lịch sử sau đó
          let historyText = "";
          transactions.forEach((t, idx) => {
              const dateStr = Utilities.formatDate(t.date, Session.getScriptTimeZone(), "dd/MM/yy");
              const prefix = (idx === 0) ? "⭐ Kích hoạt:" : "➡ Tiếp theo:";
              historyText += `[${dateStr}] ${prefix} ${t.courseName}\n`;
          });

          resultRows.push([
              hvCode,
              firstTrans.row[lsMap["Họ và tên"]],
              contact.phone,
              contact.email,
              Utilities.formatDate(firstTrans.date, Session.getScriptTimeZone(), "dd/MM/yyyy"),
              historyText.trim()
          ]);
      }
  });

  // 6. Xuất Báo Cáo
  let reportSheet = ss.getSheetByName(REPORT_SHEET_NAME);
  if (!reportSheet) reportSheet = ss.insertSheet(REPORT_SHEET_NAME);
  else reportSheet.clear();

  const title = "DANH SÁCH HỌC VIÊN ĐĂNG KÝ THẲNG VIP (TỪ 23/09/2025)";
  reportSheet.getRange(1, 1).setValue(title).setFontSize(14).setFontWeight("bold").setFontColor("#B45309");
  
  const headers = ["Mã HV", "Họ và Tên", "Số điện thoại", "Email", "Ngày gia nhập", "Lịch sử Học tập & Hoạt động"];
  reportSheet.getRange(3, 1, 1, headers.length).setValues([headers])
      .setBackground("#FCE5CD").setFontWeight("bold").setBorder(true, true, true, true, true, true);

  if (resultRows.length > 0) {
      // Sắp xếp theo ngày gia nhập mới nhất
      resultRows.sort((a, b) => {
          // Chuyển đổi lại dd/MM/yyyy sang timestamp để sort
          const d1 = parseDateVN(a[4]); 
          const d2 = parseDateVN(b[4]);
          return d2 - d1; 
      });

      const rng = reportSheet.getRange(4, 1, resultRows.length, headers.length);
      rng.setValues(resultRows).setVerticalAlignment("top").setBorder(true, true, true, true, true, true);
      
      // Wrap text cho cột Lịch sử
      reportSheet.getRange(4, 6, resultRows.length, 1).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
      
      reportSheet.autoResizeColumns(1, 5);
      reportSheet.setColumnWidth(6, 400); // Cột lịch sử rộng
      
      ui.alert(`Tìm thấy ${resultRows.length} học viên thỏa mãn điều kiện!`);
  } else {
      ui.alert("Không tìm thấy học viên nào đăng ký thẳng VIP từ ngày 23/9.");
  }
}

// Helper parse lại ngày từ chuỗi dd/MM/yyyy
function parseDateVN(dateStr) {
  const parts = dateStr.split('/');
  return new Date(parts[2], parts[1] - 1, parts[0]);
}

// =================================================================
// BÁO CÁO DOANH THU THẬT (AF & KD) - CÓ HỖ TRỢ CHỌN LỚP
// =================================================================

function baoCaoDoanhThuThat_AF_KD(customList) {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Xác định danh sách lớp cần báo cáo
  // Nếu có customList (từ hộp thoại chọn) thì dùng, không thì tự quét AF và KD
  const TARGET_LIST = customList || layDanhSachMaLopTuDong(["AF", "KD"]);

  if (TARGET_LIST.length === 0) {
    ui.alert("Không tìm thấy lớp AF hoặc KD nào để báo cáo.");
    return;
  }

  // 2. Chọn thời gian
  const startDateInput = ui.prompt('Báo cáo Doanh thu Thật', 'Nhập NGÀY BẮT ĐẦU tính HV Mới (Cohort Date):\n(Ví dụ: 23/09/2025)', ui.ButtonSet.OK_CANCEL);
  if (startDateInput.getSelectedButton() !== ui.Button.OK) return;
  
  const endDateInput = ui.prompt('Báo cáo Doanh thu Thật', 'Tính dòng tiền đến hết ngày (dd/MM/yyyy):\n(Thường là Hôm nay)', ui.ButtonSet.OK_CANCEL);
  if (endDateInput.getSelectedButton() !== ui.Button.OK) return;
  
  const startDate = parseDateVN(startDateInput.getResponseText().trim());
  const endDate = parseDateVN(endDateInput.getResponseText().trim());
  
  if (!startDate || !endDate) { ui.alert("Ngày không hợp lệ."); return; }
  endDate.setHours(23, 59, 59, 999); 

  const REPORT_SHEET_NAME = "BaoCao_DoanhThuThat";

  // 3. Chuẩn bị Sheet
  let reportSheet = ss.getSheetByName(REPORT_SHEET_NAME);
  if (!reportSheet) reportSheet = ss.insertSheet(REPORT_SHEET_NAME);
  else reportSheet.clear();

  // 4. Lấy dữ liệu
  const lsSheet = ss.getSheetByName("LS_DangKy");
  const khSheet = ss.getSheetByName("KH"); 
  const lsData = lsSheet.getDataRange().getValues();
  const khData = khSheet.getDataRange().getValues();
  const lsMap = getHeaderMap(lsData.shift());
  const khMap = getHeaderMap(khData.shift());

  const colRefundMoney = lsMap["Số tiền Tất toán"] !== undefined ? "Số tiền Tất toán" : "Số tiền hoàn thực tế";

  const parseMoneySafe = (val) => {
      if (!val) return 0;
      if (typeof val === 'number') return val;
      const num = parseInt(String(val).replace(/[^0-9]/g, ''));
      return isNaN(num) ? 0 : num;
  };

  let courseFees = {};
  let courseNames = {};
  let targetClasses = []; 
  let processedCodes = new Set();

  khData.forEach(row => {
      const code = String(row[khMap["Mã khóa"]]).trim().toUpperCase();
      const name = String(row[khMap["Tên khóa học"]]).trim();
      const fee = parseMoneySafe(row[khMap["Phí cọc"]]);
      if (code) {
          courseFees[code] = isNaN(fee) ? 0 : fee;
          courseNames[code] = name;
          // Chỉ lấy những lớp nằm trong danh sách mục tiêu
          if (TARGET_LIST.includes(code) && !processedCodes.has(code)) {
              targetClasses.push(code);
              processedCodes.add(code);
          }
      }
  });

  targetClasses.sort();

  // 5. Khởi tạo Stats
  let stats = {};
  targetClasses.forEach(code => {
      stats[code] = {
          name: courseNames[code],
          directCount: 0, directMoney: 0,       
          vipCount: 0, vipAllocationMoney: 0,  
          refundCount: 0, refundMoney: 0,       
          reservedCount: 0, reservedMoney: 0,
          details: [] 
      };
  });

  // 6. Xử lý Dữ liệu Lịch sử
  let studentHistory = {}; 
  lsData.forEach(row => {
    const codeHV = String(row[lsMap["MÃ CODE"]]).trim();
    const dateRaw = row[lsMap["Dấu thời gian"]];
    if (codeHV && dateRaw) {
        if (!studentHistory[codeHV]) studentHistory[codeHV] = [];
        studentHistory[codeHV].push({ row: row, date: new Date(dateRaw) });
    }
  });

  const normalizeCourseCode = (code) => code ? code.trim().toUpperCase() : "";
  const extractCodeFromText = (text) => {
      const match = text.toUpperCase().match(/(KD\d+|AF\d+|NH\d+|LS\d+|86D|BD)/);
      return match ? match[0] : "";
  };
  const getClassType = (courseCode) => {
      if (!courseCode) return "UNKNOWN";
      if (courseCode.includes("86")) return "VIP86"; 
      if (courseCode.startsWith("BD")) return "FREE_BD";
      return courseCode.substring(0, 2); 
  };
  const extractDateFromText = (text, defaultDate) => {
      if (!text) return defaultDate;
      const match = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (match) { return new Date(match[3], match[2] - 1, match[1]); }
      return defaultDate;
  };
  const formatMoney = (amount) => new Intl.NumberFormat('vi-VN').format(amount);

  // --- PHÂN TÍCH ---
  Object.keys(studentHistory).forEach(hvCode => {
      const transactions = studentHistory[hvCode].sort((a, b) => a.date - b.date);
      const firstDateEver = transactions[0].date;
      
      // Lọc Cohort: Chỉ tính người gia nhập từ ngày bắt đầu
      if (firstDateEver < startDate) return; 

      let previousClassType = null; 
      let previousCourseCode = "";
      let isReserved = false;       
      let isDirectVIP = false; 
      let hasLearnedVideo = false;
      let studentClassState = {};

      transactions.forEach((trans, index) => {
          const row = trans.row;
          const transDate = trans.date;
          const studentName = row[lsMap["Họ và tên"]];
          const isInReportRange = (transDate <= endDate); 
          
          let rawCode = String(row[lsMap["Mã lớp mới"]] || "").trim().toUpperCase();
          if (!rawCode) rawCode = extractCodeFromText(String(row[lsMap["Khóa ĐK mới"]] || row[lsMap["Lớp ĐK mới"]] || ""));
          let courseCode = normalizeCourseCode(rawCode);
          
          const courseNameStr = String(row[lsMap["Khóa ĐK mới"]] || "").toUpperCase();
          if (courseCode.includes("VIDEO") || courseNameStr.includes("VIDEO")) hasLearnedVideo = true;

          const isTargetClass = stats[courseCode] !== undefined;
          const currentClassType = getClassType(courseCode);
          const status = String(row[lsMap["Trạng thái duyệt"]]).toLowerCase();
          const isGoingToReservation = status.includes("bảo lưu") && !status.includes("duyệt");
          const isEnrollment = status.includes("duyệt") && !status.includes("hoàn");
          const refundStatus = String(row[lsMap["Trạng thái hoàn cọc"]] || "").toLowerCase();
          
          let depositIn = parseMoneySafe(row[lsMap["Phí cọc mới"]]);
          if (currentClassType === "FREE_BD") depositIn = 0;

          if (isTargetClass && !studentClassState[courseCode]) {
              studentClassState[courseCode] = { balance: 0, isReserved: false };
          }

          const logDetail = (targetCode, type, money = 0, dateToLog = transDate, extraNote = "") => {
             const dateStr = Utilities.formatDate(dateToLog, Session.getScriptTimeZone(), "dd/MM");
             const moneyStr = money !== 0 ? ` [${formatMoney(money)}]` : "";
             if (stats[targetCode]) {
                 stats[targetCode].details.push(`• [${dateStr}] ${hvCode}-${studentName}: ${type}${moneyStr} ${extraNote}`);
             }
          };

          // A. GHI DANH
          if (isEnrollment) {
              if (index === 0 && currentClassType === "VIP86") isDirectVIP = true;
              if (isTargetClass && isInReportRange) {
                  studentClassState[courseCode].isReserved = false;
                  let logMsg = "Ghi danh";
                  let extra = "";
                  let moneyAdded = 0;

                  if (index === 0) { // F0
                      stats[courseCode].directCount++;
                      stats[courseCode].directMoney += depositIn;
                      moneyAdded = depositIn;
                      logMsg = "🟢 Ghi danh mới";
                  } else { // F1+
                      if (hasLearnedVideo && courseCode.startsWith("AF") && depositIn === 0) {
                          stats[courseCode].directCount++; 
                          logMsg = "🎁 Miễn phí (HV Video cũ)";
                          moneyAdded = 0;
                      }
                      else if (previousClassType === "VIP86") {
                          stats[courseCode].vipCount++; 
                          // TRÍCH QUỸ
                          if (isDirectVIP && courseCode.startsWith("AF") && !courseCode.includes("86")) {
                              let allocationAmount = courseFees[rawCode] || courseFees[courseCode] || 0;
                              if (allocationAmount > 0) {
                                  stats[courseCode].vipAllocationMoney += allocationAmount;
                                  moneyAdded = allocationAmount; 
                                  logMsg = "💎 Nhận quỹ từ 86D";
                              } else {
                                  moneyAdded = depositIn; 
                                  stats[courseCode].directMoney += depositIn;
                                  logMsg = "⚠️ Lỗi giá cọc";
                              }
                          } else {
                              stats[courseCode].directMoney += depositIn;
                              moneyAdded = depositIn;
                              logMsg = "🔸 HV từ VIP (Không trích)";
                          }
                      } else if (isReserved) {
                          // [QUAY LẠI TỪ BẢO LƯU]
                          stats[courseCode].directMoney += depositIn; 
                          moneyAdded = depositIn;
                          logMsg = "🔙 Quay lại từ Bảo lưu";
                          extra = `(Gốc: ${previousCourseCode})`;
                          if (previousClassType !== "KD_SYSTEM") stats[courseCode].directCount++;
                      } else {
                          stats[courseCode].directCount++; 
                          stats[courseCode].directMoney += depositIn;
                          moneyAdded = depositIn;
                          logMsg = "🔵 Chuyển đến/Học lại";
                      }
                  }
                  studentClassState[courseCode].balance += moneyAdded;
                  logDetail(courseCode, logMsg, depositIn, transDate, extra);
              }
              previousClassType = currentClassType; 
              previousCourseCode = courseCode;
              isReserved = false;
          }
          
          // B. BẢO LƯU
          if (isGoingToReservation) {
              if (isTargetClass && isInReportRange) {
                  studentClassState[courseCode].isReserved = true; 
                  logDetail(courseCode, "⏸️ Đã bảo lưu (Treo tiền)");
              }
              isReserved = true; 
          }

          // C. HOÀN CỌC / SUNG QUỸ
          if (isTargetClass && refundStatus) {
              const refundDate = extractDateFromText(refundStatus, transDate);
              if (refundDate >= startDate && refundDate <= endDate) {
                  
                  let moneyAmount = parseMoneySafe(row[lsMap[colRefundMoney]]); 
                  let note = "Thực tế";
                  if (isNaN(moneyAmount)) {
                      moneyAmount = parseMoneySafe(row[lsMap["Phí cọc mới"]]);
                      note = "Mặc định (100%)";
                  }

                  const isConfiscated = refundStatus.includes("sung") || refundStatus.includes("phạt") || refundStatus.includes("gieo") || refundStatus.includes("tặng") || refundStatus.includes("đền đáp");
                  const isRefunded = refundStatus.includes("hoàn");
                  
                  studentClassState[courseCode].balance -= moneyAmount;
                  studentClassState[courseCode].isReserved = false;

                  if (isRefunded) {
                      stats[courseCode].refundCount++;
                      stats[courseCode].refundMoney += moneyAmount;
                      logDetail(courseCode, "❌ Hoàn cọc (Trả khách)", -moneyAmount, refundDate, note);
                  } 
                  else if (isConfiscated) {
                      let reason = "Sung quỹ";
                      if(refundStatus.includes("gieo")) reason = "Gieo hạt";
                      if(refundStatus.includes("đền đáp")) reason = "Đền đáp";
                      logDetail(courseCode, `💰 ${reason} (Doanh thu)`, 0, refundDate, `(Tất toán ${formatMoney(moneyAmount)})`);
                  }
              }
          }
      });
      
      // TÍNH TIỀN TREO
      Object.keys(studentClassState).forEach(cCode => {
          const state = studentClassState[cCode];
          if (state.isReserved && state.balance > 0) {
              stats[cCode].reservedCount++;
              stats[cCode].reservedMoney += state.balance;
              stats[cCode].details.push(`   ➥ ⚠️ Đang treo bảo lưu: ${formatMoney(state.balance)} (Chưa tính doanh thu)`);
          }
      });
  });

  // 7. VẼ BÁO CÁO
  let r = 1;
  reportSheet.getRange(r, 1).setValue(`BÁO CÁO DOANH THU THẬT (COHORT TỪ ${Utilities.formatDate(startDate, Session.getScriptTimeZone(), "dd/MM/yyyy")})`).setFontSize(18).setFontWeight("bold").setFontColor("#CC0000");
  r += 2;

  const afCodes = targetClasses.filter(c => c.startsWith("AF")).sort();
  const kdCodes = targetClasses.filter(c => c.startsWith("KD")).sort();

  r = drawSpecificTable_AF_KD(reportSheet, stats, afCodes, r, "I. DOANH THU THỰC TẾ (CÁC LỚP AF - ĐÃ CHỐT)", true);
  r += 3;
  r = drawSpecificTable_AF_KD(reportSheet, stats, kdCodes, r, "II. DÒNG TIỀN TẠM TÍNH (CÁC LỚP KD - CHƯA CHIA LỚP)", false);

  reportSheet.setColumnWidth(1, 200); 
  reportSheet.setColumnWidth(2, 500); 
  reportSheet.autoResizeColumns(3, 8);
  
  ui.alert("Đã cập nhật báo cáo Doanh thu (Hỗ trợ chọn lớp linh hoạt)!");
}

// --- HÀM VẼ BẢNG RIÊNG (Phụ trợ cho hàm trên) ---
function drawSpecificTable_AF_KD(sheet, statsData, keysToDraw, startRow, tableTitle, isRealRevenue) {
  let currentRow = startRow;
  
  // Tiêu đề bảng
  sheet.getRange(currentRow, 1).setValue(tableTitle).setFontSize(14).setFontWeight("bold")
        .setBackground(isRealRevenue ? "#CFE2F3" : "#EFEFEF")
        .setFontColor(isRealRevenue ? "#000000" : "#666666");
  currentRow += 2;

  const headers = [
      "Lớp", 
      "Tiền Thực Thu (+)", "Tiền Nhận Quỹ (+)", 
      "Tiền Chi Hoàn (-)", "Tiền Treo Bảo Lưu (-)", 
      isRealRevenue ? "DOANH THU THỰC (Net)" : "TIỀN ĐANG GIỮ (A - C)", 
      "Số HV Treo"
  ];
  sheet.getRange(currentRow, 1, 1, headers.length).setValues([headers])
      .setFontWeight("bold").setBackground("#45818E").setFontColor("white").setHorizontalAlignment("center");
  currentRow++;

  let totalNet = 0;

  keysToDraw.forEach(code => {
      const s = statsData[code];
      const net = (s.directMoney + s.vipAllocationMoney) - s.refundMoney - s.reservedMoney;
      totalNet += net;
      
      const rowData = [
          code + " - " + s.name,
          s.directMoney, s.vipAllocationMoney,
          s.refundMoney, 
          s.reservedMoney, 
          net,
          s.reservedCount
      ];
      
      const range = sheet.getRange(currentRow, 1, 1, rowData.length);
      range.setValues([rowData]).setBorder(true, true, true, true, true, true);
      [2, 3, 4, 5, 6].forEach(c => sheet.getRange(currentRow, c).setNumberFormat("#,##0"));
      
      if (s.reservedMoney > 0) sheet.getRange(currentRow, 5).setFontColor("orange").setFontWeight("bold");
      
      const lastCell = sheet.getRange(currentRow, 6);
      lastCell.setFontWeight("bold");
      if (isRealRevenue) lastCell.setBackground("#FFF2CC").setFontColor("#000");
      else lastCell.setBackground("#F3F3F3").setFontColor("#666").setFontStyle("italic");

      if (s.details.length > 0) {
          currentRow++;
          sheet.getRange(currentRow, 1).setValue("Chi tiết:").setFontStyle("italic").setFontSize(9);
          sheet.getRange(currentRow, 2).setValue(s.details.join("\n")).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
          sheet.getRange(currentRow, 2, 1, 6).merge().setBackground("#F9F9F9").setVerticalAlignment("top");
      }
      currentRow++;
  });
  
  currentRow++;
  sheet.getRange(currentRow, 5).setValue(isRealRevenue ? "TỔNG DOANH THU:" : "TỔNG TIỀN GIỮ:").setFontWeight("bold").setHorizontalAlignment("right");
  
  const totalCell = sheet.getRange(currentRow, 6);
  totalCell.setValue(totalNet).setNumberFormat("#,##0").setFontWeight("bold");
  if (isRealRevenue) totalCell.setBackground("yellow").setFontSize(12);
  else totalCell.setBackground("#EFEFEF").setFontColor("#666");

  return currentRow;
}
// --- HÀM VẼ BẢNG RIÊNG ---
function drawSpecificTable_AF_KD(sheet, statsData, keysToDraw, startRow, tableTitle, isRealRevenue) {
  let currentRow = startRow;
  
  // Tiêu đề bảng
  sheet.getRange(currentRow, 1).setValue(tableTitle).setFontSize(14).setFontWeight("bold")
       .setBackground(isRealRevenue ? "#CFE2F3" : "#EFEFEF")
       .setFontColor(isRealRevenue ? "#000000" : "#666666");
  currentRow += 2;

  const headers = [
      "Lớp", 
      "Tiền Thực Thu (+)", "Tiền Nhận Quỹ (+)", 
      "Tiền Chi Hoàn (-)", "Tiền Treo Bảo Lưu (-)", 
      isRealRevenue ? "DOANH THU THỰC (Net)" : "TIỀN ĐANG GIỮ (A - C)", 
      "Số HV Treo"
  ];
  sheet.getRange(currentRow, 1, 1, headers.length).setValues([headers])
      .setFontWeight("bold").setBackground("#45818E").setFontColor("white").setHorizontalAlignment("center");
  currentRow++;

  let totalNet = 0;

  keysToDraw.forEach(code => {
      const s = statsData[code];
      // Công thức chuẩn: Net = (Thu + Quỹ) - Hoàn - Treo
      const net = (s.directMoney + s.vipAllocationMoney) - s.refundMoney - s.reservedMoney;

      totalNet += net;
      
      const rowData = [
          code + " - " + s.name,
          s.directMoney, s.vipAllocationMoney,
          s.refundMoney, 
          s.reservedMoney, 
          net,
          s.reservedCount
      ];
      
      const range = sheet.getRange(currentRow, 1, 1, rowData.length);
      range.setValues([rowData]).setBorder(true, true, true, true, true, true);
      [2, 3, 4, 5, 6].forEach(c => sheet.getRange(currentRow, c).setNumberFormat("#,##0"));
      
      // Tô màu cột Treo
      if (s.reservedMoney > 0) sheet.getRange(currentRow, 5).setFontColor("orange").setFontWeight("bold");
      
      // Tô màu cột Kết quả
      const lastCell = sheet.getRange(currentRow, 6);
      lastCell.setFontWeight("bold");
      if (isRealRevenue) lastCell.setBackground("#FFF2CC").setFontColor("#000");
      else lastCell.setBackground("#F3F3F3").setFontColor("#666").setFontStyle("italic");

      // In chi tiết
      if (s.details.length > 0) {
          currentRow++;
          sheet.getRange(currentRow, 1).setValue("Chi tiết:").setFontStyle("italic").setFontSize(9);
          sheet.getRange(currentRow, 2).setValue(s.details.join("\n")).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
          sheet.getRange(currentRow, 2, 1, 6).merge().setBackground("#F9F9F9").setVerticalAlignment("top");
      }
      currentRow++;
  });
  
  currentRow++;
  sheet.getRange(currentRow, 5).setValue(isRealRevenue ? "TỔNG DOANH THU:" : "TỔNG TIỀN GIỮ:").setFontWeight("bold").setHorizontalAlignment("right");
  
  const totalCell = sheet.getRange(currentRow, 6);
  totalCell.setValue(totalNet).setNumberFormat("#,##0").setFontWeight("bold");
  if (isRealRevenue) totalCell.setBackground("yellow").setFontSize(12);
  else totalCell.setBackground("#EFEFEF").setFontColor("#666");

  return currentRow;
}
// Helper
function getHeaderMap(headers) {
  const map = {};
  headers.forEach((h, i) => { map[String(h).trim()] = i; });
  return map;
}
function parseDateVN(dateStr) {
  const parts = dateStr.split('/');
  if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]);
  return null;
}
function formatMoney(amount) {
  return new Intl.NumberFormat('vi-VN').format(amount);
}
// =================================================================
// BÁO CÁO TÀI CHÍNH RIÊNG CHO LỚP NHÂN HIỆU (NH)
// Logic: Tiền cọc, Hoàn/Sung, VIP học miễn phí (Không trích quỹ)
// =================================================================

function baoCaoTaiChinh_LopNH(customList) {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // --- [TỰ ĐỘNG] LẤY TẤT CẢ LỚP BẮT ĐẦU BẰNG NH ---
  const TARGET_LIST = customList || layDanhSachMaLopTuDong(["NH"]);
  // Tự động ra: ["NH01", "NH02", "NH03", "NH04"...]
  const REPORT_SHEET_NAME = "BaoCao_TaiChinh_NH";

  // 2. Chọn thời gian Cohort (Ngày gia nhập)
  const startDateInput = ui.prompt('Báo cáo Tài chính NH', 'Nhập NGÀY BẮT ĐẦU tính HV Mới (Cohort Date):\n(Ví dụ: 23/09/2025)', ui.ButtonSet.OK_CANCEL);
  if (startDateInput.getSelectedButton() !== ui.Button.OK) return;
  
  const endDateInput = ui.prompt('Báo cáo Tài chính NH', 'Tính dòng tiền đến hết ngày (dd/MM/yyyy):\n(Thường là Hôm nay)', ui.ButtonSet.OK_CANCEL);
  if (endDateInput.getSelectedButton() !== ui.Button.OK) return;
  
  const startDate = parseDateVN(startDateInput.getResponseText().trim());
  const endDate = parseDateVN(endDateInput.getResponseText().trim());
  
  if (!startDate || !endDate) { ui.alert("Ngày không hợp lệ."); return; }
  endDate.setHours(23, 59, 59, 999); 

  // 3. Chuẩn bị Sheet báo cáo
  let reportSheet = ss.getSheetByName(REPORT_SHEET_NAME);
  if (!reportSheet) reportSheet = ss.insertSheet(REPORT_SHEET_NAME);
  else reportSheet.clear();

  // 4. Lấy dữ liệu nguồn
  const lsSheet = ss.getSheetByName("LS_DangKy");
  const khSheet = ss.getSheetByName("KH"); 
  if (!lsSheet || !khSheet) { ui.alert("Thiếu sheet dữ liệu LS_DangKy hoặc KH."); return; }

  const lsData = lsSheet.getDataRange().getValues();
  const khData = khSheet.getDataRange().getValues();
  const lsMap = getHeaderMap(lsData.shift());
  const khMap = getHeaderMap(khData.shift());

  const colRefundMoney = lsMap["Số tiền Tất toán"] !== undefined ? "Số tiền Tất toán" : "Số tiền hoàn thực tế";

  // Helper: Parse tiền an toàn
  const parseMoneySafe = (val) => {
      if (!val) return 0;
      if (typeof val === 'number') return val;
      const num = parseInt(String(val).replace(/[^0-9]/g, ''));
      return isNaN(num) ? 0 : num;
  };

  // Lấy tên lớp từ sheet KH
  let courseNames = {};
  khData.forEach(row => {
      const code = String(row[khMap["Mã khóa"]]).trim().toUpperCase();
      const name = String(row[khMap["Tên khóa học"]]).trim();
      if (code) courseNames[code] = name;
  });

  // Khởi tạo Object thống kê
  let stats = {};
  TARGET_LIST.forEach(code => {
      stats[code] = {
          name: courseNames[code] || "Chưa đặt tên",
          directCount: 0, directMoney: 0,       
          vipAllocationMoney: 0, // Cột này sẽ luôn bằng 0 với NH (theo yêu cầu)
          refundCount: 0, refundMoney: 0,       
          reservedCount: 0, reservedMoney: 0,
          details: [] 
      };
  });

  // 5. Xử lý Lịch sử Giao dịch
  let studentHistory = {}; 
  lsData.forEach(row => {
    const codeHV = String(row[lsMap["MÃ CODE"]]).trim();
    const dateRaw = row[lsMap["Dấu thời gian"]];
    if (codeHV && dateRaw) {
        if (!studentHistory[codeHV]) studentHistory[codeHV] = [];
        studentHistory[codeHV].push({ row: row, date: new Date(dateRaw) });
    }
  });

  // Các hàm tiện ích xử lý chuỗi
  const normalizeCourseCode = (code) => code ? code.trim().toUpperCase() : "";
  const extractCodeFromText = (text) => {
      const match = String(text).toUpperCase().match(/(NH\d+|KD\d+|AF\d+|86D)/);
      return match ? match[0] : "";
  };
  const getClassType = (c) => c.includes("86") ? "VIP86" : "NORMAL";
  const extractDateFromText = (text, defaultDate) => {
      const match = String(text).match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      return match ? new Date(match[3], match[2] - 1, match[1]) : defaultDate;
  };
  const formatMoney = (amount) => new Intl.NumberFormat('vi-VN').format(amount);

  // --- CORE LOGIC PHÂN TÍCH ---
  Object.keys(studentHistory).forEach(hvCode => {
      const transactions = studentHistory[hvCode].sort((a, b) => a.date - b.date);
      const firstDateEver = transactions[0].date;
      
      // LỌC COHORT: Chỉ tính người mới từ ngày bắt đầu
      if (firstDateEver < startDate) return; 

      let previousClassType = null; 
      let studentClassState = {}; // Theo dõi số dư từng lớp của HV

      transactions.forEach((trans, index) => {
          const row = trans.row;
          const transDate = trans.date;
          const isInReportRange = (transDate <= endDate); 
          const studentName = row[lsMap["Họ và tên"]];
          
          // Lấy mã lớp
          let rawCode = String(row[lsMap["Mã lớp mới"]] || "").trim().toUpperCase();
          if (!rawCode) rawCode = extractCodeFromText(String(row[lsMap["Khóa ĐK mới"]] || ""));
          let courseCode = normalizeCourseCode(rawCode);
          
          // Chỉ xử lý nếu mã lớp nằm trong TARGET_LIST (NH01, NH02...)
          const isTargetClass = stats[courseCode] !== undefined;
          const currentClassType = getClassType(courseCode);
          const status = String(row[lsMap["Trạng thái duyệt"]]).toLowerCase();
          const refundStatus = String(row[lsMap["Trạng thái hoàn cọc"]] || "").toLowerCase();
          
          let depositIn = parseMoneySafe(row[lsMap["Phí cọc mới"]]);

          if (isTargetClass && !studentClassState[courseCode]) {
              studentClassState[courseCode] = { balance: 0, isReserved: false };
          }

          const logDetail = (targetCode, type, money = 0, dateToLog = transDate, extraNote = "") => {
             const dateStr = Utilities.formatDate(dateToLog, Session.getScriptTimeZone(), "dd/MM");
             const moneyStr = money !== 0 ? ` [${formatMoney(money)}]` : "";
             if (stats[targetCode]) {
                 stats[targetCode].details.push(`• [${dateStr}] ${hvCode}-${studentName}: ${type}${moneyStr} ${extraNote}`);
             }
          };

          // --- A. GHI DANH ---
          if (status.includes("duyệt") && !status.includes("hoàn") && !status.includes("bảo lưu") && !status.includes("học lại")) {
              if (isTargetClass && isInReportRange) {
                  let moneyAdded = 0;
                  studentClassState[courseCode].isReserved = false;

                  if (previousClassType === "VIP86") {
                      // ==> LOGIC RIÊNG CHO NH: VIP HỌC MIỄN PHÍ, KHÔNG TRÍCH QUỸ
                      moneyAdded = 0;
                      stats[courseCode].directCount++; // Vẫn đếm là 1 lượt học
                      logDetail(courseCode, "💎 VIP vào học (Miễn phí & Không trích quỹ)", 0);
                  } else {
                      // Học viên thường -> Đóng cọc bình thường
                      moneyAdded = depositIn;
                      stats[courseCode].directCount++;
                      stats[courseCode].directMoney += depositIn;
                      logDetail(courseCode, "Ghi danh (Cọc thường)", depositIn);
                  }
                  studentClassState[courseCode].balance += moneyAdded;
              }
          }
          // Xử lý trường hợp "Học lại" hoặc quay lại từ bảo lưu (nếu có logic riêng thì thêm vào đây)
          else if (status.includes("duyệt") && (status.includes("bảo lưu") || status.includes("học lại"))) {
               if (isTargetClass && isInReportRange) {
                   // Quay lại học -> Tính như ghi danh nhưng có ghi chú
                   stats[courseCode].directCount++;
                   stats[courseCode].directMoney += depositIn;
                   studentClassState[courseCode].balance += depositIn;
                   studentClassState[courseCode].isReserved = false;
                   logDetail(courseCode, "🔵 Quay lại học/Học lại", depositIn);
               }
          }

          // --- B. BẢO LƯU ---
          if (status.includes("bảo lưu") && !status.includes("duyệt")) {
              if (isTargetClass && isInReportRange) {
                  studentClassState[courseCode].isReserved = true; 
                  logDetail(courseCode, "⏸️ Đã bảo lưu (Treo tiền)");
              }
          }

          // --- C. HOÀN CỌC / SUNG QUỸ ---
          if (isTargetClass && refundStatus) {
              const refundDate = extractDateFromText(refundStatus, transDate);
              if (refundDate >= startDate && refundDate <= endDate) {
                  let moneyAmount = parseMoneySafe(row[lsMap[colRefundMoney]]); 
                  if (moneyAmount === 0) moneyAmount = parseMoneySafe(row[lsMap["Phí cọc mới"]]); // Fallback

                  const isRefunded = refundStatus.includes("hoàn");
                  
                  // Trừ số dư ví của HV
                  studentClassState[courseCode].balance -= moneyAmount;
                  studentClassState[courseCode].isReserved = false;

                  if (isRefunded) {
                      // Hoàn tiền -> Trừ doanh thu
                      stats[courseCode].refundCount++;
                      stats[courseCode].refundMoney += moneyAmount;
                      logDetail(courseCode, "❌ Hoàn cọc (Trả khách)", -moneyAmount, refundDate);
                  } else {
                      // Sung quỹ -> Giữ nguyên doanh thu (Chỉ log)
                      let reason = "Sung quỹ";
                      if(refundStatus.includes("gieo")) reason = "Gieo hạt";
                      logDetail(courseCode, `💰 ${reason} (Doanh thu)`, 0, refundDate, `(Tất toán ${formatMoney(moneyAmount)})`);
                  }
              }
          }

          previousClassType = currentClassType;
      });

      // TÍNH TIỀN TREO (Cuối cùng)
      Object.keys(studentClassState).forEach(cCode => {
          const state = studentClassState[cCode];
          if (state.isReserved && state.balance > 0) {
              stats[cCode].reservedCount++;
              stats[cCode].reservedMoney += state.balance;
              stats[cCode].details.push(`   ➥ ⚠️ Đang treo bảo lưu: ${formatMoney(state.balance)}`);
          }
      });
  });

  // 6. VẼ BÁO CÁO
  let r = 1;
  reportSheet.getRange(r, 1).setValue(`BÁO CÁO TÀI CHÍNH LỚP NHÂN HIỆU (NH)`).setFontSize(18).setFontWeight("bold").setFontColor("#16a34a");
  reportSheet.getRange(r+1, 1).setValue(`Cohort từ: ${startDateInput.getResponseText()} đến ${endDateInput.getResponseText()}`).setFontStyle("italic");
  r += 3;

  // Sử dụng lại hàm vẽ bảng (đã có sẵn trong file code của bạn)
  // True = Tính là Doanh thu thực
  drawSpecificTable_AF_KD(reportSheet, stats, TARGET_LIST, r, "DOANH THU THỰC TẾ - LỚP NHÂN HIỆU (NH)", true);

  // Định dạng
  reportSheet.setColumnWidth(1, 200); 
  reportSheet.setColumnWidth(2, 500); 
  reportSheet.autoResizeColumns(3, 8);
  
  ui.alert("Đã tạo báo cáo riêng cho lớp NH thành công!");
}

// =================================================================
// BÁO CÁO TÀI CHÍNH RIÊNG - LỚP LIVESTREAM (LS)
// Logic: Giống NH (Tiền cọc, Hoàn/Sung, VIP học Free không trích quỹ)
// =================================================================

function baoCaoTaiChinh_LopLS(customList) {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // --- [TỰ ĐỘNG] LẤY TẤT CẢ LỚP BẮT ĐẦU BẰNG LS ---
  const TARGET_LIST = customList || layDanhSachMaLopTuDong(["LS"]);
  // Tự động ra: ["LS01", "LS02", "LS03"...]
  const REPORT_SHEET_NAME = "BaoCao_TaiChinh_LS";

  // 2. Chọn thời gian
  const startDateInput = ui.prompt('Báo cáo LS', 'Nhập NGÀY BẮT ĐẦU tính HV Mới (Cohort Date):\n(Ví dụ: 23/09/2025)', ui.ButtonSet.OK_CANCEL);
  if (startDateInput.getSelectedButton() !== ui.Button.OK) return;
  
  const endDateInput = ui.prompt('Báo cáo LS', 'Tính dòng tiền đến hết ngày (dd/MM/yyyy):\n(Thường là Hôm nay)', ui.ButtonSet.OK_CANCEL);
  if (endDateInput.getSelectedButton() !== ui.Button.OK) return;
  
  const startDate = parseDateVN(startDateInput.getResponseText().trim());
  const endDate = parseDateVN(endDateInput.getResponseText().trim());
  
  if (!startDate || !endDate) { ui.alert("Ngày không hợp lệ."); return; }
  endDate.setHours(23, 59, 59, 999); 

  // 3. Chuẩn bị Sheet
  let reportSheet = ss.getSheetByName(REPORT_SHEET_NAME);
  if (!reportSheet) reportSheet = ss.insertSheet(REPORT_SHEET_NAME);
  else reportSheet.clear();

  // 4. Lấy dữ liệu
  const lsSheet = ss.getSheetByName("LS_DangKy");
  const khSheet = ss.getSheetByName("KH"); 
  if (!lsSheet || !khSheet) { ui.alert("Thiếu sheet dữ liệu LS_DangKy hoặc KH."); return; }

  const lsData = lsSheet.getDataRange().getValues();
  const khData = khSheet.getDataRange().getValues();
  const lsMap = getHeaderMap(lsData.shift());
  const khMap = getHeaderMap(khData.shift());

  const colRefundMoney = lsMap["Số tiền Tất toán"] !== undefined ? "Số tiền Tất toán" : "Số tiền hoàn thực tế";

  const parseMoneySafe = (val) => {
      if (!val) return 0;
      if (typeof val === 'number') return val;
      const num = parseInt(String(val).replace(/[^0-9]/g, ''));
      return isNaN(num) ? 0 : num;
  };

  // Lấy tên lớp
  let courseNames = {};
  khData.forEach(row => {
      const code = String(row[khMap["Mã khóa"]]).trim().toUpperCase();
      const name = String(row[khMap["Tên khóa học"]]).trim();
      if (code) courseNames[code] = name;
  });

  // Khởi tạo Stats cho LS
  let stats = {};
  TARGET_LIST.forEach(code => {
      stats[code] = {
          name: courseNames[code] || "Chưa đặt tên",
          directCount: 0, directMoney: 0,       
          vipAllocationMoney: 0, // Luôn = 0
          refundCount: 0, refundMoney: 0,       
          reservedCount: 0, reservedMoney: 0,
          details: [] 
      };
  });

  // 5. Xử lý dữ liệu
  let studentHistory = {}; 
  lsData.forEach(row => {
    const codeHV = String(row[lsMap["MÃ CODE"]]).trim();
    const dateRaw = row[lsMap["Dấu thời gian"]];
    if (codeHV && dateRaw) {
        if (!studentHistory[codeHV]) studentHistory[codeHV] = [];
        studentHistory[codeHV].push({ row: row, date: new Date(dateRaw) });
    }
  });

  // Helper Functions
  const normalizeCourseCode = (code) => code ? code.trim().toUpperCase() : "";
  const extractCodeFromText = (text) => {
      // Regex bắt mã LS
      const match = String(text).toUpperCase().match(/(LS\d+|NH\d+|KD\d+|AF\d+|86D)/);
      return match ? match[0] : "";
  };
  const getClassType = (c) => c.includes("86") ? "VIP86" : "NORMAL";
  const extractDateFromText = (text, defaultDate) => {
      const match = String(text).match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      return match ? new Date(match[3], match[2] - 1, match[1]) : defaultDate;
  };
  const formatMoney = (amount) => new Intl.NumberFormat('vi-VN').format(amount);

  // --- CORE LOGIC ---
  Object.keys(studentHistory).forEach(hvCode => {
      const transactions = studentHistory[hvCode].sort((a, b) => a.date - b.date);
      const firstDateEver = transactions[0].date;
      
      // LỌC COHORT
      if (firstDateEver < startDate) return; 

      let previousClassType = null; 
      let studentClassState = {}; 

      transactions.forEach((trans, index) => {
          const row = trans.row;
          const transDate = trans.date;
          const isInReportRange = (transDate <= endDate); 
          const studentName = row[lsMap["Họ và tên"]];
          
          let rawCode = String(row[lsMap["Mã lớp mới"]] || "").trim().toUpperCase();
          if (!rawCode) rawCode = extractCodeFromText(String(row[lsMap["Khóa ĐK mới"]] || ""));
          let courseCode = normalizeCourseCode(rawCode);
          
          // Chỉ xử lý nếu mã lớp nằm trong TARGET_LIST (LS01, LS02...)
          const isTargetClass = stats[courseCode] !== undefined;
          const currentClassType = getClassType(courseCode);
          const status = String(row[lsMap["Trạng thái duyệt"]]).toLowerCase();
          const refundStatus = String(row[lsMap["Trạng thái hoàn cọc"]] || "").toLowerCase();
          
          let depositIn = parseMoneySafe(row[lsMap["Phí cọc mới"]]);

          if (isTargetClass && !studentClassState[courseCode]) {
              studentClassState[courseCode] = { balance: 0, isReserved: false };
          }

          const logDetail = (targetCode, type, money = 0, dateToLog = transDate, extraNote = "") => {
             const dateStr = Utilities.formatDate(dateToLog, Session.getScriptTimeZone(), "dd/MM");
             const moneyStr = money !== 0 ? ` [${formatMoney(money)}]` : "";
             if (stats[targetCode]) {
                 stats[targetCode].details.push(`• [${dateStr}] ${hvCode}-${studentName}: ${type}${moneyStr} ${extraNote}`);
             }
          };

          // A. GHI DANH
          if (status.includes("duyệt") && !status.includes("hoàn") && !status.includes("bảo lưu") && !status.includes("học lại")) {
              if (isTargetClass && isInReportRange) {
                  let moneyAdded = 0;
                  studentClassState[courseCode].isReserved = false;

                  if (previousClassType === "VIP86") {
                      // VIP học Free -> 0 đồng, không trích quỹ
                      moneyAdded = 0;
                      stats[courseCode].directCount++; 
                      logDetail(courseCode, "💎 VIP vào học (Miễn phí & Không trích quỹ)", 0);
                  } else {
                      moneyAdded = depositIn;
                      stats[courseCode].directCount++;
                      stats[courseCode].directMoney += depositIn;
                      logDetail(courseCode, "Ghi danh (Cọc thường)", depositIn);
                  }
                  studentClassState[courseCode].balance += moneyAdded;
              }
          }
          // Xử lý Học lại
          else if (status.includes("duyệt") && (status.includes("bảo lưu") || status.includes("học lại"))) {
               if (isTargetClass && isInReportRange) {
                   stats[courseCode].directCount++;
                   stats[courseCode].directMoney += depositIn;
                   studentClassState[courseCode].balance += depositIn;
                   studentClassState[courseCode].isReserved = false;
                   logDetail(courseCode, "🔵 Quay lại học/Học lại", depositIn);
               }
          }

          // B. BẢO LƯU
          if (status.includes("bảo lưu") && !status.includes("duyệt")) {
              if (isTargetClass && isInReportRange) {
                  studentClassState[courseCode].isReserved = true; 
                  logDetail(courseCode, "⏸️ Đã bảo lưu (Treo tiền)");
              }
          }

          // C. HOÀN CỌC / SUNG QUỸ
          if (isTargetClass && refundStatus) {
              const refundDate = extractDateFromText(refundStatus, transDate);
              if (refundDate >= startDate && refundDate <= endDate) {
                  let moneyAmount = parseMoneySafe(row[lsMap[colRefundMoney]]); 
                  if (moneyAmount === 0) moneyAmount = parseMoneySafe(row[lsMap["Phí cọc mới"]]);

                  const isRefunded = refundStatus.includes("hoàn");
                  
                  studentClassState[courseCode].balance -= moneyAmount;
                  studentClassState[courseCode].isReserved = false;

                  if (isRefunded) {
                      stats[courseCode].refundCount++;
                      stats[courseCode].refundMoney += moneyAmount;
                      logDetail(courseCode, "❌ Hoàn cọc (Trả khách)", -moneyAmount, refundDate);
                  } else {
                      let reason = "Sung quỹ";
                      if(refundStatus.includes("gieo")) reason = "Gieo hạt";
                      logDetail(courseCode, `💰 ${reason} (Doanh thu)`, 0, refundDate, `(Tất toán ${formatMoney(moneyAmount)})`);
                  }
              }
          }

          previousClassType = currentClassType;
      });

      // TÍNH TIỀN TREO
      Object.keys(studentClassState).forEach(cCode => {
          const state = studentClassState[cCode];
          if (state.isReserved && state.balance > 0) {
              stats[cCode].reservedCount++;
              stats[cCode].reservedMoney += state.balance;
              stats[cCode].details.push(`   ➥ ⚠️ Đang treo bảo lưu: ${formatMoney(state.balance)}`);
          }
      });
  });

  // 6. VẼ BÁO CÁO
  let r = 1;
  reportSheet.getRange(r, 1).setValue(`BÁO CÁO TÀI CHÍNH LỚP LIVESTREAM (LS)`).setFontSize(18).setFontWeight("bold").setFontColor("#e11d48"); // Màu đỏ hồng
  reportSheet.getRange(r+1, 1).setValue(`Cohort từ: ${startDateInput.getResponseText()} đến ${endDateInput.getResponseText()}`).setFontStyle("italic");
  r += 3;

  // Vẽ bảng
  drawSpecificTable_AF_KD(reportSheet, stats, TARGET_LIST, r, "DOANH THU THỰC TẾ - LỚP LIVESTREAM (LS)", true);

  // Định dạng
  reportSheet.setColumnWidth(1, 200); 
  reportSheet.setColumnWidth(2, 500); 
  reportSheet.autoResizeColumns(3, 8);
  
  ui.alert("Đã tạo báo cáo riêng cho lớp LS thành công!");
}
// =================================================================
// BÁO CÁO TÀI CHÍNH LỚP VIP 86 NGÀY (PHIÊN BẢN CÓ GIỚI HẠN TRÍCH QUỸ)
// Logic: Thu cọc -> Trừ trích quỹ (CHỈ CÁC LỚP CŨ) -> Trừ hoàn tiền
// =================================================================

function baoCaoTaiChinh_Lop86D(customList) {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const TARGET_CODE = "86D"; 
  const REPORT_SHEET_NAME = "BaoCao_TaiChinh_86D";

  // --- [CẤU HÌNH QUAN TRỌNG] DANH SÁCH CÁC LỚP PHẢI TRÍCH QUỸ ---
 // Với hàm này, customList chính là danh sách lớp CẦN TRÍCH QUỸ
  const ALLOCATION_WHITELIST = customList || layDanhSachMaLopTuDong(["AF", "KD"]);

  // 1. Chọn thời gian Cohort
  const startDateInput = ui.prompt('Báo cáo VIP 86D', 'Nhập NGÀY BẮT ĐẦU tính HV Mới (Cohort Date):\n(Ví dụ: 23/09/2025)', ui.ButtonSet.OK_CANCEL);
  if (startDateInput.getSelectedButton() !== ui.Button.OK) return;
  
  const endDateInput = ui.prompt('Báo cáo VIP 86D', 'Tính dòng tiền đến hết ngày (dd/MM/yyyy):\n(Thường là Hôm nay)', ui.ButtonSet.OK_CANCEL);
  if (endDateInput.getSelectedButton() !== ui.Button.OK) return;
  
  const startDate = parseDateVN(startDateInput.getResponseText().trim());
  const endDate = parseDateVN(endDateInput.getResponseText().trim());
  
  if (!startDate || !endDate) { ui.alert("Ngày không hợp lệ."); return; }
  endDate.setHours(23, 59, 59, 999); 

  // 2. Chuẩn bị Sheet
  let reportSheet = ss.getSheetByName(REPORT_SHEET_NAME);
  if (!reportSheet) reportSheet = ss.insertSheet(REPORT_SHEET_NAME);
  else reportSheet.clear();

  // 3. Lấy dữ liệu
  const lsSheet = ss.getSheetByName("LS_DangKy");
  const khSheet = ss.getSheetByName("KH"); 
  const lsData = lsSheet.getDataRange().getValues();
  const khData = khSheet.getDataRange().getValues();
  const lsMap = getHeaderMap(lsData.shift());
  const khMap = getHeaderMap(khData.shift());

  const colRefundMoney = lsMap["Số tiền Tất toán"] !== undefined ? "Số tiền Tất toán" : "Số tiền hoàn thực tế";

  const parseMoneySafe = (val) => {
      if (!val) return 0;
      if (typeof val === 'number') return val;
      const num = parseInt(String(val).replace(/[^0-9]/g, ''));
      return isNaN(num) ? 0 : num;
  };

  // 4. Lấy Bảng giá
  let courseFees = {};
  khData.forEach(row => {
      const code = String(row[khMap["Mã khóa"]]).trim().toUpperCase();
      const fee = parseMoneySafe(row[khMap["Phí cọc"]]);
      if (code) courseFees[code] = fee;
  });

  // Khởi tạo Stats
  let stats = {
      name: "Lộ trình 86 Ngày Đồng Hành",
      totalIn: 0,         
      totalAllocation: 0, 
      totalRefund: 0,     
      totalRevenue: 0,    
      netBalance: 0,      
      countNew: 0,
      details: []
  };

  // 5. Gom nhóm lịch sử
  let studentHistory = {}; 
  lsData.forEach(row => {
    const codeHV = String(row[lsMap["MÃ CODE"]]).trim();
    const dateRaw = row[lsMap["Dấu thời gian"]];
    if (codeHV && dateRaw) {
        if (!studentHistory[codeHV]) studentHistory[codeHV] = [];
        studentHistory[codeHV].push({ row: row, date: new Date(dateRaw) });
    }
  });

  // Helper
  const extractCodeFromText = (text) => {
      const match = String(text).toUpperCase().match(/(86D|AF\d+|KD\d+|NH\d+|LS\d+|MKT\d+)/);
      return match ? match[0] : "";
  };
  const extractDateFromText = (text, defaultDate) => {
      const match = String(text).match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      return match ? new Date(match[3], match[2] - 1, match[1]) : defaultDate;
  };
  const formatMoney = (amount) => new Intl.NumberFormat('vi-VN').format(amount);

  // --- 6. CORE LOGIC PHÂN TÍCH ---
  Object.keys(studentHistory).forEach(hvCode => {
      const transactions = studentHistory[hvCode].sort((a, b) => a.date - b.date);
      const firstDateEver = transactions[0].date;
      
      // Lọc Cohort
      if (firstDateEver < startDate) return; 

      let isVip = false; 
      let vipJoinDate = null;
      let studentBalance = 0; 

      transactions.forEach((trans) => {
          const row = trans.row;
          const transDate = trans.date;
          const isInReportRange = (transDate <= endDate); 
          const studentName = row[lsMap["Họ và tên"]];
          
          let rawCode = String(row[lsMap["Mã lớp mới"]] || "").trim().toUpperCase();
          if (!rawCode) rawCode = extractCodeFromText(String(row[lsMap["Khóa ĐK mới"]] || ""));
          
          const status = String(row[lsMap["Trạng thái duyệt"]]).toLowerCase();
          const refundStatus = String(row[lsMap["Trạng thái hoàn cọc"]] || "").toLowerCase();
          
          let depositIn = parseMoneySafe(row[lsMap["Phí cọc mới"]]);

          // --- LOGIC GHI NHẬN ---
          
          // 1. GIA NHẬP 86D
          if (rawCode === TARGET_CODE && status.includes("duyệt")) {
              if (isInReportRange) {
                  isVip = true;
                  vipJoinDate = transDate;
                  stats.countNew++;
                  stats.totalIn += depositIn;
                  studentBalance += depositIn;
                  
                  const dStr = Utilities.formatDate(transDate, Session.getScriptTimeZone(), "dd/MM");
                  stats.details.push(`• [${dStr}] ${hvCode}-${studentName}: 🟢 Gia nhập VIP 86D [+${formatMoney(depositIn)}]`);
              }
          }

          // 2. HỌC LỚP KHÁC (LOGIC QUAN TRỌNG ĐÃ SỬA)
          else if (isVip && rawCode !== TARGET_CODE && status.includes("duyệt") && !status.includes("hoàn")) {
              const feeOfSubCourse = courseFees[rawCode] || 0;
              
              if (feeOfSubCourse > 0 && isInReportRange) {
                  // KIỂM TRA: Lớp này có nằm trong danh sách "phải trích quỹ" không?
                  if (ALLOCATION_WHITELIST.includes(rawCode)) {
                      // CÓ: Trừ tiền quỹ
                      stats.totalAllocation += feeOfSubCourse;
                      studentBalance -= feeOfSubCourse;

                      const dStr = Utilities.formatDate(transDate, Session.getScriptTimeZone(), "dd/MM");
                      stats.details.push(`   - [${dStr}] ${hvCode}-${studentName}: 🔻 Trích quỹ sang ${rawCode} [-${formatMoney(feeOfSubCourse)}]`);
                  } else {
                      // KHÔNG: Được học miễn phí, quỹ 86D không mất tiền
                      const dStr = Utilities.formatDate(transDate, Session.getScriptTimeZone(), "dd/MM");
                      stats.details.push(`   - [${dStr}] ${hvCode}-${studentName}: 🎁 Học ${rawCode} (Quyền lợi VIP - Không trích quỹ)`);
                  }
              }
          }

          // 3. HOÀN TIỀN / SUNG QUỸ (86D)
          if (rawCode === TARGET_CODE && refundStatus) {
              const refundDate = extractDateFromText(refundStatus, transDate);
              if (refundDate >= startDate && refundDate <= endDate) {
                  let moneyAmount = parseMoneySafe(row[lsMap[colRefundMoney]]); 
                  if (moneyAmount === 0) moneyAmount = parseMoneySafe(row[lsMap["Phí cọc mới"]]);

                  studentBalance -= moneyAmount;

                  if (refundStatus.includes("hoàn")) {
                      stats.totalRefund += moneyAmount;
                      const dStr = Utilities.formatDate(refundDate, Session.getScriptTimeZone(), "dd/MM");
                      stats.details.push(`   - [${dStr}] ${hvCode}-${studentName}: 💸 Hoàn tiền 86D (Rời lớp) [-${formatMoney(moneyAmount)}]`);
                  } 
                  else {
                      stats.totalRevenue += moneyAmount;
                      const dStr = Utilities.formatDate(refundDate, Session.getScriptTimeZone(), "dd/MM");
                      stats.details.push(`   - [${dStr}] ${hvCode}-${studentName}: 💰 Sung quỹ 86D (Doanh thu) [${formatMoney(moneyAmount)}]`);
                  }
              }
          }
      });
      
      stats.netBalance += studentBalance;
  });

  // 7. VẼ BÁO CÁO
  let r = 1;
  reportSheet.getRange(r, 1).setValue(`BÁO CÁO DÒNG TIỀN QUỸ VIP 86D`).setFontSize(18).setFontWeight("bold").setFontColor("#6d28d9");
  reportSheet.getRange(r+1, 1).setValue(`(Chỉ trích quỹ cho các lớp: ${ALLOCATION_WHITELIST.join(", ")})`).setFontStyle("italic");
  r += 3;

  // Header Bảng
  const headers = ["Khoản mục", "Số tiền (VND)", "Ghi chú"];
  reportSheet.getRange(r, 1, 1, 3).setValues([headers]).setFontWeight("bold").setBackground("#EDE9FE").setBorder(true,true,true,true,true,true);
  r++;

  // Dữ liệu bảng tổng hợp
  const summaryData = [
      ["1. Tổng Thu Cọc Đầu Vào (+)", stats.totalIn, "Tiền thực thu từ HV mới"],
      ["2. Tổng Trích Quỹ Lớp Con (-)", -stats.totalAllocation, "Chỉ tính các lớp đã chọn"],
      ["3. Tổng Chi Hoàn Trả (-)", -stats.totalRefund, "Trả lại tiền mặt cho HV"],
      ["4. Doanh Thu Sung Quỹ (+)", stats.totalRevenue, "Tiền HV vi phạm/gieo hạt (Đã chốt)"],
      ["-----------------", "", ""],
      ["SỐ DƯ QUỸ HIỆN TẠI (Net)", stats.netBalance, "Tiền đang giữ (Nợ phải trả)"]
  ];

  // Ghi bảng
  reportSheet.getRange(r, 1, summaryData.length, 3).setValues(summaryData).setBorder(true,true,true,true,true,true);
  
  // Format màu sắc
  reportSheet.getRange(r, 2, summaryData.length, 1).setNumberFormat("#,##0");
  reportSheet.getRange(r, 1).setFontWeight("bold");
  reportSheet.getRange(r+1, 2).setFontColor("red");
  reportSheet.getRange(r+2, 2).setFontColor("red");
  reportSheet.getRange(r+3, 2).setFontColor("green");
  reportSheet.getRange(r+5, 2).setFontWeight("bold").setBackground("yellow").setFontSize(12);

  r += summaryData.length + 2;

  // In chi tiết
  reportSheet.getRange(r, 1).setValue("CHI TIẾT DÒNG TIỀN TỪNG HỌC VIÊN:").setFontWeight("bold").setFontStyle("italic");
  r++;
  if (stats.details.length > 0) {
      const detailRows = stats.details.map(d => [d]);
      reportSheet.getRange(r, 1, detailRows.length, 1).setValues(detailRows);
      reportSheet.setColumnWidth(1, 600);
  }

  ui.alert("Đã tạo báo cáo Quỹ VIP 86D (Đã áp dụng giới hạn trích quỹ)!");
}
// =================================================================
// PHẦN 4: GỬI THÔNG BÁO TELEGRAM (BỔ SUNG)
// =================================================================

// 1. Nhập Token của Bot (Lấy từ @BotFather)
const TELEGRAM_BOT_TOKEN = "8438961211:AAFyCBaTl_LYOgW8bxlQ41XhmZkDJstQoGo"; 

// 2. Nhập Danh sách ID các tài khoản muốn nhận tin (cách nhau bởi dấu phẩy) (Lấy từ @userinfobot)
const TELEGRAM_CHAT_IDS = ["6016068634","5185829656"];
function sendToTelegram(title, data) {
  // Kiểm tra cấu hình
  if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN.includes("DÁN_TOKEN")) return;

  // Tạo nội dung tin nhắn
  let message = `🔔 <b>${title}</b>\n----------------\n`;
  
  if (data.code)       message += `🆔 <b>Mã:</b> ${data.code}\n`;
  if (data.name)       message += `👤 <b>Tên:</b> ${data.name}\n`;
  if (data.phone)      message += `📞 <b>SĐT:</b> ${data.phone}\n`;
  if (data.email)      message += `📧 <b>Email:</b> ${data.email}\n`;
  if (data.courseInfo) message += `📚 <b>Nội dung:</b> ${data.courseInfo}\n`;
  if (data.amount)     message += `💰 <b>Số tiền:</b> ${data.amount}\n`;
  
  // --- [QUAN TRỌNG] ĐOẠN MỚI ĐỂ HIỆN LINK ẢNH ---
  if (data.imageLink) {
      // Tạo link bấm vào được bằng thẻ HTML <a>
      message += `📎 <b>Ảnh Bill:</b> <a href="${data.imageLink}">BẤM ĐỂ XEM ẢNH</a>\n`;
  }
  // ----------------------------------------------

  if (data.action)     message += `\n${data.action}`;

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  // Gửi cho danh sách người nhận
  TELEGRAM_CHAT_IDS.forEach(chatId => {
    const payload = {
      'chat_id': chatId,
      'text': message,
      'parse_mode': 'HTML', // Bắt buộc phải có dòng này để link hoạt động
      'disable_web_page_preview': false // Cho phép hiện ảnh thu nhỏ nếu Telegram hỗ trợ
    };

    try {
      UrlFetchApp.fetch(url, {
        'method': 'post',
        'contentType': 'application/json',
        'payload': JSON.stringify(payload),
        'muteHttpExceptions': true
      });
    } catch (e) {
      Logger.log(`Lỗi gửi Telegram cho ID ${chatId}: ` + e.toString());
    }
  });
}
/**
 * HÀM TỰ ĐỘNG LẤY DANH SÁCH MÃ LỚP TỪ SHEET KH
 * @param {Array} prefixes - Danh sách các tiền tố muốn lấy. Ví dụ: ["AF", "KD"] hoặc ["NH"]
 * @returns {Array} - Danh sách các mã lớp tìm thấy (Ví dụ: ["AF01", "AF02", "KD01"...])
 */
function layDanhSachMaLopTuDong(prefixes) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const khSheet = ss.getSheetByName("KH"); // Hoặc COURSE_SHEET_NAME nếu bạn dùng hằng số
    if (!khSheet) return [];

    const data = khSheet.getDataRange().getValues();
    const headers = data.shift(); // Bỏ dòng tiêu đề
    
    // Tìm cột Mã khóa
    const headerMap = {};
    headers.forEach((h, i) => headerMap[String(h).trim().toLowerCase()] = i);
    const colIdx = headerMap["mã khóa"];

    if (colIdx === undefined) return [];

    const foundCodes = [];
    const uniqueSet = new Set(); // Dùng để lọc trùng

    data.forEach(row => {
      const code = String(row[colIdx]).trim().toUpperCase();
      
      // Kiểm tra xem mã này có bắt đầu bằng tiền tố mình cần không
      // Ví dụ: code là "AF04", prefixes là ["AF", "KD"] -> Thỏa mãn
      const isMatch = prefixes.some(prefix => code.startsWith(prefix.toUpperCase()));

      if (code && isMatch && !uniqueSet.has(code)) {
        foundCodes.push(code);
        uniqueSet.add(code);
      }
    });

    return foundCodes.sort(); // Sắp xếp cho đẹp (AF01, AF02...)
  } catch (e) {
    Logger.log("Lỗi lấy danh sách lớp tự động: " + e.message);
    return [];
  }
}
// =================================================================
// TÍNH NĂNG: CHỌN LỚP TRƯỚC KHI BÁO CÁO (SELECTOR)
// =================================================================

// Biến tạm để lưu loại báo cáo đang chạy
var CACHE = CacheService.getScriptCache();

/**
 * Hàm mở hộp thoại chọn lớp
 * @param {string} type - Loại báo cáo ('AF_KD', 'NH', 'LS', '86D')
 * @param {Array} prefixes - Tiền tố để tìm lớp (VD: ['AF', 'KD'])
 */
function openClassSelector(type, prefixes) {
  // 1. Tìm danh sách lớp tự động
  const classes = layDanhSachMaLopTuDong(prefixes);
  
  if (classes.length === 0) {
    SpreadsheetApp.getUi().alert("Không tìm thấy lớp nào bắt đầu bằng: " + prefixes.join(", "));
    return;
  }

  // 2. Lưu tạm thông tin vào Cache để HTML đọc
  CACHE.put("CURRENT_REPORT_TYPE", type);
  CACHE.put("CURRENT_CLASS_LIST", JSON.stringify(classes));

  // 3. Hiển thị hộp thoại HTML
  const html = HtmlService.createTemplateFromFile('Selector')
    .evaluate()
    .setWidth(400)
    .setHeight(500);
  SpreadsheetApp.getUi().showModalDialog(html, 'Tùy chọn Lớp Báo cáo');
}

// Hàm được HTML gọi để lấy dữ liệu ban đầu
function getClassesForSelector() {
  const type = CACHE.get("CURRENT_REPORT_TYPE");
  const classesStr = CACHE.get("CURRENT_CLASS_LIST");
  return {
    type: type,
    classes: classesStr ? JSON.parse(classesStr) : []
  };
}

// Hàm nhận danh sách lớp ĐÃ CHỌN từ HTML và chạy báo cáo
function receiveSelectedClasses(type, selectedList) {
  // Đóng hộp thoại xong thì chạy báo cáo
  // Chúng ta truyền danh sách selectedList vào thẳng hàm báo cáo
  if (type === 'AF_KD') {
    baoCaoDoanhThuThat_AF_KD(selectedList);
  } else if (type === 'NH') {
    baoCaoTaiChinh_LopNH(selectedList);
  } else if (type === 'LS') {
    baoCaoTaiChinh_LopLS(selectedList);
  } else if (type === '86D') {
    baoCaoTaiChinh_Lop86D(selectedList);
  }
}
// --- CÁC HÀM GỌI TỪ MENU ---
function menu_BaoCaoAFKD() { openClassSelector('AF_KD', ['AF', 'KD']); }
function menu_BaoCaoNH()   { openClassSelector('NH', ['NH']); }
function menu_BaoCaoLS()   { openClassSelector('LS', ['LS']); }
function menu_BaoCao86D()  { openClassSelector('86D', ['AF', 'KD']); }