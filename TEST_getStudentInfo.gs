// TEST - Kiểm tra getStudentInfoFromEmail
function TEST_getStudentInfo() {
  Logger.log("=== Testing getStudentInfoFromEmail ===");
  
  const email = "quelion0708@gmail.com";
  const result = getStudentInfoFromEmail(email);
  
  Logger.log("Email: " + email);
  Logger.log("Result code: " + result.code);
  Logger.log("Result name: " + result.name);
  
  // Also check sheet Dky structure
  const sheet = getDB().getSheetByName("Dky");
  if (sheet) {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    Logger.log("Dky has " + headers.length + " columns");
    Logger.log("Headers: " + headers.join(" | "));
    
    // Find the email row
    const data = sheet.getDataRange().getValues();
    Logger.log("Total rows: " + data.length);
    
    for (let i = 1; i < Math.min(data.length, 3); i++) {
      Logger.log("Row " + i + " has " + data[i].length + " columns");
      Logger.log("Row " + i + " data: " + data[i].join(" | "));
    }
  } else {
    Logger.log("❌ Sheet Dky not found!");
  }
  
  return result;
}
