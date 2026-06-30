/* eslint-disable @typescript-eslint/no-explicit-any */
export class APIValidationError extends Error {
  status: number;
  message: string;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.message = message;
    this.data = data || {};
  }
}
