import { Component, OnInit, ViewChild, Input, AfterViewInit, ViewContainerRef, ViewChildren, QueryList, Output, EventEmitter, ChangeDetectorRef, ElementRef } from '@angular/core';
import { Step } from 'app/common/ui-components/progress-indicator/step.model';
import { Tab } from 'app/common/ui-components/tabbed-nav/tab.model';
import { ProgressIndicatorComponent } from 'app/common/ui-components/progress-indicator/progress-indicator.component';
import { Subscription } from 'rxjs/Subscription';
import { Router } from '@angular/router';
import { SessionService } from 'app/common/services/session.service';
import { Translator } from "angular-translator";
import { ManageNotificationDetailsGetNotificationDetailsRequest, GetNotificationDetailsProxyService } from 'app/common/services/proxy-services/get-notification-details-proxy.service';
import { DialogModalService } from "app/common/ui-components/dialog-modal/dialog-modal.service";
import { ViewPaymentComponent } from "app/process/modules/cb-app/view-beneficiaries/view-payment/view-payment.component";
import { ViewPaymentService } from "app/process/modules/cb-app/view-beneficiaries/view-payment/add-beneficiary/add-payment.service";
import { TabbedPanelComponent } from 'app/common/ui-components/tabbed-nav/tabbed-panel/tabbed-panel.component';
import { AbsaListedDetailsComponent } from 'app/process/modules/cb-app/view-beneficiaries/view-payment/add-beneficiary/absa-listed-beneficiary/absa-listed-details/absa-listed-details.component';
import { ErrorDetail } from "app/process/modules/cb-app/transfer/transfer-data.model";
import { DialogModalModel } from "app/common/ui-components/dialog-modal/dialog-modal.model";
import {
  ManageLimitsGetUserLimitsResponse,
  ManageLimitsProxyService
} from 'app/common/services/proxy-services/manage-limits-proxy.service';
import {
  ClientRequestData, ClientResponseData
} from 'app/common/services/security-notification/security-notification-data.model';
import { SecurityNotificationsManagerService } from 'app/common/services/security-notification/security-notifications-manager.service';
import { Utils } from 'app/core/utils/utils';
import { DataLossWarningService } from 'app/common/services/data-loss-warning.service';
import { Constants } from 'app/common/constants/constants';
import { RegularBeneficiaryManagementListRegularBeneficiariesProxyService, RegularBeneficiaryManagementFacadeEnquireRegularBeneficiaryDetailsRequest } from '../../../../../../../common/services/proxy-services/regular-beneficiary-management-proxy.service';
import { Request } from '../../../common-view-beneficiaries/history/history.service';
import { PaymentService } from 'app/process/modules/cb-app/view-beneficiaries/view-payment/payment.service';
import { BeneficiaryDetailsVO } from 'app/common/services/proxy-services/regular-beneficiary-management-proxy.service';
import { DetailsComponent } from '../new-beneficiary/details/details.component';
import { BeneficiaryPaymentManagerService } from 'app/common/services/beneficiaries/beneficiary-payment-manager.service';
import { ProgressSpinnerService } from 'app/common/ui-components/progress-spinner/progress-spinner.service';
import { AvsService } from 'app/process/modules/cb-app/view-avs/avs.service';
import { SwitchBeneficiariesService } from 'app/process/modules/cb-app/view-beneficiaries/view-payment/switch-beneficiaries/switch-beneficiaries.service';
import { ScrollUtilService } from 'app/core/utils/scroll-util.service';

export interface RequestInput {
  beneficiaryNumber: string
  uniqueEFTNumber: string
  tieBreaker: string
  cifKey: string
  beneficiaryStatus: string
  instructionType: string
}


@Component({
  selector: 'app-add-payment-beneficiary',
  templateUrl: './add-payment-beneficiary.component.html',
  styleUrls: ['./add-payment-beneficiary.component.scss'],
  providers: [DetailsComponent, AvsService, ProgressSpinnerService]
})
export class AddPaymentBeneficiaryComponent implements OnInit, AfterViewInit {

  futureDatedPaymentLimit: number;
  recurringPaymentLimit: number;
  transferLimitAmount: number;
  @Input() data: any;
  @Input() switchBeneficiaryData:any;
  @Input() addBenContainerRef:ViewContainerRef;
  @Output() childActionEvent = new EventEmitter<any>()
  @ViewChild('progressIndicatorNewBen') progressIndicatorNewBeneficiary: ProgressIndicatorComponent;
  @ViewChild('progressIndicatorAbsalisted', { read: ProgressIndicatorComponent }) progressIndicatorAbsaListed: ProgressIndicatorComponent;
  @Output() onCloseAddBeneficiaryPanel=new EventEmitter<any>();
  @Input() payBenExtraData : {viewContainerRef, childActionEvent};

  @ViewChild('newbenProgress') newbenProgress: ElementRef;
  @ViewChild('absaListedProgress') absaListedProgress: ElementRef;

  pageId: Number;
  @ViewChildren(TabbedPanelComponent) tabbedPanels: QueryList<TabbedPanelComponent>;

  numBenAdded = 0;
  beneficiaryNumber: number;
  activeTabID: number;
  isTrue = false;
  ErrorMessages: any[] = [];
  error: any[] = [];
  absaListedData: any;
  translations: object = {};
  step_deatails: string;
  step_confirm: string;
  step_results: string;
  noAccsFound: boolean;
  fullServiceAccountUrl: any;
  fullServiceApplyUrl: any;
  private dialogMessage: DialogModalModel;
  steps: Step[] = [new Step({ title: '' }),
  new Step({ title: '' }),
  new Step({ title: '' })];
  stepsAbsaListed: Step[] = [new Step({ title: '' }),
  new Step({ title: '' }),
  new Step({ title: '' })];
  extendedBottomBorder=true;
  private clientRequestData: ClientRequestData;
  private clientResponseData: ClientResponseData;
  limits: ManageLimitsGetUserLimitsResponse;
  paymentLimit: any;
  paymentLimitZero: boolean = false;
  canChangeLimits: boolean = false;//TODO: find out when does this change
  errorOccuredType: string;
  activeStep = 1;
  absaListedActiveStep = 1;
  public isPerformingAddBen = false;
  public performAddBenData: any;
  subscription: any;
  changesubscription: any
  previousContextualHelpId: string;
  statusPanel: string
  formData: any
  retrySecurytyFunction: number = 0;
  constructor(private dialogModalService: DialogModalService,
    private viewPaymentComponent: ViewPaymentComponent,
    private viewPaymentService: ViewPaymentService, private translator: Translator,
    private router: Router,
    private scrollUtils: ScrollUtilService,
    private sessionService: SessionService,
    private manageLimits: ManageLimitsProxyService,
    private snm: SecurityNotificationsManagerService,
    public viewContainerRef: ViewContainerRef,
    private utils: Utils,
    private securityNotificationsManagerService: SecurityNotificationsManagerService,
    private dataLossWarningService: DataLossWarningService,
    private paymentService: PaymentService,
    private payNewService: ViewPaymentService,
    private getBeneficiaryManagementListRegularBeneficiariesProxyService: RegularBeneficiaryManagementListRegularBeneficiariesProxyService,
    private detailsComponent: DetailsComponent,
    private beneficiaryPaymentManagerService: BeneficiaryPaymentManagerService,
    private cdr: ChangeDetectorRef,
    public progressSpinnerService: ProgressSpinnerService,
    private SwitchBeneficiariesService : SwitchBeneficiariesService
  ) {

    this.clientRequestData = new ClientRequestData();
    this.dialogMessage = new DialogModalModel();
    this.changesubscription = this.viewPaymentService.changeEmitted$.subscribe(
      childAction => {

        if (childAction.move == null) {
          this.processChildMessage(childAction);
        }
        else {

          this.processChildMessage(childAction.move);
          this.setAbsaListedData(childAction.institution);
        }

      });

    translator.waitForTranslation().then(() => {
      translator.observe([
        'common.label.detail',
        'common.label.confirm',
        'common.label.results',
        'paymentBeneficiaries.addBeneficiaries.tab1Title',
        'paymentBeneficiaries.addBeneficiaries.tab2Title',
        'pay.label.tooltipText',
        'fullservice.dialog.title',
        'fullservice.dialog.info',
        'fullservice.dialog.moreInfo',
        'fullservice.dialog.no',
        'fullservice.dialog.yes',
        'paymentBeneficiaries.label.pageTitle',
        'pay.label.payABeneficiary'
      ]).subscribe((translations) => {
        this.translations['detail'] = translations[0];
        this.translations['confirm'] = translations[1];
        this.translations['results'] = translations[2];

        this.translations['FullService'] = translations[6];
        this.translations['Info'] = translations[7];
        this.translations['MoreInfo'] = translations[8];
        this.translations['No'] = translations[9];
        this.translations['Yes'] = translations[10];
        this.translations['pageTitle'] = translations[11];
        this.translations['paymentTitle'] = translations[12];
        this.tabsData[0].title = translations[3];
        this.tabsData[1].title = translations[4];
        this.tabsData[1].tooltipText = translations[5];

        this.steps[0].title = this.translations['detail'];
        this.steps[1].title = this.translations['confirm'];
        this.steps[2].title = this.translations['results'];

        this.stepsAbsaListed[0].title = this.translations['detail'];
        this.stepsAbsaListed[1].title = this.translations['confirm'];
        this.stepsAbsaListed[2].title = this.translations['results'];

        this.dialogMessage.title = this.translations['FullService'];
        this.dialogMessage.contentText = this.translations['Info'] + '\n' + this.translations['MoreInfo'];
        this.dialogMessage.okButtonText = this.translations['Yes'];
        this.dialogMessage.cancelButtonText = this.translations['No'];
        this.dialogMessage.icon = true;
        this.statusPanel = this.translations['pageTitle'];

      })
    });
    this.fullServiceAccountUrl = this.sessionService.setupFullSeriveURL('linkAccount');
    this.fullServiceApplyUrl = this.sessionService.setupFullSeriveURL('apply');
    this.getUserAccounts();


  }
  request: RegularBeneficiaryManagementFacadeEnquireRegularBeneficiaryDetailsRequest
  getUserAccounts() {
    const BeneficiaryAllowed = this.sessionService.serverClientDataBridge.SERVER_DATA_BRIDGE_PAYMENT_BENEFICIARY_ALLOWED;
    if (BeneficiaryAllowed == 'false') {
      this.viewPaymentService.emitChange('emptyStateNoAccounts')
      return
    } else {
      this.checkPaymentLimits();
    }
  }
  checkPaymentLimits() {
    //Check user limits before adding a new beneficiary
    if (this.activeStep !== 5 || this.absaListedActiveStep !== 5) {
      this.progressSpinnerService.startLoading();
      const limitSubscription = this.manageLimits.getUserLimits().subscribe(
        response => {
          this.progressSpinnerService.stopLoading();
          this.paymentLimit = this.utils.convertCurrencyToNumber(response.paymentLimit);
          this.transferLimitAmount = this.utils.convertCurrencyToNumber(response.interAccountTransferLimit);
          this.recurringPaymentLimit = this.utils.convertCurrencyToNumber(response.recurringPaymentLimit);
          this.futureDatedPaymentLimit = this.utils.convertCurrencyToNumber(response.futureDatedPaymentLimit);

          if (this.transferLimitAmount <= 0 && this.paymentLimit <= 0 && this.recurringPaymentLimit <= 0 && this.futureDatedPaymentLimit <= 0) {
            console.log('meeee')
            this.viewPaymentService.emitChange('payLimitStatus1')


          } else {

            if (this.paymentLimit > 0) {
              this.performSecurityCheck();
              this.viewPaymentService.emitChange('payLimitStatus3')

            } else {
              this.viewPaymentService.emitChange('payLimitStatus2')

            }
          }

          if (limitSubscription !== undefined) {
            limitSubscription.unsubscribe()
          }
        }, error => {
          this.progressSpinnerService.stopLoading();
          if (error.statusCode != "102") {
            this.errorOccuredType = 'fetchingUserLimitsError'
            console.log(this.errorOccuredType);
            this.handleServiceError(error);
          }

        }
      )
    }
  }
  //"interAccountTransferLimit":".00","paymentLimit":".00","futureDatedPaymentLimit":".00","minFutureDatedPaymentLimit":"0","maxFutureDatedPaymentLimit":"9999999999999","recurringPaymentLimit":".00","minRecurringPaymentLimit":"0","maxRecurringPaymentLimit":"9999999999999","interAccountTransferLimitUsed":".00","interAccountTransferLimitAvailable":"0.00","minInterAccountTransferLimit":"0","maxInterAccountTransferLimit":"9999999999999","paymentLimitUsed":".00","paymentLimitAvailable":"0.00","minPaymentLimit":"0","maxPaymentLimit":"9999999999999","cashSendDailyUsed":".00","cashSendMonthlyUsed":".00","sovLimit":".00","sovUsed":".00","sovPaymentLimit":".00","sovPaymentLimitUsed":".00","sovPrepaidLimit":".00","sovPrepaidLimitUsed":".00","sovCashSendLimit":".00","sovCashSendLimitUsed":".00"}
  getUserDetails() {
    this.viewPaymentService.getMyNotificationDetails();
    if (this.activeStep !== 5 || this.absaListedActiveStep !== 5) {
      if (this.subscription != undefined) {
        this.subscription.unsubscribe();
      }
      this.progressSpinnerService.startLoading();
      this.subscription = this.viewPaymentService.noficationDetailsStatusEmitter$.subscribe(response => {
        this.progressSpinnerService.stopLoading();
        //If details are fetched successfull then proceed
        if (!response.isError) {
          if (this.subscription != undefined) {
            this.subscription.unsubscribe();
          }
          //Perform Security check here
          //  this.performSecurityCheck();
        } else
          if (response.isError) {
            if (this.subscription != undefined) {
              this.subscription.unsubscribe();
            }
            if (response.result.statusCode != "102") {
              this.errorOccuredType = 'fetchingUserDetailsError'
              console.log(this.errorOccuredType);
              this.handleServiceError(response.result);
            }

          }
      })
    }
  }



  performSecurityCheck() {
    this.progressSpinnerService.startLoading();
    this.clientRequestData.securityFunctionType = 'addBeneficiary';
    this.clientRequestData.serviceOperation = 'RegularBeneficiaryManagementFacadeAddRegularBeneficiary';
    const securityNotificationSubscription = this.snm.performSecurityNotification(this.clientRequestData, this.viewContainerRef).subscribe(
      (response) => {
        this.progressSpinnerService.stopLoading();
        console.log(response, 'response')
        this.clientResponseData = response.getClientResponseData();

        //Status code zero(0) - When sure check is successful
        if (this.clientResponseData.statusCode === 0) {

          if (securityNotificationSubscription !== undefined) {
            securityNotificationSubscription.unsubscribe();
          }

          this.noAccsFound = false;
          this.paymentLimitZero = false;
          this.activeStep = 1;
          this.absaListedActiveStep = 1;

        } else {
          //When SureCheck rejected close the transactional panel - TODO: deal with the code
          if (securityNotificationSubscription !== undefined) {
            securityNotificationSubscription.unsubscribe();
          }

          this.onCloseAddBeneficiaryPanel.next('closeAddPanel');
          this.viewContainerRef.clear();

        }

      },
      (error) => {
        this.progressSpinnerService.stopLoading();
        console.log('error')
        this.errorOccuredType = 'performSureCheckError';
        let i;
        for (i = 0; i < this.snm.getError().errorList.length; i++) {
          this.ErrorMessages.push({
            'status_reason': this.snm.getError().errorList
          })
        }
        if (securityNotificationSubscription !== undefined) {
          securityNotificationSubscription.unsubscribe();
        }
      });
  }

  ngOnInit() {

    if(this.data){
      if(this.data.institutionName){
        this.tabsData[1].isCurrent = true;
        this.tabsData[0].isCurrent = false;
      }
    }

    this.pageId = 0;
    this.hideTabHeads();
    this.sessionService.setPreviousContextualHelpId(this.sessionService.getPreviousContextualHelpId());
  }
  ngAfterViewInit() {
    if(this.data)
      this.extendedBottomBorder=false;
  }

  onRefreshPage(buttonId) {
    console.log(this.errorOccuredType, '')
    if (this.errorOccuredType === 'fetchingUserAccounts') {
      this.getUserAccounts();
    } else
      if (this.errorOccuredType === 'fetchingUserLimitsError') {
        this.checkPaymentLimits();
      } else
        if (this.errorOccuredType === 'fetchingUserDetailsError') {
          this.progressSpinnerService.startLoading();
        } else
          if (this.errorOccuredType === 'performSureCheckError') {
            this.performSecurityCheck();
          }
  }
  tabsData: Tab[] = [
    new Tab(
      {
        id: 0,
        title: '',
        isCurrent: true,
        isVisible: false,
        dataLossRequired: false
      }
    ),
    new Tab(
      {
        id: 1,
        title: '',
        isCurrent: false,
        isVisible: false,
        headerIcon: 'result-pending',
        tooltipText: '',
        dataLossRequired: false
      }
    ),

  ];

  onTransactionHeaderButton(event) {
    // let formData = this.viewPaymentService.getFormData('normalBeneficiary');
    // let absaFormData = this.viewPaymentService.getFormData('absaListedBeneficiary');
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

  onClose() {
    this.dialogModalService.ConfirmDialogModal()
      .subscribe((res) => {
        if (res) {
          this.onClosePanel();
        } else {
          console.log('No');
        }
      });
  }
  //check if user inserted data befor close panel
  checkFormData(form) {
    for (var key in form) {
      if (form[key].indexOf("*") != -1) {
        return false;
      }
      if (form[key] !== '') {
        switch (key) {
          case 'notifyBeneficiaryRadio':
          case 'notifyMeRadio':
            break
          default: return true;
        }
      }
    }
    return false;
  }
  checkAbsaFormData(form) {
    for (var key in form) {

      if (!(key.indexOf('notifyMe') > -1) && key !== 'saveBeneficiaryRadio' && key !== 'beneficiaryType') {
        if (form[key] !== '' && form[key]) {
          return true;
        }
      }
    }

    return false;
  }


  onClosePanel() {
    this.viewContainerRef.clear()
  this.onCloseAddBeneficiaryPanel.next('closeAddPanel');
  }

  setAbsaListedData(data) {
    this.viewPaymentService.setAbsaListedData(data)
  }

  getAbsaListedData() {
    return this.viewPaymentService.getAbsaListedData();
  }

  onStep1Next() {
    if (this.progressIndicatorNewBeneficiary) {
      this.progressIndicatorNewBeneficiary.setStep(2);
    }
    this.activeStep = 2
  }

  onStep1Cancel() {
    this.onCloseAddBeneficiaryPanel.next('closeAddPanel');
    this.dataLossWarningService.setDirtyFlag(false);
    this.activeStep = 0;

    // this.progressIndicatorNewBeneficiary.setStep(0)
  }

  fromBenExistCancel() {
  this.onCloseAddBeneficiaryPanel.next('closeAddPanel');
  }
  onStep2Next() {

    this.viewPaymentService.resetError();
    this.progressSpinnerService.startLoading();
    if (this.subscription !== undefined) {
      this.subscription.unsubscribe();
    }
    this.subscription = this.viewPaymentService.addRegularBeneficiary('normalBeneficiary').subscribe(
      response => {

        if (this.subscription != undefined) {
          this.subscription.unsubscribe();
        }
        console.log(this.viewPaymentService.getError(), 'Error')
        this.progressSpinnerService.stopLoading();
        this.activeStep = 3
        this.progressIndicatorNewBeneficiary.setStep(3);
        this.beneficiaryNumber = response.beneficiaryNumber;
        this.getBendetails(response)
        // need to invalidate ben cached list
        this.beneficiaryPaymentManagerService.invalidateData();

        // Track number of beneficiaries added successfully
        this.numBenAdded++;
        this.retrySecurytyFunction = 0;
      },
      error => {
        if (this.subscription != undefined) {
          this.subscription.unsubscribe();
        }
        if (error.header['statuscode'] === '102' && this.retrySecurytyFunction < 3) {
          this.callSecurityNotification('normalBeneficiary','addBeneficiary', 'RegularBeneficiaryManagementFacadeAddRegularBeneficiary');
        }
        else {
          this.progressSpinnerService.stopLoading();
          this.viewPaymentService.setError(error.header)
          console.log(this.viewPaymentService.getError(), 'Error')
          this.activeStep = 3
          this.progressIndicatorNewBeneficiary.setStep(3);
        }
        // need to invalidate ben cached list
        this.beneficiaryPaymentManagerService.invalidateData();
      });
  }


  getBendetails(response) {

    const request: RequestInput = {
      'beneficiaryNumber': response.beneficiaryNumber,
      'uniqueEFTNumber': response.uniqueEFTNumber,
      'tieBreaker': response.tieBreaker,
      'cifKey': response.cifKey,
      'beneficiaryStatus': 'CURRENT',
      'instructionType': response.instructionType,
    };

    const requestInput: Request = {
      beneficiaryEnquiry: request
    };
    if (this.subscription !== undefined) {
      this.subscription.unsubscribe();
    }
    this.subscription = this.paymentService.getPaymentDetails(requestInput).subscribe(BenVO => {
      console.log('ggg', BenVO)
      if (this.subscription != undefined) {
        this.subscription.unsubscribe();
      }
      this.viewPaymentService.setBenVODetails(BenVO);
    })
  }
  onStep2Back() {
    this.activeStep = 1
    this.progressIndicatorNewBeneficiary.setStep(1);
  }
  onStep3Done() {
    this.viewContainerRef.clear();
    this.onCloseAddBeneficiaryPanel.next('closeAddPanel');
    this.activeStep = 0;
    //this.progressIndicatorNewBeneficiary.setStep(0)
    //this.viewPaymentComponent.getBeneficiariesList(); //to load the tiles again

  }
  onStep3AddOnother() {
    this.activeStep = 1
    this.retrySecurytyFunction = 0;
    this.progressIndicatorNewBeneficiary.setStep(1);
    this.detailsComponent.createSimpleForm();
  }

  hideTabHeads() {
 setTimeout(()=>{
  this.tabsData[0].isVisible = false;
  this.tabsData[1].isVisible = false;
 });

  }

  showTabHeads() {
    if(this.data == undefined){
      setTimeout(()=>{
        this.tabsData[0].isVisible = true;
        this.tabsData[1].isVisible = true;
      })
    }
  }
  goToAbsalist1() {

    this.activeTabID = 1;
    this.tabsData[0].isCurrent = false;
    this.tabsData[1].isCurrent = true;

    this.tabbedPanels.forEach(panel => {

      if (panel.panelId == 1)
        panel.isCurrent = true;
      else
        panel.isCurrent = false;

    });


  }
  onAbsaListedStep1Next() {
    console.log(':::::::::::::::Listed', this.progressIndicatorAbsaListed)
    this.progressIndicatorAbsaListed.setStep(2);
    this.absaListedActiveStep = 2;
  }

  onAbsaListedStep2Next() {

    this.progressSpinnerService.startLoading();
    if (this.subscription !== undefined) {
      this.subscription.unsubscribe();
    }
      this.subscription = this.viewPaymentService.addRegularBeneficiary('absaListedBeneficiary').subscribe(
        response => {
          if (this.subscription != undefined) {
            this.subscription.unsubscribe();
          }
          this.progressSpinnerService.stopLoading();
          this.progressIndicatorAbsaListed.setStep(3);
          this.absaListedActiveStep = 3;
          this.beneficiaryNumber = response.beneficiaryNumber;
          this.viewPaymentService.resetError();
          this.getBendetails(response);
          // need to invalidate ben cached list
          this.beneficiaryPaymentManagerService.invalidateData();

          // Track number of beneficiaries added successfully
          this.numBenAdded++;
        },
        error => {

          if (this.subscription != undefined) {
            this.subscription.unsubscribe();
          }

          if (error.header['statuscode'] === '102') {
            this.callSecurityNotification('absaListed','addBeneficiary', 'RegularBeneficiaryManagementFacadeAddRegularBeneficiary');
          }else{
            this.progressSpinnerService.stopLoading();
          this.viewPaymentService.setError(error.header)
          this.progressIndicatorAbsaListed.setStep(3);//51420133781
          this.absaListedActiveStep = 3;
          // need to invalidate ben cached list
          this.beneficiaryPaymentManagerService.invalidateData();
          }
        });

  }

  onAbsaListedStep1Cancel() {
    this.viewContainerRef.clear();
    this.onCloseAddBeneficiaryPanel.next('closeAddPanel');
    this.activeStep = 0;
    this.progressIndicatorAbsaListed.setStep(0)
  }

  onAbsaListedStep2Back() {
    this.progressIndicatorAbsaListed.setStep(1);
    this.absaListedActiveStep = 1;
  }
  onAbsaListedStep3Done() {
    this.onCloseAddBeneficiaryPanel.next('closeAddPanel');
    this.activeStep = 0;
  }
  onAbsaListedStep3AddOnother() {
    this.absaListedActiveStep = 1
    this.progressIndicatorAbsaListed.setStep(1);
  }

  processChildMessage(message) {

    switch (message) {
      case 'step1Next': {
        this.onStep1Next()
        break;
      }
      case 'step1Cancel': {
        this.onStep1Cancel()
        break;
      }
      case 'onStep2Next': {
        this.onStep2Next()
        break;
      }
      case 'step2Back': {
        this.onStep2Back()
        break;
      }
      case 'onStep3Done': {
        this.onStep3Done()
        break;
      }
      case 'onStep3AddOnother': {
        this.onStep3AddOnother()
        break;
      }
      case 'hideTabHeads': {
        this.hideTabHeads()
        break;
      }
      case 'movetoAbasalist2': {
        this.goToAbsalist1()
        break;
      }
      case 'AbsaListedStep1Next': {
        this.onAbsaListedStep1Next();
        break;
      }
      case 'AbsaListedStep2Next': {
        this.onAbsaListedStep2Next();
        break;
      } case 'absaListedStep1Cancel': {
        this.onStep1Cancel()
        break;
      }
      case 'AbsaListedStep2Back': {
        this.onAbsaListedStep2Back()
        break;
      }
      case 'AbsaListedStep3Done': {
        this.onAbsaListedStep3Done()
        break;
      }
      case 'AbsaListedStep3AddOnother': {
        this.onAbsaListedStep3AddOnother()
        break;
      }
      case 'showTabHeads': {
        this.showTabHeads()
        break;
      }
      case 'benExistCancel': {
        this.fromBenExistCancel()
        break;
      }
      case 'emptyStateNoAccounts': {
        this.activeStep = 5;
        this.absaListedActiveStep = 5;
        this.noAccsFound = true;
        break;
      }
      case 'payLimitStatus1': {
        this.canChangeLimits = false;
        this.paymentLimitZero = true;
        this.activeStep = 5;
        this.absaListedActiveStep = 5;
        break;
      }
      case 'payLimitStatus2': {
        this.canChangeLimits = true;
        this.paymentLimitZero = true;
        this.activeStep = 5;
        this.absaListedActiveStep = 5;
        break;
      }
      case 'payLimitStatus3': {
        this.paymentLimitZero = false;
        break;
      }
      case 'payThisBeneficiary': {
        this.payThisBeneficiary()
        break;
      }
      case 'scrollAbsaListed':{
        this.scrollToTop();
        break;
      }
      case 'scrollNewBen':{
        this.scrollToTop();
        break;
      }

      default:
        console.log('message not handled ' + message)
        break;
    }
  }

  handleServiceError(error) {

    this.ErrorMessages = [];
    if (error) {
      //Prepare and Build error messages for service-error component
      error.header.resultMessages.forEach((message) => {
        this.ErrorMessages.push({
          'status_reason': message.responseMessage
        })
      });

    }

    this.activeStep = 4;
    this.absaListedActiveStep = 4;
    this.noAccsFound = false;
    this.paymentLimitZero = false;
    this.progressSpinnerService.stopLoading();

  }

  onTabChange(tab: Tab) {
    switch (tab.id) {
      case 0:
        this.activeTabID = tab.id
        // console.log('onTabChange context tab.id >> ', tab.id);
        this.sessionService.setContextualHelpId(Constants.CONTEXTUAL_HELP_ID_ADDPAYMENTBENEFICIARY);
        break;
      case 1:
        this.activeTabID = tab.id
        // console.log('onTabChange context tab.id >> ', tab.id);
        this.sessionService.setContextualHelpId(Constants.CONTEXTUAL_HELP_ID_ADDPAYMENTBENEFICIARYALB);
        break;
    }
  }

  processEmptyStateAction(eventObj) {
    if (eventObj.buttonId === 'linkAccount') {

    } else
      if (eventObj.buttonId === 'newAccount') {

      } else
        if (eventObj.buttonId === 'changeLimit') {
          this.router.navigate(['/connected-banking/settings/1'], { skipLocationChange: true });
        }
  }
  //TODO----use this to pay the beneficiary after adding
  payThisBeneficiary() {
    const benDetails = this.viewPaymentService.getBenVODetails()

    // Setup data that needs to be passed into the Add payment component
    this.performAddBenData = {
      'beneficiary': benDetails,
      'originatorId': '3',
      'addBenExtraData' : this.payBenExtraData
    }

    // Hide the empty state and other items
    this.noAccsFound = false;
    this.paymentLimitZero = false;

    // Initialize the Payments component
    this.isPerformingAddBen = true;
    this.activeStep=6;
    if(!this.data){
      this.onCloseAddBeneficiaryPanel.next('payThisBeneficiary');
    }
    console.log(benDetails, 'payThisBeneficiary');
  }

  callSecurityNotification(functionType,securityFunctionType: string, serviceOperation) {
   if(functionType=="normalBeneficiary"){
    const formData = this.viewPaymentService.getFormData('normalBeneficiary');
    this.clientRequestData.beneficiaryAccountNumber = formData.accountNumber;
   }

    this.clientRequestData.serviceOperation = serviceOperation;
    this.clientRequestData.securityFunctionType = securityFunctionType;
    if (this.subscription != undefined) {

      this.subscription.unsubscribe();
    }
    this.subscription = this.securityNotificationsManagerService.performSecurityNotification(this.clientRequestData, this.viewContainerRef).subscribe(
      (response) => {

        if (this.subscription != undefined) {
          this.subscription.unsubscribe();
        }
        this.progressSpinnerService.stopLoading();
        this.clientResponseData = response.getClientResponseData();
        if (this.clientResponseData.statusCode === 0) {
          if(functionType=="normalBeneficiary"){
            this.retrySecurytyFunction++;
            this.onStep2Next();
          }else{
            this.onAbsaListedStep2Next();
          }

        } else {
          this.handleAddBenSecurityNotificationError(this.clientResponseData)
          this.activeStep = 3
          this.progressIndicatorNewBeneficiary.setStep(3);
        }
      },
      (error) => {
        if (this.subscription != undefined) {
          this.subscription.unsubscribe();
        }
        this.progressSpinnerService.stopLoading();
        this.handleAddBenSecurityNotificationError(error);
        this.activeStep = 3
        this.progressIndicatorNewBeneficiary.setStep(3);
      })
  }

  handleAddBenSecurityNotificationError(header: any) {
    switch (header.statusCode) {
      case 1:
        this.viewPaymentService.setAddBenErrorFromSecurityNotification(header, 'Application Error');
        break;
      case 2:
        this.viewPaymentService.setAddBenErrorFromSecurityNotification({ resultMessage: 'Sim swap occurred' }, 'Application Error');
        break;
      case 3:
        this.viewPaymentService.setAddBenErrorFromSecurityNotification({ resultMessage: 'Transaction cancelled' }, 'Application Error');
        break;
      case 4:
        this.viewPaymentService.setAddBenErrorFromSecurityNotification({ resultMessage: 'Branch hold exists on this account please visit nearest branch' }, 'Application Error');
        break;
    }
  }

  // scrollToProgressIndicator(childMessage){
  //   if(childMessage=='scrollAbsaListed'){
  //     if(this.absaListedProgress) this.absaListedProgress.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  //   }
  //   if(childMessage=='scrollNewBen'){
  //     if(this.newbenProgress) this.newbenProgress.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  //   }
  //   return false;
  // }
  scrollToTop(){
    this.scrollUtils.scrollTo();
  }
  ngOnDestroy() {
    //clear form data
    this.sessionService.setContextualHelpId(this.sessionService.getPreviousContextualHelpId());
    this.viewPaymentService.clearFormData('absaListedBeneficiary');
    this.viewPaymentService.clearFormData('normalBeneficiary');
    this.dataLossWarningService.setDirtyFlag(false);
    if (this.subscription !== undefined) {
      this.subscription.unsubscribe();
    }
    this.changesubscription.unsubscribe();
    this.isPerformingAddBen = false;
  }
}
