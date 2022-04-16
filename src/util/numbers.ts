export function numberPadding(number: number, size: number): string {
  const str = "0".repeat(size) + number;
  return str.slice(str.length - size);
}
