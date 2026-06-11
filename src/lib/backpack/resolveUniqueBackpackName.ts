function splitNameAndExtension(name: string): { base: string; ext: string } {
  const lastDot = name.lastIndexOf(".");
  if (lastDot <= 0) {
    return { base: name, ext: "" };
  }
  return {
    base: name.slice(0, lastDot),
    ext: name.slice(lastDot),
  };
}

/**
 * Pick a backpack file name that does not collide with `existingNames`.
 * When `desiredName` is taken, appends `_01`, `_02`, … before the extension.
 */
export function resolveUniqueBackpackName(
  desiredName: string,
  existingNames: ReadonlySet<string> | readonly string[],
): string {
  const taken =
    existingNames instanceof Set ? existingNames : new Set(existingNames);

  if (!taken.has(desiredName)) {
    return desiredName;
  }

  const { base, ext } = splitNameAndExtension(desiredName);

  for (let counter = 1; counter < 10_000; counter += 1) {
    const suffix = String(counter).padStart(2, "0");
    const candidate = ext ? `${base}_${suffix}${ext}` : `${base}_${suffix}`;
    if (!taken.has(candidate)) {
      return candidate;
    }
  }

  return ext ? `${base}_${Date.now()}${ext}` : `${base}_${Date.now()}`;
}
