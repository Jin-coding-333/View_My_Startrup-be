import * as dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { PrismaClient } from '@prisma/client';
import orderByStartup from './orderByFunction.js';
import asyncHandler from './asyncHandlerFunction.js';
import paginationHandler from './paginationHandler.js';
// import { number } from 'superstruct';
// import { CreateUser, PatchUser } from './structs.js';
// import { assert } from 'superstruct';

const prisma = new PrismaClient();

const app = express();
app.use(express.json());

// BigInt 값을 문자열로 변환하여 JSON 응답 생성
const replacer = (key, value) => {
  return typeof value === 'bigint' ? value.toString() : value;
};

// 전체 기업 목록 조회
app.get('/api/startups', asyncHandler(async (req, res) => {
  const { offset = 0, limit = 10, order = 'id' } = req.query;
  // validation은 값이 들어오자마자 검사를 해야 큰 실수를 줄일 수 있음.
  const offsetNum = parseInt(offset);
  const limitNum = parseInt(limit);

  const orderBy = orderByStartup(order);
  const startups = await prisma.startup.findMany({
    orderBy,
    skip: offsetNum,
    take: limitNum,
  });

  const responseData = await paginationHandler(startups, offsetNum, limitNum);

  // BigInt 값을 문자열로 변환하여 JSON 응답 생성
  res.send(JSON.stringify(responseData, replacer));
}));

// 전체 기업 검색 기능
app.get("/api/startups/search", asyncHandler(async (req, res) => {
  const { keyword, offset = 0, limit = 10 } = req.query;
  const offsetNum = parseInt(offset);
  const limitNum = parseInt(limit);

  const startups = await prisma.startup.findMany({
    skip: offsetNum,
    take: limitNum,
    where: {
      OR: [
        { name: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
      ]
    },
  });
  res.send(JSON.stringify(startups, replacer));
}));

// 내 기업과 비교 대상 기업들 비교하기(정렬, /api/startups/comparsion)

/**
 * id와 같은 동적 url은 search 기능이 있는 라우터 위에 있으면,
 * search 기능 대시 작동하게 되므로 순서상 마지막에 두는 것이 좋다.
 * 동적 url이란 :id와 같이 파라미터가 들어가는 url을 말한다.
 * :id는 매우 포괄적인 패턴 매칭을 수행한다.
 * (특정 경로를 제외한 거의 모든 문자열을 포착함)
 * 따라서 좀 더 구체적인 라우터를 상단에 배치하고,
 * 좀 더 포괄적인 라우터를 하단에 배치하는 것이 좋다.
 */
// 특정 기업 상세 조회(GET: /api/startups/{startupsId})
app.get("/api/startups/:startupsId",
  asyncHandler(async (req, res) => {

    const { startupsId } = req.params;
    const idNum = parseInt(startupsId, 10);
    const startup = await prisma.startup.findUniqueOrThrow({
      where: { id: idNum },
    });
    res.send(JSON.stringify(startup, replacer));
  }));

// 특정 기업에 투자하기(POST: /api/investmentts/{investmentId})

// 투자 수정(PATCH: /api/investmentts/{investmentId})


// 프론트랑 겹치니깐 8000으로 바꿈.
const port = process.env.PORT || 8001;

app.listen(port, () => console.log(`Server Started :${port}`));
