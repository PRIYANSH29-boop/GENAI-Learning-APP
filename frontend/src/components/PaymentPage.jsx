import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ethers } from "ethers";
import {
  Wallet, CreditCard, CheckCircle, Clock, AlertCircle,
  Copy, Zap, Package, BookOpen, Shield,
} from "lucide-react";
import { verifyPayment, getUserPayments, getConfig } from "../utils/api";
import { getEthPrice, formatUsd } from "../utils/currency";

const COURSE_PAYMENT_ABI = [
  "function purchaseBundle() external payable",
  "function purchaseLesson(uint256 lessonId) external payable",
  "function hasAccess(address user, uint256 lessonId) external view returns (bool)",
  "function hasBundleAccess(address user) external view returns (bool)",
  "function LESSON_PRICE() external view returns (uint256)",
  "function BUNDLE_PRICE() external view returns (uint256)",
];

const cardVariant = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const stagger = { animate: { transition: { staggerChildren: 0.07 } } };

function shortenHash(hash) {
  if (!hash) return "";
  return `${hash.slice(0, 10)}…${hash.slice(-8)}`;
}

function weiToEth(wei) {
  try { return Number(ethers.formatEther(BigInt(wei))).toFixed(4); } catch { return "0.0000"; }
}

// Returns "$X.XX" when price is known, otherwise "X.XXXX ETH"
function usdOrEth(ethAmount, ethPrice) {
  if (ethPrice) return formatUsd(ethAmount, ethPrice.usd);
  return `${Number(ethAmount).toFixed(4)} ETH`;
}

function StatusBadge({ status }) {
  if (status === "confirmed")
    return <span className="pay-badge pay-badge-success"><CheckCircle size={11} /> Confirmed</span>;
  if (status === "failed")
    return <span className="pay-badge pay-badge-error"><AlertCircle size={11} /> Failed</span>;
  return <span className="pay-badge pay-badge-pending"><Clock size={11} /> Pending</span>;
}

export default function PaymentPage({ user, setStatus, onPaymentConfirmed }) {
  const [wallet, setWallet] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [purchasing, setPurchasing] = useState("");
  const [payments, setPayments] = useState([]);
  const [config, setConfig] = useState(null);
  const [hasBundle, setHasBundle] = useState(false);
  const [copied, setCopied] = useState("");
  const [ethPrice, setEthPrice] = useState(null);

  useEffect(() => {
    loadConfig();
    loadPayments();
    getEthPrice().then(setEthPrice).catch(() => {});
  }, [user.id]);

  async function loadConfig() {
    try {
      const cfg = await getConfig();
      setConfig(cfg);
    } catch {
      setConfig({ coursePaymentAddress: null, lessonPriceEth: "0.001", bundlePriceEth: "0.015", chainId: 31337 });
    }
  }

  async function loadPayments() {
    try {
      const list = await getUserPayments(user.id);
      setPayments(list);
    } catch {}
  }

  async function connectWallet() {
    if (!window.ethereum) {
      setStatus("MetaMask not found — install it from metamask.io", "error");
      return;
    }
    setConnecting(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();
      const signer  = await provider.getSigner();
      const address = await signer.getAddress();
      const balance = await provider.getBalance(address);

      const chainId = Number(network.chainId);
      setWallet({ address, balance: ethers.formatEther(balance), chainId, networkOk: chainId === 31337 });

      if (config?.coursePaymentAddress) {
        try {
          const contract = new ethers.Contract(config.coursePaymentAddress, COURSE_PAYMENT_ABI, provider);
          setHasBundle(await contract.hasBundleAccess(address));
        } catch {}
      }
    } catch (err) {
      setStatus(err?.message || "Could not connect wallet", "error");
    }
    setConnecting(false);
  }

  async function handlePurchase(type, lessonId = null) {
    if (!wallet) { setStatus("Connect your MetaMask wallet first", "error"); return; }
    if (!config?.coursePaymentAddress) {
      setStatus("Payment contract not deployed yet — run: npx hardhat ignition deploy ignition/modules/CoursePayment.ts --network localhost", "error");
      return;
    }

    const key = type === "bundle" ? "bundle" : `lesson-${lessonId}`;
    setPurchasing(key);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer   = await provider.getSigner();
      const contract = new ethers.Contract(config.coursePaymentAddress, COURSE_PAYMENT_ABI, signer);

      const tx = type === "bundle"
        ? await contract.purchaseBundle({ value: ethers.parseEther(config.bundlePriceEth) })
        : await contract.purchaseLesson(lessonId, { value: ethers.parseEther(config.lessonPriceEth) });

      setStatus("Transaction submitted — awaiting confirmation…", "info");
      const receipt = await tx.wait();

      await verifyPayment({
        user_id: user.id,
        tx_hash: receipt.hash,
        payment_type: type,
        lesson_id: lessonId,
        wallet_address: wallet.address,
      });

      if (type === "bundle") setHasBundle(true);

      const newBalance = await provider.getBalance(wallet.address);
      setWallet(w => ({ ...w, balance: ethers.formatEther(newBalance) }));
      setStatus(type === "bundle" ? "Bundle purchased — recorded on Ethereum!" : `Lesson ${lessonId} purchased!`, "success");
      loadPayments();
      if (onPaymentConfirmed) onPaymentConfirmed();
    } catch (err) {
      const msg = err?.reason || err?.shortMessage || err?.message || "Transaction failed";
      setStatus(msg.slice(0, 120), "error");
    }
    setPurchasing("");
  }

  function copyText(text, key) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(""), 1800);
  }

  const confirmedBundle = payments.some(p => p.payment_type === "bundle" && p.status === "confirmed") || hasBundle;

  const bundleEth  = config?.bundlePriceEth  ?? "0.015";
  const lessonEth  = config?.lessonPriceEth  ?? "0.001";

  return (
    <motion.div className="payment-page" variants={stagger} initial="initial" animate="animate">
      <div className="page-header">
        <h2>Payments</h2>
        <p>Pay with ETH via MetaMask — prices shown in USD. Every transaction is recorded on-chain and in MongoDB.</p>
      </div>

      {/* Top row: wallet + pricing */}
      <div className="payment-top-grid">

        {/* Wallet card */}
        <motion.div className="card pay-wallet-card" variants={cardVariant}>
          <div className="card-header-row">
            <h3 className="card-title">
              <Wallet size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />
              MetaMask Wallet
            </h3>
            {wallet && (
              <span className={`pay-network-badge ${wallet.networkOk ? "ok" : "bad"}`}>
                {wallet.networkOk ? "Hardhat ✓" : `Chain ${wallet.chainId}`}
              </span>
            )}
          </div>

          {!wallet ? (
            <div className="pay-wallet-empty">
              <div className="pay-wallet-icon"><Wallet size={32} /></div>
              <p className="card-text" style={{ textAlign: "center", margin: 0 }}>
                Connect MetaMask to pay for courses. Prices are displayed in USD — transactions settle in ETH.
              </p>
              <button className="btn btn-primary btn-full" onClick={connectWallet} disabled={connecting}>
                {connecting ? <><span className="btn-spin" /> Connecting…</> : <><Wallet size={16} /> Connect MetaMask</>}
              </button>
              {!config?.coursePaymentAddress && (
                <div className="pay-warning">
                  <AlertCircle size={14} />
                  <span>Deploy <code>CoursePayment.sol</code> first to enable purchases.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="pay-wallet-connected">
              <div className="pay-wallet-row">
                <span className="wallet-dot connected" />
                <span className="pay-wallet-addr">{wallet.address}</span>
                <button className="pay-icon-btn" title="Copy address" onClick={() => copyText(wallet.address, "addr")}>
                  {copied === "addr" ? <CheckCircle size={14} /> : <Copy size={14} />}
                </button>
              </div>

              <div className="pay-balance-box">
                <span className="pay-balance-label">Balance</span>
                <span className="pay-balance-value">
                  {ethPrice
                    ? formatUsd(wallet.balance, ethPrice.usd)
                    : `${Number(wallet.balance).toFixed(4)} ETH`}
                </span>
                {ethPrice && (
                  <span style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    {Number(wallet.balance).toFixed(4)} ETH
                  </span>
                )}
              </div>

              {!wallet.networkOk && (
                <div className="pay-warning">
                  <AlertCircle size={14} />
                  <span>Wrong network — switch MetaMask to <strong>Hardhat Localhost</strong> (chain 31337, RPC http://127.0.0.1:8545)</span>
                </div>
              )}

              {confirmedBundle && (
                <div className="pay-access-badge">
                  <Shield size={14} />
                  Full Bundle Access Active
                </div>
              )}

              <button className="btn btn-ghost btn-sm" onClick={connectWallet}>Refresh Balance</button>
            </div>
          )}
        </motion.div>

        {/* Pricing card */}
        <motion.div className="card pay-pricing-card" variants={cardVariant}>
          <h3 className="card-title">
            <CreditCard size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />
            Pricing
          </h3>

          {/* Bundle tier */}
          <div className={`pay-tier pay-tier-bundle ${confirmedBundle ? "pay-tier-owned" : ""}`}>
            <div className="pay-tier-header">
              <div className="pay-tier-icon bundle-icon"><Package size={20} /></div>
              <div className="pay-tier-info">
                <span className="pay-tier-name">Full Course Bundle</span>
                <span className="pay-tier-desc">All 21 lessons — best value</span>
              </div>
              <div className="pay-tier-price">
                <span className="pay-price">
                  {ethPrice ? formatUsd(bundleEth, ethPrice.usd) : bundleEth}
                </span>
                <span className="pay-currency">
                  {ethPrice ? `${bundleEth} ETH` : "ETH"}
                </span>
              </div>
            </div>
            <ul className="pay-tier-perks">
              <li><CheckCircle size={12} /> Instant access to all 21 lessons</li>
              <li><CheckCircle size={12} /> On-chain purchase receipt</li>
              <li><CheckCircle size={12} /> Unlock certificate eligibility</li>
            </ul>
            {confirmedBundle ? (
              <button className="btn btn-ghost btn-full" disabled>
                <CheckCircle size={15} /> Owned
              </button>
            ) : (
              <button
                className="btn btn-primary btn-full"
                onClick={() => handlePurchase("bundle")}
                disabled={!!purchasing || !wallet || !wallet.networkOk}
              >
                {purchasing === "bundle"
                  ? <><span className="btn-spin" /> Confirm in MetaMask…</>
                  : <><Zap size={15} /> Purchase Bundle — {ethPrice ? formatUsd(bundleEth, ethPrice.usd) : `${bundleEth} ETH`}</>}
              </button>
            )}
          </div>

          {/* Single lesson tier */}
          <div className="pay-tier pay-tier-lesson">
            <div className="pay-tier-header">
              <div className="pay-tier-icon lesson-icon"><BookOpen size={20} /></div>
              <div className="pay-tier-info">
                <span className="pay-tier-name">Single Lesson</span>
                <span className="pay-tier-desc">Pay per lesson as you go</span>
              </div>
              <div className="pay-tier-price">
                <span className="pay-price">
                  {ethPrice ? formatUsd(lessonEth, ethPrice.usd) : lessonEth}
                </span>
                <span className="pay-currency">
                  {ethPrice ? `${lessonEth} ETH each` : "ETH each"}
                </span>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
              Use the Unlock button on any lesson card — each purchase is individually verified on-chain.
            </p>
          </div>

          {ethPrice && (
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "8px 0 0", textAlign: "right" }}>
              1 ETH ≈ {formatUsd("1", ethPrice.usd)} · live rate via CoinGecko
            </p>
          )}
        </motion.div>
      </div>

      {/* How it works */}
      <motion.div className="card" variants={cardVariant}>
        <h3 className="card-title">How Blockchain Payments Work</h3>
        <div className="pay-how-grid">
          {[
            { step: "1", title: "Connect Wallet",       desc: "MetaMask signs a transaction from your Ethereum address — no passwords needed." },
            { step: "2", title: "Send ETH",             desc: "The USD price is converted to ETH at the current rate and sent to the CoursePayment smart contract." },
            { step: "3", title: "On-Chain Verification",desc: "The server reads the transaction receipt from the blockchain and verifies it was successful." },
            { step: "4", title: "MongoDB Record",       desc: "The payment is saved to MongoDB with your user ID, wallet address, tx hash, amount, and status." },
          ].map(({ step, title, desc }) => (
            <div key={step} className="pay-how-step">
              <div className="pay-how-num">{step}</div>
              <div>
                <span className="pay-how-title">{title}</span>
                <span className="pay-how-desc">{desc}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Contract info */}
      {config?.coursePaymentAddress && (
        <motion.div className="card" variants={cardVariant}>
          <div className="card-header-row">
            <h3 className="card-title">
              <Shield size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />
              Contract Info
            </h3>
          </div>
          <div className="pay-contract-row">
            <span className="pay-contract-label">CoursePayment Address</span>
            <span className="pay-contract-val">{config.coursePaymentAddress}</span>
            <button className="pay-icon-btn" onClick={() => copyText(config.coursePaymentAddress, "contract")}>
              {copied === "contract" ? <CheckCircle size={14} /> : <Copy size={14} />}
            </button>
          </div>
          <div className="pay-contract-row">
            <span className="pay-contract-label">Network</span>
            <span className="pay-contract-val">Hardhat Local (Chain {config.chainId})</span>
          </div>
          <div className="pay-contract-row">
            <span className="pay-contract-label">RPC</span>
            <span className="pay-contract-val" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>http://127.0.0.1:8545</span>
          </div>
        </motion.div>
      )}

      {/* Payment history */}
      <motion.div className="card" variants={cardVariant}>
        <h3 className="card-title">Payment History</h3>
        {payments.length === 0 ? (
          <p className="card-text" style={{ color: "var(--text-muted)" }}>No payments yet. Purchase a lesson or bundle above.</p>
        ) : (
          <div className="pay-history-table">
            <div className="pay-history-head">
              <span>Date</span>
              <span>Type</span>
              <span>Amount</span>
              <span>Status</span>
              <span>Tx Hash</span>
            </div>
            {payments.map((p) => {
              const ethAmt = weiToEth(p.amount_wei);
              return (
                <div key={p._id || p.tx_hash} className="pay-history-row">
                  <span className="pay-history-date">
                    {new Date(p.created_at).toLocaleDateString()}
                  </span>
                  <span className="pay-history-type">
                    {p.payment_type === "bundle"
                      ? <><Package size={12} /> Bundle</>
                      : <><BookOpen size={12} /> Lesson {p.lesson_id}</>}
                  </span>
                  <span className="pay-history-amount">
                    <span>{ethPrice ? formatUsd(ethAmt, ethPrice.usd) : `${ethAmt} ETH`}</span>
                    {ethPrice && (
                      <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>
                        {ethAmt} ETH
                      </span>
                    )}
                  </span>
                  <StatusBadge status={p.status} />
                  <span className="pay-history-hash">
                    <span className="pay-hash-text" title={p.tx_hash}>{shortenHash(p.tx_hash)}</span>
                    <button
                      className="pay-icon-btn"
                      onClick={() => copyText(p.tx_hash, p.tx_hash)}
                      title="Copy tx hash"
                    >
                      {copied === p.tx_hash ? <CheckCircle size={12} /> : <Copy size={12} />}
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
