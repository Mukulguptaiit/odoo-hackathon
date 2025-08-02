const Category = require('../models/Category');
const User = require('../models/User');

const predefinedCategories = [
  // Technology
  { name: 'Technology', description: 'General technology topics', color: '#3B82F6' },
  { name: 'AI/ML', description: 'Artificial Intelligence / Machine Learning', color: '#10B981' },
  { name: 'Web Development', description: 'Web development and programming', color: '#F59E0B' },
  { name: 'Cybersecurity', description: 'Security and privacy topics', color: '#EF4444' },
  { name: 'Blockchain', description: 'Blockchain and cryptocurrency', color: '#8B5CF6' },
  { name: 'Cloud Computing', description: 'Cloud services and infrastructure', color: '#06B6D4' },
  { name: 'Data Science', description: 'Data analysis and science', color: '#84CC16' },

  // Education
  { name: 'Education', description: 'General education topics', color: '#6366F1' },
  { name: 'Competitive Programming', description: 'Programming competitions', color: '#EC4899' },
  { name: 'Mathematics', description: 'Math and mathematical concepts', color: '#F97316' },
  { name: 'Physics', description: 'Physics and scientific concepts', color: '#14B8A6' },
  { name: 'Literature', description: 'Books, writing, and literature', color: '#A855F7' },
  { name: 'Language Learning', description: 'Learning new languages', color: '#22C55E' },

  // Career
  { name: 'Career', description: 'Career development and advice', color: '#EAB308' },
  { name: 'Startups', description: 'Startup and entrepreneurship', color: '#F43F5E' },
  { name: 'Product Management', description: 'Product management topics', color: '#0EA5E9' },
  { name: 'Finance & Investing', description: 'Financial topics and investing', color: '#059669' },
  { name: 'Entrepreneurship', description: 'Business and entrepreneurship', color: '#DC2626' },

  // Creative Arts
  { name: 'Creative Arts', description: 'Creative and artistic topics', color: '#7C3AED' },
  { name: 'Design', description: 'UI/UX, Graphic design', color: '#F59E0B' },
  { name: 'Writing', description: 'Poetry, Blogging, Content creation', color: '#10B981' },
  { name: 'Photography', description: 'Photography and visual arts', color: '#8B5CF6' },
  { name: 'Music Production', description: 'Music creation and production', color: '#EC4899' },

  // Lifestyle
  { name: 'Lifestyle', description: 'General lifestyle topics', color: '#06B6D4' },
  { name: 'Fitness & Health', description: 'Health and fitness topics', color: '#22C55E' },
  { name: 'Travel', description: 'Travel and exploration', color: '#F97316' },
  { name: 'Food & Cooking', description: 'Culinary arts and cooking', color: '#EF4444' },
  { name: 'Personal Development', description: 'Self-improvement and growth', color: '#8B5CF6' },

  // Entertainment
  { name: 'Entertainment', description: 'General entertainment topics', color: '#EAB308' },
  { name: 'Movies & TV', description: 'Film and television', color: '#F43F5E' },
  { name: 'Anime', description: 'Anime and animation', color: '#0EA5E9' },
  { name: 'Gaming', description: 'Video games and gaming', color: '#059669' },
  { name: 'Sports', description: 'Sports and athletics', color: '#DC2626' },

  // Social Causes
  { name: 'Social Causes', description: 'Social issues and causes', color: '#7C3AED' },
  { name: 'Sustainability', description: 'Environmental sustainability', color: '#10B981' },
  { name: 'Mental Health', description: 'Mental health and wellness', color: '#F59E0B' },
  { name: 'Education for All', description: 'Access to education', color: '#06B6D4' },
  { name: 'Gender Equality', description: 'Gender equality and rights', color: '#EC4899' }
];

const seedCategories = async () => {
  try {
    // Get the first admin user or create a system user
    let adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      // Create a system user if no admin exists
      adminUser = new User({
        firstName: 'System',
        lastName: 'Admin',
        email: 'system@quickdesk.com',
        password: 'system123',
        role: 'admin'
      });
      await adminUser.save();
    }

    for (const categoryData of predefinedCategories) {
      const existingCategory = await Category.findOne({ name: categoryData.name });
      
      if (!existingCategory) {
        const category = new Category({
          ...categoryData,
          isPredefined: true,
          createdBy: adminUser._id
        });
        await category.save();
        console.log(`Created category: ${categoryData.name}`);
      } else {
        console.log(`Category already exists: ${categoryData.name}`);
      }
    }

    console.log('Categories seeding completed!');
  } catch (error) {
    console.error('Error seeding categories:', error);
  }
};

module.exports = { seedCategories }; 