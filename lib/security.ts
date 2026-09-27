export const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE = 10_000;
const MAX_PAGE_SIZE = 50;

const normalize = (value: number | undefined, fallback: number, max: number) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;

  const truncated = Math.trunc(value);

  if (truncated < 1) return fallback;

  return Math.min(truncated, max);
};

export const clampPagination = ({
  page,
  pageSize,
}: {
  page?: number;
  pageSize?: number;
}) => ({
  page: normalize(page, DEFAULT_PAGE, MAX_PAGE),
  pageSize: normalize(pageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
});

export const safePath = (path?: string) => {
  if (typeof path !== "string") return "/";
  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
};
