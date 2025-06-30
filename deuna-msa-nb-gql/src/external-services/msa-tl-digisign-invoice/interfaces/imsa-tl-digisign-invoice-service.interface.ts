import { CreateInvoiceRequestDto } from '../dto/create-invoice-request.dto';
import { CreateInvoiceResponseDto } from '../dto/create-invoice-response.dto';
import { GetRucInformationResponseDto } from '../dto/get-ruc-information-response.dto';
import { TrackingHeaders } from '../../../common/constants/common';

export interface IMsaTlDigisignInvoiceService {
  getRucInformation(
    ruc: string,
    headers: TrackingHeaders,
  ): Promise<GetRucInformationResponseDto>;
  createInvoice(
    invoiceData: CreateInvoiceRequestDto,
    headers: TrackingHeaders,
  ): Promise<CreateInvoiceResponseDto>;
}
