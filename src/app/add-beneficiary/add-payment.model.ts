import { ResultMessage } from 'app/core/services/esf-response-header.interface'
import {  Account } from 'app/common/services/proxy-services/regular-beneficiary-payment-get-source-accounts-proxy.service';
import { InstitutionalBenefificiary } from 'app/common/services/proxy-services/institutional-beneficiaries-fetchinstitutional-enquiries-proxy.service';
import { AlrtVO} from 'app/common/services/proxy-services/get-notification-details-proxy.service';
import { ManageLimitsGetUserLimitsResponse } from 'app/common/services/proxy-services/manage-limits-proxy.service';
import { BeneficiaryDetailsVO } from '../../../../../../common/services/proxy-services/regular-beneficiary-management-proxy.service';

export interface FormData {
  institutionName: string
  fullName: string
  accountNumber: string
  accountType: string
  bank: string
  beneficiaryReference: string
  branchCode: string
  branchCodeLabel: string  
  branchName: string
  checkboxIIP: string
  fromAccount: string
  date: string
  amount: string
  myReference: string
  notifyMeRadio: string
  notifyMeSMS: string
  notifyMeEmail: string
  notifyMeFaxNumber: string
  notifyMeFaxCode:string
  notifyBeneficiaryRadio: string
  notifyBeneficiarySMS: string
  notifyBeneficiaryEmail: string
  notifyBeneficiaryFax: string,

  notifyBeneficiaryEmailRecipientName: string
  notifyBeneficiaryEmailPaymentMadeBy: string
  notifyBeneficiaryEmailContactMeOn: string
  notifyBeneficiaryEmailComments: string


  notifyBeneficiaryFaxCode: string
  notifyBeneficiaryFaxNumber: string
  notifyBeneficiaryFaxRecipientName: string
  notifyBeneficiaryFaxPaymentMadeBy: string
  notifyBeneficiaryFaxContactMeOn: string
  notifyBeneficiaryFaxComments: string

  recipientName: string
  paymentTime: string
  saveBeneficiaryRadio: string
  accountHoldersRefNumber: string
  accountHoldersName: string
  beneficiaryType: string
}

//
export interface AddBeneficiaryModelResponse {
  header: object;
  bankNameOrInstitutionName: string;
  beneficiaryName: string;
  beneficiaryNotification: object;
  beneficiaryNumber: string;
  cifKey: string
  clearingCodeOrInstitutionCode: string;
  instructionType: string;
  lastMaintenanceDateAndTime: string;
  ownNotification: object;
  sourceAccountReference: string;
  targetAccountNumber: string;
  targetAccountReference: string;
  targetAccountType: string;
  tieBreaker: string;
  typeOfBeneficiary: string;
  uniqueEFTNumber: string;
}

export interface SelectedOption {
  value: string;
  label: string;
}

export interface ErrorDetail {
  isError: any
  errorDescription: string
  errorList: ResultMessage[]
  statuscode:any
}



export class PayNewData {

  private formData
  = {
    'normalBeneficiary': {
      fullName: '',
      accountNumber: '',
      accountType: '',
      bank: '',
      beneficiaryReference: '',
      branchCode: '',
      branchCodeLabel:'',
      branchName: '',
      myReference: '',
      notifyMeRadio: '',
      notifyMeSMS: '',
      notifyMeEmail: '',
      notifyMeFaxNumber: '',
      notifyMeFaxCode:'',
      notifyBeneficiaryFaxRecipientName: '',
      notifyBeneficiaryFaxCode: '',
      notifyBeneficiaryFaxNumber: '',
      notifyBeneficiaryFaxPaymentMadeBy: '',
      notifyBeneficiaryFaxContactMeOn: '',
      notifyBeneficiaryFaxComments: '',
      notifyBeneficiaryEmailRecipientName: '',
      notifyBeneficiaryEmailPaymentMadeBy: '',
      notifyBeneficiaryEmailContactMeOn: '',
      notifyBeneficiaryEmailComments: '',
      notifyBeneficiarySMS: '',
      notifyBeneficiaryEmail: '',
      saveBeneficiaryRadio: '',
      beneficiaryType: ''
    },
    'absaListedBeneficiary': {
      institutionName: '',
      accountNumber: '',
      branchCode: '',
      myReference: '',
      notifyMeRadio: '',
      notifyMeSMS: '',
      notifyMeEmail: '',
      notifyMeFaxCode:'',
      notifyMeFax: '',
      paymentTime: '',
      saveBeneficiaryRadio: '',
      accountHoldersRefNumber: '',
      accountHoldersName: '',
      beneficiaryType: ''
    },
  }
setSharedValue(data,formType){
  this.formData[formType].myReference=data.myReference;
  this.formData[formType].notifyMeRadio=data.notifyMeRadio;
  this.formData[formType].notifyMeSMS=data.notifyMeSMS;
  this.formData[formType].notifyMeEmail=data.notifyMeEmail;
  this.formData[formType].notifyMeFaxCode=data.notifyMeFaxCode;
  this.formData[formType].notifyMeFax=data.notifyMeFax;
}
  private errorDetail: ErrorDetail
  private validateErrorDetail: ErrorDetail
  private addBeneficiaryModelResponse: AddBeneficiaryModelResponse
  public fromAccountList: Account[] = []
  public institutionList: InstitutionalBenefificiary[] = [];
  private alrtVO: AlrtVO;
  private limits: ManageLimitsGetUserLimitsResponse;

  private bankOptions: SelectedOption[] = [];
  private branchOptions: SelectedOption[] = [];
  private institutionOptions: SelectedOption[] = [];
  branchName: string
  private benVoDetails:BeneficiaryDetailsVO
  


  setInstitutionOptions(institutionOptions: SelectedOption[]) {
    this.institutionOptions = institutionOptions;
  }
  getInstitutionOptions() {
    return this.institutionOptions;
  }

  setBankOptions(bankOptions: SelectedOption[]) {
    this.bankOptions = bankOptions;
  }
  getBankOptions() {
    return this.bankOptions;
  }

  setBranchOptions(branchOptions: SelectedOption[]) {
    this.branchOptions = branchOptions;
  }
  getBranchOptions() {
    return this.branchOptions;
  }

  setBranchName(branchName) {
    this.branchName = branchName
  }

  getBranchName(){
    return this.branchName
  }

  setAddBeneficiaryModelResponse(addBeneficiaryModelResponse: AddBeneficiaryModelResponse) {
    this.addBeneficiaryModelResponse = addBeneficiaryModelResponse;
  }

  getAddBeneficiaryModelResponse(): AddBeneficiaryModelResponse {
    return this.addBeneficiaryModelResponse;
  }


  setFormData(formData: FormData, beneficiaryType: string) {
    this.formData[beneficiaryType] = formData
  }

  getFormData(beneficiaryType: string): FormData {
    return this.formData[beneficiaryType]
  }

  setErrorDetail(errorDetail: ErrorDetail) {
    this.errorDetail = errorDetail
  }

  setValidateErrorDetail(validateErrorDetail: ErrorDetail) {
    this.validateErrorDetail = validateErrorDetail
  }

  getErrorDetail(): ErrorDetail {
    if (this.errorDetail) {
      return this.errorDetail
    } else {
      return { isError: false, errorDescription: '', errorList: [], statuscode:'' }
    }
  }

  getSourceAccountList(): Account[] {
    return this.fromAccountList;
  }

  setSourceAccountList(list: Account[]) {
    this.fromAccountList = list;
  }

  setInstitutionList(list: InstitutionalBenefificiary[]) {
    this.institutionList = list;
  }

  getInstitutionList(): InstitutionalBenefificiary[] {
    return this.institutionList;
  }

  setAlrtVO(alrtVO: AlrtVO) {
    this.alrtVO = alrtVO;
  }

  getAlrtVO(): AlrtVO {
    return this.alrtVO;
  }

  setLimits(limits: ManageLimitsGetUserLimitsResponse) {
    this.limits = limits;
  }

  getLimits(): ManageLimitsGetUserLimitsResponse {
    return this.limits;
  }


  getValidateErrorDetail(): ErrorDetail {
    if (this.validateErrorDetail) {
      return this.validateErrorDetail
    } else {
      return { isError: false, errorDescription: '', errorList: [], statuscode:''}
    }
  }

  findSourceAccount(accountNumber: string): Account {
    return this.fromAccountList.find(account => account.accountNumber === accountNumber);
  }

  clearFormData(beneficiaryType: string) {

    this.formData[beneficiaryType] = {
      institutionName: '',
      fullName: '',
      accountNumber: '',
      accountType: '',
      bank: '',
      beneficiaryReference: '',
      branchCode: '',
      branchCodeLabel:'',
      checkboxIIP: '',
      fromAccount: '',
      date: '',
      amount: '',
      myReference: '',
      notifyMeRadio: '',
      notifyMeSMS: '',
      notifyMeEmail: '',
      notifyMeFax: '',
      notifyMeFaxCode:'',
      notifyBeneficiaryRadio: '',
      notifyBeneficiarySMS: '',
      notifyBeneficiaryEmail: '',
      notifyBeneficiaryFax: '',
      paymentTime: '',
      saveBeneficiaryRadio: '',
      accountHoldersRefNumber: '',
      accountHoldersName: '',
      beneficiaryType: ''
    }
  }
  setPreferedNoPMethod(method,beneficiaryType){
   this.formData[beneficiaryType].notifyMeRadio=method;
  }
  
  setprepareBenForPayment(benDetails:BeneficiaryDetailsVO){
    this.benVoDetails=benDetails;
  }
  
  getprepareBenForPayment(){
   return this.benVoDetails;
 }
}



