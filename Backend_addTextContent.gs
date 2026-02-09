// ========================================
// ADD TEXT CONTENT FUNCTION
// ========================================
// Function to add text content from Admin Data Import module
function addTextContent(data) {
  try {
    // Validate required fields
    if (!data.courseId || !data.content) {
      return { 
        success: false, 
        message: "Thiếu thông tin bắt buộc: courseId và content" 
      };
    }
    
    const ss = getDB();
    let sheet = ss.getSheetByName("AI_Content");
    
    // Create sheet if it doesn't exist
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
        "Added By",
        "Last Updated"
      ]);
      Logger.log("Created AI_Content sheet");
    }
    
    // Generate unique ID
    const contentId = `CONTENT_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    // Prepare data
    const row = [
      contentId,
      "text_content",
      data.courseId,
      data.lessonId || `BAI_${Date.now()}`,
      data.title || `Bài học ${data.courseId}`,
      data.content,
      data.source || "Admin Data Import",
      new Date(),
      "Admin",
      new Date()
    ];
    
    // Append to sheet
    sheet.appendRow(row);
    
    Logger.log(`✅ Added text content: ${contentId} for course ${data.courseId}`);
    
    return {
      success: true,
      message: "Đã lưu nội dung thành công!",
      contentId: contentId,
      courseId: data.courseId
    };
    
  } catch (error) {
    Logger.log("❌ Error in addTextContent:", error);
    return {
      success: false,
      message: "Lỗi: " + error.toString()
    };
  }
}
