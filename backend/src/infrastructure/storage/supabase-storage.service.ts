import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private supabase: SupabaseClient;
  private bucket: string;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    this.bucket = process.env.SUPABASE_BUCKET || 'universidade-suri-uploads';

    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn('As variáveis SUPABASE_URL ou SUPABASE_KEY não estão definidas. O upload falhará.');
    }

    // Inicializa o cliente do Supabase
    this.supabase = createClient(supabaseUrl || '', supabaseKey || '', {
      auth: {
        persistSession: false,
      },
    });
  }

  /**
   * Faz o upload de um buffer de arquivo para o Supabase Storage.
   * @param fileBuffer O buffer do arquivo a ser enviado.
   * @param filename O nome final do arquivo.
   * @param mimetype O mimetype do arquivo (ex: image/jpeg).
   * @param folder A pasta dentro do bucket onde o arquivo será salvo.
   * @returns A URL pública do arquivo enviado.
   */
  async uploadFile(fileBuffer: Buffer, filename: string, mimetype: string, folder: string = ''): Promise<string> {
    try {
      const filePath = folder ? `${folder}/${filename}` : filename;

      const { data, error } = await this.supabase.storage
        .from(this.bucket)
        .upload(filePath, fileBuffer, {
          contentType: mimetype,
          upsert: true, // Substitui o arquivo se já existir com o mesmo nome
        });

      if (error) {
        this.logger.error(`Erro ao fazer upload para o Supabase: ${error.message}`, error.stack);
        throw new InternalServerErrorException('Falha no upload da imagem.');
      }

      // Retorna a URL pública
      const { data: publicUrlData } = this.supabase.storage
        .from(this.bucket)
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (error) {
      this.logger.error(`Erro ao fazer upload: ${error}`);
      throw new InternalServerErrorException('Não foi possível processar o upload do arquivo.');
    }
  }
}
