#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const DEFAULT_BASELINE = "20260722093000_harden_security_definer_search_path.sql";
const ALLOWED_SEARCH_PATH_SCHEMAS = new Set([
  "pg_catalog",
  "extensions",
  "pg_temp",
]);
const PGCRYPTO_FUNCTIONS = [
  "crypt",
  "decrypt",
  "decrypt_iv",
  "digest",
  "encrypt",
  "encrypt_iv",
  "gen_random_bytes",
  "gen_random_uuid",
  "gen_salt",
  "hmac",
  "pgp_armor_headers",
  "pgp_key_id",
  "pgp_pub_decrypt",
  "pgp_pub_decrypt_bytea",
  "pgp_pub_encrypt",
  "pgp_pub_encrypt_bytea",
  "pgp_sym_decrypt",
  "pgp_sym_decrypt_bytea",
  "pgp_sym_encrypt",
  "pgp_sym_encrypt_bytea",
];

function parseArguments(argv) {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const options = {
    root: path.resolve(scriptDir, ".."),
    baseline: DEFAULT_BASELINE,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const value = argv[index + 1];

    if (argument === "--root" && value) {
      options.root = path.resolve(value);
      index += 1;
    } else if (argument === "--baseline" && value) {
      options.baseline = value;
      index += 1;
    } else {
      throw new Error(`未知参数：${argument}`);
    }
  }

  return options;
}

function stripSqlComments(sql) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\r\n]*/g, " ");
}

function normalizeIdentifier(identifier) {
  return identifier.trim().replace(/^['"]|['"]$/g, "").toLowerCase();
}

function normalizeSearchPath(rawPath) {
  return rawPath
    .split(",")
    .map(normalizeIdentifier)
    .filter(Boolean);
}

function validateSearchPath(rawPath, context) {
  const schemas = normalizeSearchPath(rawPath);
  const errors = [];

  if (schemas.length < 2 || schemas[0] !== "pg_catalog") {
    errors.push(`${context}: search_path 必须以 pg_catalog 开头。`);
  }

  if (schemas.at(-1) !== "pg_temp") {
    errors.push(`${context}: search_path 必须以 pg_temp 结尾。`);
  }

  if (schemas.includes("public")) {
    errors.push(`${context}: search_path 不得无说明地包含 public。`);
  }

  const untrustedSchemas = schemas.filter(
    (schema) => !ALLOWED_SEARCH_PATH_SCHEMAS.has(schema),
  );
  if (untrustedSchemas.length > 0) {
    errors.push(
      `${context}: search_path 包含未登记的 schema：${untrustedSchemas.join(", ")}。`,
    );
  }

  return errors;
}

function extractFunctionDefinitions(sql) {
  const definitions = [];
  const createPattern = /\bcreate\s+(?:or\s+replace\s+)?function\b/gi;
  let createMatch;

  while ((createMatch = createPattern.exec(sql)) !== null) {
    const start = createMatch.index;
    const remaining = sql.slice(start);
    const bodyStartMatch = /\bas\s+(\$[A-Za-z0-9_]*\$)/i.exec(remaining);

    if (!bodyStartMatch) {
      continue;
    }

    const delimiter = bodyStartMatch[1];
    const bodyStart = start + bodyStartMatch.index + bodyStartMatch[0].length;
    const bodyEnd = sql.indexOf(delimiter, bodyStart);
    if (bodyEnd === -1) {
      continue;
    }

    const statementEnd = sql.indexOf(";", bodyEnd + delimiter.length);
    if (statementEnd === -1) {
      continue;
    }

    const statement = sql.slice(start, statementEnd + 1);
    const header = sql.slice(start, bodyStart);
    const body = sql.slice(bodyStart, bodyEnd);
    const signatureMatch = /\bfunction\s+([^\n]+?)\s+returns\b/i.exec(header);
    const signature = signatureMatch
      ? signatureMatch[1].replace(/\s+/g, " ").trim()
      : "未知函数";

    definitions.push({ body, header, signature, statement });
    createPattern.lastIndex = statementEnd + 1;
  }

  return definitions;
}

function extractSearchPathFromFunctionHeader(header) {
  const normalizedHeader = header.replace(/\s+/g, " ");
  const match = /\bset\s+"?search_path"?\s*(?:=|to)\s*(.+?)(?=\s+(?:as\s+\$|stable\b|immutable\b|volatile\b|strict\b|called\b|parallel\b|cost\b|rows\b|support\b|transform\b|leakproof\b|not\s+leakproof\b)|$)/i.exec(
    normalizedHeader,
  );
  return match?.[1]?.trim() ?? null;
}

function collectPublicObjects(sqlTexts) {
  const relations = new Set();
  const functions = new Set();

  for (const sql of sqlTexts) {
    const relationPattern =
      /\bcreate\s+(?:or\s+replace\s+)?(?:table|view|materialized\s+view)(?:\s+if\s+not\s+exists)?\s+(?:"?public"?\s*\.\s*)?"?([a-z_][a-z0-9_$]*)"?/gi;
    let match;
    while ((match = relationPattern.exec(sql)) !== null) {
      relations.add(match[1].toLowerCase());
    }

    const functionPattern =
      /\bcreate\s+(?:or\s+replace\s+)?function\s+(?:"?public"?\s*\.\s*)?"?([a-z_][a-z0-9_$]*)"?/gi;
    while ((match = functionPattern.exec(sql)) !== null) {
      functions.add(match[1].toLowerCase());
    }
  }

  return { functions, relations };
}

function findUnqualifiedApplicationReferences(body, publicObjects) {
  const errors = [];
  const relationReferencePattern =
    /\b(?:from|join|update|insert\s+into|delete\s+from)\s+(?:only\s+|lateral\s+)?((?:"?[a-z_][a-z0-9_$]*"?)(?:\s*\.\s*"?[a-z_][a-z0-9_$]*"?)?)/gi;
  let match;

  while ((match = relationReferencePattern.exec(body)) !== null) {
    const reference = match[1];
    if (reference.includes(".")) {
      continue;
    }

    const relation = normalizeIdentifier(reference);
    if (publicObjects.relations.has(relation)) {
      errors.push(`应用对象 ${reference} 未使用 public schema 限定。`);
    }
  }

  for (const functionName of publicObjects.functions) {
    const unqualifiedCallPattern = new RegExp(
      `(?<![\\w.\"])(?:\"${functionName}\"|${functionName})\\s*\\(`,
      "i",
    );
    if (unqualifiedCallPattern.test(body)) {
      errors.push(`应用函数 ${functionName}() 未使用 public schema 限定。`);
    }
  }

  return errors;
}

function findUnqualifiedExtensionReferences(body) {
  const errors = [];

  for (const functionName of PGCRYPTO_FUNCTIONS) {
    const callPattern = new RegExp(
      `(?<![\\w.\"])(?:\"${functionName}\"|${functionName})\\s*\\(`,
      "i",
    );
    if (callPattern.test(body)) {
      errors.push(`扩展函数 ${functionName}() 必须显式使用 extensions schema。`);
    }
  }

  return errors;
}

function analyzeFunctionDefinitions(sql, fileLabel, publicObjects) {
  const errors = [];

  for (const definition of extractFunctionDefinitions(sql)) {
    if (!/\bsecurity\s+definer\b/i.test(definition.header)) {
      continue;
    }

    const context = `${fileLabel} (${definition.signature})`;
    const searchPath = extractSearchPathFromFunctionHeader(definition.header);
    if (!searchPath) {
      errors.push(`${context}: SECURITY DEFINER 必须显式设置 search_path。`);
    } else {
      errors.push(...validateSearchPath(searchPath, context));
    }

    for (const message of findUnqualifiedApplicationReferences(
      definition.body,
      publicObjects,
    )) {
      errors.push(`${context}: ${message}`);
    }

    for (const message of findUnqualifiedExtensionReferences(definition.body)) {
      errors.push(`${context}: ${message}`);
    }
  }

  return errors;
}

function analyzeAlterFunctionStatements(sql, fileLabel) {
  const errors = [];
  const normalizedSql = stripSqlComments(sql);
  const searchPathPattern =
    /\balter\s+function\s+([\s\S]*?)\s+set\s+"?search_path"?\s*(?:=|to)\s*([^;]+);/gi;
  let match;

  while ((match = searchPathPattern.exec(normalizedSql)) !== null) {
    const signature = match[1].replace(/\s+/g, " ").trim();
    errors.push(
      ...validateSearchPath(match[2], `${fileLabel} (${signature})`),
    );
  }

  const securityDefinerPattern =
    /\balter\s+function\s+([\s\S]*?)\s+security\s+definer\s*;/gi;
  while ((match = securityDefinerPattern.exec(normalizedSql)) !== null) {
    const statement = match[0];
    if (!/\bset\s+"?search_path"?/i.test(statement)) {
      const signature = match[1].replace(/\s+/g, " ").trim();
      errors.push(
        `${fileLabel} (${signature}): ALTER FUNCTION 启用 SECURITY DEFINER 时必须同时提交安全 search_path 定义。`,
      );
    }
  }

  return errors;
}

function readSqlFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory)
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort()
    .map((fileName) => ({
      fileName,
      path: path.join(directory, fileName),
      sql: fs.readFileSync(path.join(directory, fileName), "utf8"),
    }));
}

export function analyzeRepository({ root, baseline = DEFAULT_BASELINE }) {
  const migrationsDirectory = path.join(root, "supabase", "migrations");
  const snapshotPath = path.join(
    root,
    "supabase",
    "schema_snapshot",
    "current_schema.sql",
  );
  const migrations = readSqlFiles(migrationsDirectory);
  const snapshotSql = fs.existsSync(snapshotPath)
    ? fs.readFileSync(snapshotPath, "utf8")
    : "";
  const publicObjects = collectPublicObjects([
    snapshotSql,
    ...migrations.map(({ sql }) => sql),
  ]);
  const errors = [];

  if (!snapshotSql) {
    errors.push(`未找到数据库结构快照：${snapshotPath}`);
  } else {
    errors.push(
      ...analyzeFunctionDefinitions(
        snapshotSql,
        "supabase/schema_snapshot/current_schema.sql",
        publicObjects,
      ),
    );
  }

  for (const migration of migrations) {
    if (migration.fileName < baseline) {
      continue;
    }

    const fileLabel = `supabase/migrations/${migration.fileName}`;
    errors.push(
      ...analyzeFunctionDefinitions(migration.sql, fileLabel, publicObjects),
      ...analyzeAlterFunctionStatements(migration.sql, fileLabel),
    );
  }

  return errors;
}

export function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  const errors = analyzeRepository(options);

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(error);
    }
    process.exitCode = 1;
    return;
  }

  console.log("SECURITY DEFINER search_path 静态检查通过。");
}

const isDirectExecution =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectExecution) {
  main();
}
