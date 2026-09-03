'use client';

import React from 'react';

export function TherapyHeadIllustration({ className = 'w-44 h-44 sm:w-52 sm:h-52 shrink-0' }: { className?: string }) {
    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            <svg
                viewBox="0 0 240 220"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full object-contain"
            >
                {/* Soft blush organic backdrop shape */}
                <path
                    d="M170 30C210 50 230 100 215 145C200 190 155 210 110 205C65 200 35 170 45 125C55 80 130 10 170 30Z"
                    fill="#F7E6EB"
                />

                {/* Left botanical leaves (sage green) */}
                <g stroke="#6E947F" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none">
                    {/* Stem */}
                    <path d="M70 195C60 175 62 155 75 140" />
                    {/* Leaves */}
                    <path d="M62 165C50 162 45 152 48 143C56 142 63 150 63 155" fill="#88AE99" fillOpacity="0.85" />
                    <path d="M68 152C62 140 68 132 77 132C79 140 76 148 70 152" fill="#88AE99" fillOpacity="0.85" />
                    <path d="M75 178C65 176 60 170 63 164C70 163 76 170 76 174" fill="#88AE99" fillOpacity="0.85" />
                </g>

                {/* Right botanical leaves (sage green) */}
                <g stroke="#6E947F" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none">
                    {/* Stem */}
                    <path d="M165 195C175 175 178 150 165 130" />
                    {/* Leaves */}
                    <path d="M173 162C188 160 198 152 195 142C184 140 174 150 173 155" fill="#88AE99" fillOpacity="0.85" />
                    <path d="M168 145C178 135 186 130 192 135C190 144 180 149 170 146" fill="#88AE99" fillOpacity="0.85" />
                    <path d="M166 178C176 177 184 172 182 165C175 163 168 171 166 175" fill="#88AE99" fillOpacity="0.85" />
                </g>

                {/* Head Silhouette Profile (plum outline facing left) */}
                <path
                    d="M135 192C130 180 128 170 128 162C118 162 108 163 98 168C96 161 97 155 101 150C92 148 88 143 89 137C90 132 94 130 99 129C96 126 95 122 97 117C98 113 103 111 106 111C102 102 104 90 110 82C117 72 130 65 146 65C168 65 182 78 185 96C188 114 178 132 165 142C160 147 156 156 155 165C154 175 156 183 160 192"
                    stroke="#581C2B"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Brain convolutions inside head */}
                <path
                    d="M130 102C126 98 126 92 130 88C134 84 140 85 143 88C146 84 154 84 158 87C162 90 162 96 159 100C164 102 166 108 163 113C160 118 153 118 150 116C147 121 139 122 135 118C131 114 133 108 136 106"
                    stroke="#B84A5C"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="0.5 1"
                />

                {/* Glowing Heart at the center of the brain */}
                <path
                    d="M145 108C145 108 139 101 139 96C139 92.5 141.5 90 145 92.5C148.5 90 151 92.5 151 96C151 101 145 108 145 108Z"
                    fill="#A03048"
                />
            </svg>
        </div>
    );
}
