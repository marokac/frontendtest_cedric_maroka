import { Component, OnInit, AfterViewInit, ViewContainerRef } from '@angular/core';
import { ErrorDetail, FormData } from 'app/process/modules/cb-app/view-beneficiaries/view-payment/add-beneficiary/add-payment.model';
import { ViewPaymentService } from 'app/process/modules/cb-app/view-beneficiaries/view-payment/add-beneficiary/add-payment.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AddPaymentBeneficiaryComponent } from 'app/process/modules/cb-app/view-beneficiaries/view-payment/add-beneficiary/add-payment-stepManager/add-payment-beneficiary.component';
import { Translator } from 'angular-translator';
import { BenExistDialogComponent } from "app/process/modules/cb-app/view-beneficiaries/view-payment/add-beneficiary/ben-exist-dialog/ben-exist-dialog.component";
import { DataLossWarningService } from 'app/common/services/data-loss-warning.service';
import { ScrollUtilService } from 'app/core/utils/scroll-util.service';

@Component({
  selector: 'app-absa-listed-confirm',
  templateUrl: './absa-listed-confirm.component.html',
  styleUrls: ['./absa-listed-confirm.component.scss']
})
export class AbsaListedConfirmComponent implements OnInit, AfterViewInit {
  isOwnNone: boolean = true;
  sourceAccount: Account;
 // accountType: SelectedOption;
  displayedDate: any;
  formData: FormData
  fromReference: string
  toReference: string
  notify:string='';
  notifyLabel:string='';
  subscription: Subscription;
  notifyMe: any = {};
  notifyBeneficiary: any;
  absaListedData:any;
  translations: object = {}
  benExist: boolean = false;

  constructor(private payNewService: ViewPaymentService,
              private router: Router,
              private datePipe: DatePipe,
              private absaListed:AddPaymentBeneficiaryComponent,
              private translator: Translator,
              private scrollUtils: ScrollUtilService,
              private viewContainerRef: ViewContainerRef,
              private dataLossWarningService: DataLossWarningService
            ) {

      this.formData = this.payNewService.getFormData('absaListedBeneficiary');
      this.absaListedData = this.absaListed.getAbsaListedData();

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
          
          this.prepaireNotificationDetails();
        })       
      });

      this.viewContainerRef.clear()      
     }

  ngOnInit() {

    
    this.payNewService.emitChange('hideTabHeads');
    this.displayedDate = this.datePipe.transform(new Date('23 August 2017'), 'yyyy-MM-dd')
    this.formData = this.payNewService.getFormData('absaListedBeneficiary');

    this.benExist = this.payNewService.beneficiaryExist;
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
          'methodTypeValue': this.formData.notifyMeFaxCode+""+this.formData.notifyMeFaxNumber
        }
        break;
        default:
        this.notifyMe = {
          'sendViaLabel': this.translations['sendViaLabel'],
          'sendViaValue': this.translations['none']
        }

        this.isOwnNone = false;
    }
  }

  ngAfterViewInit() {
    this.scrollUtils.scrollTo();
   }

  confirm() {
    this.payNewService.emitChange('AbsaListedStep2Next')
  }
  back() {
    this.payNewService.emitChange('AbsaListedStep2Back')
  }
  cancel(){
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
