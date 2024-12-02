import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
  .setTitle('MemeDex')
  .setDescription('MemeDex API')
  .setVersion('1.0')
  .addTag('MemeDex')
  .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动剔除非装饰器定义的属性
      forbidNonWhitelisted: true, // 当请求中存在非白名单属性时抛出错误
      transform: true, // 自动转换为 DTO 类的实例
      disableErrorMessages: process.env.ENV === 'production', // 可以根据生产环境需要关闭错误信息
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
