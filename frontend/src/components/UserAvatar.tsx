import { API_BASE_URL } from "@/lib/api";

interface UserAvatarProps {
  name: string;
  profileImage?: string | null;
  showPhoto: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  xs: "size-7",
  sm: "size-9",
  md: "size-10",
  lg: "size-16",
  xl: "size-20",
};

const textSizeClasses = {
  xs: "text-[10px]",
  sm: "text-xs",
  md: "text-xs",
  lg: "text-sm",
  xl: "text-base",
};

export function UserAvatar({ name, profileImage, showPhoto, size = "md", className = "" }: UserAvatarProps) {
  const initials = name?.substring(0, 2).toUpperCase() ?? "??";

  const fullUrl = profileImage
    ? profileImage.startsWith("http") || profileImage.startsWith("data:")
      ? profileImage
      : `${API_BASE_URL}${profileImage}`
    : null;

  const displayPhoto = showPhoto && !!fullUrl;

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-hero grid place-items-center overflow-hidden shrink-0 ${textSizeClasses[size]} font-semibold text-snow ${className}`}
    >
      {displayPhoto ? (
        <img
          src={fullUrl!}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
            (e.currentTarget.parentElement as HTMLElement).innerText = initials;
          }}
        />
      ) : (
        initials
      )}
    </div>
  );
}
