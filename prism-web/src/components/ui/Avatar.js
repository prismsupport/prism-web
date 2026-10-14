const TONES = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-violet-100 text-violet-700",
  "bg-cyan-100 text-cyan-700",
];

function initialsOf(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function toneFor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return TONES[Math.abs(hash) % TONES.length];
}

export default function Avatar({ name = "", src, size = 36, className = "" }) {
  const style = { width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.4)) };

  if (src) {
    return (
      <img src={src} alt="" style={style} className={`shrink-0 rounded-full object-cover ${className}`} />
    );
  }

  return (
    <span
      style={style}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${toneFor(name)} ${className}`}
    >
      {initialsOf(name)}
    </span>
  );
}