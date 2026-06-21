import type { Siswa } from "@/lib/types/database";

export type GroupMode = "count" | "size";

/** Fisher–Yates shuffle (in-place copy). */
export function shuffleArray<T>(items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Split students into random groups.
 * - `count`: distribute evenly across N groups (round-robin)
 * - `size`: chunk into groups of N students (last group may be smaller)
 */
export function randomGroups(
  students: Siswa[],
  mode: GroupMode,
  value: number,
): Siswa[][] {
  if (students.length === 0 || value < 1) return [];

  const shuffled = shuffleArray(students);

  if (mode === "count") {
    const groupCount = Math.min(
      Math.max(2, Math.floor(value)),
      shuffled.length,
    );
    const groups: Siswa[][] = Array.from({ length: groupCount }, () => []);
    shuffled.forEach((siswa, i) => {
      groups[i % groupCount].push(siswa);
    });
    return groups;
  }

  const size = Math.max(2, Math.floor(value));
  const groups: Siswa[][] = [];
  for (let i = 0; i < shuffled.length; i += size) {
    groups.push(shuffled.slice(i, i + size));
  }
  return groups;
}

export const GROUP_CARD_COLORS = [
  "border-l-indigo-500 bg-indigo-500/5",
  "border-l-violet-500 bg-violet-500/5",
  "border-l-purple-500 bg-purple-500/5",
  "border-l-fuchsia-500 bg-fuchsia-500/5",
  "border-l-pink-500 bg-pink-500/5",
  "border-l-rose-500 bg-rose-500/5",
  "border-l-orange-500 bg-orange-500/5",
  "border-l-amber-500 bg-amber-500/5",
  "border-l-lime-500 bg-lime-500/5",
  "border-l-emerald-500 bg-emerald-500/5",
  "border-l-teal-500 bg-teal-500/5",
  "border-l-cyan-500 bg-cyan-500/5",
  "border-l-sky-500 bg-sky-500/5",
  "border-l-blue-500 bg-blue-500/5",
] as const;
