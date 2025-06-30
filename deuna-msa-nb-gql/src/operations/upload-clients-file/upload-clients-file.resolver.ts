import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { FileUpload, GraphQLUpload } from 'graphql-upload-ts';
import { UploadClientsFileService } from './service/upload-clients-file.service';
import { UploadClientsFileResponse } from './dto/upload-clients-file.dto';

@Resolver()
export class UploadClientsFileResolver {
  constructor(
    private readonly uploadClientsFileService: UploadClientsFileService,
  ) {}

  @Mutation(() => UploadClientsFileResponse)
  async uploadClientsFile(
    @Args({ name: 'file', type: () => GraphQLUpload })
    file: Promise<FileUpload>,
  ): Promise<UploadClientsFileResponse> {
    try {
      const uploadedFile = await file;
      if (!uploadedFile || !uploadedFile.mimetype.includes('csv')) {
        throw new Error('El archivo debe ser un CSV válido');
      }

      return this.uploadClientsFileService.uploadClientsFile(file);
    } catch (error) {
      throw new Error(`Error al procesar el archivo: ${error.message}`);
    }
  }
}
