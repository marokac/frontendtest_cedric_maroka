//import { GetNotificationDetailsProxyService } from './../../../../../common/services/proxy-services/get-notification-details-proxy.service';
import { InstitutionalBenefificiary } from 'app/common/services/proxy-services/institutional-beneficiaries-fetchinstitutional-enquiries-proxy.service';
import { Injectable, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject';
import { PayNewData, FormData, ErrorDetail, SelectedOption } from 'app/process/modules/cb-app/view-beneficiaries/view-payment/add-beneficiary/add-payment.model';
import {
  RegularBeneficiaryPaymentPaymentPayOnceOffBeneficiaryProxyService,
  RegularBeneficiaryPaymentPaymentPayBeneficiaryProxyService,
} from 'app/common/services/proxy-services/regular-beneficiary-payment.proxy.service';
import {
  EsfResponseHeader,
  RegularBeneficiaryManagementProxyService,
  RegularBeneficiaryManagementAddRegularBeneficiaryRequest,
  RegularBeneficiaryManagementAddRegularBeneficiaryResponse,
} from 'app/common/services/proxy-services/regular-beneficiary-management-add-regular-beneficary-proxy-service';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import {
  InstitutionalBeneficiariesEnquiryProxyService,
  InstitutionalBeneficiariesEnquiryFetchInstitutionalBeneficiariesRequest
} from 'app/common/services/proxy-services/institutional-beneficiaries-fetchinstitutional-enquiries-proxy.service';
import { ManageNotificationDetailsGetNotificationDetailsRequest, AlrtVO, GetNotificationDetailsProxyService, EnquireRegularBeneficiaryDetailsRequest, EnquireRegularBeneficiaryDetailsResponse } from 'app/common/services/proxy-services/get-notification-details-proxy.service';
import { SessionService } from 'app/common/services/session.service';
import { RegularBeneficiaryPaymentGetSourceAccountsProxyService, Account } from 'app/common/services/proxy-services/regular-beneficiary-payment-get-source-accounts-proxy.service';
import { ManageLimitsProxyService, ManageLimitsGetUserLimitsResponse } from 'app/common/services/proxy-services/manage-limits-proxy.service';
import {
  RegularBeneficiaryManagementGetBeneficiariesForBranchAndAccountResponse,
  RegularBeneficiaryManagementGetBeneficiariesForBranchAndAccountRequest,
  RegularBeneficiaryManagementListRegularBeneficiariesProxyService
} from "app/common/services/proxy-services/regular-beneficiary-management-proxy.service";
import { FormGroup } from '@angular/forms';
import { Enums } from 'app/common/enums/enums';

export interface BalanceEnquiryGetAllBalancesResponse {
  sourceAccountList: Array<Account>
  header: EsfResponseHeader;
}

export {
  RegularBeneficiaryManagementProxyService,
  RegularBeneficiaryManagementAddRegularBeneficiaryRequest,
  RegularBeneficiaryManagementAddRegularBeneficiaryResponse,
  EsfResponseHeader
}

export class BeneficiariesFromBranchAndAccountRequest implements RegularBeneficiaryManagementGetBeneficiariesForBranchAndAccountRequest {
  accountNumber: string;
  branchCode: string;
  constructor(accountNumber: string, branchCode: string) {
    this.accountNumber = accountNumber;
    this.branchCode = branchCode;
  }
}


class RegularBeneficiaryManagementRequest implements RegularBeneficiaryManagementAddRegularBeneficiaryRequest {
  bankNameOrInstitutionName: string;
  sourceAccountReference: string;
  targetAccountReference: string;
  clearingCodeOrInstitutionCode: string;
  targetAccountType: string; // [ "NONE", "CURRENT_ACCOUNT", "SAVINGS_ACCOUNT", "TRANSMISSION_ACCOUNT", "HOME_LOAN", "ONLINE_SHARE_TRADING" ]
  beneficiaryName: string;
  targetAccountNumber: string;
  beneficiaryNotification: object;
  typeOfBeneficiary: string;
  instructionType: string;
  ownNotification: object;

  constructor(
    bankNameOrInstitutionName: string,
    sourceAccountReference: string,
    targetAccountReference: string,
    clearingCodeOrInstitutionCode: string,
    targetAccountType: string,
    beneficiaryName: string,
    targetAccountNumber: string,
    beneficiaryNotification: object,
    typeOfBeneficiary: string,
    instructionType: string,
    ownNotification: object) {
    this.bankNameOrInstitutionName = bankNameOrInstitutionName;
    this.sourceAccountReference = sourceAccountReference;
    this.targetAccountReference = targetAccountReference;
    this.clearingCodeOrInstitutionCode = clearingCodeOrInstitutionCode;
    this.targetAccountType = targetAccountType;
    this.beneficiaryName = beneficiaryName;
    this.targetAccountNumber = targetAccountNumber;
    this.beneficiaryNotification = beneficiaryNotification;
    this.typeOfBeneficiary = typeOfBeneficiary;
    this.instructionType = instructionType;
    this.ownNotification = ownNotification
  }
}

class InstitutionRequest implements InstitutionalBeneficiariesEnquiryFetchInstitutionalBeneficiariesRequest {
  searchString: string;
  constructor(searchString: string) {
    this.searchString = searchString;
  }
}



@Injectable()
export class ViewPaymentService {
  isSwitch:boolean=false;
  useExistingAbsaListedBeneficiaryIndicator: boolean;
  addAbsaListedBeneficiaryIndicator: boolean;
  arrayList: any[] = [];
  addBeneficiaryIndicator: boolean = false;
  branchCode: any;
  warning: any;
  public fromAccountList: Account[] = [];
  private emitChangeSource = new ReplaySubject<any>(1);
  private BenExist: any;
  private payNewData: PayNewData = new PayNewData();
  closeDilogEmitter = new Subject<any>()
  clearAccountType: any
  private ownNotification = {};
  private beneficiaryNotification = {};
  private notificationObject = {};
  private typeOfBeneficiary = '';
  private beneficiaryReference = '';
  private accountNumber = '';
  private sourceAccountsSource = new ReplaySubject<{ isError: boolean, accounts?: Account[], error?: any }>(1);
  private limitsSource = new ReplaySubject<ManageLimitsGetUserLimitsResponse>(1);
  private institutionBeneficiariesSource = new ReplaySubject<InstitutionalBenefificiary[]>(1);
  public accountFromBranchSource = new ReplaySubject<RegularBeneficiaryManagementGetBeneficiariesForBranchAndAccountResponse>(1);
  private nofiticationDetailsSource = new ReplaySubject<AlrtVO>(1);
  private notificationError = new ReplaySubject<any>(1)
  public proceedToSureCheckSource = new ReplaySubject<any>(1)

  private alrtVO: AlrtVO;
  isFromAbsalisted: boolean;
  isFromNormal: boolean;
  private limits: ManageLimitsGetUserLimitsResponse;
  private accountFromBranch: RegularBeneficiaryManagementGetBeneficiariesForBranchAndAccountResponse;
  absaListedData: any;
  benExist: boolean;
  institutionNameSource = new ReplaySubject<any>(1)
  private useExistingBeneficiaryIndicator: boolean;
  sourceAccounts$ = this.sourceAccountsSource.asObservable();
  institutionBeneficiaries$ = this.institutionBeneficiariesSource.asObservable();
  nofiticationDetails$ = this.nofiticationDetailsSource.asObservable();
  userLimits$ = this.limitsSource.asObservable();
  accountFromBranch$ = this.accountFromBranchSource.asObservable();
  acountEmiter = this.institutionNameSource.asObservable()
  closeDilogEmitter$ = this.closeDilogEmitter.asObservable();
  changeEmitted$ = this.emitChangeSource.asObservable();
  noficationDetailsStatusEmitter$ = this.proceedToSureCheckSource.asObservable();
  backButton = false;
  checkDialog: boolean = false;


  ///////////////////
  beneficiaryExist: boolean = false;
  addexistingBen: any = {
    'accountNumber': '',
    'branchCode': '',
    'exist': false,
  }

  constructor(
    private regularBeneficiaryManagementProxyService: RegularBeneficiaryManagementProxyService,
    private regularBeneficiaryPaymentGetSourceAccountsProxyService: RegularBeneficiaryPaymentGetSourceAccountsProxyService,
    private institutionalBeneficiariesEnquiryProxyService: InstitutionalBeneficiariesEnquiryProxyService,
    private notificationProxyService: GetNotificationDetailsProxyService,
    private manageLimitsProxyService: ManageLimitsProxyService,
    private beneficiaryManagementService: RegularBeneficiaryManagementListRegularBeneficiariesProxyService,
    private sessionService: SessionService,
    private enums: Enums) {
    this.benExist = false;
    this.clearAccountType = false;
    this.isFromAbsalisted = false;
    this.isFromNormal = false;

  }

  setInstitutionOptions(institutionOptions: SelectedOption[]): any {
    this.payNewData.setInstitutionOptions(institutionOptions);
  }
  getInstitutionOptions() {
    return this.payNewData.getInstitutionOptions();
  }

  setBankOptions(selectedBank: SelectedOption[]) {
    this.payNewData.setBankOptions(selectedBank);
  }
  getBenVODetails() {
    return this.payNewData.getprepareBenForPayment();
  }
  setBenVODetails(VOList) {
    this.payNewData.setprepareBenForPayment(VOList)
  }
  getBankOptions() {
    return this.payNewData.getBankOptions();
  }

  setBranchOptions(selectedBranch: SelectedOption[]) {
    this.payNewData.setBranchOptions(selectedBranch);
  }

  getBranchOptions() {
    return this.payNewData.getBranchOptions();
  }

  public fetchSourceAccounts() {
    this.regularBeneficiaryPaymentGetSourceAccountsProxyService.getAllSourceAccounts().subscribe(
      response => {
        this.payNewData.setSourceAccountList(response.sourceAccountList);
        this.sourceAccountsSource.next({ isError: false, accounts: response.sourceAccountList });
      },
      error => {
        this.sourceAccountsSource.next({ isError: true, error: error });
        console.log('Error fetching source accounts') // TODO: Error handling;
      }
    );
  }

  setBenExist(benExist) {
    this.benExist = benExist;
  }
  getBenExist() {
    return this.benExist;
  }
  setSharedValue(form, value) {
    this.payNewData.setSharedValue(form, value);
  }

  getcloseDilogEmitter(msg, dt?) {
    var dilogData = { massage: msg, data: dt ? dt : '' }
    this.closeDilogEmitter.next(dilogData);
  }


  public fetchLimits() {
    this.manageLimitsProxyService.getUserLimits().subscribe(
      response => {
        this.payNewData.setLimits(response);
        this.limitsSource.next(response);
      }
    ),
      error => {
        console.log('Error fetching limits');
      }
  }
  getBranchcodeFromNext() {
    return this.backButton;
  }
  setBranchcodeFromNext(branch) {
    this.backButton = branch;
  }
  //for shared data
  getIsFromAbsalisted() {
    return this.isFromAbsalisted;
  }
  setIsFromAbsalisted(value) {
    this.isFromAbsalisted = value;
  }

  getIsFromNormal() {
    return this.isFromNormal;
  }
  setIsFromNormal(value) {
    this.isFromNormal = value;
  }


  public fetchInstitutionBeneficiaries(searchString: string) {
    const request = new InstitutionRequest(searchString)
    this.institutionalBeneficiariesEnquiryProxyService.fetchInstitutionalBeneficiaries(request).subscribe(
      response => {
        this.payNewData.setInstitutionList(response.institutionalBeneficiaries);
        this.institutionBeneficiariesSource.next(response.institutionalBeneficiaries)
      },
      error => {
        console.log('Error fetching institutions')
      }
    )
  }

  public fetchFromBranchAccount(request: RegularBeneficiaryManagementGetBeneficiariesForBranchAndAccountRequest):
    Observable<any> {
    return this.beneficiaryManagementService.getBeneficiariesForBranchAndAccount(request).
      map(
        response => {

          let searchResponse = {
            'typeOfBeneficiaryList': response.typeOfBeneficiaryList,
            'response': response
          };

          if (response.institutionalBeneficiaries) {
            if (response.institutionalBeneficiaries.length > 0) {

              this.accountFromBranchSource.next(response);
              this.setAccountFromBranch(response);
            }
          } else
            if (response.ownDefinedBeneficiaries) {
              if (response.ownDefinedBeneficiaries.length > 0 && (response.typeOfBeneficiaryList === 'V' ||
                response.typeOfBeneficiaryList === 'D'
              )) {

                this.setBenExists(response.ownDefinedBeneficiaries);
                this.setAccountFromBranch(response);
                console.log('::::::', response)
              }

            }

          return searchResponse;
        },
        error => console.log('Error fetching branchAndAccount', error)
      )
  }

  public fetchMatchingAbsaListedAccounts(request: any, accountOrReferenceNumber: any):
    Observable<any> {

    return this.beneficiaryManagementService.getBeneficiariesForBranchAndAccount(request).
      map(
        response => {

          let searchResponse = {
            'typeOfBeneficiaryList': response.typeOfBeneficiaryList,
            'response': response
          };

          this.arrayList = []

          console.log('::::First Response', response)
          //this.accountFromBranchSource.next(response);
          if (response.ownDefinedBeneficiaries.length > 0) {
            response.ownDefinedBeneficiaries.forEach(ownDefinedBeneficiary => {
              console.log('::::Second Response', response)
              if (ownDefinedBeneficiary.targetAccountNumber == accountOrReferenceNumber) {
                this.arrayList.push(ownDefinedBeneficiary)
              }
            })
            this.setAccountFromBranch(this.arrayList);
          } else {
            this.setAccountFromBranch(response.ownDefinedBeneficiaries);
          }

          console.log('::::::::Array List', this.arrayList)

          return searchResponse;
        },
        error => console.log('Error fetching branchAndAccount', error)
      )
  }

  public fetchNofiticationDetails(request: ManageNotificationDetailsGetNotificationDetailsRequest) {

    this.notificationProxyService.getNotificationDetails(request).subscribe(
      response => {
        this.payNewData.setAlrtVO(response.alrtVO);
        this.nofiticationDetailsSource.next(response.alrtVO);
        //When user details are ready - Do the SureCheck
        this.proceedToSureCheckSource.next({ isError: false });

      },
      error => {
        let res = {
          result: error,
          isError: true
        }
        this.notificationError.next(res);
        this.proceedToSureCheckSource.next(res);
      }
    )
  }
  public getMyNotificationDetails(): void {
    const request: ManageNotificationDetailsGetNotificationDetailsRequest = {
      'userNumber': this.sessionService.esfHeader.UserNumber,
      'accountNumber': this.sessionService.esfHeader.AccessAccount
    };
    this.fetchNofiticationDetails(request);
  };

  ngOnInit() {

  }

  setUseExistingBeneficiaryIndicator(useExistingBeneficiaryIndicator: boolean) {
    this.useExistingBeneficiaryIndicator = useExistingBeneficiaryIndicator;
  }

  getUseExistingBeneficiaryIndicator(): boolean {
    return this.useExistingBeneficiaryIndicator;
  }

  setAbsaListedData(data) {
    this.absaListedData = data;
  }

  getAbsaListedData() {
    return this.absaListedData;
  }

  getFormData(beneficiaryType: string): FormData {
    return this.payNewData.getFormData(beneficiaryType)
  }

  setFormData(formData: FormData, beneficiaryType: string) {
    this.payNewData.setFormData(formData, beneficiaryType)
  }

  clearFormData(beneficiaryType: string) {
    this.payNewData.clearFormData(beneficiaryType);
  }

  getError(): ErrorDetail {
    return this.payNewData.getErrorDetail()
  }

  getValidateError(): ErrorDetail {
    return this.payNewData.getValidateErrorDetail();
  }

  setWarning(warning) {
    this.warning = warning
  }

  getWarning() {
    return this.warning
  }

  setBranchCode(branchCode) {
    this.branchCode = branchCode
  }

  getBranchCode() {
    return this.branchCode;
  }

  setError(header: EsfResponseHeader) {
    const errorDetail: ErrorDetail = {
      errorList: header.resultMessages,
      isError: true,
      errorDescription: 'Application Error',
      statuscode: header.statuscode
    }
    this.payNewData.setErrorDetail(errorDetail)
  }

  setAddBenErrorFromSecurityNotification(header: any, description?: string) {
    const AddBenErrorDetail: ErrorDetail = {
      errorList: header.resultMessage,
      isError: true,
      errorDescription: description,
      statuscode: header.statuscode
    }
    this.payNewData.setErrorDetail(AddBenErrorDetail);
  }

  setValidateError(header: EsfResponseHeader) {
    const validateErrorDetail: ErrorDetail = {
      errorList: header.resultMessages,
      isError: true,
      errorDescription: 'Application Error',
      statuscode: header.statuscode
    }
    this.payNewData.setValidateErrorDetail(validateErrorDetail)
  }

  setAlrtVO(alrtVO: AlrtVO) {
    this.alrtVO = alrtVO;
  }

  getAlrtVO(): AlrtVO {
    return this.alrtVO;
  }

  setBranchName(branchName) {
    this.payNewData.setBranchName(branchName);
  }

  getBranchName() {
    return this.payNewData.getBranchName();
  }

  getAccountFromBranch(): any {
    return this.accountFromBranch;
  }

  setAccountFromBranch(accountFromBranch: any) {
    this.accountFromBranch = accountFromBranch;
  }

  setLimits(limits: ManageLimitsGetUserLimitsResponse) {
    this.limits = limits;
  }

  getLimits(): ManageLimitsGetUserLimitsResponse {
    return this.limits;
  }


  resetError() {
    const errorDetail: ErrorDetail = {
      errorList: [],
      isError: false,
      errorDescription: '',
      statuscode: ''
    }
    this.payNewData.setErrorDetail(errorDetail)
  }


  //If account number belong to absa listed beneficiary - emit the absa listed beneficiary name
  emitInstitutionName(institutionName) {
    this.institutionNameSource.next(institutionName)
  }

  //to be visited
  absalistedValues: any
  setabsalistedValues(data) {
    this.absalistedValues = data;
    this.getAbsalistedValues();
  }
  getAbsalistedValues() {
    return this.absalistedValues;
  }

  // Service messages
  emitChange(change: any) {
    this.emitChangeSource.next(change);
  }

  setAddBeneficiaryIndicator(addBeneficiaryIndicator: boolean) {
    this.addBeneficiaryIndicator = addBeneficiaryIndicator;
  }

  getAddBeneficiaryIndicator(): boolean {
    return this.addBeneficiaryIndicator;
  }

  setBenExists(ben) {
    console.log(ben, 'kenna ben')
    this.BenExist = ben;
  }
  getBenExists() {
    return this.BenExist;
  }

  getOwnNotificationObject(notificationType: string): any {
    switch (notificationType) {
      default: {
        this.notificationObject = {
          'notificationMethod': 'N'
        }
        break;
      }
      case 'S': {
        this.notificationObject = {
          'notificationMethod': 'S',

        }
        break;
      }
      case 'E': {
        this.notificationObject = {
          'notificationMethod': 'E',

        }
        break
      }
      case 'F': {
        this.notificationObject = {
          'notificationMethod': 'F',

        }
        break
      }
    }
    return this.notificationObject;
  }

  getBeneficiaryNotificationObject(notificationType: string, formData: FormData): any {

    switch (notificationType) {
      default: {
        this.notificationObject = {
          'notificationMethod': 'N'
        }
        break;
      }
      case 'S': {
        this.notificationObject = {
          'notificationMethod': 'S',
          'cellphoneNumber': formData.notifyBeneficiarySMS

        }
        break;
      }
      case 'E': {
        this.notificationObject = {
          'notificationMethod': 'E',
          'emailAddress': formData.notifyBeneficiaryEmail,
          'recipientName': formData.notifyBeneficiaryEmailRecipientName,
        }
        break
      }
      case 'F': {
        this.notificationObject = {
          'notificationMethod': 'F',
          'faxCode': formData.notifyBeneficiaryFaxCode,
          'faxNumber': +'' + formData.notifyBeneficiaryFaxNumber,
          'recipientName': formData.notifyBeneficiaryFaxRecipientName,
        }
        break
      }
    }
    return this.notificationObject;
  }


  addRegularBeneficiary(beneficiaryType: string): Observable<RegularBeneficiaryManagementAddRegularBeneficiaryResponse> {
    const formData = this.payNewData.getFormData(beneficiaryType);
    const sourceAccount = this.findSourceAccount(formData.fromAccount);

    if (formData.beneficiaryType === 'AbsaListed') {
      this.beneficiaryNotification = { 'notificationMethod': 'N' };
    } else {
      this.beneficiaryNotification = this.getBeneficiaryNotificationObject(formData.notifyBeneficiaryRadio, formData);
    }

    this.ownNotification = this.getOwnNotificationObject(formData.notifyMeRadio);
    this.beneficiaryReference = formData.beneficiaryReference;
    this.accountNumber = formData.accountNumber;

    if (formData.beneficiaryType === 'AbsaListed') {
      this.typeOfBeneficiary = 'B';
      this.beneficiaryReference = formData.accountHoldersName;
      this.accountNumber = formData.accountHoldersRefNumber;
    } else if (formData.bank === 'Absa') {
      this.typeOfBeneficiary = 'I';
      formData.accountType = "NONE"
    } else {
      this.typeOfBeneficiary = 'E';
    }

    const request = new RegularBeneficiaryManagementRequest(
      formData.bank, // bankNameOrInstitutionName
      formData.myReference, // sourceAccountReference: string,
      this.beneficiaryReference, // targetAccountReference: string,
      formData.branchCode, // clearingCodeOrInstitutionCode
      formData.accountType, // targetAccountType: string,[ "NONE", "CURRENT_ACCOUNT", "SAVINGS_ACCOUNT", "TRANSMISSION_ACCOUNT", "HOME_LOAN", "ONLINE_SHARE_TRADING" ]
      formData.fullName, // beneficiaryName : string,
      this.accountNumber, // targetAccountNumber : string,
      this.beneficiaryNotification, // beneficiaryNotification: object,
      this.typeOfBeneficiary, // typeOfBeneficiary: string,
      'VP', // instructionType: string,
      this.ownNotification // ownNotificationVO : object
    );
    return this.doAddRegularBeneficiary(request);
  }


  doAddRegularBeneficiary(request: RegularBeneficiaryManagementAddRegularBeneficiaryRequest):
    Observable<RegularBeneficiaryManagementAddRegularBeneficiaryResponse> {
    console.log("_______UUUUUUUU_____", request);
    return this.regularBeneficiaryManagementProxyService.addRegularBeneficiary(request);
  }


  findSourceAccount(accountNumber: string): Account {
    return this.payNewData.findSourceAccount(accountNumber);
  }

  findAccountType(accountType: string): SelectedOption {
    return this.enums.getTranslatedAccountTypes().find(accountTypeOption => accountTypeOption.value === accountType);
  }
  setPreferedNoPMethod(method, beneficiaryType) {
    this.payNewData.setPreferedNoPMethod(method, beneficiaryType);
  }

  checkbenbeforsubmit: boolean;
  getcheckbwn() {
    return this.checkbenbeforsubmit;
  }
  setCheckBen(a) {
    this.checkbenbeforsubmit = a;
  }

  clearAccountTypeOptions() {
    // this.accountTypeOptions = []
  }

  getBeneficiaryNotificationDetails(beneficiaryEnquiry: EnquireRegularBeneficiaryDetailsRequest): Observable<EnquireRegularBeneficiaryDetailsResponse> {
    return this.notificationProxyService.getBeneficiaryNotificationDetails(beneficiaryEnquiry).
      map(
        response => response,
        error => console.log('Error fetching beneficiary notificatoin details', error)
      )
  }

  SetaddexistingBen(existben) {
    this.addexistingBen = existben;

  }
  getaddexistingBen() {
    console.log(this.addexistingBen)
    return this.addexistingBen;
  }

  setClearAccountType(value) {
    this.clearAccountType = value;
  }
  getClearAccountType() {
    return this.clearAccountType;
  }

getisSwitch(){
  return this.isSwitch;
}

setIsSwitch(value:boolean){
this.isSwitch=value;
}
}

