import { PrismaClient, Role, UserStatus, CourseStatus, Difficulty, BlockType } from '@prisma/client';
import bcrypt from 'bcryptjs';
const db = new PrismaClient();

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  if (password.length < 12) throw new Error('ADMIN_PASSWORD must contain at least 12 characters.');
  const passwordHash = await bcrypt.hash(password, 12);
  await db.user.upsert({
    where: { email },
    update: { role: Role.ADMIN, status: UserStatus.ACTIVE },
    create: { name: 'Academy Admin', email, passwordHash, role: Role.ADMIN, status: UserStatus.ACTIVE }
  });
  console.log(`Admin ready: ${email}`);
}

async function seedLearning() {
  const categories = [
    ['Creator Basics','creator-basics','Strong foundations for safer, more confident content creation.','Compass'],
    ['TikTok Growth','tiktok-growth','Practical skills for content, community and sustainable growth.','TrendingUp'],
    ['Live Streaming','live-streaming','Plan, host and improve engaging livestreams.','Radio'],
    ['Wellbeing','wellbeing','Healthy habits and support for creators and staff.','Heart']
  ];
  for (const [name,slug,description,icon] of categories) {
    await db.category.upsert({where:{slug},update:{name,description,icon},create:{name,slug,description,icon}});
  }
  const category = await db.category.findUniqueOrThrow({where:{slug:'creator-basics'}});
  const course = await db.course.upsert({
    where:{slug:'welcome-to-we-are-elixir'},
    update:{status:CourseStatus.PUBLISHED},
    create:{
      title:'Welcome to We Are Elixir', slug:'welcome-to-we-are-elixir',
      summary:'Start strong with the Academy, community values and practical creator support.',
      description:'A friendly introduction to We Are Elixir, how the Academy works, where to find support and how to make the most of your creator journey.',
      difficulty:Difficulty.BEGINNER, estimatedMinutes:25, status:CourseStatus.PUBLISHED, featured:true, categoryId:category.id
    }
  });
  const courseModule = await db.module.upsert({
    where:{courseId_position:{courseId:course.id,position:1}},
    update:{title:'Getting started'},
    create:{courseId:course.id,title:'Getting started',description:'Everything you need for your first steps.',position:1}
  });
  const lessons = [
    ['Your Academy tour','academy-tour','A quick tour of your dashboard and learning tools.','Welcome to your learning space. Use the course library to discover training, open a course to view its modules, and mark lessons complete as you work through them. Your dashboard keeps track of where you left off.',5],
    ['How support works','how-support-works','Know where to ask questions and get help.','We Are Elixir is built around practical support. Use the community support channels for general questions, speak with your manager for creator goals, and use the appropriate ticket route when something needs a private or formal response.',6],
    ['Setting your first goal','setting-your-first-goal','Turn a big ambition into one clear next step.','Choose one useful goal for the next seven days. Make it specific, realistic and easy to measure. Examples include completing two Academy lessons, planning three livestream topics, or improving one part of your stream setup.',7]
  ];
  for (let i=0;i<lessons.length;i++) {
    const [title,slug,summary,content,estimatedMinutes]=lessons[i] as [string,string,string,string,number];
    const lesson = await db.lesson.upsert({where:{moduleId_slug:{moduleId:courseModule.id,slug}},update:{title,summary,content,estimatedMinutes},create:{moduleId:courseModule.id,title,slug,summary,content,estimatedMinutes,position:i+1}});
    await db.lessonBlock.upsert({
      where: { lessonId_position: { lessonId: lesson.id, position: 1 } },
      update: { type: BlockType.PARAGRAPH, data: { text: content } },
      create: { lessonId: lesson.id, position: 1, type: BlockType.PARAGRAPH, data: { text: content } }
    });
  }
}

async function main(){ await seedAdmin(); await seedLearning(); console.log('Academy learning data ready.'); }
main().finally(()=>db.$disconnect());
