import { User } from '../../src/domain/entities/user.entity';
import { Course, Lesson } from '../../src/domain/entities/course.entity';
import { Post } from '../../src/domain/entities/post.entity';

export function makeUser(overrides: Partial<User> = {}): User {
  return new User(
    overrides.id ?? 'user-1',
    overrides.name ?? 'Aluno Teste',
    overrides.email ?? 'aluno@suri.com',
    overrides.passwordHash ?? '$2b$10$placeholder.hash.for.tests',
    (overrides.groupType as 'vip' | 'embaixador' | 'admin') ?? 'embaixador',
    overrides.tier ?? 'Embaixador Voice',
    overrides.xp ?? 0,
    overrides.level ?? 1,
    overrides.isAdmin ?? false,
    overrides.createdAt ?? new Date('2026-01-01T00:00:00Z'),
    overrides.isActive ?? true,
    overrides.profileImage ?? null,
  );
}

export function makeAdmin(overrides: Partial<User> = {}): User {
  return makeUser({
    id: 'admin-1',
    email: 'admin@suri.com',
    isAdmin: true,
    groupType: 'admin' as any,
    tier: 'ADMIN',
    ...overrides,
  });
}

export function makeCourse(overrides: Partial<Course> = {}, lessons: Lesson[] = []): Course {
  return new Course(
    overrides.id ?? 'course-1',
    overrides.title ?? 'Curso Teste',
    overrides.description ?? 'desc',
    overrides.workloadHours ?? 10,
    overrides.xpReward ?? 100,
    overrides.coverUrl ?? 'cover.png',
    (overrides.targetGroup as any) ?? 'all',
    overrides.isPublished ?? true,
    overrides.createdAt ?? new Date('2026-01-01T00:00:00Z'),
    lessons.length ? lessons : (overrides.lessons ?? []),
  );
}

export function makeLesson(overrides: Partial<Lesson> = {}): Lesson {
  return new Lesson(
    overrides.id ?? 'lesson-1',
    overrides.courseId ?? 'course-1',
    overrides.title ?? 'Aula 1',
    overrides.description ?? 'desc',
    overrides.content ?? 'conteudo',
    overrides.videoUrl ?? 'https://yt/abc',
    overrides.duration ?? '10:00',
    overrides.sortOrder ?? 0,
  );
}

export function makePost(overrides: Partial<Post> = {}): Post {
  return new Post(
    overrides.id ?? 'post-1',
    overrides.authorId ?? 'user-1',
    overrides.title ?? 'Meu projeto',
    overrides.body ?? 'corpo',
    overrides.createdAt ?? new Date(),
    overrides.authorName ?? 'Aluno Teste',
    overrides.authorTier ?? 'Embaixador Voice',
    overrides.groupType ?? 'embaixador',
    overrides.likes ?? 0,
    overrides.comments ?? 0,
  );
}

export function buildUserRepoMock() {
  return {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    listAll: jest.fn(),
    listLeaderboard: jest.fn(),
  };
}

export function buildCourseRepoMock() {
  return {
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    listAllPublished: jest.fn(),
    listAll: jest.fn(),
    createLesson: jest.fn(),
    updateLesson: jest.fn(),
    deleteLesson: jest.fn(),
    findLessonById: jest.fn(),
  };
}

export function buildPostRepoMock() {
  return {
    create: jest.fn(),
    listAllByGroup: jest.fn(),
    listAll: jest.fn(),
    listByCourse: jest.fn(),
    likePost: jest.fn(),
    commentPost: jest.fn(),
  };
}

export function buildInstructorRepoMock() {
  return {
    listActive: jest.fn(),
    listAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    courseExists: jest.fn(),
    addToCourse: jest.fn(),
    removeFromCourse: jest.fn(),
  };
}

export function buildStorageMock() {
  return {
    uploadFile: jest.fn().mockResolvedValue('https://storage/file.png'),
  };
}

export function buildPrismaMock() {
  return {
    enrollment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    moduleProgress: {
      findUnique: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    module: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    course: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    courseInstructor: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    certificate: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    question: {
      count: jest.fn(),
    },
    quizAttempt: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    trail: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    trailEnrollment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    trailCertificate: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    trailQuizAttempt: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    trailCourse: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    quizExtraAttempt: {
      count: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    xpRule: {
      findUnique: jest.fn(),
    },
    profile: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  };
}

export function buildJwtServiceMock() {
  return {
    sign: jest.fn().mockReturnValue('signed.jwt.token'),
  };
}
