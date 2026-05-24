import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentStatusDto } from './dto/update-document-status.dto';

@ApiTags('documents')
@Controller('documents')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un documento en una solicitud' })
  @ApiResponse({ status: 201, description: 'Documento registrado.' })
  create(@Body() dto: CreateDocumentDto) {
    return this.documentsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los documentos' })
  findAll() {
    return this.documentsService.findAll();
  }

  @Get('application/:visaApplicationId')
  @ApiOperation({ summary: 'Listar documentos de una solicitud de visa' })
  @ApiParam({ name: 'visaApplicationId', description: 'UUID de la solicitud' })
  findByApplication(@Param('visaApplicationId') visaApplicationId: string) {
    return this.documentsService.findByApplication(visaApplicationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un documento por ID' })
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualizar estado de un documento (aprobar/rechazar)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateDocumentStatusDto) {
    return this.documentsService.updateStatus(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un documento' })
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}
