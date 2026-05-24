import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVisaTypeConfigDto } from './dto/visa-type-config.dto';
import { VisaType } from '@prisma/client';

@Injectable()
export class VisaTypeService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateVisaTypeConfigDto) {
    const existing = await this.prisma.visaTypeConfig.findUnique({
      where: { visaType: dto.visaType },
    });

    if (existing) {
      throw new ConflictException(`Ya existe una configuración para el tipo ${dto.visaType}`);
    }

    const { requirements, workflowSteps, ...configData } = dto;

    return this.prisma.visaTypeConfig.create({
      data: {
        ...configData,
        requirements: { create: requirements },
        workflowSteps: { create: workflowSteps },
      },
      include: { requirements: true, workflowSteps: true },
    });
  }

  async findAll() {
    return this.prisma.visaTypeConfig.findMany({
      include: { requirements: true, workflowSteps: true },
      orderBy: { name: 'asc' },
    });
  }

  async findByType(visaType: VisaType) {
    const config = await this.prisma.visaTypeConfig.findUnique({
      where: { visaType },
      include: { requirements: true, workflowSteps: true },
    });
    if (!config) throw new NotFoundException(`Configuración para ${visaType} no encontrada.`);
    return config;
  }

  async remove(id: string) {
    return this.prisma.visaTypeConfig.delete({ where: { id } });
  }
}