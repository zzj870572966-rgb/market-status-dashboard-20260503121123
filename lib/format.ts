export function formatNumber(
  value: number | null | undefined,
  options: Intl.NumberFormatOptions = {},
) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

export function formatSigned(value: number | null | undefined, suffix = "") {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "N/A";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${formatNumber(value)}${suffix}`;
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "N/A";
  }

  return `${formatSigned(value, "%")}`;
}

export function formatDate(date: string | null | undefined) {
  if (!date) {
    return "N/A";
  }

  return date;
}

export function statusFromChange(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "neutral" as const;
  }

  if (value > 0) {
    return "positive" as const;
  }

  if (value < 0) {
    return "danger" as const;
  }

  return "neutral" as const;
}

export function describePartialSources(
  sources: Record<string, { failed: string[]; partial: boolean; ok: boolean }>,
) {
  const failed = Object.entries(sources)
    .filter(([, status]) => status.failed.length > 0 || status.partial || !status.ok)
    .map(([name, status]) => `${name}: ${status.failed.join(", ") || "未更新"}`);

  return failed.join("；");
}
