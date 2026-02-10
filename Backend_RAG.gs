// ========================================
// RAG SYSTEM - PHASE 1: CONTENT CHUNKING
// ========================================

/**
 * Smart content chunking with paragraph awareness
 * @param {string} content - Full content text
 * @param {number} chunkSize - Target chunk size in characters (default: 800)
 * @param {number} overlap - Overlap between chunks (default: 100)
 * @returns {Array} Array of chunk objects
 */
function chunkContent(content, chunkSize = 800, overlap = 100) {
  if (!content || content.trim() === "") {
    return [];
  }
  
  const chunks = [];
  let startIndex = 0;
  
  while (startIndex < content.length) {
    let endIndex = Math.min(startIndex + chunkSize, content.length);
    
    // Smart splitting: try to end at paragraph or sentence boundary
    if (endIndex < content.length) {
      // Look for paragraph break within last 100 chars
      const searchStart = Math.max(endIndex - 100, startIndex);
      const segment = content.substring(searchStart, endIndex);
      
      // Try to find paragraph break (\n\n)
      const paragraphBreak = segment.lastIndexOf('\n\n');
      if (paragraphBreak > 0) {
        endIndex = searchStart + paragraphBreak + 2;
      } else {
        // Try to find sentence end (. ! ?)
        const sentenceEnd = Math.max(
          segment.lastIndexOf('. '),
          segment.lastIndexOf('! '),
          segment.lastIndexOf('? ')
        );
        if (sentenceEnd > 0) {
          endIndex = searchStart + sentenceEnd + 2;
        }
      }
    }
    
    const chunkText = content.substring(startIndex, endIndex).trim();
    
    if (chunkText) {
      chunks.push({
        text: chunkText,
        index: chunks.length,
        startPos: startIndex,
        endPos: endIndex,
        length: chunkText.length
      });
    }
    
    // Move to next chunk with overlap
    startIndex = endIndex - overlap;
    
    // Prevent infinite loop
    if (startIndex >= content.length - overlap) {
      break;
    }
  }
  
  Logger.log(`✅ Created ${chunks.length} chunks from ${content.length} chars`);
  return chunks;
}

/**
 * Extract metadata from content (title, keywords, chapter info)
 * @param {string} content - Chunk text
 * @param {number} chunkIndex - Index of chunk in sequence
 * @returns {Object} Metadata object
 */
function extractChunkMetadata(content, chunkIndex) {
  const metadata = {
    chunkIndex: chunkIndex,
    hasHeading: false,
    headingLevel: null,
    title: "",
    keywords: []
  };
  
  // Detect markdown headings
  const lines = content.split('\n');
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const line = lines[i].trim();
    
    // Check for markdown heading
    if (line.startsWith('#')) {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        metadata.hasHeading = true;
        metadata.headingLevel = match[1].length;
        metadata.title = match[2].trim();
        break;
      }
    }
    
    // Check for bold text as pseudo-heading
    if (line.startsWith('**') && line.endsWith('**')) {
      metadata.title = line.replace(/\*\*/g, '').trim();
      break;
    }
  }
  
  // Extract keywords (simple: take bold/emphasized text)
  const boldMatches = content.match(/\*\*([^*]+)\*\*/g) || [];
  metadata.keywords = boldMatches
    .map(m => m.replace(/\*\*/g, '').trim())
    .filter(k => k.length > 2 && k.length < 50)
    .slice(0, 10); // Max 10 keywords
  
  return metadata;
}

/**
 * Test function: Chunk a sample course content
 */
function testChunking() {
  const sampleContent = `# CHƯƠNG 1: TƯ DUY & TÂM THÁI

**1.1. Sự khác biệt cốt lõi:**
Khóa học không chỉ dạy kỹ năng kiếm tiền mà là ứng dụng **Triết lý giáo dục tận gốc** và **Hệ quy chiếu Công đức - Phước đức** vào kinh doanh.

**1.2. Triết lý Cây Cổ Thụ:**
Xây kênh TikTok như trồng một cây cổ thụ. Giai đoạn đầu cần chăm bón, bảo vệ, chưa có quả.

**1.3. Sáu chữ vàng:**
Đơn giản - Vui vẻ - Tin tưởng - Nhẹ nhàng - Thường xuyên - Dụng tâm.`;

  Logger.log("🧪 Testing chunking function...");
  const chunks = chunkContent(sampleContent, 200, 30);
  
  chunks.forEach((chunk, idx) => {
    Logger.log(`\n--- Chunk ${idx + 1} ---`);
    Logger.log(`Length: ${chunk.length} chars`);
    Logger.log(`Text: ${chunk.text.substring(0, 100)}...`);
    
    const metadata = extractChunkMetadata(chunk.text, idx);
    Logger.log(`Metadata:`, metadata);
  });
  
  Logger.log("\n✅ Test complete!");
}
