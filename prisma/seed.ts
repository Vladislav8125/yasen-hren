import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { archetypes } from "./seed-data";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(`Seeding ${archetypes.length} archetypes...`);

  // Первый проход: upsert всех карт по имени, без связи lightAlly
  // (союзник может быть ещё не создан на этот момент).
  for (const card of archetypes) {
    await prisma.archetype.upsert({
      where: { name: card.name },
      create: {
        family: card.family,
        name: card.name,
        tagline: card.tagline,
        property: card.property,
        archetypeType: card.archetypeType,
        essence: card.essence,
        function: card.function,
        inLife: card.inLife,
        ritual: card.ritual,
        cardQuestion: card.cardQuestion,
        clinicalFlag: card.clinicalFlag,
        branch: card.branch,
        shadowSide: card.shadowSide,
        lightAllyName: card.lightAllyName,
        pathFunctions: card.pathFunctions,
        pathResources: card.pathResources,
        pathRituals: card.pathRituals,
        pathShadows: card.pathShadows,
        pathMotto: card.pathMotto,
        pathManifestations: card.pathManifestations,
        imageUrl: `/cards/${card.slug}.png`,
        spheres: card.spheres ?? [],
      },
      update: {
        family: card.family,
        tagline: card.tagline,
        property: card.property,
        archetypeType: card.archetypeType,
        essence: card.essence,
        function: card.function,
        inLife: card.inLife,
        ritual: card.ritual,
        cardQuestion: card.cardQuestion,
        clinicalFlag: card.clinicalFlag,
        branch: card.branch,
        shadowSide: card.shadowSide,
        lightAllyName: card.lightAllyName,
        pathFunctions: card.pathFunctions,
        pathResources: card.pathResources,
        pathRituals: card.pathRituals,
        pathShadows: card.pathShadows,
        pathMotto: card.pathMotto,
        pathManifestations: card.pathManifestations,
        imageUrl: `/cards/${card.slug}.png`,
        spheres: { set: card.spheres ?? [] },
      },
    });
  }

  // Второй проход: резолвим lightAllyName -> lightAllyId по имени.
  // Имена карт в базе хранятся ЗАГЛАВНЫМИ (как на физической карте), а
  // lightAllyName в seed-data.ts написаны в смешанном регистре для
  // читаемости — сравниваем без учёта регистра.
  const byName = new Map(
    (await prisma.archetype.findMany({ select: { id: true, name: true } })).map((a) => [
      a.name.toUpperCase(),
      a.id,
    ]),
  );

  let linked = 0;
  for (const card of archetypes) {
    if (!card.lightAllyName) continue;
    const allyId = byName.get(card.lightAllyName.toUpperCase());
    if (!allyId) {
      console.warn(`  ! союзник "${card.lightAllyName}" для "${card.name}" не найден — пропущено`);
      continue;
    }
    await prisma.archetype.update({
      where: { name: card.name },
      data: { lightAllyId: allyId },
    });
    linked++;
  }

  const total = await prisma.archetype.count();
  console.log(`Готово: ${total} карт в базе, ${linked} связей с союзником проставлено.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
