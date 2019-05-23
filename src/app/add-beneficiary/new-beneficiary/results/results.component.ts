import { Component, OnInit, Input, AfterViewInit, AfterContentInit } from '@angular/core';
import { FormData, ErrorDetail, SelectedOption } from 'app/process/modules/cb-app/view-beneficiaries/view-payment/add-beneficiary/add-payment.model';
import { ViewPaymentService, RegularBeneficiaryManagementAddRegularBeneficiaryResponse } from "app/process/modules/cb-app/view-beneficiaries/view-payment/add-beneficiary/add-payment.service";
import { Translator } from "angular-translator";
import { SessionService } from "app/common/services/session.service";
import { Utils } from "app/core/utils/utils";
import { TimeUtilsService } from "app/common/services/utils/time-utils.service";
import { DataLossWarningService } from 'app/common/services/data-loss-warning.service';
import { ListBranchCodesForBankRequest, ListBankNamesRequest, ExternalBankDetailsProxyService } from '../../../../../../../../common/services/proxy-services/external-bank-details-proxy.service';
import { Subscription } from 'rxjs';
import { DateUtilsService } from 'app/process/modules/cb-app/view-beneficiaries/common-view-beneficiaries/date-utils.service';
import { HistoryBeneficiaryData } from 'app/process/modules/cb-app/view-beneficiaries/common-view-beneficiaries/history/beneficiary-history.model';
import { NotifyBannerServiceService } from 'app/process/modules/cb-app/view-beneficiaries/common-view-beneficiaries/history/history-transaction/resend-notice-stepmanager/resend-notice-stepmanager.service';
import { AclConstants } from 'app/common/constants/acl-constants';
import { AccessControlService } from 'app/common/services/security/access-control-service';
import { DialogModalModel } from 'app/common/ui-components/dialog-modal/dialog-modal.model';
import { DialogModalService } from 'app/common/ui-components/dialog-modal/dialog-modal.service';

class BranchCodesRequest implements ListBranchCodesForBankRequest {
  bankName: string;
  searchString: string;
  constructor(
    bankName: string,
    searchString: string
  ) {
    this.bankName = bankName;
    this.searchString = searchString;
  }
}

class BankNamesRequest implements ListBankNamesRequest {
  searchString: string;
  constructor(searchString: string) {
    this.searchString = searchString;
  }
}


@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss'],
  providers: [DateUtilsService]
})

export class ResultsComponent implements OnInit, AfterViewInit, AfterContentInit {

  benNone: boolean = true;
  isOwnNone: boolean = true;
  branchCodeLabel: string;
  public aclData;
  private dialogMessage: DialogModalModel;
  @Input() beneficiaryNumber: number;
  @Input() switchData: any;

  date: any;
  //todaysTime: any;
  notifyMe: any = {};
  panelData: any = {};
  notifyBeneficiary: any = {};
  translations: object = {};
  printButtonS: any = []
  errorMessageList: { status_reason: string, status_reasons: string, status_messages: string }[];
  utils: Utils;
  public formData: FormData;
  accountType: SelectedOption;
  data: HistoryBeneficiaryData;
  public errorDetail: ErrorDetail;
  public validateErrorDetail: ErrorDetail;
  private addBeneficiaryModelResponse: RegularBeneficiaryManagementAddRegularBeneficiaryResponse

  allSubcriptions: Subscription[] = [];
  adobeAnalyticsData: { pageName: string; processComplete: string; processStart: string; };
  tittleSuccessfully : string;
  tittleUnsuccessfully: string;
  transactionPending:string;
  transactionPendingMsg:string;

  constructor(private payNewService: ViewPaymentService,
    private notifyBannerServiceService: NotifyBannerServiceService, private translator: Translator,
    private sessionService: SessionService,
    private timeUtilsService: TimeUtilsService,
    private dataLossWarningService: DataLossWarningService,
    private accessControlService:AccessControlService,
    private dialogModalService: DialogModalService,
    private externalBankDetailsProxyService: ExternalBankDetailsProxyService, private dateUtilsService: DateUtilsService
  ) {

    this.dialogMessage = new DialogModalModel();

    this.data = notifyBannerServiceService.getData();
    this.formData = this.payNewService.getFormData('normalBeneficiary');
    this.dataLossWarningService.setDirtyFlag(false);

    if (this.formData.branchCodeLabel.indexOf('-') > -1) {
      this.branchCodeLabel = this.formData.branchCodeLabel.replace(' - ', ' | ');
    }
    else {
      this.fetchBankNames(this.formData.bank)
    }


    this.translator.observe([
      'paymentBeneficiaries.addBeneficiaries.sendViaLabel',

      // Send via values
      'common.label.notifyEmail',
      'common.label.notifySms',
      'common.label.notifyFax',
      'common.label.notifyNone',

      //Method type titles
      'paymentBeneficiaries.label.notifyBeneficiaryEmail',
      'paymentBeneficiaries.label.notifyCellphoneNumber',
      'paymentBeneficiaries.label.notifyFaxNumber',

      'paymentBeneficiaries.addBeneficiaries.statusResoanBeneficiaryUnsuccessful',
      'prepaidMobile.label.addBeneficiarySuccess',
      'common.label.print',
      'pay.label.beneficiaryAddedSuccessfully',
      'prepaidMobile.label.addBeneficiaryFailed',
      'common.label.statusUnknown',
      'paymentBeneficiaries.label.addBeneficiaryPendingWarningMsg',
      'paymentBeneficiaries.SwitchBeneficiaries.title.SwitchSuccessfully',
      'paymentBeneficiaries.SwitchBeneficiaries.title.SwitchFailed',
      'common.label.ok'

    ])
      .subscribe((translations) => {
        this.translations['sendViaLabel'] = translations[0];

        // Send via values
        this.translations['email'] = translations[1];
        this.translations['sms'] = translations[2];
        this.translations['fax'] = translations[3];
        this.translations['none'] = translations[4];

        //Method type titles
        this.translations['emailAddress'] = translations[5];
        this.translations['cellNumber'] = translations[6];
        this.translations['faxNumber'] = translations[7];
        this.translations['successfullyAddedText'] =translations[11];
        this.translations['unsuccessfullyAddedText'] = translations[12];
        this.translations['transactionPending'] = translations[13];
        this.translations['transactionPendingMasg'] = translations[14];
        this.translations['okay'] = translations[15];
       // this.getTranslatedDate();

        this.printButtonS = [{ title: translations[10], icon: 'print', id: 'print' }]
        this.transactionPending=this.translations['transactionPending'];
        this.transactionPendingMsg=this.translations['transactionPendingMasg'];
        if(this.switchData){
          this.tittleSuccessfully =translations[15];
          this.tittleUnsuccessfully = translations[16];
        }else{
          this.tittleSuccessfully = this.translations['successfullyAddedText'];
          this.tittleUnsuccessfully = this.translations['unsuccessfullyAddedText'];

        }

        if (!this.errorDetail.isError) {
          this.panelData = { 'title':this.tittleSuccessfully, 'subtitle': this.date, 'icon': 'result-success', id: 'print', 'status': 'success', 'buttons': this.printButtonS }
        }
        /////////////////////////////////////////////////////////////////////////////////
        else {
          this.errorMessageList = [];
          if(this.errorDetail.statuscode=='502'||this.errorDetail.statuscode=='301'){
            this.errorMessageList.push({ 'status_reason': this.transactionPendingMsg, 'status_reasons': this.transactionPendingMsg, 'status_messages':this.transactionPendingMsg});
            this.panelData = { 'title':this.transactionPending, 'subtitle': this.date, 'status_reasons': this.errorMessageList, 'icon': 'result-pending', id: 'print', 'status': 'pending', 'buttons': this.printButtonS }

          }
          else{
            this.errorDetail.errorList.forEach(messageObj => {
              this.errorMessageList.push({ 'status_reason': messageObj.responseMessage, 'status_reasons': messageObj.responseMessage, 'status_messages': messageObj.responseMessage });
            });
            this.panelData = { 'title': this.tittleUnsuccessfully, 'subtitle': this.date, 'status_reasons': this.errorMessageList, 'icon': 'result-fail', id: 'print', 'status': 'error', 'buttons': this.printButtonS }
          }

        }



        this.prepaireNotificationDetails();
      })


  }

  ngOnInit() {
    // this.sessionService.setContextualHelpId(Constants.CONTEXTUAL_HELP_ID_ADDBENEFICIARY);
    //this.date = moment(new Date()).format('DD MMMM YYYY, HH:mm:ss');
    this.date =this.timeUtilsService.getDateTimeFormatted();

    this.errorDetail = this.payNewService.getError();
    this.validateErrorDetail = this.payNewService.getValidateError();
    this.accountType = this.payNewService.findAccountType(this.formData.accountType);
    //this.todaysTime = this.timeUtilsService.getCurrentTimeStampUpToMinutes();
    //Build error messages for status panel component
      if (!this.errorDetail.isError) {
        this.adobeAnalyticsData = { pageName: 'CB:PaymentBeneficiaries:Normal Beneficiary Complete Step', processComplete: 'true', processStart: 'false' };
      }
      else {

        this.adobeAnalyticsData = { pageName: 'CB:PaymentBeneciaries:Normal Beneficiary Complete Error Step', processComplete: 'true', processStart: 'false' };
      }



   console.log(this.errorDetail,'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')


  }

  private fetchBankNames(searchString): void {
    const request = new BankNamesRequest(searchString);


    this.allSubcriptions.push(this.externalBankDetailsProxyService.getBanks(request).subscribe(
      response => {

        if (response.bankNames.length > 0) {

          this.fetchBranchCodes(response.bankNames[0].bankNames)
        }
        else {
          console.log('Bank names not found');

          this.branchCodeLabel = this.formData.bank + ' | ' + this.formData.branchCode

        }
      },
      error => console.log('Error fetching banks', error)
    ))

  }

  private fetchBranchCodes(bankName) {
    var searchString = ""

    const request = new BranchCodesRequest(bankName, searchString);

    this.allSubcriptions.push(this.externalBankDetailsProxyService.getBranchCodes(request).subscribe(

      response => {

        //this.branchName = response.branchCodes[0].branchName

        if (response.branchCodes[0].branchName.indexOf('-') > -1) {
          //this.branchName = response.branchCodes[0].branchName.replace(' - ',' | ');

          this.branchCodeLabel = response.branchCodes[0].branchName.replace(' - ', ' | ');
        }
        else {
          this.branchCodeLabel = response.branchCodes[0].branchName
        }

        //console.log('::::: Details', response);
      },
      error => console.log('Error fetching branch codes')
    ))
  }

  onStatusHeaderButton(event) {
    if (event === 'print') {
      const aclKey = AclConstants.PRINT_ADD_NORMAL_PMNT_BNFR;
      if(this.accessControlService.isAllowed(aclKey)){
        this.printReceipt_(this.errorDetail);
      }
      else{
        // this.translations['aclPrintnotAllowedTitle']=translations[15];
        //this.translations['aclPrintnotAllowedSubTitle']=translations[16];
        this.aclData = this.accessControlService.getUIState(aclKey);
        this.dialogMessage.title = this.aclData.titleText;
        this.dialogMessage.contentText = this.aclData.reasonText;
        this.dialogMessage.okButtonText =this.translations['okay'];
        this.dialogMessage.icon = false;
        this.dialogModalService.NotificationDialogModal(this.dialogMessage).subscribe();
      }
    }
  }

  printReceipt_(errorDetail): void {
    console.log(errorDetail, 'error from print')
    //this.beneficiaryNumber
    let todaysTime = this.timeUtilsService.getCurrentTimeStampUpToMinutes();
    const urlString = this.sessionService.globalConfig.GLOBAL_EXPRESS_SERVICE_BASE_URL
      + this.sessionService.globalConfig.GLOBAL_EXPRESS_SERVICE_ROOT_CONTEXT
      + '/RegularBeneficiaryManagementFacadeGetCreateBeneficiaryReceipt.exp';
    const beneficiaryNumber = this.beneficiaryNumber === undefined ?
      '0' : this.beneficiaryNumber;
    const recepientName = this.formData.notifyBeneficiaryEmailRecipientName == '' ? this.formData.notifyBeneficiaryFaxRecipientName == '' ? '' : this.formData.notifyBeneficiaryFaxRecipientName : this.formData.notifyBeneficiaryEmailRecipientName
    let printContents, popupWin;
    printContents = '<form name="addBeneficiaryPrintForm" id="addBeneficiaryPrintForm" action=';
    printContents = printContents + urlString;
    printContents = printContents + ' method="post">';
    printContents = printContents + '<input type="hidden" name="beneficiaryName" id="beneficiaryName" value="' + this.formData.fullName + '" />';
    printContents = printContents + '<input type="hidden" name="beneficiaryNumber" id="beneficiaryNumber" value="' + beneficiaryNumber.toString() + '" />';
    printContents = printContents + '<input type="hidden" name="beneficiaryAccountNumber" id="beneficiaryAccountNumber" value="' + this.formData.accountNumber + '" />';
    printContents = printContents + '<input type="hidden" name="beneficiaryAccountType" id="beneficiaryAccountType" value="' + this.formData.accountType + '" />';
    printContents = printContents + '<input type="hidden" name="beneficiaryBankName" id="beneficiaryBankName" value="' + this.formData.bank + '" />';
    printContents = printContents + '<input type="hidden" name="beneficiaryBranchCode" id="beneficiaryBranchCode" value="' + this.formData.branchCode + '" />';
    printContents = printContents + '<input type="hidden" name="beneficiaryStatementDesc" id="beneficiaryStatementDesc" value="' + this.formData.beneficiaryReference + '" />';
    printContents = printContents + '<input type="hidden" name="myStatementDesc" id="myStatementDesc" value="' + this.formData.myReference + '" />';
    printContents = printContents + '<input type="hidden" name="beneficiaryPreferredNotice" id="beneficiaryPreferredNotice" value="' + this.formData.notifyBeneficiaryRadio + '" />';
    printContents = printContents + '<input type="hidden" name="beneficiaryCell" id="beneficiaryCell" value="' + this.formData.notifyBeneficiarySMS + '" />';
    printContents = printContents + '<input type="hidden" name="beneficiaryEmail" id="beneficiaryEmail" value="' + this.formData.notifyBeneficiaryEmail + '" />';
    printContents = printContents + '<input type="hidden" name="beneficiaryFax" id="beneficiaryFax" value="' + this.formData.notifyBeneficiaryFaxCode + this.formData.notifyBeneficiaryFaxNumber + '" />';
    printContents = printContents + '<input type="hidden" name="recipientName" id="recipientName" value="' + recepientName + '" />';
    printContents = printContents + '<input type="hidden" name="txDateTimestamp" id="txDateTimestamp" value="' + todaysTime + '" />';
    if (!errorDetail.isError) {
                   printContents = printContents + '<input type="hidden" name="txSuccessful" id="txSuccessful" value="true" />';
                   printContents = printContents + '<input type="hidden" name="transactionStatusMessage" id="transactionStatusMessage" value="Beneficiary added successfully" />';
       }

    else {
            if(this.errorDetail.statuscode=='502' || this.errorDetail.statuscode=='301'){
                  printContents = printContents + '<input type="hidden" name="txSuccessful" id="txSuccessful" value="pending" />';
                  printContents = printContents + '<input type="hidden" name="transactionStatusMessage" id="transactionStatusMessage" value="' +this.transactionPending+'" />';
                  printContents = printContents + '<input type="hidden" name="reasons" id="reasons" value="' + this. transactionPendingMsg + '" />';
                  printContents = printContents + '<input type="submit" name="printDocument" id="printDocument" value="" />';

              }

           else{
                  printContents = printContents + '<input type="hidden" name="txSuccessful" id="txSuccessful" value="false" />';
                  printContents = printContents + '<input type="hidden" name="transactionStatusMessage" id="transactionStatusMessage" value="Beneficiary added Unsuccessfully" />';
                  printContents = printContents + '<input type="hidden" name="reasons" id="reasons" value="' + this.generateErrorMessage(errorDetail) + '" />';
                  printContents = printContents + '<input type="submit" name="printDocument" id="printDocument" value="" />';
             }

    }
    printContents = printContents + '</form>';
    console.log(printContents, )
    printContents = printContents + '<script type="text/javascript">document.addBeneficiaryPrintForm.submit();</script>';

    popupWin = window.open('', '_blank', 'width=800,height=800,resizable=yes');
    popupWin.document.write(printContents);
    popupWin.document.close();
    //this.formData.notifyBeneficiaryFaxCode+this.formData.notifyBeneficiaryFax
  }

  getAddBeneficiaryModelResponse(): RegularBeneficiaryManagementAddRegularBeneficiaryResponse {
    return this.addBeneficiaryModelResponse;
  }

  convertDatePickerDateToValidDate(date: string): string { // convert Fri Mar 09 2018 to 2018-03-09
    const dateString = '23 August 2013'
    //if (dateString.length === 10) { // valid date
    return dateString;
    // }
  }

  ngAfterViewInit() {
    this.payNewService.emitChange('scrollNewBen');
  }

  generateErrorMessage(validateErrorDetail): string[] {

    let errorMessage = [];
    validateErrorDetail.errorList.forEach(error => {
      errorMessage.push(error.responseMessage)
    });
    return errorMessage
  }
  done() {
    //this.newBeneComponent.onStep3Done()
    let addexistingBen = {
      'accountNumber': '',
      'branchCode': '',
      'exist': false
    }
    this.payNewService.SetaddexistingBen(addexistingBen);
    this.payNewService.emitChange('onStep3Done');
    this.payNewService.clearFormData('normalBeneficiary');

  }

  another() {
    let addexistingBen = {
      'accountNumber': '',
      'branchCode': '',
      'exist': false
    }
    this.payNewService.SetaddexistingBen(addexistingBen);
    this.payNewService.clearFormData('normalBeneficiary');
    this.payNewService.emitChange('onStep3AddOnother');
    this.payNewService.setClearAccountType(true);

  }

  ngAfterContentInit() {
    this.payNewService.emitChange('hideTabHeads');
  }
  prepaireNotificationDetails() {

    switch (this.formData.notifyMeRadio) {
      case 'E':
        this.notifyMe = {
          'sendViaLabel': this.translations['sendViaLabel'],
          'sendViaValue': this.translations['email'],
          'methodTypeLabel': this.translations['emailAddress'],
          'methodTypeValue': this.formData.notifyMeEmail,
        }
        break;
      case 'S':
        this.notifyMe = {
          'sendViaLabel': this.translations['sendViaLabel'],
          'sendViaValue': this.translations['sms'],
          'methodTypeLabel': this.translations['cellNumber'],
          'methodTypeValue': this.formData.notifyMeSMS,
        }
        break;
      case 'F':
        this.notifyMe = {
          'sendViaLabel': this.translations['sendViaLabel'],
          'sendViaValue': this.translations['fax'],
          'methodTypeLabel': this.translations['faxNumber'],
          'methodTypeValue': this.formData.notifyMeFaxCode + " " + this.formData.notifyMeFaxNumber
        }
        break;
      default:
        this.notifyMe = {
          'sendViaLabel': this.translations['sendViaLabel'],
          'sendViaValue': this.translations['none']
        }
        this.isOwnNone = false;
        break;
    }

    switch (this.formData.notifyBeneficiaryRadio) {
      case 'E':
        this.notifyBeneficiary = {
          'sendViaLabel': this.translations['sendViaLabel'],
          'sendViaValue': this.translations['email'],
          'methodTypeLabel': this.translations['emailAddress'],
          'methodTypeValue': this.formData.notifyBeneficiaryEmail,
          'recipientNameValue': this.formData.notifyBeneficiaryEmailRecipientName,
          'paymentMadeBy': this.formData.notifyBeneficiaryEmailPaymentMadeBy,
          'contactMeOn': this.formData.notifyBeneficiaryEmailContactMeOn,
          'comments': this.formData.notifyBeneficiaryEmailComments
        }
        break;
      case 'S':
        this.notifyBeneficiary = {
          'sendViaLabel': this.translations['sendViaLabel'],
          'sendViaValue': this.translations['sms'],
          'methodTypeLabel': this.translations['cellNumber'],
          'methodTypeValue': this.formData.notifyBeneficiarySMS,
        }
        break;
      case 'F':
        this.notifyBeneficiary = {
          'sendViaLabel': this.translations['sendViaLabel'],
          'sendViaValue': this.translations['fax'],
          'methodTypeLabel': this.translations['faxNumber'],
          'methodTypeValue': this.formData.notifyBeneficiaryFaxCode + " " + this.formData.notifyBeneficiaryFaxNumber,
          'recipientNameValue': this.formData.notifyBeneficiaryFaxRecipientName,
          'paymentMadeBy': this.formData.notifyBeneficiaryFaxPaymentMadeBy,
          'contactMeOn': this.formData.notifyBeneficiaryFaxContactMeOn,
          'comments': this.formData.notifyBeneficiaryFaxComments
        }
        break;
      default:
        this.notifyBeneficiary = {
          'sendViaLabel': this.translations['sendViaLabel'],
          'sendViaValue': this.translations['none']
        }

        this.benNone = false;
    }

  }


  payThisBeneficiary() {
    this.payNewService.emitChange('payThisBeneficiary')
  }
}



