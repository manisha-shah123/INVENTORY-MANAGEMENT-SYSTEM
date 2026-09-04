import { adToBs, bsToAd } from "@sbmdkl/nepali-date-converter";

export const BS_MONTHS = [
  "Baishakh",
  "Jestha",
  "Ashadh",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
];

const pad = (n) => String(n).padStart(2, "0");

export const todayAdIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const adToBsSafe = (adIso) => {
  try {
    return adToBs(adIso);
  } catch (e) {
    return null;
  }
};

export const bsToAdSafe = (bsIso) => {
  try {
    return bsToAd(bsIso);
  } catch (e) {
    return null;
  }
};

// Falls back to the raw string if it can't be converted (e.g. old BS-text records
// entered before this feature existed) so nothing breaks or shows garbage.
export const formatBsFromAd = (adIso) => {
  if (!adIso) return "—";
  const bs = adToBsSafe(adIso);
  return bs ? `${bs} BS` : adIso;
};

// Finds how many days are in a BS month by walking forward day-by-day in AD
// and checking when the BS month rolls over. Small loop, safe for UI use.
export const getDaysInBsMonth = (bsYear, bsMonth) => {
  const firstAd = bsToAdSafe(`${bsYear}-${pad(bsMonth)}-01`);
  if (!firstAd) return 30;
  let current = new Date(firstAd + "T00:00:00");
  let count = 0;
  for (let i = 0; i < 33; i++) {
    const iso = `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`;
    const bs = adToBsSafe(iso);
    if (!bs) break;
    const [y, m] = bs.split("-").map(Number);
    if (y === bsYear && m === bsMonth) {
      count += 1;
      current.setDate(current.getDate() + 1);
    } else {
      break;
    }
  }
  return count;
};
