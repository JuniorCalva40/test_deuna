import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { GraphQLFormattedError } from 'graphql';
import { graphqlUploadExpress } from 'graphql-upload-ts';

// Configuration
import configuration from './config/configuration';

// Modules
import { SignContractModule } from './operations/sign-contract/sign-contract.module';
import { AuthModule } from './controllers/auth/auth.module';
import { ConfirmDataModule } from './operations/confirm-data/confirm-data.module';
import { ClientsModule } from './operations/validate-cnb-state/clients.module';
import { MsaNbOnboardingStatusServiceModule } from './external-services/msa-co-onboarding-status/msa-co-onboarding-status-service.module';
import { MsaNbConfigurationServiceModule } from './external-services/msa-nb-configuration/msa-nb-configuration-service.module';
import { AcceptContractModule } from './operations/accept-contract/accept-contract.module';
import { AcceptBillingModule } from './operations/accept-billing/accept-billing.module';
import { StartOnboardingModule } from './operations/start-onboarding/start-onboarding.module';
import { MsaCoCommerceServiceModule } from './external-services/msa-co-commerce/msa-co-commerce-service.module';
import { MsaCoAuthModule } from './external-services/msa-co-auth/msa-co-auth.module';
import { MsaTlNotificationEmailModule } from './external-services/msa-tl-notification-email/msa-tl-notification-email.module';
import { MsaTlTemplateGeneratorModule } from './external-services/msa-tl-template-generator/msa-tl-template-generator.module';
import { MsaCoDocumentModule } from './external-services/msa-co-document/msa-co-document.module';
import { QueryDocumentModule } from './operations/query-document/query-document.module';
import { QueryOnboardingStatusModule } from './operations/query-onboarding-status/query-onboarding-status.module';
import { ResendOtpModule } from './operations/resend-otp/resend-otp.module';
import { UploadClientsFileModule } from './operations/upload-clients-file/upload-clients-file.module';
import { ValidateOtpModule } from './operations/validate-otp/validate-otp.module';

// Controllers
import { HealthController } from './controllers/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',
      sortSchema: true,
      playground: true,
      path: '/commerce-api/cnb/graphql',
      formatError: (formattedError: GraphQLFormattedError): any => {
        const codeError = formattedError.extensions?.code as any;
        return {
          status: 'ERROR',
          errors: [
            {
              message: formattedError.message || 'An unexpected error occurred',
              code: codeError || 'INTERNAL_SERVER_ERROR',
            },
          ],
        };
      },
    }),
    HttpModule,
    AuthModule,
    ClientsModule,
    ConfirmDataModule,
    SignContractModule,
    AcceptBillingModule,
    AcceptContractModule,
    StartOnboardingModule,
    MsaNbOnboardingStatusServiceModule,
    MsaNbConfigurationServiceModule,
    MsaTlNotificationEmailModule,
    MsaTlTemplateGeneratorModule,
    QueryOnboardingStatusModule,
    MsaCoCommerceServiceModule,
    MsaCoDocumentModule,
    QueryDocumentModule,
    MsaCoAuthModule,
    ResendOtpModule,
    UploadClientsFileModule,
    ValidateOtpModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        graphqlUploadExpress({
          maxFileSize: 10000000, // 10 MB
          maxFiles: 1,
        }),
      )
      .forRoutes('/commerce-api/cnb/graphql');
  }
}
