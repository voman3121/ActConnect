const axios = require('axios');

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
const askGemini = async (prompt) => {
  console.log('Calling Gemini with URL:', GEMINI_URL);
  try {
    const res = await axios.post(GEMINI_URL, {
      contents: [{ parts: [{ text: prompt }] }]
    });
    return res.data.candidates[0].content.parts[0].text;
  } catch (err) {
    console.log('Gemini error:', err.response?.data || err.message);
    throw err;
  }
};

// 1. Spam Detection
exports.detectSpam = async (title, description) => {
  const prompt = `You are a community issue moderator. Is this a genuine local community issue or spam/fake?
Title: "${title}"
Description: "${description}"
Reply ONLY in this JSON format: {"isSpam": true/false, "confidenceScore": 0-100, "reason": "short reason"}`;

  const raw = await askGemini(prompt);
  return JSON.parse(raw.replace(/```json|```/g, '').trim());
};

// 2. Categorization
exports.categorizeIssue = async (title, description) => {
  const prompt = `Categorize this community issue into one of: elderly_assistance, maintenance, cleanliness, safety, other.
Also estimate urgency: low, medium, or high.
Title: "${title}"
Description: "${description}"
Reply ONLY in this JSON format: {"category": "...", "urgency": "..."}`;

  const raw = await askGemini(prompt);
  return JSON.parse(raw.replace(/```json|```/g, '').trim());
};

// 3. Reward Estimation
exports.estimateReward = async (category, urgency, description) => {
  const prompt = `You are a reward system for a community volunteer app called ActCoin.
Based on the task below, suggest a fair reward in ActCoins (range: 10–200).
Category: ${category}, Urgency: ${urgency}
Description: "${description}"
Reply ONLY in this JSON format: {"rewardPoints": 50, "reasoning": "short reason"}`;

  const raw = await askGemini(prompt);
  return JSON.parse(raw.replace(/```json|```/g, '').trim());
};

// 4. Completion Verification
exports.verifyCompletion = async (issueDescription, completionNote, imageBase64) => {
  const prompt = `You are a strict verification officer for ACTCOIN, a community volunteer platform.

A volunteer claims to have resolved a community issue. Your job is to verify if their submitted proof is valid.

ORIGINAL ISSUE:
"${issueDescription}"

VOLUNTEER'S COMPLETION NOTE:
"${completionNote}"

YOUR VERIFICATION CHECKLIST:
1. Does the completion note logically address the original issue?
2. Is the note too vague, generic, or unrelated? (e.g. "done" or "fixed it" = reject)
3. Is the image clear and not blurry/dark/irrelevant?
4. Does the image actually show evidence of the issue being resolved?
5. Is the image possibly spam (random internet photo, unrelated scene, screenshot)?
6. Does the image match the location/context of the issue?
7. Are there signs of tampering or reuse of old photos?

REJECTION CRITERIA (reject if ANY of these are true):
- Completion note is vague, too short, or unrelated
- Image is blurry, too dark, or unreadable
- Image shows something completely unrelated to the issue
- Image appears to be a stock photo or screenshot
- No clear evidence of resolution visible in image
- Note and image contradict each other

Reply ONLY in this JSON format:
{
  "isVerified": true/false,
  "confidenceScore": 0-100,
  "reason": "specific reason under 25 words",
  "failedChecks": ["list of failed checks if any"]
}`;

  const messageParts = [{ text: prompt }];
  
  if (imageBase64) {
    messageParts.push({
      inline_data: {
        mime_type: "image/jpeg",
        data: imageBase64
      }
    });
  }

  const res = await axios.post(GEMINI_URL, {
    contents: [{ parts: messageParts }]
  });

  const raw = res.data.candidates[0].content.parts[0].text;
  return JSON.parse(raw.replace(/```json|```/g, '').trim());
};