export const PI_DECIMALS = 100000;

/* PI -> minor unit (DB) */
export function toMinorUnit(pi: number): number {
  return Math.round(pi * PI_DECIMALS);
}

/* minor unit -> PI */
export function fromMinorUnit(value: number): number {
  return value / PI_DECIMALS;
}

/* format hiển thị */
export function formatPi(value: number): string {
  return (value / PI_DECIMALS).toFixed(5);
}
