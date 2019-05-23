import { Component, OnInit, EventEmitter, Output, ViewContainerRef } from '@angular/core';
import { ViewPaymentService } from 'app/process/modules/cb-app/view-beneficiaries/view-payment/add-beneficiary/add-payment.service';
import { Translator } from "angular-translator";
import { AvsService } from 'app/process/modules/cb-app/view-avs/avs.service';
import { ProgressSpinnerService } from 'app/common/ui-components/progress-spinner/progress-spinner.service';
import { AccessControlService } from 'app/common/services/security/access-control-service';
import { AclConstants } from 'app/common/constants/acl-constants';

@Component({
  selector: 'app-add-beneficiary-transactional-panel',
  templateUrl: './add-beneficiary-transactional-panel.component.html',
  styleUrls: ['./add-beneficiary-transactional-panel.component.scss'],
  providers: [AvsService, ProgressSpinnerService]
})

export class AddBeneficiaryTransactionalPanelComponent implements OnInit {
  @Output() childActionEvent = new EventEmitter<any>()
  translations: object = {};
  statusPanel: any;
  AVSData: any;
  pageId: any;
  subscription: any;
  addPaymentBeneficiaryAllowed:boolean=true;
  public aclData :any;
  constructor(private payNewService: ViewPaymentService,
    private translator: Translator,
    public viewContainerRef: ViewContainerRef,
    private avsService: AvsService,
    public progressSpinnerService: ProgressSpinnerService,
    private accessControlService:AccessControlService) {
      
      const aclKey = AclConstants.ADD_PMNT_BNFR;
//
      if(!this.accessControlService.isAllowed(aclKey)){
        this.aclData = this.accessControlService.getUIState(aclKey);
        console.log(this.aclData,'myaclData');
        this.addPaymentBeneficiaryAllowed=false;
      }

    translator.waitForTranslation().then(() => {
      translator.observe([
        'paymentBeneficiaries.label.pageTitle',
        'pay.label.payABeneficiary',
      ]).subscribe((translations) => {
        this.translations['addBenTitle'] = translations[0];
        this.translations['payBenTitle'] = translations[1];
        this.statusPanel = this.translations['addBenTitle'];
      })
    });
  
  }

  ngOnInit() {
    this.pageId = 0;

    this.avsService.activateAvs.subscribe((activateAvs) => {
      if (activateAvs === true) {
        let formData = this.payNewService.getFormData('normalBeneficiary');
        let accountType = this.payNewService.findAccountType(formData.accountType);
        this.AVSData = {
          'beneficiaryName': formData.fullName,
          'originatorId': '1',
          'bank': formData.bank.toUpperCase(),
          'branchCode': formData.branchCode,
          'branchCodeName': formData.branchCodeLabel,
          'accountNumber': formData.accountNumber,
          'accountType': formData.accountType,
        }
        this.pageId = 1;
      }
      else {
        if (!this.progressSpinnerService.showContent) {
          this.progressSpinnerService.stopLoading();
        }
        this.pageId = 0;
      }
    })

  }

  closeAddPanel(event) {

    if (event == "payThisBeneficiary") {
      this.statusPanel = this.translations['payBenTitle'];
    }

    if (event == 'closeAddPanel') {
      this.onClosePanel();
    }

  }

  onClosePanel() {
    this.viewContainerRef.clear()
    this.close();
  }

  close() {
    this.childActionEvent.emit({ status: 'closeAddPanel' });
  }
  onTransactionHeaderButton(event) {
    if (event == "close_transaction") {
      let addexistingBen = {
        'accountNumber': '',
        'branchCode': '',
        'exist': false,
      }
      this.payNewService.SetaddexistingBen(addexistingBen);
      this.onClosePanel();

    }
  }

  onCancelTransaction(e) {
    if (e == 2) {
      this.pageId = 0;
      setTimeout(() => {
        this.viewContainerRef.clear();
        this.childActionEvent.emit({ status: 'closeAddPanel' });
      }, 0)
    }
  }
  ngOnDestroy() {

  }

}
