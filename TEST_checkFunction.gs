// SIMPLE TEST - Copy vào cuối Backend.gs
function TEST_checkFunction() {
  Logger.log("=== Checking if submitAssignment exists ===");
  
  if (typeof submitAssignment === 'function') {
    Logger.log("✅ submitAssignment function EXISTS");
    Logger.log("Function:", submitAssignment.toString().substring(0, 200));
  } else {
    Logger.log("❌ submitAssignment function DOES NOT EXIST");
  }
  
  // Try to call it
  try {
    Logger.log("Attempting to call submitAssignment...");
    const result = submitAssignment(
      "test@test.com", "AF", "AF_B1", "test", "", "", "", false, false, 50, 100
    );
    Logger.log("Result:", JSON.stringify(result));
  } catch (e) {
    Logger.log("❌ Error calling submitAssignment:", e.toString());
    Logger.log("Stack:", e.stack);
  }
}
