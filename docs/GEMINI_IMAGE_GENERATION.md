# Gemini Image Generation

## Models

| Model | ID | Use Case |
|-------|-----|----------|
| Flash | `gemini-2.5-flash-image` | Fast, high-volume tasks |
| Pro | `gemini-3-pro-image-preview` | Professional quality, advanced reasoning |

## Capabilities

- **Text-to-image**: Generate images from descriptions
- **Image editing**: Modify existing images with text prompts
- **Multi-turn editing**: Conversational image refinement
- **Text rendering**: Can generate diagrams, infographics with legible text

## Supported Aspect Ratios

`1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`

## Response Format

- Returns base64-encoded PNG in `inline_data` parts
- MIME type: `image/png`
- Includes SynthID watermark

## JavaScript Example

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "GEMINI_API_KEY" });

async function generateImage(prompt: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: prompt,
    config: {
      responseModalities: ["image", "text"],
    },
  });

  // Extract image from response
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const base64Image = part.inlineData.data;
      const mimeType = part.inlineData.mimeType; // "image/png"
      return `data:${mimeType};base64,${base64Image}`;
    }
  }
}
```

## Best Practices

- **Describe scenes, don't list keywords** - Model has deep language understanding
- Use for: algorithm diagrams, data structure visualizations, step-by-step illustrations
