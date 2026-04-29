export default function HeroOrb() {
  return (
    <div className="orb-scene" aria-hidden="true">
      <div className="orb-float">
        {/* Ambient glow behind everything */}
        <div className="orb-ambient" />

        {/* Ring 1 – tilted ~70° around X */}
        <div className="orb-ring-wrap r1">
          <div className="orb-ring" />
          <div className="orb-dot od1" />
          <div className="orb-dot od2" />
        </div>

        {/* Ring 2 – different tilt, opposite spin */}
        <div className="orb-ring-wrap r2">
          <div className="orb-ring" />
          <div className="orb-dot od3" />
        </div>

        {/* Ring 3 – wide, slow, faint */}
        <div className="orb-ring-wrap r3">
          <div className="orb-ring" />
        </div>

        {/* Core sphere */}
        <div className="orb-core">
          <div className="orb-shine" />
          <div className="orb-shine orb-shine-2" />
        </div>

        {/* Pulse ring */}
        <div className="orb-pulse" />
        <div className="orb-pulse orb-pulse-2" />
      </div>
    </div>
  );
}
