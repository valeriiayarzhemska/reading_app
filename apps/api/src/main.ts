import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { DEFAULT_DEV_USER_ID, DEV_USERS } from './auth/dev-users.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  if (process.env.NODE_ENV !== 'production') {
    setupSwagger(app);
  }

  await app.listen(process.env.PORT ?? 3000);
}

// Interactive API docs at /docs (raw OpenAPI JSON at /docs-json)
function setupSwagger(app: Parameters<typeof SwaggerModule.createDocument>[0]) {
  const config = new DocumentBuilder()
    .setTitle('Reading App API')
    .setVersion('0.1')
    // TEMPORARY until real auth (Stage 3)
    .addGlobalParameters({
      name: 'x-user-id',
      in: 'header',
      required: false,
      description: `Dev user. Alice: ${DEV_USERS[0].id}, Bob: ${DEV_USERS[1].id}. Empty = Alice.`,
      schema: { type: 'string', format: 'uuid', example: DEFAULT_DEV_USER_ID },
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document);
}

await bootstrap();
