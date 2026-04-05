// app/reviews/page.tsx
"use client";

import Link from "next/link";
import { useState } from "react";

interface Reply {
  author: string;
  initials: string;
  role: string;
  text: string;
  color: string;
}

interface Review {
  id: number;
  author: string;
  initials: string;
  role: string;
  stars: number;
  text: string;
  tags: string[];
  session: string;
  avatarColor: string;
  likes: number;
  replies: Reply[];
}

const INITIAL_REVIEWS: Review[] = [
  {
    id: 1,
    author: "Dr. Priya Sharma",
    initials: "PS",
    role: "Pulmonologist · AIIMS Delhi",
    stars: 5,
    text: "RespiCore's acoustic triage approach is genuinely innovative. The idea that a 10-second cough sample can provide meaningful risk stratification for respiratory conditions is the kind of thinking that could democratize lung health screening in regions where spirometry isn't available.",
    tags: ["Clinical Validation", "Accessibility", "Edge AI"],
    session: "Triage Session #1247",
    avatarColor: "#00c8ff",
    likes: 24,
    replies: [
      { author: "Adhrikto", initials: "A", role: "Developer", text: "Thank you, Dr. Sharma! We trained MobileNetV2 on the COUGHVID + Coswara combined dataset with careful attention to class imbalance.", color: "#00c8ff" },
    ],
  },
  {
    id: 2,
    author: "Marcus Chen",
    initials: "MC",
    role: "ML Engineer · Google Health",
    stars: 4,
    text: "Impressive that the INT8 quantized model runs in 38ms on a Snapdragon 680. The 4× size reduction without significant accuracy drop is a solid engineering achievement. Would love to see how this generalizes to non-COUGHVID populations.",
    tags: ["Model Performance", "Quantization", "TFLite"],
    session: "Triage Session #891",
    avatarColor: "#ffb830",
    likes: 18,
    replies: [
      { author: "Rajdeep", initials: "R", role: "Developer", text: "Great point about generalization. We're working on collecting more diverse cough samples across different age groups and environments.", color: "#0090d4" },
    ],
  },
  {
    id: 3,
    author: "Dr. Sarah Okafor",
    initials: "SO",
    role: "Respiratory Therapist · Lagos",
    stars: 5,
    text: "In our clinic, we see patients who can't afford pulmonary function tests. A free, offline app that gives an initial risk assessment would change how we triage. The fact that no audio leaves the device is also crucial for patient privacy.",
    tags: ["Privacy", "Real-world Impact", "Offline-First"],
    session: "Triage Session #1503",
    avatarColor: "#00e5a0",
    likes: 31,
    replies: [],
  },
  {
    id: 4,
    author: "Alex Rivera",
    initials: "AR",
    role: "Flutter Developer",
    stars: 4,
    text: "The Flutter + TFLite integration is clean. The offline-first SQLite storage pattern is exactly right for this use case. Only suggestion: consider adding audio quality feedback so users know when their recording is too noisy.",
    tags: ["UI/UX", "Flutter", "Architecture"],
    session: "Triage Session #762",
    avatarColor: "#ff7c5c",
    likes: 12,
    replies: [],
  },
];

function Stars({ count, filledColor = "#c9a84c" }: { count: number; filledColor?: string }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ fontSize: 14, color: i < count ? filledColor : "rgba(26,28,32,0.15)" }}>
          ★
        </span>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});
  const [user] = useState<{ name: string; initials: string }>({ name: "Adhrikto", initials: "A" });

  // Write review form state
  const [formStars, setFormStars] = useState(0);
  const [formName, setFormName] = useState("");
  const [formText, setFormText] = useState("");
  const [formSession, setFormSession] = useState("");
  const [formTags, setFormTags] = useState<string[]>([]);
  const [toast, setToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  function showToast(msg: string) {
    setToastMsg(msg);
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  }

  const ALL_TAGS = [
    "Accurate", "Fast", "Easy to use", "Privacy-first",
    "Impressive AI", "Needs work", "Offline ready", "Clinical feel",
  ];

  const AVATAR_COLORS = [
    "#00c8ff", "#c9a84c", "#4a7c59", "#c45c3a", "#7b5ea7", "#3a7fc1",
  ];
  function getColor(name: string) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
  }

  function toggleTag(tag: string) {
    setFormTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }

  function submitReview() {
    if (!formText.trim()) { showToast("Please write something before posting ✍️"); return; }
    if (!formStars) { showToast("Please pick a star rating ★"); return; }

    const author = formName.trim() || "Anonymous";
    const init = author[0]?.toUpperCase() || "?";
    const newReview: Review = {
      id: Date.now(),
      author,
      initials: init,
      role: "Reviewer",
      stars: formStars,
      text: formText.trim(),
      tags: [...formTags],
      session: formSession || "General Demo Run",
      avatarColor: getColor(author),
      likes: 0,
      replies: [],
    };
    setReviews((prev) => [newReview, ...prev]);

    // Reset form
    setFormStars(0);
    setFormName("");
    setFormText("");
    setFormSession("");
    setFormTags([]);
    showToast("Your review is live — thank you! 🙌");
  }

  function handleReply(reviewId: number) {
    const text = replyTexts[reviewId];
    if (!text?.trim()) return;
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              replies: [
                ...r.replies,
                { author: user.name, initials: user.initials, role: "Developer", text: text.trim(), color: "#00c8ff" },
              ],
            }
          : r
      )
    );
    setReplyTexts((prev) => ({ ...prev, [reviewId]: "" }));
  }

  return (
    <div style={{ fontFamily: "var(--sans, 'Syne', sans-serif)", background: "var(--paper, #f5f2ec, #0a1520)", color: "var(--text, #e8f4ff)", minHeight: "100vh" }}>
      <style>{`
        @keyframes reviews-reviewSlide {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .reviews-toast {
          position: fixed; bottom: 32px; right: 32px; z-index: 999;
          background: var(--deep, #050d14); color: #e8f4ff;
          padding: 16px 24px; border-radius: 12px;
          border: 1px solid rgba(0,200,255,0.3);
          font-size: 13px; font-weight: 500;
          display: none; align-items: center; gap: 10px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.3);
        }
        .reviews-toast.show {
          display: flex;
          animation: toastSlide .4s cubic-bezier(.34,1.56,.64,1) forwards;
        }
        @keyframes toastSlide {
          from { transform: translateY(80px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .reviews-toast .toast-dot {
          width: 8px; height: 8px; border-radius: 50%; background: var(--accent, #00c8ff); flex-shrink: 0;
        }
        .write-review-section {
          background: var(--deep, #050d14); border-radius: 20px;
          padding: 28px; margin-bottom: 28px; position: relative; overflow: hidden;
        }
        .write-review-section::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse at 20% 0%, rgba(0,200,255,0.1) 0%, transparent 60%);
          pointer-events: none;
        }
        .review-author-input,
        .review-session-select {
          flex: 1; padding: 10px 14px;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px; color: rgba(232,244,255,0.8); font-family: var(--sans, 'Syne'); font-size: 13px;
          outline: none; cursor: pointer; transition: border-color 0.2s;
        }
        .review-session-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(232,244,255,0.4)' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 14px center;
        }
        .review-session-select option { background: #0a1520; color: #e8f4ff; }
        .review-author-input:focus,
        .review-session-select:focus { border-color: rgba(0,200,255,0.4); }
        .review-author-input::placeholder { color: rgba(232,244,255,0.25); }
        .review-textarea-input {
          width: 100%; min-height: 120px; padding: 14px;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px; color: rgba(232,244,255,0.9); font-family: var(--sans, 'Syne'); font-size: 13px;
          line-height: 1.65; outline: none; resize: vertical; transition: border-color 0.2s;
          margin-bottom: 0;
        }
        .review-textarea-input:focus { border-color: rgba(0,200,255,0.4); }
        .review-textarea-input::placeholder { color: rgba(232,244,255,0.25); }
        .submit-review-btn:hover { background: var(--accent, #00c8ff); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,200,255,0.3); }
        .submit-review-btn:active { transform: translateY(0); }
      `}</style>
      {/* ── NAV ── */}
      <nav className="reviews-nav">
        <Link href="/" className="nav-logo" style={{ textDecoration: "none", color: "var(--text)" }}>
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: "var(--accent)", width: 16, height: 16 }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M8 12h1l2-4 2 8 2-5 1 1h2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="logo-text">Respi<span style={{ color: "var(--accent2, #0090d4)" }}>Core</span></span>
        </Link>
        <span style={{ fontFamily: "var(--mono, monospace)", fontSize: 10, letterSpacing: "0.25em", color: "var(--text3, #4a7a9b)", textTransform: "uppercase", position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
          Community Voices
        </span>
        <div className="nav-links" style={{ gap: 16 }}>
          <Link href="/" className="btn-landing" style={{ fontSize: 12, fontWeight: 600, color: "var(--text2, #7aa8cc)", textDecoration: "none", border: "1px solid var(--border2, rgba(255,255,255,0.15))", padding: "7px 16px", borderRadius: 4 }}>
            ← Back to Home
          </Link>
          <Link href="/dashboard" className="btn-landing" style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", textDecoration: "none", border: "1px solid var(--accent)", padding: "7px 16px", borderRadius: 4 }}>
            Dashboard
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="reviews-hero">
        <div className="reviews-hero-inner">
          <div>
            <span className="reviews-chip">Community Feedback</span>
            <h1 className="reviews-title">Voices from the <em style={{ fontStyle: "italic", color: "var(--accent)" }}>community</em></h1>
            <p className="reviews-sub">What clinicians, engineers, and users say about RespiCore's approach to respiratory triage.</p>
          </div>
          <div className="reviews-stats-sidebar">
            <div className="reviews-big-rating">
              <span style={{ fontFamily: "var(--serif)", fontSize: 48, color: "var(--text)", lineHeight: 1 }}>4.5</span>
              <Stars count={4} />
            </div>
            <div className="reviews-avg-label">Average Rating</div>
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "12px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Reviews</span>
              <span style={{ fontFamily: "var(--monospace)", fontSize: 20, color: "var(--text)" }}>{reviews.length}</span>
            </div>
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "12px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Avg Session</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 14, color: "var(--accent)" }}>10s</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── REVIEWS FEED ── */}
      <section className="reviews-feed">
        <div className="reviews-feed-inner">
          <div className="reviews-feed-header">
            <div>
              <h2 style={{ fontFamily: "var(--serif)", fontSize: 28 }}>Latest Reviews</h2>
              <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", letterSpacing: "0.1em" }}>{reviews.length} reviews</span>
            </div>
          </div>

          {/* ── WRITE REVIEW ── */}
          <div className="write-review-section">
            <h3 style={{ fontFamily: "var(--serif)", fontSize: 22, color: "var(--accent)", marginBottom: 20 }}>Share Your Experience</h3>

            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <input
                className="review-author-input"
                placeholder="Your name (optional)"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
              <select
                className="review-session-select"
                value={formSession}
                onChange={(e) => setFormSession(e.target.value)}
              >
                <option value="">Select session…</option>
                <option value="Normal Cough Check">Normal Cough Check</option>
                <option value="COPD Screening">COPD Screening</option>
                <option value="Wheeze Detection">Wheeze Detection</option>
                <option value="Anomalous Pattern Scan">Anomalous Pattern Scan</option>
                <option value="Bronchitis Assessment">Bronchitis Assessment</option>
                <option value="General Demo Run">General Demo Run</option>
              </select>
            </div>

            {/* Star Rating Picker */}
            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Rating:</span>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setFormStars(n)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, padding: 0, color: n <= formStars ? "var(--gold, #c9a84c)" : "rgba(255,255,255,0.15)", transition: "all 0.15s", lineHeight: 1 }}>
                  ★
                </button>
              ))}
              {formStars > 0 && <span style={{ fontSize: 12, color: "var(--text3)", fontFamily: "var(--mono)", marginLeft: 6 }}>{formStars} star{formStars > 1 ? "s" : ""}</span>}
            </div>

            {/* Tag Picker */}
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)", letterSpacing: "0.08em", textTransform: "uppercase", marginRight: 8 }}>Tags:</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {ALL_TAGS.map((tag) => (
                  <button key={tag} onClick={() => toggleTag(tag)} style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.08em", padding: "4px 10px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.15)", background: formTags.includes(tag) ? "var(--accent-dim)" : "transparent", color: formTags.includes(tag) ? "var(--accent)" : "var(--text3)", cursor: "pointer", transition: "all 0.2s" }}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <textarea
              className="review-textarea-input"
              placeholder="What surprised you? What worked well? Any issues?"
              value={formText}
              onChange={(e) => setFormText(e.target.value)}
              rows={4}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
              <span style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--text3)" }}>
                {formText.length} character{formText.length !== 1 ? "s" : ""}
              </span>
              <button
                className="submit-review-btn"
                onClick={submitReview}
                style={{ background: "var(--accent2, #0090d4)", border: "none", borderRadius: 10, color: "white", fontFamily: "var(--sans)", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "12px 28px", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 8, letterSpacing: "0.02em" }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                Post Review
              </button>
            </div>
          </div>

          {reviews.map((review) => (
            <article className="review-card" key={review.id}>
              <div className="review-head">
                <div className="reviewer-info">
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg, ${review.avatarColor}, ${review.avatarColor}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--serif)", fontSize: 18, fontStyle: "italic", color: "white", flexShrink: 0 }}>
                    {review.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{review.author}</div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", letterSpacing: "0.06em", marginTop: 3 }}>{review.role}</div>
                  </div>
                </div>
                <Stars count={review.stars} />
              </div>

              <span className="review-session-badge">{review.session}</span>

              <p className="review-text">{review.text}</p>

              <div className="review-footer">
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {review.tags.map((tag) => (
                    <span key={tag} className="rtag">{tag}</span>
                  ))}
                </div>
                <button style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--sans)", fontSize: 12, color: "var(--text3)", display: "flex", alignItems: "center", gap: 5, padding: "4px 0" }} title="Like" suppressHydrationWarning>
                  <span style={{ fontSize: 13 }}>♥</span> {review.likes}
                </button>
              </div>

              {/* Replies */}
              {review.replies.length > 0 && (
                <div className="replies-wrap">
                  <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.15em", color: "var(--text3)", textTransform: "uppercase", marginBottom: 14 }}>
                    {review.replies.length} {review.replies.length === 1 ? "Reply" : "Replies"}
                  </div>
                  {review.replies.map((r, i) => (
                    <div className="reply-item" key={i}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, ${r.color}, ${r.color}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--serif)", fontSize: 13, fontStyle: "italic", color: "white", flexShrink: 0 }}>
                        {r.initials}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                          {r.author}
                          <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text3)", fontWeight: 400, marginLeft: 8, letterSpacing: "0.06em" }}>{r.role}</span>
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>{r.text}</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), var(--accent2))", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--serif)", fontSize: 11, fontStyle: "italic", color: "white", flexShrink: 0 }}>
                      {user.initials}
                    </div>
                    <input
                      className="reply-field"
                      placeholder="Write a reply..."
                      value={replyTexts[review.id] || ""}
                      onChange={(e) => setReplyTexts((prev) => ({ ...prev, [review.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === "Enter") handleReply(review.id); }}
                      style={{ flex: 1, padding: "9px 14px", border: "1px solid var(--border2, rgba(255,255,255,0.15))", borderRadius: 100, fontFamily: "var(--sans, 'Syne')", fontSize: 12, color: "var(--text, #e8f4ff)", background: "rgba(255,255,255,0.05)", outline: "none" }}
                      suppressHydrationWarning
                    />
                    <button
                      onClick={() => handleReply(review.id)}
                      style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--deep, #050d14)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                      suppressHydrationWarning
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="13" height="13">
                        <path d="M22 2L11 13" />
                        <path d="M22 2L15 22 11 13 2 9z" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* ── TOAST ── */}
      {toast && (
        <div className={`reviews-toast${toast ? " show" : ""}`}>
          <div className="toast-dot" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer className="reviews-footer">
        <span className="footer-note">© 2026 RespiCore. All rights reserved.</span>
        <span className="footer-warning">⚠ Research prototype — not a clinical diagnostic device</span>
      </footer>
    </div>
  );
}
