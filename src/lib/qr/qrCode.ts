/**
 * QR Code generator adapted from Project Nayuki's TypeScript implementation.
 * Copyright (c) Project Nayuki. SPDX-License-Identifier: MIT.
 * This local variant intentionally supports UTF-8 byte-mode text with low ECC only.
 */

type Bit = number;
type Byte = number;

const ECC_CODEWORDS_PER_BLOCK = [
  -1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24,
  28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30,
  30, 30, 30, 30, 30, 30, 30,
] as const;

const NUM_ERROR_CORRECTION_BLOCKS = [
  -1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8,
  9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24,
  25,
] as const;

const MIN_VERSION = 1;
const MAX_VERSION = 40;
const LOW_ECC_FORMAT_BITS = 1;
const PENALTY_N1 = 3;
const PENALTY_N2 = 3;
const PENALTY_N3 = 40;
const PENALTY_N4 = 10;

export type QrMatrix = readonly (readonly boolean[])[];

export function createQrMatrix(text: string): QrMatrix {
  const data = Array.from(new TextEncoder().encode(text));
  let version = MIN_VERSION;
  let usedBits = 0;

  for (; version <= MAX_VERSION; version += 1) {
    const countBits = version <= 9 ? 8 : 16;
    usedBits = 4 + countBits + data.length * 8;
    if (usedBits <= getNumDataCodewords(version) * 8) break;
  }

  if (version > MAX_VERSION) throw new RangeError("二维码内容过长");

  const capacityBits = getNumDataCodewords(version) * 8;
  const bits: Bit[] = [];
  appendBits(0x4, 4, bits);
  appendBits(data.length, version <= 9 ? 8 : 16, bits);
  for (const value of data) appendBits(value, 8, bits);
  appendBits(0, Math.min(4, capacityBits - usedBits), bits);
  appendBits(0, (8 - (bits.length % 8)) % 8, bits);
  for (let pad = 0xec; bits.length < capacityBits; pad ^= 0xec ^ 0x11) {
    appendBits(pad, 8, bits);
  }

  const codewords: Byte[] = [];
  while (codewords.length * 8 < bits.length) codewords.push(0);
  bits.forEach((bit, index) => {
    codewords[index >>> 3] |= bit << (7 - (index & 7));
  });

  return new QrCode(version, codewords).getModules();
}

export function qrMatrixToPath(matrix: QrMatrix, margin = 4): string {
  const operations: string[] = [];
  matrix.forEach((row, y) => {
    let start: number | null = null;
    row.forEach((dark, x) => {
      if (!dark && start !== null) {
        operations.push(
          `M${start + margin} ${y + margin}h${x - start}v1H${start + margin}z`,
        );
        start = null;
      }
      if (dark && start === null) start = x;
      if (dark && x === row.length - 1 && start !== null) {
        operations.push(
          `M${start + margin} ${y + margin}h${x + 1 - start}v1H${start + margin}z`,
        );
      }
    });
  });
  return operations.join("");
}

class QrCode {
  readonly size: number;
  private mask = 0;
  private readonly modules: boolean[][] = [];
  private readonly isFunction: boolean[][] = [];

  constructor(
    private readonly version: number,
    dataCodewords: readonly Byte[],
  ) {
    this.size = version * 4 + 17;
    const row = Array<boolean>(this.size).fill(false);
    for (let index = 0; index < this.size; index += 1) {
      this.modules.push(row.slice());
      this.isFunction.push(row.slice());
    }

    this.drawFunctionPatterns();
    this.drawCodewords(this.addEccAndInterleave(dataCodewords));

    let minimumPenalty = Number.POSITIVE_INFINITY;
    for (let candidate = 0; candidate < 8; candidate += 1) {
      this.applyMask(candidate);
      this.drawFormatBits(candidate);
      const penalty = this.getPenaltyScore();
      if (penalty < minimumPenalty) {
        this.mask = candidate;
        minimumPenalty = penalty;
      }
      this.applyMask(candidate);
    }

    this.applyMask(this.mask);
    this.drawFormatBits(this.mask);
  }

  getModules(): QrMatrix {
    return this.modules.map((row) => row.slice());
  }

  private drawFunctionPatterns() {
    for (let index = 0; index < this.size; index += 1) {
      this.setFunctionModule(6, index, index % 2 === 0);
      this.setFunctionModule(index, 6, index % 2 === 0);
    }
    this.drawFinderPattern(3, 3);
    this.drawFinderPattern(this.size - 4, 3);
    this.drawFinderPattern(3, this.size - 4);

    const positions = this.getAlignmentPatternPositions();
    for (let row = 0; row < positions.length; row += 1) {
      for (let column = 0; column < positions.length; column += 1) {
        const overlapsFinder =
          (row === 0 && column === 0) ||
          (row === 0 && column === positions.length - 1) ||
          (row === positions.length - 1 && column === 0);
        if (!overlapsFinder) {
          this.drawAlignmentPattern(positions[row], positions[column]);
        }
      }
    }
    this.drawFormatBits(0);
    this.drawVersion();
  }

  private drawFormatBits(mask: number) {
    const data = (LOW_ECC_FORMAT_BITS << 3) | mask;
    let remainder = data;
    for (let index = 0; index < 10; index += 1) {
      remainder = (remainder << 1) ^ ((remainder >>> 9) * 0x537);
    }
    const bits = ((data << 10) | remainder) ^ 0x5412;

    for (let index = 0; index <= 5; index += 1) {
      this.setFunctionModule(8, index, getBit(bits, index));
    }
    this.setFunctionModule(8, 7, getBit(bits, 6));
    this.setFunctionModule(8, 8, getBit(bits, 7));
    this.setFunctionModule(7, 8, getBit(bits, 8));
    for (let index = 9; index < 15; index += 1) {
      this.setFunctionModule(14 - index, 8, getBit(bits, index));
    }
    for (let index = 0; index < 8; index += 1) {
      this.setFunctionModule(
        this.size - 1 - index,
        8,
        getBit(bits, index),
      );
    }
    for (let index = 8; index < 15; index += 1) {
      this.setFunctionModule(
        8,
        this.size - 15 + index,
        getBit(bits, index),
      );
    }
    this.setFunctionModule(8, this.size - 8, true);
  }

  private drawVersion() {
    if (this.version < 7) return;
    let remainder = this.version;
    for (let index = 0; index < 12; index += 1) {
      remainder = (remainder << 1) ^ ((remainder >>> 11) * 0x1f25);
    }
    const bits = (this.version << 12) | remainder;
    for (let index = 0; index < 18; index += 1) {
      const color = getBit(bits, index);
      const a = this.size - 11 + (index % 3);
      const b = Math.floor(index / 3);
      this.setFunctionModule(a, b, color);
      this.setFunctionModule(b, a, color);
    }
  }

  private drawFinderPattern(x: number, y: number) {
    for (let dy = -4; dy <= 4; dy += 1) {
      for (let dx = -4; dx <= 4; dx += 1) {
        const xx = x + dx;
        const yy = y + dy;
        if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size) {
          const distance = Math.max(Math.abs(dx), Math.abs(dy));
          this.setFunctionModule(xx, yy, distance !== 2 && distance !== 4);
        }
      }
    }
  }

  private drawAlignmentPattern(x: number, y: number) {
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        this.setFunctionModule(
          x + dx,
          y + dy,
          Math.max(Math.abs(dx), Math.abs(dy)) !== 1,
        );
      }
    }
  }

  private setFunctionModule(x: number, y: number, isDark: boolean) {
    this.modules[y][x] = isDark;
    this.isFunction[y][x] = true;
  }

  private addEccAndInterleave(data: readonly Byte[]): Byte[] {
    if (data.length !== getNumDataCodewords(this.version)) {
      throw new RangeError("二维码数据长度无效");
    }
    const blockCount = NUM_ERROR_CORRECTION_BLOCKS[this.version];
    const eccLength = ECC_CODEWORDS_PER_BLOCK[this.version];
    const rawCodewords = Math.floor(getNumRawDataModules(this.version) / 8);
    const shortBlockCount = blockCount - (rawCodewords % blockCount);
    const shortBlockLength = Math.floor(rawCodewords / blockCount);
    const divisor = reedSolomonComputeDivisor(eccLength);
    const blocks: Byte[][] = [];

    for (
      let blockIndex = 0, offset = 0;
      blockIndex < blockCount;
      blockIndex += 1
    ) {
      const dataLength =
        shortBlockLength -
        eccLength +
        (blockIndex < shortBlockCount ? 0 : 1);
      const block = data.slice(offset, offset + dataLength);
      offset += dataLength;
      const ecc = reedSolomonComputeRemainder(block, divisor);
      const mutableBlock = [...block];
      if (blockIndex < shortBlockCount) mutableBlock.push(0);
      blocks.push(mutableBlock.concat(ecc));
    }

    const result: Byte[] = [];
    for (let index = 0; index < blocks[0].length; index += 1) {
      blocks.forEach((block, blockIndex) => {
        if (
          index !== shortBlockLength - eccLength ||
          blockIndex >= shortBlockCount
        ) {
          result.push(block[index]);
        }
      });
    }
    return result;
  }

  private drawCodewords(data: readonly Byte[]) {
    let bitIndex = 0;
    for (let right = this.size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vertical = 0; vertical < this.size; vertical += 1) {
        for (let column = 0; column < 2; column += 1) {
          const x = right - column;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? this.size - 1 - vertical : vertical;
          if (!this.isFunction[y][x] && bitIndex < data.length * 8) {
            this.modules[y][x] = getBit(
              data[bitIndex >>> 3],
              7 - (bitIndex & 7),
            );
            bitIndex += 1;
          }
        }
      }
    }
  }

  private applyMask(mask: number) {
    for (let y = 0; y < this.size; y += 1) {
      for (let x = 0; x < this.size; x += 1) {
        let invert = false;
        switch (mask) {
          case 0:
            invert = (x + y) % 2 === 0;
            break;
          case 1:
            invert = y % 2 === 0;
            break;
          case 2:
            invert = x % 3 === 0;
            break;
          case 3:
            invert = (x + y) % 3 === 0;
            break;
          case 4:
            invert =
              (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
            break;
          case 5:
            invert = ((x * y) % 2) + ((x * y) % 3) === 0;
            break;
          case 6:
            invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
            break;
          case 7:
            invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
            break;
          default:
            throw new RangeError("二维码掩码无效");
        }
        if (!this.isFunction[y][x] && invert) {
          this.modules[y][x] = !this.modules[y][x];
        }
      }
    }
  }

  private getPenaltyScore(): number {
    let result = 0;
    for (let y = 0; y < this.size; y += 1) {
      let runColor = false;
      let runLength = 0;
      const history = [0, 0, 0, 0, 0, 0, 0];
      for (let x = 0; x < this.size; x += 1) {
        if (this.modules[y][x] === runColor) {
          runLength += 1;
          if (runLength === 5) result += PENALTY_N1;
          else if (runLength > 5) result += 1;
        } else {
          this.finderPenaltyAddHistory(runLength, history);
          if (!runColor) {
            result +=
              this.finderPenaltyCountPatterns(history) * PENALTY_N3;
          }
          runColor = this.modules[y][x];
          runLength = 1;
        }
      }
      result +=
        this.finderPenaltyTerminateAndCount(
          runColor,
          runLength,
          history,
        ) * PENALTY_N3;
    }

    for (let x = 0; x < this.size; x += 1) {
      let runColor = false;
      let runLength = 0;
      const history = [0, 0, 0, 0, 0, 0, 0];
      for (let y = 0; y < this.size; y += 1) {
        if (this.modules[y][x] === runColor) {
          runLength += 1;
          if (runLength === 5) result += PENALTY_N1;
          else if (runLength > 5) result += 1;
        } else {
          this.finderPenaltyAddHistory(runLength, history);
          if (!runColor) {
            result +=
              this.finderPenaltyCountPatterns(history) * PENALTY_N3;
          }
          runColor = this.modules[y][x];
          runLength = 1;
        }
      }
      result +=
        this.finderPenaltyTerminateAndCount(
          runColor,
          runLength,
          history,
        ) * PENALTY_N3;
    }

    for (let y = 0; y < this.size - 1; y += 1) {
      for (let x = 0; x < this.size - 1; x += 1) {
        const color = this.modules[y][x];
        if (
          color === this.modules[y][x + 1] &&
          color === this.modules[y + 1][x] &&
          color === this.modules[y + 1][x + 1]
        ) {
          result += PENALTY_N2;
        }
      }
    }

    let darkCount = 0;
    for (const row of this.modules) {
      darkCount += row.reduce((sum, dark) => sum + (dark ? 1 : 0), 0);
    }
    const total = this.size * this.size;
    const balancePenalty =
      Math.ceil(Math.abs(darkCount * 20 - total * 10) / total) - 1;
    return result + balancePenalty * PENALTY_N4;
  }

  private finderPenaltyCountPatterns(history: readonly number[]): number {
    const unit = history[1];
    const core =
      unit > 0 &&
      history[2] === unit &&
      history[3] === unit * 3 &&
      history[4] === unit &&
      history[5] === unit;
    return (
      (core && history[0] >= unit * 4 && history[6] >= unit ? 1 : 0) +
      (core && history[6] >= unit * 4 && history[0] >= unit ? 1 : 0)
    );
  }

  private finderPenaltyTerminateAndCount(
    currentColor: boolean,
    currentLength: number,
    history: number[],
  ): number {
    if (currentColor) {
      this.finderPenaltyAddHistory(currentLength, history);
      currentLength = 0;
    }
    currentLength += this.size;
    this.finderPenaltyAddHistory(currentLength, history);
    return this.finderPenaltyCountPatterns(history);
  }

  private finderPenaltyAddHistory(
    currentLength: number,
    history: number[],
  ) {
    if (history[0] === 0) currentLength += this.size;
    history.pop();
    history.unshift(currentLength);
  }

  private getAlignmentPatternPositions(): number[] {
    if (this.version === 1) return [];
    const count = Math.floor(this.version / 7) + 2;
    const step =
      this.version === 32
        ? 26
        : Math.ceil((this.version * 4 + 4) / (count * 2 - 2)) * 2;
    const result = [6];
    for (
      let position = this.size - 7;
      result.length < count;
      position -= step
    ) {
      result.splice(1, 0, position);
    }
    return result;
  }
}

function getNumRawDataModules(version: number): number {
  if (version < MIN_VERSION || version > MAX_VERSION) {
    throw new RangeError("二维码版本无效");
  }
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const alignCount = Math.floor(version / 7) + 2;
    result -= (25 * alignCount - 10) * alignCount - 55;
    if (version >= 7) result -= 36;
  }
  return result;
}

function getNumDataCodewords(version: number): number {
  return (
    Math.floor(getNumRawDataModules(version) / 8) -
    ECC_CODEWORDS_PER_BLOCK[version] *
      NUM_ERROR_CORRECTION_BLOCKS[version]
  );
}

function reedSolomonComputeDivisor(degree: number): Byte[] {
  const result = Array<Byte>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let index = 0; index < degree; index += 1) {
    for (
      let coefficient = 0;
      coefficient < result.length;
      coefficient += 1
    ) {
      result[coefficient] = reedSolomonMultiply(
        result[coefficient],
        root,
      );
      if (coefficient + 1 < result.length) {
        result[coefficient] ^= result[coefficient + 1];
      }
    }
    root = reedSolomonMultiply(root, 0x02);
  }
  return result;
}

function reedSolomonComputeRemainder(
  data: readonly Byte[],
  divisor: readonly Byte[],
): Byte[] {
  const result = divisor.map(() => 0);
  for (const value of data) {
    const factor = value ^ (result.shift() ?? 0);
    result.push(0);
    divisor.forEach((coefficient, index) => {
      result[index] ^= reedSolomonMultiply(coefficient, factor);
    });
  }
  return result;
}

function reedSolomonMultiply(x: Byte, y: Byte): Byte {
  let product = 0;
  for (let index = 7; index >= 0; index -= 1) {
    product = (product << 1) ^ ((product >>> 7) * 0x11d);
    product ^= ((y >>> index) & 1) * x;
  }
  return product;
}

function appendBits(value: number, length: number, buffer: Bit[]) {
  if (length < 0 || length > 31 || value >>> length !== 0) {
    throw new RangeError("二维码位数据无效");
  }
  for (let index = length - 1; index >= 0; index -= 1) {
    buffer.push((value >>> index) & 1);
  }
}

function getBit(value: number, index: number): boolean {
  return ((value >>> index) & 1) !== 0;
}
