// Core data models for Prakriti Odyssey

export type UserRole = 'student' | 'teacher' | 'school-admin';

export type QuestType = 'quiz' | 'photo' | 'qr' | 'daily-action';

export type QuestDifficulty = 'easy' | 'medium' | 'hard';

export type PetSpecies = 'eco-turtle' | 'nature-fox' | 'green-dragon' | 'earth-rabbit';

export type PetGrowthStage = 'egg' | 'baby' | 'child' | 'adult' | 'elder';

export type BadgeType = 'questmaster' | 'eco-warrior' | 'pet-lover' | 'knowledge-seeker';

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  school_id?: string;
  points: number;
  badges: Badge[];
  avatar?: Avatar;
  created_at: string;
  updated_at: string;
}

export interface Pet {
  id: string;
  user_id: string;
  name: string;
  species: PetSpecies;
  growth_stage: PetGrowthStage;
  health: number; // 0-100
  happiness: number; // 0-100
  hunger: number; // 0-100
  accessories: PetAccessory[];
  last_fed: string;
  created_at: string;
  updated_at: string;
}

export interface Avatar {
  skin_tone: string;
  hair_style: string;
  hair_color: string;
  outfit: string;
  accessories: string[];
}

export interface PetAccessory {
  id: string;
  name: string;
  type: 'hat' | 'collar' | 'toy' | 'background';
  image_url: string;
  price: number;
  unlocked_at_stage: PetGrowthStage;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  difficulty: QuestDifficulty;
  content: QuizQuest | PhotoQuest | QRQuest | DailyActionQuest;
  reward_points: number;
  reward_coins: number;
  assigned_by?: string; // teacher/admin who created it
  is_active: boolean;
  expires_at?: string;
  created_at: string;
}

export interface QuizQuest {
  questions: QuizQuestion[];
  time_limit?: number; // seconds
  passing_score: number; // percentage
  // Optional comic-style story panels shown before the quiz
  story?: StoryPanel[];
}

// Comic story panel shown before a themed quiz
export interface StoryPanel {
  id: string; // e.g., 'p1'
  title?: string; // Optional short title for the panel
  caption: string; // Story text shown on the card
  dialogue?: string; // Optional dialogue for speech bubbles
  image_prompt: string; // Prompt to generate the image for this panel
  image_path?: string; // Where to place the generated image under public/
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number; // index of correct option
  explanation?: string;
}

export interface PhotoQuest {
  prompt: string;
  required_elements: string[]; // what should be in the photo
  example_images?: string[];
}

export interface QRQuest {
  description: string;
  location_hint: string;
  qr_data: string; // what the QR code contains
}

export interface DailyActionQuest {
  action: string;
  verification_method: 'checkbox' | 'photo' | 'timer';
  duration?: number; // for timer-based actions (minutes)
}

export interface QuestCompletion {
  id: string;
  user_id: string;
  quest_id: string;
  submission: QuizSubmission | PhotoSubmission | QRSubmission | DailyActionSubmission;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  score?: number;
  feedback?: string;
  completed_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

export interface QuizSubmission {
  answers: number[]; // indices of selected answers
  time_taken: number; // seconds
  score: number; // percentage
}

export interface PhotoSubmission {
  image_url: string;
  description?: string;
}

export interface QRSubmission {
  qr_data: string;
  timestamp: string;
  location?: string;
}

export interface DailyActionSubmission {
  completed: boolean;
  proof_image?: string;
  duration?: number; // for timer-based actions
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  type: BadgeType;
  icon: string;
  requirements: BadgeRequirement[];
  earned_at?: string;
}

export interface BadgeRequirement {
  type: 'quests_completed' | 'points_earned' | 'days_active' | 'pet_stage_reached';
  target: number;
  current?: number;
}

export interface School {
  id: string;
  name: string;
  location: string;
  admin_id: string;
  students: User[];
  created_at: string;
}

export interface Leaderboard {
  id: string;
  user_id: string;
  username: string;
  school_id?: string;
  school_name?: string;
  points: number;
  coins?: number;
  badges_count: number;
  pet_stage: PetGrowthStage;
  period: 'daily' | 'weekly' | 'monthly' | 'all-time';
  rank: number;
  updated_at: string;
}

export interface Store {
  food_items: FoodItem[];
  accessories: PetAccessory[];
}

export interface FoodItem {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price: number; // in coins
  nutrition_value: number; // health increase
  happiness_boost: number; // happiness increase
  rarity: 'common' | 'rare' | 'legendary';
}

export interface UserInventory {
  id: string;
  user_id: string;
  coins: number;
  food_items: InventoryFoodItem[];
  accessories: InventoryAccessory[];
  updated_at: string;
}

export interface InventoryFoodItem {
  item_id: string;
  quantity: number;
  purchased_at: string;
}

export interface InventoryAccessory {
  accessory_id: string;
  equipped: boolean;
  purchased_at: string;
}

// Game state interfaces
export interface GameState {
  user: User;
  pet: Pet;
  inventory: UserInventory;
  active_quests: Quest[];
  completed_quests: QuestCompletion[];
  leaderboard_rank: number;
  daily_login_streak: number;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Mock authentication credentials
export interface MockCredentials {
  id: string;
  password: string;
  role: UserRole;
  name: string;
  school_id?: string;
}
