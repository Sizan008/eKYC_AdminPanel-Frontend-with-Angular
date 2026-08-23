import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AdminekycAuth } from '../../core/services/adminekyc-auth';
import { AdminekycState } from '../../core/services/adminekyc-state';
import { EcVerificationService } from '../../core/services/ec-verification.service';
import {
  EcAddressOption,
  EcFieldVerificationResult,
  EcVerificationForm,
  EcVerificationResponse
} from '../../core/models/ec-verification.model';

import { AdminLayout } from '../../sharedAdminekyc/layout/admin-layout/admin-layout';
import { GenericButton } from '../../../../shared/common-components/generic-component-type/generic-button/generic-button';
import { InputTextBox } from '../../../../shared/common-components/input-types/input-text-box/input-text-box';
import { InputDate } from '../../../../shared/common-components/input-types/input-date/input-date';
import { InputSelectOptionField } from '../../../../shared/common-components/input-types/input-select-option-field/input-select-option-field';
import { GenericModal } from '../../../../shared/common-components/generic-component-type/generic-modal/generic-modal';
import { FilePreviewComponent, FilePreviewData } from '../../../../shared/common-components/file-preview/file-preview.component';

type EcVerificationFormGroup = {
  nid: FormControl<string>;
  birthDate: FormControl<string>;
  nameBangla: FormControl<string>;
  nameEnglish: FormControl<string>;
  fatherNameBangla: FormControl<string>;
  motherNameBangla: FormControl<string>;
  spouseNameBangla: FormControl<string>;
  division: FormControl<string>;
  district: FormControl<string>;
  upazila: FormControl<string>;
  postOffice: FormControl<string>;
  postalCode: FormControl<string>;
};

type SelectOption = { key: string; value: string };

@Component({
  selector: 'app-ec-verification',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AdminLayout,
    GenericButton,
    InputTextBox,
    InputDate,
    InputSelectOptionField,
    GenericModal,
    FilePreviewComponent
  ],
  templateUrl: './ec-verification.html',
  styleUrl: './ec-verification.scss'
})
export class EcVerification implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly filePreviewCache = new Map<string, FilePreviewData>();

  readonly isLoading = signal<boolean>(false);
  readonly isLoadingDivisions = signal<boolean>(false);
  readonly isLoadingDistricts = signal<boolean>(false);
  readonly isLoadingUpazilas = signal<boolean>(false);
  readonly isLoadingPostOffices = signal<boolean>(false);

  readonly divisions = signal<EcAddressOption[]>([]);
  readonly districts = signal<EcAddressOption[]>([]);
  readonly upazilas = signal<EcAddressOption[]>([]);
  readonly postOffices = signal<EcAddressOption[]>([]);

  readonly divisionOptions = computed<SelectOption[]>(() =>
    this.toIdOptions(this.divisions())
  );
  readonly districtOptions = computed<SelectOption[]>(() =>
    this.toIdOptions(this.districts())
  );
  readonly upazilaOptions = computed<SelectOption[]>(() =>
    this.toIdOptions(this.upazilas())
  );
  readonly postOfficeOptions = computed<SelectOption[]>(() =>
    this.postOffices().map((option) => ({ key: option.name, value: option.name }))
  );

  readonly resultModalOpened = signal<boolean>(false);
  readonly verificationSuccess = signal<boolean>(false);
  readonly verificationResult = signal<EcFieldVerificationResult | null>(null);
  readonly ecPhotoUrl = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly ecForm = new FormGroup<EcVerificationFormGroup>({
    nid: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^(?:\d{10}|\d{17})$/)]
    }),
    birthDate: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    nameBangla: new FormControl('', { nonNullable: true }),
    nameEnglish: new FormControl('', { nonNullable: true }),
    fatherNameBangla: new FormControl('', { nonNullable: true }),
    motherNameBangla: new FormControl('', { nonNullable: true }),
    spouseNameBangla: new FormControl('', { nonNullable: true }),
    division: new FormControl('', { nonNullable: true }),
    district: new FormControl('', { nonNullable: true }),
    upazila: new FormControl('', { nonNullable: true }),
    postOffice: new FormControl('', { nonNullable: true }),
    postalCode: new FormControl('', { nonNullable: true })
  });

  constructor(
    public state: AdminekycState,
    public auth: AdminekycAuth,
    private ecVerificationService: EcVerificationService
  ) {}

  ngOnInit(): void {
    this.bindAddressCascade();
    this.loadDivisions();
  }

  getAdminName(): string {
    return this.auth.currentAdmin()?.name || 'Admin';
  }

  clearForm(): void {
    this.ecForm.reset(
      {
        nid: '',
        birthDate: '',
        nameBangla: '',
        nameEnglish: '',
        fatherNameBangla: '',
        motherNameBangla: '',
        spouseNameBangla: '',
        division: '',
        district: '',
        upazila: '',
        postOffice: '',
        postalCode: ''
      },
      { emitEvent: false }
    );

    this.districts.set([]);
    this.upazilas.set([]);
    this.postOffices.set([]);
    this.verificationResult.set(null);
    this.verificationSuccess.set(false);
    this.ecPhotoUrl.set(null);
    this.errorMessage.set(null);
    this.resultModalOpened.set(false);
    this.filePreviewCache.clear();
  }

  onDivisionSelected(selectedKey: unknown): void {
    this.resetAddressBelowDivision();
    const divisionId = this.toPositiveInteger(selectedKey);
    if (divisionId === null) {
      return;
    }

    this.isLoadingDistricts.set(true);
    this.ecVerificationService.getDistricts(divisionId).subscribe({
      next: (districts) => {
        this.isLoadingDistricts.set(false);
        if (this.ecForm.controls.division.value === String(divisionId)) {
          this.districts.set(districts);
        }
      },
      error: (error: unknown) => {
        this.isLoadingDistricts.set(false);
        this.districts.set([]);
        this.showLookupError(error, 'Unable to load districts.');
      }
    });
  }

  onDistrictSelected(selectedKey: unknown): void {
    this.resetAddressBelowDistrict();
    const districtId = this.toPositiveInteger(selectedKey);
    if (districtId === null) {
      return;
    }

    this.isLoadingUpazilas.set(true);
    this.ecVerificationService.getUpazilas(districtId).subscribe({
      next: (upazilas) => {
        this.isLoadingUpazilas.set(false);
        if (this.ecForm.controls.district.value === String(districtId)) {
          this.upazilas.set(upazilas);
        }
      },
      error: (error: unknown) => {
        this.isLoadingUpazilas.set(false);
        this.upazilas.set([]);
        this.showLookupError(error, 'Unable to load upazilas.');
      }
    });
  }

  onUpazilaSelected(selectedKey: unknown): void {
    this.resetPostOffice();
    const districtId = this.toPositiveInteger(this.ecForm.controls.district.value);
    const upazilaId = this.toPositiveInteger(selectedKey);
    if (districtId === null || upazilaId === null) {
      return;
    }

    this.isLoadingPostOffices.set(true);
    this.ecVerificationService.getPostOffices(districtId, upazilaId).subscribe({
      next: (postOffices) => {
        this.isLoadingPostOffices.set(false);
        if (
          this.ecForm.controls.district.value === String(districtId) &&
          this.ecForm.controls.upazila.value === String(upazilaId)
        ) {
          this.postOffices.set(postOffices);
        }
      },
      error: (error: unknown) => {
        this.isLoadingPostOffices.set(false);
        this.postOffices.set([]);
        this.showLookupError(error, 'Unable to load post offices.');
      }
    });
  }

  verifyEcInformation(): void {
    if (this.isLoading()) {
      return;
    }

    this.errorMessage.set(null);

    if (this.ecForm.invalid) {
      this.ecForm.markAllAsTouched();
      this.errorMessage.set('NID must be 10 or 17 digits and Birth Date is required.');
      return;
    }

    const formValue = this.ecForm.getRawValue() as EcVerificationForm;
    this.isLoading.set(true);

    this.ecVerificationService.verifyEcInformation(formValue).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.verificationResult.set(response.result);
        this.ecPhotoUrl.set(this.normalizePhoto(response.photo));
        this.filePreviewCache.clear();
        this.verificationSuccess.set(this.isSuccessfulVerification(response, formValue));
        this.resultModalOpened.set(true);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.verificationResult.set(null);
        this.verificationSuccess.set(false);
        this.ecPhotoUrl.set(null);
        this.filePreviewCache.clear();
        this.resultModalOpened.set(false);
        this.errorMessage.set(
          error instanceof Error && error.message
            ? error.message
            : 'EC verification failed.'
        );
      }
    });
  }

  closeResultModal(): void {
    this.resultModalOpened.set(false);
  }

  logout(): void {
    this.auth.logout();
    this.state.goToLogin();
  }

  fieldMatch(field: keyof EcFieldVerificationResult): boolean | null {
    return this.verificationResult()?.[field] ?? null;
  }

  matchLabel(field: keyof EcFieldVerificationResult): string {
    return this.fieldMatch(field) === true ? 'Matched' : 'Not matched';
  }

  getFilePreviewData(
    url: string | null | undefined,
    fileName: string,
    mimeType: string
  ): FilePreviewData | null {
    if (!url) {
      return null;
    }

    const key = `${url}|${fileName}|${mimeType}`;
    const cached = this.filePreviewCache.get(key);

    if (cached) {
      return cached;
    }

    const fileData: FilePreviewData = { url, fileName, mimeType };
    this.filePreviewCache.set(key, fileData);
    return fileData;
  }

  private bindAddressCascade(): void {
    this.ecForm.controls.division.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((divisionId) => this.onDivisionSelected(divisionId));

    this.ecForm.controls.district.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((districtId) => this.onDistrictSelected(districtId));

    this.ecForm.controls.upazila.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((upazilaId) => this.onUpazilaSelected(upazilaId));
  }

  private loadDivisions(): void {
    this.isLoadingDivisions.set(true);
    this.ecVerificationService.getDivisions().subscribe({
      next: (divisions) => {
        this.isLoadingDivisions.set(false);
        this.divisions.set(divisions);
      },
      error: (error: unknown) => {
        this.isLoadingDivisions.set(false);
        this.divisions.set([]);
        this.showLookupError(error, 'Unable to load divisions.');
      }
    });
  }

  private resetAddressBelowDivision(): void {
    this.ecForm.patchValue(
      { district: '', upazila: '', postOffice: '' },
      { emitEvent: false }
    );
    this.districts.set([]);
    this.upazilas.set([]);
    this.postOffices.set([]);
  }

  private resetAddressBelowDistrict(): void {
    this.ecForm.patchValue(
      { upazila: '', postOffice: '' },
      { emitEvent: false }
    );
    this.upazilas.set([]);
    this.postOffices.set([]);
  }

  private resetPostOffice(): void {
    this.ecForm.controls.postOffice.setValue('', { emitEvent: false });
    this.postOffices.set([]);
  }

  private toIdOptions(options: EcAddressOption[]): SelectOption[] {
    return options.map((option) => ({ key: option.id, value: option.name }));
  }

  private toPositiveInteger(value: unknown): number | null {
    const normalized = String(value ?? '').trim();
    if (!normalized) {
      return null;
    }

    const parsed = Number(normalized);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  private showLookupError(error: unknown, fallback: string): void {
    this.errorMessage.set(
      error instanceof Error && error.message.trim() ? error.message.trim() : fallback
    );
  }

  private isSuccessfulVerification(
    response: EcVerificationResponse,
    formValue: EcVerificationForm
  ): boolean {
    const result = response.result;
    if (!result || result.nationalId !== true || result.dateOfBirth !== true) {
      return false;
    }

    const optionalChecks: Array<[string, boolean | null]> = [
      [formValue.nameBangla, result.name],
      [formValue.nameEnglish, result.nameEn],
      [formValue.fatherNameBangla, result.father],
      [formValue.motherNameBangla, result.mother],
      [formValue.spouseNameBangla, result.spouse],
      [formValue.division, result.permanentAddressDivision],
      [formValue.district, result.permanentAddressDistrict],
      [formValue.upazila, result.permanentAddressUpozila],
      [formValue.postOffice, result.permanentAddressPostOffice],
      [formValue.postalCode, result.permanentAddressPostalCode]
    ];

    return optionalChecks.every(([value, matched]) => !value.trim() || matched === true);
  }

  private normalizePhoto(photo: string | null | undefined): string | null {
    const normalized = photo?.trim();
    if (!normalized || normalized.startsWith('~/')) {
      return null;
    }

    if (
      normalized.startsWith('data:') ||
      normalized.startsWith('http://') ||
      normalized.startsWith('https://') ||
      normalized.startsWith('blob:')
    ) {
      return normalized;
    }

    const compact = normalized.replace(/\s+/g, '');
    if (compact.length > 100 && /^[A-Za-z0-9+/]+={0,2}$/.test(compact)) {
      return `data:image/jpeg;base64,${compact}`;
    }

    return null;
  }
}
