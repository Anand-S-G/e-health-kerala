import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const hospitals = [
  { name: 'Amrita Institute of Medical Sciences', code: 'HOSP001', address: 'Kochi', phone: '0484 285 1234' },
  { name: 'Aster Medcity', code: 'HOSP002', address: 'Kochi', phone: '0484 669 9999' },
  { name: 'Rajagiri Hospital', code: 'HOSP003', address: 'Kochi', phone: '0484 290 5000' },
  { name: 'KIMS Health', code: 'HOSP004', address: 'Trivandrum', phone: '0471 295 2222' },
  { name: 'Baby Memorial Hospital', code: 'HOSP005', address: 'Kozhikode', phone: '0495 272 3272' },
  { name: 'Lisie Hospital', code: 'HOSP006', address: 'Kochi', phone: '0484 240 2044' },
  { name: 'Medical Trust Hospital', code: 'HOSP007', address: 'Kochi', phone: '0484 235 8001' },
  { name: 'Sree Chitra Tirunal Institute', code: 'HOSP008', address: 'Trivandrum', phone: '0471 244 3152' },
  { name: 'Caritas Hospital', code: 'HOSP009', address: 'Kottayam', phone: '0481 279 0025' },
  { name: 'Renai Medicity', code: 'HOSP010', address: 'Kochi', phone: '0484 288 0000' },
];

async function main() {
  console.log('Seeding hospitals...');
  for (const h of hospitals) {
    // Create a user for the hospital first
    const email = `admin@${h.code.toLowerCase()}.com`;
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: `${h.name} Admin`,
          email: email,
          role: 'HOSPITAL',
        },
      });
    }

    // Create the hospital profile
    const existingHospital = await prisma.hospital.findUnique({ where: { code: h.code } });
    if (!existingHospital) {
      await prisma.hospital.create({
        data: {
          code: h.code,
          name: h.name,
          address: h.address,
          phone: h.phone,
          userId: user.id,
        },
      });
    }
  }
  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
