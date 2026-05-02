const EASTERN_ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function toEasternArabicNumeral(n: number): string {
  return String(n).replace(/\d/g, (d) => EASTERN_ARABIC_DIGITS.charAt(Number(d)));
}
