/**
 * SONORA Standard MIDI 1.0 Multi-Track Exporter
 * Generates spec-compliant Type 1 Standard MIDI (.mid) binary files.
 * Usable directly in Ableton Live, Logic Pro, FL Studio, Cubase, etc.
 */

import { Project, Voice, NoteEvent, TICKS_PER_BEAT } from '../types/music.ts';

function writeVariableLengthQuantity(value: number): number[] {
  const bytes: number[] = [];
  let buffer = value & 0x7f;
  while ((value >>= 7) > 0) {
    buffer <<= 8;
    buffer |= (value & 0x7f) | 0x80;
  }
  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) {
      buffer >>= 8;
    } else {
      break;
    }
  }
  return bytes;
}

function stringToBytes(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i) & 0xff);
  }
  return bytes;
}

export function exportProjectToMidi(project: Project, specificVoiceId?: string): Uint8Array {
  const voicesToExport = specificVoiceId 
    ? project.voices.filter(v => v.id === specificVoiceId)
    : project.voices;

  const numTracks = voicesToExport.length + 1; // 1 conductor track + 1 per voice
  const division = TICKS_PER_BEAT; // 480 ticks per quarter note

  // 1. Build Header Chunk (MThd)
  const headerBytes: number[] = [
    0x4d, 0x54, 0x68, 0x64, // 'MThd'
    0x00, 0x00, 0x00, 0x06, // Chunk length (6 bytes)
    0x00, 0x01,             // Format 1: Multi-track synchronous
    (numTracks >> 8) & 0xff, numTracks & 0xff,
    (division >> 8) & 0xff, division & 0xff
  ];

  const allChunks: number[][] = [headerBytes];

  // 2. Conductor Track (Tempo, Time Signature, Marker)
  const conductorEvents: number[] = [];
  
  // Track Name
  const projectNameBytes = stringToBytes(project.name || 'SONORA Project');
  conductorEvents.push(
    ...writeVariableLengthQuantity(0),
    0xff, 0x03, projectNameBytes.length,
    ...projectNameBytes
  );

  // Time Signature: [num, denom] e.g. [4, 4] -> num=4, denomPow=2
  const [num, denom] = project.timeSignature;
  const denomPow = Math.round(Math.log2(denom));
  conductorEvents.push(
    ...writeVariableLengthQuantity(0),
    0xff, 0x58, 0x04,
    num, denomPow, 24, 8
  );

  // Tempo: microseconds per quarter note (60,000,000 / BPM)
  const mpqn = Math.round(60000000 / project.tempo);
  conductorEvents.push(
    ...writeVariableLengthQuantity(0),
    0xff, 0x51, 0x03,
    (mpqn >> 16) & 0xff, (mpqn >> 8) & 0xff, mpqn & 0xff
  );

  // Copyright / Attribution Marker
  const attribBytes = stringToBytes('Generated with SONORA Counterpoint Studio (Gratis ad Parnassum)');
  conductorEvents.push(
    ...writeVariableLengthQuantity(0),
    0xff, 0x02, attribBytes.length,
    ...attribBytes
  );

  // End of Conductor Track
  conductorEvents.push(
    ...writeVariableLengthQuantity(0),
    0xff, 0x2f, 0x00
  );

  allChunks.push(createTrackChunk(conductorEvents));

  // 3. One Track per Voice
  voicesToExport.forEach((voice, index) => {
    const channel = index % 16;
    const trackEvents = buildVoiceTrackEvents(voice, channel);
    allChunks.push(createTrackChunk(trackEvents));
  });

  // Flatten into Uint8Array
  const totalLength = allChunks.reduce((acc, c) => acc + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of allChunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

interface MidiRawEvent {
  tick: number;
  type: 'on' | 'off';
  pitch: number;
  velocity: number;
  channel: number;
}

function buildVoiceTrackEvents(voice: Voice, channel: number): number[] {
  const events: number[] = [];

  // Track Name
  const voiceNameBytes = stringToBytes(`${voice.name} (${voice.role})`);
  events.push(
    ...writeVariableLengthQuantity(0),
    0xff, 0x03, voiceNameBytes.length,
    ...voiceNameBytes
  );

  // Collect Note On and Note Off events
  const rawEvents: MidiRawEvent[] = [];
  for (const n of voice.notes) {
    const effectivePitch = Math.max(0, Math.min(127, n.pitch + (voice.octaveOffset || 0) * 12));
    rawEvents.push({
      tick: n.startTime,
      type: 'on',
      pitch: effectivePitch,
      velocity: n.velocity || 80,
      channel,
    });
    rawEvents.push({
      tick: n.startTime + n.duration,
      type: 'off',
      pitch: effectivePitch,
      velocity: 0,
      channel,
    });
  }

  // Sort chronologically (with 'off' before 'on' if simultaneous)
  rawEvents.sort((a, b) => {
    if (a.tick !== b.tick) return a.tick - b.tick;
    if (a.type !== b.type) return a.type === 'off' ? -1 : 1;
    return a.pitch - b.pitch;
  });

  // Convert to delta-time events
  let lastTick = 0;
  for (const ev of rawEvents) {
    const delta = Math.max(0, ev.tick - lastTick);
    lastTick = ev.tick;

    events.push(...writeVariableLengthQuantity(delta));
    if (ev.type === 'on') {
      events.push(0x90 | (ev.channel & 0x0f), ev.pitch & 0x7f, ev.velocity & 0x7f);
    } else {
      events.push(0x80 | (ev.channel & 0x0f), ev.pitch & 0x7f, 0x00);
    }
  }

  // End of Track
  events.push(...writeVariableLengthQuantity(0), 0xff, 0x2f, 0x00);

  return events;
}

function createTrackChunk(trackData: number[]): number[] {
  const length = trackData.length;
  return [
    0x4d, 0x54, 0x72, 0x6b, // 'MTrk'
    (length >> 24) & 0xff,
    (length >> 16) & 0xff,
    (length >> 8) & 0xff,
    length & 0xff,
    ...trackData,
  ];
}

export function downloadMidiFile(data: Uint8Array, filename: string) {
  const blob = new Blob([data.buffer as ArrayBuffer], { type: 'audio/midi' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.mid') ? filename : `${filename}.mid`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportSingleVoiceStem(project: Project, voiceId: string) {
  const voice = project.voices.find(v => v.id === voiceId);
  if (!voice) return;
  const data = exportProjectToMidi(project, voiceId);
  const safeProject = project.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const safeVoice = voice.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  downloadMidiFile(data, `${safeProject}__${safeVoice}_stem.mid`);
}

export function exportAllStems(project: Project) {
  project.voices.forEach((voice, index) => {
    setTimeout(() => {
      exportSingleVoiceStem(project, voice.id);
    }, index * 200);
  });
}
