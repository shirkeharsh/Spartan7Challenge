const fs = require('fs');
const path = require('path');

const sampleRate = 8000; // Low sample rate for small file sizes (perfect for simple alerts)

function createWavBuffer(samples) {
  const numSamples = samples.length;
  const buffer = Buffer.alloc(44 + numSamples * 2);

  // Write WAV Header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size
  buffer.writeUInt16LE(1, 20);  // AudioFormat (PCM)
  buffer.writeUInt16LE(1, 22);  // NumChannels (mono)
  buffer.writeUInt32LE(sampleRate, 24); // SampleRate
  buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate
  buffer.writeUInt16LE(2, 32);  // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  // Write PCM audio samples (16-bit signed)
  for (let i = 0; i < numSamples; i++) {
    const val = Math.max(-32768, Math.min(32767, Math.floor(samples[i] * 32767)));
    buffer.writeInt16LE(val, 44 + i * 2);
  }

  return buffer;
}

// Sound 1: Pleasant double beep Chime (C6 and G6)
function generateChime() {
  const duration = 0.8; // 0.8 seconds total
  const numSamples = sampleRate * duration;
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let amplitude = 0;
    
    // First tone: C6 (1046.50 Hz) for 0.25 seconds
    if (t < 0.25) {
      const envelope = Math.max(0, 1.0 - (t / 0.25));
      amplitude = Math.sin(2 * Math.PI * 1046.50 * t) * envelope * 0.5;
    }
    // Second tone: G6 (1567.98 Hz) starting at 0.15 seconds to 0.7 seconds
    if (t >= 0.12 && t < 0.70) {
      const dt = t - 0.12;
      const envelope = Math.max(0, 1.0 - (dt / 0.5));
      amplitude += Math.sin(2 * Math.PI * 1567.98 * dt) * envelope * 0.5;
    }

    samples[i] = amplitude;
  }
  return createWavBuffer(samples);
}

// Sound 2: High-pitch trainer buzzer Alarm (Pulsed 1200Hz buzzer)
function generateAlarm() {
  const duration = 4.0; // 4 seconds
  const numSamples = sampleRate * duration;
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    
    // Pulse on/off every 0.15 seconds (150ms)
    const isPlaying = Math.floor(t / 0.15) % 2 === 0;
    if (isPlaying) {
      // 1200Hz frequency square wave-ish sound
      const sineVal = Math.sin(2 * Math.PI * 1200.0 * t);
      // Soft clipper for buzzer effect
      samples[i] = Math.max(-0.6, Math.min(0.6, sineVal * 1.5)) * 0.5;
    } else {
      samples[i] = 0;
    }
  }
  return createWavBuffer(samples);
}

// Sound 3: Sweep emergency Siren (sweeping from 600Hz to 1500Hz)
function generateSiren() {
  const duration = 4.0; // 4 seconds
  const numSamples = sampleRate * duration;
  const samples = new Float32Array(numSamples);

  let phase = 0;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    
    // Frequency sweeps up and down every 0.5 seconds
    // Frequency cycle = Math.sin(2 * Math.PI * 2 * t) // 2 sweeps per second
    const sweep = (Math.sin(2 * Math.PI * 2.5 * t) + 1.0) / 2.0; // 0 to 1
    const freq = 600.0 + sweep * 800.0; // 600Hz to 1400Hz

    phase += 2 * Math.PI * freq / sampleRate;
    samples[i] = Math.sin(phase) * 0.5;
  }
  return createWavBuffer(samples);
}

// Write the WAV assets to the Android raw resources folder
const rawDir = path.join(__dirname, '../android/app/src/main/res/raw');
if (!fs.existsSync(rawDir)) {
  fs.mkdirSync(rawDir, { recursive: true });
}

console.log('Writing WAV tones to:', rawDir);
fs.writeFileSync(path.join(rawDir, 'chime.wav'), generateChime());
console.log('✔ Generated chime.wav');
fs.writeFileSync(path.join(rawDir, 'alarm.wav'), generateAlarm());
console.log('✔ Generated alarm.wav');
fs.writeFileSync(path.join(rawDir, 'siren.wav'), generateSiren());
console.log('✔ Generated siren.wav');
console.log('All tones successfully generated.');
