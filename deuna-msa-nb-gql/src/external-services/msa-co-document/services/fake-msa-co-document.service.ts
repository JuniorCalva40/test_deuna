import { Injectable } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { IMsaCoDocumentService } from '../interfaces/msa-co-document-service.interface';
import {
  GenerateDocumentDto,
  GenerateDocumentResponseDto,
  QueryDocumentInputDto,
  QueryDocumentResponseDto,
} from '../dto/msa-co-document.dto';

@Injectable()
export class FakeMsaCoDocumentService implements IMsaCoDocumentService {
  queryDocument(
    input: QueryDocumentInputDto,
  ): Observable<QueryDocumentResponseDto> {
    if (!input.templateName) {
      throw new Error('Template name is required');
    }

    const fakeResponse: QueryDocumentResponseDto = {
      status: 'success',
      message: 'Documento encontrado',
      data: {
        presignedUrl: 'https://fake-presigned-url.com/document.pdf',
        b64encoded: 'fake-base64-content',
      },
    };
    return of(fakeResponse);
  }
  generateDocument(
    document: GenerateDocumentDto,
  ): Observable<GenerateDocumentResponseDto> {
    const fakeResponse: GenerateDocumentResponseDto = {
      status: 'success',
      message: 'Documento generado y enviado con éxito',
      data: [
        {
          signedUrl: 'https://fake-signed-url.com/document.pdf',
          fileName: document.fileName,
          processName: document.processName,
          tags: document.tags,
        },
      ],
    };
    return of(fakeResponse);
  }
}
