export type BuilderCategory = {
  id: string;
  name: string;
  slug: string;
};

export type BuilderBlockType =
  | 'HEADING'
  | 'PARAGRAPH'
  | 'IMAGE'
  | 'VIDEO'
  | 'PDF'
  | 'DOWNLOAD'
  | 'QUOTE'
  | 'TIP'
  | 'WARNING'
  | 'BUTTON'
  | 'DIVIDER';

export type BuilderBlock = {
  id: string;
  type: BuilderBlockType;
  position: number;
  data: Record<string, unknown>;
};

export type BuilderLesson = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  videoUrl: string | null;
  resourceUrl: string | null;
  estimatedMinutes: number;
  position: number;
  required: boolean;
  moduleId: string;
  blocks: BuilderBlock[];
};

export type BuilderModule = {
  id: string;
  title: string;
  description: string | null;
  position: number;
  courseId: string;
  lessons: BuilderLesson[];
};

export type BuilderCourse = {
  id: string;
  title: string;
  slug: string;
  description: string;
  summary: string;
  coverImage: string | null;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  estimatedMinutes: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  featured: boolean;
  certificateEnabled: boolean;
  categoryId: string;
  category: BuilderCategory;
  modules: BuilderModule[];
  createdAt: string;
  updatedAt: string;
};

export type CourseListItem = Pick<
  BuilderCourse,
  'id' | 'title' | 'slug' | 'status' | 'difficulty' | 'updatedAt' | 'categoryId'
> & {
  category: BuilderCategory;
  _count: { modules: number };
};

export type PublishCheck = {
  id: string;
  label: string;
  passed: boolean;
  required: boolean;
};
