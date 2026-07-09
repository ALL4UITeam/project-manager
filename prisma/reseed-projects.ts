import { PrismaClient } from "@prisma/client";
import { mockProjects } from "../src/data/mock-data";

const prisma = new PrismaClient();

async function main() {
  const deleted = await prisma.project.deleteMany();
  console.log(`기존 프로젝트 ${deleted.count}건 삭제`);

  await prisma.project.createMany({
    data: mockProjects.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      pmName: p.pmName,
      startDate: p.startDate,
      endDate: p.endDate,
      status: p.status,
      assigneePrimary: p.assigneePrimary,
      assigneeSecondary: p.assigneeSecondary ?? null,
      scheduleShareToken: p.scheduleShareToken ?? null,
      scheduleLinkShareEnabled: p.scheduleLinkShareEnabled ?? false,
      isSupportProject: p.isSupportProject ?? false,
      allocatedMdPlanning: p.allocatedMd.기획,
      allocatedMdDesign: p.allocatedMd.디자인,
      allocatedMdPublishing: p.allocatedMd.퍼블리싱,
      allocatedMdOther: p.allocatedMd.기타,
    })),
  });

  const count = await prisma.project.count();
  console.log(`프로젝트 ${count}건 등록 완료`);
  mockProjects.forEach((p, i) => {
    console.log(`${i + 1}. ${p.code} ${p.name}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
