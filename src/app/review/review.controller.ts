import { Controller, Get, Patch, Body, Param, Query } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { UpdateVisaStatusDto } from '@cancilleria-digital/shared-dto';
import { ApplicationStatus } from '@prisma/client';

@ApiTags('visas') // Cambiado a 'visas' para que aparezca en la misma sección de Swagger
@Controller('v1/tramites/review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('queue')
  @ApiOperation({ summary: 'Obtener cola de trabajo por estado (Analista/Coordinador)' })
  @ApiQuery({ name: 'status', enum: ApplicationStatus, example: ApplicationStatus.VALIDATION })
  getQueue(@Query('status') status: ApplicationStatus) {
    return this.reviewService.getQueue(status);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar estatus de expediente con observaciones (Subsanación/Preaprobación)' })
  @ApiParam({ name: 'id', description: 'UUID de la solicitud de visa' })
  processReview(@Param('id') id: string, @Body() dto: UpdateVisaStatusDto) {
    return this.reviewService.processReview(id, dto);
  }
}
