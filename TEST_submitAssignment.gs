// TEST FUNCTION - Copy vào Backend.gs và chạy trong Apps Script Editor
function TEST_submitAssignment() {
  Logger.log("🧪 Starting test...");
  
  try {
    const result = submitAssignment(
      "quelion0708@gmail.com",  // email
      "AF",                      // courseId
      "AF_B1",                   // lessonId
      "Test reflection content", // reflection
      "https://youtube.com/1",   // link1
      "https://youtube.com/2",   // link2
      "https://youtube.com/3",   // link3
      true,                      // disciplineSupport1
      true,                      // disciplineSupport2
      60,                        // videoMaxTime
      100                        // duration
    );
    
    Logger.log("=== TEST RESULT ===");
    Logger.log(JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    Logger.log("❌ TEST ERROR:", error.toString());
    Logger.log("Stack:", error.stack);
    return { success: false, error: error.toString() };
  }
}
