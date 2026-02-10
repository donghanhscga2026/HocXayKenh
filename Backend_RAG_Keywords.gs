// ========================================
// RAG SYSTEM - PHASE 3: KEYWORD EXTRACTION
// ========================================

/**
 * Extract keywords from text using Gemini API
 * @param {string} text - Text to extract keywords from
 * @returns {Array} Array of keywords or empty array on error
 */
function extractKeywords(text) {
  try {
    const GEMINI_API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      Logger.log("❌ GEMINI_API_KEY not found");
      return [];
    }
    
    const prompt = `Trích xuất 5-10 từ khóa quan trọng nhất từ văn bản sau. 
Chỉ trả về danh sách từ khóa, mỗi từ một dòng, không giải thích.

Văn bản:
${text.substring(0, 800)}

Từ khóa:`;
    
    const payload = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 200
      }
    };
    
    const response = UrlFetchApp.fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      }
    );
    
    if (response.getResponseCode() !== 200) {
      Logger.log(`❌ Keyword extraction error: ${response.getResponseCode()}`);
      return [];
    }
    
    const result = JSON.parse(response.getContentText());
    const keywordsText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Parse keywords (one per line)
    const keywords = keywordsText
      .split('\n')
      .map(k => k.replace(/^[-*•]\s*/, '').trim().toLowerCase())
      .filter(k => k.length > 2 && k.length < 50);
    
    Logger.log(`✅ Extracted ${keywords.length} keywords: ${keywords.slice(0, 5).join(', ')}...`);
    return keywords;
    
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
  
  // Exact matches
  querySet.forEach(qk => {
    if (chunkSet.has(qk)) {
      matches += 1.0;
    } else {
      // Partial matches (substring)
      chunkSet.forEach(ck => {
        if (qk.includes(ck) || ck.includes(qk)) {
          matches += 0.5;
        }
      });
    }
  });
  
  return matches / queryKeywords.length;
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

/**
 * Test keyword extraction
 */
function testKeywordExtraction() {
  Logger.log("🧪 Testing keyword extraction...");
  
  const testText = `**Tiêu chí chọn sản phẩm "Win":**
- Đang bán chạy: Chọn top sản phẩm có lượt bán cao (trên 10.000 lượt bán).
- Đánh giá tốt: Shop có rating từ 4.5 sao trở lên.
- Hoa hồng: Từ 10% - 15%
- Giá sản phẩm: Ưu tiên dưới 150.000 - 200.000 VNĐ`;
  
  const keywords = extractKeywords(testText);
  
  Logger.log(`\n✅ Extracted keywords:`);
  keywords.forEach((kw, idx) => {
    Logger.log(`  ${idx + 1}. ${kw}`);
  });
  
  // Test matching
  const queryKeywords = extractKeywords("cách chọn sản phẩm làm affiliate marketing");
  const score = calculateKeywordScore(queryKeywords, keywords);
  
  Logger.log(`\n✅ Match score test:`);
  Logger.log(`  Query keywords: ${queryKeywords.join(', ')}`);
  Logger.log(`  Chunk keywords: ${keywords.slice(0, 5).join(', ')}`);
  Logger.log(`  Score: ${score.toFixed(2)} (higher = better match)`);
}
