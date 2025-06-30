import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { GraphQLFormattedError } from 'graphql';
import { graphqlUploadExpress } from 'graphql-upload-ts';

// Configuration
import configuration from './config/configuration';

// Modules
import { SignContractModule } from './operations/sign-contract/sign-contract.module';
import { AuthModule } from './controllers/auth/auth.module';
import { ConfirmDataModule } from './operations/confirm-data/confirm-data.module';
import { CnbClientsModule } from './operations/query-validate-cnb-state/query-cnbClients.module';
import { MsaNbOnboardingStatusServiceModule } from './external-services/msa-co-onboarding-status/msa-co-onboarding-status-service.module';
import { MsaNbConfigurationServiceModule } from './external-services/msa-nb-configuration/msa-nb-configuration-service.module';
import { AcceptContractModule } from './operations/accept-contract/accept-contract.module';
import { StartOnboardingModule } from './operations/start-onboarding/start-onboarding.module';
import { MsaCoCommerceServiceModule } from './external-services/msa-co-commerce/msa-co-commerce-service.module';
import { MsaCoAuthModule } from './external-services/msa-co-auth/msa-co-auth.module';
import { MsaTlNotificationEmailModule } from './external-services/msa-tl-notification-email/msa-tl-notification-email.module';
import { MsaTlTemplateGeneratorModule } from './external-services/msa-tl-template-generator/msa-tl-template-generator.module';
import { QueryDocumentModule } from './operations/query-document/query-document.module';
import { ResendOtpModule } from './operations/resend-otp/resend-otp.module';
import { UploadClientsFileModule } from './operations/upload-clients-file/upload-clients-file.module';
import { ValidateOtpModule } from './operations/validate-otp/validate-otp.module';
import { ValidateBalanceModule } from './operations/validate-balance/validate-balance.module';
import { ValidateDepositAccountModule } from './operations/validate-deposit-account/validate-deposit-account.module';
import { InitiateCellPhoneDepositModule } from './operations/initiate-cellphone-deposit/initiate-cellphone-deposit.module';
import { MsaCoCalificationModule } from './external-services/msa-co-calification/msa-co-calification.service.module';
import { CreateCalificationModule } from './operations/create-calification/create-calification.module';
import { ExecuteDepositModule } from './operations/execute-deposit/execute-deposit.module';
import { DocumentValidationModule } from './operations/cnb-document-validation-start/document-validation.module';
import { StoreFingeprintCodeModule } from './operations/store-fingerprint-code/store-fingerprint-code.module';
import { StartMorphologyValidationModule } from './operations/query-start-biometric-validation/start-biometric-validation.module';
import { ConfirmDepositModule } from './operations/confirm-deposit/confirm-deposit.module';
import { CommissionsStatusModule } from './operations/commissions-status/commissions-status.module';
import { GetCnbTransactionsModule } from './operations/query-get-cnb-transactions/get-cnb-transactions.module';
// Controllers
import { HealthController } from './controllers/health.controller';
import { GenerateQrModule } from './operations/generate-qr/generate-qr.module';
import { MsaMcBoHierarchyModule } from './external-services/msa-mc-bo-hierarchy/msa-mc-bo-hierarchy.module';
import { MonthlyCommissionSummaryModule } from './operations/monthly-commission-summary/monthly-commission-summary.module';
import { SearchCommissionsModule } from './operations/search-commissions/search-commissions.module';
import { MsaMcCrCommissionsModule } from './external-services/deuna-msa-mc-cr-commissions/deuna-msa-mc-cr-commissions.module';
import { GetCommissionPayoutPreviewModule } from './operations/query-get-commission-payout-preview/get-commission-payout-preview.module';
import { GenerateCommissionInvoiceModule } from './operations/generate-commission-invoice/generate-commission-invoice.module';
import { MsaBoMcClientModule } from './external-services/msa-mc-bo-client/msa-mc-bo-client.service.module';
import { MsaNbCnbAccountValidationModule } from './external-services/msa-nb-cnb-account-validation/msa-nb-cnb-account-validation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        autoSchemaFile: 'schema.gql',
        sortSchema: true,
        playground: configService.get<string>('GQL_INTROSPECTION') === 'true',
        introspection:
          configService.get<string>('GQL_INTROSPECTION') === 'true',
        path: '/commerce-api/cnb/graphql',
        formatError: (formattedError: GraphQLFormattedError): any => {
          const codeError = formattedError.extensions?.code as any;
          return {
            status: 'ERROR',
            errors: [
              {
                message:
                  formattedError.message || 'An unexpected error occurred',
                code: codeError ?? 'INTERNAL_SERVER_ERROR',
              },
            ],
          };
        },
      }),
      inject: [ConfigService],
    }),
    HttpModule,
    AuthModule,
    CnbClientsModule,
    ConfirmDataModule,
    SignContractModule,
    AcceptContractModule,
    StartOnboardingModule,
    MsaNbOnboardingStatusServiceModule,
    MsaNbConfigurationServiceModule,
    MsaTlNotificationEmailModule,
    MsaTlTemplateGeneratorModule,
    MsaCoCommerceServiceModule,
    QueryDocumentModule,
    MsaCoAuthModule,
    ResendOtpModule,
    UploadClientsFileModule,
    ValidateOtpModule,
    ValidateBalanceModule,
    ValidateDepositAccountModule,
    InitiateCellPhoneDepositModule,
    MsaCoCalificationModule,
    CreateCalificationModule,
    ExecuteDepositModule,
    GenerateQrModule,
    MsaNbCnbAccountValidationModule,
    DocumentValidationModule,
    StoreFingeprintCodeModule,
    StartMorphologyValidationModule,
    ConfirmDepositModule,
    MsaMcBoHierarchyModule,
    CommissionsStatusModule,
    GetCnbTransactionsModule,
    MonthlyCommissionSummaryModule,
    MsaMcCrCommissionsModule,
    SearchCommissionsModule,
    GetCommissionPayoutPreviewModule,
    GenerateCommissionInvoiceModule,
    MsaBoMcClientModule,
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
