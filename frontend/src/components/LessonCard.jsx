import Tilt from "react-parallax-tilt";
import { motion } from "framer-motion";
import { Clock, ExternalLink, Check, ChevronRight, Lock } from "lucide-react";

const CAT_RGB = {
  Fundamentals: "170,59,255",
  Prompting:    "34,211,238",
  Building:     "74,222,128",
  Advanced:     "251,191,36",
  Expert:       "244,114,182",
};

const CAT_CLR = {
  Fundamentals: "#aa3bff",
  Prompting:    "#22d3ee",
  Building:     "#4ade80",
  Advanced:     "#fbbf24",
  Expert:       "#f472b6",
};

export default function LessonCard({
  lesson,
  done,
  unlocked,
  busy,
  busyUnlock,
  isFlipping,
  githubBaseUrl,
  lessonPaths,
  onComplete,
  onUnlock,
  feeDisplay,
}) {
  const clr = CAT_CLR[lesson.category] ?? "#aa3bff";
  const rgb = CAT_RGB[lesson.category] ?? "170,59,255";

  return (
    <Tilt
      tiltMaxAngleX={7}
      tiltMaxAngleY={7}
      glareEnable
      glareMaxOpacity={0.07}
      glareColor="#ffffff"
      glarePosition="all"
      perspective={1000}
      transitionSpeed={350}
      className="lesson-tilt"
    >
      <motion.div
        className={`lesson-card${done ? " lcard-done" : ""}${!unlocked && !done ? " lcard-locked" : ""}`}
        style={{ "--cat-clr": clr, "--cat-rgb": rgb }}
        animate={
          isFlipping
            ? { rotateY: [0, 90, -8, 0], scale: [1, 1.06, 1.06, 1] }
            : {}
        }
        transition={isFlipping ? { duration: 0.55, ease: "easeInOut" } : {}}
      >
        <div className="lcard-bar" />

        <div className="lcard-body">
          <div className="lcard-head">
            <span className="lcard-num">{lesson.id}</span>
            <span className="lcard-cat">{lesson.category}</span>
            {done && (
              <span className="lcard-verified">
                <Check size={10} strokeWidth={3.5} /> On-chain
              </span>
            )}
            {!done && !unlocked && (
              <span className="lcard-locked-badge">
                <Lock size={10} strokeWidth={3} /> Locked
              </span>
            )}
          </div>

          <h3 className="lcard-title">{lesson.title}</h3>
          <p className="lcard-desc">{lesson.description}</p>

          {lesson.topics && lesson.topics.length > 0 && (
            <ul className="lcard-topics">
              {lesson.topics.map((t) => (
                <li key={t} className="lcard-topic">
                  <ChevronRight size={10} className="lcard-topic-icon" />
                  {t}
                </li>
              ))}
            </ul>
          )}

          <div className="lcard-footer">
            <span className="lcard-dur">
              <Clock size={11} />
              {lesson.duration}
            </span>
            <div className="lcard-actions">
              <a
                href={githubBaseUrl + lessonPaths[lesson.id]}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
              >
                Open <ExternalLink size={11} />
              </a>

              {done ? (
                <span className="lcard-check">
                  <Check size={15} strokeWidth={3} />
                </span>
              ) : unlocked ? (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={onComplete}
                  disabled={busy}
                >
                  {busy ? <span className="btn-spin" /> : "Mark Complete"}
                </button>
              ) : (
                <div className="lcard-unlock-group">
                  {feeDisplay && (
                    <span className="lcard-fee">
                      <Lock size={9} />
                      {feeDisplay}
                    </span>
                  )}
                  <button
                    className="btn btn-unlock btn-sm"
                    onClick={onUnlock}
                    disabled={busyUnlock}
                  >
                    {busyUnlock ? <span className="btn-spin" /> : "Unlock"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lcard-border-glow" />
      </motion.div>
    </Tilt>
  );
}
