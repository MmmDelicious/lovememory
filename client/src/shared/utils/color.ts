/**
 * Color utilities for working with hex colors
 */

export const getHueFromHex = (hex: string): number => {
  const clean = hex.replace('#','');
  const bigint = parseInt(clean.length === 3 ? clean.split('').map(x=>x+x).join('') : clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  const rNorm = r/255, gNorm = g/255, bNorm = b/255;
  const max = Math.max(rNorm, gNorm, bNorm), min = Math.min(rNorm, gNorm, bNorm);
  let h = 0; const d = max - min;
  if (d === 0) h = 0;
  else if (max === rNorm) h = ((gNorm - bNorm) / d) % 6;
  else if (max === gNorm) h = (bNorm - rNorm) / d + 2;
  else h = (rNorm - gNorm) / d + 4;
  h = Math.round((h * 60 + 360) % 360);
  return h;
};

export const darken = (hex: string, amt: number = 15): string => {
  const c = hex.replace('#','');
  const num = parseInt(c.length === 3 ? c.split('').map(x=>x+x).join('') : c, 16);
  let r = (num >> 16) - amt; if (r < 0) r = 0;
  let g = ((num >> 8) & 0x00FF) - amt; if (g < 0) g = 0;
  let b = (num & 0x0000FF) - amt; if (b < 0) b = 0;
  return `#${(r<<16 | g<<8 | b).toString(16).padStart(6,'0')}`;
};
