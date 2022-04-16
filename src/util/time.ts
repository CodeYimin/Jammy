import { numberPadding } from "./numbers";

export function secondsToFormattedString(
  totalSeconds: number,
  mode: "colon" | "abbrevation"
): string {
  let duration: string;

  const seconds = totalSeconds % 60;
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const days = Math.floor(totalSeconds / 86400);

  // Seconds
  duration = numberPadding(seconds, 2) + (mode === "colon" ? "" : "s");
  // Minutes
  duration =
    numberPadding(minutes, 2) + (mode === "colon" ? ":" : "m ") + duration;
  // Hours
  if (totalSeconds >= 3600) {
    duration =
      numberPadding(hours, 2) + (mode === "colon" ? ":" : "h ") + duration;
  }
  // Days
  if (totalSeconds >= 86400) {
    duration =
      numberPadding(days, 2) + (mode === "colon" ? ":" : "d ") + duration;
  }

  return duration;
}

export function msToHoursMinutesSeconds(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);

  const seconds = totalSeconds % 60;
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const hours = Math.floor(totalSeconds / 3600);

  return `${hours} hours ${minutes} minutes ${seconds} seconds`;
}
