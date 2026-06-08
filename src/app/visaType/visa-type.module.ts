import { Module } from '@nestjs/common';
import { VisaTypeService } from './visa-type.service';
import { VisaTypeController } from './visa-type.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VisaTypeController],
  providers: [VisaTypeService],
  exports: [VisaTypeService],
})
export class VisaTypeModule {}