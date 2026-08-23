import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';

import { ADMINEKYC_API_ENDPOINTS } from '../constants/adminekyc-api.constants';
import { AdminekycApiError } from '../models/adminekyc-api-response.model';
import {
  AdminekycAssignProductRequest,
  AdminekycAvailableProductsResponse,
  AdminekycChannelProductResponse,
  AdminekycCreateProductDefaultsResponse,
  AdminekycCreateProductRequest,
  AdminekycProductChannelResponse,
  AdminekycProductResponse
} from '../models/adminekyc-product.model';
import {
  AdminProductManagementProduct,
  ProductCreateForm,
  ProductManagementAvailableProducts,
  ProductManagementChannel,
  ProductManagementChannelProduct,
  ProductFormValue
} from '../models/product-management.model';
import { AdminekycApi } from './adminekyc-api';

@Injectable({
  providedIn: 'root'
})
export class ProductManagementService {
  constructor(private api: AdminekycApi) {}

  getProductChannels(): Observable<ProductManagementChannel[]> {
    return this.api
      .getApi<AdminekycProductChannelResponse[]>(
        ADMINEKYC_API_ENDPOINTS.product.index
      )
      .pipe(
        map((channels) =>
          (channels ?? [])
            .map((channel) => ({
              id: this.toPositiveInteger(channel.ChannelId),
              channelName: this.toText(channel.ChannelName)
            }))
            .filter((channel) => channel.id > 0)
        )
      );
  }

  getProductsByChannel(
    channelId: number
  ): Observable<ProductManagementChannelProduct[]> {
    return this.api
      .getApi<AdminekycChannelProductResponse[]>(
        ADMINEKYC_API_ENDPOINTS.product.productsOfChannel,
        { id: channelId }
      )
      .pipe(
        map((products) =>
          (products ?? []).map((product) => {
            const productCode = this.toPositiveInteger(product.ProductCode);
            return {
              id: productCode,
              productCode,
              productName: this.toText(product.ProductName)
            };
          })
        ),
        catchError((error: unknown) =>
          this.isNoDataError(error) ? of([]) : throwError(() => error)
        )
      );
  }

  getAllProducts(): Observable<AdminProductManagementProduct[]> {
    return this.api
      .getApi<AdminekycProductResponse[]>(
        ADMINEKYC_API_ENDPOINTS.product.list
      )
      .pipe(
        map((products) =>
          (products ?? []).map((product) => this.mapProduct(product))
        ),
        catchError((error: unknown) =>
          this.isNoDataError(error) ? of([]) : throwError(() => error)
        )
      );
  }

  getAvailableProducts(
    channelId: number
  ): Observable<ProductManagementAvailableProducts> {
    return this.api
      .getApi<AdminekycAvailableProductsResponse>(
        ADMINEKYC_API_ENDPOINTS.product.availableProducts,
        { id: channelId }
      )
      .pipe(
        map((response) => ({
          channelId: this.toPositiveInteger(response.ChannelId) || channelId,
          channelName: this.toText(response.ChannelName),
          products: (response.Products ?? []).map((product) => {
            const productCode = this.toPositiveInteger(product.ProductCode);
            return {
              id: productCode,
              productCode,
              productName: this.toText(product.ProductName),
              productDescription: this.toText(product.ProductDesc)
            };
          })
        }))
      );
  }

  getCreateDefaults(): Observable<ProductCreateForm> {
    return this.api
      .getApi<AdminekycCreateProductDefaultsResponse>(
        ADMINEKYC_API_ENDPOINTS.product.createView
      )
      .pipe(
        map((response) => ({
          productId: this.toText(response.ProductId),
          productType: this.toText(response.ProductType) || '00001',
          serviceTypeId: this.toText(response.ServiceTypeId),
          productName: this.toText(response.ProductName),
          productDescription: this.toText(response.ProductDesc),
          amountMax: this.toFormNumber(response.AmountMax, 0),
          amountMin: this.toFormNumber(response.AmountMin, 0),
          gender: this.toText(response.Gender),
          profession: this.toText(response.Profession),
          ageMax: this.toFormNumber(response.AgeMax, 0),
          ageMin: this.toFormNumber(response.AgeMin, 0)
        }))
      );
  }

  createProduct(formValue: ProductCreateForm): Observable<string> {
    const payload = this.toCreateRequest(formValue);

    return this.api
      .postApiResponse<void, AdminekycCreateProductRequest>(
        ADMINEKYC_API_ENDPOINTS.product.create,
        payload
      )
      .pipe(
        map(
          (response) =>
            response.Message?.trim() || 'Product created successfully.'
        )
      );
  }

  assignProductToChannel(
    channelId: number,
    productCode: number
  ): Observable<string> {
    const payload: AdminekycAssignProductRequest = {
      ProductCode: this.requirePositiveInteger(productCode, 'Product'),
      ChannelID: this.requirePositiveInteger(channelId, 'Channel')
    };

    return this.api
      .postApiResponse<void, AdminekycAssignProductRequest>(
        ADMINEKYC_API_ENDPOINTS.product.assignProduct,
        payload
      )
      .pipe(
        map(
          (response) =>
            response.Message?.trim() || 'Product assigned successfully.'
        )
      );
  }

  private toCreateRequest(
    formValue: ProductCreateForm
  ): AdminekycCreateProductRequest {
    const productType = this.requireText(
      formValue.productType,
      'Product Type',
      5
    );

    if (!['00001', '00002', '00003'].includes(productType)) {
      throw new Error('Please select a valid Product Type.');
    }

    return {
      ApplicationId: 3,
      ProductId: this.requireText(formValue.productId, 'Product ID', 20),
      ServiceTypeId: this.requireText(
        formValue.serviceTypeId,
        'Service Type ID',
        20
      ),
      ProductName: this.requireText(
        formValue.productName,
        'Product Name',
        100
      ),
      ProductDesc: this.toNullableText(
        formValue.productDescription,
        'Product Description',
        2000
      ),
      ProductType: productType,
      AmountMax: this.toAmount(formValue.amountMax, 'Amount Max'),
      AmountMin: this.toAmount(formValue.amountMin, 'Amount Min'),
      Gender: this.toNullableText(formValue.gender, 'Gender', 1),
      Profession: this.toNullableText(formValue.profession, 'Profession', 5),
      AgeMax: this.toAge(formValue.ageMax, 'Age Max'),
      AgeMin: this.toAge(formValue.ageMin, 'Age Min')
    };
  }

  private mapProduct(
    product: AdminekycProductResponse
  ): AdminProductManagementProduct {
    const productCode = this.toPositiveInteger(product.ProductCode);
    return {
      id: productCode,
      productCode,
      productId: this.toText(product.ProductId),
      productName: this.toText(product.ProductName),
      productDescription: this.toText(product.ProductDesc)
    };
  }

  private requireText(
    value: ProductFormValue,
    label: string,
    maxLength: number
  ): string {
    const normalized = this.normalizeFormValue(value);
    if (!normalized) {
      throw new Error(`${label} is required.`);
    }

    if (normalized.length > maxLength) {
      throw new Error(`${label} must be at most ${maxLength} characters.`);
    }

    return normalized;
  }

  private toNullableText(
    value: ProductFormValue,
    label: string,
    maxLength: number
  ): string | null {
    const normalized = this.normalizeFormValue(value);
    if (!normalized) {
      return null;
    }

    if (normalized.length > maxLength) {
      throw new Error(`${label} must be at most ${maxLength} characters.`);
    }

    return normalized;
  }

  private toAmount(value: ProductFormValue, label: string): number {
    const normalized = this.normalizeFormValue(value) || '0';

    if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
      throw new Error(`${label} must be a non-negative number with up to 2 decimal places.`);
    }

    const parsed = Number(normalized);
    if (!Number.isFinite(parsed) || parsed > 999999999999999.99) {
      throw new Error(`${label} is outside the supported range.`);
    }

    return parsed;
  }

  private toAge(value: ProductFormValue, label: string): number {
    const normalized = this.normalizeFormValue(value) || '0';
    const parsed = Number(normalized);

    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 999) {
      throw new Error(`${label} must be an integer between 0 and 999.`);
    }

    return parsed;
  }

  private requirePositiveInteger(value: number, label: string): number {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`${label} is invalid.`);
    }

    return value;
  }

  private toPositiveInteger(value: number | null | undefined): number {
    const parsed = Number(value ?? 0);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
  }

  private toFormNumber(
    value: number | null | undefined,
    fallback: number
  ): string {
    const parsed = Number(value ?? fallback);
    return Number.isFinite(parsed) ? String(parsed) : String(fallback);
  }

  private normalizeFormValue(value: ProductFormValue): string {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value).trim();
  }

  private toText(value: string | null | undefined): string {
    return value?.trim() ?? '';
  }

  private isNoDataError(error: unknown): boolean {
    return error instanceof AdminekycApiError &&
      error.apiMessage?.trim().toLowerCase() === 'no data found.';
  }
}
