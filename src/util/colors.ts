const enabled = !!process.stdout.isTTY && !process.env.NO_COLOR;

function wrap(code: string) {
  return (text: string) => (enabled ? `\x1b[${code}m${text}\x1b[0m` : text);
}

export const colors = {
  red: wrap("31"),
  yellow: wrap("33"),
  cyan: wrap("36"),
  gray: wrap("90"),
  bold: wrap("1"),
};

export const severityColor: Record<string, (text: string) => string> = {
  critical: wrap("1;31"),
  high: wrap("31"),
  medium: wrap("33"),
  low: wrap("90"),
};
