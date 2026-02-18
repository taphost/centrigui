# Centrigui

Centrigui is a browser-based recreation inspired by the sentry-gun/turret console from James Cameron’s *Aliens* (1986), with a specific nod to the Extended Edition scenes that show the automatic sentry gun turrets in the corridors and armory. It channels the flickering GRID notebook computer that the Colonial Marines use to monitor weapons, sensors, and targeting—complete with yellow glow, capacitive gauges, and the retro GRID computer aesthetic. The goal is to reanimate that analog-heavy, synth-laced control room drama: a welcome terminal that feels like the logging console of a manned sentry gun battery, plus a deeper cockpit-style interface where the team can watch round counts, time-to-fire, temperature/recorded levels, and quick-select the same status modes as in the film’s prop. Centrigui mirrors that cinematic interface by pairing the welcome terminal art from the film’s turret rooms with an instrumental weapon-system dashboard, layering the Extended Cut’s boot diagnostics and tactile noise that make the sentry guns feel alive.

## Features

Everything here is built to make you feel like you're actually sitting in front of a colonial marine UA 571-C command console. We've nailed that classic GRID aesthetic with a sharp yellow-on-black CRT look, including the scanlines and flicker you'd expect from 80s hardware. You can dive into the various system modes, arm the weapon, and mess with the IFF or target profiles while tracking live data on the temperature and motion gauges in real-time. To keep the immersion tight, we've added military-grade tooltips that break down every control in pure combat jargon, all tied together by a background soundscape of mechanical hums and system beeps.

## Installation & Usage

1. Clone or download the repository.
2. Ensure the `fonts/VCROSDMono.woff2` and `sounds/` assets are present.
3. Open `index.html` in a modern browser (Chrome/Edge recommended for full filter support).
4. Click **ENTER SYSTEM** to initiate the boot sequence.

## Folder structure

```
.
├── css/styles.css – core visual styles for the CRT-inspired terminal and dashboard UI.
├── fonts/         – bundled `VCROSDMono` font that emulates the GRID notebook typography.
├── js/
│   ├── grid.js       – creates the animated perspective grid seen on the landing page.
│   ├── canvasGrid.js – renders the fine CRT scanline/pixel overlay across all screens.
│   ├── script.js     – manages weapon system logic, gauges, and interactive UI for the dashboard.
│   └── tooltip.js    – dynamic global tooltip handler for immersive military jargon briefing.
├── sounds/        – `.opus` clips for button clicks, warnings, and ambience.
├── index.html     – landing terminal with animated ASCII art and boot sequence.
└── ui.html        – full command deck with gauges, interactive toggles, and CRT overlays.
```

## Usage

1. Open `index.html` in any modern browser. The grid animation, ASCII art, and boot text load automatically.
2. Click `ENTER` to jump to `ui.html`, then interact with the controls to hear the sound fx and watch the weapon system logic respond.
3. No build step is required—everything runs in pure HTML/CSS/JS.

## Tech Stack

- **HTML5 & CSS3**: Utilizes custom properties for the amber/yellow glow, CRT scanline effects, and animations.
- **Vanilla JavaScript**: Pure functional logic with no external dependencies or frameworks.
- **HTML5 Canvas**: High-performance rendering for the perspective grid and the CRT pixel overlay.
- **Web Audio API**: Low-latency playback for the weapon system sound effects and ambient noise.

## Browser support

- **Chrome** 57+, **Edge** 16+, **Firefox** 52+, **Safari** 10.1+ (Support for CSS Grid, ES6, and Opus).
- Audio uses `.opus` clips exclusively; no fallback formats are provided.
- **Note**: The interface is optimized for a fixed resolution of 1024x800.

## License

This repository is licensed under the MIT License.

## Credits

- Inspired by the sentry gun/turret props from *Aliens* (1986) Extended Edition (20th Century Fox/Disney, James Cameron).
- GRID notebook vibe nods to the film’s in-universe terminal look, especially its capacitive gauges and layout.
- Sounds mix public-domain synths and custom layers to keep the ambiance original.
- Font: `VCROSDMono` used per its existing license.
