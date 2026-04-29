import express from "express";
import cors from "cors";
import { randomBytes } from "crypto";
import { ethers } from "ethers";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import { connectDB, User, LessonProgress, Certificate, Payment } from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SMTP_HOST     = process.env.SMTP_HOST     || "smtp.gmail.com";
const SMTP_PORT     = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER     = process.env.SMTP_USER     || "";
const SMTP_PASS     = process.env.SMTP_PASS     || "";
const SMTP_FROM     = process.env.SMTP_FROM     || "GenAI Learning <no-reply@genai.local>";
const APP_URL       = process.env.APP_URL       || "http://localhost:3001";
const FRONTEND_URL  = process.env.FRONTEND_URL  || "http://localhost:5175";
const TOTAL_LESSONS = 21;

const mailer = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

async function sendVerificationEmail(email, token) {
  const link = `${APP_URL}/api/verify/${token}`;
  if (!SMTP_USER) {
    console.log(`[DEV] Verification link for ${email}: ${link}`);
    return;
  }
  await mailer.sendMail({
    from: SMTP_FROM,
    to: email,
    subject: "Verify your GenAI Learning account",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#aa3bff">GenAI Learning</h2>
        <p>Thanks for registering! Click the button below to verify your email address.</p>
        <a href="${link}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#aa3bff,#22d3ee);color:#fff;border-radius:8px;text-decoration:none;font-weight:700">
          Verify Email
        </a>
        <p style="color:#888;font-size:13px;margin-top:24px">
          Or copy this link: ${link}
        </p>
      </div>
    `,
  });
}

const RPC_URL     = process.env.RPC_URL     || "http://127.0.0.1:8545";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// ── LearningTracker contract ───────────────────────────────────────
let contract = null;
try {
  const { abi } = JSON.parse(
    readFileSync(
      join(__dirname, "../backend/artifacts/contracts/LearningTracker.sol/LearningTracker.json"),
      "utf8"
    )
  );
  const deployedAddresses = JSON.parse(
    readFileSync(
      join(__dirname, "../backend/ignition/deployments/chain-31337/deployed_addresses.json"),
      "utf8"
    )
  );
  const contractAddress = process.env.CONTRACT_ADDRESS
    || deployedAddresses["LearningTrackerModule#LearningTracker"];

  if (!contractAddress) throw new Error("Contract address not found");
  contract = new ethers.Contract(contractAddress, abi, wallet);
  console.log(`LearningTracker loaded at ${contractAddress}`);
} catch (err) {
  console.warn("Warning: LearningTracker not loaded:", err.message);
}

// ── CoursePayment contract ─────────────────────────────────────────
let paymentContract = null;
let paymentContractAddress = null;
try {
  const { abi } = JSON.parse(
    readFileSync(
      join(__dirname, "../backend/artifacts/contracts/CoursePayment.sol/CoursePayment.json"),
      "utf8"
    )
  );
  const deployedAddresses = JSON.parse(
    readFileSync(
      join(__dirname, "../backend/ignition/deployments/chain-31337/deployed_addresses.json"),
      "utf8"
    )
  );
  paymentContractAddress = process.env.COURSE_PAYMENT_ADDRESS
    || deployedAddresses["CoursePaymentModule#CoursePayment"]
    || null;

  if (!paymentContractAddress) throw new Error("CoursePayment address not in deployed_addresses.json");
  paymentContract = new ethers.Contract(paymentContractAddress, abi, wallet);
  console.log(`CoursePayment loaded at ${paymentContractAddress}`);
} catch (err) {
  console.warn("Warning: CoursePayment not loaded:", err.message);
}

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

function fmt(doc) {
  const obj = doc.toObject({ versionKey: false });
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.password;
  delete obj.verification_token;
  return obj;
}

app.get("/", (req, res) => {
  res.json({
    status: "running",
    name: "GenAI Learning DApp API",
    endpoints: [
      "POST   /api/register               - register new user",
      "GET    /api/verify/:token          - verify email",
      "POST   /api/login                  - login",
      "GET    /api/users/:id              - profile + lessons + certificate",
      "PUT    /api/users/:id              - update profile",
      "POST   /api/progress               - record lesson completion",
      "POST   /api/certificate            - claim certificate",
      "GET    /api/stats                  - platform stats",
      "GET    /api/config                 - contract addresses",
      "POST   /api/payments/verify        - verify & record ETH payment",
      "GET    /api/payments/user/:id      - user payment history",
    ],
  });
});

// ── Config (contract addresses for frontend) ──────────────────────
app.get("/api/config", (req, res) => {
  res.json({
    coursePaymentAddress: paymentContractAddress,
    lessonPriceEth: "0.001",
    bundlePriceEth: "0.015",
    chainId: 31337,
    rpcUrl: RPC_URL,
  });
});

// ── Auth ──────────────────────────────────────────────────────────
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email, and password are required" });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const token = randomBytes(32).toString("hex");

  let txHash = "";9
  if (contract) {
    try {
      const tx = await contract.registerLearner();
      const receipt = await tx.wait();
      txHash = receipt.hash;
    } catch {}
  }

  await new User({ name, email, password, tx_hash: txHash, verification_token: token }).save();

  try {
    await sendVerificationEmail(email, token);
  } catch (err) {
    console.error("Email send failed:", err.message);
  }

  res.json({ pending: true, message: "Account created — please check your email to verify before logging in." });
});

app.get("/api/verify/:token", async (req, res) => {
  const user = await User.findOne({ verification_token: req.params.token });
  if (!user) {
    return res.redirect(`${FRONTEND_URL}?verified=invalid`);
  }
  user.email_verified = true;
  user.verification_token = "";
  await user.save();
  res.redirect(`${FRONTEND_URL}?verified=true`);
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const user = await User.findOne({ email });
  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  if (!user.email_verified) {
    return res.status(403).json({ error: "Please verify your email before logging in. Check your inbox." });
  }

  user.last_active = new Date();
  await user.save();

  res.json(fmt(user));
});

app.get("/api/users/:id", async (req, res) => {
  const user = await User.findById(req.params.id).catch(() => null);
  if (!user) return res.status(404).json({ error: "User not found" });

  const lessons = await LessonProgress
    .find({ user_id: user._id })
    .sort({ lesson_id: 1 })
    .select("lesson_id completed_at tx_hash -_id");

  const certificate = await Certificate.findOne({ user_id: user._id });

  res.json({
    ...fmt(user),
    lessons,
    certificate: certificate ? certificate.toObject({ versionKey: false }) : null,
  });
});

app.put("/api/users/:id", async (req, res) => {
  const { name, email, bio } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: { name, email, bio, last_active: new Date() } },
    { new: true, runValidators: true }
  ).catch(() => null);

  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(fmt(user));
});

// ── Learning progress ─────────────────────────────────────────────
app.post("/api/progress", async (req, res) => {
  const { user_id, lesson_id } = req.body;
  if (!user_id || !lesson_id) {
    return res.status(400).json({ error: "user_id and lesson_id are required" });
  }

  const user = await User.findById(user_id).catch(() => null);
  if (!user) return res.status(404).json({ error: "User not found" });

  let txHash = "";
  if (contract) {
    try {
      const tx = await contract.completeLesson(lesson_id);
      const receipt = await tx.wait();
      txHash = receipt.hash;
    } catch {}
  }

  try {
    await new LessonProgress({ user_id, lesson_id, tx_hash: txHash }).save();
  } catch (err) {
    if (err.code === 11000) return res.json({ lesson_id, note: "already recorded" });
    throw err;
  }

  const completed = await LessonProgress.countDocuments({ user_id });
  res.json({ lesson_id, completed, tx_hash: txHash });
});

app.post("/api/certificate", async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: "user_id is required" });

  const user = await User.findById(user_id).catch(() => null);
  if (!user) return res.status(404).json({ error: "User not found" });

  const completedCount = await LessonProgress.countDocuments({ user_id });
  if (completedCount < TOTAL_LESSONS) {
    return res.status(400).json({
      error: `You have only completed ${completedCount} of ${TOTAL_LESSONS} lessons. Finish all lessons before claiming.`,
    });
  }

  let txHash = "";
  if (contract) {
    try {
      const tx = await contract.claimCertificate();
      const receipt = await tx.wait();
      txHash = receipt.hash;
    } catch {}
  }

  const cert = await Certificate.findOneAndUpdate(
    { user_id },
    { $setOnInsert: { user_id, tx_hash: txHash } },
    { upsert: true, new: true }
  );

  res.json(cert.toObject({ versionKey: false }));
});

// ── Stats ─────────────────────────────────────────────────────────
app.get("/api/stats", async (req, res) => {
  const [totalUsers, totalCompletions, totalCerts, totalPayments] = await Promise.all([
    User.countDocuments(),
    LessonProgress.countDocuments(),
    Certificate.countDocuments(),
    Payment.countDocuments({ status: "confirmed" }),
  ]);
  res.json({ totalUsers, totalCompletions, totalCerts, totalPayments });
});

// ── Payments ──────────────────────────────────────────────────────

// Verify a transaction from MetaMask and save to MongoDB
app.post("/api/payments/verify", async (req, res) => {
  const { user_id, tx_hash, payment_type, lesson_id, wallet_address } = req.body;

  if (!user_id || !tx_hash || !payment_type || !wallet_address) {
    return res.status(400).json({ error: "user_id, tx_hash, payment_type, wallet_address are required" });
  }
  if (!["lesson", "bundle"].includes(payment_type)) {
    return res.status(400).json({ error: "payment_type must be 'lesson' or 'bundle'" });
  }

  const user = await User.findById(user_id).catch(() => null);
  if (!user) return res.status(404).json({ error: "User not found" });

  // Deduplicate
  const existing = await Payment.findOne({ tx_hash });
  if (existing) return res.json(existing.toObject({ versionKey: false }));

  let status = "pending";
  let amount_wei = "0";

  // Verify the transaction on-chain
  try {
    const receipt = await provider.getTransactionReceipt(tx_hash);
    if (receipt) {
      status = receipt.status === 1 ? "confirmed" : "failed";
      if (receipt.status === 1) {
        const tx = await provider.getTransaction(tx_hash);
        amount_wei = tx ? tx.value.toString() : "0";
      }
    }
  } catch (err) {
    console.warn("Could not verify tx on-chain:", err.message);
  }

  const payment = await new Payment({
    user_id,
    wallet_address: wallet_address.toLowerCase(),
    tx_hash,
    payment_type,
    lesson_id: lesson_id ?? null,
    amount_wei,
    status,
  }).save();

  // Persist wallet address on user record
  if (!user.wallet_address && wallet_address) {
    user.wallet_address = wallet_address.toLowerCase();
    await user.save();
  }

  res.json(payment.toObject({ versionKey: false }));
});

// Get all payments for a user
app.get("/api/payments/user/:user_id", async (req, res) => {
  const payments = await Payment
    .find({ user_id: req.params.user_id })
    .sort({ created_at: -1 })
    .lean();
  res.json(payments);
});

// Check on-chain access for a wallet address
app.get("/api/payments/access/:wallet", async (req, res) => {
  const { wallet } = req.params;
  const { lessonId } = req.query;

  if (!paymentContract) {
    return res.json({ hasAccess: false, hasBundle: false, contractMissing: true });
  }

  try {
    const hasBundle = await paymentContract.hasBundleAccess(wallet);
    const hasAccess = lessonId
      ? await paymentContract.hasAccess(wallet, Number(lessonId))
      : hasBundle;
    res.json({ hasAccess, hasBundle });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});
