// Añade esta línea para que los enums sean visibles fuera de la librería
export * from './lib/shared-enums';

// Mantén las exportaciones que ya tenías
export * from '../../app/visas/dto/create-visa.dto';
export * from './lib/visa/update-visa.dto';
export * from '../../app/visas/dto/update-visa-status.dto';
export * from './lib/visa/create-initial-visa.dto';
export * from './lib/visa/initiate-payment.dto';
export * from '../../app/visas/complete-visa-form.dto';