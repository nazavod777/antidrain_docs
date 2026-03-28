export function readCliOption(args, name, fallbackValue) {
  const optionIndex = args.lastIndexOf(name);

  if (optionIndex === -1) {
    return fallbackValue;
  }

  const nextValue = args[optionIndex + 1];

  if (!nextValue || nextValue.startsWith("--")) {
    return fallbackValue;
  }

  return nextValue;
}

export function readServerCliOptions(args = process.argv.slice(2)) {
  return {
    host: readCliOption(args, "--host", "127.0.0.1"),
    port: Number.parseInt(readCliOption(args, "--port", "4175"), 10)
  };
}
