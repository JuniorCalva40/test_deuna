import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { GetRucInformationResponseDto } from '../dto/get-ruc-information-response.dto';
import { IMsaTlDigisignInvoiceService } from '../interfaces/imsa-tl-digisign-invoice-service.interface';
import { CreateInvoiceRequestDto } from '../dto/create-invoice-request.dto';
import { CreateInvoiceResponseDto } from '../dto/create-invoice-response.dto';
import { TrackingHeaders } from '../../../common/constants/common';

@Injectable()
export class RestMsaTlDigisignInvoiceService
  implements IMsaTlDigisignInvoiceService
{
  private readonly logger = new Logger(RestMsaTlDigisignInvoiceService.name);
  private readonly apiUrl: string;
  private static readonly MSA_TL_DIGISIGN_INVOICE_URL =
    'MSA_TL_DIGISIGN_INVOICE_URL';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.configService.get<string>(
      RestMsaTlDigisignInvoiceService.MSA_TL_DIGISIGN_INVOICE_URL,
    );
    if (!this.apiUrl) {
      this.logger.error(
        `${RestMsaTlDigisignInvoiceService.MSA_TL_DIGISIGN_INVOICE_URL} is not defined`,
      );
    }
  }

  async getRucInformation(
    ruc: string,
    headers: TrackingHeaders,
  ): Promise<GetRucInformationResponseDto> {
    const url = `${this.apiUrl}/api/v1/ruc/${ruc}`;
    const { data } = await lastValueFrom(
      this.httpService.get<GetRucInformationResponseDto>(url, {
        headers,
      }),
    );
    return data;
  }

  async createInvoice(
    invoiceData: CreateInvoiceRequestDto,
    headers: TrackingHeaders,
  ): Promise<CreateInvoiceResponseDto> {
    console.debug('enviando factura hacia digisign', invoiceData);
    const url = `${this.apiUrl}/api/v1/invoices`;
    const { data } = await lastValueFrom(
      this.httpService.post<CreateInvoiceResponseDto>(url, invoiceData, {
        headers,
      }),
    );
    return data;
  }
}
