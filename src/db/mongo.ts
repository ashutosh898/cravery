import { MongoClient, Db } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import {
  User,
  LoginLog,
  Restaurant,
  Order,
  DatabaseStatusInfo,
} from '../types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const STORE_FILE = path.join(DATA_DIR, 'mongodb_store.json');

// Interface for MongoDB Collection operations
export interface IMongoCollection<T extends { id: string }> {
  find(filter?: any): Promise<T[]>;
  findOne(filter: any): Promise<T | null>;
  insertOne(doc: T): Promise<T>;
  updateOne(filter: any, update: any): Promise<boolean>;
  deleteOne(filter: any): Promise<boolean>;
  countDocuments(): Promise<number>;
}

// In-Memory & Local JSON Store schema (mirrors MongoDB database)
interface MongoStoreSchema {
  users: (User & { passwordHash: string })[];
  login_logs: LoginLog[];
  restaurants: Restaurant[];
  orders: Order[];
}

let nativeClient: MongoClient | null = null;
let nativeDb: Db | null = null;
let isConnectedToAtlas = false;
let dbName = process.env.MONGODB_DB_NAME || 'cravery_food_delivery';

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Local Document Store (guarantees 100% reliability and local persistence)
function loadLocalStore(): MongoStoreSchema {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading local mongo store:', err);
  }
  return {
    users: [],
    login_logs: [],
    restaurants: [],
    orders: [],
  };
}

function saveLocalStore(store: MongoStoreSchema) {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving local mongo store:', err);
  }
}

// In-Memory representation synced to disk
let localStore: MongoStoreSchema = loadLocalStore();

// Wrapper collection supporting MongoDB API
class HybridCollection<T extends { id: string }> implements IMongoCollection<T> {
  private collectionName: keyof MongoStoreSchema;

  constructor(collectionName: keyof MongoStoreSchema) {
    this.collectionName = collectionName;
  }

  async find(filter: any = {}): Promise<T[]> {
    if (isConnectedToAtlas && nativeDb) {
      try {
        const docs = await nativeDb.collection(this.collectionName).find(filter).toArray();
        return docs.map((d: any) => ({ ...d, id: d.id || d._id?.toString() })) as T[];
      } catch (err) {
        console.warn(`Atlas query failed on ${this.collectionName}, using local store:`, err);
      }
    }
    // Local filter
    const items = (localStore[this.collectionName] as unknown as T[]) || [];
    return items.filter((item) => {
      for (const key of Object.keys(filter)) {
        if ((item as any)[key] !== filter[key]) return false;
      }
      return true;
    });
  }

  async findOne(filter: any): Promise<T | null> {
    if (isConnectedToAtlas && nativeDb) {
      try {
        const doc = await nativeDb.collection(this.collectionName).findOne(filter);
        if (doc) {
          return { ...doc, id: doc.id || doc._id?.toString() } as unknown as T;
        }
        return null;
      } catch (err) {
        console.warn(`Atlas findOne failed on ${this.collectionName}, using local store:`, err);
      }
    }
    const items = (localStore[this.collectionName] as unknown as T[]) || [];
    const found = items.find((item) => {
      for (const key of Object.keys(filter)) {
        if ((item as any)[key] !== filter[key]) return false;
      }
      return true;
    });
    return found || null;
  }

  async insertOne(doc: T): Promise<T> {
    if (isConnectedToAtlas && nativeDb) {
      try {
        await nativeDb.collection(this.collectionName).insertOne({ ...doc, _id: doc.id as any });
      } catch (err) {
        console.warn(`Atlas insertOne failed on ${this.collectionName}:`, err);
      }
    }
    // Always persist to local store as well
    const items = localStore[this.collectionName] as unknown as T[];
    items.unshift(doc);
    saveLocalStore(localStore);
    return doc;
  }

  async updateOne(filter: any, update: any): Promise<boolean> {
    if (isConnectedToAtlas && nativeDb) {
      try {
        await nativeDb.collection(this.collectionName).updateOne(filter, update);
      } catch (err) {
        console.warn(`Atlas updateOne failed on ${this.collectionName}:`, err);
      }
    }
    const items = localStore[this.collectionName] as unknown as T[];
    const idx = items.findIndex((item) => {
      for (const key of Object.keys(filter)) {
        if ((item as any)[key] !== filter[key]) return false;
      }
      return true;
    });

    if (idx !== -1) {
      const updatedFields = update.$set || update;
      items[idx] = { ...items[idx], ...updatedFields };
      saveLocalStore(localStore);
      return true;
    }
    return false;
  }

  async deleteOne(filter: any): Promise<boolean> {
    if (isConnectedToAtlas && nativeDb) {
      try {
        await nativeDb.collection(this.collectionName).deleteOne(filter);
      } catch (err) {
        console.warn(`Atlas deleteOne failed on ${this.collectionName}:`, err);
      }
    }
    const items = localStore[this.collectionName] as unknown as T[];
    const idx = items.findIndex((item) => {
      for (const key of Object.keys(filter)) {
        if ((item as any)[key] !== filter[key]) return false;
      }
      return true;
    });

    if (idx !== -1) {
      items.splice(idx, 1);
      saveLocalStore(localStore);
      return true;
    }
    return false;
  }

  async countDocuments(): Promise<number> {
    if (isConnectedToAtlas && nativeDb) {
      try {
        return await nativeDb.collection(this.collectionName).countDocuments();
      } catch (err) {
        // fallback
      }
    }
    return (localStore[this.collectionName] || []).length;
  }
}

// Export Collections
export const usersCollection = new HybridCollection<User & { passwordHash: string }>('users');
export const loginLogsCollection = new HybridCollection<LoginLog>('login_logs');
export const restaurantsCollection = new HybridCollection<Restaurant>('restaurants');
export const ordersCollection = new HybridCollection<Order>('orders');

// Initialize database connection
export async function initMongoDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim() && uri.startsWith('mongodb')) {
    try {
      console.log('Attempting connection to MongoDB Atlas / Remote Instance...');
      nativeClient = new MongoClient(uri, {
        serverSelectionTimeoutMS: 4000,
      });
      await nativeClient.connect();
      nativeDb = nativeClient.db(dbName);
      isConnectedToAtlas = true;
      console.log(`Connected to MongoDB database: "${dbName}"`);
    } catch (err: any) {
      console.warn(`Could not connect to external MongoDB: ${err.message}. Defaulting to MongoDB Local Store.`);
      isConnectedToAtlas = false;
    }
  } else {
    console.log('No MONGODB_URI provided in environment. Initializing local MongoDB document engine.');
  }

  // Seed default admin and demo users if empty
  await seedInitialUsersIfEmpty();
}

async function seedInitialUsersIfEmpty() {
  const usersCount = await usersCollection.countDocuments();
  if (usersCount === 0) {
    const salt = bcrypt.genSaltSync(10);
    const demoPasswordHash = bcrypt.hashSync('crave123', salt);

    const initialUsers: (User & { passwordHash: string })[] = [
      {
        id: 'user-admin-1',
        email: 'admin@cravery.com',
        name: 'Sarah Chen (Platform Admin)',
        phone: '+1 (555) 992-1000',
        role: 'admin',
        passwordHash: demoPasswordHash,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'user-owner-1',
        email: 'chef.marco@anticoforno.it',
        name: 'Chef Marco Rossi (L\'Antico Forno)',
        phone: '+1 (555) 234-8890',
        role: 'restaurant_owner',
        passwordHash: demoPasswordHash,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'user-customer-1',
        email: 'alex.mercer@gmail.com',
        name: 'Alex Mercer (Foodie)',
        phone: '+1 (555) 304-9811',
        role: 'customer',
        passwordHash: demoPasswordHash,
        createdAt: new Date().toISOString(),
      },
    ];

    for (const u of initialUsers) {
      await usersCollection.insertOne(u);
    }
    console.log('Seeded initial MongoDB users: admin@cravery.com, chef.marco@anticoforno.it, alex.mercer@gmail.com (Password: crave123)');

    // Seed sample initial login log
    await recordLoginLog({
      userId: 'user-admin-1',
      userEmail: 'admin@cravery.com',
      userName: 'Sarah Chen (Platform Admin)',
      role: 'admin',
      loginTimestamp: new Date(Date.now() - 3600000).toISOString(),
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      deviceType: 'Desktop (macOS)',
      status: 'success',
      sessionToken: 'tok_init_admin_sample',
    });
  }
}

// Helper: Record Login of Every User
export async function recordLoginLog(data: {
  userId?: string;
  userEmail: string;
  userName?: string;
  role?: string;
  loginTimestamp?: string;
  ipAddress: string;
  userAgent: string;
  deviceType?: string;
  status: 'success' | 'failed';
  failureReason?: string;
  sessionToken?: string;
}): Promise<LoginLog> {
  const newLog: LoginLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    userId: data.userId,
    userEmail: data.userEmail.toLowerCase(),
    userName: data.userName,
    role: data.role,
    loginTimestamp: data.loginTimestamp || new Date().toISOString(),
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    deviceType: data.deviceType || parseDeviceType(data.userAgent),
    status: data.status,
    failureReason: data.failureReason,
    sessionToken: data.sessionToken,
  };

  await loginLogsCollection.insertOne(newLog);

  // If success, update user's lastLoginAt
  if (data.status === 'success' && data.userId) {
    await usersCollection.updateOne(
      { id: data.userId },
      { $set: { lastLoginAt: newLog.loginTimestamp } }
    );
  }

  return newLog;
}

function parseDeviceType(userAgent: string): string {
  if (!userAgent) return 'Unknown Device';
  const ua = userAgent.toLowerCase();
  if (ua.includes('iphone') || ua.includes('android') && ua.includes('mobile')) {
    return 'Mobile Smartphone';
  }
  if (ua.includes('ipad') || ua.includes('tablet')) {
    return 'Tablet';
  }
  if (ua.includes('macintosh') || ua.includes('mac os')) {
    return 'Desktop (macOS)';
  }
  if (ua.includes('windows')) {
    return 'Desktop (Windows)';
  }
  if (ua.includes('linux')) {
    return 'Desktop (Linux)';
  }
  return 'Desktop Browser';
}

// Get database status info for admin dashboard
export async function getDatabaseStatusInfo(): Promise<DatabaseStatusInfo> {
  const [usersCount, logsCount, restCount, ordersCount] = await Promise.all([
    usersCollection.countDocuments(),
    loginLogsCollection.countDocuments(),
    restaurantsCollection.countDocuments(),
    ordersCollection.countDocuments(),
  ]);

  return {
    type: isConnectedToAtlas ? 'mongodb_atlas' : 'mongodb_embedded',
    status: isConnectedToAtlas ? 'connected' : 'fallback_active',
    databaseName: dbName,
    collections: [
      { name: 'users', count: usersCount },
      { name: 'login_logs', count: logsCount },
      { name: 'restaurants', count: restCount },
      { name: 'orders', count: ordersCount },
    ],
    totalLoginLogs: logsCount,
    totalUsers: usersCount,
    mongoUriConfigured: Boolean(process.env.MONGODB_URI),
  };
}
