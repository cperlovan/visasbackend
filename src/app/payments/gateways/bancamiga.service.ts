import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';

@Injectable()
export class BancamigaService {
  private readonly baseUrl = process.env.BANCAMIGA_BASE_URL || 'https://payments3ds.bancamiga.com';
  private readonly idComercio = process.env.BANCAMIGA_MERCHANT_UUID;
  private readonly bearerToken = process.env.BANCAMIGA_TOKEN;

  private getAuthHeader() {
    return this.bearerToken?.startsWith('Bearer ') ? this.bearerToken : `Bearer ${this.bearerToken}`;
  }

  async createOrder(data: {
    monto: string;
    descripcion: string;
    externalId: string;
    dni: string;
    nombre: string;
    referencia: string;
  }) {
    const url = `${this.baseUrl}/init/${this.idComercio}`;
    
    const params = new URLSearchParams();
    params.append('Monto', data.monto);
    params.append('Descripcion', data.descripcion);
    params.append('Externalid', data.externalId);
    params.append('Dni', data.dni);
    params.append('Name', data.nombre);
    params.append('Ref', data.referencia);
    params.append('Urldone', process.env.BANCAMIGA_URL_DONE || '');
    params.append('Urlcancel', process.env.BANCAMIGA_URL_CANCEL || '');
    params.append('Expireminute', process.env.BANCAMIGA_EXPIRE_MINUTES || '15');

    try {
      const response = await axios.post(url, params, {
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        Logger.error(`Bancamiga API request failed: ${axiosError.message}`, axiosError.stack, 'BancamigaService');
        Logger.error(`Bancamiga API response data: ${JSON.stringify(axiosError.response?.data)}`, '', 'BancamigaService');
        throw new HttpException(axiosError.response?.data || 'Error conectando con la pasarela de pago', axiosError.response?.status || HttpStatus.BAD_GATEWAY);
      }
      Logger.error(`Unexpected error in BancamigaService: ${error.message}`, error.stack, 'BancamigaService');
      throw new HttpException('Error inesperado al conectar con la pasarela de pago', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async checkStatus(ordenId: string) {
    // Eliminamos '/form' para que apunte a '.../sandbox/orden/{id}'
    const url = `${this.baseUrl}/orden/${ordenId}`;
    try {
      const response = await axios.get(url, {
        headers: { 'Authorization': this.getAuthHeader() },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        Logger.error(`Bancamiga CheckStatus failed: ${axiosError.message}`, axiosError.stack, 'BancamigaService');
        throw new HttpException(axiosError.response?.data || 'Error consultando estatus en el banco', axiosError.response?.status || HttpStatus.BAD_GATEWAY);
      }
      throw new HttpException('Error inesperado al verificar el pago', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
