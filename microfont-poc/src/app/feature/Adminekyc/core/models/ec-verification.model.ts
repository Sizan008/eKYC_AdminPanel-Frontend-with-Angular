export interface EcAddressOption {
  id: string;
  name: string;
}

export interface EcVerificationForm {
  nid: string;
  birthDate: string;
  nameBangla: string;
  nameEnglish: string;
  fatherNameBangla: string;
  motherNameBangla: string;
  spouseNameBangla: string;
  division: string;
  district: string;
  upazila: string;
  postOffice: string;
  postalCode: string;
}

export interface EcVerificationAddressRequest {
  Division: string | null;
  District: string | null;
  Upozila: string | null;
  PostOffice: string | null;
  PostalCode: string | null;
}

/** Exact Spring ECVerify request contract / JsonProperty casing. */
export interface EcVerificationRequest {
  NidOrVoterNoOrFormNoOrVoterId: string;
  Name: string | null;
  NameEn: string | null;
  DateOfBirth: string;
  Father: string | null;
  Mother: string | null;
  Spouse: string | null;
  PermanentAddress: EcVerificationAddressRequest;
}

/** Exact field names returned by Spring FieldVerificationResponse. */
export interface EcFieldVerificationResult {
  nationalId: boolean | null;
  dateOfBirth: boolean | null;
  name: boolean | null;
  nameEn: boolean | null;
  father: boolean | null;
  mother: boolean | null;
  spouse: boolean | null;
  presentAddressMouzaOrMoholla: boolean | null;
  presentAddressWardForUnionPorishod: boolean | null;
  presentAddressUpozila: boolean | null;
  presentAddressDivision: boolean | null;
  presentAddressDistrict: boolean | null;
  presentAddressRmo: boolean | null;
  presentAddressPostalCode: boolean | null;
  presentAddressRegion: boolean | null;
  presentAddressPostOffice: boolean | null;
  permanentAddressDivision: boolean | null;
  permanentAddressDistrict: boolean | null;
  permanentAddressUpozila: boolean | null;
  permanentAddressRmo: boolean | null;
  permanentAddressPostalCode: boolean | null;
  permanentAddressRegion: boolean | null;
  permanentAddressPostOffice: boolean | null;
  permanentAddressMouzaOrMoholla: boolean | null;
  permanentAddressWardForUnionPorishod: boolean | null;
}

/** ECVerify is a raw response endpoint, not ApiResponse<T>. */
export interface EcVerificationResponse {
  result: EcFieldVerificationResult | null;
  photo: string | null;
}
