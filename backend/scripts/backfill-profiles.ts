import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";
import { slugify, uniqueSlugFrom } from "../src/lib/slugify.js";

async function main() {
  const users = await prisma.user.findMany({ where: { profile: null } });
  console.log(`Found ${users.length} user(s) without a profile.`);

  for (const user of users) {
    const slug = await uniqueSlugFrom(slugify(user.name));
    await prisma.studentProfile.create({ data: { userId: user.id, slug } });
    console.log(`Created profile for ${user.name} <${user.email}> -> /p/${slug}`);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
