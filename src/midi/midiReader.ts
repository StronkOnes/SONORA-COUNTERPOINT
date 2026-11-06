/**
 * Standard MIDI File (.mid) Parser
 * Reads Type 0 and Type 1 MIDI files, extracting tracks, note events, and tempo.
 */

import { Project, Voice, NoteEvent, TICKS_PER_BEAT } from '../types/music.ts';

export async function parseMidiFile(file: File): Promise<Partial<Project>> {
  const buffer = await file.arrayBuffer();
  const data = new Uint8Array(buffer);
  let offset = 0;

  function readString(length: number): string {
    let str = '';
    for (let i = 0; i < length; i++) {
      str += String.fromCharCode(data[offset++]);
    }
    return str;
  }

  function readUint32(): number {
    const val = (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3];
    offset += 4;
    return val >>> 0;
  }

  function readUint16(): number {
    const val = (data[offset] << 8) | data[offset + 1];
    offset += 2;
    return val;
  }

  function readVlq(): number {
    let value = 0;
    let byte = 0;
    do {
      byte = data[offset++];
      value = (value << 7) | (byte & 0x7f);
    } while (byte & 0x80);
    return value;
  }

  // 1. Header
  const headerId = readString(4);
  if (headerId !== 'MThd') {
    throw new Error('Invalid MIDI file: Missing MThd header');
  }
  const headerLength = readUint32();
  const format = readUint16();
  const numTracks = readUint16();
  const division = readUint16();
  offset += (headerLength - 6); // skip any extra header bytes

  const tickScale = division > 0 ? TICKS_PER_BEAT / division : 1.0;
  let detectedBpm = 108;
  const parsedVoices: Voice[] = [];
  const voiceColors = ['#f59e0b', '#38bdf8', '#34d399', '#a78bfa', '#fb7185', '#fbbf24'];

  // 2. Tracks
  for (let t = 0; t < numTracks; t++) {
    if (offset >= data.length) break;
    const trackId = readString(4);
    if (trackId !== 'MTrk') {
      break;
    }
    const trackLength = readUint32();
    const trackEnd = offset + trackLength;

    let currentTick = 0;
    let trackName = `Voice ${t + 1}`;
    const openNotes: Map<number, { pitch: number; startTick: number; velocity: number }> = new Map();
    const notes: NoteEvent[] = [];
    let runningStatus = 0;

    while (offset < trackEnd && offset < data.length) {
      const delta = readVlq();
      currentTick += delta;

      let status = data[offset];
      if (status >= 0x80) {
        runningStatus = status;
        offset++;
      } else {
        status = runningStatus;
      }

      const eventType = status & 0xf0;

      if (status === 0xff) {
        // Meta event
        const metaType = data[offset++];
        const metaLength = readVlq();
        if (metaType === 0x03) {
          // Track name
          let name = '';
          for (let i = 0; i < metaLength; i++) {
            name += String.fromCharCode(data[offset + i]);
          }
          trackName = name.trim() || trackName;
        } else if (metaType === 0x51 && metaLength === 3) {
          // Tempo
          const mpqn = (data[offset] << 16) | (data[offset + 1] << 8) | data[offset + 2];
          detectedBpm = Math.round(60000000 / mpqn);
        }
        offset += metaLength;
      } else if (status === 0xf0 || status === 0xf7) {
        // SysEx
        const sysexLength = readVlq();
        offset += sysexLength;
      } else if (eventType === 0x90) {
        // Note On
        const pitch = data[offset++];
        const vel = data[offset++];
        if (vel > 0) {
          openNotes.set(pitch, { pitch, startTick: Math.round(currentTick * tickScale), velocity: vel });
        } else {
          // Vel 0 is note off
          const open = openNotes.get(pitch);
          if (open) {
            notes.push({
              id: `imported-${t}-${notes.length}`,
              pitch: open.pitch,
              startTime: open.startTick,
              duration: Math.max(120, Math.round(currentTick * tickScale) - open.startTick),
              velocity: open.velocity,
            });
            openNotes.delete(pitch);
          }
        }
      } else if (eventType === 0x80) {
        // Note Off
        const pitch = data[offset++];
        offset++; // ignore release velocity
        const open = openNotes.get(pitch);
        if (open) {
          notes.push({
            id: `imported-${t}-${notes.length}`,
            pitch: open.pitch,
            startTime: open.startTick,
            duration: Math.max(120, Math.round(currentTick * tickScale) - open.startTick),
            velocity: open.velocity,
          });
          openNotes.delete(pitch);
        }
      } else if (eventType === 0xa0 || eventType === 0xb0 || eventType === 0xe0) {
        offset += 2;
      } else if (eventType === 0xc0 || eventType === 0xd0) {
        offset += 1;
      }
    }

    if (notes.length > 0) {
      const avgPitch = notes.reduce((a, b) => a + b.pitch, 0) / notes.length;
      const isBass = avgPitch < 53;
      parsedVoices.push({
        id: `voice-${t}-${Date.now()}`,
        name: trackName,
        role: parsedVoices.length === 0 ? 'lead' : (isBass ? 'bass' : 'countermelody'),
        color: voiceColors[parsedVoices.length % voiceColors.length],
        clef: isBass ? 'bass' : 'treble',
        instrument: isBass ? 'solo_cello' : (parsedVoices.length === 0 ? 'grand_piano' : 'french_harpsichord'),
        volume: 0.8,
        pan: parsedVoices.length === 0 ? 0 : (parsedVoices.length % 2 === 1 ? -0.3 : 0.3),
        muted: false,
        solo: false,
        locked: false,
        notes,
        octaveOffset: 0,
      });
    }
  }

  return {
    tempo: detectedBpm || 108,
    voices: parsedVoices,
  };
}
