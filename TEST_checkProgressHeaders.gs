// TEST - Kiểm tra headers của KH_TienDo
function TEST_checkProgressHeaders() {
  Logger.log("=== Checking KH_TienDo Headers ===");
  
  const sheet = getDB().getSheetByName("KH_TienDo");
  if (!sheet) {
    Logger.log("❌ Sheet not found!");
    return;
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  Logger.log("Total columns: " + headers.length);
  Logger.log("Headers: " + headers.join(" | "));
  
  // Check specific columns
  const idxMaCode = getColumnIndex(sheet, "Ma_Code");
  const idxTenHV = getColumnIndex(sheet, "Ten_HV");
  
  Logger.log("Ma_Code column index: " + idxMaCode);
  Logger.log("Ten_HV column index: " + idxTenHV);
  
  // Check constants values
  try {
    Logger.log("Value of COL_NAME_MA_CODE: " + COL_NAME_MA_CODE);
    Logger.log("Value of COL_NAME_TEN_HV: " + COL_NAME_TEN_HV);
    
    const idxConstMaCode = getColumnIndex(sheet, COL_NAME_MA_CODE);
    Logger.log("Index using COL_NAME_MA_CODE: " + idxConstMaCode);
  } catch (e) {
    Logger.log("Error accessing constants: " + e.toString());
  }
}
