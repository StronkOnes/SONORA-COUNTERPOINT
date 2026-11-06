# SONORA Counterpoint Studio
## Product Vision, Technical Specification & Development Blueprint

**Product family:** SONORA  
**Product:** Counterpoint Studio  
**Category:** Intelligent composition and multi-voice music creation  
**Initial platform:** Desktop-friendly web application  
**Technology:** React + TypeScript + Vite + MUI  
**Future platform:** Native C++ / JUCE engine, with potential VST3 integration  
**Musical foundation:** *Gratis ad Parnassum: A Free Workbook for 18th-Century Counterpoint* by Jonathan Kulp (2009)

---

# 1. Product vision

Counterpoint Studio is an intelligent musical composition environment for creating independent, expressive and interlocking musical lines.

A musician should be able to:

- Import a melody, MIDI file or musical phrase.
- Give the app a chord progression or harmonic foundation.
- Generate complementary musical voices.
- Create countermelodies that answer, imitate, contrast with or develop the original melody.
- Generate bass lines and inner voices.
- Transform a simple idea into more elaborate multi-voice arrangements.
- Experiment with suspensions, sequences, chromaticism and invertible counterpoint.
- Edit every generated note and phrase.
- Export individual voices or complete arrangements as MIDI.

The product must produce music that sounds intentionally composed.

It must not simply stack notes in thirds, duplicate a melody at another pitch, or generate random notes that happen to fit a scale.

**The defining principle: every voice must be musically convincing on its own, and the combination must be convincing as a whole.**

Counterpoint Studio should be useful to classical composers, producers, beatmakers, keyboardists, songwriters, film composers and musicians exploring sophisticated musical arrangements.

# 2. Musical foundation

The application draws its historical counterpoint foundation from Jonathan Kulp's *Gratis ad Parnassum*.

The workbook provides several particularly important principles.

## 2.1 Independent melodies

Each voice should have:

- A pleasing melodic contour.
- A clear sense of direction.
- A recognisable high or low point where appropriate.
- More stepwise motion than excessive leaps.
- Rhythmic continuity.
- Logical treatment of tendency tones.

The system must evaluate each voice independently before evaluating the combined arrangement.

## 2.2 Independence between voices

The workbook identifies independence through:

- Contrasting melodic contours.
- Peaks and valleys occurring at different times.
- Contrary motion.
- Musical distinction between the voices.

The application must actively encourage these characteristics.

For example, when a lead melody rises, a countermelody might descend, remain relatively stationary or develop a contrasting rhythmic figure.

## 2.3 Coherence between voices

Independence does not mean unrelated music.

Voices must still share enough harmonic and melodic context to sound as though they belong together.

The engine must balance:

1. Melodic independence.
2. Harmonic compatibility.
3. Rhythmic interaction.
4. Direction and resolution.
5. Overall musical character.

## 2.4 Historical counterpoint techniques

The initial musical rule library must support:

- First species: 1:1.
- Second species: 2:1.
- Third species: 3:1.
- Fourth species: 4:1.
- Mixed-species writing.
- Chromaticism.
- Passing tones.
- Neighbour tones.
- Appoggiaturas.
- Escape tones.
- Anticipations.
- Suspensions.
- Sequences.
- Invertible counterpoint.
- Two-part inventions.
- Fugue-related techniques.

The application must distinguish between historical counterpoint conventions and modern creative freedom. A historically incorrect event is not necessarily a bad musical decision in a modern production.

## 2.5 Important licensing requirement

The source workbook is released under Creative Commons Attribution-ShareAlike 3.0.

Provide appropriate attribution to Jonathan Kulp and make the licence terms clear wherever adapted workbook material is distributed.

Keep SONORA's original software, code, interface, original exercises and independently created musical content clearly distinguished from material adapted from the workbook. Obtain legal review of the intended distribution model before shipping adapted material under a different licence.

Do not copy the workbook's exercises, notation examples or text into the commercial application without implementing the appropriate attribution and ShareAlike obligations.

---

# 3. The central user experience

The application should revolve around one main workspace.

## 3.1 Main workspace

The interface should have five main areas:

**A. Top transport and project bar**
- Project name.
- Play and stop.
- Tempo.
- Time signature.
- Metronome.
- Undo and redo.
- Save.
- Export.
- Audio output settings.

**B. Main composition area**
- Synchronised notation and piano-roll views.
- Multiple independent tracks.
- Timeline and bar markers.
- Note editing.
- Phrase selection.
- Loop playback.
- Selection and editing tools.

**C. Voice and track panel**
- Lead.
- Countermelody.
- Bass.
- Inner voice 1.
- Inner voice 2.
- Additional voices.

Each voice has independent controls for:
- Mute.
- Solo.
- Volume.
- Pan.
- Instrument.
- Register.
- Colour.
- Visibility.
- Generation settings.

**D. Counterpoint intelligence panel**

This is where the user controls how the music develops.

It should contain:
- Generation mode.
- Number of voices.
- Musical approach.
- Rhythm density.
- Melodic independence.
- Harmonic strictness.
- Complexity.
- Register.
- Musical character.

**E. Analysis and suggestions panel**

Display:
- Key and tonal centre.
- Chord analysis.
- Interval relationships.
- Voice-leading analysis.
- Detected motifs.
- Dissonances and resolutions.
- Cadences.
- Musical suggestions.

The user must be able to hide panels and resize the workspace.

# 4. The signature feature: Counterpoint Generator

This is the heart of the product.

The user supplies musical material and chooses how the application should respond.

## 4.1 Input sources

Support:

1. MIDI file import.
2. MIDI drag-and-drop.
3. Notes entered in the piano roll.
4. Notes entered in notation.
5. Recorded MIDI input.
6. Manually entered chord progressions.
7. A melody with no chord information.
8. Multiple existing voices.

For the initial version, MIDI import and manual note entry are essential.

Audio-to-MIDI transcription should be treated as a later feature rather than a dependency for the first release.

## 4.2 Generation workflow

The workflow should be:

1. Import or create a musical phrase.
2. Analyse the input.
3. Detect its pitches, rhythm, key, tonal centre and harmonic implications.
4. Identify motifs, phrase boundaries and cadential opportunities.
5. Choose the number of additional voices.
6. Select a generation approach.
7. Generate several musical alternatives.
8. Audition each alternative.
9. Edit or regenerate individual phrases.
10. Export the result.

Never overwrite the user's original material without permission.

## 4.3 Voice count

Support:

- 2 voices.
- 3 voices.
- 4 voices.
- 5 voices.
- 6 voices.
- 8 voices.

The interface should make it easy to add or remove voices after generation.

The engine must understand that additional voices increase the complexity of the musical problem. It must not merely duplicate existing material.

## 4.4 Voice roles

Each generated voice can have a musical role:

| Role | Function |
|---|---|
| Lead | Main melodic idea |
| Countermelody | Independent answering or contrasting melody |
| Bass | Harmonic foundation and melodic bass movement |
| Inner voice | Completes and enriches the texture |
| Upper voice | Adds melodic or harmonic movement |
| Texture voice | Creates rhythmic or contrapuntal detail |
| Imitative voice | Repeats or develops a musical motif |
| Fugal voice | Participates in a fugal texture |

Users must be able to change a voice's role without deleting its notes.

# 5. Generation modes

These modes must have genuinely different musical behaviour.

## 5.1 Independent counterpoint

Generate a melody that has its own direction, rhythm and contour while remaining harmonically coherent with the source.

Controls:
- Independence.
- Rhythmic contrast.
- Contrary motion.
- Register.
- Melodic activity.
- Harmonic strictness.

This should be one of the strongest modes.

## 5.2 Answering melody

Create a musical response to the source phrase.

The generated voice should:
- Identify phrase endings.
- Respond in the spaces between phrases.
- Use related motifs.
- Develop rather than merely repeat the source.
- Create a sense of musical conversation.

Provide response timing options:
- Immediate response.
- Half-bar response.
- One-bar response.
- Phrase-ending response.
- User-defined response position.

## 5.3 Imitation

Create a voice that imitates the source material.

Options:
- Exact imitation.
- Rhythmic imitation.
- Intervallic imitation.
- Inversion.
- Rhythmic augmentation.
- Rhythmic diminution.
- Delayed imitation.
- Free imitation.

The user should be able to specify the interval of entry and the delay.

## 5.4 Invertible counterpoint

Create two voices that remain musically effective when their registers are exchanged.

The engine must evaluate the resulting interval relationships after inversion.

The user should be able to:
- Select the voices.
- Set the inversion interval.
- Generate a compatible countermotive.
- Preview both original and inverted arrangements.
- Compare the results.

Do not claim that a passage is invertible unless the engine has evaluated the actual transposition and voice relationships.

## 5.5 Sequential counterpoint

Develop a motif through sequential repetition.

Options:
- Ascending sequence.
- Descending sequence.
- Diatonic sequence.
- Chromatic sequence.
- Modulating sequence.
- User-defined interval pattern.

The generated sequence should preserve recognisable musical identity while developing the passage.

## 5.6 Suspension generator

Generate and identify suspensions.

Initial suspension types:
- 4–3.
- 7–6.
- 2–3.

The engine must understand preparation, suspension and resolution.

Allow users to apply suspensions to compatible existing passages or generate new material containing them.

## 5.7 Contrary-motion generator

Create an independent voice that moves in the opposite direction to the source where musically appropriate.

Avoid making contrary motion an inflexible rule. The result must still sound natural.

## 5.8 Fugal development

Create material inspired by fugue techniques.

Support:
- Subject.
- Answer.
- Countersubject.
- Subject entries.
- Imitative entries.
- Episodes.
- Sequential development.
- Voice entry planning.
- Multiple-voice texture.

The initial release should support useful fugal building blocks and short expositions, not promise a fully autonomous fugue composer.

# 6. The generation intelligence engine

This must be a real musical engine, not a random note generator.

Use a constraint-based candidate-generation system combined with weighted musical evaluation.

## 6.1 Analysis stage

Before generating anything, analyse the source.

Identify:

- MIDI pitch.
- Note duration.
- Onset position.
- Rhythm patterns.
- Melodic intervals.
- Contour.
- Register.
- Repeated motifs.
- Phrase boundaries.
- Possible cadences.
- Key and tonal centre confidence.
- Chord or harmonic implications.

Every analysis should carry confidence information.

When the system is uncertain about a key or harmony, it should expose that uncertainty instead of silently inventing certainty.

## 6.2 Candidate generation

Generate possible notes and phrases based on:

- Current harmonic context.
- Melodic direction.
- Previous notes.
- Next phrase destination.
- Rhythmic position.
- Voice register.
- Selected generation mode.
- Historical or modern rule profile.

Generate multiple candidates rather than committing immediately to the first valid note.

## 6.3 Musical scoring

Evaluate candidates using weighted criteria.

Suggested scoring categories:

| Category | What it evaluates |
|---|---|
| Melodic quality | Contour, leaps, direction and continuity |
| Harmonic compatibility | Relationship with the other voices |
| Independence | Distinct melodic behaviour |
| Voice leading | Smooth and purposeful movement |
| Rhythm | Rhythmic continuity and interaction |
| Dissonance | Appropriate preparation and resolution |
| Cadence | Strength and musical direction |
| Motif development | Coherent reuse and transformation |
| Register | Practical and audible separation |
| Style | Compatibility with the selected musical approach |

Weights must be adjustable internally and eventually exposed through advanced settings.

The engine must not treat every musical rule as an absolute prohibition.

## 6.4 Backward planning

The engine should support planning from the end of a phrase.

A strong cadence can be established first, then the preceding material generated to lead towards it.

This reflects a practical compositional technique in the workbook and can help avoid phrases that wander without direction.

## 6.5 Avoid repetitive results

The generator must recognise when it is repeating itself.

Track:
- Repeated melodic fragments.
- Repeated interval patterns.
- Repeated rhythmic patterns.
- Repeated phrase endings.
- Excessive sequential repetition.

Allow deliberate repetition when the selected mode calls for it.

## 6.6 Generation quality and reproducibility

Every generation should have:
- A reproducible seed.
- A unique generation ID.
- A list of generation settings.
- A score breakdown.
- A record of any rules intentionally relaxed.

The same input, seed and settings should produce the same result.

---

# 7. Musical rule profiles

A major product advantage will be the ability to move between strict counterpoint and modern creative composition.

Provide three primary profiles.

## 7.1 Strict 18th-century mode

Prioritise historical counterpoint conventions.

Include:
- Species-based rhythmic relationships.
- Consonance and dissonance treatment.
- Voice independence.
- Parallel perfect interval checks.
- Voice crossing and spacing.
- Tendency-tone resolution.
- Cadential movement.
- Appropriate use of passing tones and suspensions.

The engine should explain why a passage violates a selected rule.

## 7.2 Flexible classical mode

Retain strong voice-leading principles but permit more expressive chromaticism and rhythmic freedom.

## 7.3 Modern creative mode

Prioritise musical expression, texture and production usefulness.

Allow:
- Extended dissonances.
- Unusual interval combinations.
- Rhythmic displacement.
- Chromatic movement.
- Register overlap where intentional.
- Unresolved tensions.
- Modern harmonic vocabulary.

The user must be able to switch profiles and regenerate without losing the original arrangement.

## 7.4 Custom mode

Advanced users can adjust individual constraints.

Examples:
- Allow parallel fifths.
- Restrict consecutive perfect intervals.
- Increase contrary motion.
- Allow more chromatic notes.
- Increase rhythmic activity.
- Restrict maximum melodic leap.
- Adjust voice spacing.
- Increase or reduce dissonance.

Always distinguish between a strict rule violation, a stylistic preference and a warning.

---

# 8. Chord and harmonic analysis

Counterpoint Studio must understand harmony without reducing every composition to chord blocks.

Features:
- Key detection.
- Scale identification.
- Chord recognition.
- Roman numeral analysis.
- Bass movement analysis.
- Harmonic rhythm.
- Secondary dominants.
- Chromatic pitches.
- Modulation suggestions.
- Cadence detection.

For uncertain results, show multiple possible interpretations.

The user should be able to override the detected harmony manually.

The system should support minor-key melodic and harmonic alterations, including leading-tone behaviour.

---

# 9. Editing and composition tools

Generated material must remain completely editable.

## 9.1 Piano roll

Provide:
- Click-to-add notes.
- Drag-to-move.
- Resize notes.
- Multi-note selection.
- Quantisation.
- Snap settings.
- Velocity editing.
- Note duplication.
- Transposition.
- Scale highlighting.
- Octave movement.
- Undo and redo.

Support common rhythmic values and tuplets.

## 9.2 Notation editor

Provide synchronised notation editing.

Support:
- Treble clef.
- Bass clef.
- Grand staff.
- Key signatures.
- Time signatures.
- Accidentals.
- Note values.
- Rests.
- Ties.
- Dots.
- Tuplets.
- Bar lines.
- Basic dynamics and articulations.

Notation editing must update the piano roll and vice versa.

Do not attempt to build a complete professional engraving application in the first release. Prioritise correct readable notation for the features the application actually supports.

## 9.3 Phrase editing

Allow users to select a phrase and:
- Regenerate it.
- Extend it.
- Shorten it.
- Create a variation.
- Invert it.
- Transpose it.
- Change its rhythmic density.
- Change its melodic contour.
- Make it more independent.
- Make it more harmonically conservative.

The user must be able to lock phrases and preserve them during regeneration.

## 9.4 Motif library

Create a library of musical motifs extracted from the project.

Store:
- Original motif.
- Rhythm.
- Interval sequence.
- Contour.
- Source voice.
- Occurrences.
- Transformations.

Users should be able to drag motifs into another voice or request new variations.

---

# 10. Sound and playback

The application must be musical and enjoyable to use.

Provide immediate playback of all voices.

Initial requirements:
- Built-in sound playback.
- Separate voice volumes.
- Mute and solo.
- Instrument selection.
- Tempo adjustment.
- Metronome.
- Loop playback.
- Count-in.
- Playback from selection.
- Playback from bar.
- A/B comparison.

Use a practical instrument sound library or soundfont-based playback system.

Keep the playback engine separate from the composition and generation engine.

The architecture must allow a future native audio engine without rewriting the musical domain model.

---

# 11. MIDI and production workflow

This is a composition tool intended to fit into real music production workflows.

## 11.1 MIDI import

Support:
- Standard MIDI files.
- Multiple tracks.
- Multiple channels.
- Tempo maps.
- Time signatures where available.
- Note velocity.
- Note durations.
- Track names.

Allow the user to choose which tracks become the source material.

## 11.2 MIDI export

Support:
- Individual voice export.
- Complete multi-track MIDI export.
- Track names.
- Tempo.
- Time signature.
- Note velocity.
- Separate instrument tracks.
- Selected phrase export.

Preserve musical timing accurately.

## 11.3 Drag-and-drop

Allow users to drag individual generated voices into compatible DAWs where supported.

Provide standard MIDI file export as a reliable fallback.

## 11.4 Future DAW integration

Keep the core engine independent of the web interface.

Future possibilities:
- JUCE VST3.
- MIDI effect plugin.
- Standalone JUCE application.
- DAW MIDI routing.
- Host tempo synchronisation.
- Host transport.
- Parameter automation.

Do not make DAW plugin integration a dependency for the first release.

---

# 12. User interface and visual identity

## 12.1 Design direction

Create a premium SONORA composition environment.

The interface should feel like a professional musical instrument, not a generic AI dashboard.

Visual direction:
- Deep charcoal and near-black backgrounds.
- Restrained silver and grey typography.
- Subtle amber accents.
- Clean spacing.
- Precise alignment.
- Clear hierarchy.
- Minimal unnecessary decoration.

Use MUI components and a carefully designed theme.

Do not use Tailwind.

## 12.2 Main navigation

Suggested navigation:

- Studio.
- Projects.
- Motifs.
- Presets.
- Settings.

The main workspace should receive the majority of the screen.

## 12.3 Generation panel

The generation panel should be a distinctive product feature.

It should feel like a musical instrument with controls rather than a long settings form.

Include:
- Voice count.
- Generation mode.
- Musical profile.
- Independence.
- Rhythmic activity.
- Complexity.
- Register.
- Generate.
- Generate variations.

Provide a clear visual indication of locked voices and phrases.

## 12.4 Generated alternatives

Show multiple generated alternatives with:
- Name or variation number.
- Short musical description.
- Quality indicators.
- Play button.
- Apply button.
- Regenerate button.

Never present a numerical quality score as proof that a passage is musically excellent. Use the score as an internal ranking aid and explain its criteria.

---

# 13. Technical architecture

## 13.1 Technology stack

Frontend:
- React.
- TypeScript.
- Vite.
- Material UI.
- Zustand or an equivalent lightweight state solution.

Music data:
- Custom TypeScript domain model.
- MIDI parser and writer.
- Music theory and analysis modules.
- Notation rendering library or custom notation layer.
- Custom piano-roll component.

Audio:
- Web Audio API for initial playback.
- Soundfont or sample-based instrument playback.
- MIDI playback and scheduling.

Testing:
- Vitest.
- React Testing Library.
- Playwright for end-to-end workflows.

Persistence:
- IndexedDB for local projects.
- JSON project format.
- MIDI import/export.

The first release should work locally without requiring a user account or cloud service.

## 13.2 Architecture principle

Keep the following layers separate:

1. User interface.
2. Project and composition model.
3. Music theory engine.
4. Counterpoint rule engine.
5. Generation engine.
6. MIDI import/export.
7. Playback engine.
8. Persistence.

The UI must never contain the actual counterpoint-generation rules.

## 13.3 Suggested project structure

```text
src/
  app/
    App.tsx
    routes/
    theme/
    providers/

  components/
    transport/
    piano-roll/
    notation/
    track-panel/
    generation-panel/
    analysis-panel/
    dialogs/

  features/
    projects/
    composition/
    generation/
    analysis/
    motifs/
    midi/
    playback/

  music-core/
    theory/
      notes/
      intervals/
      scales/
      keys/
      chords/
      harmony/

    analysis/
      melody-analysis/
      rhythm-analysis/
      motif-detection/
      cadence-detection/
      phrase-detection/

    counterpoint/
      species/
      consonance/
      dissonance/
      suspensions/
      voice-leading/
      invertible/
      sequences/

    generation/
      candidates/
      constraints/
      scoring/
      search/
      variation/
      orchestration/

  audio/
    playback/
    instruments/
    scheduler/

  data/
    persistence/
    project-format/

  workers/
    analysis.worker.ts
    generation.worker.ts

  types/
    music.ts
    project.ts
    generation.ts
    analysis.ts

  tests/
```

Use Web Workers for expensive analysis and generation so that the interface remains responsive.

---

# 14. Core data model

Design the data model carefully before building the UI.

## 14.1 Note event

Each note should include:

- Stable ID.
- MIDI pitch.
- Start position in ticks.
- Duration in ticks.
- Velocity.
- Channel.
- Optional articulation.
- Optional notation metadata.

Use integer musical timing internally. Do not make floating-point seconds the authoritative representation of musical position.

## 14.2 Voice

Each voice should include:

- Stable ID.
- Name.
- Role.
- Instrument.
- Register range.
- MIDI channel.
- Note events.
- Mute state.
- Solo state.
- Volume.
- Pan.
- Colour.
- Generation settings.

## 14.3 Project

Each project should include:

- Project ID.
- Name.
- Tempo map.
- Time signatures.
- Key signature.
- Voices.
- Motifs.
- Generation history.
- Analysis results.
- Playback settings.
- Project metadata.

## 14.4 Generation record

Store:
- Input voice IDs.
- Generated voice IDs.
- Generation mode.
- Musical profile.
- Settings.
- Random seed.
- Candidate ranking.
- Rule warnings.
- Timestamp.

This allows users to revisit previous generations.

---

# 15. Development roadmap

Build the application in controlled stages. Do not attempt every feature at once.

## Phase 1 — Foundation and workspace

Deliver:
- React + TypeScript + Vite + MUI project.
- Theme and layout.
- Project creation.
- Main workspace.
- Transport controls.
- Voice panel.
- Piano roll.
- Basic note editing.
- Local persistence.
- Undo and redo.

**Acceptance test:** Create a project, add notes to two voices, play them together, save, reload and continue editing.

## Phase 2 — MIDI foundation

Deliver:
- MIDI import.
- Track selection.
- MIDI parsing.
- MIDI export.
- Multi-track handling.
- Tempo and time signature handling.
- Individual voice export.

**Acceptance test:** Import a multi-track MIDI file, edit one track and export the project without losing timing or track separation.

## Phase 3 — Music analysis engine

Deliver:
- Note and interval analysis.
- Melodic contour.
- Rhythm analysis.
- Key and scale detection.
- Chord recognition.
- Motif detection.
- Phrase boundaries.
- Cadence detection.

**Acceptance test:** Import a known MIDI melody and display useful analysis, including confidence where the result is uncertain.

## Phase 4 — Counterpoint rule engine

Deliver:
- First-species checks.
- Second-species checks.
- Third-species checks.
- Fourth-species checks.
- Consonance and dissonance classification.
- Parallel perfect interval detection.
- Voice crossing and spacing checks.
- Melodic leap analysis.
- Tendency-tone handling.
- Passing and neighbour tone recognition.
- Suspension detection and validation.

**Acceptance test:** Build a test suite containing valid and invalid musical examples. Each rule must be tested independently, including edge cases.

## Phase 5 — First generation engine

Deliver:
- Two-voice generation.
- Independent counterpoint.
- Basic contrary motion.
- Rhythmic contrast.
- Multiple candidate generation.
- Candidate ranking.
- Seed reproducibility.
- Strict and flexible profiles.

**Acceptance test:** Supply a melody and generate several distinct, playable and editable countermelodies. Each generated voice must pass its applicable checks and sound musically coherent.

## Phase 6 — Advanced counterpoint

Deliver:
- Imitation.
- Inversion.
- Rhythmic augmentation and diminution.
- Sequential development.
- Chromaticism.
- Suspensions.
- Invertible counterpoint.
- Motif library.

**Acceptance test:** Generate and audition examples of each technique, with the correct musical relationships preserved.

## Phase 7 — Multi-voice composition

Deliver:
- Three-, four- and six-voice generation.
- Eight-voice support where practical.
- Bass and inner voice generation.
- Multi-voice scoring.
- Voice interaction analysis.
- Register management.
- Multi-voice MIDI export.

**Acceptance test:** Generate a multi-voice arrangement from a supplied melody and audition every voice independently and together.

## Phase 8 — Fugal tools and composition development

Deliver:
- Subject and answer tools.
- Countersubject generation.
- Entry planning.
- Episode development.
- Fugal texture generation.
- Short exposition generation.

**Acceptance test:** Generate a short, editable fugal exposition with distinguishable voice entries and meaningful motif development.

## Phase 9 — Notation and professional polish

Deliver:
- Synchronised notation.
- Notation editing.
- Better phrase editing.
- Motif drag-and-drop.
- Preset management.
- A/B comparison.
- Performance and accessibility improvements.

**Acceptance test:** Edit a passage in notation and confirm that the piano roll, playback and MIDI export reflect the same musical content.

## Phase 10 — Native engine preparation

Deliver:
- Stable engine interfaces.
- Engine-independent project model.
- DSP and playback separation.
- Performance profiling.
- Native migration documentation.

Future work:
- C++ music engine.
- JUCE standalone application.
- VST3 integration.
- DAW host synchronisation.

---

# 16. Testing strategy

Musical correctness is as important as software correctness.

Build automated tests for:

- Interval calculations.
- Enharmonic spelling.
- Key detection.
- Chord recognition.
- Scale membership.
- Voice-leading.
- Parallel fifths and octaves.
- Species rhythm relationships.
- Dissonance preparation and resolution.
- Tendency tones.
- Cadences.
- Invertible counterpoint.
- Sequence transformations.
- MIDI timing.
- MIDI import/export.
- Generation reproducibility.

Create a collection of known musical test cases.

For every generated passage, test:
1. Does each voice make melodic sense?
2. Are the voices harmonically coherent?
3. Are the selected rules respected?
4. Does the rhythm make sense?
5. Are the voices sufficiently independent?
6. Does the passage have musical direction?
7. Does it sound good when played?

A passage that passes a list of rules is not automatically good music. Human listening tests remain essential.

---

# 17. First-release scope

The first usable release must prioritise a complete, functioning workflow.

### Must have

- Project creation.
- Piano roll.
- Two or more voices.
- MIDI import.
- MIDI export.
- Playback.
- Melody analysis.
- Key and chord analysis.
- Independent counterpoint generation.
- Contrary motion.
- Basic imitation.
- Multiple generation alternatives.
- Editing and regeneration.
- Local project saving.

### Should have

- Notation view.
- First- and second-species checks.
- Motif detection.
- Phrase-aware generation.
- Basic suspensions.
- Three- and four-voice generation.

### Later

- Advanced fugue generation.
- Full eight-voice orchestration.
- Advanced engraving.
- Audio transcription.
- JUCE VST3.
- DAW host integration.

Do not delay the first release for advanced features.

---

# 18. Important implementation rules for the coding agent

1. Build real working functionality. No fake buttons, placeholder analysis or simulated generation.
2. Never use random scale notes as a substitute for counterpoint generation.
3. Separate the music engine from React components.
4. Keep every generated note editable.
5. Preserve original user material.
6. Use stable IDs for projects, voices, notes and motifs.
7. Use deterministic generation when a seed is supplied.
8. Use Web Workers for computationally expensive work.
9. Keep musical timing precise.
10. Provide meaningful error messages.
11. Use MUI, not Tailwind.
12. Prioritise local processing and local project storage.
13. Do not require paid APIs for core musical functionality.
14. Never claim that a musical rule has been checked unless the relevant analysis actually ran.
15. Maintain automated tests as each engine module is developed.
16. Document limitations honestly.
17. Do not build a collection of disconnected demo screens. Every screen must connect to the actual project and music model.

---

# 19. Product identity and differentiation

Counterpoint Studio should not be marketed as another AI melody generator.

Its identity is **intelligent musical interaction**.

It should help a producer discover what happens when several independent musical ideas work together.

The most important differentiators are:

- Genuine contrapuntal generation.
- Independent voice development.
- Motif-aware composition.
- Historical and modern rule profiles.
- Editable multi-voice arrangements.
- Invertible counterpoint.
- Imitation and fugal development.
- Production-ready MIDI export.

The Academy product can later reuse the same music theory, analysis and counterpoint engine to teach users why a passage works or does not work.

Counterpoint Studio should therefore own the shared engine's production-facing capabilities, while keeping the underlying musical logic reusable.

---

# 20. Definition of success

The first major milestone is simple:

A musician imports an eight-bar melody, selects four voices, chooses Independent Counterpoint, and generates several alternatives.

The musician can audition the alternatives, hear how the voices interact, solo each line, edit individual notes, regenerate a phrase and export the result as a multi-track MIDI file.

The result should sound like music that a thoughtful composer might actually want to use.

**That is the standard Counterpoint Studio must meet.**

SONORA Counterpoint Studio should make sophisticated musical composition more accessible without removing the musician's creative control.