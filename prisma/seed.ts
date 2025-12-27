/**
 * Database Seed Script for GearGuard
 * Creates initial users, teams, equipment, and sample maintenance requests
 * 
 * Run with: npm run db:seed
 */

import { PrismaClient, UserRole, EquipmentCategory, EquipmentStatus, RequestType, RequestStatus, RequestPriority } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clear existing data (in reverse order of dependencies)
  console.log('🗑️  Clearing existing data...');
  await prisma.requestLog.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.maintenanceTeam.deleteMany();
  await prisma.user.deleteMany();

  // ==========================================================================
  // CREATE USERS
  // ==========================================================================
  console.log('👤 Creating users...');
  
  const passwordHash = await hash('password123', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@gearguard.com',
      password: passwordHash,
      name: 'System Administrator',
      role: UserRole.ADMIN,
      department: 'IT',
      phone: '+1-555-0100',
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@gearguard.com',
      password: passwordHash,
      name: 'John Manager',
      role: UserRole.MANAGER,
      department: 'Operations',
      phone: '+1-555-0101',
    },
  });

  const tech1 = await prisma.user.create({
    data: {
      email: 'tech1@gearguard.com',
      password: passwordHash,
      name: 'Mike Mechanic',
      role: UserRole.TECHNICIAN,
      department: 'Maintenance',
      phone: '+1-555-0102',
    },
  });

  const tech2 = await prisma.user.create({
    data: {
      email: 'tech2@gearguard.com',
      password: passwordHash,
      name: 'Sarah Sparks',
      role: UserRole.TECHNICIAN,
      department: 'Maintenance',
      phone: '+1-555-0103',
    },
  });

  const tech3 = await prisma.user.create({
    data: {
      email: 'tech3@gearguard.com',
      password: passwordHash,
      name: 'Tom Technician',
      role: UserRole.TECHNICIAN,
      department: 'Maintenance',
      phone: '+1-555-0104',
    },
  });

  const requester1 = await prisma.user.create({
    data: {
      email: 'requester@gearguard.com',
      password: passwordHash,
      name: 'Emily Employee',
      role: UserRole.REQUESTER,
      department: 'Production',
      phone: '+1-555-0105',
    },
  });

  const requester2 = await prisma.user.create({
    data: {
      email: 'user@gearguard.com',
      password: passwordHash,
      name: 'David Desk',
      role: UserRole.REQUESTER,
      department: 'Sales',
      phone: '+1-555-0106',
    },
  });

  console.log(`   ✓ Created ${7} users`);

  // ==========================================================================
  // CREATE MAINTENANCE TEAMS
  // ==========================================================================
  console.log('👥 Creating maintenance teams...');

  const mechanicalTeam = await prisma.maintenanceTeam.create({
    data: {
      name: 'Mechanical Team',
      description: 'Handles all mechanical and machinery maintenance',
      color: '#ef4444',
    },
  });

  const electricalTeam = await prisma.maintenanceTeam.create({
    data: {
      name: 'Electrical Team',
      description: 'Handles electrical systems and IT equipment',
      color: '#f59e0b',
    },
  });

  const hvacTeam = await prisma.maintenanceTeam.create({
    data: {
      name: 'HVAC Team',
      description: 'Handles heating, ventilation, and air conditioning',
      color: '#3b82f6',
    },
  });

  const generalTeam = await prisma.maintenanceTeam.create({
    data: {
      name: 'General Maintenance',
      description: 'Handles general maintenance and miscellaneous tasks',
      color: '#10b981',
    },
  });

  console.log(`   ✓ Created ${4} teams`);

  // ==========================================================================
  // ASSIGN TEAM MEMBERS
  // ==========================================================================
  console.log('🔗 Assigning team members...');

  // Mike is in Mechanical and General teams, leads Mechanical
  await prisma.teamMember.create({
    data: { userId: tech1.id, teamId: mechanicalTeam.id, isLeader: true },
  });
  await prisma.teamMember.create({
    data: { userId: tech1.id, teamId: generalTeam.id },
  });

  // Sarah is in Electrical team, leads it
  await prisma.teamMember.create({
    data: { userId: tech2.id, teamId: electricalTeam.id, isLeader: true },
  });

  // Tom is in HVAC and General teams
  await prisma.teamMember.create({
    data: { userId: tech3.id, teamId: hvacTeam.id, isLeader: true },
  });
  await prisma.teamMember.create({
    data: { userId: tech3.id, teamId: generalTeam.id },
  });

  console.log(`   ✓ Created team assignments`);

  // ==========================================================================
  // CREATE EQUIPMENT
  // ==========================================================================
  console.log('🔧 Creating equipment...');

  const equipment1 = await prisma.equipment.create({
    data: {
      name: 'CNC Milling Machine',
      serialNumber: 'CNC-2024-001',
      category: EquipmentCategory.MACHINERY,
      department: 'Production',
      description: 'High-precision 5-axis CNC milling machine',
      manufacturer: 'Haas Automation',
      model: 'VF-4SS',
      purchaseDate: new Date('2022-03-15'),
      warrantyExpiry: new Date('2025-03-15'),
      location: 'Building A, Floor 1, Bay 3',
      defaultTeamId: mechanicalTeam.id,
      defaultTechnicianId: tech1.id,
      assignedEmployeeId: requester1.id,
    },
  });

  const equipment2 = await prisma.equipment.create({
    data: {
      name: 'Industrial Air Compressor',
      serialNumber: 'COMP-2023-042',
      category: EquipmentCategory.MACHINERY,
      department: 'Production',
      description: 'Rotary screw air compressor, 100 HP',
      manufacturer: 'Ingersoll Rand',
      model: 'R90ie',
      purchaseDate: new Date('2023-01-10'),
      warrantyExpiry: new Date('2026-01-10'),
      location: 'Building A, Utility Room',
      defaultTeamId: mechanicalTeam.id,
    },
  });

  const equipment3 = await prisma.equipment.create({
    data: {
      name: 'Main Electrical Panel',
      serialNumber: 'ELEC-2020-001',
      category: EquipmentCategory.ELECTRICAL,
      department: 'Facilities',
      description: 'Main 480V electrical distribution panel',
      manufacturer: 'Siemens',
      model: 'P4',
      purchaseDate: new Date('2020-06-20'),
      warrantyExpiry: new Date('2023-06-20'),
      location: 'Building A, Electrical Room',
      defaultTeamId: electricalTeam.id,
      defaultTechnicianId: tech2.id,
    },
  });

  const equipment4 = await prisma.equipment.create({
    data: {
      name: 'Server Room HVAC Unit',
      serialNumber: 'HVAC-2021-003',
      category: EquipmentCategory.HVAC,
      department: 'IT',
      description: 'Precision cooling unit for server room',
      manufacturer: 'Liebert',
      model: 'CRV',
      purchaseDate: new Date('2021-09-01'),
      warrantyExpiry: new Date('2024-09-01'),
      location: 'Building B, Server Room',
      defaultTeamId: hvacTeam.id,
      defaultTechnicianId: tech3.id,
    },
  });

  const equipment5 = await prisma.equipment.create({
    data: {
      name: 'Forklift #1',
      serialNumber: 'VEH-2022-001',
      category: EquipmentCategory.VEHICLES,
      department: 'Warehouse',
      description: 'Electric forklift, 5000 lb capacity',
      manufacturer: 'Toyota',
      model: '8FBMT25',
      purchaseDate: new Date('2022-11-15'),
      warrantyExpiry: new Date('2025-11-15'),
      location: 'Warehouse A',
      defaultTeamId: mechanicalTeam.id,
    },
  });

  const equipment6 = await prisma.equipment.create({
    data: {
      name: 'Conference Room Projector',
      serialNumber: 'IT-2023-015',
      category: EquipmentCategory.IT_EQUIPMENT,
      department: 'Administration',
      description: '4K laser projector for main conference room',
      manufacturer: 'Epson',
      model: 'EB-L735U',
      purchaseDate: new Date('2023-05-01'),
      warrantyExpiry: new Date('2026-05-01'),
      location: 'Building B, Conference Room 1',
      defaultTeamId: electricalTeam.id,
      assignedEmployeeId: requester2.id,
    },
  });

  const equipment7 = await prisma.equipment.create({
    data: {
      name: 'Fire Suppression System',
      serialNumber: 'SAFE-2019-001',
      category: EquipmentCategory.SAFETY_EQUIPMENT,
      department: 'Facilities',
      description: 'FM-200 fire suppression system for server room',
      manufacturer: 'Kidde',
      model: 'FM-200',
      purchaseDate: new Date('2019-03-01'),
      warrantyExpiry: new Date('2024-03-01'),
      location: 'Building B, Server Room',
      defaultTeamId: generalTeam.id,
    },
  });

  const equipment8 = await prisma.equipment.create({
    data: {
      name: 'Industrial Lathe',
      serialNumber: 'MACH-2018-005',
      category: EquipmentCategory.MACHINERY,
      department: 'Production',
      description: 'CNC turning center',
      manufacturer: 'Mazak',
      model: 'QT-250MS',
      purchaseDate: new Date('2018-08-01'),
      warrantyExpiry: new Date('2021-08-01'),
      location: 'Building A, Floor 1, Bay 5',
      defaultTeamId: mechanicalTeam.id,
      status: EquipmentStatus.ACTIVE,
    },
  });

  console.log(`   ✓ Created ${8} equipment items`);

  // ==========================================================================
  // CREATE MAINTENANCE REQUESTS
  // ==========================================================================
  console.log('📋 Creating maintenance requests...');

  // Request 1: New corrective request (overdue)
  const request1 = await prisma.maintenanceRequest.create({
    data: {
      title: 'CNC Machine Spindle Vibration',
      description: 'Unusual vibration detected during high-speed operations. Need to inspect spindle bearings.',
      type: RequestType.CORRECTIVE,
      status: RequestStatus.NEW,
      priority: RequestPriority.HIGH,
      category: EquipmentCategory.MACHINERY,
      scheduledDate: new Date('2024-12-20'), // Past date = overdue
      equipmentId: equipment1.id,
      createdById: requester1.id,
      teamId: mechanicalTeam.id,
    },
  });

  // Request 2: In progress
  const request2 = await prisma.maintenanceRequest.create({
    data: {
      title: 'Air Compressor Oil Change',
      description: 'Scheduled preventive maintenance - oil and filter change.',
      type: RequestType.PREVENTIVE,
      status: RequestStatus.IN_PROGRESS,
      priority: RequestPriority.MEDIUM,
      category: EquipmentCategory.MACHINERY,
      scheduledDate: new Date('2024-12-28'),
      startedAt: new Date(),
      equipmentId: equipment2.id,
      createdById: manager.id,
      teamId: mechanicalTeam.id,
      technicianId: tech1.id,
    },
  });

  // Request 3: Completed
  const request3 = await prisma.maintenanceRequest.create({
    data: {
      title: 'Panel Thermal Inspection',
      description: 'Annual thermal imaging inspection of electrical connections.',
      type: RequestType.PREVENTIVE,
      status: RequestStatus.REPAIRED,
      priority: RequestPriority.LOW,
      category: EquipmentCategory.ELECTRICAL,
      scheduledDate: new Date('2024-12-15'),
      startedAt: new Date('2024-12-15T09:00:00'),
      completedAt: new Date('2024-12-15T11:30:00'),
      durationMinutes: 150,
      repairNotes: 'All connections within normal temperature range. No issues found.',
      equipmentId: equipment3.id,
      createdById: manager.id,
      teamId: electricalTeam.id,
      technicianId: tech2.id,
    },
  });

  // Request 4: New preventive (for calendar)
  const request4 = await prisma.maintenanceRequest.create({
    data: {
      title: 'HVAC Filter Replacement',
      description: 'Quarterly filter replacement for server room HVAC unit.',
      type: RequestType.PREVENTIVE,
      status: RequestStatus.NEW,
      priority: RequestPriority.MEDIUM,
      category: EquipmentCategory.HVAC,
      scheduledDate: new Date('2025-01-05'),
      equipmentId: equipment4.id,
      createdById: admin.id,
      teamId: hvacTeam.id,
    },
  });

  // Request 5: Critical overdue
  const request5 = await prisma.maintenanceRequest.create({
    data: {
      title: 'Forklift Brake Inspection',
      description: 'Driver reported squeaking when braking. Urgent safety inspection needed.',
      type: RequestType.CORRECTIVE,
      status: RequestStatus.NEW,
      priority: RequestPriority.CRITICAL,
      category: EquipmentCategory.VEHICLES,
      scheduledDate: new Date('2024-12-22'), // Overdue
      equipmentId: equipment5.id,
      createdById: requester1.id,
      teamId: mechanicalTeam.id,
    },
  });

  // Request 6: Preventive scheduled for next month
  const request6 = await prisma.maintenanceRequest.create({
    data: {
      title: 'Projector Lamp Hours Check',
      description: 'Check lamp hours and clean filters.',
      type: RequestType.PREVENTIVE,
      status: RequestStatus.NEW,
      priority: RequestPriority.LOW,
      category: EquipmentCategory.IT_EQUIPMENT,
      scheduledDate: new Date('2025-01-15'),
      equipmentId: equipment6.id,
      createdById: requester2.id,
      teamId: electricalTeam.id,
    },
  });

  // Request 7: Fire system inspection
  const request7 = await prisma.maintenanceRequest.create({
    data: {
      title: 'Annual Fire Suppression Test',
      description: 'Mandatory annual inspection and testing of FM-200 system.',
      type: RequestType.PREVENTIVE,
      status: RequestStatus.NEW,
      priority: RequestPriority.HIGH,
      category: EquipmentCategory.SAFETY_EQUIPMENT,
      scheduledDate: new Date('2025-01-20'),
      equipmentId: equipment7.id,
      createdById: admin.id,
      teamId: generalTeam.id,
    },
  });

  // Request 8: In progress corrective
  const request8 = await prisma.maintenanceRequest.create({
    data: {
      title: 'Lathe Coolant Pump Failure',
      description: 'Coolant pump not circulating. Machine overheating during operation.',
      type: RequestType.CORRECTIVE,
      status: RequestStatus.IN_PROGRESS,
      priority: RequestPriority.HIGH,
      category: EquipmentCategory.MACHINERY,
      scheduledDate: new Date('2024-12-26'),
      startedAt: new Date(),
      equipmentId: equipment8.id,
      createdById: requester1.id,
      teamId: mechanicalTeam.id,
      technicianId: tech1.id,
    },
  });

  console.log(`   ✓ Created ${8} maintenance requests`);

  // ==========================================================================
  // CREATE REQUEST LOGS
  // ==========================================================================
  console.log('📝 Creating activity logs...');

  await prisma.requestLog.create({
    data: {
      requestId: request2.id,
      userId: tech1.id,
      action: 'ASSIGNED',
      details: JSON.stringify({ technicianName: 'Mike Mechanic' }),
    },
  });

  await prisma.requestLog.create({
    data: {
      requestId: request2.id,
      userId: tech1.id,
      action: 'STATUS_CHANGED',
      details: JSON.stringify({ from: 'NEW', to: 'IN_PROGRESS' }),
    },
  });

  await prisma.requestLog.create({
    data: {
      requestId: request3.id,
      userId: tech2.id,
      action: 'STATUS_CHANGED',
      details: JSON.stringify({ from: 'IN_PROGRESS', to: 'REPAIRED' }),
    },
  });

  console.log(`   ✓ Created activity logs`);

  // ==========================================================================
  // SUMMARY
  // ==========================================================================
  console.log('\n✅ Database seeded successfully!\n');
  console.log('📊 Summary:');
  console.log('   - Users: 7 (1 admin, 1 manager, 3 technicians, 2 requesters)');
  console.log('   - Teams: 4');
  console.log('   - Equipment: 8');
  console.log('   - Maintenance Requests: 8');
  console.log('\n🔐 Login credentials (all use password: password123):');
  console.log('   - Admin: admin@gearguard.com');
  console.log('   - Manager: manager@gearguard.com');
  console.log('   - Technician 1: tech1@gearguard.com');
  console.log('   - Technician 2: tech2@gearguard.com');
  console.log('   - Technician 3: tech3@gearguard.com');
  console.log('   - Requester: requester@gearguard.com');
  console.log('   - User: user@gearguard.com');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
