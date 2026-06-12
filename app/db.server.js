import { PrismaClient } from "@prisma/client";

/* eslint-disable no-undef */

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prismaGlobal ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaGlobal = prisma;
}

export default prisma;
