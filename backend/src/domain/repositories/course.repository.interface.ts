import { Course, Lesson } from '../entities/course.entity';

export interface ICourseRepository {
  findById(id: string): Promise<Course | null>;
  create(course: Course): Promise<Course>;
  update(course: Course): Promise<Course>;
  delete(id: string): Promise<boolean>;
  listAllPublished(groupType: 'vip' | 'embaixador'): Promise<Course[]>;
  listAll(): Promise<Course[]>;

  // Module/Lesson operations
  createLesson(lesson: Lesson): Promise<Lesson>;
  updateLesson(lesson: Lesson): Promise<Lesson>;
  deleteLesson(id: string): Promise<boolean>;
  findLessonById(id: string): Promise<Lesson | null>;
}
export const ICourseRepository = Symbol('ICourseRepository');
