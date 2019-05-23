import { Component, OnInit, Input, AfterViewInit } from '@angular/core';
import { ErrorDetail, FormData } from 'app/process/modules/cb-app/view-beneficiaries/view-payment/add-beneficiary/add-payment.model';
import { ViewPaymentService } from 'app/process/modules/cb-app/view-beneficiaries/view-payment/add-beneficiary/add-payment.service';
import { AddPaymentBeneficiaryComponent } from 'app/process/modules/cb-app/view-beneficiaries/view-payment/add-beneficiary/add-payment-stepManager/add-payment-beneficiary.component';
import { SessionService } from "app/common/services/session.service";
import { TimeUtilsService } from 'app/common/services/utils/time-utils.service';
import * as moment from 'moment';
import { DataLossWarningService } from 'app/common/services/data-loss-warning.service';
import { Translator } from 'angular-translator';
import { AclConstants } from 'app/common/constants/acl-constants';
import { AccessControlService } from 'app/common/services/security/access-control-service';
import { DialogModalModel } from 'app/common/ui-components/dialog-modal/dialog-modal.model';
import { DialogModalService } from 'app/common/ui-components/dialog-modal/dialog-modal.service';
import { ScrollUtilService } from 'app/core/utils/scroll-util.service';
@Component({
  selector: 'app-absa-listed-results',
  templateUrl: './absa-listed-results.component.html',
  styleUrls: ['./absa-listed-results.component.scss']
})
export class AbsaListedResultsComponent implements OnInit, AfterViewInit {

  isOwnNone: boolean = true;
  @Input() beneficiaryNumber: number;
  @Input() switchData: any;


  value = null;
  error: any;
  date: string;
  notify: string = ''
  notifyMe: object = {};
  notifyLabel: string = ''
  notifyBeneficiary: string;
  printButtonS: any = []
  errorMessageList: { status_reason: string, status_reasons: string, status_messages: string }[];
  public formData: FormData;
  public errorDetail: ErrorDetail;
  public validateErrorDetail: ErrorDetail;
  translations: object = {}
  tittleSuccessfully : string;
  tittleUnsuccessfully: string;
  tittlePendingfully:string;
  panelData: any = {};
  dateString =  this.timeUtilsService.getDateTimeFormatted();
  pandingMessage : string;
  public aclData;
  private dialogMessage: DialogModalModel;


  constructor(private payNewService: ViewPaymentService,
              private sessionService: SessionService,
              private translator: Translator,
              private scrollUtils: ScrollUtilService,
              private timeUtilsService: TimeUtilsService,
              private dataLossWarningService: DataLossWarningService,
              private accessControlService:AccessControlService,
              private dialogModalService: DialogModalService,
  ) {
  this.dialogMessage=new DialogModalModel();
    this.dataLossWarningService.setDirtyFlag(false);

    translator.waitForTranslation().then(() => {
      translator.observe([
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
        'common.label.print',
        'pay.label.beneficiaryAddedSuccessfully',
        'prepaidMobile.label.addBeneficiaryFailed',
        'beneficiaries.switchBeneficiaries.unableToSwitch',
        'beneficiaries.switchBeneficiaries.successfullySwitched',
        'common.label.statusUnknown',
        'paymentBeneficiaries.label.addBeneficiaryPendingWarningMsg',
        'common.label.ok'

      ]).subscribe((translations) => {
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
        this.translations['print'] = translations[8];
        this.translations['successfullyAddedText'] =translations[9];
        this.translations['unsuccessfullyAddedText'] = translations[10];
        this.translations['unableToSwitch'] = translations[11];
        this.translations['successfullySwitched'] = translations[12];
        this.translations['pendingfullyAddedText'] = translations[13];
        this.translations['pandingMessage'] = translations[14];
        this.translations['okay'] = translations[15];

        this.prepaireNotificationDetails();

        this.tittlePendingfully = this.translations['pendingfullyAddedText'];

        this.pandingMessage = this.translations['pandingMessage'];

        this.printButtonS = [{ title: this.translations['print'], icon: 'print', id: 'print' }]

        if(this.switchData){
          this.tittleSuccessfully = this.translations['successfullySwitched'];
          this.tittleUnsuccessfully = this.translations['unableToSwitch'];
        }else{
          this.tittleSuccessfully = this.translations['successfullyAddedText'];
          this.tittleUnsuccessfully = this.translations['unsuccessfullyAddedText'];
        }
        if(this.errorDetail.isError){
          //errorMessageList: { status_reason: string, status_reasons: string, status_messages: string }
          console.log(this.tittlePendingfully)
          if(this.errorDetail.statuscode == '301' || this.errorDetail.statuscode == '502'){
            this.errorMessageList=[];
            this.errorMessageList.push({status_reason:  this.pandingMessage, status_reasons:  this.pandingMessage, status_messages:  this.pandingMessage})
            this.panelData = { 'title':this.tittlePendingfully, 'subtitle': this.dateString, 'status_reasons':  this.errorMessageList, 'icon': 'result-pending', id: 'print', 'status': 'pending', 'buttons': this.printButtonS }
          }
          else{
            this.panelData = { 'title':this.tittleUnsuccessfully, 'subtitle': this.dateString, 'status_reasons': this.errorMessageList, 'icon': 'result-fail', id: 'print', 'status': 'error', 'buttons': this.printButtonS }
          }
        }


      })
    });

  }

  ngOnInit() {
    this.date = moment(new Date()).format('DD MMMM YYYY, HH:mm:ss');
    this.formData = this.payNewService.getFormData('absaListedBeneficiary');
    this.errorDetail = this.payNewService.getError();
    this.validateErrorDetail = this.payNewService.getValidateError();
    this.payNewService.emitChange('hideTabHeads');

    //Build error messages for status panel component
    if (this.errorDetail.isError) {
      this.errorMessageList = [];
      this.errorDetail.errorList.forEach(messageObj => {
        this.errorMessageList.push({ 'status_reason': messageObj.responseMessage, 'status_reasons': messageObj.responseMessage, 'status_messages': messageObj.responseMessage });
      });



    }

  }

  ngAfterViewInit() {
    this.scrollUtils.scrollTo();
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
          'methodTypeValue': this.formData.notifyMeFaxCode + "" + this.formData.notifyMeFaxNumber
        }
        break;
      default:
        this.notifyMe = {
          'sendViaLabel': this.translations['sendViaLabel'],
          'sendViaValue': this.translations['none']
        }

        this.isOwnNone = false
    }
  }

  done() {
    //this.newBeneComponent.onStep3Done()
    this.payNewService.clearFormData('absaListedBeneficiary');
    this.payNewService.emitChange('AbsaListedStep3Done')
  }

  another(tryAgain?: string) {
    //this.newBeneComponent.onStep3AddOnother()
    if (!tryAgain) this.payNewService.clearFormData('absaListedBeneficiary');

    this.payNewService.emitChange('AbsaListedStep3AddOnother');
    this.value = 'add';
  }


  generateErrorMessage(validateErrorDetail): string {
    let errorMessage = '';
    validateErrorDetail.errorList.forEach((error, index) => {
      if (index > 0) { // only add hyphen if more than 1 error message
        errorMessage += ' - ';
      }
      errorMessage += error.responseMessage;
    });

    return errorMessage
  }
  onStatusHeaderButton(event) {
    if (event === 'print') {
      let aclKey = AclConstants.PRINT_ADD_ABSA_LISTED_PMNT_BNFR;
      if(this.accessControlService.isAllowed(aclKey)){
        this.printReceipt(this.errorDetail)
      }
      else{
        this.aclData = this.accessControlService.getUIState(aclKey);
        this.dialogMessage.title = this.aclData.titleText;
        this.dialogMessage.contentText = this.aclData.reasonText;
        this.dialogMessage.okButtonText =this.translations['okay'];
        this.dialogMessage.icon = false;
        this.dialogModalService.NotificationDialogModal(this.dialogMessage).subscribe();
      }
     
    }
  }

  printReceipt(errorDetail): void {
    const urlString = this.sessionService.globalConfig.GLOBAL_EXPRESS_SERVICE_BASE_URL
      + this.sessionService.globalConfig.GLOBAL_EXPRESS_SERVICE_ROOT_CONTEXT
      + '/RegularBeneficiaryManagementFacadeGetCreateInstitutionalBeneficiaryReceipt.exp';

    const beneficiaryNumber = this.beneficiaryNumber === undefined ?
      '0' : this.beneficiaryNumber;
    const recepientName = this.formData.notifyBeneficiaryEmailRecipientName == '' ? this.formData.notifyBeneficiaryFaxRecipientName : this.formData.notifyBeneficiaryEmailRecipientName

    let todaysTime = this.timeUtilsService.getCurrentTimeStampUpToMinutes();

    let printContents, popupWin;
    printContents = '<form name="addBeneficiaryPrintForm" id="addBeneficiaryPrintForm" action=';
    printContents = printContents + urlString;
    printContents = printContents + ' method="post">';

    printContents = printContents + '<input type="hidden" name="beneficiaryName" id="beneficiaryName" value="' + this.formData.institutionName + '" />';
    printContents = printContents + '<input type="hidden" name="beneficiaryNumber" id="beneficiaryNumber" value="' + beneficiaryNumber.toString() + '" />';
    printContents = printContents + '<input type="hidden" name="beneficiaryAccountNumber" id="beneficiaryAccountNumber" value="' + this.formData.accountNumber + '" />';
    printContents = printContents + '<input type="hidden" name="institutionCode" id="institutionCode" value="' + this.formData.branchCode + '" />';
    printContents = printContents + '<input type="hidden" name="myStatementDesc" id="myStatementDesc" value="' + this.formData.myReference + '" />';
    printContents = printContents + '<input type="hidden" name="myPreferredNotice" id="myPreferredNotice" value="' + this.formData.notifyMeRadio + '" />';
    printContents = printContents + '<input type="hidden" name="myCell" id="myCell" value="' + this.formData.notifyMeSMS + '" />';
    printContents = printContents + '<input type="hidden" name="myEmail" id="myEmail" value="' + this.formData.notifyMeEmail + '" />';
    printContents = printContents + '<input type="hidden" name="myFax" id="myFax" value="' + this.formData.notifyMeFaxCode + ' ' + this.formData.notifyMeFaxNumber + '" />';
    printContents = printContents + '<input type="hidden" name="accountHolderName" id="accountHolderName" value="' + this.formData.accountHoldersName + '" />';
    printContents = printContents + '<input type="hidden" name="myAccountNumberWithInstitution" id="myAccountNumberWithInstitution" value="' + this.formData.accountHoldersRefNumber + '" />';
    printContents = printContents + '<input type="hidden" name="txDateTimestamp" id="txDateTimestamp" value="' + todaysTime + '" />';

    if (!errorDetail.isError) {
      printContents = printContents + '<input type="hidden" name="txSuccessful" id="txSuccessful" value="true" />';

    } else {
      if(this.errorDetail.statuscode == '301' || this.errorDetail.statuscode == '502'){
        printContents = printContents + '<input type="hidden" name="txSuccessful" id="txSuccessful" value="pending" />';
        printContents = printContents + '<input type="hidden" name="transactionStatusMessage" id="transactionStatusMessage" value="' +this.tittlePendingfully+'" />';
        printContents = printContents + '<input type="hidden" name="reasons" id="reasons" value="' + this.pandingMessage + '" />';
      }else{
        printContents = printContents + '<input type="hidden" name="txSuccessful" id="txSuccessful" value="false" />';
        printContents = printContents + '<input type="hidden" name="reasons" id="reasons" value="' + this.generateErrorMessage(errorDetail) + '" />';
      }

    }

    printContents = printContents + '</form>';

    printContents = printContents + '<script type="text/javascript">document.addBeneficiaryPrintForm.submit();</script>';

    popupWin = window.open('', '_blank', 'width=800,height=800,resizable=yes');
    popupWin.document.write(printContents);
    popupWin.document.close();

    console.log(printContents);
  }

  payThisBeneficiary(){
    this.payNewService.emitChange('payThisBeneficiary')
  }
}
