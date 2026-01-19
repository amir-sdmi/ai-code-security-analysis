import fs   from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { spawn }  from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createWriteStream } from 'node:fs';
import fetch from 'node-fetch';
import ytdl   from 'ytdl-core';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Download remote media → local temp .mp4 (or .m4a) file
 */
async function downloadMedia(link) {
  const uid   = crypto.randomUUID();
  const out   = path.join(tmpdir(), `${uid}.mp4`);
  const outSt = createWriteStream(out);

  return new Promise((resolve, reject) => {
    const srcStream = /^https?:\/\/.*youtube\.com|youtu\.be/.test(link)
      ? ytdl(link, { quality: 'highestaudio' })
      : fetch(link).then(r => {
          if (!r.ok) throw new Error(`Download failed: ${r.status}`);
          return r.body;                         // Readable‑Stream
        });

    Promise.resolve(srcStream).then(stream => {
      stream.pipe(outSt)
        .on('finish', () => resolve(out))
        .on('error', reject);
    }).catch(reject);
  });
}

/**
 * Convert media → 16‑kHz mono .wav using ffmpeg in PATH
 */
function convertToWav(inFile) {
  const wav = inFile.replace(/\.(mp4|m4a|webm)$/i, '.wav');
  return new Promise((resolve, reject) => {
    const ff = spawn('ffmpeg', ['-y', '-i', inFile, '-ac', '1', '-ar', '16000', wav]);
    ff.stderr.on('data', () => {}); // silence spam
    ff.on('exit', code => {
      code === 0 ? resolve(wav) : reject(new Error('ffmpeg failed'));
    });
  });
}

/**
 * Transcribe wav → text via OpenAI Whisper v1
 */
async function transcribeWav(wavPath) {
  const fileStream = await fs.readFile(wavPath);
  const resp = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file:  fileStream,
    // language: 'en',  // let Whisper auto‑detect or specify zh / etc.
  });
  return resp.text.trim();
}

export async function getTranscript(link) {
  // 1) download
  const raw = await downloadMedia(link);

  try {
    // 2) convert to wav 16 kHz
    const wav = await convertToWav(raw);

    // 3) whisper‑1 transcription
    const text = await transcribeWav(wav);
    return text;
  } finally {
    // clean temp files best‑effort
    fs.unlink(raw).catch(()=>{});
  }
}

/**
 * Summarise transcript to ≤ 200 words. Use DeepSeek if key provided, else GPT‑4o.
 */
export async function summariseText(fullText) {
  const systemPrompt = 'You are an educational assistant. Write a concise (~200 words) summary of the transcript for busy teachers.';
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user',   content: (fullText || '').slice(0, 12000) } // stay under token limit
  ];

  if (process.env.DEEPSEEK_API_KEY) {
    // deepseek
    const rsp = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type':  'application/json'
      },
      body: JSON.stringify({ model: 'deepseek-reasoner', messages, temperature: 0.5 })
    }).then(r => r.json());
    return rsp.choices[0].message.content.trim();
  }
  // fallback GPT‑4o
  const gpt = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages, temperature: 0.5 });
  return gpt.choices[0].message.content.trim();
}

export async function getSummary(link) {
  const transcript = await getTranscript(link);
  const summary    = await summariseText(transcript);
  return { transcript, summary };
}

// ---------- example CLI usage ----------
if (process.argv[2]) {
  (async () => {
    const { transcript, summary } = await getSummary(process.argv[2]);
    console.log('\n===== TRANSCRIPT =====\n');
    console.log(transcript);
    console.log('\n===== SUMMARY =====\n');
    console.log(summary);
  })();
}
