import bcrypt from 'bcryptjs';

import { slugify } from '../src/utils/slugify.js';

export const categories = [
  { name: 'Vehicles', slug: 'vehicles' },
  { name: 'Real Estate', slug: 'real-estate' },
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Home & Garden', slug: 'home-garden' },
  { name: 'Fashion', slug: 'fashion' },
  { name: 'Jobs', slug: 'jobs' },
  { name: 'Services', slug: 'services' },
  { name: 'Pets', slug: 'pets' }
];

const sampleUsers = [
  { name: 'أحمد خالد', email: 'ahmed.khaled@example.com', bio: 'أحب بيع السيارات النظيفة والأجهزة العملية بأسعار مناسبة.' },
  { name: 'محمد ياسين', email: 'mohamed.yaseen@example.com', bio: 'مهتم بالعقار والإعلانات الجادة داخل المدن الكبيرة.' },
  { name: 'لينا سمير', email: 'lina.sameer@example.com', bio: 'أعرض منتجات منزلية مختارة وقطع ديكور بحالة ممتازة.' },
  { name: 'نور علي', email: 'nour.ali@example.com', bio: 'أعمل في بيع الإلكترونيات والإكسسوارات مع وصف واضح لكل منتج.' },
  { name: 'سارة محمود', email: 'sara.mahmoud@example.com', bio: 'أحب الموضة والمنتجات العملية المناسبة للاستخدام اليومي.' },
  { name: 'يزن الخطيب', email: 'yazan.khateeb@example.com', bio: 'أقدم خدمات وصيانة وإعلانات موثوقة للعملاء المحليين.' },
  { name: 'ريم أحمد', email: 'reem.ahmad@example.com', bio: 'أهتم بالحيوانات الأليفة وبعرض مستلزماتها بشكل مهني.' },
  { name: 'كريم ناصر', email: 'karim.nasser@example.com', bio: 'أتابع فرص العمل والخدمات المهنية والإعلانات الواضحة.' },
  { name: 'هبة فؤاد', email: 'hiba.fouad@example.com', bio: 'أحب الإعلانات المرتبة للمنزل والحديقة والمنتجات النسائية.' },
  { name: 'عمر السالم', email: 'omar.alsalem@example.com', bio: 'أعرض مركبات مستعملة بحالة جيدة مع تفاصيل دقيقة.' },
  { name: 'جود حسام', email: 'joud.hossam@example.com', bio: 'أبيع أجهزة وتقنيات مستخدمة بشكل خفيف وبأسعار عادلة.' },
  { name: 'دانا شريف', email: 'dana.sharif@example.com', bio: 'أركز على العقار والخدمات المنزلية مع تواصل سريع.' }
];

const samplePosts = [
  {
    ownerEmail: 'omar.alsalem@example.com',
    categorySlug: 'vehicles',
    title: 'تويوتا كورولا 2018 بحالة ممتازة',
    description: 'سيارة اقتصادية ونظيفة، عداد معتدل، صيانة دورية منتظمة، المكيف بارد والاستمارة سارية.',
    price: 48500,
    country: 'SA',
    city: 'Riyadh',
    status: 'ACTIVE'
  },
  {
    ownerEmail: 'ahmed.khaled@example.com',
    categorySlug: 'vehicles',
    title: 'دراجة سكوتر عملية للتنقل اليومي',
    description: 'سكوتر اقتصادي مناسب للمشاوير القصيرة داخل المدينة، تشغيل سهل واستهلاك منخفض.',
    price: 6200,
    country: 'JO',
    city: 'Amman',
    status: 'SOLD'
  },
  {
    ownerEmail: 'mohamed.yaseen@example.com',
    categorySlug: 'real-estate',
    title: 'شقة مفروشة للإيجار في عمّان الغربية',
    description: 'شقة مرتبة من غرفتين وصالة مع مطبخ مجهز بالكامل وموقف سيارة وقريبة من الخدمات.',
    price: 540,
    country: 'JO',
    city: 'Amman',
    status: 'ACTIVE'
  },
  {
    ownerEmail: 'dana.sharif@example.com',
    categorySlug: 'real-estate',
    title: 'مكتب جاهز للإيجار في دبي مارينا',
    description: 'مكتب مشطب بتقسيم عملي ومكيفات مركزية ومدخل أنيق مناسب للشركات الصغيرة والمتوسطة.',
    price: 8200,
    country: 'AE',
    city: 'Dubai',
    status: 'ACTIVE'
  },
  {
    ownerEmail: 'nour.ali@example.com',
    categorySlug: 'electronics',
    title: 'آيفون 13 برو 256 جيجا نظيف جداً',
    description: 'الجهاز استخدام شخصي، البطارية ممتازة، بدون صيانة، مع الكرتون الأصلي وكفر حماية.',
    price: 2550,
    country: 'SA',
    city: 'Jeddah',
    status: 'ACTIVE'
  },
  {
    ownerEmail: 'joud.hossam@example.com',
    categorySlug: 'electronics',
    title: 'لابتوب ديل للأعمال i7 مع SSD',
    description: 'مناسب للدوام والدراسة، شاشة واضحة، رام 16 جيجا، وقرص سريع لتحميل البرامج بسلاسة.',
    price: 3100,
    country: 'EG',
    city: 'Cairo',
    status: 'ACTIVE'
  },
  {
    ownerEmail: 'lina.sameer@example.com',
    categorySlug: 'home-garden',
    title: 'طاولة طعام خشب طبيعي مع 6 كراس',
    description: 'طقم مرتب بحالة ممتازة، مناسب للعائلات، اللون هادئ والخشب متين ولم يتعرض للإصلاح.',
    price: 1800,
    country: 'SY',
    city: 'Damascus',
    status: 'ACTIVE'
  },
  {
    ownerEmail: 'hiba.fouad@example.com',
    categorySlug: 'home-garden',
    title: 'جلسة حديقة خارجية مقاومة للعوامل',
    description: 'جلسة من أربع قطع مع طاولة وسط، مناسبة للشرفات والحدائق الصغيرة والاستخدام اليومي.',
    price: 950,
    country: 'LB',
    city: 'Beirut',
    status: 'ACTIVE'
  },
  {
    ownerEmail: 'sara.mahmoud@example.com',
    categorySlug: 'fashion',
    title: 'فستان سهرة أنيق مقاس M',
    description: 'فستان بتفصيل ناعم ولون هادئ، استُخدم مرة واحدة فقط ومناسب للمناسبات المسائية.',
    price: 420,
    country: 'AE',
    city: 'Sharjah',
    status: 'ACTIVE'
  },
  {
    ownerEmail: 'hiba.fouad@example.com',
    categorySlug: 'fashion',
    title: 'عباية عملية بتطريز خفيف',
    description: 'عباية مريحة للخروج اليومي مع قماش ممتاز وتفصيل مرتب وسحاب داخلي متين.',
    price: 260,
    country: 'SA',
    city: 'Dammam',
    status: 'ACTIVE'
  },
  {
    ownerEmail: 'karim.nasser@example.com',
    categorySlug: 'jobs',
    title: 'مطلوب مندوب مبيعات لمعرض هواتف',
    description: 'العمل بدوام كامل، يشترط اللباقة ومعرفة أساسية بالهواتف الذكية، والراتب مع عمولة مجزية.',
    price: 4200,
    country: 'SA',
    city: 'Riyadh',
    status: 'ACTIVE'
  },
  {
    ownerEmail: 'dana.sharif@example.com',
    categorySlug: 'jobs',
    title: 'فرصة عمل لمصمم جرافيك عن بعد',
    description: 'نبحث عن مصمم لديه حس بصري قوي وخبرة في تصميم السوشال ميديا والهوية البصرية.',
    price: 3500,
    country: 'EG',
    city: 'Alexandria',
    status: 'ACTIVE'
  },
  {
    ownerEmail: 'yazan.khateeb@example.com',
    categorySlug: 'services',
    title: 'خدمة صيانة مكيفات للمنازل والمكاتب',
    description: 'تنظيف وفحص وشحن غاز مع التزام بالمواعيد وتقرير واضح عن حالة الجهاز بعد الصيانة.',
    price: 120,
    country: 'JO',
    city: 'Zarqa',
    status: 'ACTIVE'
  },
  {
    ownerEmail: 'karim.nasser@example.com',
    categorySlug: 'services',
    title: 'تصميم هوية بصرية للشركات الناشئة',
    description: 'يشمل الشعار والألوان والخطوط وقوالب أساسية للسوشال ميديا بطريقة مرتبة واحترافية.',
    price: 900,
    country: 'AE',
    city: 'Abu Dhabi',
    status: 'ACTIVE'
  },
  {
    ownerEmail: 'reem.ahmad@example.com',
    categorySlug: 'pets',
    title: 'قط شيرازي مطعّم ويحب الأطفال',
    description: 'قط هادئ ونظيف، متعود على اللتر بوكس، ومعه دفتر التطعيم وبعض المستلزمات الأساسية.',
    price: 650,
    country: 'SY',
    city: 'Latakia',
    status: 'ACTIVE'
  },
  {
    ownerEmail: 'reem.ahmad@example.com',
    categorySlug: 'pets',
    title: 'ببغاء كاسكو أليف مع القفص',
    description: 'الطير نشيط ويتفاعل مع الناس، القفص نظيف ومناسب، ويباع مع الأكل وبعض الألعاب.',
    price: 1750,
    country: 'EG',
    city: 'Cairo',
    status: 'ACTIVE'
  },
  {
    ownerEmail: 'joud.hossam@example.com',
    categorySlug: 'electronics',
    title: 'شاشة ألعاب 27 بوصة 165 هرتز',
    description: 'مناسبة للألعاب والعمل، الألوان ممتازة، ولا يوجد بها نقاط ميتة أو مشاكل تشغيل.',
    price: 980,
    country: 'SA',
    city: 'Jeddah',
    status: 'ACTIVE'
  },
  {
    ownerEmail: 'ahmed.khaled@example.com',
    categorySlug: 'vehicles',
    title: 'هيونداي إلنترا 2017 استخدام عائلي',
    description: 'سيارة استخدام عائلي، الهيكل جيد، الماكينة ممتازة، ومناسبة لمن يبحث عن سيارة عملية.',
    price: 39200,
    country: 'SY',
    city: 'Aleppo',
    status: 'ACTIVE'
  },
  {
    ownerEmail: 'mohamed.yaseen@example.com',
    categorySlug: 'real-estate',
    title: 'استوديو مفروش للإيجار الشهري في القاهرة الجديدة',
    description: 'استوديو مرتب ومكيف وقريب من الخدمات الأساسية، مناسب لشخص واحد أو زوجين.',
    price: 7800,
    country: 'EG',
    city: 'Cairo',
    status: 'ACTIVE'
  },
  {
    ownerEmail: 'lina.sameer@example.com',
    categorySlug: 'home-garden',
    title: 'مكيف سبليت 24 ألف وحدة استعمال خفيف',
    description: 'المكيف يعمل بكفاءة عالية وتم تنظيفه مؤخراً، مناسب لغرفة كبيرة أو صالة متوسطة.',
    price: 1350,
    country: 'SA',
    city: 'Dammam',
    status: 'ACTIVE'
  },
  {
    ownerEmail: 'sara.mahmoud@example.com',
    categorySlug: 'fashion',
    title: 'حقيبة نسائية جلد عملي لون عسلي',
    description: 'حقيبة يومية واسعة مع تقسيم داخلي مرتب وجودة خياطة ممتازة واستخدام خفيف.',
    price: 210,
    country: 'JO',
    city: 'Irbid',
    status: 'ACTIVE'
  },
  {
    ownerEmail: 'karim.nasser@example.com',
    categorySlug: 'jobs',
    title: 'مطلوب موظف خدمة عملاء لمتجر إلكتروني',
    description: 'الوظيفة بدوام جزئي مع مهام متابعة الطلبات والرد على العملاء عبر الهاتف والواتساب.',
    price: 2600,
    country: 'AE',
    city: 'Dubai',
    status: 'ACTIVE'
  },
  {
    ownerEmail: 'yazan.khateeb@example.com',
    categorySlug: 'services',
    title: 'خدمة تصوير منتجات للمطاعم والمتاجر',
    description: 'تصوير احترافي بإضاءة مناسبة وتسليم سريع للصور الجاهزة للنشر على المنصات المختلفة.',
    price: 450,
    country: 'LB',
    city: 'Beirut',
    status: 'ACTIVE'
  },
  {
    ownerEmail: 'reem.ahmad@example.com',
    categorySlug: 'pets',
    title: 'مستلزمات كاملة لجرو صغير بحالة ممتازة',
    description: 'مجموعة تشمل سرير وأوعية وألعاب وحزام مشي، جميع القطع نظيفة ومستخدمة لفترة قصيرة.',
    price: 180,
    country: 'SY',
    city: 'Homs',
    status: 'ACTIVE'
  }
];

const normalizeEmail = (value) => value?.trim().toLowerCase();

const ensureUniqueSlug = async (prisma, title, usedSlugs) => {
  const baseSlug = slugify(title);
  let candidate = baseSlug;
  let suffix = 2;

  while (usedSlugs.has(candidate) || (await prisma.post.findUnique({ where: { slug: candidate } }))) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  usedSlugs.add(candidate);
  return candidate;
};

export const seedCategories = async (prisma) => {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category
    });
  }

  return prisma.category.findMany({
    where: {
      slug: {
        in: categories.map((category) => category.slug)
      }
    }
  });
};

export const ensureAdminUser = async (prisma) => {
  const adminEmail = normalizeEmail(process.env.SEED_ADMIN_EMAIL);

  if (!adminEmail || !process.env.SEED_ADMIN_PASSWORD) {
    return null;
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (existingAdmin) {
    return existingAdmin;
  }

  const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD, 10);

  return prisma.user.create({
    data: {
      name: process.env.SEED_ADMIN_NAME?.trim() || 'Local Admin',
      email: adminEmail,
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });
};

export const clearRuntimeMarketplaceData = async (prisma) => {
  const [deletedMessages, deletedConversations, deletedPostImages, deletedPosts, deletedUsers] =
    await prisma.$transaction([
      prisma.message.deleteMany(),
      prisma.conversation.deleteMany(),
      prisma.postImage.deleteMany({
        where: {
          post: {
            user: {
              role: 'USER'
            }
          }
        }
      }),
      prisma.post.deleteMany({
        where: {
          user: {
            role: 'USER'
          }
        }
      }),
      prisma.user.deleteMany({
        where: {
          role: 'USER'
        }
      })
    ]);

  return {
    deletedMessages: deletedMessages.count,
    deletedConversations: deletedConversations.count,
    deletedPostImages: deletedPostImages.count,
    deletedPosts: deletedPosts.count,
    deletedUsers: deletedUsers.count
  };
};

export const seedArabicMarketplace = async (prisma) => {
  const categoriesBySlug = Object.fromEntries(
    (
      await prisma.category.findMany({
        where: {
          slug: {
            in: categories.map((category) => category.slug)
          }
        }
      })
    ).map((category) => [category.slug, category])
  );

  const passwordHash = await bcrypt.hash(process.env.SAMPLE_USER_PASSWORD || 'User12345!', 10);

  await prisma.user.createMany({
    data: sampleUsers.map((user) => ({
      name: user.name,
      email: normalizeEmail(user.email),
      bio: user.bio,
      passwordHash,
      role: 'USER',
      status: 'ACTIVE'
    }))
  });

  const createdUsers = await prisma.user.findMany({
    where: {
      email: {
        in: sampleUsers.map((user) => normalizeEmail(user.email))
      }
    },
    select: {
      id: true,
      email: true
    }
  });

  const usersByEmail = Object.fromEntries(
    createdUsers.map((user) => [normalizeEmail(user.email), user])
  );

  const usedSlugs = new Set();

  for (const post of samplePosts) {
    const owner = usersByEmail[normalizeEmail(post.ownerEmail)];
    const category = categoriesBySlug[post.categorySlug];

    if (!owner || !category) {
      continue;
    }

    await prisma.post.create({
      data: {
        userId: owner.id,
        categoryId: category.id,
        title: post.title,
        slug: await ensureUniqueSlug(prisma, post.title, usedSlugs),
        description: post.description,
        price: post.price,
        country: post.country,
        city: post.city,
        status: post.status
      }
    });
  }

  return {
    users: sampleUsers.length,
    posts: samplePosts.length,
    password: process.env.SAMPLE_USER_PASSWORD || 'User12345!'
  };
};
