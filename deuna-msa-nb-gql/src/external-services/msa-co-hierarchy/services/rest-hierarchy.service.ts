import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { KafkaService } from '@deuna/tl-kafka-nd';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { IHierarchyService } from '../interfaces/hierarchy-service.interface';
import { HierarchyMetadataUpdateDto } from '../dto/hierarchy-metadata-update.dto';

@Injectable()
export class RestHierarchyService implements IHierarchyService, OnModuleInit {
  private readonly logger = new Logger(RestHierarchyService.name);
  private readonly HIERARCHY_METADATA_UPDATE_TOPIC =
    'MI_HIERARCHY_METADATA_UPDATE';
  private readonly HIERARCHY_BASE_URL: string;

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.HIERARCHY_BASE_URL = this.configService.get<string>(
      'HIERARCHY_SERVICE_URL',
      'http://localhost:80/hierarchy',
    );
  }

  async onModuleInit() {
    // KafkaService handles the connection
  }

  updateMetadata(data: HierarchyMetadataUpdateDto): Observable<void> {
    return from(this.publishMetadataUpdate(data));
  }

  private async publishMetadataUpdate(
    data: HierarchyMetadataUpdateDto,
  ): Promise<void> {
    this.logger.log(
      `Sending hierarchy metadata update: ${JSON.stringify(data)}`,
    );

    await this.kafkaService.publishToQueue({
      topic: this.HIERARCHY_METADATA_UPDATE_TOPIC,
      headers: {
        source: 'leap-x/nb-gql',
        timestamp: new Date().toISOString(),
      },
      value: data,
    });

    this.logger.log(
      `Successfully sent hierarchy metadata update for nodeId: ${data.nodeId}`,
    );
  }
}
