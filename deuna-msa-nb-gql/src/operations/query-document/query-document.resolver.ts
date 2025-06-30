import { Resolver, Query, Args } from '@nestjs/graphql';
import { QueryDocumentService } from './services/query-document.service';
import { QueryDocumentInput } from './dto/query-document-input.dto';
import { QueryDocumentResponse } from './dto/query-document-response.dto';
import {
  Profile,
  ProfileType,
  ValidationAuthGuard,
} from '../../core/guards/validation-auth.guard';
import { UseGuards } from '@nestjs/common';

@Resolver()
export class QueryDocumentResolver {
  constructor(private readonly queryDocumentService: QueryDocumentService) {}

  @Profile(ProfileType.Authenticated)
  @UseGuards(ValidationAuthGuard)
  @Query(() => QueryDocumentResponse)
  async queryDocument(
    @Args('input') input: QueryDocumentInput,
  ): Promise<QueryDocumentResponse> {
    return this.queryDocumentService.queryDocument(input);
  }
}
