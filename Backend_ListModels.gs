/**
 * List all available Gemini models
 */
function listGeminiModels() {
  try {
    const GEMINI_API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      Logger.log("❌ GEMINI_API_KEY not found");
      return;
    }
    
    Logger.log("🔍 Fetching available Gemini models...");
    
    // Try v1 API
    const response = UrlFetchApp.fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${GEMINI_API_KEY}`,
      {
        method: 'get',
        muteHttpExceptions: true
      }
    );
    
    if (response.getResponseCode() !== 200) {
      Logger.log(`❌ Error: ${response.getResponseCode()}`);
      Logger.log(response.getContentText());
      return;
    }
    
    const result = JSON.parse(response.getContentText());
    
    Logger.log("\n✅ Available models:");
    Logger.log("=" + "=".repeat(50));
    
    if (result.models) {
      result.models.forEach(model => {
        Logger.log(`\n📦 ${model.name}`);
        Logger.log(`   Display: ${model.displayName || 'N/A'}`);
        Logger.log(`   Description: ${model.description || 'N/A'}`);
        Logger.log(`   Supported methods: ${(model.supportedGenerationMethods || []).join(', ')}`);
      });
    } else {
      Logger.log("No models found in response:");
      Logger.log(JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    Logger.log("❌ Error:", error);
  }
}
