// AI Model Configuration
// Update these when models change or become unavailable.
// Verify available models: https://ai.google.dev/gemini-api/docs/models
// Or call: GET https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_KEY

export const AI_CONFIG = {
  // Fast model for tool selection and grounded lookups.
  geminiModels: ["gemini-2.5-flash"],
  groqModels: ["llama-3.3-70b-versatile"],

  // Capable model for content generation.
  chatbotModel: "gemini-2.5-pro",

  // Image generation (Gemini 3 Pro Image / Nano Banana Pro)
  imageModel: "gemini-3-pro-image-preview",
};
