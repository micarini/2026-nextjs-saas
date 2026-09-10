export default function GoalRing({
  progress = 0,
  size = 70,
  stroke = 8,
}) {
  const radius =
    (size - stroke) / 2;

  const circumference =
    2 * Math.PI * radius;

  const offset =
    circumference -
    (
      Math.min(
        100,
        Math.max(
          0,
          progress
        )
      ) /
      100
    ) *
      circumference;

  return (
    <div
      className="relative shrink-0"
      style={{
        width: size,
        height: size,
      }}
    >

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e9e7df"
          strokeWidth={stroke}
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#c8e75b"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={
            circumference
          }
          strokeDashoffset={
            offset
          }
          className="transition-all duration-700"
        />

      </svg>

      <div className="absolute inset-0 flex items-center justify-center text-[12px] font-semibold text-[#36366f]">
        {progress}%
      </div>

    </div>
  );
}