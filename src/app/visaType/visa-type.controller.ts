import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { VisaTypeService } from './visa-type.service';
import { CreateVisaTypeConfigDto } from './dto/visa-type-config.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, VisaType } from '@prisma/client';

@ApiTags('backoffice-configs')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('v1/config/visas')
export class VisaTypeController {
  constructor(private readonly service: VisaTypeService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Configurar requisitos y flujos para un tipo de visa' })
  create(@Body() dto: CreateVisaTypeConfigDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las configuraciones de visas' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':type')
  @ApiOperation({ summary: 'Obtener configuración específica por tipo de visa' })
  findByType(@Param('type') type: VisaType) {
    return this.service.findByType(type);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar configuración de visa' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}