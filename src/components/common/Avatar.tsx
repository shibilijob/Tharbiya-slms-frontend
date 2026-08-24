import React from 'react';
import { clsx } from 'clsx';
import { Gender } from '../../types';

// Stylish Minimalist Islamic Madrasa Boy Silhouette Icon (Matching the Hijabi Girl aesthetic)
export const HatBoySymbol: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Background Circle */}
    <circle cx="50" cy="50" r="50" fill="#F8FAFC" />

    {/* Torso / Shoulders Silhouette */}
    <path
      d="M22 88 C22 68 33 65 50 65 C67 65 78 68 78 88 Z"
      fill="#000000"
    />

    {/* Mandarin Jubba Collar & Placket (White cutout lines matching girl icon) */}
    <path
      d="M44 65 L44 88 M56 65 L56 88"
      stroke="#FFFFFF"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <path
      d="M44 65 C44 72 56 72 56 65"
      stroke="#FFFFFF"
      strokeWidth="2.4"
      strokeLinecap="round"
      fill="none"
    />
    {/* Buttons */}
    <circle cx="50" cy="71" r="1.5" fill="#FFFFFF" />
    <circle cx="50" cy="78" r="1.5" fill="#FFFFFF" />
    <circle cx="50" cy="85" r="1.5" fill="#FFFFFF" />

    {/* Head & Neck Base */}
    <rect x="44" y="52" width="12" height="15" fill="#000000" />

    {/* Head Silhouette */}
    <path
      d="M32 40 C32 20 40 14 50 14 C60 14 68 20 68 40 C68 56 60 62 50 62 C40 62 32 56 32 40 Z"
      fill="#000000"
    />

    {/* Oval Face Cutout (White cutout matching the girl icon style) */}
    <path
      d="M37 38 C37 28 42 25 50 25 C58 25 63 28 63 38 C63 50 58 55 50 55 C42 55 37 50 37 38 Z"
      fill="#FFFFFF"
    />

    {/* Islamic Prayer Cap / Kufi / Topi Top Crown Cutout & Pattern */}
    <path
      d="M35 24 C35 15 41 14 50 14 C59 14 65 15 65 24 Z"
      fill="#000000"
    />
    {/* Cap Rim Line */}
    <path
      d="M35 24 C40 22 60 22 65 24"
      stroke="#FFFFFF"
      strokeWidth="2.2"
      strokeLinecap="round"
      fill="none"
    />
    {/* Subtle Cap Embroidery Motif */}
    <path
      d="M42 18 Q50 20 58 18"
      stroke="#FFFFFF"
      strokeWidth="1.8"
      strokeDasharray="2 2"
      fill="none"
    />

    {/* Modern Stylish Hair Fringe arc on forehead */}
    <path
      d="M37 32 C43 27 48 30 50 27 C52 30 57 27 63 32"
      stroke="#000000"
      strokeWidth="2.6"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

// Matching Image 1: Minimalist Islamic Hijab Silhouette Icon
export const HijabiGirlSymbol: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Background Circle */}
    <circle cx="50" cy="50" r="50" fill="#F8FAFC" />

    {/* Main Hijab Body & Head Silhouette (Solid Black matching Image 1) */}
    {/* Torso / Bust */}
    <path
      d="M23 88 C23 68 33 65 50 65 C67 65 77 68 77 88 Z"
      fill="#000000"
    />
    
    {/* Outer Hijab Hood wrapping from head down over shoulders */}
    <path
      d="M32 46 C32 20 40 15 50 15 C60 15 68 20 68 46 C68 66 62 78 50 78 C38 78 32 66 32 46 Z"
      fill="#000000"
    />

    {/* Chest V-neck & Trim Lines (Exact structure from Image 1) */}
    <path
      d="M38 79 C42 84 50 86 50 86 C50 86 58 84 62 79"
      stroke="#FFFFFF"
      strokeWidth="2.8"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M45 80 L50 86 L55 80"
      fill="#FFFFFF"
    />
    <rect x="48" y="80" width="4" height="8" fill="#000000" />
    <rect x="33" y="80" width="2" height="8" fill="#FFFFFF" />
    <rect x="65" y="80" width="2" height="8" fill="#FFFFFF" />

    {/* Oval Face Opening */}
    <ellipse cx="50" cy="42" rx="13" ry="16" fill="#FFFFFF" stroke="#000000" strokeWidth="0.8" />

    {/* Forehead Inner Undercap Line / Arc (From Image 1) */}
    <path
      d="M38 34 C42 27 58 27 62 34"
      stroke="#000000"
      strokeWidth="2.8"
      strokeLinecap="round"
      fill="none"
    />

    {/* Bottom curved drape line along neck/chest */}
    <path
      d="M29 65 C35 77 65 77 71 65"
      stroke="#FFFFFF"
      strokeWidth="2.8"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

interface AvatarProps {
  src?: string;
  name: string;
  gender?: Gender | 'MALE' | 'FEMALE';
  isStudent?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  ring?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  gender,
  isStudent,
  size = 'md',
  className,
  ring = false
}) => {
  const getInitials = (n: string) => {
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  // Check gender or detect from name
  const effectiveGender: Gender = gender || (
    /aisha|fathima|maryam|safa|hiba|khadija|amina|zainab|asma|hafsa|sumayya|naja|raheema|shifa|ruqayya/i.test(name)
      ? 'FEMALE'
      : 'MALE'
  );

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
    xl: "w-20 h-20 text-xl font-bold"
  };

  // If gender is provided, or isStudent is explicitly set, or no photo URL is given:
  // Render the Islamic Hat Boy or Hijabi Girl symbol matching user's requested icons!
  const shouldUseSymbol = gender !== undefined || isStudent || !src;

  return (
    <div
      className={clsx(
        "relative rounded-full shrink-0 flex items-center justify-center font-bold overflow-hidden bg-white border border-[#E3EAE6] text-[#084C3A]",
        sizeClasses[size],
        ring && "ring-2 ring-[#0F6B50] ring-offset-2 ring-offset-white",
        className
      )}
    >
      {shouldUseSymbol ? (
        effectiveGender === 'FEMALE' ? (
          <HijabiGirlSymbol className="w-full h-full" />
        ) : (
          <HatBoySymbol className="w-full h-full" />
        )
      ) : src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
};
