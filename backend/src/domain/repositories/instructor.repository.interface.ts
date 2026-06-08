export interface InstructorData {
  name: string;
  title: string;
  bio?: string | null;
  photoUrl?: string | null;
  isActive?: boolean;
}

export interface IInstructorRepository {
  listActive(): Promise<any[]>;
  listAll(): Promise<any[]>;
  findById(id: string): Promise<any | null>;
  create(data: InstructorData): Promise<any>;
  update(id: string, data: InstructorData): Promise<any>;
  delete(id: string): Promise<void>;

  // Associação curso ↔ instrutor
  courseExists(courseId: string): Promise<boolean>;
  addToCourse(courseId: string, instructorId: string): Promise<any>;
  removeFromCourse(courseId: string, instructorId: string): Promise<void>;
}

export const IInstructorRepository = Symbol('IInstructorRepository');
