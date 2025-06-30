export class LocationDto {
  code: string;
  city: string;
  province: string;
  address: string;
  points_of_sale_code: string;
  points_of_sale_description: string;
}

export class CreateAccountDto {
  provider: string;
  ruc: string;
  legal_name: string;
  address: string;
  telephone: string;
  email: string;
  category: string;
  economic_activities: string;
  entity_type: string;
  location: LocationDto;
}
