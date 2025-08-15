import Constants from 'expo-constants';

export async function getSubtasksFromGoogleAI(taskTitle, difficulty = 'medium') {
  // Use correct API key access for both classic and EAS builds
  const apiKey =
    Constants.expoConfig?.extra?.GOOGLE_API_KEY ||
    Constants.manifest?.extra?.GOOGLE_API_KEY;
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  const prompt = `Split this task into up to 5 action-driven, target-oriented subtasks. Each point must be a simple, direct sentence of 5-6 words, on point and on the face. ONLY return a numbered list, no introduction, no explanation, no extra text. Task: "${taskTitle}"`;

  try {
    if (!apiKey) {
      console.error('GOOGLE_API_KEY is missing in app config!');
      return { error: 'Google API key missing in app config', subtasks: [] };
    }
    const response = await fetch(`${endpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 256
        }
      }),
    });
    const data = await response.json();
    console.log('Google AI raw response:', JSON.stringify(data));
    // Try to parse Gemini response
    let text = '';
    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      text = data.candidates[0].content.parts[0].text;
    } else if (data?.candidates?.[0]?.content?.text) {
      text = data.candidates[0].content.text;
    } else if (data?.candidates?.[0]?.output) {
      text = data.candidates[0].output;
    }
    if (!text) {
      return { error: 'No output from Google AI', subtasks: [] };
    }
    // Split into array by line, remove empty lines
    const subtasks = text.split(/\n|\r/).map(line => line.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
    if (!subtasks.length) {
      return { error: 'AI returned empty subtask list', subtasks: [] };
    }
    return subtasks;
  } catch (err) {
    console.error('Google AI API error:', err);
    return { error: err?.message || 'Failed to fetch subtasks', subtasks: [] };
  }
}
