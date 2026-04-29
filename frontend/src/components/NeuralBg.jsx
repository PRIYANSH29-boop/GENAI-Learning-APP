import { useEffect, useRef } from "react";

const NODE_COUNT = 60;
const MAX_DIST = 155;
const SPEED = 0.22;

export default function NeuralBg() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const nodes = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * SPEED,
      vy: (Math.random() - 0.5) * SPEED,
      r: Math.random() * 1.4 + 0.6,
      phase: Math.random() * Math.PI * 2,
      hue: Math.random() > 0.5 ? "170,59,255" : "34,211,238",
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        n.phase += 0.014;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d = Math.hypot(dx, dy);
          if (d < MAX_DIST) {
            const a = (1 - d / MAX_DIST) * 0.11;
            const g = ctx.createLinearGradient(
              nodes[i].x, nodes[i].y,
              nodes[j].x, nodes[j].y
            );
            g.addColorStop(0, `rgba(${nodes[i].hue},${a})`);
            g.addColorStop(1, `rgba(${nodes[j].hue},${a})`);
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = g;
            ctx.lineWidth = 0.55;
            ctx.stroke();
          }
        }
      }

      nodes.forEach((n) => {
        const glow = 0.45 + Math.sin(n.phase) * 0.3;
        const size = n.r * (1 + Math.sin(n.phase) * 0.18);

        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, size * 6);
        grad.addColorStop(0, `rgba(${n.hue},${glow * 0.22})`);
        grad.addColorStop(1, `rgba(${n.hue},0)`);
        ctx.beginPath();
        ctx.arc(n.x, n.y, size * 6, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.x, n.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${n.hue},${glow})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.65,
      }}
    />
  );
}
