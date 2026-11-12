import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'gustavo.teste@yme.pt';
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    await prisma.user.delete({ where: { id: user.id } });
    console.log(`✅ Conta de teste ${email} apagada com sucesso!`);
  } else {
    console.log(`ℹ️ Conta ${email} já não existia.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
