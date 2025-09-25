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

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    // Clear existing data (in correct order due to foreign keys)
    console.log('🧹 Clearing existing data...');
    await db.delete(tasks);
    await db.delete(sprints);
    await db.delete(workspaceMembers);
    await db.delete(workspaces);
    await db.delete(users);

    // 1. Create Users
    console.log('👥 Creating users...');
    
    const facilitator = await db.insert(users).values({
      username: 'sarah_johnson',
      password: await hashPassword('password123'),
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@example.com',
      role: 'facilitator',
    }).returning();

    const learner1 = await db.insert(users).values({
      username: 'emma_johnson',
      password: await hashPassword('password123'),
      firstName: 'Emma',
      lastName: 'Johnson',
      email: 'emma.johnson@example.com',
      role: 'learner',
    }).returning();

    const learner2 = await db.insert(users).values({
      username: 'alex_johnson',
      password: await hashPassword('password123'),
      firstName: 'Alex',
      lastName: 'Johnson',
      email: 'alex.johnson@example.com',
      role: 'learner',
    }).returning();

    const facilitator2 = await db.insert(users).values({
      username: 'mike_wilson',
      password: await hashPassword('password123'),
      firstName: 'Mike',
      lastName: 'Wilson',
      email: 'mike.wilson@example.com',
      role: 'facilitator',
    }).returning();

    const learner3 = await db.insert(users).values({
      username: 'sophie_wilson',
      password: await hashPassword('password123'),
      firstName: 'Sophie',
      lastName: 'Wilson',
      email: 'sophie.wilson@example.com',
      role: 'learner',
    }).returning();

    // 2. Create Workspaces
    console.log('🏠 Creating workspaces...');
    
    const workspace1 = await db.insert(workspaces).values({
      name: 'Johnson Family Homeschool',
      description: 'Main workspace for the Johnson family homeschool activities',
      createdBy: facilitator[0].id,
    }).returning();

    const workspace2 = await db.insert(workspaces).values({
      name: 'Wilson Family Learning',
      description: 'Wilson family educational workspace',
      createdBy: facilitator2[0].id,
    }).returning();

    const workspace3 = await db.insert(workspaces).values({
      name: 'Community Learning Group',
      description: 'Shared workspace for multiple families',
      createdBy: facilitator[0].id,
    }).returning();

    // 3. Add Workspace Members
    console.log('👥 Adding workspace members...');
    
    // Johnson Family Workspace
    await db.insert(workspaceMembers).values([
      {
        workspaceId: workspace1[0].id,
        userId: facilitator[0].id,
        role: 'facilitator',
      },
      {
        workspaceId: workspace1[0].id,
        userId: learner1[0].id,
        role: 'learner',
      },
      {
        workspaceId: workspace1[0].id,
        userId: learner2[0].id,
        role: 'learner',
      },
    ]);

    // Wilson Family Workspace
    await db.insert(workspaceMembers).values([
      {
        workspaceId: workspace2[0].id,
        userId: facilitator2[0].id,
        role: 'facilitator',
      },
      {
        workspaceId: workspace2[0].id,
        userId: learner3[0].id,
        role: 'learner',
      },
    ]);

    // Community Workspace (both families)
    await db.insert(workspaceMembers).values([
      {
        workspaceId: workspace3[0].id,
        userId: facilitator[0].id,
        role: 'facilitator',
      },
      {
        workspaceId: workspace3[0].id,
        userId: facilitator2[0].id,
        role: 'facilitator',
      },
      {
        workspaceId: workspace3[0].id,
        userId: learner1[0].id,
        role: 'learner',
      },
      {
        workspaceId: workspace3[0].id,
        userId: learner2[0].id,
        role: 'learner',
      },
      {
        workspaceId: workspace3[0].id,
        userId: learner3[0].id,
        role: 'learner',
      },
    ]);

    // 4. Create Sprints
    console.log('🏃 Creating sprints...');
    
    const currentDate = new Date();
    const nextWeek = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const twoWeeksFromNow = new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    const threeWeeksFromNow = new Date(currentDate.getTime() + 21 * 24 * 60 * 60 * 1000);

    // Active Sprint for Johnson Family
    const activeSprint = await db.insert(sprints).values({
      name: 'Week 1: Ancient Civilizations',
      description: 'Exploring ancient Egypt, Greece, and Rome through history, art, and literature',
      workspaceId: workspace1[0].id,
      startDate: currentDate,
      endDate: nextWeek,
      isActive: true,
      createdBy: facilitator[0].id,
    }).returning();

    // Past Sprint for Johnson Family
    const pastSprint = await db.insert(sprints).values({
      name: 'Week 0: Getting Started',
      description: 'Introduction to homeschool routine and basic subjects',
      workspaceId: workspace1[0].id,
      startDate: new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(currentDate.getTime() - 1 * 24 * 60 * 60 * 1000),
      isActive: false,
      createdBy: facilitator[0].id,
    }).returning();

    // Future Sprint for Wilson Family
    const futureSprint = await db.insert(sprints).values({
      name: 'Week 2: Space Exploration',
      description: 'Learning about planets, stars, and space technology',
      workspaceId: workspace2[0].id,
      startDate: nextWeek,
      endDate: twoWeeksFromNow,
      isActive: false,
      createdBy: facilitator2[0].id,
    }).returning();

    // Community Sprint
    const communitySprint = await db.insert(sprints).values({
      name: 'Community Project: Environmental Science',
      description: 'Collaborative study of ecosystems, climate, and conservation',
      workspaceId: workspace3[0].id,
      startDate: twoWeeksFromNow,
      endDate: threeWeeksFromNow,
      isActive: false,
      createdBy: facilitator[0].id,
    }).returning();

    // 5. Create Tasks
    console.log('📝 Creating tasks...');
    
    // Tasks for Active Sprint (Ancient Civilizations)
    const activeSprintTasks = [
      {
        title: 'Research Ancient Egyptian Pyramids',
        description: 'Find 5 interesting facts about how pyramids were built and create a presentation',
        subject: 'History',
        status: 'done' as const,
        estimatedTime: '2h',
        timeSpent: '1h 45min',
        progress: 100,
        sprintId: activeSprint[0].id,
        workspaceId: workspace1[0].id,
        assignedTo: learner1[0].id,
        createdBy: facilitator[0].id,
        completedAt: new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Build a Model Pyramid',
        description: 'Create a 3D model of a pyramid using cardboard, clay, or LEGO',
        subject: 'Art',
        status: 'in_progress' as const,
        estimatedTime: '3h',
        timeSpent: '1h 30min',
        progress: 50,
        sprintId: activeSprint[0].id,
        workspaceId: workspace1[0].id,
        assignedTo: learner1[0].id,
        createdBy: facilitator[0].id,
      },
      {
        title: 'Read Greek Mythology Stories',
        description: 'Read 3 Greek myths and write a summary of your favorite one',
        subject: 'English',
        status: 'todo' as const,
        estimatedTime: '1h 30min',
        sprintId: activeSprint[0].id,
        workspaceId: workspace1[0].id,
        assignedTo: learner2[0].id,
        createdBy: facilitator[0].id,
      },
      {
        title: 'Learn Roman Numerals',
        description: 'Practice converting numbers to Roman numerals and vice versa',
        subject: 'Math',
        status: 'in_progress' as const,
        estimatedTime: '1h',
        timeSpent: '30min',
        progress: 30,
        sprintId: activeSprint[0].id,
        workspaceId: workspace1[0].id,
        assignedTo: learner2[0].id,
        createdBy: facilitator[0].id,
      },
      {
        title: 'Create Ancient Art Timeline',
        description: 'Make a visual timeline showing art from different ancient civilizations',
        subject: 'Art',
        status: 'todo' as const,
        estimatedTime: '2h',
        sprintId: activeSprint[0].id,
        workspaceId: workspace1[0].id,
        assignedTo: learner1[0].id,
        createdBy: facilitator[0].id,
      },
    ];

    await db.insert(tasks).values(activeSprintTasks);

    // Tasks for Past Sprint (Getting Started)
    const pastSprintTasks = [
      {
        title: 'Set up Learning Space',
        description: 'Organize desk and supplies for homeschool activities',
        subject: 'Organization',
        status: 'done' as const,
        estimatedTime: '1h',
        timeSpent: '45min',
        progress: 100,
        sprintId: pastSprint[0].id,
        workspaceId: workspace1[0].id,
        assignedTo: learner1[0].id,
        createdBy: facilitator[0].id,
        completedAt: new Date(currentDate.getTime() - 6 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Create Daily Schedule',
        description: 'Plan out daily routine for homeschool activities',
        subject: 'Planning',
        status: 'done' as const,
        estimatedTime: '30min',
        timeSpent: '25min',
        progress: 100,
        sprintId: pastSprint[0].id,
        workspaceId: workspace1[0].id,
        assignedTo: learner2[0].id,
        createdBy: facilitator[0].id,
        completedAt: new Date(currentDate.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
    ];

    await db.insert(tasks).values(pastSprintTasks);

    // Tasks for Future Sprint (Space Exploration)
    const futureSprintTasks = [
      {
        title: 'Research Solar System Planets',
        description: 'Learn about each planet and create a fact sheet',
        subject: 'Science',
        status: 'todo' as const,
        estimatedTime: '2h',
        sprintId: futureSprint[0].id,
        workspaceId: workspace2[0].id,
        assignedTo: learner3[0].id,
        createdBy: facilitator2[0].id,
      },
      {
        title: 'Build a Rocket Model',
        description: 'Create a model rocket and explain how rockets work',
        subject: 'Science',
        status: 'todo' as const,
        estimatedTime: '3h',
        sprintId: futureSprint[0].id,
        workspaceId: workspace2[0].id,
        assignedTo: learner3[0].id,
        createdBy: facilitator2[0].id,
      },
    ];

    await db.insert(tasks).values(futureSprintTasks);

    // Tasks for Community Sprint (Environmental Science)
    const communitySprintTasks = [
      {
        title: 'Study Local Ecosystem',
        description: 'Research plants and animals in your local area',
        subject: 'Science',
        status: 'todo' as const,
        estimatedTime: '2h',
        sprintId: communitySprint[0].id,
        workspaceId: workspace3[0].id,
        assignedTo: learner1[0].id,
        createdBy: facilitator[0].id,
      },
      {
        title: 'Create Recycling Plan',
        description: 'Design a recycling system for your home',
        subject: 'Science',
        status: 'todo' as const,
        estimatedTime: '1h 30min',
        sprintId: communitySprint[0].id,
        workspaceId: workspace3[0].id,
        assignedTo: learner2[0].id,
        createdBy: facilitator[0].id,
      },
      {
        title: 'Weather Observation Journal',
        description: 'Record daily weather for one week and analyze patterns',
        subject: 'Science',
        status: 'todo' as const,
        estimatedTime: '1h',
        sprintId: communitySprint[0].id,
        workspaceId: workspace3[0].id,
        assignedTo: learner3[0].id,
        createdBy: facilitator2[0].id,
      },
    ];

    await db.insert(tasks).values(communitySprintTasks);

    // Additional standalone tasks (not in sprints)
    const standaloneTasks = [
      {
        title: 'Practice Spanish Vocabulary',
        description: 'Learn 20 new Spanish words and use them in sentences',
        subject: 'Spanish',
        status: 'todo' as const,
        estimatedTime: '45min',
        workspaceId: workspace1[0].id,
        assignedTo: learner1[0].id,
        createdBy: facilitator[0].id,
      },
      {
        title: 'Math Problem Solving',
        description: 'Complete 10 word problems involving fractions',
        subject: 'Math',
        status: 'in_progress' as const,
        estimatedTime: '1h',
        timeSpent: '20min',
        progress: 20,
        workspaceId: workspace1[0].id,
        assignedTo: learner2[0].id,
        createdBy: facilitator[0].id,
      },
    ];

    await db.insert(tasks).values(standaloneTasks);

    console.log('✅ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`👥 Users: 5 (2 facilitators, 3 learners)`);
    console.log(`🏠 Workspaces: 3 (2 family, 1 community)`);
    console.log(`🏃 Sprints: 4 (1 active, 1 past, 2 future)`);
    console.log(`📝 Tasks: 12 (mix of completed, in-progress, and todo)`);
    console.log('\n🔑 Login Credentials:');
    console.log('Facilitator: sarah_johnson / password123');
    console.log('Learner: emma_johnson / password123');
    console.log('Learner: alex_johnson / password123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });
