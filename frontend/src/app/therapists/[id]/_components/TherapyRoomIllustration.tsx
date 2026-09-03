'use client';

export default function TherapyRoomIllustration({ className = '' }: { className?: string }) {
    return (
        <div className={`relative flex items-center justify-center select-none pointer-events-none ${className}`}>
            <svg
                viewBox="0 0 400 300"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-auto max-w-[340px] drop-shadow-sm"
            >
                {/* Soft organic warm backdrop blob */}
                <path
                    d="M130 50 C230 20, 360 60, 380 160 C395 230, 330 280, 240 285 C150 290, 60 270, 40 190 C25 120, 60 70, 130 50 Z"
                    fill="#F9ECEF"
                    opacity="0.85"
                />
                
                {/* Minimalist wall artwork */}
                <g transform="translate(250, 45)">
                    {/* Picture frame shadow & frame */}
                    <rect x="0" y="0" width="46" height="58" rx="4" fill="#D9C1C7" />
                    <rect x="2" y="2" width="42" height="54" rx="3" fill="#FFFDFD" />
                    {/* Inner art: abstract warm sun & landscape */}
                    <circle cx="23" cy="22" r="9" fill="#E89BA8" opacity="0.65" />
                    <path d="M5 45 Q 16 35, 26 40 T 43 45 L 43 54 L 5 54 Z" fill="#C57D8B" opacity="0.75" />
                </g>

                {/* Wooden side table / stool */}
                <g transform="translate(85, 175)">
                    {/* Stool top */}
                    <ellipse cx="28" cy="18" rx="26" ry="6" fill="#8D5B4C" />
                    <ellipse cx="28" cy="16" rx="26" ry="6" fill="#A77160" />
                    {/* Stool legs */}
                    <line x1="12" y1="20" x2="6" y2="70" stroke="#7A4B3D" strokeWidth="3" strokeLinecap="round" />
                    <line x1="44" y1="20" x2="50" y2="70" stroke="#7A4B3D" strokeWidth="3" strokeLinecap="round" />
                    <line x1="28" y1="22" x2="28" y2="72" stroke="#683F33" strokeWidth="3" strokeLinecap="round" />
                    {/* Cross brace */}
                    <line x1="10" y1="50" x2="47" y2="50" stroke="#7A4B3D" strokeWidth="2" strokeLinecap="round" />
                </g>

                {/* Potted Plant */}
                <g transform="translate(95, 115)">
                    {/* Plant pot */}
                    <path d="M12 55 L16 75 C16 77 34 77 34 75 L38 55 Z" fill="#EAD5CB" stroke="#C9ABA0" strokeWidth="1.5" />
                    
                    {/* Stems */}
                    <path d="M25 60 Q 24 35, 25 10" stroke="#487558" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                    <path d="M25 45 Q 12 38, 8 28" stroke="#487558" strokeWidth="2" strokeLinecap="round" fill="none" />
                    <path d="M25 40 Q 38 32, 42 22" stroke="#487558" strokeWidth="2" strokeLinecap="round" fill="none" />
                    <path d="M25 25 Q 16 18, 12 8" stroke="#487558" strokeWidth="2" strokeLinecap="round" fill="none" />
                    
                    {/* Leaves - modern stylized Monstera / Fiddle-leaf */}
                    {/* Top leaf */}
                    <path d="M25 10 C20 -2, 30 -2, 25 10 Z" fill="#4B8261" />
                    <ellipse cx="25" cy="4" rx="7" ry="10" fill="#589771" transform="rotate(-5, 25, 4)" />
                    {/* Left top leaf */}
                    <ellipse cx="10" cy="7" rx="6" ry="9" fill="#497F5F" transform="rotate(-35, 10, 7)" />
                    {/* Left mid leaf */}
                    <ellipse cx="6" cy="27" rx="7" ry="11" fill="#538E6B" transform="rotate(-45, 6, 27)" />
                    {/* Right mid leaf */}
                    <ellipse cx="43" cy="21" rx="7" ry="11" fill="#447556" transform="rotate(40, 43, 21)" />
                    {/* Lower leaves */}
                    <ellipse cx="14" cy="40" rx="6" ry="9" fill="#3D6B4E" transform="rotate(-20, 14, 40)" />
                    <ellipse cx="36" cy="35" rx="6" ry="9" fill="#589771" transform="rotate(25, 36, 35)" />
                </g>

                {/* Cozy Blush Pink Armchair */}
                <g transform="translate(170, 130)">
                    {/* Floor shadow */}
                    <ellipse cx="65" cy="116" rx="68" ry="10" fill="#E8D5DA" opacity="0.6" />

                    {/* Chair Legs */}
                    <line x1="26" y1="88" x2="16" y2="120" stroke="#7A4B3D" strokeWidth="3.5" strokeLinecap="round" />
                    <line x1="104" y1="88" x2="114" y2="120" stroke="#7A4B3D" strokeWidth="3.5" strokeLinecap="round" />
                    <line x1="42" y1="88" x2="38" y2="116" stroke="#683F33" strokeWidth="3" strokeLinecap="round" />
                    <line x1="88" y1="88" x2="92" y2="116" stroke="#683F33" strokeWidth="3" strokeLinecap="round" />

                    {/* Main Backrest */}
                    <path
                        d="M20 25 C20 5, 110 5, 110 25 C112 55, 110 80, 110 80 L20 80 C20 80, 18 55, 20 25 Z"
                        fill="#E89BA8"
                        stroke="#D37E8E"
                        strokeWidth="1.5"
                    />

                    {/* Vertical Tufting on Backrest */}
                    <path d="M42 16 Q42 50, 43 78" stroke="#D37E8E" strokeWidth="1.5" strokeDasharray="3 2" fill="none" opacity="0.8" />
                    <path d="M65 12 Q65 48, 65 78" stroke="#D37E8E" strokeWidth="1.5" strokeDasharray="3 2" fill="none" opacity="0.8" />
                    <path d="M88 16 Q88 50, 87 78" stroke="#D37E8E" strokeWidth="1.5" strokeDasharray="3 2" fill="none" opacity="0.8" />

                    {/* Left Armrest */}
                    <rect x="6" y="44" width="22" height="42" rx="11" fill="#F0ACB8" stroke="#D37E8E" strokeWidth="1.5" />
                    {/* Right Armrest */}
                    <rect x="102" y="44" width="22" height="42" rx="11" fill="#DF8F9D" stroke="#C57584" strokeWidth="1.5" />

                    {/* Plump Seat Cushion */}
                    <rect x="22" y="66" width="86" height="26" rx="12" fill="#F4B7C1" stroke="#D37E8E" strokeWidth="1.5" />
                    
                    {/* Throw Pillow / Lumbar Cushion */}
                    <rect x="42" y="48" width="46" height="32" rx="8" fill="#FBF2F4" stroke="#E5BDC5" strokeWidth="1.5" transform="rotate(-4, 65, 64)" />
                    {/* Pattern on pillow */}
                    <circle cx="60" cy="62" r="3" fill="#D37E8E" opacity="0.6" />
                    <circle cx="70" cy="63" r="3" fill="#D37E8E" opacity="0.6" />
                </g>
            </svg>
        </div>
    );
}
