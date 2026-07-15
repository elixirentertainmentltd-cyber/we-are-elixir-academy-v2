import Link from 'next/link';
import {
  ArrowRight,
  Award,
  BookOpen,
  Flame,
  Sparkles,
} from 'lucide-react';
import { requireActiveUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Shell } from '@/components/shell';
import { CourseCard } from '@/components/course-card';
import { completedLessonIds, courseStats } from '@/lib/learning';
import styles from './dashboard.module.css';

export default async function DashboardPage() {
  const user = await requireActiveUser();

  const [courses, enrollments, completed] = await Promise.all([
    db.course.findMany({
      where: {
        status: 'PUBLISHED',
      },
      include: {
        category: true,
        modules: {
          include: {
            lessons: {
              select: {
                id: true,
                required: true,
              },
            },
          },
        },
      },
      orderBy: [
        {
          featured: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
      take: 6,
    }),

    db.enrollment.findMany({
      where: {
        userId: user.id,
      },
      include: {
        course: {
          include: {
            category: true,
            modules: {
              include: {
                lessons: {
                  select: {
                    id: true,
                    required: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        lastOpenedAt: 'desc',
      },
      take: 3,
    }),

    completedLessonIds(user.id),
  ]);

  const totalLessons = courses.flatMap((course) =>
    course.modules.flatMap((courseModule) => courseModule.lessons),
  ).length;

  const completeCount = completed.size;
  const firstName = user.name.trim().split(/\s+/)[0] || 'Creator';

  return (
    <Shell user={user}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>
            WE ARE ELIXIR ACADEMY
          </p>

          <h1 className={styles.title}>
            Welcome back, {firstName}.
          </h1>

          <p className={styles.description}>
            Pick up where you left off or discover your next
            practical skill.
          </p>

          <Link className={styles.button} href="/courses">
            Explore courses
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>

        <div className={styles.orb}>
          <Sparkles aria-hidden="true" />

          <strong>Keep growing</strong>

          <span>One useful lesson at a time.</span>
        </div>
      </section>

      <section className="stats-grid">
        <article>
          <BookOpen aria-hidden="true" />

          <div>
            <strong>{courses.length}</strong>
            <span>Available courses</span>
          </div>
        </article>

        <article>
          <Flame aria-hidden="true" />

          <div>
            <strong>{completeCount}</strong>
            <span>Lessons completed</span>
          </div>
        </article>

        <article>
          <Award aria-hidden="true" />

          <div>
            <strong>
              {Math.max(totalLessons - completeCount, 0)}
            </strong>

            <span>Lessons to explore</span>
          </div>
        </article>
      </section>

      {enrollments.length > 0 && (
        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">CONTINUE LEARNING</p>
              <h2>Jump back in</h2>
            </div>

            <Link href="/courses">
              View library
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>

          <div className="course-grid">
            {enrollments.map(({ course }) => (
              <CourseCard
                key={course.id}
                course={course}
                progress={courseStats(course, completed).percent}
              />
            ))}
          </div>
        </section>
      )}

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FEATURED LEARNING</p>
            <h2>Build your next skill</h2>
          </div>

          <Link href="/courses">
            See all courses
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>

        <div className="course-grid">
          {courses.slice(0, 3).map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              progress={courseStats(course, completed).percent}
            />
          ))}
        </div>
      </section>
    </Shell>
  );
}
