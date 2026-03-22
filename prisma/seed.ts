import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('demo123', 10);

  // Create demo organization
  const organization = await prisma.organization.upsert({
    where: { id: 'demo-org' },
    update: {},
    create: {
      id: 'demo-org',
      name: 'MaatWork Demo',
      slug: 'maatwork-demo',
    },
  });

  console.log('Created organization:', organization.id);

  // Create main admin user (gio/admin123)
  const adminUser = await prisma.user.upsert({
    where: { email: 'gio' },
    update: {
      password: adminPassword,
      isActive: true,
    },
    create: {
      id: 'user-gio',
      email: 'gio@maatwork.com',
      username: 'gio',
      name: 'Giovanni Admin',
      password: adminPassword,
      role: 'dueno',
      isActive: true,
      emailVerified: new Date(),
    },
  });

  console.log('Created admin user:', adminUser.username);

  // Create demo users with passwords
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'ana.garcia@demo.com' },
      update: {
        password: userPassword,
      },
      create: {
        id: 'user-ana',
        email: 'ana.garcia@demo.com',
        username: 'ana',
        name: 'Ana García',
        password: userPassword,
        role: 'advisor',
        isActive: true,
        emailVerified: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { email: 'pedro.ruiz@demo.com' },
      update: {
        password: userPassword,
      },
      create: {
        id: 'user-pedro',
        email: 'pedro.ruiz@demo.com',
        username: 'pedro',
        name: 'Pedro Ruiz',
        password: userPassword,
        role: 'advisor',
        isActive: true,
        emailVerified: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { email: 'juan.demo@demo.com' },
      update: {
        password: userPassword,
      },
      create: {
        id: 'user-juan',
        email: 'juan.demo@demo.com',
        username: 'juan',
        name: 'Juan Demo',
        password: userPassword,
        role: 'manager',
        isActive: true,
        emailVerified: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { email: 'maria.lopez@demo.com' },
      update: {
        password: userPassword,
      },
      create: {
        id: 'user-maria',
        email: 'maria.lopez@demo.com',
        username: 'maria',
        name: 'María López',
        password: userPassword,
        role: 'advisor',
        isActive: true,
        emailVerified: new Date(),
      },
    }),
  ]);

  console.log('Created users:', users.length + 1);

  // Create members for the organization
  // Admin user as owner
  await prisma.member.upsert({
    where: { id: 'member-user-gio' },
    update: {},
    create: {
      id: 'member-user-gio',
      userId: adminUser.id,
      organizationId: organization.id,
      role: 'owner',
    },
  });

  for (const user of users) {
    await prisma.member.upsert({
      where: { id: `member-${user.id}` },
      update: {},
      create: {
        id: `member-${user.id}`,
        userId: user.id,
        organizationId: organization.id,
        role: user.role === 'manager' ? 'admin' : 'member',
      },
    });
  }

  console.log('Created members');

  // Create pipeline stages
  const stages = await Promise.all([
    prisma.pipelineStage.upsert({
      where: { id: 'stage-prospecto' },
      update: {},
      create: {
        id: 'stage-prospecto',
        organizationId: organization.id,
        name: 'Prospecto',
        color: '#6366f1',
        order: 1,
        isDefault: true,
      },
    }),
    prisma.pipelineStage.upsert({
      where: { id: 'stage-contactado' },
      update: {},
      create: {
        id: 'stage-contactado',
        organizationId: organization.id,
        name: 'Contactado',
        color: '#8b5cf6',
        wipLimit: 10,
        order: 2,
      },
    }),
    prisma.pipelineStage.upsert({
      where: { id: 'stage-primera-reunion' },
      update: {},
      create: {
        id: 'stage-primera-reunion',
        organizationId: organization.id,
        name: 'Primera reunión',
        color: '#f59e0b',
        wipLimit: 8,
        order: 3,
      },
    }),
    prisma.pipelineStage.upsert({
      where: { id: 'stage-segunda-reunion' },
      update: {},
      create: {
        id: 'stage-segunda-reunion',
        organizationId: organization.id,
        name: 'Segunda reunión',
        color: '#3b82f6',
        wipLimit: 5,
        order: 4,
      },
    }),
    prisma.pipelineStage.upsert({
      where: { id: 'stage-apertura' },
      update: {},
      create: {
        id: 'stage-apertura',
        organizationId: organization.id,
        name: 'Apertura',
        color: '#10b981',
        order: 5,
      },
    }),
    prisma.pipelineStage.upsert({
      where: { id: 'stage-cliente' },
      update: {},
      create: {
        id: 'stage-cliente',
        organizationId: organization.id,
        name: 'Cliente',
        color: '#22c55e',
        order: 6,
      },
    }),
    prisma.pipelineStage.upsert({
      where: { id: 'stage-caido' },
      update: {},
      create: {
        id: 'stage-caido',
        organizationId: organization.id,
        name: 'Caído',
        color: '#ef4444',
        order: 7,
      },
    }),
    prisma.pipelineStage.upsert({
      where: { id: 'stage-cuenta-vacia' },
      update: {},
      create: {
        id: 'stage-cuenta-vacia',
        organizationId: organization.id,
        name: 'Cuenta vacía',
        color: '#f97316',
        order: 8,
      },
    }),
  ]);

  console.log('Created stages:', stages.length);

  // Create contacts
  const contacts = await Promise.all([
    prisma.contact.upsert({
      where: { id: 'contact-maria' },
      update: {},
      create: {
        id: 'contact-maria',
        organizationId: organization.id,
        name: 'María López',
        email: 'maria.lopez@email.com',
        company: 'TechCorp',
        emoji: '👩‍💼',
        segment: 'Premium',
        source: 'Referido',
        pipelineStageId: 'stage-primera-reunion',
      },
    }),
    prisma.contact.upsert({
      where: { id: 'contact-juan' },
      update: {},
      create: {
        id: 'contact-juan',
        organizationId: organization.id,
        name: 'Juan Martínez',
        email: 'juan.martinez@email.com',
        company: 'Inversiones MX',
        emoji: '👨‍💻',
        segment: 'Corporativo',
        source: 'Evento',
        pipelineStageId: 'stage-segunda-reunion',
      },
    }),
    prisma.contact.upsert({
      where: { id: 'contact-lucia' },
      update: {},
      create: {
        id: 'contact-lucia',
        organizationId: organization.id,
        name: 'Lucía Fernández',
        email: 'lucia.fernandez@email.com',
        emoji: '👩‍🎓',
        segment: 'Estándar',
        source: 'Website',
        pipelineStageId: 'stage-prospecto',
      },
    }),
    prisma.contact.upsert({
      where: { id: 'contact-roberto' },
      update: {},
      create: {
        id: 'contact-roberto',
        organizationId: organization.id,
        name: 'Roberto Sánchez',
        email: 'roberto.sanchez@email.com',
        company: 'Global Solutions',
        emoji: '👨‍💼',
        segment: 'Premium',
        source: 'Referido',
        pipelineStageId: 'stage-contactado',
      },
    }),
    prisma.contact.upsert({
      where: { id: 'contact-carlos' },
      update: {},
      create: {
        id: 'contact-carlos',
        organizationId: organization.id,
        name: 'Carlos Mendoza',
        email: 'carlos.mendoza@email.com',
        company: 'Mendoza Industries',
        emoji: '👨‍🔧',
        segment: 'Corporativo',
        source: 'Referido',
        pipelineStageId: 'stage-apertura',
      },
    }),
    prisma.contact.upsert({
      where: { id: 'contact-sofia' },
      update: {},
      create: {
        id: 'contact-sofia',
        organizationId: organization.id,
        name: 'Sofía Ramírez',
        email: 'sofia.ramirez@email.com',
        company: 'Ramírez & Asociados',
        emoji: '👩‍⚖️',
        segment: 'Premium',
        source: 'Evento',
        pipelineStageId: 'stage-cliente',
      },
    }),
  ]);

  console.log('Created contacts:', contacts.length);

  // Create default product/service tags
  const tags = await Promise.all([
    prisma.tag.upsert({ where: { id: 'tag-balanz' }, update: {}, create: { id: 'tag-balanz', organizationId: organization.id, name: 'Balanz', color: '#F59E0B' } }),
    prisma.tag.upsert({ where: { id: 'tag-crypto' }, update: {}, create: { id: 'tag-crypto', organizationId: organization.id, name: 'Crypto', color: '#f97316' } }),
    prisma.tag.upsert({ where: { id: 'tag-impact' }, update: {}, create: { id: 'tag-impact', organizationId: organization.id, name: 'Impact', color: '#0077FF' } }),
    prisma.tag.upsert({ where: { id: 'tag-invest' }, update: {}, create: { id: 'tag-invest', organizationId: organization.id, name: 'Invest', color: '#0055CC' } }),
    prisma.tag.upsert({ where: { id: 'tag-investors-trust' }, update: {}, create: { id: 'tag-investors-trust', organizationId: organization.id, name: 'InvestorsTrust', color: '#10B981' } }),
    prisma.tag.upsert({ where: { id: 'tag-options' }, update: {}, create: { id: 'tag-options', organizationId: organization.id, name: 'Options', color: '#003399' } }),
    prisma.tag.upsert({ where: { id: 'tag-patrimonial' }, update: {}, create: { id: 'tag-patrimonial', organizationId: organization.id, name: 'Patrimonial', color: '#6B7280' } }),
  ]);

  console.log('Created tags:', tags.length);

  // Create ContactTags (associate contacts with tags as products)
  await Promise.all([
    prisma.contactTag.upsert({ where: { id: 'ct-1' }, update: {}, create: { id: 'ct-1', contactId: 'contact-maria', tagId: 'tag-options' } }),
    prisma.contactTag.upsert({ where: { id: 'ct-2' }, update: {}, create: { id: 'ct-2', contactId: 'contact-juan', tagId: 'tag-invest' } }),
    prisma.contactTag.upsert({ where: { id: 'ct-3' }, update: {}, create: { id: 'ct-3', contactId: 'contact-lucia', tagId: 'tag-crypto' } }),
    prisma.contactTag.upsert({ where: { id: 'ct-4' }, update: {}, create: { id: 'ct-4', contactId: 'contact-roberto', tagId: 'tag-balanz' } }),
    prisma.contactTag.upsert({ where: { id: 'ct-5' }, update: {}, create: { id: 'ct-5', contactId: 'contact-carlos', tagId: 'tag-invest' } }),
    prisma.contactTag.upsert({ where: { id: 'ct-6' }, update: {}, create: { id: 'ct-6', contactId: 'contact-sofia', tagId: 'tag-patrimonial' } }),
  ]);

  console.log('Created contact tags');

  // Create deals
  const deals = await Promise.all([
    prisma.deal.upsert({
      where: { id: 'deal-1' },
      update: {},
      create: {
        id: 'deal-1',
        organizationId: organization.id,
        contactId: 'contact-maria',
        stageId: 'stage-apertura',
        title: 'Plan integral María López',
        value: 150000,
        probability: 100,
        expectedCloseDate: new Date('2025-02-28'),
        assignedTo: 'user-ana',
      },
    }),
    prisma.deal.upsert({
      where: { id: 'deal-2' },
      update: {},
      create: {
        id: 'deal-2',
        organizationId: organization.id,
        contactId: 'contact-juan',
        stageId: 'stage-segunda-reunion',
        title: 'Asesoría Juan Martínez',
        value: 80000,
        probability: 60,
        expectedCloseDate: new Date('2025-03-10'),
        assignedTo: 'user-pedro',
      },
    }),
    prisma.deal.upsert({
      where: { id: 'deal-3' },
      update: {},
      create: {
        id: 'deal-3',
        organizationId: organization.id,
        contactId: 'contact-lucia',
        stageId: 'stage-prospecto',
        title: 'Consulta inicial Lucía',
        value: 50000,
        probability: 20,
        expectedCloseDate: new Date('2025-03-15'),
        assignedTo: 'user-ana',
      },
    }),
    prisma.deal.upsert({
      where: { id: 'deal-4' },
      update: {},
      create: {
        id: 'deal-4',
        organizationId: organization.id,
        contactId: 'contact-roberto',
        stageId: 'stage-primera-reunion',
        title: 'Plan corporativo Sánchez',
        value: 300000,
        probability: 75,
        expectedCloseDate: new Date('2025-03-20'),
        assignedTo: 'user-juan',
      },
    }),
    prisma.deal.upsert({
      where: { id: 'deal-5' },
      update: {},
      create: {
        id: 'deal-5',
        organizationId: organization.id,
        contactId: 'contact-carlos',
        stageId: 'stage-apertura',
        title: 'Expansión Mendoza Industries',
        value: 500000,
        probability: 90,
        expectedCloseDate: new Date('2025-02-15'),
        assignedTo: 'user-gio',
      },
    }),
    prisma.deal.upsert({
      where: { id: 'deal-6' },
      update: {},
      create: {
        id: 'deal-6',
        organizationId: organization.id,
        contactId: 'contact-sofia',
        stageId: 'stage-cliente',
        title: 'Servicios legales Ramírez',
        value: 200000,
        probability: 100,
        expectedCloseDate: new Date('2025-01-15'),
        assignedTo: 'user-maria',
      },
    }),
  ]);

  console.log('Created deals:', deals.length);

  // Create tasks
  const tasks = await Promise.all([
    prisma.task.upsert({
      where: { id: 'task-1' },
      update: {},
      create: {
        id: 'task-1',
        organizationId: organization.id,
        title: 'Llamar a María López',
        description: 'Seguimiento post-reunión',
        status: 'pending',
        priority: 'high',
        dueDate: new Date(),
        assignedTo: 'user-ana',
        contactId: 'contact-maria',
      },
    }),
    prisma.task.upsert({
      where: { id: 'task-2' },
      update: {},
      create: {
        id: 'task-2',
        organizationId: organization.id,
        title: 'Enviar propuesta a Juan',
        description: 'Incluye análisis de inversión',
        status: 'in_progress',
        priority: 'urgent',
        dueDate: new Date(),
        assignedTo: 'user-pedro',
        contactId: 'contact-juan',
      },
    }),
    prisma.task.upsert({
      where: { id: 'task-3' },
      update: {},
      create: {
        id: 'task-3',
        organizationId: organization.id,
        title: 'Agendar cita con Roberto',
        description: 'Primera reunión de presentación',
        status: 'pending',
        priority: 'medium',
        dueDate: new Date(Date.now() + 86400000), // Tomorrow
        assignedTo: 'user-juan',
        contactId: 'contact-roberto',
      },
    }),
    prisma.task.upsert({
      where: { id: 'task-4' },
      update: {},
      create: {
        id: 'task-4',
        organizationId: organization.id,
        title: 'Revisar documentación Carlos',
        description: 'Documentos de la empresa para KYC',
        status: 'pending',
        priority: 'high',
        dueDate: new Date(Date.now() + 172800000), // Day after tomorrow
        assignedTo: 'user-gio',
        contactId: 'contact-carlos',
      },
    }),
  ]);

  console.log('Created tasks:', tasks.length);

  // Create a team
  const team = await prisma.team.upsert({
    where: { id: 'team-ventas' },
    update: {},
    create: {
      id: 'team-ventas',
      organizationId: organization.id,
      name: 'Equipo de Ventas',
      description: 'Equipo principal de asesores',
      leaderId: 'user-gio',
    },
  });

  console.log('Created team:', team.name);

  // Add team members
  await prisma.teamMember.upsert({
    where: { id: 'team-member-ana' },
    update: {},
    create: {
      id: 'team-member-ana',
      teamId: 'team-ventas',
      userId: 'user-ana',
      role: 'member',
    },
  });

  await prisma.teamMember.upsert({
    where: { id: 'team-member-pedro' },
    update: {},
    create: {
      id: 'team-member-pedro',
      teamId: 'team-ventas',
      userId: 'user-pedro',
      role: 'member',
    },
  });

  await prisma.teamMember.upsert({
    where: { id: 'team-member-maria' },
    update: {},
    create: {
      id: 'team-member-maria',
      teamId: 'team-ventas',
      userId: 'user-maria',
      role: 'member',
    },
  });

  // Create team goals for current month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  await prisma.teamGoal.upsert({
    where: { id: 'goal-aum' },
    update: {},
    create: {
      id: 'goal-aum',
      teamId: 'team-ventas',
      title: 'Nuevos AUM',
      description: 'Activos bajo manejo nuevos para el mes',
      type: 'new_aum',
      targetValue: 1000000,
      currentValue: 650000,
      unit: 'currency',
      period: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`,
      month: currentMonth,
      year: currentYear,
      status: 'active',
    },
  });

  await prisma.teamGoal.upsert({
    where: { id: 'goal-meetings' },
    update: {},
    create: {
      id: 'goal-meetings',
      teamId: 'team-ventas',
      title: 'Reuniones Realizadas',
      description: 'Número de reuniones del mes',
      type: 'meetings',
      targetValue: 40,
      currentValue: 28,
      unit: 'count',
      period: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`,
      month: currentMonth,
      year: currentYear,
      status: 'active',
    },
  });

  await prisma.teamGoal.upsert({
    where: { id: 'goal-clients' },
    update: {},
    create: {
      id: 'goal-clients',
      teamId: 'team-ventas',
      title: 'Nuevos Clientes',
      description: 'Clientes nuevos del mes',
      type: 'new_clients',
      targetValue: 10,
      currentValue: 6,
      unit: 'count',
      period: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`,
      month: currentMonth,
      year: currentYear,
      status: 'active',
    },
  });

  console.log('Created team goals');

  // Create calendar events
  await prisma.calendarEvent.upsert({
    where: { id: 'event-1' },
    update: {},
    create: {
      id: 'event-1',
      organizationId: organization.id,
      title: 'Reunión con María López',
      description: 'Presentación de propuesta de inversión',
      startAt: new Date(Date.now() + 3600000), // 1 hour from now
      endAt: new Date(Date.now() + 7200000), // 2 hours from now
      type: 'meeting',
      location: 'Oficina Principal',
      createdBy: 'user-ana',
      teamId: 'team-ventas',
    },
  });

  await prisma.calendarEvent.upsert({
    where: { id: 'event-2' },
    update: {},
    create: {
      id: 'event-2',
      organizationId: organization.id,
      title: 'Llamada Juan Martínez',
      description: 'Seguimiento propuesta',
      startAt: new Date(Date.now() + 14400000), // 4 hours from now
      endAt: new Date(Date.now() + 18000000), // 5 hours from now
      type: 'call',
      createdBy: 'user-pedro',
    },
  });

  await prisma.calendarEvent.upsert({
    where: { id: 'event-3' },
    update: {},
    create: {
      id: 'event-3',
      organizationId: organization.id,
      title: 'Junta de equipo semanal',
      description: 'Revisión de metas y pipeline',
      startAt: new Date(Date.now() + 86400000), // Tomorrow
      endAt: new Date(Date.now() + 90000000),
      type: 'meeting',
      location: 'Sala de juntas',
      createdBy: 'user-gio',
      teamId: 'team-ventas',
    },
  });

  console.log('Created calendar events');

  // Create some notes
  await prisma.note.upsert({
    where: { id: 'note-1' },
    update: {},
    create: {
      id: 'note-1',
      organizationId: organization.id,
      entityType: 'contact',
      entityId: 'contact-maria',
      content: 'Interesada en diversificar portafolio. Tiene experiencia en inversiones previas.',
      authorId: 'user-ana',
    },
  });

  await prisma.note.upsert({
    where: { id: 'note-2' },
    update: {},
    create: {
      id: 'note-2',
      organizationId: organization.id,
      entityType: 'deal',
      entityId: 'deal-4',
      content: 'El cliente quiere una propuesta para el Q2. Posible upselling.',
      authorId: 'user-juan',
    },
  });

  console.log('Created notes');

  console.log('\n✅ Seed completed successfully!');
  console.log('\n📋 Login credentials:');
  console.log('   Admin: gio / admin123 (username: gio)');
  console.log('   Ana: ana / demo123 (username: ana)');
  console.log('   Pedro: pedro / demo123 (username: pedro)');
  console.log('   Juan: juan / demo123 (username: juan)');
  console.log('   Maria: maria / demo123 (username: maria)');
  console.log('\n   You can login with: username, email, or full name');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
