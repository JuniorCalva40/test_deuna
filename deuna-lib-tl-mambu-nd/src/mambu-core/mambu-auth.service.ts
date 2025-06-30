
import { Inject, Injectable } from '@nestjs/common';
import { MambuAcceptHeader, MambuApiKeyAuthOptions, MambuBasiAuthOptions } from './mambu.types';
import { MAMBU_CLIENT } from './constants/constants';

@Injectable()
export class MambuAuthService {

    headers = {
        "Content-Type": "application/json",
        Accept: MambuAcceptHeader.ACCEPT_V2,
    };

    constructor(@Inject(MAMBU_CLIENT) private readonly options: MambuBasiAuthOptions | MambuApiKeyAuthOptions) {
        if ('apikey' in options) {
            this.headers['apikey'] = options.apikey;
        } else {
            const authHeader: string = Buffer.from(`${options.user}:${options.password}`).toString("base64");
            this.headers['Authorization'] = `Basic ${authHeader}`;
        }
    }

}
