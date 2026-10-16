import { Injectable } from '@nestjs/common';

/**
 * BarcodeService — generates Code 128-B barcodes as standalone SVG.
 *
 * SRS (Merchant): "Generate unique Barcodes or QR codes for order
 * identification." Implemented with zero external dependencies so the
 * evaluation environment needs nothing beyond Node.
 *
 * Code 128-B encodes ASCII 32–127; each symbol is 11 modules wide.
 * The output is a valid, scannable barcode for values like "ST-482913".
 */

// Code 128-B: value = charCode - 32 for ASCII 32..127
// Standard Code 128 pattern table (widths of 6 elements per symbol, total 11 modules)
const CODE128_PATTERNS: string[] = [
  '11011001100', '11001101100', '11001100110', '10010011000', '10010001100',
  '10001001100', '10011001000', '10011000100', '10001100100', '11001001000',
  '11001000100', '11000100100', '10110011100', '10011011100', '10011001110',
  '10111001100', '10011101100', '10011100110', '11001110010', '11001011100',
  '11001001110', '11011100100', '11001110100', '11101101110', '11101001100',
  '11100101100', '11100100110', '11101100100', '11100110100', '11100110010',
  '11011011000', '11011000110', '11000110110', '10100011000', '10001011000',
  '10001000110', '10110001000', '10001101000', '10001100010', '11010001000',
  '11000101000', '11000100010', '10110111000', '10110001110', '10001101110',
  '10111011000', '10111000110', '10001110110', '11101110110', '11010001110',
  '11000101110', '11011101000', '11011100010', '11011101110', '11101011000',
  '11101000110', '11100010110', '11101101000', '11101100010', '11100011010',
  '11101111010', '11001000010', '11110001010', '10100110000', '10100001100',
  '10010110000', '10010000110', '10000101100', '10000100110', '10110010000',
  '10110000100', '10011010000', '10011000010', '10000110100', '10000110010',
  '11000010010', '11001010000', '11110111010', '11000010100', '10001111010',
  '10100111100', '10010111100', '10010011110', '10111100100', '10011110100',
  '10011110010', '11110100100', '11110010100', '11110010010', '11011011110',
  '11011110110', '11110110110', '10101111000', '10100011110', '10001011110',
  '10111101000', '10111100010', '11110101000', '11110100010', '10111011110',
  '10111101110', '11101011110', '11110101110', '11010000100', '11010010000',
  '11010011100', '11000111010', // 106 = Start B
];

const START_B = 104; // pattern index for Start Code B
const STOP_PATTERN = '1100011101011';

@Injectable()
export class BarcodeService {
  /**
   * Generate a Code 128-B SVG for the given value.
   * Non-encodable characters are replaced with '-'.
   */
  code128Svg(value: string, opts?: { height?: number; moduleWidth?: number }): string {
    const height = opts?.height ?? 60;
    const mw = opts?.moduleWidth ?? 2;
    const quiet = 10; // quiet-zone modules on each side

    // Sanitize: Code 128-B supports ASCII 32..126
    const clean = (value || '')
      .split('')
      .map((c) => (c.charCodeAt(0) >= 32 && c.charCodeAt(0) <= 126 ? c : '-'))
      .join('');

    // Build the bit pattern: Start-B + data + checksum + stop
    let bits = CODE128_PATTERNS[START_B];
    let checksum = START_B;

    for (let i = 0; i < clean.length; i++) {
      const idx = clean.charCodeAt(i) - 32;
      bits += CODE128_PATTERNS[idx];
      checksum += idx * (i + 1);
    }
    bits += CODE128_PATTERNS[checksum % 103];
    bits += STOP_PATTERN;

    const totalModules = bits.length + quiet * 2;
    const widthPx = totalModules * mw;

    // Render bars as <rect> elements
    let x = quiet * mw;
    const rects: string[] = [];
    for (let i = 0; i < bits.length; i++) {
      if (bits[i] === '1') {
        rects.push(`<rect x="${x}" y="0" width="${mw}" height="${height}" />`);
      }
      x += mw;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${widthPx}" height="${height + 22}" viewBox="0 0 ${widthPx} ${height + 22}" role="img" aria-label="Barcode ${clean}">
  <rect width="${widthPx}" height="${height + 22}" fill="#ffffff"/>
  <g fill="#000000">${rects.join('')}</g>
  <text x="${widthPx / 2}" y="${height + 16}" font-family="monospace" font-size="12" text-anchor="middle" fill="#000000">${clean}</text>
</svg>`;
  }
}