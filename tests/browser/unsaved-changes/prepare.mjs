import { realpath, symlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const source = fileURLToPath(new URL("../../../public", import.meta.url));
const destination = fileURLToPath(new URL("./public", import.meta.url));
try {
  await symlink(source, destination, "junction");
} catch (error) {
  if (
    error.code !== "EEXIST" ||
    (await realpath(destination)) !== (await realpath(source))
  )
    throw error;
}
