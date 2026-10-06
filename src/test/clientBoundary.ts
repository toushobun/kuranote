import { readFileSync } from "node:fs";
import { join } from "node:path";

// 判断源码文件是否以 "use client" 声明客户端边界（相对仓库根目录的路径）。
export function hasUseClientDirective(sourcePath: string): boolean {
  return readFileSync(join(process.cwd(), sourcePath), "utf8").startsWith(
    '"use client";',
  );
}
