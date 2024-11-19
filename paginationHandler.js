import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const paginationHandler = async (startups, limitNum) => {
  console.log(limitNum);
  const totalStartups = await prisma.startup.count();
  const totalPages = Math.ceil(totalStartups / limitNum);
  const responseData = { totalStartups, startups, totalPages };
  return responseData;
}

export default paginationHandler;