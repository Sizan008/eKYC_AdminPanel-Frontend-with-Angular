import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AddressDto } from '../../../shared/models/address.model';

@Injectable({
  providedIn: 'root'
})
export class WarehouseService {
  /**
   * Mock warehouse addresses for stock management
   */
  private mockWarehouses: AddressDto[] = [
    {
      villWardId: 'WH-001',
      villWardNm: 'Mirpur',
      villWardShNm: 'MR',
      isVillage: 0,
      vwApproveFlag: 1,
      unionMuniId: 1,
      unionMuniName: 'Mirpur',
      unionMuniShNm: 'MR',
      thanaId: 101,
      thanaNm: 'Mirpur',
      thanaShNm: 'MR',
      districtId: 1,
      districtNm: 'Dhaka',
      divisionId: 1,
      divisionNm: 'Dhaka',
      divisionShNm: 'DHK',
      upozilaCitycorpId: null,
      upozilaCitycorpNm: null,
      mouzaId: null,
      mouzaNm: null,
      countryId: 1,
      countryNm: 'Bangladesh',
      countryShNm: 'BD'
    },
    {
      villWardId: 'WH-002',
      villWardNm: 'Gulshan',
      villWardShNm: 'GUL',
      isVillage: 0,
      vwApproveFlag: 1,
      unionMuniId: 2,
      unionMuniName: 'Gulshan',
      unionMuniShNm: 'GUL',
      thanaId: 102,
      thanaNm: 'Gulshan',
      thanaShNm: 'GUL',
      districtId: 1,
      districtNm: 'Dhaka',
      divisionId: 1,
      divisionNm: 'Dhaka',
      divisionShNm: 'DHK',
      upozilaCitycorpId: null,
      upozilaCitycorpNm: null,
      mouzaId: null,
      mouzaNm: null,
      countryId: 1,
      countryNm: 'Bangladesh',
      countryShNm: 'BD'
    },
    {
      villWardId: 'WH-003',
      villWardNm: 'Dhanmondi',
      villWardShNm: 'DH',
      isVillage: 0,
      vwApproveFlag: 1,
      unionMuniId: 3,
      unionMuniName: 'Dhanmondi',
      unionMuniShNm: 'DH',
      thanaId: 103,
      thanaNm: 'Dhanmondi',
      thanaShNm: 'DH',
      districtId: 1,
      districtNm: 'Dhaka',
      divisionId: 1,
      divisionNm: 'Dhaka',
      divisionShNm: 'DHK',
      upozilaCitycorpId: null,
      upozilaCitycorpNm: null,
      mouzaId: null,
      mouzaNm: null,
      countryId: 1,
      countryNm: 'Bangladesh',
      countryShNm: 'BD'
    },
    {
      villWardId: 'WH-004',
      villWardNm: 'Banani',
      villWardShNm: 'BAN',
      isVillage: 0,
      vwApproveFlag: 1,
      unionMuniId: 4,
      unionMuniName: 'Banani',
      unionMuniShNm: 'BAN',
      thanaId: 104,
      thanaNm: 'Banani',
      thanaShNm: 'BAN',
      districtId: 1,
      districtNm: 'Dhaka',
      divisionId: 1,
      divisionNm: 'Dhaka',
      divisionShNm: 'DHK',
      upozilaCitycorpId: null,
      upozilaCitycorpNm: null,
      mouzaId: null,
      mouzaNm: null,
      countryId: 1,
      countryNm: 'Bangladesh',
      countryShNm: 'BD'
    },
    {
      villWardId: 'WH-005',
      villWardNm: 'Tejgaon',
      villWardShNm: 'TZ',
      isVillage: 0,
      vwApproveFlag: 1,
      unionMuniId: 5,
      unionMuniName: 'Tejgaon',
      unionMuniShNm: 'TZ',
      thanaId: 105,
      thanaNm: 'Tejgaon',
      thanaShNm: 'TZ',
      districtId: 1,
      districtNm: 'Dhaka',
      divisionId: 1,
      divisionNm: 'Dhaka',
      divisionShNm: 'DHK',
      upozilaCitycorpId: null,
      upozilaCitycorpNm: null,
      mouzaId: null,
      mouzaNm: null,
      countryId: 1,
      countryNm: 'Bangladesh',
      countryShNm: 'BD'
    }
  ];

  constructor() {}

  /**
   * Get all warehouses
   */
  getWarehouses(): Observable<AddressDto[]> {
    return of(this.mockWarehouses);
  }

  /**
   * Search warehouses by query
   */
  searchWarehouses(query: string): Observable<AddressDto[]> {
    if (!query || query.trim().length === 0) {
      return of(this.mockWarehouses);
    }

    const lowerQuery = query.toLowerCase();
    const filtered = this.mockWarehouses.filter(warehouse =>
      warehouse.villWardNm.toLowerCase().includes(lowerQuery) ||
      warehouse.thanaNm.toLowerCase().includes(lowerQuery) ||
      warehouse.districtNm.toLowerCase().includes(lowerQuery) ||
      warehouse.unionMuniName.toLowerCase().includes(lowerQuery)
    );

    return of(filtered);
  }

  /**
   * Get warehouse by ID
   */
  getWarehouseById(id: string): Observable<AddressDto | undefined> {
    return of(this.mockWarehouses.find(w => w.villWardId === id));
  }
}
