import { Component, OnInit, ViewContainerRef, AfterViewInit, OnDestroy, ChangeDetectorRef, AfterContentInit } from '@angular/core';
import { FormData, SelectedOption } from 'app/process/modules/cb-app/view-beneficiaries/view-payment/add-beneficiary/add-payment.model';

import { Account } from 'app/common/services/proxy-services/regular-beneficiary-payment-get-source-accounts-proxy.service';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ViewPaymentService } from "app/process/modules/cb-app/view-beneficiaries/view-payment/add-beneficiary/add-payment.service";
import { Subscription } from "rxjs/Subscription";
import { DialogModalService } from "app/common/ui-components/dialog-modal/dialog-modal.service";
import { BenExistDialogComponent } from "app/process/modules/cb-app/view-beneficiaries/view-payment/add-beneficiary/ben-exist-dialog/ben-exist-dialog.component";
import { Translator } from 'angular-translator';
import { SessionService } from 'app/common/services/session.service';
import { Constants } from 'app/common/constants/constants';
import { ListBranchCodesForBankRequest, ListBankNamesRequest, ExternalBankDetailsProxyService } from '../../../../../../../../common/services/proxy-services/external-bank-details-proxy.service';
import { DateUtilsService } from 'app/process/modules/cb-app/view-beneficiaries/common-view-beneficiaries/date-utils.service';
import { DataLossWarningService } from 'app/common/services/data-loss-warning.service';
import { HistoryBeneficiaryData } from 'app/process/modules/cb-app/view-beneficiaries/common-view-beneficiaries/history/beneficiary-history.model';

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
  selector: 'app-confirm',
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.scss'],
  providers: [DateUtilsService]
})
export class ConfirmComponent implements OnInit, AfterViewInit,AfterContentInit, OnDestroy {
  benNone: boolean = true;
  isOwnNone: boolean = true;
  branchName: string;
  benExisting:any
  branchOptions: SelectedOption[];
  bankOptions: SelectedOption[];
  branchCodeData: any;
  data: HistoryBeneficiaryData;
  sourceAccount: Account;
  accountType: SelectedOption;
  displayedDate: any;
  translations: object = {}
  formData: FormData
  fromReference: string
  toReference: string
  branchCodeLabel:string;
  subscription: Subscription;
  notifyMe: any = {};
  notifyBeneficiary: any = {};
  previousContextualHelpId: string;

  allSubcriptions: Subscription[] = [];

  constructor(private payNewService: ViewPaymentService, private router: Router,
    private datePipe: DatePipe, private dialogModalService: DialogModalService,
    private dataLossWarningService: DataLossWarningService,
    public viewContainerRef: ViewContainerRef, private translator: Translator,
    private sessionService: SessionService,
    private externalBankDetailsProxyService: ExternalBankDetailsProxyService,private dateUtilsService:DateUtilsService
) {

     this.formData = this.payNewService.getFormData('normalBeneficiary');
     console.log('confirm',this.formData);
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
        'paymentBeneficiaries.label.notifyFaxNumber'

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

        this.prepaireNotificationDetails()
      })
    });
  }

  ngOnInit() {
    //this.previousContextualHelpId = this.sessionService.getContextualHelpId();
    //this.sessionService.setContextualHelpId(Constants.CONTEXTUAL_HELP_ID_ADDBENEFICIARY);
  

    this.sourceAccount = this.payNewService.findSourceAccount(this.formData.fromAccount);
    this.accountType = this.payNewService.findAccountType(this.formData.accountType);
    console.log( this.accountType,'xxxxx');
    this.displayedDate = this.datePipe.transform(new Date('23 August 2017'), 'yyyy-MM-dd')
    this.benExisting = this.payNewService.getaddexistingBen()
    
    
    
    if(this.formData.branchCodeLabel.indexOf('-')>-1){
      this.branchCodeLabel=this.formData.branchCodeLabel.replace(' - ',' | ');      
    }
    else{
      this.fetchBankNames(this.formData.bank)
    }

   
  }

  private fetchBankNames(searchString): void {
    const request = new BankNamesRequest(searchString);


    this.allSubcriptions.push(this.externalBankDetailsProxyService.getBanks(request).subscribe(
      response => {

        if(response.bankNames.length > 0){

          this.fetchBranchCodes(response.bankNames[0].bankNames)
        }
        else{
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

        if(response.branchCodes[0].branchName.indexOf('-')>-1){
          //this.branchName = response.branchCodes[0].branchName.replace(' - ',' | ');      

          this.branchCodeLabel = response.branchCodes[0].branchName.replace(' - ',' | ');      
        }
        else{
          this.branchCodeLabel = response.branchCodes[0].branchName
        }

        //console.log('::::: Details', response);
      },
      error => console.log('Error fetching branch codes')
    )) 
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
          'methodTypeValue':this.formData.notifyMeSMS,
        }
        break;
      case 'F':
        this.notifyMe = {
          'sendViaLabel': this.translations['sendViaLabel'],
          'sendViaValue': this.translations['fax'],
          'methodTypeLabel': this.translations['faxNumber'],
          'methodTypeValue': this.formData.notifyMeFaxCode+" "+this.formData.notifyMeFaxNumber
        }
        break;
        default:
        this.notifyMe = {
          'sendViaLabel': this.translations['sendViaLabel'],
          'sendViaValue': this.translations['none']
        }
        this.isOwnNone = false;
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
          'methodTypeValue':this.formData.notifyBeneficiarySMS
        }
        break;
      case 'F':
        this.notifyBeneficiary = {
          'sendViaLabel': this.translations['sendViaLabel'],
          'sendViaValue': this.translations['fax'],
          'methodTypeLabel': this.translations['faxNumber'],
          'methodTypeValue': this.formData.notifyBeneficiaryFaxCode+" "+this.formData.notifyBeneficiaryFaxNumber,
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

  ngAfterContentInit() {
      this.payNewService.emitChange('hideTabHeads');
  }
  ngAfterViewInit() {  
    this.payNewService.emitChange('scrollNewBen');
  }

  ngOnDestroy(){
    // this.sessionService.setContextualHelpId(this.previousContextualHelpId);
  }
  confirm() {
    this.payNewService.emitChange('onStep2Next')
  }
  back() {
    this.payNewService.setBranchcodeFromNext(true);
    this.payNewService.emitChange('step2Back')

  }
  cancel() {
    //this.payNewService.emitChange('step1Cancel')

    if (this.dataLossWarningService.isDirtyFlag) {
      this.dataLossWarningService.getDirtyFlag().subscribe((res) => {
        if (res) {
          this.payNewService.emitChange('step1Cancel');
        }
      })
    } else {
      this.payNewService.emitChange('step1Cancel');
    }
    return false;
  }

  
  
}
