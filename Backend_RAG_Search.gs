// ========================================
// RAG SYSTEM - PHASE 4: SEMANTIC SEARCH
// ========================================

/**
 * Find relevant chunks for a query using keyword matching
 * @param {string} query - User's question
 * @param {string} userEmail - User email to filter activated courses
 * @param {number} topK - Number of top chunks to return (default: 5)
 * @returns {Array} Array of relevant chunks with scores
 */
function findRelevantChunks(query, userEmail, topK = 5) {
  try {
    Logger.log(`🔍 Searching for: "${query}"`);
    
    // 1. Extract keywords from query
    const queryKeywords = extractKeywords(query);
    Logger.log(`📝 Query keywords: ${queryKeywords.join(', ')}`);
    
    if (queryKeywords.length === 0) {
      Logger.log("⚠️ No keywords extracted from query");
      return [];
    }
    
    // 2. Get activated courses
    const activatedCourses = getStudentActivatedCourses(userEmail);
    Logger.log(`📚 Activated courses: ${activatedCourses.join(', ')}`);
    
    if (activatedCourses.length === 0) {
      Logger.log("⚠️ No activated courses");
      return [];
    }
    
    // 3. Load chunks from AI_Content_Chunks
    const ss = getDB();
    const chunkSheet = ss.getSheetByName("AI_Content_Chunks");
    
    if (!chunkSheet) {
      Logger.log("⚠️ AI_Content_Chunks sheet not found");
      return [];
    }
    
    const data = chunkSheet.getDataRange().getValues();
    Logger.log(`📊 Total chunks in sheet: ${data.length - 1}`);
    
    // 4. Calculate scores for each chunk
    const scores = [];
    
    for (let i = 1; i < data.length; i++) {
      const courseId = String(data[i][1] || "").trim();
      
      // Filter by activated courses
      if (!activatedCourses.includes(courseId)) {
        continue;
      }
      
      const chunkId = data[i][0];
      const chunkText = data[i][3];
      const keywordsJson = data[i][5];
      
      let chunkKeywords = [];
      try {
        chunkKeywords = JSON.parse(keywordsJson);
      } catch (e) {
        // Fallback: extract keywords from chunk text
        chunkKeywords = extractKeywords(chunkText);
      }
      
      // Calculate similarity score
      const score = calculateKeywordScore(queryKeywords, chunkKeywords);
      
      if (score > 0) {
        scores.push({
          chunkId: chunkId,
          courseId: courseId,
          text: chunkText,
          keywords: chunkKeywords,
          score: score
        });
      }
    }
    
    // 5. Sort by score and return top K
    scores.sort((a, b) => b.score - a.score);
    const topChunks = scores.slice(0, topK);
    
    Logger.log(`\n✅ Found ${topChunks.length} relevant chunks:`);
    topChunks.forEach((chunk, idx) => {
      Logger.log(`  ${idx + 1}. [${chunk.courseId}] Score: ${chunk.score.toFixed(2)}`);
      Logger.log(`     Preview: ${chunk.text.substring(0, 100)}...`);
    });
    
    return topChunks;
    
  } catch (error) {
    Logger.log("❌ Error in findRelevantChunks:", error);
    return [];
  }
}

/**
 * Test semantic search
 */
function testSemanticSearch() {
  Logger.log("🧪 Testing semantic search...");
  
  const testEmail = "quelion0708@gmail.com";
  const testQuery = "tiêu chí chọn sản phẩm làm affiliate marketing";
  
  const results = findRelevantChunks(testQuery, testEmail, 3);
  
  Logger.log("\n" + "=".repeat(50));
  Logger.log("✅ Search Results:");
  
  if (results.length === 0) {
    Logger.log("❌ No results found. Make sure:");
    Logger.log("  1. User has activated courses");
    Logger.log("  2. AI_Content_Chunks sheet exists");
    Logger.log("  3. Chunks have been processed");
  } else {
    results.forEach((result, idx) => {
      Logger.log(`\n--- Result ${idx + 1} ---`);
      Logger.log(`Course: ${result.courseId}`);
      Logger.log(`Score: ${result.score.toFixed(2)}`);
      Logger.log(`Text: ${result.text.substring(0, 200)}...`);
    });
  }
}
