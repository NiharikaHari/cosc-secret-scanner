import fs from "node:fs";
import path from "node:path";

export const DEFAULT_EXCLUDE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".next",
  ".venv",
  "venv",
  "vendor",
]);

export const DEFAULT_EXCLUDE_FILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "Cargo.lock",
  "Gemfile.lock",
]);

const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".ico", ".pdf", ".zip", ".gz", ".tar",
  ".woff", ".woff2", ".ttf", ".eot", ".mp3", ".mp4", ".mov", ".exe", ".dll",
  ".so", ".dylib", ".bin", ".class", ".jar", ".wasm",
]);

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

// Converts a reduced glob subset (*, **, ?) into a RegExp. Not a full
// gitignore-spec implementation - documented as a known limitation.
function globToRegExp(glob: string): RegExp {
  let pattern = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        pattern += ".*";
        i++;
      } else {
        pattern += "[^/]*";
      }
    } else if (c === "?") {
      pattern += "[^/]";
    } else if (".+^${}()|[]\\".includes(c)) {
      pattern += `\\${c}`;
    } else {
      pattern += c;
    }
  }
  return new RegExp(`^${pattern}$`);
}

export function loadIgnorePatterns(ignoreFilePath: string): RegExp[] {
  if (!fs.existsSync(ignoreFilePath)) return [];
  const lines = fs.readFileSync(ignoreFilePath, "utf8").split("\n");
  return lines
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"))
    .map(globToRegExp);
}

export function isIgnoredByPatterns(relativePath: string, patterns: RegExp[]): boolean {
  return patterns.some((re) => re.test(relativePath));
}

export function isDefaultExcludedDir(dirName: string): boolean {
  return DEFAULT_EXCLUDE_DIRS.has(dirName);
}

export function isDefaultExcludedFile(fileName: string): boolean {
  if (DEFAULT_EXCLUDE_FILES.has(fileName)) return true;
  const ext = path.extname(fileName).toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

export function isProbablyBinary(filePath: string): boolean {
  try {
    const fd = fs.openSync(filePath, "r");
    const buffer = Buffer.alloc(512);
    const bytesRead = fs.readSync(fd, buffer, 0, 512, 0);
    fs.closeSync(fd);
    for (let i = 0; i < bytesRead; i++) {
      if (buffer[i] === 0) return true;
    }
    return false;
  } catch {
    return true;
  }
}

export function isTooLarge(filePath: string): boolean {
  try {
    return fs.statSync(filePath).size > MAX_FILE_SIZE_BYTES;
  } catch {
    return true;
  }
}
