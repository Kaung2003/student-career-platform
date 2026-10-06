// Promote an existing account to admin: npm run make-admin -- you@example.com
import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";

const email = process.argv[2]?.trim();

if (!email) {
  console.error("Usage: npm run make-admin -- <email>");
  process.exit(1);
}

const user = await prisma.user.findUnique({ where: { email } });

if (!user) {
  console.error(`No account found for ${email}. Sign up on the site first.`);
  process.exitCode = 1;
} else {
  await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN", suspended: false } });
  console.log(`${user.name} <${email}> is now an admin.`);
}

await prisma.$disconnect();
