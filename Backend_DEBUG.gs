// ========================================
// DEBUG FUNCTION - BRK AI Authorization
// ========================================
// Run this to debug why user doesn't see course content
function debugUserCourseAccess() {
  const testEmail = "quelion0708@gmail.com";
  
  Logger.log("🔍 Starting BRK AI Debug for: " + testEmail);
  Logger.log("=" + "=".repeat(50));
  
  // Step 1: Check LS_DangKy sheet
  const ss = getDB();
  const lsDangKySheet = ss.getSheetByName("LS_DangKy");
  
  if (!lsDangKySheet) {
    Logger.log("❌ LS_DangKy sheet NOT FOUND!");
    return;
  }
  
  Logger.log("✅ LS_DangKy sheet found");
  
  const data = lsDangKySheet.getDataRange().getValues();
  Logger.log(`📋 Total rows in LS_DangKy: ${data.length - 1}`);
  
  // Step 2: Find matching rows
  Logger.log("\n🔎 Searching for matching rows...");
  let matchCount = 0;
  
  for (let i = 1; i < data.length; i++) {
    const maCode = String(data[i][1] || "").trim();
    const maLop = String(data[i][14] || "").trim();
    
    if (maCode === testEmail) {
      matchCount++;
      Logger.log(`\n✅ MATCH found at row ${i + 1}:`);
      Logger.log(`   MÃ CODE: ${maCode}`);
      Logger.log(`   Ma_Lop: ${maLop}`);
      Logger.log(`   Họ tên: ${data[i][2]}`);
    }
  }
  
  if (matchCount === 0) {
    Logger.log("❌ NO MATCHES FOUND!");
    Logger.log("📝 Sample MÃ CODE values from LS_DangKy:");
    for (let i = 1; i < Math.min(6, data.length); i++) {
      Logger.log(`   Row ${i + 1}: "${data[i][1]}"`);
    }
  } else {
    Logger.log(`\n✅ Found ${matchCount} matching registration(s)`);
  }
  
  // Step 3: Test getStudentActivatedCourses
  Logger.log("\n" + "=".repeat(50));
  Logger.log("🧪 Testing getStudentActivatedCourses()...");
  const activatedCourses = getStudentActivatedCourses(testEmail);
  Logger.log(`📚 Activated courses: ${JSON.stringify(activatedCourses)}`);
  
  // Step 4: Check AI_Content sheet
  Logger.log("\n" + "=".repeat(50));
  Logger.log("📊 Checking AI_Content sheet...");
  
  const aiContentSheet = ss.getSheetByName("AI_Content");
  if (!aiContentSheet) {
    Logger.log("❌ AI_Content sheet NOT FOUND!");
    return;
  }
  
  const contentData = aiContentSheet.getDataRange().getValues();
  Logger.log(`✅ AI_Content sheet found with ${contentData.length - 1} rows`);
  
  // Check for NH course content
  Logger.log("\n🔍 Looking for NH course content...");
  let nhCount = 0;
  
  for (let i = 1; i < contentData.length; i++) {
    const courseId = String(contentData[i][2] || "").trim();
    if (courseId === "NH") {
      nhCount++;
      if (nhCount === 1) {
        Logger.log(`✅ Found NH content at row ${i + 1}:`);
        Logger.log(`   Title: ${contentData[i][4]}`);
        Logger.log(`   Content preview: ${String(contentData[i][5] || "").substring(0, 100)}...`);
      }
    }
  }
  
  Logger.log(`📝 Total NH course content rows: ${nhCount}`);
  
  // Step 5: Test getAllActivatedCoursesContent
  Logger.log("\n" + "=".repeat(50));
  Logger.log("🧪 Testing getAllActivatedCoursesContent()...");
  const courseContent = getAllActivatedCoursesContent(testEmail);
  Logger.log("📖 Course content returned:");
  Logger.log(courseContent.substring(0, 500) + "...");
  
  Logger.log("\n" + "=".repeat(50));
  Logger.log("✅ Debug complete!");
}
