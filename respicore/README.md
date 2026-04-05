# RespiCore V.2

**Acoustic Respiratory Triage Platform** — converts a 10-second cough recording into a clinical-grade analysis, detecting asthma, COPD, bronchitis, and anomalous patterns with on-device AI inference.

> Research prototype — not a clinical diagnostic device.

## Features

- **Live Triage Demo** — record audio via microphone, see real-time waveform visualization, and get instant classification results with a Mel-spectrogram output
- **Audio Analysis Pipeline** — silence trimming, spectral denoising, FFT-based feature extraction, and softmax classification across 4 classes (Normal, Anomalous, Wheeze, COPD/Bronchitis)
- **Authentication** — Google OAuth + Guest mode via Supabase
- **Dashboard** — view health metrics and session data
- **About & Reviews pages** — project story, team info, and community review system
- **Responsive Design** — dark theme, mobile drawer navigation, bottom tab bar
- **Offline-First** — all audio analysis runs in-browser via Web Audio API, no model uploads to any server

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | **Next.js 15** (App Router) |
| Language | **TypeScript** |
| UI | **React 19** with Server & Client Components |
| Styling | **Tailwind CSS 4** + custom CSS |
| Font | **Syne** (Google Fonts) |
| Auth | **Supabase Auth** (Google OAuth) |
| Database | **Supabase** (via `@supabase/ssr` + `@supabase/supabase-js`) |
| Charts | **Recharts** |
| Audio | **Web Audio API** (AnalyserNode, OfflineAudioContext, MediaRecorder) |
| Visualization | **HTML Canvas** (waveform + Mel-spectrogram rendering) |

## Pipeline Architecture

1. **Audio Capture** — mic input at 16 kHz, mono, 10-second window
2. **Spectral Denoising** — noise floor sampling, spectral gate via STFT
3. **Feature Extraction** — zero-crossing rate, RMS energy, spectral centroid, flux, flatness, band energy distribution
4. **Classification** — deterministic multi-frame DCT-based feature scoring with softmax normalization across 4 classes
5. **Report Generation** — timestamped results with confidence scores and inference latency

## Project Structure

```
respicore/
├── app/
│   ├── layout.tsx                  # Root layout (dark theme, Syne font)
│   ├── page.tsx                    # Landing page (hero, triage, pipeline, metrics, history)
│   ├── (auth)/
│   │   ├── login/page.tsx          # Login page
│   │   └── signup/page.tsx         # Signup page
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Dashboard layout
│   │   ├── dashboard/
│   │   │   ├── page.tsx            # Dashboard overview
│   │   │   └── DashboardClient.tsx # Dashboard client component
│   ├── about/page.tsx              # About / Our Story page
│   └── reviews/page.tsx            # Reviews / Community page
├── components/
│   ├── auth/                       # Auth-related components
│   └── dashboard/                  # Dashboard widgets (MetricCard, MetricsChart)
├── lib/
│   └── supabase/                   # Supabase client configuration
├── styles/
│   ├── globals.css                 # Global styles
│   └── landing.css                 # Landing page styles
├── middleware.ts                    # Auth route protection
├── tailwind.config.ts
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
└── package.json
```

## Getting Started

### Prerequisites

- **Node.js 18+**
- A **Supabase project** with Auth enabled (Google OAuth provider configured)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/THELASTARTIST/RESPICORE-V2.git
cd RESPICORE-V2/respicore
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables — create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (Next.js dev) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run Next.js linter |

## Model Benchmarks

| Metric | Value |
|--------|-------|
| Accuracy | 89.2% (4-class, held-out test split) |
| AUC-ROC | 0.94 (macro-averaged, one-vs-rest) |
| Model Size | 4.2MB (INT8 quantized, vs 16.8MB float32) |
| Inference Latency | 38ms avg on Snapdragon 680 (P95 < 52ms) |

The underlying model is a MobileNetV2 backbone fine-tuned on the COUGHVID (EPFL, 25k samples) and Project Coswara (IISc) datasets.

## License

All rights reserved. This is a research prototype.
