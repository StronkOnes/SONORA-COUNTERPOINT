/**
 * SONORA Counterpoint Studio - Web Audio DAW Engine
 * High-impact producer synth engines, 808 sub bass, vintage Rhodes, neo-plucks,
 * analog poly, chamber strings, swing sequencer, and master drive/reverb bus.
 */

import { NoteEvent, Voice, InstrumentType, TICKS_PER_BEAT } from '../types/music.ts';
import { midiToFrequency } from '../music-core/theory/pitch.ts';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private driveNode: WaveShaperNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private isInitialized = false;

  private voiceNodes: Map<string, { gain: GainNode; panner: StereoPannerNode }> = new Map();

  // Playback state
  private isPlaying = false;
  private currentTick = 0;
  private bpm = 120;
  private timeSignature: [number, number] = [4, 4];
  private loop = true;
  private loopStartTick = 0;
  private loopEndTick = 480 * 16;
  private swingAmount = 0; // 0 to 60%
  private onTickCallback: ((tick: number) => void) | null = null;
  private animationFrameId: number | null = null;
  private lastScheduledAudioTime = 0;
  private lastScheduledTick = 0;
  private isMetronomeOn = false;

  public init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Master bus
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.85;

    // Tube saturation / soft clipper waveshaper
    this.driveNode = this.ctx.createWaveShaper();
    this.driveNode.curve = this.makeDistortionCurve(15) as Float32Array<ArrayBuffer>;
    this.driveNode.oversample = '4x';

    // Reverb & Dry/Wet
    this.dryGain = this.ctx.createGain();
    this.dryGain.gain.value = 0.82;
    this.wetGain = this.ctx.createGain();
    this.wetGain.gain.value = 0.28;

    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = this.createImpulseResponse(2.0, 2.2);

    this.dryGain.connect(this.driveNode);
    this.reverbNode.connect(this.wetGain);
    this.wetGain.connect(this.driveNode);
    this.driveNode.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.isInitialized = true;
  }

  private makeDistortionCurve(amount = 20): Float32Array {
    const k = typeof amount === 'number' ? amount : 20;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  private createImpulseResponse(duration: number, decay: number): AudioBuffer {
    if (!this.ctx) throw new Error('No audio context');
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const factor = Math.pow(1 - i / length, decay);
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }
    return impulse;
  }

  public setMasterVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime, 0.05);
    }
  }

  public setMetronome(enabled: boolean) {
    this.isMetronomeOn = enabled;
  }

  public setSwing(amount: number) {
    this.swingAmount = Math.max(0, Math.min(0.6, amount / 100));
  }

  public registerVoice(voice: Voice) {
    if (!this.ctx || !this.dryGain || !this.reverbNode) return;

    let nodes = this.voiceNodes.get(voice.id);
    if (!nodes) {
      const gain = this.ctx.createGain();
      const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : (this.ctx.createGain() as unknown as StereoPannerNode);
      gain.connect(panner);
      panner.connect(this.dryGain);
      panner.connect(this.reverbNode);
      nodes = { gain, panner };
      this.voiceNodes.set(voice.id, nodes);
    }

    const effectiveGain = voice.muted ? 0 : voice.volume;
    nodes.gain.gain.setTargetAtTime(effectiveGain, this.ctx.currentTime, 0.03);
    if (nodes.panner.pan) {
      nodes.panner.pan.setTargetAtTime(voice.pan, this.ctx.currentTime, 0.03);
    }
  }

  public updateVoices(voices: Voice[]) {
    const hasSolo = voices.some(v => v.solo);
    for (const v of voices) {
      this.registerVoice(v);
      const nodes = this.voiceNodes.get(v.id);
      if (nodes && this.ctx) {
        let gain = v.volume;
        if (v.muted) gain = 0;
        else if (hasSolo && !v.solo) gain = 0;
        nodes.gain.gain.setTargetAtTime(gain, this.ctx.currentTime, 0.03);
        if (nodes.panner.pan) {
          nodes.panner.pan.setTargetAtTime(v.pan, this.ctx.currentTime, 0.03);
        }
      }
    }
  }

  public playPreviewNote(pitch: number, instrument: InstrumentType, durationSec = 0.8, velocity = 90) {
    this.init();
    if (!this.ctx || !this.dryGain) return;
    this.renderNoteVoice(pitch, this.ctx.currentTime, durationSec, velocity, instrument, this.dryGain);
  }

  public playCandidatePreview(notes: NoteEvent[], bpm = 120, instrument: InstrumentType = 'neo_pluck') {
    this.init();
    if (!this.ctx || !this.dryGain) return;

    const secondsPerTick = 60 / (bpm * TICKS_PER_BEAT);
    const now = this.ctx.currentTime + 0.05;

    for (const n of notes) {
      const startSec = now + n.startTime * secondsPerTick;
      const durSec = Math.max(0.08, n.duration * secondsPerTick);
      this.renderNoteVoice(n.pitch, startSec, durSec, n.velocity, instrument, this.dryGain);
    }
  }

  public startPlayback(
    voices: Voice[],
    bpm: number,
    timeSignature: [number, number],
    startTick: number,
    loop: boolean,
    loopStartTick: number,
    loopEndTick: number,
    onTick: (tick: number) => void
  ) {
    this.init();
    if (!this.ctx) return;

    this.isPlaying = true;
    this.bpm = bpm;
    this.timeSignature = timeSignature;
    this.currentTick = startTick;
    this.loop = loop;
    this.loopStartTick = loopStartTick;
    this.loopEndTick = loopEndTick;
    this.onTickCallback = onTick;

    this.lastScheduledAudioTime = this.ctx.currentTime;
    this.lastScheduledTick = startTick;

    this.updateVoices(voices);

    const scheduler = () => {
      if (!this.isPlaying || !this.ctx) return;

      const lookahead = 0.25; // 250ms lookahead
      const secondsPerTick = 60 / (this.bpm * TICKS_PER_BEAT);
      const currentTime = this.ctx.currentTime;

      while (this.lastScheduledAudioTime < currentTime + lookahead) {
        const nextTick = this.lastScheduledTick;
        const noteWindowTicks = Math.round(lookahead / secondsPerTick);

        this.scheduleNotesInRange(voices, nextTick, nextTick + noteWindowTicks, this.lastScheduledAudioTime);

        if (this.isMetronomeOn) {
          this.scheduleMetronomeInRange(nextTick, nextTick + noteWindowTicks, this.lastScheduledAudioTime);
        }

        this.lastScheduledAudioTime += lookahead;
        this.lastScheduledTick += noteWindowTicks;

        if (this.loop && this.lastScheduledTick >= this.loopEndTick) {
          const excess = this.lastScheduledTick - this.loopEndTick;
          this.lastScheduledTick = this.loopStartTick + excess;
        }
      }

      const elapsedAudio = this.ctx.currentTime - (this.lastScheduledAudioTime - lookahead);
      this.currentTick = (this.lastScheduledTick - Math.round(lookahead / secondsPerTick)) + Math.round(elapsedAudio / secondsPerTick);
      if (this.loop && this.currentTick >= this.loopEndTick) {
        this.currentTick = this.loopStartTick;
      }
      if (this.onTickCallback) {
        this.onTickCallback(Math.max(0, this.currentTick));
      }

      this.animationFrameId = requestAnimationFrame(scheduler);
    };

    this.animationFrameId = requestAnimationFrame(scheduler);
  }

  private scheduleNotesInRange(voices: Voice[], startTick: number, endTick: number, audioStartTime: number) {
    if (!this.ctx) return;
    const secondsPerTick = 60 / (this.bpm * TICKS_PER_BEAT);

    for (const v of voices) {
      if (v.muted) continue;
      const vNodes = this.voiceNodes.get(v.id);
      const targetDest = vNodes ? vNodes.gain : this.dryGain!;

      for (const note of v.notes) {
        if (note.startTime >= startTick && note.startTime < endTick) {
          // Apply swing if note falls on offbeat (e.g. second 16th or 8th)
          let effectiveStartTick = note.startTime;
          const beatOffset = note.startTime % TICKS_PER_BEAT;
          if (beatOffset === TICKS_PER_BEAT / 2 && this.swingAmount > 0) {
            effectiveStartTick += Math.round((TICKS_PER_BEAT / 4) * this.swingAmount);
          }

          const noteOffsetSeconds = (effectiveStartTick - startTick) * secondsPerTick;
          const noteAudioStart = audioStartTime + noteOffsetSeconds;
          const noteDurationSeconds = Math.max(0.06, note.duration * secondsPerTick);

          this.renderNoteVoice(
            note.pitch + (v.octaveOffset || 0) * 12,
            noteAudioStart,
            noteDurationSeconds,
            note.velocity,
            v.instrument,
            targetDest
          );
        }
      }
    }
  }

  private scheduleMetronomeInRange(startTick: number, endTick: number, audioStartTime: number) {
    if (!this.ctx) return;
    const secondsPerTick = 60 / (this.bpm * TICKS_PER_BEAT);
    const ticksPerBar = this.timeSignature[0] * TICKS_PER_BEAT;

    const firstBeat = Math.ceil(startTick / TICKS_PER_BEAT) * TICKS_PER_BEAT;
    for (let t = firstBeat; t < endTick; t += TICKS_PER_BEAT) {
      const isDownbeat = t % ticksPerBar === 0;
      const offsetSec = (t - startTick) * secondsPerTick;
      this.click(audioStartTime + offsetSec, isDownbeat);
    }
  }

  private click(time: number, isDownbeat: boolean) {
    if (!this.ctx || !this.dryGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isDownbeat ? 1400 : 900, time);
    osc.frequency.exponentialRampToValueAtTime(100, time + 0.025);

    gain.gain.setValueAtTime(isDownbeat ? 0.35 : 0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.025);

    osc.connect(gain);
    gain.connect(this.dryGain);

    osc.start(time);
    osc.stop(time + 0.03);
  }

  public stopPlayback() {
    this.isPlaying = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public seek(tick: number) {
    this.currentTick = tick;
    if (this.ctx) {
      this.lastScheduledAudioTime = this.ctx.currentTime;
      this.lastScheduledTick = tick;
    }
  }

  // Instrument sound engine implementations
  private renderNoteVoice(
    pitch: number,
    startTime: number,
    duration: number,
    velocity: number,
    instrument: InstrumentType,
    destination: AudioNode
  ) {
    if (!this.ctx) return;
    const freq = midiToFrequency(pitch);
    const velFactor = (velocity / 127);

    switch (instrument) {
      case 'moog_sub_bass':
        this.synthMoogSubBass(freq, startTime, duration, velFactor, destination);
        break;
      case 'neo_pluck':
        this.synthNeoPluck(freq, startTime, duration, velFactor, destination);
        break;
      case 'vintage_rhodes':
        this.synthVintageRhodes(freq, startTime, duration, velFactor, destination);
        break;
      case 'french_harpsichord':
        this.synthHarpsichord(freq, startTime, duration, velFactor, destination);
        break;
      case 'grand_piano':
        this.synthGrandPiano(freq, startTime, duration, velFactor, destination);
        break;
      case 'pipe_organ':
        this.synthPipeOrgan(freq, startTime, duration, velFactor, destination);
        break;
      case 'chamber_strings':
        this.synthStrings(freq, startTime, duration, velFactor, destination);
        break;
      case 'solo_cello':
        this.synthCello(freq, startTime, duration, velFactor, destination);
        break;
      case 'flute_woodwind':
        this.synthWoodwind(freq, startTime, duration, velFactor, destination);
        break;
      case 'analog_poly':
      default:
        this.synthAnalogPoly(freq, startTime, duration, velFactor, destination);
        break;
    }
  }

  // 1. Moog Sub-Bass (Punchy sub with analog warmth)
  private synthMoogSubBass(freq: number, start: number, dur: number, vel: number, dest: AudioNode) {
    if (!this.ctx) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, start);
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq, start);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, start);
    filter.frequency.exponentialRampToValueAtTime(140, start + 0.15);

    const peak = 0.5 * vel;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.01);
    gain.gain.setValueAtTime(peak * 0.85, start + dur);
    gain.gain.linearRampToValueAtTime(0.0001, start + dur + 0.08);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc1.start(start);
    osc2.start(start);
    osc1.stop(start + dur + 0.1);
    osc2.stop(start + dur + 0.1);
  }

  // 2. Neo-Pluck (Modern fast melodic countermelody synth)
  private synthNeoPluck(freq: number, start: number, dur: number, vel: number, dest: AudioNode) {
    if (!this.ctx) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, start);
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(freq * 1.002, start);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(5500, start);
    filter.frequency.exponentialRampToValueAtTime(900, start + 0.25);
    filter.Q.value = 4;

    const peak = 0.45 * vel;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + Math.min(dur, 0.6));

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc1.start(start);
    osc2.start(start);
    osc1.stop(start + Math.min(dur, 0.6) + 0.05);
    osc2.stop(start + Math.min(dur, 0.6) + 0.05);
  }

  // 3. Vintage Rhodes (Warm tine with bell transient)
  private synthVintageRhodes(freq: number, start: number, dur: number, vel: number, dest: AudioNode) {
    if (!this.ctx) return;
    const tine = this.ctx.createOscillator();
    const body = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    tine.type = 'sine';
    tine.frequency.setValueAtTime(freq * 4, start); // tine overtone
    body.type = 'triangle';
    body.frequency.setValueAtTime(freq, start);

    const peak = 0.38 * vel;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.006);
    gain.gain.exponentialRampToValueAtTime(peak * 0.45, start + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur + 0.2);

    tine.connect(gain);
    body.connect(gain);
    gain.connect(dest);

    tine.start(start);
    body.start(start);
    tine.stop(start + dur + 0.25);
    body.stop(start + dur + 0.25);
  }

  // 4. French Harpsichord (Crisp quill pluck)
  private synthHarpsichord(freq: number, start: number, dur: number, vel: number, dest: AudioNode) {
    if (!this.ctx) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, start);
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(freq * 2, start);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4800, start);
    filter.frequency.exponentialRampToValueAtTime(1400, start + 0.25);

    const peak = 0.35 * vel;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.004);
    gain.gain.exponentialRampToValueAtTime(peak * 0.4, start + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + Math.min(dur, 1.2));

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc1.start(start);
    osc2.start(start);
    osc1.stop(start + Math.min(dur, 1.2) + 0.05);
    osc2.stop(start + Math.min(dur, 1.2) + 0.05);
  }

  // 5. Concert Grand Piano
  private synthGrandPiano(freq: number, start: number, dur: number, vel: number, dest: AudioNode) {
    if (!this.ctx) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, start);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.008, start);

    const peak = 0.4 * vel;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(peak * 0.5, start + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur + 0.2);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(dest);

    osc1.start(start);
    osc2.start(start);
    osc1.stop(start + dur + 0.25);
    osc2.stop(start + dur + 0.25);
  }

  // 6. Pipe Organ
  private synthPipeOrgan(freq: number, start: number, dur: number, vel: number, dest: AudioNode) {
    if (!this.ctx) return;
    const f1 = this.ctx.createOscillator();
    const f2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    f1.type = 'sine';
    f1.frequency.setValueAtTime(freq, start);
    f2.type = 'sine';
    f2.frequency.setValueAtTime(freq * 2, start);

    const peak = 0.3 * vel;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.03);
    gain.gain.setValueAtTime(peak, start + dur);
    gain.gain.linearRampToValueAtTime(0.0001, start + dur + 0.08);

    f1.connect(gain);
    f2.connect(gain);
    gain.connect(dest);

    f1.start(start);
    f2.start(start);
    f1.stop(start + dur + 0.1);
    f2.stop(start + dur + 0.1);
  }

  // 7. Chamber Strings
  private synthStrings(freq: number, start: number, dur: number, vel: number, dest: AudioNode) {
    if (!this.ctx) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, start);
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq * 1.004, start);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, start);

    const peak = 0.28 * vel;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.06);
    gain.gain.setValueAtTime(peak, start + dur);
    gain.gain.linearRampToValueAtTime(0.0001, start + dur + 0.15);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc1.start(start);
    osc2.start(start);
    osc1.stop(start + dur + 0.2);
    osc2.stop(start + dur + 0.2);
  }

  // 8. Solo Cello
  private synthCello(freq: number, start: number, dur: number, vel: number, dest: AudioNode) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, start);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, start);
    filter.Q.value = 3;

    const peak = 0.35 * vel;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.05);
    gain.gain.setValueAtTime(peak, start + dur);
    gain.gain.linearRampToValueAtTime(0.0001, start + dur + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(start);
    osc.stop(start + dur + 0.15);
  }

  // 9. Woodwind
  private synthWoodwind(freq: number, start: number, dur: number, vel: number, dest: AudioNode) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start);

    const peak = 0.35 * vel;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.02);
    gain.gain.setValueAtTime(peak, start + dur);
    gain.gain.linearRampToValueAtTime(0.0001, start + dur + 0.06);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(start);
    osc.stop(start + dur + 0.1);
  }

  // 10. Analog Poly
  private synthAnalogPoly(freq: number, start: number, dur: number, vel: number, dest: AudioNode) {
    if (!this.ctx) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, start);
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(freq * 0.5, start);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, start);
    filter.frequency.exponentialRampToValueAtTime(800, start + dur);

    const peak = 0.32 * vel;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(peak * 0.7, start + 0.1);
    gain.gain.setValueAtTime(peak * 0.7, start + dur);
    gain.gain.linearRampToValueAtTime(0.0001, start + dur + 0.15);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc1.start(start);
    osc2.start(start);
    osc1.stop(start + dur + 0.2);
    osc2.stop(start + dur + 0.2);
  }
}

export const audioEngine = new SoundEngine();
