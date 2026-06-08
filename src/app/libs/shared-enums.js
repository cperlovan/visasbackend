"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationStatus = exports.Gender = exports.VisaType = void 0;
/**
 * ESTA ES LA ÚNICA FUENTE DE VERDAD PARA LOS ENUMS.
 * Este archivo es 100% seguro para frontend y backend.
 * No importa NADA y no tiene dependencias.
 */
var VisaType;
(function (VisaType) {
    VisaType["TURISTA"] = "TURISTA";
    VisaType["TRABAJO"] = "TRABAJO";
    VisaType["ESTUDIANTE"] = "ESTUDIANTE";
    VisaType["RESIDENCIA"] = "RESIDENCIA";
})(VisaType || (exports.VisaType = VisaType = {}));
var Gender;
(function (Gender) {
    Gender["MALE"] = "MALE";
    Gender["FEMALE"] = "FEMALE";
    Gender["OTHER"] = "OTHER";
})(Gender || (exports.Gender = Gender = {}));
var ApplicationStatus;
(function (ApplicationStatus) {
    ApplicationStatus["DRAFT"] = "DRAFT";
    ApplicationStatus["SUBMITTED"] = "SUBMITTED";
    ApplicationStatus["IN_REVIEW"] = "IN_REVIEW";
    ApplicationStatus["APPROVED"] = "APPROVED";
    ApplicationStatus["REJECTED"] = "REJECTED";
})(ApplicationStatus || (exports.ApplicationStatus = ApplicationStatus = {}));
