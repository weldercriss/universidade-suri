interface RankIconProps {
  className?: string;
  size?: number;
}

export function GoldMedal({ className = "", size = 32 }: RankIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="24" cy="28" r="16" fill="#F59E0B" />
      <circle cx="24" cy="28" r="12" fill="#FCD34D" />
      <text
        x="24"
        y="33"
        textAnchor="middle"
        fontSize="13"
        fontWeight="bold"
        fill="#92400E"
        fontFamily="sans-serif"
      >
        1
      </text>
      <path d="M16 14 L24 4 L32 14" fill="#D97706" />
      <path d="M18 14 L24 6 L30 14" fill="#F59E0B" />
      <circle cx="24" cy="4" r="2.5" fill="#FCD34D" />
    </svg>
  );
}

export function SilverMedal({ className = "", size = 32 }: RankIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="24" cy="28" r="16" fill="#94A3B8" />
      <circle cx="24" cy="28" r="12" fill="#CBD5E1" />
      <text
        x="24"
        y="33"
        textAnchor="middle"
        fontSize="13"
        fontWeight="bold"
        fill="#334155"
        fontFamily="sans-serif"
      >
        2
      </text>
      <path d="M16 14 L24 4 L32 14" fill="#64748B" />
      <path d="M18 14 L24 6 L30 14" fill="#94A3B8" />
      <circle cx="24" cy="4" r="2.5" fill="#CBD5E1" />
    </svg>
  );
}

export function BronzeMedal({ className = "", size = 32 }: RankIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="24" cy="28" r="16" fill="#B45309" />
      <circle cx="24" cy="28" r="12" fill="#D97706" />
      <text
        x="24"
        y="33"
        textAnchor="middle"
        fontSize="13"
        fontWeight="bold"
        fill="#7C2D12"
        fontFamily="sans-serif"
      >
        3
      </text>
      <path d="M16 14 L24 4 L32 14" fill="#92400E" />
      <path d="M18 14 L24 6 L30 14" fill="#B45309" />
      <circle cx="24" cy="4" r="2.5" fill="#D97706" />
    </svg>
  );
}
