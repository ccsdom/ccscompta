import fs from 'node:fs';
import path from 'node:path';

// Parse .env manually
const envPath = path.resolve('.env');
let apiKey = '';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/GEMINI_API_KEY\s*=\s*(.+)/);
  if (match) {
    apiKey = match[1].trim().replace(/['"]/g, '');
  }
}

if (!apiKey) {
  console.error("GEMINI_API_KEY not found in .env");
  process.exit(1);
}

console.log("Using API Key starting with:", apiKey.substring(0, 10) + "...");

async function testGemini() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log("Status:", res.status, res.statusText);
    const json = await res.json();
    const geminiModels = json.models
      ? json.models.map(m => m.name).filter(name => name.includes('gemini'))
      : [];
    console.log("Gemini Models:", geminiModels);
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

testGemini();
