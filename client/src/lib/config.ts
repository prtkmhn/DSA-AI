// AI Model Configuration
// Change model names here only.
// Verify available models:
// https://ai.google.dev/gemini-api/docs/models
// or GET https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_KEY

const AI_MODELS = {
  gemini: {
    // Fast/default model
    flash: "gemini-3-flash-preview",
    // Higher-quality content generation
    pro: "gemini-3-pro-preview",
    // Image generation
    image: "gemini-3-pro-image-preview",
    // Optional text fallback models
    fallbacks: ["gemini-2.5-flash"],
  },
  groq: {
    fallbacks: ["llama-3.3-70b-versatile"],
  },
} as const;

export const AI_CONFIG = {
  // Ordered list used by generic Gemini calls (first wins).
  geminiModels: [AI_MODELS.gemini.flash, ...AI_MODELS.gemini.fallbacks],
  groqModels: [...AI_MODELS.groq.fallbacks],

  // Used by long-form generation/chatbot flows.
  chatbotModel: AI_MODELS.gemini.pro,

  // Used by image generation flows.
  imageModel: AI_MODELS.gemini.image,
};
