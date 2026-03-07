export const PI_DECIMALS = 100000;

/* PI -> DB */
export function toMinorUnit(pi: number): number {
  return Math.round(pi * PI_DECIMALS);
}

/* DB -> PI */
export function fromMinorUnit(value: number): number {
  return value / PI_DECIMALS;
}

/* format hiển thị */
export function formatPi(value: number): string {
  const pi = value / PI_DECIMALS;

  const parts = pi.toFixed(5).split(".");
  const integer = Number(parts[0]).toLocaleString("en-US");
  const decimal = parts[1];

  return `${integer}.${decimal}`;
}
