export function numberPadding(number: number, size: number): string {
  const str = `${"0".repeat(size)}${number}`;
  return str.slice(str.length - size);
}

export function numberToSuffixString(number: number): string {
  const hasThousands = number >= 10 ** 3;
  const hasMillions = number >= 10 ** 6;
  const hasBillions = number >= 10 ** 9;

  if (hasBillions) {
    return `${(number / 10 ** 9).toFixed(number < 10 ** 10 - 1 ? 1 : 0)}B`;
  } else if (hasMillions) {
    return `${(number / 10 ** 6).toFixed(number < 10 ** 7 - 1 ? 1 : 0)}M`;
  } else if (hasThousands) {
    return `${(number / 10 ** 3).toFixed(number < 10 ** 4 - 1 ? 1 : 0)}K`;
  } else {
    return `${number}`;
  }
}
