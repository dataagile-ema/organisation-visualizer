/**
 * Statiska färgklasser för Tailwind JIT-kompilering
 *
 * Tailwind kräver att alla klassnamn finns statiskt i koden.
 * Dynamisk strängkonkatenering som `bg-${color}-100` fungerar inte.
 */

// Alla färger som används i thresholds.json
type ThresholdColor = 'emerald' | 'amber' | 'red' | 'slate';

// Statisk lookup för bakgrundsfärger
const bgClasses: Record<ThresholdColor, string> = {
  emerald: 'bg-emerald-100',
  amber: 'bg-amber-100',
  red: 'bg-red-100',
  slate: 'bg-slate-100'
};

// Statisk lookup för textfärger (600-varianten)
const textClasses: Record<ThresholdColor, string> = {
  emerald: 'text-emerald-600',
  amber: 'text-amber-600',
  red: 'text-red-600',
  slate: 'text-slate-600'
};

// Statisk lookup för badge-textfärger (700-varianten)
const badgeTextClasses: Record<ThresholdColor, string> = {
  emerald: 'text-emerald-700',
  amber: 'text-amber-700',
  red: 'text-red-700',
  slate: 'text-slate-700'
};

/**
 * Hämta bakgrundsfärgklass för en färg
 */
export function getBgClass(color: string): string {
  return bgClasses[color as ThresholdColor] || bgClasses.slate;
}

/**
 * Hämta textfärgklass för en färg
 */
export function getTextClass(color: string): string {
  return textClasses[color as ThresholdColor] || textClasses.slate;
}

/**
 * Hämta kombinerade klasser för bakgrund och text
 */
export function getColorClasses(color: string): { bg: string; text: string } {
  return {
    bg: getBgClass(color),
    text: getTextClass(color)
  };
}

/**
 * Hämta badge-klasser (bakgrund + mörkare text)
 */
export function getBadgeClasses(color: string): string {
  const bg = bgClasses[color as ThresholdColor] || bgClasses.slate;
  const text = badgeTextClasses[color as ThresholdColor] || badgeTextClasses.slate;
  return `${bg} ${text}`;
}
