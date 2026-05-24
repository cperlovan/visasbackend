/**
 * ESTA ES LA ÚNICA FUENTE DE VERDAD PARA LOS ENUMS.
 * Este archivo es 100% seguro para frontend y backend.
 * No importa NADA y no tiene dependencias.
 */
export enum VisaType {
  TURISTA = 'TURISTA',
  TRABAJO = 'TRABAJO',
  ESTUDIANTE = 'ESTUDIANTE',
  RESIDENCIA = 'RESIDENCIA',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}