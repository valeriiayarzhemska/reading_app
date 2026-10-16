import { Module } from '@nestjs/common';
import { CoverStorage } from './cover-storage.service.js';
import { UploadsController } from './uploads.controller.js';

@Module({
  controllers: [UploadsController],
  providers: [CoverStorage],
  exports: [CoverStorage],
})
export class UploadsModule {}
