import React from 'react';

export interface MidnightIconProps {
  size?: number;
  className?: string;
}

/**
 * MidnightIcon - SVG icon for the Midnight blockchain
 * Inline SVG to ensure it renders correctly when this package is consumed as a library
 */
export function MidnightIcon({ size = 16, className = '' }: MidnightIconProps): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 789.37 789.37"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path
        d="m394.69,0C176.71,0,0,176.71,0,394.69s176.71,394.69,394.69,394.69,394.69-176.71,394.69-394.69S612.67,0,394.69,0Zm0,716.6c-177.5,0-321.91-144.41-321.91-321.91S217.18,72.78,394.69,72.78s321.91,144.41,321.91,321.91-144.41,321.91-321.91,321.91Z"
        fill="currentColor"
      />
      <rect x="357.64" y="357.64" width="74.09" height="74.09" fill="currentColor" />
      <rect x="357.64" y="240.66" width="74.09" height="74.09" fill="currentColor" />
      <rect x="357.64" y="123.69" width="74.09" height="74.09" fill="currentColor" />
    </svg>
  );
}
