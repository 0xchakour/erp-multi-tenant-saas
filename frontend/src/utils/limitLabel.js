export function limitLabel(limit) {
  if (limit === null || limit >= 9999) {
    return "Unlimited";
  }

  return String(limit);
}
