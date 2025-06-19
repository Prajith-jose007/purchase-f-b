import type { SVGProps } from 'react';

export function CulinaryCompassIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2L12 6" />
      <path d="M12 18L12 22" />
      <path d="M2 12L6 12" />
      <path d="M18 12L22 12" />
      <path d="M16.24 7.76L13.41 10.59" />
      <path d="M10.59 13.41L7.76 16.24" />
      {/* Changed central circle to a diamond */}
      <path d="M12 9.5 L14.5 12 L12 14.5 L9.5 12 Z" fill="currentColor" />
      {/* Chef's hat representation */}
      <path d="M10 8 A2 2 0 0 1 14 8 Q15 6 12 4 Q9 6 10 8 Z" strokeWidth="1.5" />
      <path d="M9 9 H15 V10 H9 Z" strokeWidth="1.5" />
    </svg>
  );
}
