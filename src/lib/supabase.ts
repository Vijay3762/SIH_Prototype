import { createClient } from '@supabase/supabase-js'

// For MVP, we'll use environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key-for-development'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database table names
export const TABLES = {
  USERS: 'users',
  PETS: 'pets',
  QUESTS: 'quests',
  QUEST_COMPLETIONS: 'quest_completions',
  SCHOOLS: 'schools',
  LEADERBOARDS: 'leaderboards',
  BADGES: 'badges',
  USER_BADGES: 'user_badges',
  INVENTORY: 'user_inventory',
  STORE_ITEMS: 'store_items',
} as const

// Mock mode flag - set to true for development without Supabase
export const MOCK_MODE = process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_SUPABASE_URL

// Database schema SQL for reference
export const DATABASE_SCHEMA = `
-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  username VARCHAR UNIQUE NOT NULL,
  role VARCHAR CHECK (role IN ('student', 'teacher', 'school-admin')) DEFAULT 'student',
  school_id UUID REFERENCES schools(id),
  points INTEGER DEFAULT 0,
  avatar JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schools table
CREATE TABLE schools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  location VARCHAR,
  admin_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pets table
CREATE TABLE pets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  species VARCHAR NOT NULL,
  growth_stage VARCHAR DEFAULT 'egg',
  health INTEGER DEFAULT 100 CHECK (health >= 0 AND health <= 100),
  happiness INTEGER DEFAULT 100 CHECK (happiness >= 0 AND happiness <= 100),
  hunger INTEGER DEFAULT 50 CHECK (hunger >= 0 AND hunger <= 100),
  accessories JSONB DEFAULT '[]',
  last_fed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quests table
CREATE TABLE quests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  type VARCHAR CHECK (type IN ('quiz', 'photo', 'qr', 'daily-action')),
  difficulty VARCHAR CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  content JSONB NOT NULL,
  reward_points INTEGER DEFAULT 10,
  reward_coins INTEGER DEFAULT 5,
  assigned_by UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quest completions table
CREATE TABLE quest_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quest_id UUID REFERENCES quests(id) ON DELETE CASCADE,
  submission JSONB NOT NULL,
  status VARCHAR CHECK (status IN ('pending', 'approved', 'rejected', 'completed')) DEFAULT 'completed',
  score INTEGER CHECK (score >= 0 AND score <= 100),
  feedback TEXT,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, quest_id)
);

-- Badges table
CREATE TABLE badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  type VARCHAR NOT NULL,
  icon VARCHAR,
  requirements JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User badges junction table
CREATE TABLE user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- User inventory table
CREATE TABLE user_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  coins INTEGER DEFAULT 0,
  food_items JSONB DEFAULT '[]',
  accessories JSONB DEFAULT '[]',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Store items table
CREATE TABLE store_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  type VARCHAR CHECK (type IN ('food', 'accessory')),
  image_url VARCHAR,
  price INTEGER NOT NULL,
  properties JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leaderboards view (computed from users table)
CREATE VIEW leaderboards AS
SELECT 
  u.id as user_id,
  u.username,
  u.school_id,
  s.name as school_name,
  u.points,
  (SELECT COUNT(*) FROM user_badges ub WHERE ub.user_id = u.id) as badges_count,
  p.growth_stage as pet_stage,
  u.updated_at,
  ROW_NUMBER() OVER (ORDER BY u.points DESC) as global_rank,
  ROW_NUMBER() OVER (PARTITION BY u.school_id ORDER BY u.points DESC) as school_rank
FROM users u
LEFT JOIN schools s ON u.school_id = s.id
LEFT JOIN pets p ON p.user_id = u.id
WHERE u.role = 'student'
ORDER BY u.points DESC;

-- Indexes for performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_school ON users(school_id);
CREATE INDEX idx_pets_user ON pets(user_id);
CREATE INDEX idx_quest_completions_user ON quest_completions(user_id);
CREATE INDEX idx_quest_completions_quest ON quest_completions(quest_id);
CREATE INDEX idx_user_badges_user ON user_badges(user_id);
`;

// Helper functions for database operations
export const dbHelpers = {
  async getUser(userId: string) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getUserPet(userId: string) {
    const { data, error } = await supabase
      .from(TABLES.PETS)
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getActiveQuests() {
    const { data, error } = await supabase
      .from(TABLES.QUESTS)
      .select('*')
      .eq('is_active', true);
    
    if (error) throw error;
    return data;
  },

  async getUserInventory(userId: string) {
    const { data, error } = await supabase
      .from(TABLES.INVENTORY)
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getLeaderboard(period: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'all-time', schoolId?: string) {
    let query = supabase
      .from('leaderboards')
      .select('*')
      .limit(50);
    
    if (schoolId) {
      query = query.eq('school_id', schoolId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
};