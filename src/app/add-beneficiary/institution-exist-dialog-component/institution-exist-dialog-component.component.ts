import { Component, OnInit, Input } from '@angular/core';
import { RegularBeneficiaryManagementGetBeneficiariesForBranchAndAccountResponse, OwnDefinedBeneficiary } from 'app/common/services/proxy-services/regular-beneficiary-management-proxy.service';
import { Observable } from 'rxjs';
import { FormGroup, FormControl } from '@angular/forms';
import { DialogModalService } from 'app/common/ui-components/dialog-modal/dialog-modal.service';
import { ViewPaymentService } from 'app/process/modules/cb-app/view-beneficiaries/view-payment/add-beneficiary/add-payment.service';

@Component({
  selector: 'app-institution-exist-dialog-component',
  templateUrl: './institution-exist-dialog-component.component.html',
  styleUrls: ['./institution-exist-dialog-component.component.scss']
})
export class InstitutionExistDialogComponentComponent implements OnInit {

  accountFromBranch$: Observable<RegularBeneficiaryManagementGetBeneficiariesForBranchAndAccountResponse>;
  @Input() accountFromBranch: RegularBeneficiaryManagementGetBeneficiariesForBranchAndAccountResponse;
  isNoBeneficiarySelectedError: boolean = false;
  isNotificationError: boolean = false;
  institutionForm: FormGroup;
  selectedBeneficiary: OwnDefinedBeneficiary;

  constructor(public dialogModalService: DialogModalService,
    private payNewService: ViewPaymentService) {
    console.log('InstitutionOwnDefBenefDialogComponent constructor')
  }

  onAddNewBeneficiary() {
    this.dialogModalService.closeModalDialog(); 
    this.payNewService.setAddBeneficiaryIndicator(true)
  }
  showNoBeneficiarySelectedError() {
    this.isNoBeneficiarySelectedError = true;
  }
  onUseExistingBeneficiary(selectedBeneficiary: OwnDefinedBeneficiary) {
    console.log('OwnDefinedBeneficiaryDialogComponent onUseExistingBeneficiary')
    if (!selectedBeneficiary) {
      this.showNoBeneficiarySelectedError()
      return false;
    }
    this.payNewService.setUseExistingBeneficiaryIndicator(true);
    const beneficiaryDetailsVO = selectedBeneficiary.beneficiaryDetailsVO;
    this.dialogModalService.closeModalDialog();
    
    const formData = this.payNewService.getFormData('absaListedBeneficiary');

    this.payNewService.setFormData({
      institutionName: formData.institutionName,
      fullName: formData.fullName,
      accountNumber: beneficiaryDetailsVO.targetAccountNumber,
      accountType: beneficiaryDetailsVO.accountType ? beneficiaryDetailsVO.accountType : 'NONE',
      bank: beneficiaryDetailsVO.bankName,
      beneficiaryReference:  beneficiaryDetailsVO.targetAccountReference,
      branchCode: beneficiaryDetailsVO.clearingCodeOrInstitutionCode,
      branchCodeLabel: beneficiaryDetailsVO.clearingCodeOrInstitutionCode,
      branchName: '',
      checkboxIIP: formData.checkboxIIP,
      fromAccount: formData.fromAccount,
      date: formData.date,
      amount: formData.amount,
      myReference: beneficiaryDetailsVO.sourceAccountReference,
      notifyMeRadio: beneficiaryDetailsVO.ownNotification.notificationMethod,
      notifyMeSMS: formData.notifyMeSMS,
      notifyMeEmail: formData.notifyMeEmail,
      notifyMeFaxNumber: formData.notifyMeFaxNumber,
      notifyMeFaxCode:formData.notifyMeFaxCode,
      notifyBeneficiaryRadio: '',
      notifyBeneficiarySMS: '',
      notifyBeneficiaryEmail: '',
      notifyBeneficiaryFax: '',
      notifyBeneficiaryEmailRecipientName: '',
      notifyBeneficiaryEmailPaymentMadeBy: '',
      notifyBeneficiaryEmailContactMeOn: '',
      notifyBeneficiaryEmailComments: '',
    
    
      notifyBeneficiaryFaxCode: '',
      notifyBeneficiaryFaxNumber: '',
      notifyBeneficiaryFaxRecipientName: '',
      notifyBeneficiaryFaxPaymentMadeBy: '',
      notifyBeneficiaryFaxContactMeOn: '',
      notifyBeneficiaryFaxComments: '',
    
      recipientName: formData.recipientName,
      paymentTime: formData.paymentTime,
      saveBeneficiaryRadio: 'N',
      accountHoldersRefNumber:  beneficiaryDetailsVO.targetAccountNumber,
      accountHoldersName: beneficiaryDetailsVO.targetAccountReference,
      beneficiaryType: formData.beneficiaryType
    },'absaListedBeneficiary');
  }

  createSimpleForm(formData?: FormData) {
    this.institutionForm = new FormGroup({
      institution: new FormControl('')
    });
  }

  setSelectedBeneficiary(selectedBeneficiary: OwnDefinedBeneficiary, value: string) {
    this.institutionForm.controls['institution'].setValue(value);
    this.selectedBeneficiary = selectedBeneficiary;
    this.isNoBeneficiarySelectedError = false;
  }

  ngOnInit() {
    console.log('InstitutionOwnDefBenefDialogComponent ngOnInit')

    this.accountFromBranch = this.payNewService.getAccountFromBranch();
    this.createSimpleForm();
  }
  cancelTransaction(){
    this.payNewService.setUseExistingBeneficiaryIndicator(true);
    this.dialogModalService.closeModalDialog(); 
  }
}
