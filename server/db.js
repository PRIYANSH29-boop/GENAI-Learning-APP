import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name:                    { type: String, default: "" },
  email:                   { type: String, unique: true, required: true },
  password:                { type: String, required: true },
  bio:                     { type: String, default: "" },
  wallet_address:          { type: String, default: "" },
  tx_hash:                 { type: String, default: "" },
  email_verified:          { type: Boolean, default: false },
  verification_token:      { type: String, default: "" },
  verification_expires_at: { type: Date, default: null },
  registered_at:           { type: Date, default: Date.now },
  last_active:             { type: Date, default: Date.now },
});

const lessonProgressSchema = new mongoose.Schema({
  user_id:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  lesson_id:    { type: Number, required: true },
  completed_at: { type: Date, default: Date.now },
  tx_hash:      { type: String, default: "" },
});
lessonProgressSchema.index({ user_id: 1, lesson_id: 1 }, { unique: true });

const certificateSchema = new mongoose.Schema({
  user_id:   { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, required: true },
  issued_at: { type: Date, default: Date.now },
  tx_hash:   { type: String, default: "" },
});

// Payment schema aligned with the MetaMask/CoursePayment flow:
//   payment_type  "bundle" | "lesson"
//   lesson_id     null for bundle purchases
//   amount_wei    raw wei string (avoids float precision issues)
//   status        "confirmed" (set immediately after on-chain verification)
const paymentSchema = new mongoose.Schema({
  user_id:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  wallet_address: { type: String, required: true },
  payment_type:   { type: String, enum: ["bundle", "lesson"], required: true },
  lesson_id:      { type: Number, default: null },
  amount_wei:     { type: String, required: true },
  tx_hash:        { type: String, unique: true, required: true },
  status:         { type: String, enum: ["pending", "confirmed", "failed"], default: "confirmed" },
  created_at:     { type: Date, default: Date.now },
});

export const User = mongoose.model("User", userSchema);
export const LessonProgress = mongoose.model("LessonProgress", lessonProgressSchema);
export const Certificate = mongoose.model("Certificate", certificateSchema);
export const Payment = mongoose.model("Payment", paymentSchema);

export async function connectDB(uri = "mongodb://127.0.0.1:27017/genai-learning") {
  await mongoose.connect(uri);
  console.log("MongoDB connected");
}
