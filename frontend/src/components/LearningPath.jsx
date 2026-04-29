import { Check } from "lucide-react";

const CAT = {
  Fundamentals: { clr: "#aa3bff", rgb: "170,59,255" },
  Prompting:    { clr: "#22d3ee", rgb: "34,211,238"  },
  Building:     { clr: "#4ade80", rgb: "74,222,128"  },
  Advanced:     { clr: "#fbbf24", rgb: "251,191,36"  },
  Expert:       { clr: "#f472b6", rgb: "244,114,182" },
};

export default function LearningPath({ lessons, completedLessons }) {
  const nextId = lessons.find((l) => !completedLessons.has(l.id))?.id;

  // Snake rows: 1-7 → 14-8 (reversed) → 15-21
  const rows = [
    lessons.slice(0, 7),
    [...lessons.slice(7, 14)].reverse(),
    lessons.slice(14),
  ];

  const renderRow = (row, rowIdx) => (
    <div key={rowIdx} className={`lp-row${rowIdx === 1 ? " lp-row-rev" : ""}`}>
      {row.map((lesson, i) => {
        const done = completedLessons.has(lesson.id);
        const current = lesson.id === nextId;
        const { clr, rgb } = CAT[lesson.category] ?? CAT.Fundamentals;

        return (
          <div key={lesson.id} className="lp-cell">
            {i > 0 && (
              <div
                className={`lp-conn${done ? " lp-conn-done" : ""}`}
                style={{ "--clr": done ? "#4ade80" : `rgba(${rgb},0.18)` }}
              />
            )}
            <div
              className={`lp-node${done ? " lpn-done" : ""}${current ? " lpn-current" : ""}`}
              style={{ "--clr": clr, "--rgb": rgb }}
              title={`${lesson.id}. ${lesson.title} · ${lesson.category}`}
            >
              {done ? <Check size={14} strokeWidth={3} /> : lesson.id}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="lp-wrap">
      {renderRow(rows[0], 0)}
      <div className="lp-turn lp-turn-r" />
      {renderRow(rows[1], 1)}
      <div className="lp-turn lp-turn-l" />
      {renderRow(rows[2], 2)}

      {/* Category legend */}
      <div className="lp-legend">
        {Object.entries(CAT).map(([name, { clr }]) => (
          <span key={name} className="lp-legend-item" style={{ "--clr": clr }}>
            <span className="lp-legend-dot" />
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
