// ========================================
// RAG SYSTEM - PHASE 2: VECTOR EMBEDDINGS
// ========================================

/**
 * Get embedding vector for text using Gemini API
 * @param {string} text - Text to embed
 * @returns {Array} 768-dimensional vector or null on error
 */
function getEmbedding(text) {
  try {
    const GEMINI_API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      Logger.log("❌ GEMINI_API_KEY not found");
      return null;
    }
    
    const payload = {
      model: "models/text-embedding-004",
      content: {
        parts: [{ text: text }]
      }
    };
    
    const response = UrlFetchApp.fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      }
    );
    
    if (response.getResponseCode() !== 200) {
      Logger.log(`❌ Embedding API error: ${response.getResponseCode()}`);
      Logger.log(response.getContentText());
      return null;
    }
    
    const result = JSON.parse(response.getContentText());
    const embedding = result.embedding?.values;
    
    if (!embedding || !Array.isArray(embedding)) {
      Logger.log("❌ Invalid embedding response");
      return null;
    }
    
    Logger.log(`✅ Generated embedding: ${embedding.length} dimensions`);
    return embedding;
    
  } catch (error) {
    Logger.log("❌ Error in getEmbedding:", error);
    return null;
  }
}

/**
 * Cosine similarity between two vectors
 * @param {Array} vecA - First vector
 * @param {Array} vecB - Second vector
 * @returns {number} Similarity score (0-1)
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Process course content into chunks with embeddings
 * @param {string} courseId - Course ID
 * @param {string} lessonId - Lesson ID
 * @param {string} content - Full content
 * @param {string} title - Lesson title
 * @returns {Object} Processing result
 */
function processContentToChunks(courseId, lessonId, content, title = "") {
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
        "Embedding",
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
      
      // Generate embedding
      Logger.log(`  Processing chunk ${i + 1}/${chunks.length}...`);
      const embedding = getEmbedding(chunk.text);
      
      if (!embedding) {
        Logger.log(`  ❌ Failed to generate embedding for chunk ${i + 1}`);
        failCount++;
        continue;
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
        JSON.stringify(embedding),
        JSON.stringify(metadata),
        new Date()
      ];
      
      chunkSheet.appendRow(row);
      successCount++;
      
      // Rate limiting: wait 100ms between API calls
      Utilities.sleep(100);
    }
    
    Logger.log(`\n✅ Processing complete: ${successCount} success, ${failCount} failed`);
    
    return {
      success: true,
      message: `Processed ${successCount}/${chunks.length} chunks`,
      chunksCreated: successCount,
      chunksFailed: failCount
    };
    
  } catch (error) {
    Logger.log("❌ Error in processContentToChunks:", error);
    return {
      success: false,
      message: "Error: " + error.toString()
    };
  }
}

/**
 * Test embedding API
 */
function testEmbedding() {
  Logger.log("🧪 Testing Gemini Embeddings API...");
  
  const testText = "Tiếp thị liên kết là gì?";
  const embedding = getEmbedding(testText);
  
  if (embedding) {
    Logger.log(`✅ Success! Embedding length: ${embedding.length}`);
    Logger.log(`First 5 values: [${embedding.slice(0, 5).join(', ')}...]`);
    
    // Test similarity
    const embedding2 = getEmbedding("Affiliate marketing là gì?");
    if (embedding2) {
      const similarity = cosineSimilarity(embedding, embedding2);
      Logger.log(`\n✅ Similarity test:`);
      Logger.log(`  Text 1: "${testText}"`);
      Logger.log(`  Text 2: "Affiliate marketing là gì?"`);
      Logger.log(`  Similarity: ${similarity.toFixed(4)} (should be high ~0.7-0.9)`);
    }
  } else {
    Logger.log("❌ Failed to generate embedding");
  }
}
