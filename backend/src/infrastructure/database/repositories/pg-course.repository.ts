import { Injectable, OnModuleInit } from '@nestjs/common';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { Course, Lesson } from '../../../domain/entities/course.entity';
import { PgService } from '../pg.service';

@Injectable()
export class PgCourseRepository implements ICourseRepository, OnModuleInit {
  private coursesStore: Map<string, Course> = new Map();
  private lessonsStore: Map<string, Lesson> = new Map();

  constructor(private readonly pg: PgService) {}

  onModuleInit() {
    // Seed in-memory courses
    const baseLessons = [
      { id: "l1", title: "Boas-vindas e visão geral", duration: "08:12", youtubeId: "dQw4w9WgXcQ" },
      { id: "l2", title: "Fundamentos da plataforma", duration: "14:30", youtubeId: "dQw4w9WgXcQ" },
      { id: "l3", title: "Arquitetura estratégica", duration: "22:05", youtubeId: "dQw4w9WgXcQ" },
      { id: "l4", title: "Aplicando na prática", duration: "18:44", youtubeId: "dQw4w9WgXcQ" },
      { id: "l5", title: "Checkpoint final", duration: "10:00", youtubeId: "dQw4w9WgXcQ" },
    ];

    const mockCoursesData = [
      { id: "c1", title: "Curso Plataforma (Estratégico)", description: "Fundamentos estratégicos da plataforma e visão executiva.", cover: "from-marine to-deep", group: "all" as const },
      { id: "c2", title: "Automação e Fluxos", description: "Construa fluxos inteligentes e escaláveis.", cover: "from-marine to-deep", group: "all" as const },
      { id: "c3", title: "Suri Shop (Estratégico)", description: "Domine o ecossistema Suri Shop.", cover: "from-marine to-deep", group: "vip" as const },
      { id: "c4", title: "Educacional WhatsApp", description: "Comunicação avançada via WhatsApp.", cover: "from-marine to-deep", group: "all" as const },
      { id: "c5", title: "Curso Meta", description: "Estratégia completa em Meta Ads.", cover: "from-marine to-deep", group: "all" as const },
      { id: "c6", title: "Embaixador Onboarding", description: "Onboarding exclusivo para embaixadores.", cover: "from-marine to-deep", group: "embaixador" as const },
    ];

    mockCoursesData.forEach((cd) => {
      const course = new Course(
        cd.id,
        cd.title,
        cd.description,
        24,
        50, // default xpReward
        cd.cover,
        cd.group,
        true,
        new Date()
      );

      const lessons = baseLessons.map((bl, index) => {
        const l = new Lesson(
          `${cd.id}_${bl.id}`,
          cd.id,
          bl.title,
          `Conteúdo didático e aprofundado da lição: ${bl.title}`,
          bl.duration, // use duration as content placeholder or meta
          bl.youtubeId,
          index
        );
        this.lessonsStore.set(l.id, l);
        return l;
      });

      course.lessons = lessons;
      this.coursesStore.set(course.id, course);
    });
  }

  private mapRowToCourse(row: any): Course {
    return new Course(
      row.id,
      row.title,
      row.description,
      row.workload_hours,
      row.xp_reward,
      row.cover_url,
      row.target_group as 'all' | 'vip' | 'embaixador',
      !!row.is_published,
      row.created_at,
    );
  }

  private mapRowToLesson(row: any): Lesson {
    return new Lesson(
      row.id,
      row.course_id,
      row.title,
      row.description,
      row.content,
      row.video_url,
      row.sort_order,
    );
  }

  async findById(id: string): Promise<Course | null> {
    if (this.pg.isFallbackMode) {
      return this.coursesStore.get(id) || null;
    }
    const rows = await this.pg.query('SELECT * FROM courses WHERE id = $1', [id]);
    if (rows.length === 0) return null;
    const course = this.mapRowToCourse(rows[0]);
    
    // Load lessons
    const lessonRows = await this.pg.query(
      'SELECT * FROM modules WHERE course_id = $1 ORDER BY sort_order ASC',
      [id]
    );
    course.lessons = lessonRows.map(l => this.mapRowToLesson(l));
    return course;
  }

  async create(course: Course): Promise<Course> {
    if (this.pg.isFallbackMode) {
      const newCourse = { ...course, id: 'c_' + Math.random().toString(36).substr(2, 9), lessons: [] };
      this.coursesStore.set(newCourse.id, newCourse);
      return newCourse;
    }
    const rows = await this.pg.query(
      `INSERT INTO courses (title, description, workload_hours, xp_reward, cover_url, target_group, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [course.title, course.description, course.workloadHours, course.xpReward, course.coverUrl, course.targetGroup, course.isPublished]
    );
    return this.mapRowToCourse(rows[0]);
  }

  async update(course: Course): Promise<Course> {
    if (this.pg.isFallbackMode) {
      this.coursesStore.set(course.id, course);
      return course;
    }
    const rows = await this.pg.query(
      `UPDATE courses 
       SET title = $2, description = $3, workload_hours = $4, xp_reward = $5, cover_url = $6, target_group = $7, is_published = $8
       WHERE id = $1
       RETURNING *`,
      [course.id, course.title, course.description, course.workloadHours, course.xpReward, course.coverUrl, course.targetGroup, course.isPublished]
    );
    return this.mapRowToCourse(rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    if (this.pg.isFallbackMode) {
      return this.coursesStore.delete(id);
    }
    const res = await this.pg.query('DELETE FROM courses WHERE id = $1 RETURNING id', [id]);
    return res.length > 0;
  }

  async listAllPublished(groupType: 'vip' | 'embaixador'): Promise<Course[]> {
    if (this.pg.isFallbackMode) {
      return Array.from(this.coursesStore.values()).filter(c => c.isPublished && (c.targetGroup === 'all' || c.targetGroup === groupType));
    }
    const rows = await this.pg.query(
      `SELECT * FROM courses 
       WHERE is_published = TRUE AND (target_group = 'all' OR target_group = $1)
       ORDER BY created_at DESC`,
      [groupType]
    );
    return rows.map(r => this.mapRowToCourse(r));
  }

  async listAll(): Promise<Course[]> {
    if (this.pg.isFallbackMode) {
      return Array.from(this.coursesStore.values());
    }
    const rows = await this.pg.query('SELECT * FROM courses ORDER BY created_at DESC');
    return rows.map(r => this.mapRowToCourse(r));
  }

  // Modules/Lessons operations
  async createLesson(lesson: Lesson): Promise<Lesson> {
    if (this.pg.isFallbackMode) {
      const newLesson = { ...lesson, id: 'l_' + Math.random().toString(36).substr(2, 9) };
      this.lessonsStore.set(newLesson.id, newLesson);
      const c = this.coursesStore.get(lesson.courseId);
      if (c) c.lessons.push(newLesson);
      return newLesson;
    }
    const rows = await this.pg.query(
      `INSERT INTO modules (course_id, title, description, content, video_url, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [lesson.courseId, lesson.title, lesson.description, lesson.content, lesson.videoUrl, lesson.sortOrder]
    );
    return this.mapRowToLesson(rows[0]);
  }

  async updateLesson(lesson: Lesson): Promise<Lesson> {
    if (this.pg.isFallbackMode) {
      this.lessonsStore.set(lesson.id, lesson);
      const c = this.coursesStore.get(lesson.courseId);
      if (c) c.lessons = c.lessons.map(l => l.id === lesson.id ? lesson : l);
      return lesson;
    }
    const rows = await this.pg.query(
      `UPDATE modules
       SET title = $2, description = $3, content = $4, video_url = $5, sort_order = $6
       WHERE id = $1
       RETURNING *`,
      [lesson.id, lesson.title, lesson.description, lesson.content, lesson.videoUrl, lesson.sortOrder]
    );
    return this.mapRowToLesson(rows[0]);
  }

  async deleteLesson(id: string): Promise<boolean> {
    if (this.pg.isFallbackMode) {
      const lesson = this.lessonsStore.get(id);
      if (!lesson) return false;
      this.lessonsStore.delete(id);
      const c = this.coursesStore.get(lesson.courseId);
      if (c) c.lessons = c.lessons.filter(l => l.id !== id);
      return true;
    }
    const res = await this.pg.query('DELETE FROM modules WHERE id = $1 RETURNING id', [id]);
    return res.length > 0;
  }

  async findLessonById(id: string): Promise<Lesson | null> {
    if (this.pg.isFallbackMode) {
      return this.lessonsStore.get(id) || null;
    }
    const rows = await this.pg.query('SELECT * FROM modules WHERE id = $1', [id]);
    return rows.length > 0 ? this.mapRowToLesson(rows[0]) : null;
  }
}
