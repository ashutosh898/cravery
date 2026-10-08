import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import {
  Restaurant,
  MenuCategory,
  MenuItem,
  Order,
  DashboardStats,
  OrderStatus,
  User,
} from './src/types.ts';
import {
  initMongoDatabase,
  usersCollection,
  loginLogsCollection,
  recordLoginLog,
  getDatabaseStatusInfo,
} from './src/db/mongo.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initial In-Memory Database Seed
const restaurants: Restaurant[] = [
  {
    id: 'rest-1',
    name: "L'Antico Forno",
    tagline: 'Authentic Woodfired Neapolitan Pizza & Trattoria',
    description: 'Slow-fermented 48-hour sourdough crusts baked at 900°F in our hand-built volcanic stone oven. Fresh buffalo mozzarella and San Marzano tomatoes sourced weekly from Campania.',
    cuisine: 'Italian & Pizza',
    rating: 4.9,
    reviewCount: 342,
    deliveryTimeMinutes: 28,
    deliveryFee: 2.99,
    minimumOrder: 15.0,
    address: '482 Via Roma, Culinary Quarter',
    phone: '+1 (555) 234-8890',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1600&q=80',
    isOpen: true,
    isFeatured: true,
    priceRange: '$$',
    createdAt: new Date().toISOString(),
    categories: [
      { id: 'cat-1-1', restaurantId: 'rest-1', name: 'Woodfired Pizzas', description: 'Neapolitan 12" sourdough pizzas', displayOrder: 1 },
      { id: 'cat-1-2', restaurantId: 'rest-1', name: 'Starters & Antipasti', description: 'Handcrafted Italian appetizers', displayOrder: 2 },
      { id: 'cat-1-3', restaurantId: 'rest-1', name: 'Handmade Pasta', description: 'Fresh extruded bronze-cut pastas', displayOrder: 3 },
      { id: 'cat-1-4', restaurantId: 'rest-1', name: 'Dolci & Drinks', description: 'Artisan desserts and beverages', displayOrder: 4 },
    ],
    items: [
      {
        id: 'item-1-1',
        restaurantId: 'rest-1',
        categoryId: 'cat-1-1',
        name: 'Margherita Verace D.O.P.',
        description: 'San Marzano D.O.P. tomatoes, fresh buffalo mozzarella, extra virgin olive oil, and fresh torn basil leaves.',
        price: 18.5,
        imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80',
        isAvailable: true,
        preparationTimeMinutes: 15,
        dietaryTags: ['vegetarian'],
        salesCount: 142,
        options: [
          {
            id: 'opt-crust',
            name: 'Crust Style',
            required: true,
            maxSelect: 1,
            choices: [
              { id: 'c-1', name: 'Classic Neapolitan Blistered', priceDelta: 0 },
              { id: 'c-2', name: 'Crispy Garlic Herb Edge', priceDelta: 1.5 },
            ],
          },
          {
            id: 'opt-addons',
            name: 'Extra Toppings',
            required: false,
            maxSelect: 3,
            choices: [
              { id: 'a-1', name: 'Double Buffalo Mozzarella', priceDelta: 3.0 },
              { id: 'a-2', name: 'Calabrian Chili Oil', priceDelta: 1.0 },
              { id: 'a-3', name: 'Arugula & Shaved Parmigiano', priceDelta: 2.5 },
            ],
          },
        ],
      },
      {
        id: 'item-1-2',
        restaurantId: 'rest-1',
        categoryId: 'cat-1-1',
        name: 'Diavola Piccante',
        description: 'San Marzano sauce, smoked fior di latte, artisanal spicy spianata calabrese salami, and hot honey drizzle.',
        price: 21.0,
        imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=600&q=80',
        isAvailable: true,
        preparationTimeMinutes: 16,
        dietaryTags: ['spicy'],
        salesCount: 98,
      },
      {
        id: 'item-1-3',
        restaurantId: 'rest-1',
        categoryId: 'cat-1-1',
        name: 'Tartufo & Wild Funghi',
        description: 'Black truffle crema base, roasted forest mushrooms, thyme, fior di latte, and micro parsley.',
        price: 23.5,
        imageUrl: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?auto=format&fit=crop&w=600&q=80',
        isAvailable: false, // Seeded as sold out to demonstrate availability management
        preparationTimeMinutes: 18,
        dietaryTags: ['vegetarian'],
        salesCount: 77,
      },
      {
        id: 'item-1-4',
        restaurantId: 'rest-1',
        categoryId: 'cat-1-2',
        name: 'Burrata Pugliese',
        description: 'Creamy 250g burrata heart served with charred heirloom cherry tomatoes, basil pesto, and grilled sourdough.',
        price: 16.0,
        imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22509?auto=format&fit=crop&w=600&q=80',
        isAvailable: true,
        preparationTimeMinutes: 10,
        dietaryTags: ['vegetarian'],
        salesCount: 65,
      },
      {
        id: 'item-1-5',
        restaurantId: 'rest-1',
        categoryId: 'cat-1-3',
        name: 'Rigatoni Cacio e Pepe',
        description: 'Bronze-die rigatoni tossed with 24-month aged Pecorino Romano and freshly cracked toasted Sarawak black peppercorns.',
        price: 19.0,
        imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d62811b5?auto=format&fit=crop&w=600&q=80',
        isAvailable: true,
        preparationTimeMinutes: 18,
        dietaryTags: ['vegetarian'],
        salesCount: 110,
      },
      {
        id: 'item-1-6',
        restaurantId: 'rest-1',
        categoryId: 'cat-1-4',
        name: 'Traditional Espresso Tiramisu',
        description: 'Savoiardi ladyfingers soaked in dark illy espresso, layered with whipped mascarpone zabaione and Valrhona cocoa.',
        price: 9.5,
        imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80',
        isAvailable: true,
        preparationTimeMinutes: 5,
        dietaryTags: ['vegetarian'],
        salesCount: 88,
      },
    ],
  },
  {
    id: 'rest-2',
    name: 'Truffle & Brioche Burger Co.',
    tagline: 'Artisanal Double-Smash Burgers & Hand-Cut Fries',
    description: 'Dry-aged prime chuck and brisket patties pressed on hot cast iron for maximum caramelized crust, tucked in toasted Japanese milk brioche.',
    cuisine: 'Gourmet Burgers',
    rating: 4.8,
    reviewCount: 412,
    deliveryTimeMinutes: 24,
    deliveryFee: 1.99,
    minimumOrder: 12.0,
    address: '114 Downtown Boulevard, Suite B',
    phone: '+1 (555) 789-3341',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1600&q=80',
    isOpen: true,
    isFeatured: true,
    priceRange: '$$',
    createdAt: new Date().toISOString(),
    categories: [
      { id: 'cat-2-1', restaurantId: 'rest-2', name: 'Signature Burgers', description: 'Double dry-aged smash patties on brioche', displayOrder: 1 },
      { id: 'cat-2-2', restaurantId: 'rest-2', name: 'Crisp Sides & Fries', description: 'Twice-cooked Belgian style fries and snacks', displayOrder: 2 },
      { id: 'cat-2-3', restaurantId: 'rest-2', name: 'Craft Shakes', description: 'Churned custard milkshakes', displayOrder: 3 },
    ],
    items: [
      {
        id: 'item-2-1',
        restaurantId: 'rest-2',
        categoryId: 'cat-2-1',
        name: 'The Black Truffle Double Smash',
        description: 'Two 3.5oz dry-aged beef patties, white truffle aioli, melted aged cave Swiss, charred caramelized balsamic onions, brioche.',
        price: 17.5,
        imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80',
        isAvailable: true,
        preparationTimeMinutes: 12,
        dietaryTags: ['halal'],
        salesCount: 220,
        options: [
          {
            id: 'opt-burger-protein',
            name: 'Patty Options',
            required: true,
            maxSelect: 1,
            choices: [
              { id: 'p-1', name: 'Standard Double Dry-Aged Beef', priceDelta: 0 },
              { id: 'p-2', name: 'Triple Patty Stack (+1 Patty)', priceDelta: 4.0 },
              { id: 'p-3', name: 'Beyond Meat Vegetarian Smash', priceDelta: 1.0 },
            ],
          },
        ],
      },
      {
        id: 'item-2-2',
        restaurantId: 'rest-2',
        categoryId: 'cat-2-1',
        name: 'Smoky Chipotle & Bacon Melt',
        description: 'Double beef smash, applewood smoked beef bacon, pepperjack cheese, crisp butterhead lettuce, smoky chipotle mayo.',
        price: 16.0,
        imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=600&q=80',
        isAvailable: true,
        preparationTimeMinutes: 12,
        dietaryTags: ['spicy', 'halal'],
        salesCount: 165,
      },
      {
        id: 'item-2-3',
        restaurantId: 'rest-2',
        categoryId: 'cat-2-2',
        name: 'Parmesan & Truffle Fries',
        description: 'Hand-cut Kennebec potatoes double-fried in peanut oil, tossed with shaved 20-month Parmigiano Reggiano, white truffle oil, and chives.',
        price: 8.5,
        imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80',
        isAvailable: true,
        preparationTimeMinutes: 8,
        dietaryTags: ['vegetarian', 'gluten_free'],
        salesCount: 310,
      },
      {
        id: 'item-2-4',
        restaurantId: 'rest-2',
        categoryId: 'cat-2-3',
        name: 'Salted Caramel Pretzel Shake',
        description: 'House-churned vanilla bean ice cream blended with salted butter caramel and crunchy butter pretzel shards.',
        price: 7.5,
        imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80',
        isAvailable: true,
        preparationTimeMinutes: 6,
        dietaryTags: ['vegetarian'],
        salesCount: 84,
      },
    ],
  },
  {
    id: 'rest-3',
    name: 'Hokkaido Ramen & Izakaya',
    tagline: 'Authentic 18-Hour Tonkotsu Broth & Hand-Rolled Sushi',
    description: 'Traditional Sapporo craftsmanship with springy curly noodles, rich collagen broth, and melt-in-mouth slow-braised chashu pork shoulder.',
    cuisine: 'Japanese & Ramen',
    rating: 4.9,
    reviewCount: 520,
    deliveryTimeMinutes: 32,
    deliveryFee: 3.49,
    minimumOrder: 18.0,
    address: '89 Sakura Lane, East Arts District',
    phone: '+1 (555) 901-4472',
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=1600&q=80',
    isOpen: true,
    isFeatured: true,
    priceRange: '$$$',
    createdAt: new Date().toISOString(),
    categories: [
      { id: 'cat-3-1', restaurantId: 'rest-3', name: 'Ramen & Noodles', description: 'Simmered 18 hours broth with artisanal noodles', displayOrder: 1 },
      { id: 'cat-3-2', restaurantId: 'rest-3', name: 'Nigiri & Rolls', description: 'Wild-caught fresh sashimi and sushi rolls', displayOrder: 2 },
      { id: 'cat-3-3', restaurantId: 'rest-3', name: 'Small Izakaya Plates', description: 'Shareable appetizers and crispy bites', displayOrder: 3 },
    ],
    items: [
      {
        id: 'item-3-1',
        restaurantId: 'rest-3',
        categoryId: 'cat-3-1',
        name: 'Signature Sapporo Miso Tonkotsu',
        description: 'Rich tonkotsu broth emulsified with roasted Hokkaido red miso, slow-braised chashu pork, seasoned ajitsuke tamago, sweet butter corn, menma, scallions.',
        price: 19.5,
        imageUrl: 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&w=600&q=80',
        isAvailable: true,
        preparationTimeMinutes: 18,
        dietaryTags: [],
        salesCount: 310,
        options: [
          {
            id: 'opt-spice-ramen',
            name: 'Spice Level',
            required: true,
            maxSelect: 1,
            choices: [
              { id: 'sp-0', name: 'Mild / Original Rich', priceDelta: 0 },
              { id: 'sp-1', name: 'Medium Chili Garlic (+1 Chili)', priceDelta: 0 },
              { id: 'sp-2', name: 'Fiery Habanero Chili Bomb', priceDelta: 1.0 },
            ],
          },
        ],
      },
      {
        id: 'item-3-2',
        restaurantId: 'rest-3',
        categoryId: 'cat-3-1',
        name: 'Truffle Mushroom Vegan Ramen',
        description: 'Silky shiitake, kombu, and roasted vegetable dashi broth, organic wave noodles, king oyster mushrooms, pak choi, sesame oil.',
        price: 18.0,
        imageUrl: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=600&q=80',
        isAvailable: true,
        preparationTimeMinutes: 15,
        dietaryTags: ['vegan', 'vegetarian'],
        salesCount: 140,
      },
      {
        id: 'item-3-3',
        restaurantId: 'rest-3',
        categoryId: 'cat-3-2',
        name: 'Torched Salmon Aburi Roll (8pcs)',
        description: 'Atlantic salmon torched with Japanese kewpie mayo, unagi tare, avocado, cucumber, and crisp tobiko pearls.',
        price: 16.5,
        imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80',
        isAvailable: true,
        preparationTimeMinutes: 14,
        dietaryTags: ['halal'],
        salesCount: 180,
      },
      {
        id: 'item-3-4',
        restaurantId: 'rest-3',
        categoryId: 'cat-3-3',
        name: 'Crispy Pork & Leek Gyoza (6pcs)',
        description: 'Pan-fried handmade dumplings with crispy winged lace bottom, served with black vinegar and scallion rayu dip.',
        price: 9.0,
        imageUrl: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=600&q=80',
        isAvailable: true,
        preparationTimeMinutes: 10,
        dietaryTags: [],
        salesCount: 195,
      },
    ],
  },
  {
    id: 'rest-4',
    name: 'Verde Harvest Bowls',
    tagline: 'Organic Grain Bowls, Cold-Pressed Juices & Superfoods',
    description: 'Clean eating redefined. Seasonal farm-fresh organic greens, ancient sprouted grains, warm proteins, and dressings made from scratch without refined sugars.',
    cuisine: 'Healthy & Bowls',
    rating: 4.7,
    reviewCount: 189,
    deliveryTimeMinutes: 20,
    deliveryFee: 1.49,
    minimumOrder: 10.0,
    address: '22 Eco Plaza, Green Corridor',
    phone: '+1 (555) 432-1102',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1600&q=80',
    isOpen: true,
    isFeatured: false,
    priceRange: '$$',
    createdAt: new Date().toISOString(),
    categories: [
      { id: 'cat-4-1', restaurantId: 'rest-4', name: 'Warm Grain Bowls', description: 'Nutrient-rich ancient grains & warm proteins', displayOrder: 1 },
      { id: 'cat-4-2', restaurantId: 'rest-4', name: 'Fresh Green Salads', description: 'Crisp field greens and house vinaigrettes', displayOrder: 2 },
      { id: 'cat-4-3', restaurantId: 'rest-4', name: 'Cold-Pressed Juices', description: '100% raw unpasteurized botanical tonics', displayOrder: 3 },
    ],
    items: [
      {
        id: 'item-4-1',
        restaurantId: 'rest-4',
        categoryId: 'cat-4-1',
        name: 'Miso Glazed Salmon Quinoa Bowl',
        description: 'Wild Alaskan salmon fillet, tri-color quinoa, roasted broccoli, pickled purple cabbage, edamame, and ginger miso drizzle.',
        price: 18.5,
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
        isAvailable: true,
        preparationTimeMinutes: 12,
        dietaryTags: ['gluten_free', 'dairy_free', 'halal'],
        salesCount: 160,
      },
      {
        id: 'item-4-2',
        restaurantId: 'rest-4',
        categoryId: 'cat-4-1',
        name: 'Roasted Harissa Tofu Rainbow Bowl',
        description: 'Organic spiced crispy tofu, sweet potato cubes, avocado mash, black lentils, massaged kale, creamy lemon tahini sauce.',
        price: 15.5,
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
        isAvailable: true,
        preparationTimeMinutes: 10,
        dietaryTags: ['vegan', 'vegetarian', 'gluten_free'],
        salesCount: 115,
      },
      {
        id: 'item-4-3',
        restaurantId: 'rest-4',
        categoryId: 'cat-4-3',
        name: 'Immunity Gold Cold-Pressed Elixir',
        description: 'Fresh organic turmeric root, cold-pressed Valencia orange, Peruvian ginger, raw wildflower honey, and black pepper oil.',
        price: 6.5,
        imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80',
        isAvailable: true,
        preparationTimeMinutes: 2,
        dietaryTags: ['gluten_free', 'vegetarian'],
        salesCount: 140,
      },
    ],
  },
];

// In-Memory Orders
const orders: Order[] = [
  {
    id: 'ord-1001',
    orderNumber: '#CRV-8941',
    restaurantId: 'rest-1',
    restaurantName: "L'Antico Forno",
    items: [
      {
        itemId: 'item-1-1',
        name: 'Margherita Verace D.O.P.',
        price: 18.5,
        quantity: 2,
        optionsSummary: 'Classic Neapolitan Blistered',
        itemTotal: 37.0,
      },
      {
        itemId: 'item-1-4',
        name: 'Burrata Pugliese',
        price: 16.0,
        quantity: 1,
        itemTotal: 16.0,
      },
    ],
    subtotal: 53.0,
    deliveryFee: 2.99,
    tip: 5.0,
    discount: 5.0,
    promoCode: 'CRAVE5',
    total: 55.99,
    customerName: 'Alex Mercer',
    customerPhone: '+1 (555) 304-9811',
    deliveryAddress: '742 Evergreen Terrace, Apt 4B',
    deliveryNotes: 'Leave on porch table, please do not ring doorbell.',
    paymentMethod: 'card',
    status: 'on_the_way',
    createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    estimatedDeliveryMinutes: 10,
  },
];

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Initialize MongoDB database connection & collections
  await initMongoDatabase().catch((err) => {
    console.error('MongoDB initialization warning:', err);
  });

  // -------------------------------------------------------------
  // REST API: MONGODB USER AUTHENTICATION & LOGIN LOGGING
  // -------------------------------------------------------------

  // User Registration
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { email, password, name, phone, role } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
      }

      const existingUser = await usersCollection.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
        return res.status(400).json({ error: 'An account with this email already exists' });
      }

      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);
      const userId = `user-${Date.now()}`;
      const newUser: User = {
        id: userId,
        email: email.toLowerCase().trim(),
        name: name.trim(),
        phone: phone ? phone.trim() : '+1 (555) 000-0000',
        role: role === 'admin' || role === 'restaurant_owner' ? role : 'customer',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      await usersCollection.insertOne({ ...newUser, passwordHash });

      // Automatically log initial login record for new user
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown Browser';
      const sessionToken = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      await recordLoginLog({
        userId: newUser.id,
        userEmail: newUser.email,
        userName: newUser.name,
        role: newUser.role,
        ipAddress: ip,
        userAgent,
        status: 'success',
        sessionToken,
      });

      res.status(201).json({
        user: newUser,
        sessionToken,
        message: 'Account registered and logged in successfully',
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      res.status(500).json({ error: 'Failed to register account' });
    }
  });

  // User Login (Stores login data of every user in MongoDB)
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';

    if (!email || !password) {
      await recordLoginLog({
        userEmail: email ? email.toLowerCase().trim() : 'unknown',
        ipAddress: ip,
        userAgent,
        status: 'failed',
        failureReason: 'Missing email or password in request',
      });
      return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
      const userDoc = await usersCollection.findOne({ email: email.toLowerCase().trim() });

      if (!userDoc) {
        // Record failed attempt in MongoDB
        await recordLoginLog({
          userEmail: email.toLowerCase().trim(),
          ipAddress: ip,
          userAgent,
          status: 'failed',
          failureReason: 'User not found in MongoDB database',
        });
        return res.status(401).json({ error: 'No account found with this email' });
      }

      // Verify bcrypt password hash
      const isPasswordValid = bcrypt.compareSync(password, userDoc.passwordHash);

      if (!isPasswordValid) {
        // Record failed password attempt in MongoDB
        await recordLoginLog({
          userId: userDoc.id,
          userEmail: userDoc.email,
          userName: userDoc.name,
          role: userDoc.role,
          ipAddress: ip,
          userAgent,
          status: 'failed',
          failureReason: 'Incorrect password provided',
        });
        return res.status(401).json({ error: 'Incorrect password' });
      }

      // Successful Login: Generate session token and store in MongoDB
      const sessionToken = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      await recordLoginLog({
        userId: userDoc.id,
        userEmail: userDoc.email,
        userName: userDoc.name,
        role: userDoc.role,
        ipAddress: ip,
        userAgent,
        status: 'success',
        sessionToken,
      });

      const { passwordHash: _, ...safeUser } = userDoc;
      res.json({
        user: safeUser,
        sessionToken,
        message: 'Login successful and logged in MongoDB',
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login process error' });
    }
  });

  // Get all login logs from MongoDB
  app.get('/api/auth/login-logs', async (req: Request, res: Response) => {
    try {
      const { email, status, limit } = req.query;
      let logs = await loginLogsCollection.find({});

      if (email && typeof email === 'string') {
        logs = logs.filter((l) => l.userEmail.toLowerCase().includes(email.toLowerCase()));
      }
      if (status && typeof status === 'string' && status !== 'all') {
        logs = logs.filter((l) => l.status === status);
      }

      // Sort newest first
      logs.sort((a, b) => new Date(b.loginTimestamp).getTime() - new Date(a.loginTimestamp).getTime());

      const max = Number(limit) || 100;
      res.json(logs.slice(0, max));
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch login logs from MongoDB' });
    }
  });

  // Get all registered users from MongoDB
  app.get('/api/auth/users', async (_req: Request, res: Response) => {
    try {
      const users = await usersCollection.find({});
      const safeUsers = users.map(({ passwordHash: _, ...u }) => u);
      res.json(safeUsers);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch users from MongoDB' });
    }
  });

  // Get MongoDB database status & diagnostics
  app.get('/api/database/status', async (_req: Request, res: Response) => {
    try {
      const statusInfo = await getDatabaseStatusInfo();
      res.json(statusInfo);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to inspect MongoDB status' });
    }
  });

  // -------------------------------------------------------------
  // REST API: RESTAURANTS
  // -------------------------------------------------------------

  // List all restaurants with optional query / filter
  app.get('/api/restaurants', (req: Request, res: Response) => {
    const { cuisine, search, openOnly } = req.query;
    let results = [...restaurants];

    if (cuisine && typeof cuisine === 'string' && cuisine !== 'all') {
      results = results.filter((r) =>
        r.cuisine.toLowerCase().includes(cuisine.toLowerCase())
      );
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.toLowerCase().trim();
      results = results.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.cuisine.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.items.some((item) =>
            item.name.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q)
          )
      );
    }

    if (openOnly === 'true') {
      results = results.filter((r) => r.isOpen);
    }

    res.json(results);
  });

  // Get single restaurant by ID (includes categories and items)
  app.get('/api/restaurants/:id', (req: Request, res: Response) => {
    const restaurant = restaurants.find((r) => r.id === req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    res.json(restaurant);
  });

  // Create new restaurant
  app.post('/api/restaurants', (req: Request, res: Response) => {
    const {
      name,
      tagline,
      description,
      cuisine,
      deliveryTimeMinutes,
      deliveryFee,
      minimumOrder,
      address,
      phone,
      imageUrl,
      bannerUrl,
      priceRange,
    } = req.body;

    if (!name || !cuisine) {
      return res.status(400).json({ error: 'Restaurant name and cuisine are required' });
    }

    const newRestaurant: Restaurant = {
      id: `rest-${Date.now()}`,
      name: name.trim(),
      tagline: tagline ? tagline.trim() : 'Artisanal dining experience',
      description: description ? description.trim() : 'Delicious cuisine made fresh to order.',
      cuisine: cuisine.trim(),
      rating: 5.0,
      reviewCount: 1,
      deliveryTimeMinutes: Number(deliveryTimeMinutes) || 30,
      deliveryFee: Number(deliveryFee) || 2.99,
      minimumOrder: Number(minimumOrder) || 10.0,
      address: address ? address.trim() : '100 Gourmet Way',
      phone: phone ? phone.trim() : '+1 (555) 123-4567',
      imageUrl:
        imageUrl && imageUrl.trim()
          ? imageUrl.trim()
          : 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      bannerUrl:
        bannerUrl && bannerUrl.trim()
          ? bannerUrl.trim()
          : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80',
      isOpen: true,
      isFeatured: false,
      priceRange: priceRange || '$$',
      categories: [
        {
          id: `cat-${Date.now()}-1`,
          restaurantId: `rest-${Date.now()}`,
          name: 'Main Courses',
          description: 'Chef signature selections',
          displayOrder: 1,
        },
      ],
      items: [],
      createdAt: new Date().toISOString(),
    };

    restaurants.unshift(newRestaurant);
    res.status(201).json(newRestaurant);
  });

  // Update restaurant details
  app.put('/api/restaurants/:id', (req: Request, res: Response) => {
    const index = restaurants.findIndex((r) => r.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const current = restaurants[index];
    const updated: Restaurant = {
      ...current,
      ...req.body,
      id: current.id, // cannot overwrite ID
      categories: current.categories,
      items: current.items,
    };

    restaurants[index] = updated;
    res.json(updated);
  });

  // Toggle restaurant open/closed status
  app.patch('/api/restaurants/:id/toggle-status', (req: Request, res: Response) => {
    const restaurant = restaurants.find((r) => r.id === req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    restaurant.isOpen = !restaurant.isOpen;
    res.json({ id: restaurant.id, isOpen: restaurant.isOpen });
  });

  // Delete restaurant
  app.delete('/api/restaurants/:id', (req: Request, res: Response) => {
    const index = restaurants.findIndex((r) => r.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    const removed = restaurants.splice(index, 1);
    res.json({ success: true, removedId: removed[0].id });
  });

  // -------------------------------------------------------------
  // REST API: MENU CATEGORIES
  // -------------------------------------------------------------

  // Add category to restaurant
  app.post('/api/restaurants/:id/categories', (req: Request, res: Response) => {
    const restaurant = restaurants.find((r) => r.id === req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const newCategory: MenuCategory = {
      id: `cat-${Date.now()}`,
      restaurantId: restaurant.id,
      name: name.trim(),
      description: description ? description.trim() : '',
      displayOrder: restaurant.categories.length + 1,
    };

    restaurant.categories.push(newCategory);
    res.status(201).json(newCategory);
  });

  // Update category
  app.put('/api/restaurants/:id/categories/:catId', (req: Request, res: Response) => {
    const restaurant = restaurants.find((r) => r.id === req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const category = restaurant.categories.find((c) => c.id === req.params.catId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (req.body.name) category.name = req.body.name.trim();
    if (req.body.description !== undefined) category.description = req.body.description.trim();
    if (req.body.displayOrder !== undefined) category.displayOrder = Number(req.body.displayOrder);

    res.json(category);
  });

  // Delete category
  app.delete('/api/restaurants/:id/categories/:catId', (req: Request, res: Response) => {
    const restaurant = restaurants.find((r) => r.id === req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const catIndex = restaurant.categories.findIndex((c) => c.id === req.params.catId);
    if (catIndex === -1) {
      return res.status(404).json({ error: 'Category not found' });
    }

    restaurant.categories.splice(catIndex, 1);
    // Remove or unassign items belonging to this category
    restaurant.items = restaurant.items.filter((item) => item.categoryId !== req.params.catId);

    res.json({ success: true, deletedCatId: req.params.catId });
  });

  // -------------------------------------------------------------
  // REST API: MENU ITEMS & AVAILABILITY MANAGEMENT
  // -------------------------------------------------------------

  // Add menu item to restaurant
  app.post('/api/restaurants/:id/items', (req: Request, res: Response) => {
    const restaurant = restaurants.find((r) => r.id === req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const {
      name,
      description,
      price,
      categoryId,
      imageUrl,
      isAvailable,
      preparationTimeMinutes,
      dietaryTags,
      options,
    } = req.body;

    if (!name || price === undefined || !categoryId) {
      return res.status(400).json({ error: 'Name, price, and categoryId are required' });
    }

    const newItem: MenuItem = {
      id: `item-${Date.now()}`,
      restaurantId: restaurant.id,
      categoryId,
      name: name.trim(),
      description: description ? description.trim() : '',
      price: Number(price) >= 0 ? Number(price) : 0,
      imageUrl:
        imageUrl && imageUrl.trim()
          ? imageUrl.trim()
          : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      preparationTimeMinutes: Number(preparationTimeMinutes) || 15,
      dietaryTags: Array.isArray(dietaryTags) ? dietaryTags : [],
      options: Array.isArray(options) ? options : [],
      salesCount: 0,
    };

    restaurant.items.push(newItem);
    res.status(201).json(newItem);
  });

  // Update entire menu item
  app.put('/api/restaurants/:id/items/:itemId', (req: Request, res: Response) => {
    const restaurant = restaurants.find((r) => r.id === req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const itemIndex = restaurant.items.findIndex((item) => item.id === req.params.itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    const currentItem = restaurant.items[itemIndex];
    const updatedItem: MenuItem = {
      ...currentItem,
      ...req.body,
      id: currentItem.id, // prevent ID override
      restaurantId: restaurant.id,
      price: req.body.price !== undefined ? Number(req.body.price) : currentItem.price,
      preparationTimeMinutes:
        req.body.preparationTimeMinutes !== undefined
          ? Number(req.body.preparationTimeMinutes)
          : currentItem.preparationTimeMinutes,
    };

    restaurant.items[itemIndex] = updatedItem;
    res.json(updatedItem);
  });

  // Toggle menu item availability (In Stock / Sold Out)
  app.patch('/api/restaurants/:id/items/:itemId/availability', (req: Request, res: Response) => {
    const restaurant = restaurants.find((r) => r.id === req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const item = restaurant.items.find((i) => i.id === req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    if (req.body.isAvailable !== undefined) {
      item.isAvailable = Boolean(req.body.isAvailable);
    } else {
      item.isAvailable = !item.isAvailable;
    }

    res.json({
      id: item.id,
      name: item.name,
      isAvailable: item.isAvailable,
      message: item.isAvailable
        ? `"${item.name}" is now marked IN STOCK`
        : `"${item.name}" is now marked SOLD OUT`,
    });
  });

  // Delete menu item
  app.delete('/api/restaurants/:id/items/:itemId', (req: Request, res: Response) => {
    const restaurant = restaurants.find((r) => r.id === req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const itemIndex = restaurant.items.findIndex((i) => i.id === req.params.itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    const deleted = restaurant.items.splice(itemIndex, 1);
    res.json({ success: true, deletedItemId: deleted[0].id });
  });

  // -------------------------------------------------------------
  // REST API: ORDERS & LIVE TRACKING
  // -------------------------------------------------------------

  // List all orders (optionally filter by restaurantId)
  app.get('/api/orders', (req: Request, res: Response) => {
    const { restaurantId } = req.query;
    if (restaurantId && typeof restaurantId === 'string') {
      return res.json(orders.filter((o) => o.restaurantId === restaurantId));
    }
    res.json(orders);
  });

  // Get order by ID
  app.get('/api/orders/:id', (req: Request, res: Response) => {
    const order = orders.find((o) => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  });

  // Place a new order
  app.post('/api/orders', (req: Request, res: Response) => {
    const {
      restaurantId,
      items,
      subtotal,
      deliveryFee,
      tip,
      discount,
      promoCode,
      total,
      customerName,
      customerPhone,
      deliveryAddress,
      deliveryNotes,
      paymentMethod,
    } = req.body;

    const restaurant = restaurants.find((r) => r.id === restaurantId);
    if (!restaurant) {
      return res.status(400).json({ error: 'Invalid restaurant ID' });
    }

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Order must contain items' });
    }

    // Verify item availability at time of ordering
    const unavailableItems = items.filter((orderItem: any) => {
      const match = restaurant.items.find((item) => item.id === orderItem.itemId);
      return match && !match.isAvailable;
    });

    if (unavailableItems.length > 0) {
      return res.status(400).json({
        error: `Some items in your cart are currently sold out: ${unavailableItems
          .map((i: any) => i.name)
          .join(', ')}`,
      });
    }

    // Increment sales count for ordered items
    items.forEach((orderItem: any) => {
      const match = restaurant.items.find((item) => item.id === orderItem.itemId);
      if (match) {
        match.salesCount = (match.salesCount || 0) + (orderItem.quantity || 1);
      }
    });

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `#CRV-${Math.floor(1000 + Math.random() * 9000)}`,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      items,
      subtotal: Number(subtotal) || 0,
      deliveryFee: Number(deliveryFee) || 0,
      tip: Number(tip) || 0,
      discount: Number(discount) || 0,
      promoCode,
      total: Number(total) || 0,
      customerName: customerName || 'Valued Customer',
      customerPhone: customerPhone || '+1 (555) 000-0000',
      deliveryAddress: deliveryAddress || '123 Main Street',
      deliveryNotes,
      paymentMethod: paymentMethod || 'card',
      status: 'placed',
      createdAt: new Date().toISOString(),
      estimatedDeliveryMinutes: restaurant.deliveryTimeMinutes || 30,
    };

    orders.unshift(newOrder);
    res.status(201).json(newOrder);
  });

  // Update order status (Kitchen/Driver progression)
  app.patch('/api/orders/:id/status', (req: Request, res: Response) => {
    const order = orders.find((o) => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const { status } = req.body;
    const validStatuses: OrderStatus[] = [
      'placed',
      'confirmed',
      'preparing',
      'on_the_way',
      'delivered',
      'cancelled',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status' });
    }

    order.status = status;
    res.json(order);
  });

  // -------------------------------------------------------------
  // REST API: DASHBOARD STATS
  // -------------------------------------------------------------

  app.get('/api/stats', (_req: Request, res: Response) => {
    let totalMenuItems = 0;
    let activeItemsCount = 0;
    let soldOutItemsCount = 0;

    restaurants.forEach((r) => {
      r.items.forEach((item) => {
        totalMenuItems++;
        if (item.isAvailable) {
          activeItemsCount++;
        } else {
          soldOutItemsCount++;
        }
      });
    });

    const totalRevenue = orders.reduce((acc, curr) => acc + (curr.total || 0), 0);
    const activeOrdersCount = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length;

    const stats: DashboardStats = {
      totalRestaurants: restaurants.length,
      totalMenuItems,
      activeItemsCount,
      soldOutItemsCount,
      totalOrders: orders.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      activeOrdersCount,
    };

    res.json(stats);
  });

  // -------------------------------------------------------------
  // VITE & STATIC FILES SERVING
  // -------------------------------------------------------------

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Food Delivery Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
