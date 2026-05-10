type WindmillConfig = {
  left: string;
  bottom: string;
  size: number;
  duration: number;
  reverse?: boolean;
  opacity: number;
};

const windmills: WindmillConfig[] = [
  { left: "4%", bottom: "15%", size: 58, duration: 6, opacity: 0.10 },
  { left: "13%", bottom: "11%", size: 72, duration: 7, reverse: true, opacity: 0.13 },
  { left: "22%", bottom: "8%", size: 92, duration: 8, opacity: 0.16 },
  { left: "31%", bottom: "5%", size: 118, duration: 10, reverse: true, opacity: 0.20 },
  { left: "40%", bottom: "2%", size: 155, duration: 12, opacity: 0.24 },
  { left: "50%", bottom: "-3%", size: 215, duration: 14, opacity: 0.30 },
  { left: "60%", bottom: "2%", size: 155, duration: 12, reverse: true, opacity: 0.24 },
  { left: "69%", bottom: "5%", size: 118, duration: 10, opacity: 0.20 },
  { left: "78%", bottom: "8%", size: 92, duration: 8, reverse: true, opacity: 0.16 },
  { left: "87%", bottom: "11%", size: 72, duration: 7, opacity: 0.13 },
  { left: "96%", bottom: "15%", size: 58, duration: 6, reverse: true, opacity: 0.10 },
];

export function WindmillsBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {windmills.map((w, i) => (
        <Turbine key={i} {...w} />
      ))}
    </div>
  );
}

function Turbine({
  left,
  bottom,
  size,
  duration,
  reverse,
  opacity,
}: WindmillConfig) {
  const bladeBox = size;
  const bladeRadius = bladeBox / 2;
  const towerHeight = size * 1.7;
  const totalHeight = towerHeight + bladeRadius;
  const towerTopHalf = size * 0.025;
  const towerBaseHalf = size * 0.06;

  return (
    <div
      className="absolute text-foreground -translate-x-1/2"
      style={{
        left,
        bottom,
        width: bladeBox,
        height: totalHeight,
        opacity,
      }}
    >
      <svg
        className="absolute left-1/2"
        style={{
          top: bladeRadius,
          width: towerBaseHalf * 2,
          height: towerHeight,
          marginLeft: -towerBaseHalf,
        }}
        viewBox="-1 0 2 100"
        preserveAspectRatio="none"
      >
        <path
          d={`M ${-towerTopHalf / towerBaseHalf} 0 L ${towerTopHalf / towerBaseHalf} 0 L 1 100 L -1 100 Z`}
          fill="currentColor"
        />
      </svg>

      <svg
        className="absolute left-1/2"
        style={{
          top: bladeRadius - size * 0.035,
          width: size * 0.18,
          height: size * 0.07,
          marginLeft: -size * 0.09,
        }}
        viewBox="0 0 18 7"
      >
        <rect x="0" y="0.5" width="15" height="6" rx="3" fill="currentColor" />
        <path d="M 14 1.5 L 18 3.5 L 14 5.5 Z" fill="currentColor" />
      </svg>

      <div
        className="absolute left-1/2"
        style={{
          top: 0,
          width: bladeBox,
          height: bladeBox,
          marginLeft: -bladeRadius,
        }}
      >
        <svg
          style={{
            width: "100%",
            height: "100%",
            animation: `windmill-spin ${duration}s linear infinite`,
            animationDirection: reverse ? "reverse" : "normal",
          }}
          viewBox="-50 -50 100 100"
        >
          {[0, 120, 240].map((angle) => (
            <path
              key={angle}
              d="M -1.4 -2 Q -2.2 -22 -0.7 -42 L 0.5 -46 Q 2.4 -24 2.6 -2 Z"
              fill="currentColor"
              transform={`rotate(${angle})`}
            />
          ))}
          <circle cx="0" cy="0" r="3.2" fill="currentColor" />
          <circle cx="0" cy="0" r="1.4" fill="currentColor" opacity="0.6" />
        </svg>
      </div>
    </div>
  );
}
