import { Injectable, Inject, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { IInstructorRepository } from '../domain/repositories/instructor.repository.interface';
import { SupabaseStorageService } from '../infrastructure/storage/supabase-storage.service';

@Injectable()
export class InstructorsService {
  constructor(
    @Inject(IInstructorRepository)
    private readonly instructorRepository: IInstructorRepository,
    private readonly storageService: SupabaseStorageService,
  ) {}

  async uploadPhoto(id: string, file: Express.Multer.File, user: any) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso negado');
    const existing = await this.instructorRepository.findById(id);
    if (!existing) throw new NotFoundException('Instrutor não encontrado');

    const ext = file.originalname.split('.').pop() || 'jpg';
    const filename = `instructor-${id}-${Date.now()}.${ext}`;
    
    const photoUrl = await this.storageService.uploadFile(
      file.buffer,
      filename,
      file.mimetype,
      'instructors'
    );

    return this.instructorRepository.update(id, {
      name: existing.name,
      title: existing.title,
      bio: existing.bio,
      isActive: existing.isActive,
      photoUrl,
    });
  }

  async listPublic() {
    return this.instructorRepository.listActive();
  }

  async listAll(user: any) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso negado');
    return this.instructorRepository.listAll();
  }

  async create(body: any, user: any) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso negado');
    const { name, title, bio, photoUrl, isActive } = body;
    if (!name?.trim() || !title?.trim()) {
      throw new BadRequestException('name e title são obrigatórios');
    }
    return this.instructorRepository.create({
      name: name.trim(),
      title: title.trim(),
      bio: bio?.trim() || null,
      photoUrl: photoUrl?.trim() || null,
      isActive: isActive !== undefined ? isActive : true,
    });
  }

  async update(id: string, body: any, user: any) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso negado');
    const existing = await this.instructorRepository.findById(id);
    if (!existing) throw new NotFoundException('Instrutor não encontrado');
    const { name, title, bio, photoUrl, isActive } = body;
    return this.instructorRepository.update(id, {
      name: name?.trim() ?? existing.name,
      title: title?.trim() ?? existing.title,
      bio: bio !== undefined ? (bio?.trim() || null) : existing.bio,
      photoUrl: photoUrl !== undefined ? (photoUrl?.trim() || null) : existing.photoUrl,
      isActive: isActive !== undefined ? isActive : existing.isActive,
    });
  }

  async remove(id: string, user: any) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso negado');
    const existing = await this.instructorRepository.findById(id);
    if (!existing) throw new NotFoundException('Instrutor não encontrado');
    await this.instructorRepository.delete(id);
    return { message: 'Instrutor removido' };
  }

  async addToCourse(courseId: string, instructorId: string, user: any) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso negado');
    if (!instructorId) throw new BadRequestException('instructorId é obrigatório');
    const courseExists = await this.instructorRepository.courseExists(courseId);
    if (!courseExists) throw new NotFoundException('Curso não encontrado');
    const instructor = await this.instructorRepository.findById(instructorId);
    if (!instructor) throw new NotFoundException('Instrutor não encontrado');
    return this.instructorRepository.addToCourse(courseId, instructorId);
  }

  async removeFromCourse(courseId: string, instructorId: string, user: any) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso negado');
    await this.instructorRepository.removeFromCourse(courseId, instructorId);
    return { message: 'Associação removida' };
  }
}
