import { capitalize } from 'lodash';

interface NetworkTypeBadgeProps {
  type: string;
}

// Define a fixed size for the badge to ensure it's a circle
const BADGE_SIZE = '1.2rem'; // E.g., 20px, adjust as needed (h-5 w-5 in Tailwind)

export function NetworkTypeBadge({ type }: NetworkTypeBadgeProps) {
  const isDevnet = type === 'devnet';
  const isTestnet = type === 'testnet';
  const isTestnetLike = isTestnet || isDevnet; // For styling purposes

  // Determine badge text based on network type
  const badgeText = isDevnet ? 'D' : isTestnet ? 'T' : 'M';

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-medium flex-shrink-0 text-xs 
                  ${
                    isTestnetLike
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  }
                 `}
      style={{
        width: BADGE_SIZE,
        height: BADGE_SIZE,
        lineHeight: BADGE_SIZE /* For vertical centering */,
      }}
      title={capitalize(type)} // Full type name for tooltip
    >
      {badgeText}
    </span>
  );
}
