import { Module } from '@nestjs/common';

import { CollectionsController } from './collections.controller.js';
import { CollectionsService } from './collections.service.js';

@Module({
  controllers: [CollectionsController],
  providers: [CollectionsService],
  // Public profiles list a reader's collections
  exports: [CollectionsService],
})
export class CollectionsModule {}
