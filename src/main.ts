import 'reflect-metadata';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { requestIdMiddleware } from './common/http/request-id.middleware';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ApiKeyGuard } from './common/auth/api-key.guard';
import { ConfigService } from '@nestjs/config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.enableShutdownHooks();
  app.use(requestIdMiddleware);

  const reflector = app.get(Reflector);
  const configService = app.get(ConfigService);
  app.useGlobalGuards(new ApiKeyGuard(reflector, configService));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('TBank Payments API')
    .setDescription('Backend-only payments API with T-Kassa integration, webhooks, outbox, and idempotency.')
    .setVersion('1.0.0')
    .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'X-API-Key')
    .build();

  const doc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('/docs', app, doc);

  const port = Number(process.env.PORT || 3000);
  await app.listen(port);
}

bootstrap().catch((e) => {
  console.error(e);
  process.exit(1);
});
