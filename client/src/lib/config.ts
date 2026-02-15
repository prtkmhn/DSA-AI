// AI Model Configuration
// Update these when models change or become unavailable.
// Verify available models: https://ai.google.dev/gemini-api/docs/models
// Or call: GET https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_KEY

export const AI_CONFIG = {
  // Ordered fallback list for text generation. Keep broadly-supported models at the end.
  geminiModels: ["gemini-3-flash", "gemini-2.5-flash"],
  groqModels: ["llama-3.3-70b-versatile"],

  // Capable model for content generation. If unavailable, code falls back to geminiModels.
  chatbotModel: "gemini-3-pro",

  // Image generation (Gemini 3 Pro Image / Nano Banana Pro)
  imageModel: "gemini-3-pro-image-preview",
};
