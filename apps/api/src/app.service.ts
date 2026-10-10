import { Injectable } from '@nestjs/common';
import { BookFormat } from '@reading/shared';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getFormats(): BookFormat[] {
    return Object.values(BookFormat);
  }
}
