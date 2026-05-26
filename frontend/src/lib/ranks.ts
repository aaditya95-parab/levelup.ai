// Rank title system based on player level
export interface RankInfo {
  title: string;
  color: string; // tailwind text color
  glowColor: string; // CSS glow color for shadow effects
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'legendary';
}

const RANKS: { minLevel: number; info: RankInfo }[] = [
  { minLevel: 50, info: { title: 'Mythic Overlord', color: 'text-rose-400', glowColor: 'rgba(251,113,133,0.7)', tier: 'legendary' } },
  { minLevel: 40, info: { title: 'Celestial', color: 'text-amber-300', glowColor: 'rgba(252,211,77,0.7)', tier: 'legendary' } },
  { minLevel: 30, info: { title: 'Grandmaster', color: 'text-fuchsia-400', glowColor: 'rgba(232,121,249,0.7)', tier: 'diamond' } },
  { minLevel: 25, info: { title: 'Diamond Elite', color: 'text-cyan-300', glowColor: 'rgba(103,232,249,0.7)', tier: 'diamond' } },
  { minLevel: 20, info: { title: 'Platinum Vanguard', color: 'text-slate-200', glowColor: 'rgba(226,232,240,0.6)', tier: 'platinum' } },
  { minLevel: 15, info: { title: 'Gold Sentinel', color: 'text-yellow-400', glowColor: 'rgba(250,204,21,0.6)', tier: 'gold' } },
  { minLevel: 10, info: { title: 'Silver Ranger', color: 'text-gray-300', glowColor: 'rgba(209,213,219,0.5)', tier: 'silver' } },
  { minLevel: 5,  info: { title: 'Bronze Fighter', color: 'text-orange-400', glowColor: 'rgba(251,146,60,0.5)', tier: 'bronze' } },
  { minLevel: 3,  info: { title: 'Apprentice', color: 'text-green-400', glowColor: 'rgba(74,222,128,0.4)', tier: 'bronze' } },
  { minLevel: 1,  info: { title: 'Novice', color: 'text-muted-foreground', glowColor: 'rgba(150,150,170,0.3)', tier: 'bronze' } },
];

export function getRank(level: number): RankInfo {
  for (const rank of RANKS) {
    if (level >= rank.minLevel) return rank.info;
  }
  return RANKS[RANKS.length - 1]!.info;
}

export function getNextRank(level: number): { info: RankInfo; levelRequired: number } | null {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (level < RANKS[i]!.minLevel) {
      return { info: RANKS[i]!.info, levelRequired: RANKS[i]!.minLevel };
    }
  }
  return null; // Already at max rank
}
