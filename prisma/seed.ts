import { PrismaClient, VisaType, DocumentType, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Crear Proveedores de Autenticación
  console.log('Seed: Creando AuthProviders...');
  await prisma.authProvider.upsert({
    where: { name: 'LDAP_CITIZEN' },
    update: {},
    create: { name: 'LDAP_CITIZEN', host: 'localhost:389' },
  });

  await prisma.authProvider.upsert({
    where: { name: 'LDAP_INTERNAL' },
    update: {},
    create: { name: 'LDAP_INTERNAL', host: 'localhost:390' },
  });

  // 2. Configuración para Visa de TURISTA (Requiere Pasaporte y Soporte)
  console.log('Seed: Configurando Visa de TURISTA...');
  await prisma.visaTypeConfig.upsert({
    where: { visaType: VisaType.TURISTA },
    update: {},
    create: {
      visaType: VisaType.TURISTA,
      name: 'Visa de Turismo Tradicional',
      arancelAmount: 60.0,
      requirements: {
        create: [
          { documentType: DocumentType.PASSPORT, isRequired: true, description: 'Copia digital del pasaporte vigente' },
          { documentType: DocumentType.SUPPORTING_DOC, isRequired: true, description: 'Reserva de hotel o carta de invitación' },
        ],
      },
      workflowSteps: {
        create: [
          { stepOrder: 1, roleRequired: UserRole.OFFICER },
          { stepOrder: 2, roleRequired: UserRole.COORDINATOR },
          { stepOrder: 3, roleRequired: UserRole.DIRECTOR_GENERAL },
        ],
      },
    },
  });

  // 3. Configuración para Visa de CORTESIA (Flujo rápido, solo Pasaporte)
  console.log('Seed: Configurando Visa de CORTESIA...');
  await prisma.visaTypeConfig.upsert({
    where: { visaType: VisaType.CORTESIA },
    update: {},
    create: {
      visaType: VisaType.CORTESIA,
      name: 'Visa de Cortesía Diplomática',
      arancelAmount: 0.0,
      requirements: {
        create: [
          { documentType: DocumentType.PASSPORT, isRequired: true, description: 'Copia del pasaporte' },
        ],
      },
      workflowSteps: {
        create: [
          { stepOrder: 1, roleRequired: UserRole.OFFICER },
          { stepOrder: 2, roleRequired: UserRole.DIRECTOR_GENERAL },
        ],
      },
    },
  });

  console.log('Seed finalizado con éxito.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });