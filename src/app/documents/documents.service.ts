import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentStatusDto } from './dto/update-document-status.dto';
import { DocumentType, DocumentStatus } from '@prisma/client';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  // Método original para el DocumentsController
  async create(dto: CreateDocumentDto) {
    return this.prisma.document.create({ data: dto });
  }

  // Método para crear un registro de documento en la DB (usado por VisasService)
  async createDocumentRecord(type: DocumentType, url: string, visaApplicationId: string) {
    return this.prisma.document.create({
      data: { type, url, visaApplicationId, status: DocumentStatus.PENDING },
    });
  }

  async findAll() {
    return this.prisma.document.findMany({ orderBy: { createdAt: 'desc' }
    });
  }

  async findByApplication(visaApplicationId: string) {
    return this.prisma.document.findMany({
      where: { visaApplicationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException(`Documento ${id} no encontrado`);
    return doc;
  }

  async updateStatus(id: string, dto: UpdateDocumentStatusDto) {
    await this.findOne(id);
    return this.prisma.document.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.document.delete({ where: { id } });
  }
}
