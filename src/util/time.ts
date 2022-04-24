import { numberPadding } from "./numbers";

export function secondsToFormattedString(totalSeconds: number): string {
  let duration = "";

  const seconds = totalSeconds % 60;
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const days = Math.floor(totalSeconds / 86400);

  const hasMinutes = totalSeconds > 60;
  const hasHours = totalSeconds > 3600;
  const hasDays = totalSeconds > 86400;

  if (hasDays) {
    duration += `${days > 9 ? numberPadding(days, 2) : days}:`;
  }

  if (hasHours) {
    duration += `${hours > 9 || hasDays ? numberPadding(hours, 2) : hours}:`;
  }

  if (hasMinutes) {
    duration += `${
      minutes > 9 || hasHours ? numberPadding(minutes, 2) : minutes
    }:`;
  } else {
    duration += "0:";
  }

  duration += numberPadding(seconds, 2);

  return duration;
}
