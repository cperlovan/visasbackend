"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateVisaDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class CreateVisaDto {
}
exports.CreateVisaDto = CreateVisaDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'VIS-2026-001', description: 'Código único de la solicitud' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVisaDto.prototype, "applicationCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.ApplicationStatus, example: client_1.ApplicationStatus.DRAFT, description: 'Estado de la solicitud' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(client_1.ApplicationStatus),
    __metadata("design:type", String)
], CreateVisaDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Juan', description: 'Nombre del solicitante' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateVisaDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Pérez', description: 'Apellido del solicitante' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateVisaDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'AB123456', description: 'Número de pasaporte' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVisaDto.prototype, "passportNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.VisaType, example: client_1.VisaType.TURISTA, description: 'Categoría oficial MPPRE' }),
    (0, class_validator_1.IsEnum)(client_1.VisaType),
    __metadata("design:type", String)
], CreateVisaDto.prototype, "visaType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Colombiana', description: 'Nacionalidad del solicitante' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVisaDto.prototype, "nationality", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1990-05-15', description: 'Fecha de nacimiento (YYYY-MM-DD)' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateVisaDto.prototype, "birthDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.Gender, example: client_1.Gender.MALE }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(client_1.Gender),
    __metadata("design:type", String)
], CreateVisaDto.prototype, "gender", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.MaritalStatus, example: client_1.MaritalStatus.SINGLE }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(client_1.MaritalStatus),
    __metadata("design:type", String)
], CreateVisaDto.prototype, "maritalStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Ingeniero de Software', description: 'Profesión u ocupación' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVisaDto.prototype, "profession", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Tech Corp S.A.', description: 'Empleador actual' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVisaDto.prototype, "currentEmployer", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+57 1 234 5678', description: 'Teléfono de la oficina' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVisaDto.prototype, "officePhone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Turismo', description: 'Propósito del viaje' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVisaDto.prototype, "purposeOfTrip", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'juan.perez@email.com', description: 'Correo electrónico del solicitante' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVisaDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 30, description: 'Duración de la estadía en días' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateVisaDto.prototype, "stayDuration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-07-01', description: 'Fecha de llegada (YYYY-MM-DD)' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateVisaDto.prototype, "arrivalDate", void 0);
