import { Component, OnInit } from '@angular/core';
import { DialogModalService } from "app/common/ui-components/dialog-modal/dialog-modal.service";
import { ViewPaymentService } from "app/process/modules/cb-app/view-beneficiaries/view-payment/add-beneficiary/add-payment.service";
import { Translator } from 'angular-translator';
import { RegularBeneficiaryManagementGetBeneficiariesForBranchAndAccountResponse, OwnDefinedBeneficiary } from '../../../../../../../common/services/proxy-services/regular-beneficiary-management-proxy.service';
import { FormGroup, FormControl } from '@angular/forms';
import { BeneficiaryEnquiry, EnquireRegularBeneficiaryDetailsRequest } from 'app/common/services/proxy-services/get-notification-details-proxy.service';


@Component({
  selector: 'app-ben-exist-dialog',
  templateUrl: './ben-exist-dialog.component.html',
  styleUrls: ['./ben-exist-dialog.component.scss']
})
export class BenExistDialogComponent implements OnInit {

  accountFromBranch: RegularBeneficiaryManagementGetBeneficiariesForBranchAndAccountResponse;
  absaListed: boolean;
  existingBen: any
  benList = []
  formData: any;
  name: string
  existingBeneficiaryForm: FormGroup;
  translations: object = {};
  selectedBeneeficiary: OwnDefinedBeneficiary;
  isNoBeneficiarySelectedError: boolean = false;
  sortedData: any

  sortByNum: boolean;
  sortByName: boolean;
  sortByRef: boolean;
  lastTrans: boolean;

  constructor(public dialogModalService: DialogModalService, private payNewService: ViewPaymentService,
    private translator: Translator) {
    this.formData = payNewService.getFormData('absaListedBeneficiary');

    if (this.formData.institutionName) {
      this.name = 'Institution name'
      this.absaListed = false;
    }
    else {
      this.name = 'Beneficiary name'
      this.absaListed = false;
    }

    translator.waitForTranslation().then(() => {
      translator.observe([
        'paymentBeneficiaries.label.noPaymentHistory'
      ]).subscribe((translations) => {
        this.translations['noPaymentHistory'] = translations[0]
      })
    })
  }

  ngOnInit() {

    this.sortByNum = false;
    this.sortByName = true;
    this.sortByRef = false;
    this.lastTrans = false;

    this.accountFromBranch = this.payNewService.getAccountFromBranch();
    this.sortedData = this.accountFromBranch.ownDefinedBeneficiaries;
    this.sortRows('beneficiaryNumber');
    this.createSimpleForm()

    this.existingBen = this.payNewService.getBenExists();
    this.benList = []
    this.existingBen.forEach(ben => {
      let lastTransection = ben.beneficiaryDetailsVO.lastPaymentDateAndTime;
      if (lastTransection == null) {
        lastTransection = this.translations['noPaymentHistory']
      }
      this.benList.push({
        number: ben.beneficiaryNumber,
        name: ben.beneficiaryDetailsVO.beneficiaryName,
        reference: ben.beneficiaryDetailsVO.sourceAccountReference,
        LastTransection: lastTransection,
        targetAccountNumber: ben.beneficiaryDetailsVO.targetAccountNumber,
        bank: ben.beneficiaryDetailsVO.bankName,
        sourceAccountReference: ben.beneficiaryDetailsVO.sourceAccountReference,
        amount: ben.beneficiaryDetailsVO.amount
      })
    });
  }

  createSimpleForm(formData?: FormData) {
    this.existingBeneficiaryForm = new FormGroup({
      existingBeneficiary: new FormControl('')
    });
  }

  showNoBeneficiarySelectedError() {
    this.isNoBeneficiarySelectedError = true;
  }
  //TODO
  onUseExistingBeneficiary(selectedBeneficiary: OwnDefinedBeneficiary) {
    console.log('OwnDefinedBeneficiaryDialogComponent onUseExistingBeneficiary')
    if (!selectedBeneficiary) {
      this.showNoBeneficiarySelectedError()
      return false;
    }

    this.payNewService.setUseExistingBeneficiaryIndicator(true);

    const beneficiaryDetailsVO = selectedBeneficiary.beneficiaryDetailsVO;
    this.dialogModalService.closeModalDialog();
    const formData = this.payNewService.getFormData('normalBeneficiary');

    const beneficiaryDetailsRequestVO = selectedBeneficiary.beneficiaryDetailsVO;
    const beneficiaryEnquiry: BeneficiaryEnquiry = {
      beneficiaryNumber: Number(beneficiaryDetailsRequestVO.beneficiaryNumber),
      uniqueEFTNumber: beneficiaryDetailsRequestVO.uniqueEFTNumber,
      tieBreaker: beneficiaryDetailsRequestVO.tieBreaker,
      cifKey: beneficiaryDetailsRequestVO.cifKey,
      beneficiaryStatus: beneficiaryDetailsRequestVO.beneficiaryStatus,
      instructionType: beneficiaryDetailsRequestVO.instructionType
    }

    const beneficiaryResquest: EnquireRegularBeneficiaryDetailsRequest = {
      beneficiaryEnquiry: beneficiaryEnquiry
    }

    this.payNewService.getBeneficiaryNotificationDetails(beneficiaryResquest).subscribe(
      response => {
        const beneficiaryDetailsVO = response.beneficiaryDetailsVO;
        this.payNewService.setFormData({
          institutionName: formData.institutionName,
          fullName: beneficiaryDetailsVO.beneficiaryName,
          accountNumber: beneficiaryDetailsVO.targetAccountNumber,
          accountType: formData.accountType, //beneficiaryDetailsVO.accountType ? beneficiaryDetailsVO.accountType : 'NONE',
          bank: beneficiaryDetailsVO.bankName,
          beneficiaryReference: beneficiaryDetailsVO.targetAccountReference,
          branchCode: beneficiaryDetailsVO.clearingCodeOrInstitutionCode,
          branchCodeLabel: beneficiaryDetailsVO.clearingCodeOrInstitutionCode,
          branchName: formData.branchName,
          checkboxIIP: formData.checkboxIIP,
          fromAccount: formData.fromAccount,
          date: formData.date,
          amount: formData.amount,
          myReference: beneficiaryDetailsVO.sourceAccountReference,
          notifyMeRadio: beneficiaryDetailsVO.ownNotification.notificationMethod,
          notifyMeSMS: formData.notifyMeSMS,
          notifyMeEmail: formData.notifyMeEmail,
          notifyMeFaxNumber: formData.notifyMeFaxNumber,
          notifyMeFaxCode: formData.notifyMeFaxCode,
          notifyBeneficiaryRadio: beneficiaryDetailsVO.beneficiaryNotification.notificationMethod,
          notifyBeneficiarySMS: beneficiaryDetailsVO.beneficiaryNotification.cellphoneNumber,
          notifyBeneficiaryEmail: beneficiaryDetailsVO.beneficiaryNotification.emailAddress,
          notifyBeneficiaryFax: beneficiaryDetailsVO.beneficiaryNotification.faxCode + ' ' +
            beneficiaryDetailsVO.beneficiaryNotification.faxNumber,
          notifyBeneficiaryEmailRecipientName: beneficiaryDetailsVO.beneficiaryNotification.recipientName,
          notifyBeneficiaryEmailPaymentMadeBy: formData.notifyBeneficiaryEmailPaymentMadeBy,
          notifyBeneficiaryEmailContactMeOn: beneficiaryDetailsVO.beneficiaryNotification.contactMeOn,
          notifyBeneficiaryEmailComments: beneficiaryDetailsVO.beneficiaryNotification.additionalComments,


          notifyBeneficiaryFaxCode: beneficiaryDetailsVO.beneficiaryNotification.faxCode,
          notifyBeneficiaryFaxNumber: beneficiaryDetailsVO.beneficiaryNotification.faxNumber,
          notifyBeneficiaryFaxRecipientName: beneficiaryDetailsVO.beneficiaryNotification.recipientName,
          notifyBeneficiaryFaxPaymentMadeBy: formData.notifyBeneficiaryFaxPaymentMadeBy,
          notifyBeneficiaryFaxContactMeOn: beneficiaryDetailsVO.beneficiaryNotification.contactMeOn,
          notifyBeneficiaryFaxComments: beneficiaryDetailsVO.beneficiaryNotification.additionalComments,

          recipientName: formData.recipientName,
          paymentTime: formData.paymentTime,
          saveBeneficiaryRadio: 'N',
          accountHoldersRefNumber: '',
          accountHoldersName: '',
          beneficiaryType: formData.beneficiaryType
        }, 'normalBeneficiary');
      }, error => {
        //this.isNotificationError = true;
        console.error(error);
      }
    );

    //this.payNewService.emitChange('step1Next');
  }

  goToNext() {


    if (this.absaListed) {
      this.payNewService.getcloseDilogEmitter('absaListedNext');
      this.payNewService.emitChange('continue1');
      this.dialogModalService.closeModalDialog();
    } else {
      this.payNewService.getcloseDilogEmitter('continue', this.existingBen[0]);
      this.payNewService.emitChange('continue2');
      this.dialogModalService.closeModalDialog();
    }
  }
  cancel() {
    this.dialogModalService.closeModalDialog();
    this.payNewService.emitChange('benExistCancel');
  }
  onheadercancel() {
    this.payNewService.emitChange('modalClosed');
    this.dialogModalService.closeModalDialog();
  }

  onAddNewBeneficiary() {
    this.dialogModalService.closeModalDialog();
    //this.payNewService.emitChange('step1Next');
    let addexistingBen = {
      'accountNumber': this.sortedData[0].targetAccountNumber,
      'branchCode': this.sortedData[0].beneficiaryDetailsVO.clearingCodeOrInstitutionCode,
      'exist': true
    }
    this.payNewService.SetaddexistingBen(addexistingBen);
    this.payNewService.setAddBeneficiaryIndicator(true);
  }

  columnActiveDirection: any = {
    beneficiaryNumber: 'asc',
    beneficiaryName: 'asc',
    sourceAccountReference: 'asc',
    lastPaymentDateAndTime: 'asc'
  }
  sortRows(colName) {
    this.sortstyle(colName);
    if (colName === 'lastPaymentDateAndTime' || colName === 'sourceAccountReference') {
      this.sortByRefAndLast(colName);
      return false;
    }
    else {
      switch (this.columnActiveDirection[colName]) {
        case 'asc':
          this.sortedData.sort(function (value1, value2) {
            let outcome = 0;
            if (value1[colName] < value2[colName]) {
              outcome = -1;
            }
            if (value1[colName] > value2[colName]) {
              outcome = 1;
            }
            return outcome;
          });
          this.columnActiveDirection[colName] = 'desc';
          break;
        case 'desc':
          this.sortedData.sort(function (value1, value2) {
            let outcome = 0;
            if (value1[colName] > value2[colName]) {
              outcome = -1;
            }
            if (value1[colName] < value2[colName]) {
              outcome = 1;
            }
            return outcome;
          });
          this.columnActiveDirection[colName] = 'asc';
          break;
      }
    }

  }
  sortstyle(sortName) {
    switch (sortName) {
      case 'beneficiaryNumber': {
        this.sortByNum = !this.sortByNum;
        this.sortByName = false;
        this.sortByRef = false;
        this.lastTrans = false;
        break;
      }
      case 'beneficiaryName': {
        this.sortByName = !this.sortByName;
        this.sortByNum = false;
        this.sortByRef = false;
        this.lastTrans = false;
        break;
      }
      case 'sourceAccountReference': {
        this.sortByRef = !this.sortByRef;
        this.sortByNum = false;
        this.sortByName = false;
        this.lastTrans = false;
        break;
      }
      case 'lastPaymentDateAndTime': {
        this.lastTrans = !this.lastTrans;
        this.sortByRef = false
        this.sortByNum = false;
        this.sortByName = false;
        break;
      }
    }
  }

  sortByRefAndLast(colName) {
    console.log(colName)
    switch (this.columnActiveDirection[colName]) {
      case 'asc': {

        this.sortedData.sort(function (value1, value2) {
          let outcome = 0;
          let a = value1['beneficiaryDetailsVO'];
          let b = value2['beneficiaryDetailsVO'];
          if (a[colName] < b[colName]) {
            outcome = -1;
          }
          if (a[colName] > b[colName]) {
            outcome = 1;
          }
          if (a[colName] === null) {
            outcome = -1;
          }
          if (b[colName] === null) {
            outcome = 1;
          }
          return outcome;
        })
        this.columnActiveDirection[colName] = 'desc';
        break;
      }
      case 'desc': {
        this.sortedData.sort(function (value1, value2) {
          let a = value1['beneficiaryDetailsVO'];
          let b = value2['beneficiaryDetailsVO'];
          let outcome = 0;

          if (a[colName] > b[colName]) {
            outcome = -1;
          }
          if (a[colName] < b[colName]) {
            outcome = 1;
          }
          if (a[colName] === null) {
            outcome = 1;
          }
          if (b[colName] === null) {
            outcome = -1;
          }
          return outcome;
        });
        this.columnActiveDirection[colName] = 'asc';
        break;
      }
    }
  }

  ngOnDestroy() {

  }
}
