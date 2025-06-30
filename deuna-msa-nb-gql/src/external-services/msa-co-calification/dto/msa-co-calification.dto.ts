export class CalificationResponse {
  status: string;
  message: string;
}

export class CalificationInput {
  userId: string;
  rating: number;
  context: string;
  comments: string;
}
