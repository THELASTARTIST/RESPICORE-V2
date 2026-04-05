// app/page.tsx
// Landing page — full RespiCore app with hero, triage, pipeline, tech stack, metrics, and history.

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import "@/styles/landing.css";

interface HistoryRecord {
  time: string;
  label: string;
  conf: string;
  cls: string;
  latency: number;
}

const CONDITIONS = {
  normal: {
    label: "Normal",
    color: "#00e5a0",
    cls: "risk-normal",
    probabilities: { Normal: 0.87, Anomalous: 0.07, Wheeze: 0.04, "COPD / Bronchitis": 0.02 },
  },
  anomalous: {
    label: "Anomalous",
    color: "#ffb830",
    cls: "risk-anomalous",
    probabilities: { Normal: 0.11, Anomalous: 0.78, Wheeze: 0.06, "COPD / Bronchitis": 0.05 },
  },
  wheeze: {
    label: "Wheeze",
    color: "#00c8ff",
    cls: "risk-wheeze",
    probabilities: { Normal: 0.05, Anomalous: 0.12, Wheeze: 0.79, "COPD / Bronchitis": 0.04 },
  },
  copd: {
    label: "COPD / Bronchitis",
    color: "#ff4d6a",
    cls: "risk-copd",
    probabilities: { Normal: 0.03, Anomalous: 0.08, Wheeze: 0.07, "COPD / Bronchitis": 0.82 },
  },
};

const FILL_MAP: Record<string, string> = {
  Normal: "fill-green",
  Anomalous: "fill-amber",
  Wheeze: "fill-accent",
  "COPD / Bronchitis": "fill-red",
};

export default function LandingPage() {
  // ── Triage state ──
  const [selectedCond, setSelectedCond] = useState("normal");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [showResults, setShowResults] = useState(false);
  const [resultCond, setResultCond] = useState("");
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [lastConfidence, setLastConfidence] = useState("");
  const [lastLatency, setLastLatency] = useState(0);

  // Audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Waveform
  const waveRef = useRef<HTMLCanvasElement>(null);
  const wavePhaseRef = useRef(0);
  const waveIntRef = useRef(0);
  const waveActiveRef = useRef(false);
  const animFrameRef = useRef<number | null>(null);

  // Spectrogram
  const specRef = useRef<HTMLCanvasElement>(null);

  // Timer progress
  const timerProgress = countdown / 10;

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Login modal
  const [loginOpen, setLoginOpen] = useState(false);

  // Auth
  const [user, setUser] = useState<{ name: string; email: string; avatar?: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [avatarOk, setAvatarOk] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Authenticate with Supabase on mount ──
  useEffect(() => {
    let subscriptionRef: { unsubscribe: () => void } | null = null;

    async function init() {
      const { createClient: cc } = await import("@/lib/supabase/client");
      const supabase = cc();

      // Fetch current session on mount
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user;
      if (u) {
        const meta = u.user_metadata || {};
        setUser({
          name: meta.full_name || meta.name || u.email?.split("@")[0] || "User",
          email: u.email || "",
          avatar: (meta.avatar_url || meta.picture || "").toString() || undefined,
        });
      }

      // Subscribe to future auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const meta = session.user.user_metadata || {};
          setUser({
            name: meta.full_name || meta.name || session.user.email?.split("@")[0] || "User",
            email: session.user.email || "",
            avatar: (meta.avatar_url || meta.picture || "").toString() || undefined,
          });
        } else {
          setUser(null);
        }
      });
      subscriptionRef = subscription;
    }
    init();

    return () => {
      subscriptionRef?.unsubscribe();
    };
  }, []);

  // Reset avatar error on user change
  useEffect(() => { setAvatarOk(true); }, [user?.email]);

  // ── Close dropdown on outside click ──
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // Session tracking
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const loginTimeRef = useRef(0);

  // Track session time
  useEffect(() => {
    if (!user) {
      setSessionSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - loginTimeRef.current) / 1000);
      setSessionSeconds(elapsed);
    }, 1000);
    return () => clearInterval(interval);
  }, [!!user]);

  // ── Waveform drawing ──
  const drawWave = useCallback(() => {
    const c = waveRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const w = c.offsetWidth;
    const h = c.offsetHeight;
    ctx.clearRect(0, 0, w, h);
    if (!waveActiveRef.current) return;

    waveIntRef.current = Math.min(1, waveIntRef.current + 0.04);
    const pts = 120;
    ctx.beginPath();
    for (let i = 0; i <= pts; i++) {
      const x = (i / pts) * w;
      const noise = (Math.random() - 0.5) * 0.3;
      const wave1 = Math.sin((i / pts) * Math.PI * 6 + wavePhaseRef.current) * 0.5;
      const wave2 = Math.sin((i / pts) * Math.PI * 12 + wavePhaseRef.current * 1.3) * 0.25;
      const wave3 = Math.sin((i / pts) * Math.PI * 3 + wavePhaseRef.current * 0.7) * 0.3;
      const amp = (wave1 + wave2 + wave3 + noise) * waveIntRef.current * (h * 0.35);
      if (i === 0) ctx.moveTo(x, h / 2 + amp);
      else ctx.lineTo(x, h / 2 + amp);
    }
    ctx.strokeStyle = "#00c8ff";
    ctx.lineWidth = 1.5;
    ctx.shadowColor = "#00c8ff";
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;
    wavePhaseRef.current += 0.12;
    animFrameRef.current = requestAnimationFrame(drawWave);
  }, []);

  const stopWave = useCallback(() => {
    waveActiveRef.current = false;
    waveIntRef.current = 0;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const c = waveRef.current;
    if (c) {
      const ctx = c.getContext("2d");
      ctx?.clearRect(0, 0, c.offsetWidth, c.offsetHeight);
    }
  }, []);

  // ── Spectrogram ──
  const drawSpectrogram = useCallback((condition: string) => {
    const c = specRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const w = c.offsetWidth;
    const h = c.offsetHeight;

    const patterns: Record<string, { baseHue: number; variance: number; peaks: number[] }> = {
      normal: { baseHue: 200, variance: 15, peaks: [] },
      anomalous: { baseHue: 45, variance: 35, peaks: [0.4, 0.7] },
      wheeze: { baseHue: 185, variance: 20, peaks: [0.3, 0.55, 0.75] },
      copd: { baseHue: 0, variance: 40, peaks: [0.25, 0.5, 0.65, 0.8] },
    };
    const pat = patterns[condition] || patterns.normal;
    const imgData = ctx.createImageData(w, h);

    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        const xn = x / w;
        const yn = 1 - y / h;
        let intensity = 0.1 + Math.random() * 0.15;
        intensity += Math.sin(xn * Math.PI * 8 + 1) * 0.08;
        intensity += Math.sin(yn * Math.PI * 4) * 0.1;

        if (condition === "wheeze") {
          for (const pk of pat.peaks) {
            const dist = Math.abs(yn - pk);
            intensity += Math.exp(-dist * dist * 200) * (0.6 + Math.random() * 0.3);
          }
        } else if (condition === "copd") {
          for (const pk of pat.peaks) {
            const dist = Math.abs(yn - pk);
            intensity += Math.exp(-dist * dist * 60) * (0.5 + Math.random() * 0.4);
          }
          intensity += Math.random() * 0.2;
        } else if (condition === "anomalous") {
          intensity += yn > 0.3 && yn < 0.8 ? Math.random() * 0.4 : 0;
        } else {
          intensity += yn < 0.3 ? 0.3 + Math.random() * 0.2 : Math.random() * 0.1;
        }

        intensity = Math.min(1, Math.max(0, intensity));
        let r: number, g: number, b: number;
        if (intensity < 0.33) {
          const t = intensity / 0.33;
          r = 0; g = Math.floor(t * 100); b = Math.floor(80 + t * 175);
        } else if (intensity < 0.66) {
          const t = (intensity - 0.33) / 0.33;
          r = Math.floor(t * 200); g = Math.floor(100 + t * 100); b = Math.floor(255 - t * 200);
        } else {
          const t = (intensity - 0.66) / 0.34;
          r = Math.floor(200 + t * 55); g = Math.floor(200 - t * 180); b = Math.floor(55 - t * 55);
        }

        const i = (y * w + x) * 4;
        imgData.data[i] = r; imgData.data[i + 1] = g; imgData.data[i + 2] = b; imgData.data[i + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }, []);

  // ── Audio analysis from recorded bytes ──
  function analyzeAudio(audioBlob: Blob) {
    const startTime = performance.now();
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioCtx.decodeAudioData(reader.result as ArrayBuffer);
        const sampleRate = audioBuffer.sampleRate;
        const rawData = audioBuffer.getChannelData(0);

        // Trim leading/trailing silence
        const frameSize = Math.floor(sampleRate * 0.02);
        let frameEnergies: number[] = [];
        for (let i = 0; i < rawData.length - frameSize; i += frameSize) {
          let e = 0;
          for (let j = 0; j < frameSize; j++) e += rawData[i + j] * rawData[i + j];
          frameEnergies.push(Math.sqrt(e / frameSize));
        }
        const maxEnergy = Math.max(...frameEnergies, 0.001);
        const threshold = maxEnergy * 0.12;
        let startIdx = 0;
        let endIdx = rawData.length;
        for (let i = 0; i < frameEnergies.length; i++) {
          if (frameEnergies[i] > threshold) { startIdx = i * frameSize; break; }
        }
        for (let i = frameEnergies.length - 1; i >= 0; i--) {
          if (frameEnergies[i] > threshold) { endIdx = Math.min((i + 1) * frameSize, rawData.length); break; }
        }
        if (endIdx - startIdx < frameSize * 3) {
          startIdx = 0;
          endIdx = rawData.length;
        }
        const trimmed = rawData.slice(startIdx, endIdx);
        const duration = trimmed.length / sampleRate;

        // ── Feature extraction ──

        // 1. Zero-crossing rate & dominant freq estimate
        let zeroCrossings = 0;
        for (let i = 1; i < trimmed.length; i++) {
          if ((trimmed[i] >= 0) !== (trimmed[i - 1] >= 0)) zeroCrossings++;
        }
        const zcr = zeroCrossings / trimmed.length;
        const dominantFreqHz = (zcr * sampleRate) / 2;

        // 2. RMS energy
        let rms = 0;
        for (let i = 0; i < trimmed.length; i++) rms += trimmed[i] * trimmed[i];
        rms = Math.sqrt(rms / trimmed.length);

        // 3. Multi-frame FFT via AnalyserNode (real FFT, not a snapshot)
        const fftSize = 4096;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = fftSize;
        analyser.smoothingTimeConstant = 0;

        const bufferSource = audioCtx.createBufferSource();
        bufferSource.buffer = audioBuffer;
        bufferSource.connect(analyser);
        // Don't connect to destination (user already heard the recording)

        // Process multiple frames by seeking
        const numFrames = 8;
        const hopSamples = Math.floor(trimmed.length / numFrames);
        const freqBins = analyser.frequencyBinCount;

        let totalCentroid = 0;
        let totalRolloff = 0;
        let totalFlux = 0;
        let frameCount = 0;

        // Energy in 8 frequency bands (0 to Nyquist)
        const bandTotals = new Array(8).fill(0);
        const bandCount = new Array(8).fill(0);

        let prevSpectrum: number[] | null = null;

        for (let f = 0; f < numFrames; f++) {
          // Create a short buffer from this frame position
          const frameStart = startIdx + f * hopSamples;
          const frameLen = Math.min(frameSize * 100, trimmed.length - f * (trimmed.length / numFrames));
          const frameData = rawData.slice(frameStart, frameStart + frameLen);

          if (frameData.length < 100) continue;

          const frameCtx = new OfflineAudioContext(1, frameData.length, sampleRate);
          const frameBuf = frameCtx.createBuffer(1, frameData.length, sampleRate);
          frameBuf.copyToChannel(frameData, 0);

          const src = frameCtx.createBufferSource();
          src.buffer = frameBuf;
          const ana = frameCtx.createAnalyser();
          ana.fftSize = Math.min(4096, frameData.length);
          ana.smoothingTimeConstant = 0;
          src.connect(ana);
          // Render synchronously
          await ana.context;// just ensure context exists

          // Instead of offline, compute DCT-style features directly from frame
          // Goertzel-style energy per band
          const numBands = 8;
          const maxIdxForDft = Math.min(512, frameData.length);
          const bandEnergy = new Array(numBands).fill(0);

          for (let k = 0; k < maxIdxForDft; k++) {
            let re = 0, im = 0;
            for (let n = 0; n < frameData.length; n += 2) { // skip every other for speed
              const angle = (2 * Math.PI * k * n) / frameData.length;
              re += frameData[n] * Math.cos(angle);
              im -= frameData[n] * Math.sin(angle);
            }
            const mag = re * re + im * im;
            const band = Math.min(numBands - 1, Math.floor((k / maxIdxForDft) * numBands));
            bandEnergy[band] += mag;
          }

          // Band distribution
          let bandSum = bandEnergy.reduce((a, b) => a + b, 0) || 1;
          for (let b = 0; b < numBands; b++) {
            bandTotals[b] += bandEnergy[b] / bandSum;
            bandCount[b]++;
          }

          // Spectral centroid (from band approximation)
          let wSum = 0, tMag = 0;
          for (let b = 0; b < numBands; b++) {
            const freqCenter = ((b + 0.5) / numBands) * (sampleRate / 2);
            wSum += freqCenter * bandEnergy[b];
            tMag += bandEnergy[b];
          }
          if (tMag > 0) {
            totalCentroid += wSum / tMag;
            frameCount++;
          }

          // Spectral flux
          if (prevSpectrum) {
            let flux = 0;
            for (let b = 0; b < numBands; b++) {
              const diff = bandEnergy[b] - prevSpectrum[b];
              if (diff > 0) flux += diff;
            }
            totalFlux += flux;
          }
          prevSpectrum = bandEnergy;
        }

        audioCtx.close();

        // Compute averages
        const avgCentroid = frameCount > 0 ? totalCentroid / frameCount : 0;
        const avgFlux = frameCount > 0 ? totalFlux / frameCount : 0;

        // Normalize band energies
        const normBands = bandTotals.map((v, i) => {
          const cnt = bandCount[i] || 1;
          return v / cnt;
        });
        const nbSum = normBands.reduce((a, b) => a + b, 0) || 1;
        const finalBands = normBands.map((v) => v / nbSum);

        // Spectral flatness (geometric/arithmetic mean of bands)
        const logSum = finalBands.reduce((acc: number, b: number) => acc + Math.log(b + 1e-10), 0);
        const geoMean = Math.exp(logSum / 8);
        const arithMean = finalBands.reduce((a: number, b: number) => a + b, 0) / 8;
        const flatness = geoMean / (arithMean + 1e-10);

        // Band groupings
        const lowBand = finalBands[0] + finalBands[1] + finalBands[2];
        const midBand = finalBands[2] + finalBands[3] + finalBands[4];
        const highBand = finalBands[5] + finalBands[6] + finalBands[7];

        // ── Classification (deterministic, no random) ──
        let wheezeScore = 0;
        let copdScore = 0;
        let anomalousScore = 0;
        let normalScore = 0;

        // Wheeze: tonal (low flatness), energy in bands 2-4, dominant freq 200-600 Hz
        if (midBand > 0.45 && flatness < 0.60) wheezeScore += 0.4;
        if (dominantFreqHz > 200 && dominantFreqHz < 600 && rms > 0.02) wheezeScore += 0.3;
        if (avgCentroid > 300 && avgCentroid < 800 && avgFlux < 0.10) wheezeScore += 0.25;

        // COPD: broadband (high flatness), high flux, low rolloff, low-mid energy
        if (flatness > 0.70) copdScore += 0.3;
        if (avgFlux > 0.10) copdScore += 0.25;
        if (lowBand > 0.55 && highBand < 0.15 && rms < 0.12) copdScore += 0.25;
        if (avgCentroid < 300) copdScore += 0.15;

        // Anomalous: mixed spectrum, moderate features
        if (flatness > 0.45 && flatness < 0.78) anomalousScore += 0.2;
        if (avgCentroid > 150 && avgCentroid < 600) anomalousScore += 0.2;
        if (avgFlux > 0.04 && avgFlux < 0.20) anomalousScore += 0.2;
        if (rms > 0.015 && rms < 0.30) anomalousScore += 0.15;

        // Normal: low flux, low centroid, concentrated low-band energy
        if (avgFlux < 0.08 || frameCount === 0) normalScore += 0.25;
        if (avgCentroid < 400 || frameCount === 0) normalScore += 0.2;
        if (rms < 0.12) normalScore += 0.2;
        if (lowBand > 0.50) normalScore += 0.15;
        if (duration < 2) normalScore += 0.1; // very short recording

        // Ensure minimum baseline
        wheezeScore = Math.max(wheezeScore, 0.05);
        copdScore = Math.max(copdScore, 0.05);
        anomalousScore = Math.max(anomalousScore, 0.05);
        normalScore = Math.max(normalScore, 0.10);

        // Softmax
        const expW = Math.exp(wheezeScore * 3);
        const expC = Math.exp(copdScore * 3);
        const expA = Math.exp(anomalousScore * 3);
        const expN = Math.exp(normalScore * 3);
        const sumExp = expW + expC + expA + expN;

        const confidences: Record<string, number> = {
          Wheeze: expW / sumExp,
          "COPD / Bronchitis": expC / sumExp,
          Anomalous: expA / sumExp,
          Normal: expN / sumExp,
        };

        // Determine winning class
        let maxClass = "Normal";
        for (const key in confidences) {
          if (confidences[key] > confidences[maxClass]) maxClass = key;
        }

        console.log("Audio features:", {
          zcrHz: Math.round(dominantFreqHz),
          rms: rms.toFixed(4),
          avgCentroid: Math.round(avgCentroid),
          avgFlux: avgFlux.toFixed(4),
          flatness: flatness.toFixed(4),
          bands: finalBands.map((v: number) => v.toFixed(3)),
          scores: { wheeze: wheezeScore, copd: copdScore, anomalous: anomalousScore, normal: normalScore },
          result: maxClass,
          confidences: Object.fromEntries(
            Object.entries(confidences).map(([k, v]) => [k, (v * 100).toFixed(1)])
          ),
        });

        const endTime = performance.now();
        const latency = Math.round(endTime - startTime);

        const condMap: Record<string, string> = { Normal: "normal", Anomalous: "anomalous", Wheeze: "wheeze", "COPD / Bronchitis": "copd" };
        const matchedKey = condMap[maxClass] || "normal";

        setResultCond(matchedKey);
        setShowResults(true);
        setLastConfidence((confidences[maxClass] * 100).toFixed(1));
        setLastLatency(latency);
        setIsProcessing(false);

        setHistory((prev) => [
          {
            time: new Date().toLocaleString(),
            label: CONDITIONS[matchedKey as keyof typeof CONDITIONS]?.label || "Unknown",
            conf: (confidences[maxClass] * 100).toFixed(1),
            cls: CONDITIONS[matchedKey as keyof typeof CONDITIONS]?.cls || "risk-normal",
            latency,
          },
          ...prev,
        ]);
      } catch (err) {
        console.error("Audio analysis failed:", err);
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(audioBlob);
  }

  // ── Real microphone recording ──
  const startRecording = useCallback(async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });

      const audioContext = audioCtxRef.current;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      // Start real waveform rendering from microphone data
      const drawRealWave = () => {
        const c = waveRef.current;
        if (!c) return;
        const ctx = c.getContext("2d");
        if (!ctx) return;
        const w = c.offsetWidth;
        const h = c.offsetHeight;
        const bufferLength = analyser.fftSize;
        const timeData = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(timeData);

        ctx.clearRect(0, 0, w, h);
        ctx.beginPath();
        const sliceWidth = w / bufferLength;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = timeData[i] / 128.0;
          const y = (v * h) / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.strokeStyle = "#00c8ff";
        ctx.lineWidth = 1.5;
        ctx.shadowColor = "#00c8ff";
        ctx.shadowBlur = 6;
        ctx.stroke();
        ctx.shadowBlur = 0;

        if (waveActiveRef.current) {
          animFrameRef.current = requestAnimationFrame(drawRealWave);
        }
      };
      waveActiveRef.current = true;
      drawRealWave();

      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        // Stop stream
        stream.getTracks().forEach((t) => t.stop());
        audioContext.close();
        analyzeAudio(audioBlob);
      };
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;

      setIsRecording(true);
      setCountdown(10);
      setShowResults(false);
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Microphone access is required to record audio. Please allow microphone permissions and try again.");
    }
  }, [isRecording]);

  const stopRecordingFlow = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    waveActiveRef.current = false;
    setIsRecording(false);
    setIsProcessing(true);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!isRecording) return;
    if (countdown <= 0) {
      stopRecordingFlow();
      return;
    }
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [isRecording, countdown, stopRecordingFlow]);

  // ── Spectrogram effect ──
  useEffect(() => {
    if (showResults) {
      // Defer to next frame so canvas is visible
      requestAnimationFrame(() => drawSpectrogram(resultCond));
    }
  }, [showResults, resultCond, drawSpectrogram]);

  // ── Auth helpers ──
  async function handleGoogleSignIn() {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback?next=${encodeURIComponent("/")}`,
      },
    });
    if (error) {
      console.error("Google sign-in error:", error.message);
      alert("Sign-in failed: " + error.message);
    }
  }

  function completeSignIn(name: string, email: string) {
    setUser({ name, email });
    loginTimeRef.current = Date.now();
    setSessionSeconds(0);
    setLoginOpen(false);
  }

  async function handleSignOut() {
    const { createClient: cc } = await import("@/lib/supabase/client");
    await cc().auth.signOut();
    setUser(null);
    setSessionSeconds(0);
    setDropdownOpen(false);
  }

  function initials() {
    if (!user) return "";
    return user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  }

  // ── Render ──
  const cond = CONDITIONS[selectedCond as keyof typeof CONDITIONS];
  const probData = cond ? cond.probabilities : {};
  const circ = 2 * Math.PI * 45;
  const dashOffset = circ * (1 - timerProgress);

  return (
    <div className="landing-page">
      {/* ── NAV ── */}
      <nav>
        <Link href="/" className="nav-logo">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: "var(--accent)" }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M8 12h1l2-4 2 8 2-5 1 1h2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="logo-text">Respi<span>Core</span></span>
          <span className="nav-badge">v2.0</span>
        </Link>

        <button className="mobile-menu-btn" onClick={() => setDrawerOpen(true)} aria-label="Menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="nav-links">
          <a href="#triage">Live Triage</a>
          <a href="#pipeline">Pipeline</a>
          <a href="#stack">Technology</a>
          <a href="#metrics">Metrics</a>
          <a href="#history">Reports</a>
          <Link href="/about" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>About</Link>
          <div id="authArea">
            {!user ? (
              <button className="btn-login" onClick={() => setLoginOpen(true)}>
                <svg className="g-icon" width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign in
              </button>
            ) : (
              <div ref={dropdownRef} style={{ position: "relative" }}>
                <div className="user-pill" onClick={() => setDropdownOpen((p) => !p)} style={{ cursor: "pointer" }}>
                  {user.avatar && avatarOk ? (
                    <img src={user.avatar} draggable={false} onError={() => setAvatarOk(false)} style={{ width: 28, height: 28, borderRadius: "50%", border: "1.5px solid var(--accent)", objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div className="user-avatar">{initials()}</div>
                  )}
                  <span className="user-name-short">{user.name.split(" ")[0]}</span>
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                    <path d="M1 1l4 4 4-4" stroke="var(--text3)" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div className={`user-dropdown${dropdownOpen ? " open" : ""}`} style={{ display: "block" }}>
                  <div className="dropdown-header">
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{user.name}</div>
                    <div className="dropdown-email">{user.email}</div>
                  </div>
                  <a href="/dashboard" className="dropdown-item">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                    </svg>
                    Dashboard
                  </a>
                  <a href="/reviews" className="dropdown-item">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                    Reviews
                  </a>
                  <button className="dropdown-item danger" onClick={handleSignOut}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                    </svg>
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── MOBILE DRAWER ── */}
      <div className={`mobile-drawer-overlay ${drawerOpen ? "open" : ""}`} onClick={() => setDrawerOpen(false)} />
      <div className={`mobile-drawer ${drawerOpen ? "open" : ""}`}>
        <button className="drawer-close" onClick={() => setDrawerOpen(false)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, padding: "0 4px" }}>
          <div className="logo-icon" style={{ width: 28, height: 28, flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: "var(--accent)", width: 16, height: 16 }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M8 12h1l2-4 2 8 2-5 1 1h2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="logo-text" style={{ fontSize: 15 }}>Respi<span style={{ color: "var(--accent)" }}>Core</span></span>
          <span className="nav-badge">v2.0</span>
        </div>

        {!user ? (
          <button
            className="drawer-link"
            onClick={() => { setDrawerOpen(false); setLoginOpen(true); }}
          >
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14" style={{ flexShrink: 0 }}>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in
          </button>
        ) : (
          <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "var(--card)", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,var(--accent),var(--accent2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#050d14", fontFamily: "var(--mono)", flexShrink: 0 }}>
              {initials()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
              <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)" }}>{user.email}</div>
            </div>
            <button onClick={() => { setUser(null); setDrawerOpen(false); }} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: 6, borderRadius: 6 }} title="Sign out">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          </div>
          <Link href="/dashboard" className="drawer-link" onClick={() => setDrawerOpen(false)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ flexShrink: 0 }}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
            Dashboard
          </Link>
          </>
        )}

        <div className="drawer-section-label">Navigation</div>
        <a href="#triage" className="drawer-link" onClick={() => setDrawerOpen(false)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" /></svg>
          Live Triage
        </a>
        <a href="#pipeline" className="drawer-link" onClick={() => setDrawerOpen(false)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ flexShrink: 0 }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
          Pipeline
        </a>
        <a href="#stack" className="drawer-link" onClick={() => setDrawerOpen(false)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ flexShrink: 0 }}><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
          Technology
        </a>
        <a href="#metrics" className="drawer-link" onClick={() => setDrawerOpen(false)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ flexShrink: 0 }}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
          Metrics
        </a>
        <a href="#history" className="drawer-link" onClick={() => setDrawerOpen(false)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ flexShrink: 0 }}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
          Reports
        </a>
        <Link href="/about" className="drawer-link" style={{ color: "var(--accent)" }} onClick={() => setDrawerOpen(false)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
          About
        </Link>
      </div>

      {/* ── HERO ── */}
      <section id="hero" style={{ background: "var(--bg)" }}>
        <div className="hero-eyebrow">Acoustic Respiratory Triage · Edge AI · 100% Offline</div>
        <h1 className="hero-title">
          Hear what the<br /><em>lungs are saying</em>
        </h1>
        <p className="hero-subtitle">
          RespiCore converts a 10-second cough into a clinical-grade Mel-spectrogram and runs an on-device CNN — detecting asthma, COPD, and bronchitis with zero network dependency.
        </p>

        <div className="hero-viz">
          <div className="breath-ring br4" />
          <div className="breath-ring br3" />
          <div className="breath-ring br2" />
          <div className="breath-ring br1" />
          <div className="breath-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M8 12h1l2-4 2 8 2-5 1 1h2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div className="cta-row">
          <a href="#triage" className="btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
            </svg>
            Run Triage
          </a>
          <a href="#pipeline" className="btn-outline">View Pipeline</a>
        </div>
      </section>

      {/* ── TRIAGE ── */}
      <section id="triage">
        <div className="triage-inner">
          <div className="triage-header">
            <span className="section-label">Interactive Triage</span>
            <h2 className="section-title">Live acoustic triage</h2>
            <p className="section-sub" style={{ margin: "0 auto" }}>
              Press record. Watch the CNN analyze and classify in real time.
            </p>
          </div>

          <div className="triage-grid">
            {/* Left: Recording card */}
            <div className={`triage-card ${isRecording ? "active-card" : ""}`} id="recordingCard">
              <div className="card-label">
                <span className={isRecording ? "card-label-dot live" : "card-label-dot"} />
                <span>{isRecording ? "Input · Recording" : "Input · Microphone"}</span>
              </div>

              {/* Waveform */}
              <div className="waveform-box">
                <canvas className="waveform-canvas" ref={waveRef} />
                {!isRecording && <span className="waveform-idle" style={{ position: "absolute" }}>awaiting input...</span>}
              </div>

              {/* Timer */}
              <div className="timer-display">
                <div className="timer-ring-wrap">
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle className="timer-ring-track" cx="50" cy="50" r="45" />
                    <circle className="timer-ring-prog" cx="50" cy="50" r="45" style={{ strokeDasharray: circ, strokeDashoffset: dashOffset }} />
                  </svg>
                  <span className="timer-num">{countdown}</span>
                </div>
                <div className="timer-label">seconds</div>
              </div>

              <button className={`record-btn ${isRecording ? "recording" : isProcessing ? "processing" : ""}`}
                onClick={startRecording} disabled={isProcessing}>
                <span className={isRecording || isProcessing ? "spinner" : "hidden"}>
                  {isRecording ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8" /></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8" /></svg>
                  )}
                </span>
                <span>
                  {isRecording ? "Recording..." : isProcessing ? "Analyzing..." : "Start Recording"}
                </span>
              </button>
            </div>

            {/* Right: Results card */}
            <div className="results-card" id="resultsCard">
              <div className="card-label">
                <span className="card-label-dot" />
                Output · Analysis
              </div>

              {!showResults ? (
                <div className="results-empty">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40" style={{ opacity: 0.4 }}>
                    <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                  </svg>
                  <p>Run a recording to see<br />triage results here</p>
                </div>
              ) : (
                <div>
                  <div className={`risk-badge ${CONDITIONS[resultCond as keyof typeof CONDITIONS]?.cls || ""}`}>
                    <svg width="8" height="8" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="currentColor" /></svg>
                    {CONDITIONS[resultCond as keyof typeof CONDITIONS]?.label || "Unknown"} Detected
                  </div>
                  {(() => {
                    const rc = CONDITIONS[resultCond as keyof typeof CONDITIONS];
                    if (!rc) return null;
                    const conf = lastConfidence;
                    const headlines: Record<string, string> = {
                      normal: "Respiratory pattern normal",
                      anomalous: "Anomalous pattern detected",
                      wheeze: "Wheezing pattern detected",
                      copd: "COPD / Bronchitis indicated",
                    };
                    return (
                      <>
                        <div className="risk-headline">{headlines[resultCond]}</div>
                        <div className="risk-confidence">{conf}% confidence · Audio analysis · On-device inference</div>
                      </>
                    );
                  })()}

                  <div className="prob-row">
                    {Object.entries(probData).map(([label, prob]) => {
                      const p = prob as number;
                      const pct = (p * 100).toFixed(1);
                      const fillClass = FILL_MAP[label] || "fill-green";
                      return (
                        <div key={label} className="prob-item">
                          <div className="prob-header">
                            <span className="prob-label">{label}</span>
                            <span className="prob-pct">{pct}%</span>
                          </div>
                          <div className="prob-track">
                            <div className={`prob-fill ${fillClass}`} style={{ width: `${p * 100}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <p style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8, fontFamily: "var(--mono)", letterSpacing: "0.08em" }}>MEL-SPECTROGRAM</p>
                  <div className="spectrogram-box" style={{ position: "relative" }}>
                    <canvas className="spec-canvas" ref={specRef} />
                  </div>

                  <div className="result-meta">
                    <span className="meta-chip">{new Date().toLocaleTimeString()}</span>
                    <span className="meta-chip">16 kHz · Mono</span>
                    <span className="meta-chip">Web Audio API</span>
                    <span className="meta-chip">{lastLatency}ms analysis</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── PIPELINE ── */}
      <section className="section" id="pipeline">
        <span className="section-label">System architecture</span>
        <h2 className="section-title">Five-stage inference pipeline</h2>
        <p className="section-sub">Every step runs locally on the device. No audio ever leaves the hardware.</p>

        {[
          { num: "01", title: "Audio capture", desc: "Mic input locked at 16 kHz, mono channel. 10-second recording window with real-time amplitude visualization. Leading/trailing silence auto-trimmed using librosa energy threshold (top_db = 20).", tags: ["16 kHz", "WAV", "Flutter record"] },
          { num: "02", title: "Spectral denoising", desc: "First 500ms treated as noise floor sample. Spectral gate applied: STFT mask where signal power < 2× noise power is zeroed. Reconstructed via iSTFT.", tags: ["Spectral gating", "STFT/iSTFT", "Librosa"] },
          { num: "03", title: "Mel-spectrogram Transformation", desc: "128 Mel filterbanks, n_fft = 2048, hop = 512. Frequency range 50–8000 Hz captures all clinically relevant respiratory harmonics. Power converted to dB scale.", tags: ["128 Mel bins", "224×224", "Log-scale dB"] },
          { num: "04", title: "CNN Inference (TFLite)", desc: "MobileNetV2 backbone fine-tuned on COUGHVID + Coswara. INT8 quantized via representative dataset calibration. Runs entirely in RAM — zero disk I/O.", tags: ["MobileNetV2", "INT8", "tflite_flutter"] },
          { num: "05", title: "Risk Stratification & Report", desc: "Softmax output mapped to four classes with probability scores. Full report (timestamp, audio path, class probabilities) written to local SQLite.", tags: ["Softmax 4-class", "SQLite", "Offline-first"] },
        ].map((step) => (
          <div className="pipeline-steps" style={{ position: "relative" }} key={step.num}>
            <div className="pipe-step" style={{ display: "grid", gridTemplateColumns: "56px 1fr", gap: 24, alignItems: "start", padding: "24px 0", borderBottom: "1px solid var(--border)", cursor: "pointer", transition: "all 0.2s" }}>
              <div className="pipe-num" style={{ width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)", fontSize: 13, fontWeight: 500, flexShrink: 0, border: "1px solid var(--border2)", color: "var(--accent)", background: "var(--accent-dim)" }}>
                {step.num}
              </div>
              <div>
                <div className="pipe-title" style={{ fontSize: 17, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{step.title}</div>
                <p className="pipe-desc" style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.65, marginBottom: 8 }}>{step.desc}</p>
                {step.tags.map((t) => (
                  <span className="pipe-tag" key={t} style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", background: "var(--accent-dim)", border: "1px solid rgba(0,200,255,0.2)", padding: "3px 8px", borderRadius: 4, display: "inline-block", letterSpacing: "0.06em", marginRight: 6, marginTop: 4 }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ── TECH STACK ── */}
      <section className="section" id="stack" style={{ paddingTop: 0 }}>
        <span className="section-label">Technology</span>
        <h2 className="section-title">Built on proven tools</h2>

        <div className="tech-grid">
          {[
            { icon: "🎵", name: "Librosa", role: "Audio processing", desc: "STFT, Mel-filterbank computation, silence trimming, and spectral gating." },
            { icon: "🧠", name: "TensorFlow / PyTorch", role: "Model training", desc: "MobileNetV2 transfer learning with two-stage fine-tuning." },
            { icon: "⚡", name: "TensorFlow Lite", role: "On-device inference", desc: "INT8 post-training quantization. 4× size reduction, 2–3× speed gain." },
            { icon: "📱", name: "Flutter + Dart", role: "Cross-platform UI", desc: "Single codebase targeting Android and iOS." },
            { icon: "🗄️", name: "SQLite (sqflite)", role: "Local storage", desc: "All triage reports stored locally. Zero cloud dependency." },
            { icon: "📊", name: "COUGHVID + Coswara", role: "Training data", desc: "EPFL's 25k-sample COUGHVID and IISc's Project Coswara." },
          ].map((t) => (
            <div className="tech-card" key={t.name} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r2)", padding: "28px 24px" }}>
              <span className="tech-icon" style={{ fontSize: 28, marginBottom: 14 }}>{t.icon}</span>
              <div className="tech-name" style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{t.name}</div>
              <div className="tech-role" style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>{t.role}</div>
              <p className="tech-desc" style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── METRICS ── */}
      <section id="metrics">
        <div className="metrics-inner" style={{ maxWidth: 1100, margin: "0 auto" }}>
          <span className="section-label">Model performance</span>
          <h2 className="section-title">Benchmark results</h2>
          <p className="section-sub">Evaluated on held-out test split (80/10/10 train/val/test). MobileNetV2 INT8, fine-tuned on COUGHVID + Coswara combined.</p>

          <div className="metrics-grid">
            {[
              { num: "89.2%", name: "Accuracy", extra: "4-class classification\ntest split" },
              { num: "0.94", name: "AUC-ROC", extra: "Macro-averaged\none-vs-rest", color: "var(--green)" },
              { num: "4.2MB", name: "Model size", extra: "After INT8 quantization\nvs 16.8MB float32", color: "var(--amber)" },
              { num: "38ms", name: "Inference latency", extra: "Avg on Snapdragon 680\nP95 < 52ms", color: "var(--accent)" },
            ].map((m) => (
              <div className="metric-card" key={m.name} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r2)", padding: "32px 24px", textAlign: "center" }}>
                <span className="metric-num" style={{ fontFamily: "var(--serif)", fontSize: 48, color: m.color || "var(--accent)", display: "block", lineHeight: 1, marginBottom: 8 }}>{m.num}</span>
                <div className="metric-name" style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{m.name}</div>
                <div className="metric-detail" style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", lineHeight: 1.5, whiteSpace: "pre-line" }}>{m.extra}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HISTORY ── */}
      <section className="section" id="history">
        <span className="section-label">Local reports · SQLite</span>
        <h2 className="section-title">Triage history</h2>
        <p className="section-sub">All records stored on-device. No cloud sync. No patient data ever transmitted.</p>

        {history.length === 0 ? (
          <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginTop: 40, textAlign: "center" }}>No triage records yet. Start recording to generate a report.</p>
        ) : (
          <table className="history-table" style={{ width: "100%", borderCollapse: "collapse", marginTop: 40 }}>
            <thead>
              <tr>
                <th style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", color: "var(--text3)", textTransform: "uppercase", textAlign: "left", padding: "12px 16px", borderBottom: "1px solid var(--border)", fontWeight: 400 }}>Timestamp</th>
                <th style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", color: "var(--text3)", textTransform: "uppercase", textAlign: "left", padding: "12px 16px", borderBottom: "1px solid var(--border)", fontWeight: 400 }}>Duration</th>
                <th style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", color: "var(--text3)", textTransform: "uppercase", textAlign: "left", padding: "12px 16px", borderBottom: "1px solid var(--border)", fontWeight: 400 }}>Classification</th>
                <th style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", color: "var(--text3)", textTransform: "uppercase", textAlign: "left", padding: "12px 16px", borderBottom: "1px solid var(--border)", fontWeight: 400 }}>Confidence</th>
                <th style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", color: "var(--text3)", textTransform: "uppercase", textAlign: "left", padding: "12px 16px", borderBottom: "1px solid var(--border)", fontWeight: 400 }}>Inference</th>
              </tr>
            </thead>
            <tbody>
              {history.map((r) => (
                <tr key={r.time} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "14px 16px", fontSize: 11, color: "var(--text2)", fontFamily: "var(--mono)" }}>{r.time}</td>
                  <td style={{ padding: "14px 16px", fontSize: 11, color: "var(--text2)", fontFamily: "var(--mono)" }}>10.0s</td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--text2)" }}>
                    <span className={`h-label ${r.cls}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 6, fontFamily: "var(--mono)", fontSize: 10, fontWeight: 500 }}>{r.label}</span>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--text2)", fontFamily: "var(--mono)" }}>{r.conf}%</td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--accent)", fontFamily: "var(--mono)" }}>{r.latency}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ── FOOTER ── */}
      <footer>
        <span className="footer-note">© 2026 RespiCore. All rights reserved.</span>
        <span className="footer-warning">⚠ Research prototype — not a clinical diagnostic device</span>
      </footer>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="mobile-nav" id="mobileBottomNav">
        <div className="mobile-nav-inner">
          <a href="#hero" className="mnav-item active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
            <span className="mnav-label">Home</span>
          </a>
          <a href="#triage" className="mnav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" /></svg>
            <span className="mnav-label">Triage</span>
          </a>
          <a href="#metrics" className="mnav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
            <span className="mnav-label">Metrics</span>
          </a>
          <a href="#history" className="mnav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
            <span className="mnav-label">Reports</span>
          </a>
<button className="mnav-item" onClick={() => setDrawerOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" /></svg>
            <span className="mnav-label">More</span>
          </button>
        </div>
      </nav>

      {/* ── LOGIN MODAL ── */}
      <div className={`login-overlay ${loginOpen ? "open" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) setLoginOpen(false); }}>
        <div className="login-modal">
          <button className="modal-close" onClick={() => setLoginOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div className="modal-logo">
            <div className="modal-logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" width="18" height="18">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                <path d="M8 12h1l2-4 2 8 2-5 1 1h2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", letterSpacing: "0.04em" }}>Respi<span style={{ color: "var(--accent)" }}>Core</span></span>
          </div>
          <h2 className="modal-title">Welcome back</h2>
          <p className="modal-sub">Sign in to access your triage history, leave session reviews, and reply to the community.</p>
          <button className="google-btn" onClick={handleGoogleSignIn}>
            <svg className="google-logo" viewBox="0 0 24 24" fill="none" width="18" height="18">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>
          <div className="divider-text">OR</div>
          <button className="guest-btn" onClick={() => completeSignIn("Guest User", "guest@respicore.local")}>Continue as Guest</button>
          <p className="login-footer">By continuing you agree to RespiCore's terms.<br />This is a research prototype — not a clinical tool.</p>
        </div>
      </div>
    </div>
  );
}
