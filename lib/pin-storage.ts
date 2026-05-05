// Client-side PIN storage using localStorage for persistence across sessions.

const PREFIX = "footable-pin-";
const TOURNAMENTS_KEY = "footable-tournaments";

type TournamentMeta = {
  publicId: string;
  name: string;
  savedAt: number;
};

export function saveTournamentPin(
  publicId: string,
  pin: string,
  name?: string,
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${PREFIX}${publicId}`, pin);
  // Track tournament list for "Your tournaments" section
  const list = listPinnedTournaments();
  const existing = list.findIndex((t) => t.publicId === publicId);
  const meta: TournamentMeta = {
    publicId,
    name: name ?? publicId.slice(0, 8),
    savedAt: Date.now(),
  };
  if (existing >= 0) {
    list[existing] = meta;
  } else {
    list.push(meta);
  }
  localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(list));
}

export function getTournamentPin(publicId: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`${PREFIX}${publicId}`);
}

export function removeTournamentPin(publicId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${PREFIX}${publicId}`);
  const list = listPinnedTournaments().filter((t) => t.publicId !== publicId);
  localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(list));
}

export function listPinnedTournaments(): TournamentMeta[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TOURNAMENTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as TournamentMeta[];
  } catch {
    return [];
  }
}
