import { db } from '../server/db';
import { users } from '../shared/schema';

async function debugSeed() {
  console.log('🔍 Debug: Checking database connection...');
  
  // Check environment variables
  console.log('Environment variables:');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  try {
    // Try to query the users table
    console.log('🔍 Attempting to query users table...');
    const existingUsers = await db.select().from(users);
    console.log('✅ Database connection successful!');
    console.log('📊 Found', existingUsers.length, 'existing users');
    
    if (existingUsers.length > 0) {
      console.log('👥 Existing users:');
      existingUsers.forEach(user => {
        console.log(`  - ${user.username} (${user.role})`);
      });
    }
    
    // Try to insert a test user
    console.log('🧪 Testing insert operation...');
    const testUser = await db.insert(users).values({
      username: 'test_user_' + Date.now(),
      password: 'test_password',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      role: 'learner',
    }).returning();
    
    console.log('✅ Insert operation successful!');
    console.log('🆔 Created user with ID:', testUser[0].id);
    
    // Clean up test user
    await db.delete(users).where(eq(users.id, testUser[0].id));
    console.log('🧹 Cleaned up test user');
    
  } catch (error) {
    console.error('❌ Database operation failed:', error);
    throw error;
  }
}

// Import eq for the delete operation
import { eq } from 'drizzle-orm';

debugSeed()
  .then(() => {
    console.log('🎉 Debug completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Debug failed:', error);
    process.exit(1);
  });
