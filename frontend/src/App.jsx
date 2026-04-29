import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import _CountUpPkg from "react-countup";
const CountUp = _CountUpPkg?.default ?? _CountUpPkg;
import Tilt from "react-parallax-tilt";
import confetti from "canvas-confetti";
import { ethers } from "ethers";
import {
  Zap, BookOpen, Award, User, Check, Lock,
  Shield, Trophy, Users, BarChart2, GraduationCap, LogOut, CreditCard,
  Mail, RefreshCw,
} from "lucide-react";
import {
  registerUser, loginUser, getProfile, updateProfile,
  recordProgress, recordCertificate, getStats,
  getConfig, getUserPayments, verifyPayment, resendVerification,
} from "./utils/api";
import { getEthPrice, formatUsd } from "./utils/currency";
import NeuralBg from "./components/NeuralBg";
import HeroOrb from "./components/HeroOrb";
import LessonCard from "./components/LessonCard";
import PaymentPage from "./components/PaymentPage";
import "./App.css";

// Minimal ABI — only what App.jsx needs for single-lesson MetaMask purchases
const COURSE_PAYMENT_ABI = [
  "function purchaseLesson(uint256 lessonId) external payable",
  "function hasBundleAccess(address user) external view returns (bool)",
];

const lessons = [
  {
    id: 1, title: "Introduction to Generative AI", category: "Fundamentals", duration: "30 min",
    description: "Understand what generative AI is, how large language models work internally, and explore their major capabilities and practical use cases.",
    topics: ["Startup idea & business scenario", "GenAI technology landscape", "How LLMs work internally", "Key LLM capabilities & use cases"],
  },
  {
    id: 2, title: "Exploring and Comparing LLMs", category: "Fundamentals", duration: "45 min",
    description: "Survey the current LLM landscape, compare model types for your use case, and learn how to test, iterate, and deploy them on Azure.",
    topics: ["Types of LLMs in the landscape", "Testing & iterating on Azure", "How to deploy an LLM", "Selecting the right model"],
  },
  {
    id: 3, title: "Using Generative AI Responsibly", category: "Fundamentals", duration: "35 min",
    description: "Explore the core principles of Responsible AI, understand risks specific to generative AI, and apply ethical practices through strategy and tooling.",
    topics: ["Why Responsible AI matters", "Core Responsible AI principles", "Fairness, reliability & privacy", "Strategy and tooling for safe AI"],
  },
  {
    id: 4, title: "Prompt Engineering Fundamentals", category: "Prompting", duration: "50 min",
    description: "Master the basics of prompt engineering — learn what prompts are, their components, best practices, and how to craft them for consistent high-quality responses.",
    topics: ["What is prompt engineering", "Prompt components & structure", "Best practices & techniques", "Hands-on with OpenAI endpoints"],
  },
  {
    id: 5, title: "Creating Advanced Prompts", category: "Prompting", duration: "55 min",
    description: "Go beyond basics with advanced techniques — few-shot, zero-shot, chain-of-thought prompting — and learn to configure outputs for better results.",
    topics: ["Few-shot & zero-shot prompting", "Chain-of-thought reasoning", "Configuring temperature & output", "Meta prompts & context control"],
  },
  {
    id: 6, title: "Building Text Generation Apps", category: "Building", duration: "60 min",
    description: "Build your first text generation app using the OpenAI library, learning core concepts like completions, temperature, and token management.",
    topics: ["OpenAI library & core concepts", "Building a text generation app", "Prompts, temperature & tokens", "Completion API usage patterns"],
  },
  {
    id: 7, title: "Building Chat Applications", category: "Building", duration: "65 min",
    description: "Create AI-powered chat applications, explore conversation architecture, and learn to monitor quality and apply responsible AI at scale.",
    topics: ["Chat application architecture", "Integrating LLMs into chat UIs", "Conversation history management", "Monitoring & responsible AI"],
  },
  {
    id: 8, title: "Building Search Apps with Embeddings", category: "Building", duration: "70 min",
    description: "Use text embeddings to build semantic search — go beyond keyword matching to find content by meaning using vector similarity.",
    topics: ["Semantic vs. keyword search", "What are text embeddings", "Building an embeddings index", "Searching with vector similarity"],
  },
  {
    id: 9, title: "Building Image Generation Apps", category: "Building", duration: "75 min",
    description: "Generate images from text using DALL-E and Midjourney, define safety boundaries with meta prompts, and build a complete image generation app.",
    topics: ["Image generation with DALL-E", "Working with Midjourney", "Meta prompts for safety boundaries", "Building an image generation app"],
  },
  {
    id: 10, title: "Building Low Code AI Applications", category: "Building", duration: "50 min",
    description: "Use Microsoft Power Platform to build AI-powered apps and automations without writing traditional code.",
    topics: ["GenAI in Power Platform", "Building apps with Power Apps", "Automations with Power Automate", "AI Builder & GPT model integration"],
  },
  {
    id: 11, title: "Integrating with Function Calling", category: "Advanced", duration: "60 min",
    description: "Extend AI apps with function calling — connect LLMs to external APIs and real-world data sources for richer, more consistent responses.",
    topics: ["What is function calling", "Function calls with Azure OpenAI", "Integrating functions into apps", "Designing effective function schemas"],
  },
  {
    id: 12, title: "Designing UX for AI Applications", category: "Advanced", duration: "55 min",
    description: "Design user experiences that are accessible, trustworthy, and built around how people naturally interact with AI — including feedback and transparency.",
    topics: ["UX principles for AI apps", "Designing for trust & transparency", "Accessibility in AI interfaces", "Collaboration & feedback loops"],
  },
  {
    id: 13, title: "Securing Generative AI Applications", category: "Advanced", duration: "65 min",
    description: "Protect your AI apps from prompt injection, adversarial inputs, and other threats specific to generative AI systems through security testing.",
    topics: ["AI security threat landscape", "Common risks to AI systems", "Prompt injection & jailbreaking", "Security testing & defense strategies"],
  },
  {
    id: 14, title: "The Generative AI App Lifecycle", category: "Advanced", duration: "70 min",
    description: "Manage the complete lifecycle of a generative AI app — from MLOps to LLMOps — with monitoring, evaluation tools, and continuous improvement.",
    topics: ["MLOps vs. LLMOps paradigm", "LLM lifecycle stages", "Lifecycle tooling overview", "Metrics, monitoring & evaluation"],
  },
  {
    id: 15, title: "RAG and Vector Databases", category: "Advanced", duration: "75 min",
    description: "Implement Retrieval-Augmented Generation to ground LLM responses in your own data — combining vector databases with generative models.",
    topics: ["What is RAG and why use it", "Vector databases explained", "Creating & querying embeddings", "Building a full RAG pipeline"],
  },
  {
    id: 16, title: "Open Source Models with HuggingFace", category: "Advanced", duration: "60 min",
    description: "Explore the open-source LLM ecosystem on HuggingFace and Azure AI Studio — understand when to choose open vs. proprietary models.",
    topics: ["Open source LLM landscape", "HuggingFace model hub", "Open vs. proprietary trade-offs", "Deploying open-source models"],
  },
  {
    id: 17, title: "AI Agents", category: "Expert", duration: "80 min",
    description: "Build autonomous AI agents that can plan, reason, use tools, and take actions — exploring four major agent frameworks and their use cases.",
    topics: ["What are AI agents", "Comparing 4 agent frameworks", "Planning, tools & state management", "When to use AI agents"],
  },
  {
    id: 18, title: "Fine-Tuning LLMs", category: "Expert", duration: "85 min",
    description: "Customize pre-trained language models for specific domains by fine-tuning — learn when to use it, how it works, and its limitations vs. prompting.",
    topics: ["What is fine-tuning", "When and why to fine-tune", "Fine-tuning process & data prep", "Limitations of fine-tuning"],
  },
  {
    id: 19, title: "Small Language Models (SLMs)", category: "Expert", duration: "70 min",
    description: "Work with efficient small language models for edge and mobile deployment — explore their NLP capabilities and compare trade-offs against LLMs.",
    topics: ["What are SLMs", "SLM architecture & training", "Text generation & translation tasks", "SLM vs. LLM trade-offs"],
  },
  {
    id: 20, title: "Building with Mistral Models", category: "Expert", duration: "65 min",
    description: "Explore Mistral Large, Small, and Nemo — understand each model's strengths and build apps using the GitHub Model marketplace.",
    topics: ["Mistral Large 2 for enterprise", "Mistral Small for efficiency", "Mistral Nemo capabilities", "GitHub Models marketplace"],
  },
  {
    id: 21, title: "Building with Meta LLaMA Models", category: "Expert", duration: "65 min",
    description: "Work with Meta's Llama 3.1 and Llama 3.2 model families — explore their variants, multimodal features, and integrate them via GitHub Models.",
    topics: ["Llama 3.1 (70B & 405B Instruct)", "Llama 3.2 multimodal features", "Use cases for each variant", "GitHub Models integration"],
  },
];

const githubBaseUrl = "https://microsoft.github.io/generative-ai-for-beginners/#/";
const lessonPaths = {
  1: "01-introduction-to-genai/", 2: "02-exploring-and-comparing-different-llms/",
  3: "03-using-generative-ai-responsibly/", 4: "04-prompt-engineering-fundamentals/",
  5: "05-advanced-prompts/", 6: "06-text-generation-apps/",
  7: "07-building-chat-applications/", 8: "08-building-search-applications/",
  9: "09-building-image-applications/", 10: "10-building-low-code-ai-applications/",
  11: "11-integrating-with-function-calling/", 12: "12-designing-ux-for-ai-applications/",
  13: "13-securing-ai-applications/", 14: "14-the-generative-ai-application-lifecycle/",
  15: "15-rag-and-vector-databases/", 16: "16-open-source-models/",
  17: "17-ai-agents/", 18: "18-fine-tuning/", 19: "19-slm/",
  20: "20-mistral/", 21: "21-meta/",
};

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit:    { opacity: 0, y: -12, transition: { duration: 0.18 } },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.055 } },
};

const cardVariant = {
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.38, ease: "easeOut" } },
};

function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });

  // Set to true after registration — shows "check your email" screen
  const [pendingVerification, setPendingVerification] = useState(false);
  // Set to the email address when login fails due to unverified account
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [certificateClaimed, setCertificateClaimed] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [loading, setLoading] = useState("");
  const [page, setPage] = useState("home");
  const [filter, setFilter] = useState("All");

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", email: "", bio: "" });
  const [stats, setStats] = useState({ totalUsers: 0, totalCompletions: 0, totalCerts: 0 });
  const [justCompleted, setJustCompleted] = useState(null);
  const [unlockedLessons, setUnlockedLessons] = useState(new Set());
  const [hasBundle, setHasBundle] = useState(false);
  const [payments, setPayments] = useState([]);
  const [ethPrice, setEthPrice] = useState(null);
  const [config, setConfig] = useState(null);

  const setStatus = (text, type = "info") => {
    setMessage(text);
    setMessageType(type);
    if (type !== "error") setTimeout(() => setMessage(""), 4000);
  };

  // ── On mount: handle email verification redirect ───────────────────────
  useEffect(() => {
    const params   = new URLSearchParams(window.location.search);
    const verified = params.get("verified");
    if (verified === "true") {
      setAuthMode("login");
      setStatus("Email verified! You can now sign in.", "success");
    } else if (verified === "invalid") {
      setStatus("Verification link is invalid or has expired. Please register again or resend.", "error");
    }
    if (verified) {
      // Clean the URL so the banner doesn't re-appear on refresh
      history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    getEthPrice().then(setEthPrice).catch(() => {});
  }, []);

  // ── Load everything that depends on the logged-in user ─────────────────
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const p = await getProfile(user.id);
        if (p) {
          setCompletedLessons(new Set(p.lessons.map((l) => l.lesson_id)));
          setCertificateClaimed(!!p.certificate);
        }
      } catch {}
      try {
        const s = await getStats();
        setStats(s);
      } catch {}
      try {
        const cfg = await getConfig();
        setConfig(cfg);
      } catch {}
      try {
        await refreshPayments(user.id);
      } catch {}
    };
    load();
  }, [user]);

  // ── Shared helper: reload payments and recompute unlock state ──────────
  async function refreshPayments(userId) {
    const paid = await getUserPayments(userId);
    setPayments(paid);
    const confirmed = paid.filter((p) => p.status === "confirmed");
    const bundle    = confirmed.some((p) => p.payment_type === "bundle");
    setHasBundle(bundle);
    if (bundle) {
      setUnlockedLessons(new Set(lessons.map((l) => l.id)));
    } else {
      setUnlockedLessons(new Set(
        confirmed.filter((p) => p.payment_type === "lesson").map((p) => p.lesson_id)
      ));
    }
  }

  // ── Auth ───────────────────────────────────────────────────────────────
  const handleAuth = async () => {
    setLoading("auth");
    setUnverifiedEmail("");
    try {
      if (authMode === "register") {
        const { name, email, password } = authForm;
        if (!name || !email || !password) throw new Error("All fields are required");
        const result = await registerUser(name, email, password);
        if (result.pending) {
          // Registration accepted — user must verify email before logging in
          setPendingVerification(true);
          setAuthForm({ name: "", email: "", password: "" });
          // Don't call setUser — they're not logged in yet
        }
      } else {
        const { email, password } = authForm;
        if (!email || !password) throw new Error("Email and password are required");
        const u = await loginUser(email, password);
        setUser(u);
        setProfileForm({ name: u.name, email: u.email, bio: u.bio || "" });
        setStatus("Logged in!", "success");
      }
    } catch (err) {
      let msg = err.message || "Something went wrong";
      try { msg = JSON.parse(msg).error; } catch {}
      // Machine-readable code sent by server when email isn't verified
      if (msg === "email_not_verified") {
        msg = "Please verify your email before signing in. Check your inbox.";
        setUnverifiedEmail(authForm.email);
      }
      setStatus(msg, "error");
    }
    setLoading("");
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setLoading("resend");
    try {
      await resendVerification(unverifiedEmail);
      setStatus("Verification email sent — check your inbox.", "success");
      setUnverifiedEmail("");
    } catch (err) {
      let msg = err.message || "Could not resend";
      try { msg = JSON.parse(msg).error; } catch {}
      setStatus(msg, "error");
    }
    setLoading("");
  };

  // ── MetaMask lesson unlock (replaces old server-paid flow) ─────────────
  const handleUnlock = async (lessonId) => {
    if (!window.ethereum) {
      setStatus("MetaMask not found — install it from metamask.io", "error");
      return;
    }
    if (!config?.coursePaymentAddress) {
      setStatus(
        "Payment contract not deployed yet. Deploy CoursePayment.sol first (see Payments tab).",
        "error"
      );
      return;
    }

    setLoading(`unlock-${lessonId}`);
    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      await browserProvider.send("eth_requestAccounts", []);
      const network = await browserProvider.getNetwork();
      if (Number(network.chainId) !== (config.chainId ?? 31337)) {
        setStatus(`Switch MetaMask to Hardhat Localhost (chain ${config.chainId ?? 31337}, RPC http://127.0.0.1:8545)`, "error");
        setLoading("");
        return;
      }

      const signer  = await browserProvider.getSigner();
      const address = await signer.getAddress();
      const cp      = new ethers.Contract(config.coursePaymentAddress, COURSE_PAYMENT_ABI, signer);

      const tx = await cp.purchaseLesson(lessonId, {
        value: ethers.parseEther(config.lessonPriceEth ?? "0.001"),
      });
      setStatus("Transaction submitted — awaiting confirmation…", "info");
      const receipt = await tx.wait();

      await verifyPayment({
        user_id: user.id,
        tx_hash: receipt.hash,
        payment_type: "lesson",
        lesson_id: lessonId,
        wallet_address: address,
      });

      await refreshPayments(user.id);
      setStatus(`Lesson ${lessonId} purchased — you can now complete it`, "success");
    } catch (err) {
      const msg = err?.reason || err?.shortMessage || err?.message || "Transaction failed";
      setStatus(msg.slice(0, 160), "error");
    }
    setLoading("");
  };

  const completeLesson = async (id) => {
    if (completedLessons.has(id)) return;
    setLoading(`lesson-${id}`);
    try {
      await recordProgress(user.id, id);
      setCompletedLessons((prev) => new Set([...prev, id]));
      setJustCompleted(id);
      setTimeout(() => setJustCompleted(null), 1200);
      confetti({
        particleCount: 85,
        spread: 65,
        origin: { y: 0.65 },
        colors: ["#aa3bff", "#22d3ee", "#4ade80"],
        disableForReducedMotion: true,
      });
      setStatus(`Lesson ${id} completed`, "success");
    } catch {
      setStatus("Could not record lesson", "error");
    }
    setLoading("");
  };

  const claimCertificate = async () => {
    setLoading("certificate");
    try {
      await recordCertificate(user.id);
      setCertificateClaimed(true);
      confetti({
        particleCount: 220,
        spread: 110,
        origin: { y: 0.5 },
        colors: ["#aa3bff", "#22d3ee", "#fbbf24", "#4ade80", "#f472b6"],
        disableForReducedMotion: true,
      });
      setStatus("Certificate claimed!", "success");
    } catch {
      setStatus("Could not claim certificate", "error");
    }
    setLoading("");
  };

  const saveProfile = async () => {
    setLoading("profile");
    try {
      const updated = await updateProfile(user.id, profileForm);
      setUser((prev) => ({ ...prev, name: updated.name, email: updated.email, bio: updated.bio }));
      setEditingProfile(false);
      setStatus("Profile saved", "success");
    } catch {
      setStatus("Could not save profile", "error");
    }
    setLoading("");
  };

  const logout = () => {
    setUser(null);
    setCompletedLessons(new Set());
    setCertificateClaimed(false);
    setPage("home");
    setAuthForm({ name: "", email: "", password: "" });
    setAuthMode("login");
    setUnlockedLessons(new Set());
    setHasBundle(false);
    setPayments([]);
    setConfig(null);
    setPendingVerification(false);
    setUnverifiedEmail("");
  };

  const progress    = Math.round((completedLessons.size / 21) * 100);
  const categories  = ["All", "Fundamentals", "Prompting", "Building", "Advanced", "Expert"];
  const filtered    = filter === "All" ? lessons : lessons.filter((l) => l.category === filter);
  const initials    = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const lessonFeeEth  = config?.lessonPriceEth ?? "0.001";
  const feeDisplay    = ethPrice ? formatUsd(lessonFeeEth, ethPrice.usd) : `${lessonFeeEth} ETH`;

  const navItems = [
    { key: "home",        label: "Dashboard",   Icon: BarChart2  },
    { key: "lessons",     label: "Lessons",     Icon: BookOpen   },
    { key: "payments",    label: "Payments",    Icon: CreditCard },
    { key: "profile",     label: "Profile",     Icon: User       },
    { key: "certificate", label: "Certificate", Icon: Award      },
  ];

  const toast = (
    <AnimatePresence>
      {message && (
        <motion.div
          className={`status-toast status-${messageType}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22 }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );

  /* ── Auth page ─────────────────────────────────────────────── */
  if (!user) {
    return (
      <div className="app">
        <NeuralBg />
        {toast}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100svh", padding: "24px" }}>

          {/* ── "Check your email" screen shown after registration ── */}
          {pendingVerification ? (
            <motion.div
              className="card"
              style={{ maxWidth: 420, width: "100%", textAlign: "center" }}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38 }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                <div className="brand-icon" style={{ width: 56, height: 56 }}>
                  <Mail size={26} />
                </div>
                <h2 style={{ fontSize: 22, fontFamily: "var(--font-head)", fontWeight: 700, margin: 0 }}>
                  Check your email
                </h2>
                <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>
                  We sent a verification link to your inbox. Click it to activate your account — the link expires in 24 hours.
                </p>
                <button
                  className="btn btn-ghost"
                  style={{ marginTop: 8 }}
                  onClick={() => { setPendingVerification(false); setAuthMode("login"); }}
                >
                  Back to Sign In
                </button>
              </div>
            </motion.div>
          ) : (

          /* ── Normal login / register form ── */
          <motion.div
            className="card"
            style={{ maxWidth: 420, width: "100%" }}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38 }}
          >
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div className="brand-icon">
                <Zap size={18} />
              </div>
              <h2 style={{ fontSize: 24, fontFamily: "var(--font-head)", fontWeight: 700, background: "var(--grad-primary)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>
                GenAI Learning
              </h2>
              <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>
                {authMode === "login" ? "Sign in to continue your learning journey" : "Create your account to get started"}
              </p>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                className={`filter-btn${authMode === "login" ? " active" : ""}`}
                style={{ flex: 1 }}
                onClick={() => { setAuthMode("login"); setUnverifiedEmail(""); }}
              >
                Login
              </button>
              <button
                className={`filter-btn${authMode === "register" ? " active" : ""}`}
                style={{ flex: 1 }}
                onClick={() => { setAuthMode("register"); setUnverifiedEmail(""); }}
              >
                Register
              </button>
            </div>

            <div className="profile-form" style={{ gap: 14 }}>
              {authMode === "register" && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Your full name"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="your@email.com"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="••••••••"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                />
              </div>
              <button
                className="btn btn-primary btn-full"
                onClick={handleAuth}
                disabled={loading === "auth"}
                style={{ marginTop: 4 }}
              >
                {loading === "auth" ? (
                  <><span className="btn-spin" /> {authMode === "login" ? "Signing in…" : "Creating account…"}</>
                ) : (
                  <>{authMode === "login" ? "Sign In" : "Create Account"}</>
                )}
              </button>

              {/* Resend verification UI — shown only when login blocked by unverified email */}
              {unverifiedEmail && authMode === "login" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "12px 0 4px" }}>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, textAlign: "center" }}>
                    Didn't receive the email?
                  </p>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleResendVerification}
                    disabled={loading === "resend"}
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    {loading === "resend"
                      ? <><span className="btn-spin" /> Sending…</>
                      : <><RefreshCw size={13} /> Resend verification email</>}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
          )}
        </div>
      </div>
    );
  }

  /* ── Main app ──────────────────────────────────────────────── */
  return (
    <div className="app">
      <NeuralBg />

      <nav className="top-navbar">
        <div className="navbar-inner">
          <div className="navbar-brand" onClick={() => setPage("home")}>
            <div className="brand-icon">
              <Zap size={18} />
            </div>
            <span className="brand-name">GenAI Learning</span>
          </div>

          <div className="navbar-links">
            {navItems.map(({ key, label, Icon }) => (
              <button
                key={key}
                className={`nav-link${page === key ? " active" : ""}`}
                onClick={() => setPage(key)}
              >
                <Icon size={15} className="nav-icon" />
                <span className="nav-label">{label}</span>
              </button>
            ))}
          </div>

          <div className="navbar-actions" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="wallet-pill">
              <span className="wallet-dot connected" />
              <span>{user.name || user.email}</span>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={logout}
              title="Logout"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <LogOut size={14} />
              <span className="nav-label">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {toast}

      <main className="page-wrapper">
        <AnimatePresence mode="wait">

          {/* ══ DASHBOARD ════════════════════════════════════════ */}
          {page === "home" && (
            <motion.div key="home" className="home-page" variants={pageVariants} initial="initial" animate="animate" exit="exit">

              <section className="hero">
                <div className="hero-inner">
                  <div className="hero-content">
                    <p className="hero-eyebrow">
                      <span className="hero-eyebrow-dot" />
                      Blockchain-Verified Learning
                    </p>
                    <h1 className="hero-title">
                      Welcome back,{" "}
                      <span className="hero-title-grad">{user.name?.split(" ")[0] || "Learner"}</span>
                    </h1>
                    <p className="hero-subtitle">
                      21 structured lessons from Microsoft. Every completion recorded permanently on Ethereum.
                    </p>
                    <div className="progress-bar-wrap" style={{ maxWidth: 460 }}>
                      <div className="progress-bar-track">
                        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="progress-bar-label">{completedLessons.size} of 21 lessons — {progress}% complete</span>
                    </div>
                    <div className="hero-cta-row">
                      <button className="btn btn-primary btn-lg" onClick={() => setPage("lessons")}>
                        <BookOpen size={18} />
                        {completedLessons.size === 0 ? "Start Learning" : `Continue — ${completedLessons.size}/21 done`}
                      </button>
                    </div>
                  </div>
                  <div className="hero-orb-side">
                    <HeroOrb />
                  </div>
                </div>
              </section>

              {/* 4 stat boxes */}
              <motion.div className="progress-stats-row" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }} variants={staggerContainer} initial="initial" animate="animate">
                {[
                  { label: "Completed",    value: completedLessons.size },
                  { label: "Remaining",    value: 21 - completedLessons.size },
                  { label: "Progress",     value: `${progress}%` },
                  { label: "Certificate",  value: certificateClaimed ? "Earned" : completedLessons.size === 21 ? "Ready" : "Locked" },
                ].map(({ label, value }) => (
                  <motion.div key={label} className="mini-stat" variants={cardVariant}>
                    <span className="mini-stat-value">{value}</span>
                    <span className="mini-stat-label">{label}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* Lesson map */}
              <motion.div className="card card-full" variants={cardVariant} initial="initial" animate="animate">
                <h3 className="card-title">
                  <GraduationCap size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
                  Lesson Map
                </h3>
                <div className="lesson-map">
                  {lessons.map((l) => (
                    <div key={l.id} className={`lesson-dot${completedLessons.has(l.id) ? " done" : ""}`}>
                      {l.id}
                    </div>
                  ))}
                </div>
                <button className="btn btn-primary" style={{ alignSelf: "flex-start" }} onClick={() => setPage("lessons")}>
                  <BookOpen size={15} />
                  {completedLessons.size === 0 ? "Start First Lesson" : "Continue Learning"}
                </button>
              </motion.div>

              {/* Platform stats */}
              <motion.div className="stats-strip" variants={staggerContainer} initial="initial" animate="animate">
                {[
                  { icon: <Users size={18} />,    value: stats.totalUsers,       label: "Total Learners"       },
                  { icon: <BookOpen size={18} />,  value: 21,                     label: "Free Lessons"         },
                  { icon: <BarChart2 size={18} />, value: stats.totalCompletions, label: "Lessons Completed"    },
                  { icon: <Award size={18} />,     value: stats.totalCerts,       label: "Certificates Issued"  },
                ].map(({ icon, value, label }) => (
                  <motion.div key={label} className="stat-item" variants={cardVariant}>
                    <div className="stat-icon">{icon}</div>
                    <span className="stat-value">
                      <CountUp end={typeof value === "number" ? value : 0} duration={2.2} enableScrollSpy scrollSpyOnce />
                    </span>
                    <span className="stat-label">{label}</span>
                  </motion.div>
                ))}
              </motion.div>

            </motion.div>
          )}

          {/* ══ LESSONS ══════════════════════════════════════════ */}
          {page === "lessons" && (
            <motion.div key="lessons" className="lessons-page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <div className="page-header">
                <h2>Course Catalog</h2>
                <p>21 lessons across 5 tracks — Fundamentals through Expert.</p>
              </div>

              <div className="filter-bar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className={`filter-btn${filter === cat ? " active" : ""}`}
                    onClick={() => setFilter(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <motion.div
                className="lessons-grid"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                key={filter}
              >
                {filtered.map((lesson) => {
                  const done     = completedLessons.has(lesson.id);
                  const unlocked = done || hasBundle || unlockedLessons.has(lesson.id);
                  return (
                    <motion.div key={lesson.id} variants={cardVariant}>
                      <LessonCard
                        lesson={lesson}
                        done={done}
                        unlocked={unlocked}
                        busy={loading === `lesson-${lesson.id}`}
                        busyUnlock={loading === `unlock-${lesson.id}`}
                        isFlipping={justCompleted === lesson.id}
                        githubBaseUrl={githubBaseUrl}
                        lessonPaths={lessonPaths}
                        onComplete={() => completeLesson(lesson.id)}
                        onUnlock={() => handleUnlock(lesson.id)}
                        feeDisplay={feeDisplay}
                      />
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
          )}

          {/* ══ PAYMENTS ═════════════════════════════════════════ */}
          {page === "payments" && (
            <motion.div key="payments" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <PaymentPage
                user={user}
                setStatus={setStatus}
                onPaymentConfirmed={() => refreshPayments(user.id)}
              />
            </motion.div>
          )}

          {/* ══ PROFILE ══════════════════════════════════════════ */}
          {page === "profile" && (
            <motion.div key="profile" className="profile-page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <div className="page-header">
                <h2>My Profile</h2>
              </div>

              <div className="profile-layout">
                <div className="profile-sidebar">
                  <div className="card">
                    <div className="profile-avatar">{initials}</div>
                    <h3 className="profile-name">{user.name || "Unnamed Learner"}</h3>
                    <p className="profile-wallet-addr">{user.email}</p>
                    <div className="profile-badges">
                      <span className="badge badge-success">
                        <Check size={11} /> Registered Learner
                      </span>
                      {certificateClaimed && (
                        <span className="badge badge-gold"><Trophy size={11} /> Certificate Holder</span>
                      )}
                    </div>
                    <div className="profile-quick-stats">
                      <div className="quick-stat">
                        <span className="quick-stat-value">{completedLessons.size}</span>
                        <span className="quick-stat-label">Lessons Done</span>
                      </div>
                      <div className="quick-stat">
                        <span className="quick-stat-value">{progress}%</span>
                        <span className="quick-stat-label">Complete</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="profile-main">
                  <div className="card">
                    <div className="card-header-row">
                      <h3 className="card-title">Profile Information</h3>
                      {!editingProfile && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setProfileForm({ name: user.name, email: user.email, bio: user.bio || "" });
                            setEditingProfile(true);
                          }}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                    {!editingProfile ? (
                      <div className="profile-details">
                        {[
                          { label: "Full Name", value: user.name || "—" },
                          { label: "Email",     value: user.email || "—" },
                          { label: "Bio",       value: user.bio || "—" },
                        ].map(({ label, value }) => (
                          <div key={label} className="profile-row">
                            <span className="profile-label">{label}</span>
                            <span className="profile-value">{value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="profile-form">
                        {[
                          { field: "name",  label: "Full Name",     type: "text",  placeholder: "Your full name"  },
                          { field: "email", label: "Email Address", type: "email", placeholder: "your@email.com"  },
                        ].map(({ field, label, type, placeholder }) => (
                          <div key={field} className="form-group">
                            <label className="form-label">{label}</label>
                            <input
                              className="form-input"
                              type={type}
                              value={profileForm[field]}
                              onChange={(e) => setProfileForm({ ...profileForm, [field]: e.target.value })}
                              placeholder={placeholder}
                            />
                          </div>
                        ))}
                        <div className="form-group">
                          <label className="form-label">Bio</label>
                          <textarea
                            className="form-input form-textarea"
                            value={profileForm.bio}
                            onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                            placeholder="Tell us about yourself"
                            rows={3}
                          />
                        </div>
                        <div className="form-actions">
                          <button className="btn btn-ghost" onClick={() => setEditingProfile(false)}>Cancel</button>
                          <button className="btn btn-primary" onClick={saveProfile} disabled={loading === "profile"}>
                            {loading === "profile" ? <><span className="btn-spin" /> Saving…</> : "Save Changes"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="card">
                    <h3 className="card-title">Data Storage</h3>
                    <div className="storage-info">
                      <div className="storage-row">
                        <span className="storage-icon">⛓️</span>
                        <div>
                          <span className="storage-title">On-chain (Blockchain)</span>
                          <span className="storage-desc">Registration, lesson unlocks, completions, certificate — immutable and verifiable</span>
                        </div>
                      </div>
                      <div className="storage-row">
                        <span className="storage-icon">🗄️</span>
                        <div>
                          <span className="storage-title">Off-chain (MongoDB)</span>
                          <span className="storage-desc">Profile info, payment records, progress history — fast and queryable</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment summary — full history is in the Payments tab */}
                  <div className="card">
                    <div className="card-header-row">
                      <h3 className="card-title">
                        <CreditCard size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />
                        Payment Summary
                      </h3>
                      {payments.length > 0 && (
                        <span className="badge badge-success">{payments.length} transaction{payments.length !== 1 ? "s" : ""}</span>
                      )}
                    </div>

                    {payments.length === 0 ? (
                      <p className="card-text" style={{ color: "var(--text-muted)" }}>
                        No payments yet.{" "}
                        <button className="btn btn-ghost btn-sm" style={{ display: "inline", padding: "0 4px" }} onClick={() => setPage("payments")}>
                          Go to Payments
                        </button>{" "}
                        to unlock lessons with ETH.
                      </p>
                    ) : (
                      <>
                        {(() => {
                          const totalWei = payments.reduce((sum, p) => {
                            try { return sum + BigInt(p.amount_wei || "0"); } catch { return sum; }
                          }, BigInt(0));
                          const totalEth = Number(ethers.formatEther(totalWei)).toFixed(4);
                          return (
                            <div className="payments-summary">
                              <span className="payments-summary-total">
                                Total spent: {totalEth} ETH
                                {ethPrice ? ` (${formatUsd(totalEth, ethPrice.usd)})` : ""}
                              </span>
                              <span className="payments-note">
                                {hasBundle ? "Full bundle active — all lessons unlocked." : `${unlockedLessons.size} lesson${unlockedLessons.size !== 1 ? "s" : ""} individually unlocked.`}
                              </span>
                            </div>
                          );
                        })()}

                        <div className="payments-list">
                          {payments.slice(0, 5).map((p) => {
                            const lesson   = lessons.find((l) => l.id === p.lesson_id);
                            const ethAmt   = (() => { try { return Number(ethers.formatEther(BigInt(p.amount_wei || "0"))).toFixed(4); } catch { return "0.0000"; } })();
                            const dateStr  = new Date(p.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
                            return (
                              <div key={p.tx_hash} className="payment-row">
                                <div className="payment-lesson-info">
                                  <span className="payment-lesson-title">
                                    {p.payment_type === "bundle"
                                      ? "Full Bundle — all 21 lessons"
                                      : lesson ? `Lesson ${p.lesson_id}: ${lesson.title}` : `Lesson ${p.lesson_id}`}
                                  </span>
                                  <span className="payment-date">{dateStr}</span>
                                </div>
                                <div className="payment-amount-info">
                                  <span className="payment-amount">
                                    {ethPrice ? formatUsd(ethAmt, ethPrice.usd) : `${ethAmt} ETH`}{ethPrice ? ` · ${ethAmt} ETH` : ""}
                                  </span>
                                  <span className="payment-hash" title={p.tx_hash}>
                                    {p.tx_hash ? `${p.tx_hash.slice(0, 10)}…${p.tx_hash.slice(-6)}` : "—"}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                          {payments.length > 5 && (
                            <button className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start", marginTop: 4 }} onClick={() => setPage("payments")}>
                              View all {payments.length} transactions →
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ══ CERTIFICATE ══════════════════════════════════════ */}
          {page === "certificate" && (
            <motion.div key="certificate" className="cert-page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <div className="page-header">
                <h2>Certificate of Completion</h2>
                <p>Complete all 21 lessons to earn your blockchain-verified certificate.</p>
              </div>

              <div className="cert-container">
                {completedLessons.size < 21 && (
                  <div className="card cert-progress-card">
                    <Lock size={52} style={{ color: "var(--purple)", opacity: 0.55 }} />
                    <h3>Certificate Locked</h3>
                    <p className="card-text">
                      You&apos;ve completed {completedLessons.size} of 21 lessons.{" "}
                      {21 - completedLessons.size} more to go!
                    </p>
                    <div className="progress-bar-wrap" style={{ width: "100%" }}>
                      <div className="progress-bar-track">
                        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="progress-bar-label">{progress}% complete</span>
                    </div>
                    <button className="btn btn-primary" onClick={() => setPage("lessons")}>
                      <BookOpen size={15} /> Continue Learning
                    </button>
                  </div>
                )}

                {completedLessons.size === 21 && !certificateClaimed && (
                  <div className="card cert-progress-card">
                    <Trophy size={54} style={{ color: "var(--amber)", filter: "drop-shadow(0 0 14px rgba(251,191,36,0.6))" }} />
                    <h3>Ready to Claim!</h3>
                    <p className="card-text">
                      You&apos;ve completed all 21 lessons. Claim your certificate to record it permanently on the Ethereum blockchain.
                    </p>
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={claimCertificate}
                      disabled={loading === "certificate"}
                    >
                      {loading === "certificate"
                        ? <><span className="btn-spin" /> Claiming…</>
                        : <><Trophy size={18} /> Claim Certificate</>}
                    </button>
                  </div>
                )}

                {certificateClaimed && (
                  <div className="cert-earned">
                    <Tilt
                      tiltMaxAngleX={10}
                      tiltMaxAngleY={10}
                      glareEnable
                      glareMaxOpacity={0.12}
                      glareColor="rgba(255,255,255,0.9)"
                      glarePosition="all"
                      perspective={1200}
                      transitionSpeed={500}
                      className="cert-tilt"
                    >
                      <div className="cert-frame">
                        <div className="cert-foil-strip" />
                        <div className="cert-body">
                          <div className="cert-trophy">
                            <Trophy size={64} className="cert-trophy-icon" />
                          </div>
                          <p className="cert-org">GenAI Learning DApp</p>
                          <h2 className="cert-course-name">Generative AI for Beginners</h2>
                          <p className="cert-subtitle">Certificate of Completion</p>
                          <div className="cert-divider" />
                          <p className="cert-awarded-to">Awarded to</p>
                          <h3 className="cert-holder">{user.name || "Learner"}</h3>
                          <p className="cert-addr">{user.email}</p>
                          <div className="cert-footer">
                            <span className="cert-verified">
                              <Shield size={14} /> Verified on Ethereum Blockchain
                            </span>
                          </div>
                        </div>
                      </div>
                    </Tilt>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <footer className="app-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Zap size={14} style={{ color: "var(--purple)" }} />
            GenAI Learning DApp — powered by Ethereum
          </div>
          <span>Microsoft Generative AI for Beginners curriculum</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
