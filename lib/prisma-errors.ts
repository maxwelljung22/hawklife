import { Prisma } from "@prisma/client";

export function isPrismaMissingColumnError(error: unknown, columnPrefix?: string) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code !== "P2022") return false;

  const column = String(error.meta?.column ?? "");
  return columnPrefix ? column.startsWith(columnPrefix) : true;
}

export function isPrismaSchemaMismatchError(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  return error.code === "P2021" || error.code === "P2022";
}
