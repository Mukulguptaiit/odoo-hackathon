const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const migrateCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users with categoriesOfInterest array
    const users = await User.find({ categoriesOfInterest: { $exists: true, $ne: [] } });
    console.log(`Found ${users.length} users with categoriesOfInterest`);

    let updatedCount = 0;
    for (const user of users) {
      // Take the first category from the array
      const firstCategory = user.categoriesOfInterest[0];
      
      if (firstCategory) {
        // Update user to have single categoryOfInterest
        await User.findByIdAndUpdate(user._id, {
          $set: { categoryOfInterest: firstCategory },
          $unset: { categoriesOfInterest: 1 }
        });
        updatedCount++;
        console.log(`Updated user ${user.email} with category: ${firstCategory}`);
      }
    }

    console.log(`Migration completed. Updated ${updatedCount} users.`);
    
    // Also update users with empty categoriesOfInterest array
    const usersWithEmptyArray = await User.find({ categoriesOfInterest: [] });
    console.log(`Found ${usersWithEmptyArray.length} users with empty categoriesOfInterest array`);
    
    for (const user of usersWithEmptyArray) {
      await User.findByIdAndUpdate(user._id, {
        $unset: { categoriesOfInterest: 1 }
      });
      console.log(`Removed empty categoriesOfInterest from user ${user.email}`);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  migrateCategories();
}

module.exports = migrateCategories; 