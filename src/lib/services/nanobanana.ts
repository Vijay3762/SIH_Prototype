import { GoogleGenAI } from '@google/genai';
import mime from 'mime';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { GeminiPanelPlan } from './gemini';

interface NanobananaPanelArt {
  panel_id: string;
  image_url: string;
}

interface GeneratePanelArtArgs {
  questSlug: string;
  questTitle: string;
  panels: GeminiPanelPlan[];
}

// const HARDCODED_GEMINI_API_KEY = 'AIzaSyDXZ8a4RFpIxB8R_4wLXVtbI6rAeF4_l-E';
const HARDCODED_GEMINI_API_KEY = 'AIzaSyDXZ8a4RFpIxB8R_4wLXVtbI6rAeF4_l-E';
function saveBinaryFile(filePath: string, content: Buffer) {
  writeFileSync(filePath, content);
}

async function generateImageForPanel(panel: GeminiPanelPlan, questSlug: string): Promise<string> {
  const ai = new GoogleGenAI({
    apiKey: HARDCODED_GEMINI_API_KEY,
  });
  const config = {
    responseModalities: ['IMAGE', 'TEXT'],
  };
  const model = 'gemini-2.0-flash-exp';
  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: panel.image_prompt,
        },
      ],
    },
  ];

  const response = await ai.models.generateContentStream({
    model,
    config,
    contents,
  });

  for await (const chunk of response) {
    if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
      continue;
    }
    if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
      const inlineData = chunk.candidates[0].content.parts[0].inlineData;
      const fileExtension = mime.getExtension(inlineData.mimeType || 'image/png') || 'png';
      const buffer = Buffer.from(inlineData.data || '', 'base64');

      // Create directory if not exists
      const dirPath = join('public', 'story-panels', questSlug);
      mkdirSync(dirPath, { recursive: true });

      const fileName = `${panel.panel_id}.${fileExtension}`;
      const filePath = join(dirPath, fileName);
      saveBinaryFile(filePath, buffer);

      return `/story-panels/${questSlug}/${fileName}`;
    }
  }

  throw new Error(`Failed to generate image for panel ${panel.panel_id}`);
}

export async function generatePanelArt(args: GeneratePanelArtArgs): Promise<NanobananaPanelArt[]> {
  const { questSlug, panels } = args;

  if (panels.length === 0) {
    return [];
  }

  const artPromises = panels.map(async (panel) => {
    try {
      const image_url = await generateImageForPanel(panel, questSlug);
      return { panel_id: panel.panel_id, image_url };
    } catch (error) {
      console.error(`[Gemini Image] Failed to generate image for panel ${panel.panel_id}:`, error);
      throw error;
    }
  });

  const art = await Promise.all(artPromises);
  return art;
}