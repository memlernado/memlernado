import { db } from '../server/db';
import { 
  users, 
  workspaces, 
  workspaceMembers, 
  sprints, 
  tasks 
} from '../shared/schema';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seedMinimal() {
  console.log('🌱 Starting minimal database seeding...');

  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await db.delete(tasks);
    await db.delete(sprints);
    await db.delete(workspaceMembers);
    await db.delete(workspaces);
    await db.delete(users);

    // Create minimal test data
    console.log('👥 Creating test users...');
    
    const facilitator = await db.insert(users).values({
      username: 'admin',
      password: await hashPassword('admin123'),
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      role: 'facilitator',
    }).returning();

    const learner = await db.insert(users).values({
      username: 'student',
      password: await hashPassword('student123'),
      firstName: 'Student',
      lastName: 'User',
      email: 'student@example.com',
      role: 'learner',
    }).returning();

    // Add additional test learners for testing the add member functionality
    await db.insert(users).values([
      {
        username: 'alice',
        password: await hashPassword('alice123'),
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice@example.com',
        role: 'learner',
      },
      {
        username: 'bob',
        password: await hashPassword('bob123'),
        firstName: 'Bob',
        lastName: 'Smith',
        email: 'bob@example.com',
        role: 'learner',
      },
    ]);

    console.log('🏠 Creating workspace...');
    const workspace = await db.insert(workspaces).values({
      name: 'Test Workspace',
      description: 'A test workspace for development',
      createdBy: facilitator[0].id,
    }).returning();

    console.log('👥 Adding workspace members...');
    await db.insert(workspaceMembers).values([
      {
        workspaceId: workspace[0].id,
        userId: facilitator[0].id,
        role: 'facilitator',
      },
      {
        workspaceId: workspace[0].id,
        userId: learner[0].id,
        role: 'learner',
      },
    ]);

    console.log('🏃 Creating active sprint...');
    const currentDate = new Date();
    const nextWeek = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    const sprint = await db.insert(sprints).values({
      name: 'Test Sprint',
      description: 'A test sprint with sample tasks',
      workspaceId: workspace[0].id,
      startDate: currentDate,
      endDate: nextWeek,
      isActive: true,
      createdBy: facilitator[0].id,
    }).returning();

    console.log('📝 Creating sample tasks...');
    await db.insert(tasks).values([
      {
        title: 'Complete Math Worksheet',
        description: 'Finish the algebra problems on page 45',
        subject: 'Math',
        status: 'todo',
        estimatedTime: '30min',
        sprintId: sprint[0].id,
        workspaceId: workspace[0].id,
        assignedTo: learner[0].id,
        createdBy: facilitator[0].id,
      },
      {
        title: 'Read Chapter 3',
        description: 'Read the assigned chapter and write a summary',
        subject: 'English',
        status: 'in_progress',
        estimatedTime: '45min',
        timeSpent: '20min',
        progress: 40,
        sprintId: sprint[0].id,
        workspaceId: workspace[0].id,
        assignedTo: learner[0].id,
        createdBy: facilitator[0].id,
      },
      {
        title: 'Science Experiment',
        description: 'Complete the plant growth experiment',
        subject: 'Science',
        status: 'done',
        estimatedTime: '1h',
        timeSpent: '55min',
        progress: 100,
        sprintId: sprint[0].id,
        workspaceId: workspace[0].id,
        assignedTo: learner[0].id,
        createdBy: facilitator[0].id,
        completedAt: new Date(currentDate.getTime() - 24 * 60 * 60 * 1000),
      },
    ]);

    console.log('✅ Minimal database seeded successfully!');
    console.log('\n🔑 Login Credentials:');
    console.log('Facilitator: admin / admin123');
    console.log('Learner: student / student123');
    console.log('Additional test learners:');
    console.log('  - alice@example.com (alice / alice123)');
    console.log('  - bob@example.com (bob / bob123)');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed function
seedMinimal()
  .then(() => {
    console.log('🎉 Minimal seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Minimal seeding failed:', error);
    process.exit(1);
  });
