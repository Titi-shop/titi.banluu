export const PI_DECIMALS = 1.00000;

/* PI -> DB (minor unit) */
export function toMinorUnit(pi: number): number {
  return Math.round(pi * PI_DECIMALS);
}

/* DB -> PI */
export function fromMinorUnit(value: number): number {
  return value / PI_DECIMALS;
}

/* format hiển thị */
export function formatPi(value: number): string {
  return (value / PI_DECIMALS).toFixed(5);
}
