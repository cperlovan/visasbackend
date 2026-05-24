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
exports.CreateInitialVisaDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const shared_enums_1 = require("../shared-enums");
// La línea de re-exportación no es necesaria aquí y puede causar confusión.
// export { VisaType, Gender };
// Cambiamos el nombre de la clase para que coincida con lo que el backend espera.
class CreateInitialVisaDto {
    constructor() {
        this.status = shared_enums_1.ApplicationStatus.DRAFT;
    }
}
exports.CreateInitialVisaDto = CreateInitialVisaDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: shared_enums_1.VisaType, example: shared_enums_1.VisaType.TURISTA, description: 'Categoría oficial MPPRE' }),
    (0, class_validator_1.IsEnum)(shared_enums_1.VisaType),
    __metadata("design:type", String)
], CreateInitialVisaDto.prototype, "visaType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: shared_enums_1.ApplicationStatus, example: shared_enums_1.ApplicationStatus.DRAFT, description: 'Estado inicial' }),
    (0, class_validator_1.IsEnum)(shared_enums_1.ApplicationStatus),
    __metadata("design:type", String)
], CreateInitialVisaDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'VIS-2026-001', description: 'Código único de la aplicación' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateInitialVisaDto.prototype, "applicationCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Juan' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateInitialVisaDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Pérez' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateInitialVisaDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'juan.perez@example.com' }),
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateInitialVisaDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Venezolana' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateInitialVisaDto.prototype, "nationality", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ABC123456' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateInitialVisaDto.prototype, "passportNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1990-05-15', format: 'YYYY-MM-DD' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateInitialVisaDto.prototype, "birthDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2030-05-15', description: 'Vencimiento del pasaporte (OCR)' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateInitialVisaDto.prototype, "passportExpiryDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: shared_enums_1.Gender, example: shared_enums_1.Gender.MALE }),
    (0, class_validator_1.IsEnum)(shared_enums_1.Gender),
    __metadata("design:type", String)
], CreateInitialVisaDto.prototype, "gender", void 0);
