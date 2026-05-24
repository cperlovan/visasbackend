/**
 * Punto de entrada seguro para el Frontend.
 * Re-exporta los tipos y enums desde la fuente de verdad segura.
 */

// Exportamos los enums desde el archivo seguro
export { VisaType, Gender, ApplicationStatus } from './shared-enums';

// Exportamos el TIPO de datos del DTO, no la clase completa.
export type { CreateInitialVisaDto as InitialVisaApplicationData } from './visa/create-initial-visa.dto';
