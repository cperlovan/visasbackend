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
exports.CompleteVisaFormDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class CompleteVisaFormDto {
}
exports.CompleteVisaFormDto = CompleteVisaFormDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.MaritalStatus, example: client_1.MaritalStatus.SINGLE }),
    (0, class_validator_1.IsEnum)(client_1.MaritalStatus),
    __metadata("design:type", String)
], CompleteVisaFormDto.prototype, "maritalStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Caracas, Venezuela', description: 'Lugar de nacimiento' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CompleteVisaFormDto.prototype, "birthPlace", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ORDINARIO', description: 'Tipo de pasaporte (ORDINARIO, DIPLOMATICO, etc.)' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteVisaFormDto.prototype, "passportType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2020-01-01', format: 'YYYY-MM-DD' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CompleteVisaFormDto.prototype, "passportIssueDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Ingeniero', description: 'Ocupación del solicitante' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteVisaFormDto.prototype, "profession", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Tech Corp S.A.', description: 'Empleador actual' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteVisaFormDto.prototype, "currentEmployer", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Turismo', description: 'Propósito del viaje' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CompleteVisaFormDto.prototype, "purposeOfTrip", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-07-01', format: 'YYYY-MM-DD' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CompleteVisaFormDto.prototype, "arrivalDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 30, description: 'Duración de la estancia en días' }),
    (0, class_validator_1.IsInt)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(365),
    __metadata("design:type", Number)
], CompleteVisaFormDto.prototype, "stayDuration", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '+582120000000' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteVisaFormDto.prototype, "officePhone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'María Pérez +58412000000', description: 'Contacto de emergencia' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteVisaFormDto.prototype, "emergencyContact", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Propio / Empresa Tech', description: 'Responsable económico' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteVisaFormDto.prototype, "economicResponsible", void 0);
