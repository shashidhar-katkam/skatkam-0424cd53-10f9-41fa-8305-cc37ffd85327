import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { Organization } from './entities/organization.entity';
import { rootLogger } from './shared/logger/logger.util';

async function bootstrap() {
  const logger = rootLogger;
  logger.info('Starting Task Management API');
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })
  );
  app.enableCors({ origin: true, credentials: true });

  const config = new DocumentBuilder()
    .setTitle('Task Management API')
    .setDescription('Secure Task Management with RBAC')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);

  const jwtService = app.get(JwtService);
  const dataSource = app.get(DataSource);
  const orgRepo = dataSource.getRepository(Organization);

  function getCookie(name: string, cookieHeader: string | undefined): string | null {
    if (!cookieHeader) return null;
    const match = cookieHeader.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  }

  app.use('/api-docs', async (req: any, res: any, next: () => void) => {
    const path = req.url || req.path || '';
    const auth = req.headers?.authorization;
    const queryToken = typeof req.query?.token === 'string' ? req.query.token : null;
    const cookieToken = getCookie('swagger_token', req.headers?.cookie);
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : queryToken ?? cookieToken;
    logger.debug('Swagger middleware', {
      path,
      hasAuthHeader: !!auth,
      hasQueryToken: !!queryToken,
      hasCookieToken: !!cookieToken,
      tokenLength: token?.length ?? 0,
    });
    if (!token) {
      logger.warn('Swagger 403: no token', { path });
      res.status(403).json({
        statusCode: 403,
        message: 'Swagger is restricted to super organization. Send a valid Bearer token.',
        hint: 'Log in as a user in the super org (e.g. admin@example.com), then open: /api-docs?token=YOUR_ACCESS_TOKEN or use the Authorize button in Swagger UI.',
      });
      return;
    }
    try {
      const payload = jwtService.verify<{ organizationId?: string }>(token);
      const orgId = payload?.organizationId;
      if (!orgId) {
        logger.warn('Swagger 403: no organizationId in token', { path });
        res.status(403).json({ statusCode: 403, message: 'Swagger is only available for the super organization.' });
        return;
      }
      const org = await orgRepo.findOne({ where: { id: orgId }, select: ['id', 'isSuper'] });
      if (!org?.isSuper) {
        logger.warn('Swagger 403: org is not super', { path, organizationId: orgId });
        res.status(403).json({ statusCode: 403, message: 'Swagger is only available for the super organization.' });
        return;
      }
      if (queryToken || auth) {
        const prefix = (req.headers['x-forwarded-prefix'] as string)?.replace(/\/$/, '') || '';
        const cookiePath = prefix ? `${prefix}/api-docs` : '/api-docs';
        res.setHeader('Set-Cookie', `swagger_token=${encodeURIComponent(token)}; Path=${cookiePath}; Max-Age=120; HttpOnly; SameSite=Lax`);
      }
      logger.debug('Swagger access allowed', { path, organizationId: orgId });
      next();
    } catch (err) {
      logger.warn('Swagger 403: invalid or expired token', { path, err: String(err) });
      res.status(403).json({ statusCode: 403, message: 'Invalid or expired token.' });
    }
  });

  SwaggerModule.setup('api-docs', app, document);

  const port = process.env['PORT'] ?? 3333;
  await app.listen(port);
  const host = process.env['HOST'] ?? 'localhost';
  const baseUrl = `http://${host}:${port}`;
  logger.info('API listening', {
    port,
    baseUrl,
    swaggerPath: '/api-docs',
    swaggerUrl: `${baseUrl}/api-docs`,
    swaggerRestrictedToSuperOrg: true,
  });
}

bootstrap().catch((err) => {
  rootLogger.error('Bootstrap failed', err);
  process.exit(1);
});
