import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { RedisModule } from '@deuna/tl-cache-nd';
import { KafkaModule } from '@deuna/tl-kafka-nd';
import { ClientsModule } from '@nestjs/microservices';
import { LoggerModule, Logger } from '@deuna/tl-logger-nd';
import { getCacheConfig } from './infrastructure/config/cache.config';
import { getKafkaClientConfig } from './infrastructure/config/kafka.config';
import {
  DOCUMENT_VALIDATION_PORT,
  DOCUMENT_VALIDATION_CLIENT_PORT,
  DOCUMENT_VALIDATION_QUEUE_PORT,
  ELECTRONIC_SIGNATURE_PORT,
  ELECTRONIC_SIGNATURE_STORAGE_PORT,
  DIGITAL_SIGNATURE_REPOSITORY_PORT,
  DETOKENIZE_CLIENT_PORT,
} from './domain/constants/injection.constants';

// Controllers
import { HealthController } from './infrastructure/adapters/controllers/health.controller';
import { KycController } from './infrastructure/adapters/controllers/kyc-start-biometric-validation.controller';
import { KycQueueValidationController } from './infrastructure/adapters/controllers/kyc-queue-validation.controller';
import { KycDocumentValidationController } from './infrastructure/adapters/controllers/kyc-document-validation.controller';
import { ElectronicSignatureController } from './infrastructure/adapters/controllers/electronic-signature.controller';
import { CnbStateValidationController } from './infrastructure/adapters/controllers/cnb-state-validation.controller';
import { DocumentGenerationController } from './infrastructure/adapters/controllers/document-generation.controller';
import { QueryDocumentController } from './infrastructure/adapters/controllers/query-document.controller';

// Services y Ports
import { HealthService } from './application/services/health.service';
import { KycBiometricValidationService } from './application/services/kyc-biometric-validation.service';
import { KYC_PORT } from './application/ports/in/services/kyc-biometric.service.port';
import { HEALTH_SERVICE_PORT } from './application/ports/in/services/health.service.port';
import { KYC_STORAGE_PORT } from './application/ports/out/storage/kyc-storage.port';
import { KYC_QUEUE_PORT } from './application/ports/out/queue/kyc-queue.port';
import { REDIS_HEALTH_PORT } from './application/ports/out/health/redis-health.port';
import { KYC_CLIENT_PORT } from './application/ports/out/clients/kyc-client.port';
import { ONBOARDING_CLIENT_PORT } from './application/ports/out/clients/onboarding-client.port';
import { CNB_PORT, CnbService } from './application/services/cnb.service';
import { CNB_QUEUE_PORT } from './application/ports/out/queue/cnb-queue.port';
import { KafkaCnbQueueAdapter } from './infrastructure/adapters/queue/kafka-cnb-queue.adapter';
import { KycDocumentValidationService } from './application/services/kyc-document-validation.service';
import { DocumentValidationAdapter } from './infrastructure/adapters/repositories/document-validation.adapter';
import { KafkaDocumentValidationQueueAdapter } from './infrastructure/adapters/queue/kafka-document-validation-queue.adapter';
import { ElectronicSignatureService } from './application/services/electronic-signature.service';
import { DetokenizeClientAdapter } from './infrastructure/adapters/repositories/detokenize-client.adapter';
import { CNB_STATE_VALIDATION_STORAGE_PORT } from './application/ports/out/storage/cnb-state-validation-storage.port';
import { CNB_STATE_VALIDATION_PORT } from './application/ports/in/services/cnb-state-validation.service.port';
import { CnbStateValidationService } from './application/services/cnb-state-validation.service';
import { CNB_CONFIG_CLIENT_PORT } from './application/ports/out/clients/cnb-config-client.port';
import { CNB_CONFIG_SENDER_PORT } from './application/ports/out/clients/cnb-config-sender.port';
import { MERCHANT_CLIENT_PORT } from './application/ports/out/clients/merchant-client.port';
import { MERCHANT_HIERARCHY_PORT } from './application/ports/out/clients/merchant-hierarchy.port';
import { CNB_CONFIG_UPDATE_PORT } from './application/ports/out/clients/cnb-config-update.port';
import { DocumentGenerationService } from './application/services/document-generation.service';
import { QueryDocumentService } from './application/services/query-document.service';
import { FILE_GENERATOR_PORT } from './application/ports/out/repository/file-generator.port.interface';
import { FILE_MANAGER_PORT } from './application/ports/out/repository/file-manager.port.interface';
import { TEMPLATE_GENERATOR_PORT } from './application/ports/out/repository/template-generator.port';

// Adapters
import { RedisConnectionHealthAdapter } from './infrastructure/adapters/repositories/redis-connection-health.adapter';
import { RedisKycStorageAdapter } from './infrastructure/adapters/repositories/redis-kyc-storage.adapter';
import { KafkaKycQueueAdapter } from './infrastructure/adapters/queue/kafka-kyc-queue.adapter';
import { KycValidationConsumer } from './infrastructure/consumers/kyc-validation.consumer';
import { KycClientAdapter } from './infrastructure/adapters/repositories/kyc-client.adapter';
import { KycValidationService } from './application/services/kyc-validation.service';
import { OnboardingClientAdapter } from './infrastructure/adapters/repositories/onboarding-client.adapter';
import { RedisElectronicSignatureStorageAdapter } from './infrastructure/adapters/repositories/redis-electronic-signature-storage.adapter';
import { DigitalSignatureAdapter } from './infrastructure/adapters/repositories/digital-signature.adapter';
import { RedisCnbStateValidationAdapter } from './infrastructure/adapters/repositories/redis-cnb-state-validation.adapter';
import { CnbConfigSenderAdapter } from './infrastructure/adapters/repositories/cnb-config-sender.adapter';
import { CnbConfigAdapter } from './infrastructure/adapters/repositories/cnb-config.adapter';
import { MerchantClientAdapter } from './infrastructure/adapters/repositories/merchant-client.adapter';
import { MerchantHierarchyAdapter } from './infrastructure/adapters/repositories/merchant-hierarchy.adapter';
import { CnbConfigUpdateAdapter } from './infrastructure/adapters/repositories/cnb-config-update.adapter';
import { FileGeneratorAdapter } from './infrastructure/adapters/repositories/file-generator.adapter';
import { FileManagerAdapter } from './infrastructure/adapters/repositories/file-manager.adapter';
import { TemplateGeneratorAdapter } from './infrastructure/adapters/repositories/template-generator.adapter';

// Use Cases
import { GetKycDataUseCase } from './application/use-cases/kyc/get-kyc-data.use-case';
import { SaveValidationResultUseCase } from './application/use-cases/kyc/save-validation-result.use-case';
import { ValidateLivenessUseCase } from './application/use-cases/kyc/validate-liveness.use-case';
import { ValidateFacialMatchUseCase } from './application/use-cases/kyc/validate-facial-match.use-case';
import { SaveKycRequestUseCase } from './application/use-cases/kyc/save-kyc-request.use-case';
import { GetValidationResultsUseCase } from './application/use-cases/kyc/get-validation-results.use-case';
import { GetOnboardingStateUseCase } from './application/use-cases/kyc/get-onboarding-state.use-case';
import { CnbController } from './infrastructure/adapters/controllers/cnb.controller';
import { StartDocumentValidationUseCase } from './application/use-cases/start-document-validation.use-case';
import { GetDocumentValidationStatusUseCase } from './application/use-cases/get-document-validation-status.use-case';
import { GetDocumentValidationDataUseCase } from './application/use-cases/get-document-validation-data.use-case';
import { PublishDocumentValidationQueueUseCase } from './application/use-cases/document-validation/publish-document-validation-queue.use-case';
import { CNB_SECUENCE_PORT } from './application/ports/out/clients/cnb-secuence.port';
import { CnbSecuenceAdapter } from './infrastructure/adapters/repositories/cnb-secuence.adapter';
import { SaveSignatureRequestUseCase } from './application/use-cases/electronic-signature/save-signature-request.use-case';
import { UpdateSignatureRequestUseCase } from './application/use-cases/electronic-signature/update-signature-request.use-case';
import { GetSignatureRequestUseCase } from './application/use-cases/electronic-signature/get-signature-request.use-case';
import { ProcessDigitalSignatureUseCase } from './application/use-cases/electronic-signature/process-digital-signature.use-case';
import { DetokenizeImageUseCase } from './application/use-cases/detokenize/detokenize-image.use-case';
import { SaveCnbStateValidationUseCase } from './application/use-cases/cnb-state-validation/save-cnb-state-validation.use-case';
import { GetCnbStateValidationUseCase } from './application/use-cases/cnb-state-validation/get-cnb-state-validation.use-case';
import { GetCnbConfigUseCase } from './application/use-cases/cnb/get-cnb-config.use-case';
import { SendCnbConfigurationsUseCase } from './application/use-cases/cnb/send-cnb-configurations.use-case';
import { MerchantClientUseCase } from './application/use-cases/merchant/get-merchant-client-data.use-case';
import { MerchantHierarchyUseCase } from './application/use-cases/merchant/get-merchant-hierarchy-data.use-case';
import { UpdateCnbConfigUseCase } from './application/use-cases/cnb/update-cnb-config.use-case';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule,
    LoggerModule.forRoot({ context: 'Orq Transaccion Api' }),
    RedisModule.register(getCacheConfig(new ConfigService())),
    KafkaModule.register(getKafkaClientConfig(new ConfigService())),
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) =>
          getKafkaClientConfig(configService),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [
    HealthController,
    KycController,
    KycQueueValidationController,
    CnbController,
    KycDocumentValidationController,
    ElectronicSignatureController,
    CnbStateValidationController,
    DocumentGenerationController,
    QueryDocumentController,
  ],
  providers: [
    // Consumers
    KycValidationConsumer,

    // Service Ports
    {
      provide: HEALTH_SERVICE_PORT,
      useClass: HealthService,
    },
    {
      provide: KYC_PORT,
      useClass: KycBiometricValidationService,
    },
    {
      provide: ELECTRONIC_SIGNATURE_PORT,
      useClass: ElectronicSignatureService,
    },
    {
      provide: KYC_STORAGE_PORT,
      useClass: RedisKycStorageAdapter,
    },
    {
      provide: KYC_QUEUE_PORT,
      useClass: KafkaKycQueueAdapter,
    },
    {
      provide: CNB_QUEUE_PORT,
      useClass: KafkaCnbQueueAdapter,
    },
    {
      provide: CNB_CONFIG_CLIENT_PORT,
      useClass: CnbConfigAdapter,
    },
    {
      provide: CNB_CONFIG_SENDER_PORT,
      useClass: CnbConfigSenderAdapter,
    },
    {
      provide: ELECTRONIC_SIGNATURE_STORAGE_PORT,
      useClass: RedisElectronicSignatureStorageAdapter,
    },
    {
      provide: DIGITAL_SIGNATURE_REPOSITORY_PORT,
      useClass: DigitalSignatureAdapter,
    },
    {
      provide: REDIS_HEALTH_PORT,
      useClass: RedisConnectionHealthAdapter,
    },
    {
      provide: KYC_CLIENT_PORT,
      useClass: KycClientAdapter,
    },
    {
      provide: ONBOARDING_CLIENT_PORT,
      useClass: OnboardingClientAdapter,
    },
    {
      provide: CNB_SECUENCE_PORT,
      useClass: CnbSecuenceAdapter,
    },
    {
      provide: DETOKENIZE_CLIENT_PORT,
      useClass: DetokenizeClientAdapter,
    },
    {
      provide: MERCHANT_CLIENT_PORT,
      useClass: MerchantClientAdapter,
    },
    {
      provide: MERCHANT_HIERARCHY_PORT,
      useClass: MerchantHierarchyAdapter,
    },
    {
      provide: CNB_CONFIG_UPDATE_PORT,
      useClass: CnbConfigUpdateAdapter,
    },
    {
      provide: Logger,
      useFactory: () => {
        return new Logger({ context: 'Orq Cnb Api' });
      },
    },
    {
      provide: CNB_PORT,
      useClass: CnbService,
    },
    {
      provide: CNB_STATE_VALIDATION_STORAGE_PORT,
      useClass: RedisCnbStateValidationAdapter,
    },
    {
      provide: CNB_STATE_VALIDATION_PORT,
      useClass: CnbStateValidationService,
    },
    {
      provide: FILE_GENERATOR_PORT,
      useClass: FileGeneratorAdapter,
    },
    {
      provide: FILE_MANAGER_PORT,
      useClass: FileManagerAdapter,
    },
    {
      provide: TEMPLATE_GENERATOR_PORT,
      useClass: TemplateGeneratorAdapter,
    },

    // Services
    KycValidationService,
    {
      provide: 'DocumentGenerationPort',
      useFactory: (fileGeneratorPort, fileManagerPort) => {
        return new DocumentGenerationService(
          fileGeneratorPort,
          fileManagerPort,
        );
      },
      inject: [FILE_GENERATOR_PORT, FILE_MANAGER_PORT],
    },
    {
      provide: 'QueryDocumentServicePort',
      useFactory: (templateGeneratorPort, fileGeneratorPort) => {
        return new QueryDocumentService(
          templateGeneratorPort,
          fileGeneratorPort,
        );
      },
      inject: [TEMPLATE_GENERATOR_PORT, FILE_GENERATOR_PORT],
    },

    // Use Cases
    GetKycDataUseCase,
    SaveKycRequestUseCase,
    SaveValidationResultUseCase,
    GetValidationResultsUseCase,
    ValidateLivenessUseCase,
    ValidateFacialMatchUseCase,
    GetOnboardingStateUseCase,
    SaveSignatureRequestUseCase,
    UpdateSignatureRequestUseCase,
    GetSignatureRequestUseCase,
    ProcessDigitalSignatureUseCase,
    DetokenizeImageUseCase,
    SaveCnbStateValidationUseCase,
    GetCnbStateValidationUseCase,
    GetCnbConfigUseCase,
    SendCnbConfigurationsUseCase,
    MerchantClientUseCase,
    MerchantHierarchyUseCase,
    UpdateCnbConfigUseCase,

    // Document Validation
    {
      provide: DOCUMENT_VALIDATION_PORT,
      useClass: KycDocumentValidationService,
    },
    {
      provide: DOCUMENT_VALIDATION_CLIENT_PORT,
      useClass: DocumentValidationAdapter,
    },
    {
      provide: DOCUMENT_VALIDATION_QUEUE_PORT,
      useClass: KafkaDocumentValidationQueueAdapter,
    },
    StartDocumentValidationUseCase,
    GetDocumentValidationStatusUseCase,
    GetDocumentValidationDataUseCase,
    PublishDocumentValidationQueueUseCase,
  ],
  exports: [
    // ... exports
  ],
})
export class AppModule {}
