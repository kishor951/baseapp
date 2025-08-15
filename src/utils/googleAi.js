// utils/googleAi.js
// Utility to call Google Gemini/PaLM API for task breakdown

export async function getSubtasksFromGoogleAI(taskTitle, difficulty = 'medium') {
  // Replace with your actual Google AI API endpoint and key
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta2/models/gemini-pro:generateText';
  const apiKey = Constants.manifest?.extra?.GOOGLE_API_KEY;

  const prompt = `Break down the following task into up to 5 actionable subtasks based on its difficulty (${difficulty}). Task: "${taskTitle}". Return only a numbered list of subtasks.`;

  try {
    const response = await fetch(`${endpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: {text: prompt},
        maxOutputTokens: 256,
      }),
    });
    const data = await response.json();
    // Parse the response to extract subtasks
    const text = data?.candidates?.[0]?.output || '';
    // Split into array by line, remove empty lines
    return text.split(/\n|\r/).map(line => line.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
  } catch (err) {
    // console.error('Google AI API error:', err);
    return { error: err?.message || 'Failed to fetch subtasks', subtasks: [] };
  }
}
