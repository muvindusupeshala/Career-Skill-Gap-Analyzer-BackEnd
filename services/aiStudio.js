const MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

const getApiKey = () => process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || '';

const extractJsonBlock = (text) => {
  if (!text) return null;
  const trimmed = text.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed;
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return trimmed.slice(start, end + 1);
};

const getTextFromResponse = (data) => {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts.map((p) => p?.text || '').join('\n');
};

const generateText = async ({ systemPrompt, userPrompt, fallback }) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    if (fallback) return String(fallback);
    throw new Error('AI provider is not configured. Add GOOGLE_AI_API_KEY in backend/.env.');
  }

  const url = `${API_BASE}/models/${MODEL}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${systemPrompt}\n\n${userPrompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.5,
      },
    }),
  });

  if (!response.ok) {
    if (fallback) return String(fallback);
    throw new Error(`Gemini request failed with status ${response.status}.`);
  }

  const data = await response.json();
  const text = String(getTextFromResponse(data) || '').trim();
  if (!text) {
    if (fallback) return String(fallback);
    throw new Error('Gemini returned empty response.');
  }

  return text;
};

const generateJson = async ({ systemPrompt, userPrompt, fallback }) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    if (fallback) return fallback;
    throw new Error('AI provider is not configured. Add GOOGLE_AI_API_KEY in backend/.env.');
  }

  const url = `${API_BASE}/models/${MODEL}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${systemPrompt}\n\n${userPrompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    if (fallback) return fallback;
    throw new Error(`Gemini request failed with status ${response.status}.`);
  }

  const data = await response.json();
  const rawText = getTextFromResponse(data);
  const jsonText = extractJsonBlock(rawText);

  if (!jsonText) {
    if (fallback) return fallback;
    throw new Error('Gemini returned non-JSON response.');
  }

  try {
    return JSON.parse(jsonText);
  } catch (err) {
    if (fallback) return fallback;
    throw new Error(`Failed to parse Gemini JSON: ${err.message}`);
  }
};

module.exports = { generateJson, generateText };
