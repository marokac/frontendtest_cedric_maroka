import { ViewPaymentComponent } from 'app/process/modules/cb-app/view-beneficiaries/view-payment/view-payment.component';
import { Component, OnInit, Input, Output, EventEmitter, AfterViewInit, ViewChild, ViewContainerRef,
  ViewChildren, QueryList, HostListener } from '@angular/core';
import { ProgressIndicatorComponent } from 'app/common/ui-components/progress-indicator/progress-indicator.component';
import { Step } from 'app/common/ui-components/progress-indicator/step.model';
import { ManageLimitsGetUserLimitsResponse } from 'app/common/services/proxy-services/manage-limits-proxy.service';
import { FormDropdownOption } from 'app/common/ui-components/cb-form/form-dropdown/form-dropdown-option.model';
import { Observable, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormControl } from '@angular/forms';
import { Account } from 'app/common/services/proxy-services/regular-beneficiary-payment-get-source-accounts-proxy.service';
import { TranslatePipe, Translator } from 'angular-translator';
import { FormData, SelectedOption } from 'app/process/modules/cb-app/view-beneficiaries/view-payment/add-beneficiary/add-payment.model';
import { RegularBeneficiaryManagementListRegularBeneficiariesProxyService } from 'app/common/services/proxy-services/regular-beneficiary-management-proxy.service';
import { CommonValidators } from 'app/common/validators/validators';
import { SessionService } from 'app/common/services/session.service';
import { GetNotificationDetailsProxyService, AlrtVO, ManageNotificationDetailsGetNotificationDetailsRequest } from 'app/common/services/proxy-services/get-notification-details-proxy.service';
import { DatePipe } from '@angular/common';
import { DialogModalService } from 'app/common/ui-components/dialog-modal/dialog-modal.service';
import { FormAutoCompleteComponent } from 'app/common/ui-components/cb-form/form-autocomplete/form-autocomplete.component';
import {
  ExternalBankDetailsProxyService,
  ListBankNamesRequest,
  ListBankNamesResponse,
  BankNames,
  ListBranchCodesForBankRequest,
  ListBranchCodesForBankResponse
} from 'app/common/services/proxy-services/external-bank-details-proxy.service';
import { ViewPaymentService, BeneficiariesFromBranchAndAccountRequest } from "app/process/modules/cb-app/view-beneficiaries/view-payment/add-beneficiary/add-payment.service";
import { ViewPaymentAbsaListedDialogComponent } from "app/process/modules/cb-app/view-beneficiaries/view-payment/add-beneficiary/absa-listed-dialog/absa-listed-dialog.component";
import { RegularBeneficiaryManagementGetBeneficiariesForBranchAndAccountResponse } from "app/common/services/proxy-services/regular-beneficiary-management-proxy.service";
import { FormRadioComponent } from 'app/common/ui-components/cb-form/form-radio/form-radio.component';
import { FormInputComponent } from 'app/common/ui-components/cb-form/form-input/form-input.component';
import { RequestHeader } from "app/process/modules/cb-app/view-pay/view-pay.model";
import { ViewPayMentBeneficiariesService } from "app/process/modules/cb-app/view-beneficiaries/view-payment/view-payment-beneficiaries.service";
import { BenExistDialogComponent } from "app/process/modules/cb-app/view-beneficiaries/view-payment/add-beneficiary/ben-exist-dialog/ben-exist-dialog.component";
import { LoaderService } from "app/common/ui-components/custom-loader-spinner/loader.service";
import { DataLossWarningService } from 'app/common/services/data-loss-warning.service';
import { FormRadioGroupComponent } from 'app/common/ui-components/cb-form/form-radio-group/radio-group.component';
import { Constants } from 'app/common/constants/constants';
import { Utils } from 'app/core/utils/utils';
import { AvsModalComponent } from '../../../../../view-avs/avs-modal/avs-modal.component';
import { Enums } from 'app/common/enums/enums';
import { AvsService } from 'app/process/modules/cb-app/view-avs/avs.service';
import { FormDropdown } from '../../../../../../../../common/ui-components/cb-form/form-dropdown/form-dropdown.model';
import { transition } from '@angular/animations';
import { ProgressSpinnerService } from 'app/common/ui-components/progress-spinner/progress-spinner.service';
import { ScrollUtilService } from 'app/core/utils/scroll-util.service';

export interface SelectOptions {
  value: string
  label: string
}

class BankNamesRequest implements ListBankNamesRequest {
  searchString: string;
  constructor(searchString: string) {
    this.searchString = searchString;
  }
}

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

@Component({
  selector: 'new-beneficiary-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss'],
  providers: [ProgressSpinnerService]
})
export class DetailsComponent implements OnInit, AfterViewInit {

  @Input() data: any;
  @Input() switchData: any;
  @ViewChild(ProgressIndicatorComponent) progressIndicator: ProgressIndicatorComponent;
  @ViewChildren(FormRadioComponent) formRadioButtons: QueryList<FormRadioComponent>;
  @ViewChildren(FormDropdown) formDropdown: QueryList<FormDropdown>;
  @ViewChildren(FormRadioGroupComponent) formRadioGroupsWrappers: QueryList<FormRadioGroupComponent>;
  @Output() childActionEvent = new EventEmitter<any>()


  steps: Step[] = [new Step({ title: 'Details' }),
  new Step({ title: 'Confirm' }),
  new Step({ title: 'Result' })]
  translations: object = {};
  showTootip: any = 0;
  radio_focus: any;
  branchCodeData: any;
  bankSubscriptionIndex: number;
  openField: any
  currentIndex: number = -1;
  notyfError: boolean;
  useSwicthData:boolean=false;
  setupForm: FormGroup;
  alrtVO: AlrtVO;
  nofiticationDetails$: Observable<AlrtVO>;
  selectedAccount: Account;
  accountTypeOptions: any[];
  selectedAccoutType: SelectedOption;
  validationMessages: object = {};
  institutionSearchValue: string;
  allSubcriptions: Subscription[] = [];
  requestAttributes = new RequestHeader({});
  defauldRecipient: any
  public availableBankOptions: BankNames[];
  public bankOptions: SelectOptions[] = [];
  public branchOptions: SelectOptions[] = [];
  private utils: Utils;
  emptyValue: boolean;
  holdBranchcode: any

 //beneficiary exist dilog
  goConfirm: boolean = false;
  continue: number = null;
  checkBenBeforeSubmit = false;
  accountVerification = false;

  //AVS
  public isAVSValidBank = false;
  public avsBankList = this.sessionService.globalConfig.GLOBAL_EXPRESS_AVS_ALLOWED_BANKNAME_LIST;
  public avsEnabled: string = this.sessionService.globalConfig.GLOBAL_EXPRESS_AVS_ENABLED.toString();

  previousContextualHelpId: string;

  formStatus = {
    formErrors: {
      'fullName': '',
      'bank': '',
      'branchCode': '',
      'accountNumber': '',
      'accountType': '',
      'myReference': '',
      'beneficiaryReference': '',
      'notifyBeneficiaryRadio': '',
      'saveBeneficiaryRadio': '',
      'notifyMeRadio': '',
      'notifyMeSMSGroup': '',
      'notifyMeSMS': '',
      'notifyMeEmailGroup': '',
      'notifyMeEmail': '',
      'notifyMeFaxGroup': '',
      'notifyBeneficiarySMS': '',
      'notifyBeneficiaryEmail': '',
      'notifyBeneficiaryEmailRecipientName': '',
      'notifyBeneficiaryFaxCode': '',
      'notifyBeneficiaryFaxNumber': '',
      'notifyBeneficiaryFaxRecipientName': '',
      'paymentTime': '',
    },
    submitClicked: true
  };


  constructor(  private formBuilder: FormBuilder,
                private payNewService: ViewPaymentService,
                private scrollUtils: ScrollUtilService,
                private translator: Translator,
                private getNotificationProxyService: GetNotificationDetailsProxyService,
                private externalBankDetailsProxyService: ExternalBankDetailsProxyService,
                public viewContainerRef: ViewContainerRef,
                private dialogModalService: DialogModalService,
                private loaderService: LoaderService,
                private dataLossWarningService: DataLossWarningService,
                private sessionService: SessionService,
                private enums: Enums,
                private avsService: AvsService,
                public progressSpinnerService: ProgressSpinnerService,)
                 {
                    this.utils = new Utils();
                   //beneficiarys request haders
                    this.requestAttributes.instructionType = 'VP';
                    this.requestAttributes.beneficiaryStatusGroup = 'ACTIVE';
                    this.requestAttributes.detailsRequired = false;
                    this.requestAttributes.sortValues = { sortValueList: [{ sortFieldName: 'beneficiaryNumber', sortDirection: 'ASC' }] };

                    //listening to close button on Beneficiary already exist dilog
                    this.payNewService.closeDilogEmitter$.subscribe(dilogData => {
                          if (dilogData.massage == "continue") {
                                this.continue = dilogData.data.beneficiaryNumber;
                               }
                    })

                    //branch code data
                    this.branchCodeData = {
                          name: 'branchCode',
                          label: 'Branch',
                          placeholder: 'Capture and select the Branch name or Branch code',
                          options: this.branchOptions,
                          disabled: true,
                          openOnLoad: true,
                    }

                    //listening to change on Beneficiary already exist dilog
                    this.payNewService.changeEmitted$.subscribe(
                               childAction => {
                                if (childAction === 'benExistCancel') {
                                this.fromBenExistCancel();
                                } else if (childAction === 'continue2' || childAction === 'continue1') {
                                this.payNewService.setWarning(true)
                                }
                                else if (childAction == 'modalClosed') {
                                    this.payNewService.setCheckBen(true);
                                }

                    });
                  }





// clear container when cancel clicked from beneficiary Exist dilog
  fromBenExistCancel() {
    this.viewContainerRef.clear();
  }

  ngOnInit() {
    //initials values
    window.onscroll = null;
    this.radio_focus = 0;
    this.emptyValue = false;
    this.notyfError = false;

    //works when change to absalisted
    this.payNewService.setIsFromNormal(true);

    this.previousContextualHelpId = this.sessionService.getContextualHelpId();
    //this.sessionService.setContextualHelpId(Constants.CONTEXTUAL_HELP_ID_ADDPAYMENTBENEFICIARY);
    // Get form data
    let formData = this.payNewService.getFormData('normalBeneficiary');
    //create form
    this.createSimpleForm();

    //translation
    this.doTranslations();
    //setTimeout(()=>{this.payNewService.emitChange('showNormalTabHeads')},0)

    //get accaunt type obtions
    this.accountTypeOptions = this.enums.getTranslatedAccountTypes();

    //initialise account type selected values
    this.selectedAccount = {
      accountName: '',
      accountNameAndNumber: '',
      accountNumber: '',
      accountType: '',
      availableBalance: '0.00',
      balance: ''
    }

    // Works for switch beneficiaries
    if(this.switchData !== undefined){
      this.payNewService.setIsSwitch(true);
      //patche values to the form
      this.setupForm.patchValue(this.switchData);
      ///update selectedAccoutType
      this.selectedAccoutType = this.payNewService.findAccountType(this.switchData.accountType)
       ///update bank options
      this.bankOptions=[{ value: this.switchData.bank, label: this.switchData.bank }];
      this.payNewService.setBankOptions(this.bankOptions);
    }
     // works if user is from confirm step or absalisted tab
    if (formData.notifyMeSMS !== '') this.setupForm.patchValue(formData);

    // Execute when you not from confirm step or the form is empty
    let absaListedFormData = this.payNewService.getFormData('absaListedBeneficiary');
    if ((formData.fullName === '' || !formData.fullName) && !this.setupForm.dirty) {

      if (absaListedFormData.notifyMeRadio === '' || !absaListedFormData.notifyMeRadio) {

        //initialize own NOP details with the data from user profile
        //If there are no value entered on normal beneficiary form and you are not from confirm step
        this.initializeNotificationDetails(formData);

        this.payNewService.setIsFromAbsalisted(false)

      } else {
        this.payNewService.setIsFromAbsalisted(false)
        //populate form with absalisted data
        this.initialiseSherdData(absaListedFormData)

      }

    }
    else if (this.payNewService.getIsFromAbsalisted()) {
      this.payNewService.setIsFromAbsalisted(false)
       //populate form with absalisted data
      this.initialiseSherdData(absaListedFormData)

    }

    //populate bank options
    if (formData['bank'] !== '') {
      this.bankOptions = this.payNewService.getBankOptions();
      this.setupForm.controls['bank'].setValue(formData['bank']);

     //remove validators on account type if bank is absa
      if (formData['bank'].toLowerCase().indexOf('absa') > -1) {
        this.setupForm.get('accountType').clearValidators();
        this.setupForm.get('accountType').updateValueAndValidity();
      }

    }
    //populate branchcode options
    if (formData['branchCode'] !== '') {
      this.holdBranchcode = formData['branchCodeLabel'] + '|' + formData['branchCode'];
      this.branchCodeData.options = [{ value: formData['branchCode'], label: formData['branchCodeLabel'] }];
      this.setupForm.controls['branchCode'].setValue(formData['branchCode']);
      this.setupForm.controls['branchCodeLabel'].setValue(formData['branchCodeLabel']);
    }
  // populate accountType
    if (formData.accountType !== '' && formData.accountType) {
      this.selectedAccoutType = this.payNewService.findAccountType(formData.accountType)
    }

    //Dynamically add required validator to Account Type control
    this.allSubcriptions.push(this.setupForm.get('bank').valueChanges.subscribe(bankName => {
      // if ('' + bankName.toLowerCase() !== 'absa') {
      //   this.setupForm.get('accountType').setValidators([Validators.required]);
      //   this.setupForm.get('accountType').updateValueAndValidity();
      // } else {
      //   this.setupForm.get('accountType').clearValidators();
      //   this.setupForm.get('accountType').updateValueAndValidity();
      // }

      if (this.bankOptions.length > 0) {
        //Enable branch code field when bank field is filled
        if (this.bankOptions.find(bankOption => bankOption.label === bankName)) {
          //this.branchCodeData.disabled = false;
        }
        if (bankName.trim() == '') {
          this.setupForm.get('branchCode').setValue('')
          this.setupForm.get('branchCodeLabel').setValue('')
        }
      }
    }))
  }
// onInit end here  <<END

  ngAfterContentInit() {
    //Shows the tab headers
    this.payNewService.emitChange('showTabHeads');
  }


  ngAfterViewInit() {
    //scroll window to top
    this.scrollUtils.scrollTo({setTimeoutValue: 0});

    //setup radion options
    const formData = this.payNewService.getFormData('normalBeneficiary');
    if (formData.notifyBeneficiaryRadio !== '' && formData.notifyBeneficiaryRadio) {
      if (formData.notifyBeneficiaryRadio === 'N') {
        this.removenotifyBenRadio('N');
      }
    }

    if (formData.fullName !== '' && formData.fullName)
      this.setupRadioGroups(formData);

  }

//On Value changes
  onValueChanged(data?: any) {
    if (!this.setupForm) { return; }
    const form = this.setupForm

//update form data on value changes
    this.payNewService.setFormData(form.value, 'normalBeneficiary');
//set defauld receipeant
    if (data) this.defauldRecipient = this.setupForm.get('fullName').value;

//handle data loss warning
    for (const key in this.setupForm.controls) {
      let filledControlFound = false;
      if (!(key.indexOf('notifyMe') > -1) && key !== 'notifyBeneficiaryRadio') {
        //this.setupForm.controls[key].markAsDirty()
        if (this.setupForm.dirty && this.setupForm.get(key).value !== '' && this.setupForm.get(key).value) {
          this.dataLossWarningService.setDirtyFlag(true);
          filledControlFound = true;
        } else {
          if (!this.dataLossWarningService.isDirtyFlag)
            this.dataLossWarningService.setDirtyFlag(false);
        }
      }

      if (filledControlFound) break;
    }

//Show AVS link
    const accountNumberValue = this.setupForm.controls['accountNumber'].value;
    const bankName = this.setupForm.controls['bank'].value;
    this.accountVerification = false;
    this.isAVSValidBank = false;

    if (this.avsEnabled === 'true'
      && !this.utils.isNullOrEmpty(accountNumberValue)
      && accountNumberValue.length < 16) {
      if (this.setupForm.controls['bank'].valid && !this.utils.isNullOrEmpty(this.setupForm.controls['bank'].value)) {
        this.isAVSValidBank = this.utils.validateAllowedBankList(bankName, this.avsBankList);
        if (this.isAVSValidBank) {
          if ((this.setupForm.controls['fullName'].valid && !this.utils.isNullOrEmpty(this.setupForm.controls['bank'].value))
            && (this.setupForm.controls['branchCode'].valid && !this.utils.isNullOrEmpty(this.setupForm.controls['branchCode'].value))
            && (this.setupForm.controls['accountNumber'].valid && !this.utils.isNullOrEmpty(this.setupForm.controls['accountNumber'].value))) {
            if (this.setupForm.controls['branchCode'].value === Constants.SESSION_ABSA_BRANCH_CODE) {
              this.accountVerification = true;
            } else {
              if (this.setupForm.controls['accountType'].valid && !this.utils.isNullOrEmpty(this.setupForm.controls['accountType'].value)) {
                this.accountVerification = true;
              }
            }
          }
        }
      }
    }
  }



  clearBranchCode(){
    //clear validations
    this.setupForm.get('branchCode').markAsPristine()
    this.setupForm.get('branchCode').updateValueAndValidity()
    //clear options
    this.branchCodeData.options = [{ value: '', label: '' }];
    //clear the field
    this.setupForm.controls['branchCode'].setValue('');
    this.setupForm.controls['branchCodeLabel'].setValue('');
  }



//update bank options with current selected option when user tab in the bank name field
  updateBankOptions(bankControl:AbstractControl){
    if (bankControl.value.toLowerCase().indexOf('absa') > -1){
      this.bankOptions=[{ value: 'Absa', label: 'ABSA BANK' }];
    }else{
      const newBankOptions = this.bankOptions.filter(bankOption => bankOption.label === bankControl.value);
      this.bankOptions=newBankOptions;
    }

    console.log(this.bankOptions,'brannnn');

    return false;
  }



  //update branch options with current selected option when user tab in the branch code field
  updateBranchOptions(branchValue){
    const newBrancOptions=this.branchCodeData.options.filter(
    branchOption=>branchOption.value===branchValue)
    this.branchCodeData.options=newBrancOptions;
    return false;
  }

  onBrancCodeChange(evt){
  //update branch options with current selected option when user tab in the branch code field
    this.updateBranchOptions(evt.selectedFormControl.value);
  }


  //update bank options with current selected option when user tab in the bank name field
  onBankNameChange(evt) {
    this.clearBranchCode()
    this.toggleBranchName(evt.selectedFormControl)
    this.updateBankOptions(evt.selectedFormControl);
  }

 //Update branch options when bank is selected
  toggleBranchName(bankControl: AbstractControl) {

//If is switch beneficiary
    if(this.switchData !== undefined && this.payNewService.getisSwitch()){
      this.payNewService.setIsSwitch(false)
      //update branch code data
      this.branchCodeData.options=[{ value: this.switchData.branchCode, label: this.switchData.branchCodeLabel }];
      ///set branch code value
      this.setupForm.controls['branchCode'].setValue(this.switchData.branchCode);
      this.setupForm.controls['branchCodeLabel'].setValue(this.switchData.branchCodeLabel);
      //enable the branch code field
     if (bankControl.value.toLowerCase().indexOf('absa') <= -1){
      this.branchCodeData.disabled = false;
     }

    }
    //set defauld branchcode if bank is absa
    else if (bankControl.value.toLowerCase().indexOf('absa') > -1) {
      this.branchCodeData.options = [{ value: '632005', label: 'Absa - 632005' }];
      this.setupForm.controls['branchCode'].setValue('632005');
      this.setupForm.controls['branchCodeLabel'].setValue('Absa - 632005');
      this.branchCodeData.disabled = true;
      //Remove validators from account type
      this.setupForm.controls['accountType'].reset(this.setupForm.controls['accountType'].value)
      this.setupForm.controls['accountType'].setValidators([]);
      this.setupForm.controls['accountType'].updateValueAndValidity();

      setTimeout(() => {
        document.dispatchEvent(new Event('click'));
      }, 30);

    }
    //if bank field is empty clear branch code and disable the field
    else if (bankControl.value.toLowerCase() === '') {
      //set validators on the accountType
      this.setupForm.get('accountType').setValidators([Validators.required]);
      this.setupForm.controls['accountType'].updateValueAndValidity();
      this.setupForm.get('accountType').markAsPristine();

      this.setupForm.controls['branchCode'].setValue('');
      this.setupForm.controls['branchCodeLabel'].setValue('');
      this.branchCodeData.disabled = true;
    } else {
      //set validators on the accountType
       this.setupForm.get('accountType').setValidators([Validators.required]);
       this.setupForm.get('accountType').markAsPristine();
       this.setupForm.controls['accountType'].updateValueAndValidity();

       //get branch codes from the server
      this.checkForSingleBranchName();
    }
  }

  //fetch branch codes
  checkForSingleBranchName() {
    this.fetchEmptySearchStringBranchCodes();
  }

//fetch branch codes from the server
  private fetchEmptySearchStringBranchCodes(): void {
    const request = new BranchCodesRequest(this.setupForm.value.bank, '');
    this.externalBankDetailsProxyService.getBranchCodes(request).subscribe(
      response => {
        if (response.branchCodes.length === 1) {
          this.buildSingleBranchCode(response);
        } else {
          this.buildEmptyBranchCode();
        }
      },
      error => console.log('Error fetching branch codes')
    )
  }

  //Prepare branch code options and update the branchcode field
  buildEmptyBranchCode(): void {
    this.branchCodeData.disabled = false;
    setTimeout(() => {
      document.dispatchEvent(new Event('click'));
      setTimeout(() => {
        if (this.holdBranchcode !== '' && this.payNewService.getBranchcodeFromNext()) {
          //Setup Branch code when coming from confirm
          this.branchCodeData.options = [{ value: this.holdBranchcode.split('|')[1], label: this.holdBranchcode.split('|')[0] }];
          this.setupForm.controls['branchCode'].setValue(this.holdBranchcode.split('|')[1]);
          this.setupForm.controls['branchCodeLabel'].setValue(this.holdBranchcode.split('|')[0]);
          //clear holdBranchCode value
          this.holdBranchcode = '',
            this.payNewService.setBranchcodeFromNext(false);
        }
        document.dispatchEvent(new Event('click'));

      }, 0);
    }, 0);
  }

  //Prepare branch code options and update the branchcode field if the bank selected has a single branchcode
  buildSingleBranchCode(response: ListBranchCodesForBankResponse): void {

    this.branchCodeData.options = response.branchCodes.map(branchCode => {
      return { value: branchCode.bankCode, label: branchCode.branchName }
    });
    this.branchCodeData.disabled = false;
    setTimeout(() => {
      document.dispatchEvent(new Event('click'));
      setTimeout(() => {
        this.setupForm.controls['branchCode'].setValue(this.branchCodeData.options[0].value);
        this.setupForm.controls['branchCodeLabel'].setValue(this.branchCodeData.options[0].label);
        document.dispatchEvent(new Event('click'));
      }, 0);
    }, 0);
  }

  //This fuction is for programmically checking a radion button and openning the relevant input field(s)
  setupRadioGroups(formData?) {
    setTimeout(() => {
      this.formRadioButtons.forEach(formRadioGoup => {
        let currentOpt = formData[formRadioGoup.data.name]
        if (currentOpt && currentOpt !== 'N') {
          formRadioGoup.data.options.forEach(option => {
            if (option.name === currentOpt) {
              document.dispatchEvent(new Event('click'));
              //notifyMe radio validations
              this.validateDefoultedMathod(currentOpt);
              this.removenotifyMeValidations(currentOpt);
              //notifybeneficiary radio validations
              this.setValidators(option.name);
              this.removenotifyBenRadio(option.name);
              //open relevent radio field
              let formRadioGroupsWrapper = this.formRadioGroupsWrappers.find(frgw => frgw.data.name === option.inputID)
              if (formRadioGroupsWrapper) {
                formRadioGoup.currentRadioField = formRadioGroupsWrapper;
              }
            }
          });
        }
        else {
          this.removenotifyBenRadio('N');
          this.removenotifyMeValidations('N');
        }

      });
    }, 0)

  }

  //update accountype selected value on change
  onAccountTypeChange(e) {
    this.selectedAccoutType = this.payNewService.findAccountType(e.label);

  }

  //this function add validators to radio fields dinamically
  validateDefoultedMathod(notify) {
    switch (notify) {
      case 'F': {
        this.setupForm.controls['notifyMeFaxNumber'].setValidators([Validators.required])
        this.setupForm.controls['notifyMeFaxCode'].setValidators([Validators.required])
        this.setupForm.controls['notifyMeFaxNumber'].markAsTouched();
        this.setupForm.controls['notifyMeFaxCode'].markAsTouched();
        this.setupForm.controls['notifyMeFaxCode'].updateValueAndValidity()
        this.setupForm.controls['notifyMeFaxNumber'].updateValueAndValidity()
        break
      }
      case 'E': {
        this.setupForm.controls['notifyMeEmail'].setValidators([Validators.required])
        this.setupForm.controls['notifyMeEmail'].markAsTouched();
        this.setupForm.controls['notifyMeEmail'].updateValueAndValidity()
        break

      }
      case 'S': {
        this.setupForm.controls['notifyMeSMS'].setValidators([Validators.required])
        this.setupForm.controls['notifyMeSMS'].markAsTouched();
        this.setupForm.controls['notifyMeSMS'].updateValueAndValidity()
        break
      }
    }

  }


// marks the form fields as dirty
  markAllAsDirty(controlName?) {
    if (controlName) {
      this.setupForm.controls[controlName].markAsDirty()
    } else {
      // Mark fields as dirty to trigger validation
      for (const key in this.setupForm.controls) {

        if (key.indexOf('notifyBeneficiary') > -1 || key.indexOf('notifyMe') > -1)
          this.markDirtySpecificRadioOpt(key);
        else
          this.setupForm.controls[key].markAsDirty()

      }
    }

    this.onValueChanged();
  }


//marks radio options as dirty
  markDirtySpecificRadioOpt(inputID: string) {
    if (this.setupForm.controls[inputID] && !this.setupForm.controls[inputID].valid)
       this.setupForm.controls[inputID].markAsDirty();
  }


//do validations and uptade validation masseges
  private doValidation() {
    if (!this.setupForm) { return; } // Return if no form
    // for each field in formErrors check if associated control have errors and update formErrors with those.
    for (const field in this.formStatus.formErrors) {
      // clear previous error message (if any)
      this.formStatus.formErrors[field] = '';
      const control = this.setupForm.get(field);
      // Only set errors on controls that exist, is dirty and not valid.
      if (control && control.dirty && !control.valid) {
        if (this.validationMessages) {
          const messages = this.validationMessages[field]
          // tslint:disable-next-line:forin
          for (const key in control.errors) {
            this.formStatus.formErrors[field] += messages[key] + ' '
          }
        }
      }
    }
  }


  onBranchCodeKeyup(e) {
    // this.branchOptions = [];
    e.preventDefault();
    if (this.utils.isValidSearchKeyPressed(e)) {
      this.fetchBranchCodes(e.target.value);
    }
  }

  onBankNameKeyup(e) {
    this.switchData=null;
    if ((e.keyCode === 13 || e.keyCode === 8 || e.keyCode === 32 || (65 <= e.keyCode && e.keyCode <= 90) || (47 < e.keyCode && e.keyCode < 58))) {
      this.institutionSearchValue = e.target.value
      this.fetchBankNames(e.target.value);
    }
  }

  private fetchBranchCodes(searchString): void {
    const request = new BranchCodesRequest(this.setupForm.value.bank, searchString);

    this.allSubcriptions.push(this.externalBankDetailsProxyService.getBranchCodes(request).subscribe(

      response => {
        this.buildBranchCodes(response)
      },
      error => {
        this.branchCodeData.options = [];
      }
    ))
  }

  private fetchBankNames(searchString): void {
    const request = new BankNamesRequest(searchString);

    //For getting accurate search result on slow network -- It cancel the previous request
    if (this.allSubcriptions.length > 0 && this.bankSubscriptionIndex) {
      if (this.allSubcriptions[this.bankSubscriptionIndex]) {
        this.allSubcriptions[this.bankSubscriptionIndex].unsubscribe();
        this.allSubcriptions.splice(this.bankSubscriptionIndex, 1)
        this.bankSubscriptionIndex = undefined;
      }
    }

    this.allSubcriptions.push(this.externalBankDetailsProxyService.getBanks(request).subscribe(
      response => this.buildBankNames(searchString, response),
      error => console.log('Error fetching banks', error)
    ))

    this.bankSubscriptionIndex = this.allSubcriptions.length - 1;
  }
  buildBranchCodes(response: ListBranchCodesForBankResponse) {
    this.branchCodeData.options = response.branchCodes.map(branchCode => {
      return { value: branchCode.bankCode, label: branchCode.branchName }
    })

    this.payNewService.setBranchOptions(this.branchCodeData.options);
  }

  buildBankNames(searchString: string, response: ListBankNamesResponse) {
    if (response) {
      this.bankOptions = response.bankNames.map(bank => {
        return { value: bank.bankNames, label: bank.bankNames }
      });
    }
    if (searchString.toLowerCase().indexOf('ab') > -1) {
      this.bankOptions.push({ value: 'Absa', label: 'ABSA BANK' });
      this.bankOptions.sort(function (bank1, bank2) {
        let outcome = 0;
        if (bank1.label < bank2.label) {
          outcome = -1;
        }
        if (bank1.label > bank2.label) {
          outcome = 1;
        }
        return outcome;
      });

    }

    this.availableBankOptions = response.bankNames;
    //Keep bankOptions to avoid unnecessary back-services calls when user hit back on confirm step [step 2]
    this.payNewService.setBankOptions(this.bankOptions);

  }

  onSetupFormKeyDown(event: KeyboardEvent, formModel) {
    if (event.key === "Enter" || event.keyCode == 13) this.nextButtonClick(event)
  }


  nextButtonClick(event) {
    event.preventDefault();
    this.beforeSubmitForm();
  }

  checkBeneficiariesForBranchAndAccount() {

    var benExist = this.payNewService.getaddexistingBen()
    if (benExist.exist) {
      if (this.setupForm.value.accountNumber == benExist.accountNumber &&
        this.setupForm.value.branchCode == benExist.branchCode) {
        this.submitForm();
        return false;
      }
      else {
        let addexistingBen = {
          'accountNumber': '',
          'branchCode': '',
          'exist': false
        }
        this.payNewService.SetaddexistingBen(addexistingBen)
      }

    }

    const request = new BeneficiariesFromBranchAndAccountRequest(
      this.setupForm.value.accountNumber,
      this.setupForm.value.branchCode

    );
    //this.loaderService.startLoading();
    this.progressSpinnerService.startLoading();
    this.payNewService.fetchFromBranchAccount(request).subscribe(
      response => {
        //this.loaderService.stopLoading();
        this.progressSpinnerService.stopLoading();
        if (response.typeOfBeneficiaryList !== 'N') {

          if (response.typeOfBeneficiaryList === 'I' ||
            response.typeOfBeneficiaryList === 'V' ||
            response.typeOfBeneficiaryList === 'D') {
            this.openBeneficiaryExistsDialog(response.typeOfBeneficiaryList);
          } else {
            this.submitForm();
          }
        } else {
          this.submitForm();
        }

      },
      error => {
        this.loaderService.stopLoading();
        this.submitForm();
      }
    );

  }

  openBeneficiaryExistsDialog(typeOfBeneficiaryList, response?: RegularBeneficiaryManagementGetBeneficiariesForBranchAndAccountResponse
  ): void {

    switch (typeOfBeneficiaryList) {
      case 'I': {

        if(this.setupForm.controls['bank'].value.toLowerCase().indexOf('absa') > -1){
          this.openCustomeDialog();
          this.payNewService.setabsalistedValues(this.setupForm.value);
        }else{
          this.submitForm();
        }

        break;
      }
      case 'D': {
        if(this.setupForm.controls['bank'].value.toLowerCase().indexOf('absa') > -1){
          this.openCustomeDialog();
          this.payNewService.setabsalistedValues(this.setupForm.value);
        }else{
          this.submitForm();
        }
        break;
      }
      case 'V': {
        this.openDialog();
        break;
      }
      default:
        console.log('typeOfBeneficiaryList = ' + typeOfBeneficiaryList)
        break;
    }
    return;
  }

  beforeSubmitForm() {
    this.formStatus.submitClicked = true;
    this.markAllAsDirty();
    this.doValidation();
    var nop = this.setupForm.get('notifyMeRadio').value;
    if (this.setupForm.valid) {
      this.checkBeneficiariesForBranchAndAccount();
    } else {
      this.checkEmptyOwnNoP(nop)
      this.payNewService.emitChange('scrollNewBen');
    }
    return false;
  }
  checkEmptyOwnNoP(nop) {
    if (nop === 'F' && this.setupForm.controls['notifyMeFaxNumber'].value === '') {

      this.emptyValue = true;
    }
    else {
      this.emptyValue = false;
    }
  }
  submitForm(existingFormData?: boolean) {
    if (existingFormData) {
      this.payNewService.emitChange('step1Next');
      return false;
    }
    this.formStatus.submitClicked = true;
    this.markAllAsDirty();
    this.doValidation();

    if (this.setupForm.valid) {
      this.payNewService.setFormData(this.setupForm.value, 'normalBeneficiary');
      this.payNewService.emitChange('step1Next');
    }
    return false;
  }

  cancel(e) {
    e.preventDefault();

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

  verifyAccount(e) {
    console.log(e, 'avasaa')
    if (this.sessionService.getAlreadyPromptedForAvs() === false) {
      this.dialogModalService.CustomDialogModal(AvsModalComponent, this.data, {
        styles: {
          containerStyle: {
            'width': '650px',
            'padding': '0px'
          }, closeIconStyle: {
            'height': '0',
            'margin': '0 0 -22px 0px'
          }
        }
      });
    } else {
      this.avsService.activateAvs.next(true);
    }

  }

  private initializeNotificationDetails(formData: FormData): void {
    const request: ManageNotificationDetailsGetNotificationDetailsRequest = {
      'userNumber': this.sessionService.esfHeader.UserNumber,
      'accountNumber': this.sessionService.esfHeader.AccessAccount
    };
    this.getNotificationProxyService.getNotificationDetails(request).subscribe(
      response => {
        this.setupForm.controls['notifyMeSMS'].setValue(response.alrtVO.cellNumber);
        this.setupForm.controls['notifyMeEmail'].setValue(response.alrtVO.email);
        this.setupForm.controls['notifyMeFaxCode'].setValue(response.alrtVO.faxCode);
        this.setupForm.controls['notifyMeFaxNumber'].setValue(response.alrtVO.faxNumber);
        //TODO: When preferred method is 'N' - This misbehave without this control statement
        if (response.alrtVO.preferredPopMethod !== 'N') {

          this.setupForm.controls['notifyMeRadio'].setValue(response.alrtVO.preferredPopMethod)
          formData.notifyMeRadio = response.alrtVO.preferredPopMethod;

        }
        this.setupRadioGroups(formData);
        return response.alrtVO;
      },
      error => console.error(' Error ')
    );

  };

  goNext(formModel) {

    if (this.payNewService.getcheckbwn()) {
      this.checkBeneficiaryType()
      this.payNewService.setCheckBen(false);
    }
    else {
      this.payNewService.setFormData(formModel, 'normalBeneficiary');
      this.payNewService.emitChange('step1Next');
    }

  }

  faxRelatedFormControls = ['notifyBeneficiaryFaxCode', 'notifyBeneficiaryFaxNumber',
    'notifyBeneficiaryFaxRecipientName'];

  emailRelatedFormControls = ['notifyBeneficiaryEmail', 'notifyBeneficiaryEmailRecipientName'];

  callOnOptionChange(currentOption) {
    this.radio_focus = 2;
    this.setupForm.get('notifyBeneficiaryFaxRecipientName').setValue(this.defauldRecipient)
    this.setupForm.get('notifyBeneficiaryEmailRecipientName').setValue(this.defauldRecipient)
    //Set validators on the current option
    this.setValidators(currentOption.name);
    //Remove validator on the previous option
    this.removenotifyBenRadio(currentOption.name);

  }

  faxNotifyMeRelatedFormControls = ['notifyMeFaxCode', 'notifyMeFaxNumber'];
  emailnotifyMeRelatedFormControls = ['notifyMeEmail'];
  //notifyMeRatio
  removenotifyMeValidations(name) {
    switch (name) {
      case 'S': {
        let email = this.setupForm.controls['notifyMeEmail'].value;
        let fax = this.setupForm.controls['notifyMeFaxNumber'].value;
        let faxCode = this.setupForm.controls['notifyMeFaxCode'].value;
        this.resetvalidators('notifyMeEmail', email);
        this.resetvalidators('notifyMeFaxNumber', fax);
        this.resetvalidators('notifyMeFaxCode', faxCode);
        this.emptyValue = false;

        break;
      }
      case 'E': {
        let sms = this.setupForm.controls['notifyMeSMS'].value;
        let fax = this.setupForm.controls['notifyMeFaxNumber'].value;
        let faxCode = this.setupForm.controls['notifyMeFaxCode'].value;
        this.resetvalidators('notifyMeSMS', sms);
        this.resetvalidators('notifyMeFaxNumber', fax);
        this.resetvalidators('notifyMeFaxCode', faxCode);
        this.emptyValue = false;
        break;
      }
      case 'F': {
        let email = this.setupForm.controls['notifyMeEmail'].value;
        let sms = this.setupForm.controls['notifyMeSMS'].value;
        this.resetvalidators('notifyMeEmail', email);
        this.resetvalidators('notifyMeSMS', sms);
        break;
      }
      case 'N': {
        let email = this.setupForm.controls['notifyMeEmail'].value;
        let sms = this.setupForm.controls['notifyMeSMS'].value;
        let fax = this.setupForm.controls['notifyMeFaxNumber'].value;
        let faxCode = this.setupForm.controls['notifyMeFaxCode'].value;

        this.resetvalidators('notifyMeEmail', email);
        this.resetvalidators('notifyMeSMS', sms);
        this.resetvalidators('notifyMeFaxNumber', fax);
        this.resetvalidators('notifyMeFaxCode', faxCode);
        this.emptyValue = false;
        break;
      }
    }

  }

  //remove notifybeneficiary Radio validators
  removenotifyBenRadio(name) {
    switch (name) {
      case 'S': {
        let Bemail = this.setupForm.controls['notifyBeneficiaryEmail'].value;
        let benfaxCode = this.setupForm.controls['notifyBeneficiaryFaxCode'].value;
        let benfax = this.setupForm.controls['notifyBeneficiaryFaxNumber'].value;
        let faxReceip = this.setupForm.controls['notifyBeneficiaryFaxRecipientName'].value;
        let EmailRecip = this.setupForm.controls['notifyBeneficiaryEmailRecipientName'].value;
        this.resetvalidators('notifyBeneficiaryEmail', Bemail);
        this.resetvalidators('notifyBeneficiaryFaxCode', benfaxCode);
        this.resetvalidators('notifyBeneficiaryFaxNumber', benfax);
        this.resetvalidators('notifyBeneficiaryFaxRecipientName', faxReceip);
        this.resetvalidators('notifyBeneficiaryEmailRecipientName', EmailRecip);
        break;
      }
      case 'E': {
        let benfaxCode = this.setupForm.controls['notifyBeneficiaryFaxCode'].value;
        let benfax = this.setupForm.controls['notifyBeneficiaryFaxNumber'].value;
        let faxReceip = this.setupForm.controls['notifyBeneficiaryFaxRecipientName'].value;
        let benSms = this.setupForm.controls['notifyBeneficiarySMS'].value;
        this.resetvalidators('notifyBeneficiaryFaxCode', benfaxCode);
        this.resetvalidators('notifyBeneficiaryFaxNumber', benfax);
        this.resetvalidators('notifyBeneficiaryFaxRecipientName', faxReceip);
        this.resetvalidators('notifyBeneficiarySMS', benSms);

        break
      }
      case 'F': {
        let benSms = this.setupForm.controls['notifyBeneficiarySMS'].value;
        let Bemail = this.setupForm.controls['notifyBeneficiaryEmail'].value;
        let EmailRecip = this.setupForm.controls['notifyBeneficiaryEmailRecipientName'].value;
        this.resetvalidators('notifyBeneficiaryEmailRecipientName', EmailRecip);
        this.resetvalidators('notifyBeneficiaryEmail', Bemail);
        this.resetvalidators('notifyBeneficiarySMS', benSms);
        break;
      }
      case 'N': {

        let benfaxCode = this.setupForm.controls['notifyBeneficiaryFaxCode'].value;
        let benfax = this.setupForm.controls['notifyBeneficiaryFaxNumber'].value;
        let faxReceip = this.setupForm.controls['notifyBeneficiaryFaxRecipientName'].value;
        let benSms = this.setupForm.controls['notifyBeneficiarySMS'].value;
        let Bemail = this.setupForm.controls['notifyBeneficiaryEmail'].value;
        let EmailRecip = this.setupForm.controls['notifyBeneficiaryEmailRecipientName'].value;
        this.resetvalidators('notifyBeneficiaryEmailRecipientName', EmailRecip);
        this.resetvalidators('notifyBeneficiaryEmail', Bemail);
        this.resetvalidators('notifyBeneficiarySMS', benSms);
        this.resetvalidators('notifyBeneficiaryFaxCode', benfaxCode);
        this.resetvalidators('notifyBeneficiaryFaxNumber', benfax);
        this.resetvalidators('notifyBeneficiaryFaxRecipientName', faxReceip);

      }
    }
  }

  resetvalidators(name, curentValue) {
    this.setupForm.controls[name].reset(curentValue);
    this.setupForm.controls[name].setValidators([]);
    this.setupForm.controls[name].updateValueAndValidity();
  }
  callOnNotifyMeOptionChange(currentOption) {
    //Set validators on the current option
    this.radio_focus = 1;
    this.setNotifyMeValidators(currentOption.inputID);
    this.removenotifyMeValidations(currentOption.name);

  }

  setValidators(name) {

    switch (name) {
      case 'S':
        this.setupForm.controls['notifyBeneficiarySMS'].setValidators([this.validateCellNumber()])
        this.setupForm.controls['notifyBeneficiarySMS'].updateValueAndValidity();
        break;
      case 'E':
        this.setupForm.controls['notifyBeneficiaryEmail'].setValidators([Validators.required,this.validateEmail(), Validators.maxLength(70)])
        this.setupForm.controls['notifyBeneficiaryEmailRecipientName'].setValidators([this.validateresipName()])
        this.setupForm.controls['notifyBeneficiaryEmail'].updateValueAndValidity();
        this.setupForm.controls['notifyBeneficiaryEmailRecipientName'].updateValueAndValidity();
        break;

      case 'F':
        this.setupForm.controls['notifyBeneficiaryFaxCode'].setValidators([this.validateFaxCode()])
        this.setupForm.controls['notifyBeneficiaryFaxNumber'].setValidators([this.validateFax()])
        this.setupForm.controls['notifyBeneficiaryFaxRecipientName'].setValidators([this.validateresipName()])
        this.setupForm.controls['notifyBeneficiaryFaxRecipientName'].updateValueAndValidity();
        this.setupForm.controls['notifyBeneficiaryFaxNumber'].updateValueAndValidity();
        this.setupForm.controls['notifyBeneficiaryFaxCode'].updateValueAndValidity();
        break;

    }

  }

  setNotifyMeValidators(inputID) {

    switch (inputID) {
      case 'notifyMeSMSGroup':

        this.setupForm.controls['notifyMeSMS'].setValidators([Validators.required])
        this.setupForm.get('notifyMeSMS').markAsTouched();
        this.setupForm.get('notifyMeSMS').updateValueAndValidity();
        break;
      case 'notifyMeEmailGroup':

        this.setupForm.controls['notifyMeEmail'].setValidators([Validators.required])
        this.setupForm.get('notifyMeEmail').markAsTouched();
        this.setupForm.get('notifyMeEmail').updateValueAndValidity()
        break;

      case 'notifyMeFaxGroup':
        this.setupForm.get('notifyMeFaxNumber').markAsTouched();
        this.setupForm.get('notifyMeFaxCode').markAsTouched();
        this.setupForm.get('notifyMeFaxCode').setValidators([Validators.required]);
        this.setupForm.get('notifyMeFaxNumber').setValidators([Validators.required])
        this.setupForm.get('notifyMeFaxNumber').updateValueAndValidity();
        this.setupForm.get('notifyMeFaxCode').updateValueAndValidity()
        break;

    }

  }

  public createSimpleForm(formData?: FormData) {

    this.formBuilder = new FormBuilder();
    this.setupForm = this.formBuilder.group({

      fullName: new FormControl('', { validators: [this.validateBeneficiaryName()], updateOn: 'blur' }),
      bank: new FormControl('', { validators: [Validators.required, this.bankMatchNotFound()], updateOn: 'blur' }),
      branchCode: new FormControl('', { validators: [Validators.required, this.branchMatchNotFound()], updateOn: 'blur' }),
      branchCodeLabel: new FormControl(''),
      accountNumber: new FormControl('', { validators: [Validators.required, CommonValidators.isValidNumber, Validators.maxLength(24)], updateOn: 'blur' }),
      accountType: new FormControl('', {validators: [Validators.required], updateOn: 'blur' }),
      myReference: new FormControl('', { validators: [this.validateReferenceName()], updateOn: 'blur' }),
      beneficiaryReference: new FormControl('', { validators: [this.validateReferenceName()], updateOn: 'blur' }),
      notifyMeRadio: new FormControl('N'),
      notifyMeSMS: new FormControl('', { updateOn: 'submit' }),
      notifyMeEmail: new FormControl('', { updateOn: 'submit' }),
      notifyMeFaxNumber: new FormControl('', { updateOn: 'submit' }),
      notifyMeFaxCode: new FormControl('', { updateOn: 'submit' }),

      notifyBeneficiaryRadio: new FormControl('N'),

      notifyBeneficiarySMS: new FormControl('', { updateOn: 'blur' }),

      notifyBeneficiaryEmail: new FormControl('', { updateOn: 'blur' }),
      notifyBeneficiaryEmailRecipientName: new FormControl('', { updateOn: 'blur' }),
      notifyBeneficiaryEmailPaymentMadeBy: new FormControl('', { updateOn: 'blur' }),
      notifyBeneficiaryEmailContactMeOn: new FormControl('', { updateOn: 'blur' }),
      notifyBeneficiaryEmailComments: new FormControl('', { updateOn: 'blur' }),

      notifyBeneficiaryFaxCode: new FormControl('', { updateOn: 'blur' }),
      notifyBeneficiaryFaxNumber: new FormControl('', { updateOn: 'blur' }),
      notifyBeneficiaryFaxRecipientName: new FormControl('', { updateOn: 'blur' }),
      notifyBeneficiaryFaxPaymentMadeBy: new FormControl('', { updateOn: 'blur' }),
      notifyBeneficiaryFaxContactMeOn: new FormControl('', { updateOn: 'blur' }),
      notifyBeneficiaryFaxComments: new FormControl('', { updateOn: 'blur' }),
    });
    this.formStatus.submitClicked = true;
    this.setupForm.statusChanges.subscribe(data => this.doValidation());
    this.allSubcriptions.push(this.setupForm.valueChanges.subscribe(data => this.onValueChanged(data)));
    this.onValueChanged();
    this.setupForm.controls['fullName'].valueChanges.subscribe(
      () => { this.trimControls('fullName') });

    this.setupForm.controls['accountNumber'].valueChanges.subscribe(
      () => { this.trimControls('accountNumber') }, );

    this.setupForm.controls['myReference'].valueChanges.subscribe(
      () => { this.trimControls('myReference') });

    this.setupForm.controls['beneficiaryReference'].valueChanges.subscribe(
      () => { this.trimControls('beneficiaryReference') });

    this.setupForm.controls['notifyBeneficiarySMS'].valueChanges.subscribe(
      () => { this.trimControls('notifyBeneficiarySMS') });

    this.setupForm.controls['notifyBeneficiaryEmail'].valueChanges.subscribe(
      () => { this.trimControls('notifyBeneficiaryEmail') });

    this.setupForm.controls['notifyBeneficiaryFaxCode'].valueChanges.subscribe(
      () => { this.trimControls('notifyBeneficiaryFaxCode') });

    this.setupForm.controls['notifyBeneficiaryFaxNumber'].valueChanges.subscribe(
      () => { this.trimControls('notifyBeneficiaryFaxNumber') });

    this.setupForm.controls['notifyBeneficiaryFaxRecipientName'].valueChanges.subscribe(
      () => { this.trimControls('notifyBeneficiaryFaxRecipientName') });

    this.setupForm.controls['notifyBeneficiaryEmailRecipientName'].valueChanges.subscribe(
      () => { this.trimControls('notifyBeneficiaryEmailRecipientName') });
  }
  onSetupClick() {
    this.payNewService.setFormData(this.setupForm.value, 'normalBeneficiary');
  }

  initialiseSherdData(absaListedFormData) {
    //Use the data from absa-listed beneficiary form
    this.setupForm.controls['notifyMeRadio'].setValue(absaListedFormData.notifyMeRadio);
    this.setupForm.controls['notifyMeSMS'].setValue(absaListedFormData.notifyMeSMS);
    this.setupForm.controls['notifyMeEmail'].setValue(absaListedFormData.notifyMeEmail);
    this.setupForm.controls['notifyMeFaxNumber'].setValue(absaListedFormData.notifyMeFaxNumber);
    this.setupForm.controls['notifyMeFaxCode'].setValue(absaListedFormData.notifyMeFaxCode);
    this.setupForm.controls['myReference'].setValue(absaListedFormData.myReference);

    //reset benexist dilog when you from absalisted
    var addexistingBen: any = {
      'accountNumber': '',
      'branchCode': '',
      'exist': false,
    }
    this.payNewService.SetaddexistingBen(addexistingBen)
    var formData = this.payNewService.getFormData('normalBeneficiary');
    this.setupRadioGroups(formData)
  }
  doTranslations() {
    this.translator.waitForTranslation().then(() => {
      this.translator.observe([
        'paymentBeneficiaries.addBeneficiaries.placeholder.institutionName',//0
        //TODO - Remove this validation trans. when done with validation messages

        //Account number validation message(s) translations
        "paymentBeneficiaries.addBeneficiaries.validationMessage.accountNumber.isValidNumber",//1
        "paymentBeneficiaries.addBeneficiaries.validationMessage.accountNumber.required",//2
        //Account type validation message(s) translations
        "paymentBeneficiaries.addBeneficiaries.validationMessage.accountType.required",//3
        //Bank name validation message(s) translations
        "paymentBeneficiaries.addBeneficiaries.validationMessage.bank.required",//4
        //Branch code validation message(s) translations
        "paymentBeneficiaries.addBeneficiaries.validationMessage.branchCode.required",//5
        //ContactMeOn validation message(s) translations - For both Fax and Email
        "paymentBeneficiaries.addBeneficiaries.validationMessage.contactMeOn.cannotContainSpace",//6
        "paymentBeneficiaries.addBeneficiaries.validationMessage.contactMeOn.isValidNumber",//7
        "paymentBeneficiaries.addBeneficiaries.validationMessage.contactMeOn.maxlength",//8
        "paymentBeneficiaries.addBeneficiaries.validationMessage.contactMeOn.minlength",//9
        //Fullname validation message(s) translations
        "paymentBeneficiaries.addBeneficiaries.validationMessage.fullName.requred",//10
        "paymentBeneficiaries.addBeneficiaries.validationMessage.fullName.isValidBeneficiaryName",//11
        "paymentBeneficiaries.addBeneficiaries.validationMessage.fullName.minlength",//12
        'paymentBeneficiaries.addBeneficiaries.validationMessage.fullName.maxlength',//13
        //Notify beneficiary by Email validation message(s) translations
        "paymentBeneficiaries.addBeneficiaries.validationMessage.notifyBeneficiaryEmail.cannotContainSpace",//14
        "paymentBeneficiaries.addBeneficiaries.validationMessage.notifyBeneficiaryEmail.isValidEmailAddress",//15
        "paymentBeneficiaries.addBeneficiaries.validationMessage.notifyBeneficiaryEmail.required",//16
        //Notify beneficiary by Fax validation message(s) translations - For both Fax code and Fax number
        "paymentBeneficiaries.addBeneficiaries.validationMessage.notifyBeneficiaryFaxCode.cannotContainSpace1",//17
        "paymentBeneficiaries.addBeneficiaries.validationMessage.notifyBeneficiaryFaxCode.isValidNumber1",//18
        "paymentBeneficiaries.addBeneficiaries.validationMessage.notifyBeneficiaryFaxCode.maxlength",//19
        "paymentBeneficiaries.addBeneficiaries.validationMessage.notifyBeneficiaryFaxCode.minlength1",//20
        "paymentBeneficiaries.addBeneficiaries.validationMessage.notifyBeneficiaryFaxCode.required",//21
        //Notify beneficiary by SMS validation message(s) translations
        "paymentBeneficiaries.addBeneficiaries.validationMessage.notifyBeneficiarySMS.cannotContainSpace1",//22
        "paymentBeneficiaries.addBeneficiaries.validationMessage.notifyBeneficiarySMS.isValidNumber1",//23
        "paymentBeneficiaries.addBeneficiaries.validationMessage.notifyBeneficiarySMS.maxlength1",//24
        "paymentBeneficiaries.addBeneficiaries.validationMessage.notifyBeneficiarySMS.minlength1",//25
        "paymentBeneficiaries.addBeneficiaries.validationMessage.notifyBeneficiarySMS.required1",//26
        "paymentBeneficiaries.addBeneficiaries.validationMessage.notifyBeneficiarySMS.startWithZero1",//27
        //PaymentMadeBy validation message(s) translations - For both Fax and Email
        "paymentBeneficiaries.addBeneficiaries.validationMessage.paymentMadeBy.isValidName",//28
        "paymentBeneficiaries.addBeneficiaries.validationMessage.paymentMadeBy.required",//29
        //RecipientName validation message(s) translations - For both Fax and Email
        "paymentBeneficiaries.addBeneficiaries.validationMessage.recipientName.isValidName",//30
        "paymentBeneficiaries.addBeneficiaries.validationMessage.recipientName.required",//31
        //Reference validation message(s) translations - For both Own and Beneficiary
        "paymentBeneficiaries.addBeneficiaries.validationMessage.reference.isValidReferenceName",//32
        "paymentBeneficiaries.addBeneficiaries.validationMessage.reference.required",//33
        "paymentBeneficiaries.addBeneficiaries.bankOptions.notFound",//34
        "paymentBeneficiaries.addBeneficiaries.placeholder.branchCode",//35
        "paymentBeneficiaries.label.branchCode",//36
        "paymentBeneficiaries.addBeneficiaries.statementReferenceMaxCharacters",//37
        "paymentBeneficiaries.addBeneficiaries.yourReferenceMaxCharacters",//38
        "paymentBeneficiaries.addBeneficiaries.validationMessage.accountNumber.isValidNumber",//39
        "paymentBeneficiaries.addBeneficiaries.validationMessage.accountNumber.maxLength",//40
        "paymentBeneficiaries.addBeneficiaries.validationMessage.accountNumber.cannotcontainspaces",//41
        'paymentBeneficiaries.addBeneficiaries.validationMessage.notifyBeneficiarySMS.required',//42
        'paymentBeneficiaries.addBeneficiaries.validationMessage.notifyBeneficiarySMS.startWithZero',//43
        'paymentBeneficiaries.addBeneficiaries.validationMessage.notifyBeneficiaryEmail.required',//44
        'common.message.contactDetailsExists2',//45
        "paymentBeneficiaries.addBeneficiaries.validationMessage.notifyBeneficiarySMS.isAlphabet1",//46

        'paymentBeneficiaries.addBeneficiaries.validationMessage.notifyBeneficiaryFaxNumber.isValidNumber',// 47
        'paymentBeneficiaries.addBeneficiaries.validationMessage.notifyBeneficiaryFaxNumber.maxlength',// 48
        'paymentBeneficiaries.addBeneficiaries.validationMessage.notifyBeneficiaryFaxNumber.minlength',// 49

        'paymentBeneficiaries.addBeneficiaries.validationMessage.notifyBeneficiaryFaxCode.maxlength',//50
        'paymentBeneficiaries.addBeneficiaries.validationMessage.notifyBeneficiaryFaxCode.isValidNumber',//51
        'paymentBeneficiaries.addBeneficiaries.validationMessage.notifyBeneficiaryFaxCode.minlength',// 52
        'paymentBeneficiaries.addBeneficiaries.validationMessage.notifyBeneficiaryFaxNumber.required',//53
        "paymentBeneficiaries.addBeneficiaries.validationMessage.recipientName.maxlength",//54
        "common.message.maxlengthEmailadress",//55
        "paymentBeneficiaries.addBeneficiaries.validationMessage.notifyBeneficiaryEmail.allowedSpecialCharacters",//56
        "prepaidMobile.label.isValidateBeneficiaryName",//57
        "cashSendBeneficiaries.validation.validRef",//58
        'common.label.emailSpecialChar',//59
        'common.message.invalidSpecialChars',//60
        'pay.label.paymentMadeByNoSpaces'//61
      ])
        .subscribe((translations) => {
          this.branchCodeData.placeholder = translations[35];
          this.branchCodeData.label = translations[36]
          this.validationMessages = {
            'fullName': {
              'required': translations[10],
              'noLeadingSpaces': translations[11],
              'noSpecialCharectors': translations[57],
              'minlength': translations[12],
              'maxlength': translations[13]
            },
            'bank': {
              'required': translations[4],
              'bankMatchNotFound': translations[34],
            },
            'branchCode': {
              'required': translations[5],
              'branchMatchNotFound': translations[34],
            },
            'accountNumber': {
              'required': translations[2],
              'isValidNumber': translations[39],
              'maxlength': translations[40],
              'noLeadingSpaces': translations[41],

            },
            'accountType': {
              'required': translations[3]
            },
            'notifyBeneficiarySMS': {
              'required': translations[42],
              'minlength': translations[25],
              'isValidNumber': translations[23],
              'maxlength': translations[24],
              'cannotContainSpace': translations[22],
              'isValidStartWithZero': translations[43],
              'isAlphabet': translations[46],
            },
            'myReference': {
              'required': translations[33],
              'whiteSpacesNotAllowed': translations[32],
              'isValidReferenceName': translations[58]
            },
            'beneficiaryReference': {
              'required': translations[33],
              'whiteSpacesNotAllowed': translations[32],
              'isValidReferenceName': translations[58]
            },

            'notifyBeneficiaryEmail': {
              'required': translations[44],
              'isValidEmailAddress': translations[15],
              'maxlength': translations[55],
              'validEmailAddressChar': translations[59],
              //'isValidSpecialCharEmail': translations[56],
            },
            'notifyBeneficiaryEmailRecipientName': {
              'required': translations[31],
              'isAllowedCharectors': translations[60],
              'noLeadingSpaces': translations[61],
              'maxlength': translations[54]
            },
            'notifyBeneficiaryFaxCode': {
              'required': translations[21],
              'isValidFaxNumber': translations[18],
              'cannotContainSpace': translations[22],
              'minlength': translations[52],
              'isValidNumber': translations[51],
              'maxlength': translations[50],
            },
            'notifyBeneficiaryFaxNumber': {
              'required': translations[53],
              'isValidFaxNumber': translations[18],
              'cannotContainSpace': translations[22],
              'minlength': translations[49],
              'isValidNumber': translations[47],
              'maxlength': translations[48],
            },
            'notifyBeneficiaryFaxRecipientName': {
              'required': translations[31],
              'isAllowedCharectors': translations[60],
              'noLeadingSpaces': translations[61],
              'maxlength': translations[54]
            },

            'notifyMeEmail': {
              'required': translations[45]
            },
            'notifyMeSMS': {
              'required': translations[45]
            },

          };
          this.translations['not_found'] = translations[34]
          this.allSubcriptions.push(this.setupForm.valueChanges.subscribe(data => {

            this.onValueChanged(data)
          }));
          this.onValueChanged();
        })
    })
  }  //Search if account number entered doesn't belong to absa-listed beneficiary

  checkBeneficiaryType(e?, controlName?) {
    if (this.setupForm.value.accountNumber &&
       this.setupForm.value.branchCode) {

      const requestInput = new BeneficiariesFromBranchAndAccountRequest(
        this.setupForm.value.accountNumber,
        this.setupForm.value.branchCode
      );

      //this.loaderService.startLoading();
      this.progressSpinnerService.startLoading();
      this.allSubcriptions.push(this.payNewService.fetchFromBranchAccount(requestInput)
        .subscribe(
          searchResponse => {
            //this.loaderService.stopLoading();
            this.progressSpinnerService.stopLoading();
            //Open modal if the account number entered belong to absa-listed beneficiary
            if (searchResponse.typeOfBeneficiaryList === 'I') {
              if(this.setupForm.controls['bank'].value.toLowerCase().indexOf('absa') > -1){
                this.openCustomeDialog();
                this.payNewService.setabsalistedValues(this.setupForm.value);
              }
              else{
                this.submitForm();
              }
            }
            else
              if (searchResponse.typeOfBeneficiaryList === 'V') {
                this.openDialog();
              }

          }, error => {
            this.loaderService.stopLoading();
            console.log('Error fetching account', error)
          }
        ))

  }
  }



  trimControls(controlName) {
    if (this.setupForm.get(controlName).value.trim() !== '') {
      let controlNameValue = this.setupForm.get(controlName).value.trim();
      this.setupForm.get(controlName).setValue(controlNameValue, { onlySelf: true, emitEvent: false });
    }
  }
  openCustomeDialog(): void {
    const data = {
      // styles: { containerStyle: {
      //   'max-width': '1200px',
      //   'min-height': '350px'
      // }},
      styles: {
        containerStyle: {
          'width': '75% ',
          'max-width': '767px',
          'min-height': '350px',
          'padding': '0px 0px 0px 0px',
          'height': 'initial' },
        closeIconStyle: {
          'height': '0',
          'margin': '0 0 -22px 0px'
      }},
      icon: true
    }
    this.allSubcriptions.push(this.dialogModalService.CustomDialogModal(ViewPaymentAbsaListedDialogComponent, this.viewContainerRef, data).subscribe((res) => {
      if (this.payNewService.getAddBeneficiaryIndicator() === true) {
        this.payNewService.setAddBeneficiaryIndicator(false);
        this.submitForm();
        this.viewContainerRef.clear()
      } else if (this.payNewService.getUseExistingBeneficiaryIndicator()) {
        this.payNewService.setUseExistingBeneficiaryIndicator(false);
        this.submitForm(true);
        this.viewContainerRef.clear()
      }
    }));
  }

  validateCellNumber() {
    return (control: AbstractControl) => {
      const cellNo = control.value;
      control.value.trim();
      if (this.utils.isUndefined(cellNo) || this.utils.isNullOrEmpty(cellNo)) {
        return { required: true }
      }

      if (!CommonValidators.isValidAlpha(control)) {
        return { isAlphabet: false }
      }

      if (cellNo.charAt(1) == '0') {
        return { isValidNumber: false };
      }

      if (CommonValidators.cannotContainSpace(control)) {
        return { cannotContainSpace: true };
      }

      if (CommonValidators.isValidNumber(control) !== null) {
        return { isAlphabet: false };
      }

      if (cellNo.length < 10) {
        return { minlength: true }
      }
      if (cellNo.length > 30) {
        return { maxlength: true }
      }
    }
  }

  validateFax() {
    return (control: AbstractControl) => {
      const faxNo = control.value;
      if (this.utils.isUndefined(faxNo) || this.utils.isNullOrEmpty(faxNo)) {
        return { required: true }
      }
      // if (faxNo.charAt(1) == '0') {
      //   return { isValidFaxNumber: false };
      // }
      if (CommonValidators.cannotContainSpace(control)) {
        return { cannotContainSpace: true };
      }
      if (CommonValidators.isValidNumber(control) !== null) {
        return { isValidNumber: false };
      }
      // if (faxNo.length < 2) {
      //   return { minlength: true }
      // }
      if (faxNo.length > 10) {
        return { maxlength: true }
      }
      //
    }
  }
  validateFaxCode() {
    return (control: AbstractControl) => {
      const faxCode = control.value;
      if (this.utils.isUndefined(faxCode) || this.utils.isNullOrEmpty(faxCode)) {
        return { required: true }
      }
      //
      if (faxCode.charAt(1) == '0') {
        return { isValidFaxNumber: false };
      }
      if (CommonValidators.cannotContainSpace(control)) {
        return { cannotContainSpace: true };
      }
      if (CommonValidators.isValidNumber(control) !== null) {
        return { isValidNumber: false };
      }
      if (faxCode.length < 2) {

        return { minlength: true }
      }
      if (faxCode.length > 10) {
        return { maxlength: true }

      }
    }

  }
  bankMatchNotFound() {
    return (control: AbstractControl) => {
      if (this.setupForm) {
        if (this.setupForm.controls['bank']) {
          const bankMatch = this.bankOptions.filter(bankOption => bankOption.value === this.setupForm.controls['bank'].value);
          const bankLabelMatch = this.bankOptions.filter(bankOption => bankOption.label === this.setupForm.controls['bank'].value);
          if (bankLabelMatch.length == 0 && bankMatch.length === 0) {
            if (this.setupForm.controls['bank'].value !== '')
              return { bankMatchNotFound: false };
          }
        }
      }
    }
  }

  branchMatchNotFound() {
    return (control: AbstractControl) => {
      if (this.setupForm) {
        if (this.setupForm.controls['branchCode']) {
          if (this.branchCodeData) {
            const branchMatchValue = this.branchCodeData.options.filter(branchOption => branchOption.label === this.setupForm.controls['branchCode'].value);
            const branchMatchLabel = this.branchCodeData.options.filter(branchOption => branchOption.value === this.setupForm.controls['branchCode'].value);
            if (branchMatchValue.length === 0 && branchMatchLabel.length === 0) {
              if (this.setupForm.controls['branchCode'].value !== '')
                return { branchMatchNotFound: false };
            }
          }
        }
      }
    }
  }


  validateresipName() {
    return (control: AbstractControl) => {
      const resipName = control.value;
      if (this.utils.isUndefined(resipName) || this.utils.isNullOrEmpty(resipName)) {
        return { required: true }
      }
      // if (CommonValidators.isValidName(control)) {
        if(Validate.isAllowedCharectors(control)){
        return { isAllowedCharectors: true };
      }
      if (resipName.length > 25) {
        return { maxlength: true }
      }
      if (Validate.noLeadingSpaces(control)) {
        return { noLeadingSpaces: true }
      }
    }

  }


  validateReferenceName() {
    return (control: AbstractControl) => {
      const refName = control.value;
      if (this.utils.isUndefined(refName) || this.utils.isNullOrEmpty(refName)) {
        return { required: true }
      }
      if (refName.trim() == '') {
        return { whiteSpacesNotAllowed: true }
      }
      if (CommonValidators.isValidReferenceName(control)) {
        return { isValidReferenceName: true };
      }

    }

  }


  validateBeneficiaryName() {
    return (control: AbstractControl) => {
      const benName = control.value;
      if (this.utils.isUndefined(benName) || this.utils.isNullOrEmpty(benName)) {
        return { required: true }
      }
      if (Validate.noLeadingSpaces(control)) {
        return { noLeadingSpaces: true };
      }
      if (Validate.noSpecialCharectors(control)) {

        return { noSpecialCharectors: true }
      }

      if (benName.length > 20) {
        return { maxlength: true }
      }
    }

  }

  validateEmail() {
    return (control: AbstractControl) => {
      const validEmailAddressChar = CommonValidators.validEmailAddressChar(control);
      if ( validEmailAddressChar !== null) {
        return validEmailAddressChar;
      }
      const isValidEmailAddress = CommonValidators.isValidEmailAddress(control);
      if ( isValidEmailAddress !== null) {
        return isValidEmailAddress;
      }
    }
  }
  ngOnDestroy() {
    //Memory leak prevention

    // this.sessionService.setContextualHelpId(this.previousContextualHelpId);
    this.allSubcriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
  }


  onBankNameFocus() {
    console.log('==============bankOptions======', this.bankOptions);
    document.dispatchEvent(new Event('click'));
  }
  openDialog(): void {

    const data = {
      // styles: { containerStyle: {
      //   'max-width': '1200px',
      //   'min-height': '350px'
      // }},
      styles: {
        containerStyle: {
          'width': '75% ',
          'max-width': '767px',
          'min-height': '350px',
          'padding': '0px 0px 0px 0px',
          'height': 'initial' },
        closeIconStyle: {
          'height': '0',
          'margin': '0 0 -22px 0px'
           }},
        icon: true
    }
    this.dialogModalService.CustomDialogModal(BenExistDialogComponent, this.viewContainerRef, data).subscribe((res) => {
      if (this.payNewService.getAddBeneficiaryIndicator() === true) {
        this.payNewService.setAddBeneficiaryIndicator(false);
        this.submitForm();
      } else if (this.payNewService.getUseExistingBeneficiaryIndicator()) {
        this.payNewService.setUseExistingBeneficiaryIndicator(false);
        this.submitForm(true);
      }
    })
  }

  //tabbing on radio focus
  @HostListener('document:keyup', ['$event'])
  private onkeydown(e: KeyboardEvent) {
    if (e.keyCode == 9) {
       var element = e.target as HTMLElement;
       if (element.id === 'notifyMeRadio0' || element.id === 'radio1') {this.radio_focus = 1; }
          else if (element.id === 'notifyBeneficiaryRadio0' || element.id === 'radio2') {this.radio_focus = 2;}
          else {this.radio_focus = 0;}
    }
  }
  //to be revised// force focus on radio input
  @HostListener('document:click', ['$event'])
  private onDocumentClick(event: Event) {
    var element = event.target as HTMLElement;
    if (element.classList) {
      if (element.classList.contains('radio-control__input') ||
        element.classList.contains('radio-subfield')) {
      } else {
        this.radio_focus = 0;
      }
    }
  }

}
const BENEFICIARYNAME_LEADINGSPACES_REGEXP = /^[a-zA-Z0-9!%@#$&()\\-`.+,/\"][a-zA-Z0-9!%@#$&()\\-`.+,/\"\s]*$/
const BENEFICIARYNAME_SPECIALCH_REGEXP = /[^\w\s]+/
const test = /^(?![]+$)[@&;\'()_+-=:.\/a-zA-Z0-9 ]+$/
function isEmpty(value: any) {
  return value == null || value.length === 0;
}
export class Validate {

  static isValidFaxNumber(control: AbstractControl) {
    if (control.value.length > 2 || control.value.length > 10 || control.value !== 0) {
      var faxRegEx = /^\+?[0-9]+$/;
      if (!control.value.match(faxRegEx)) {

        return { "isValidFaxNumber": true };
      }
    }
    return null;
  }

  validEmailAddressChar
  static maximumLength(control: AbstractControl) {
    if (control.value.length > 20) {
      return { "maximumLength": true };
    }
    return null;
  }


  static noLeadingSpaces(control: AbstractControl) {

    if (!isEmpty(control.value) && !BENEFICIARYNAME_LEADINGSPACES_REGEXP.test(control.value)) {
      if (control.value.trim() === '') {
        return { 'noLeadingSpaces': true };
      }
    }
    return null;
  }


  static noSpecialCharectors(control: AbstractControl) {

    if (!isEmpty(control.value) && BENEFICIARYNAME_SPECIALCH_REGEXP.test(control.value)) {
      return { 'noSpecialCharectors': true };
    }
    return null;
  }


  static isValidSpecialCharEmail(control: AbstractControl) {
    let EMAIL_REGEXP = /^[~`!@#$%^&*()_+-=:.|?!{}\[\]\\:;\"\',.?\/a-zA-Z0-9]+$/;
    if (!isEmpty(control.value) && (!EMAIL_REGEXP.test(control.value))) {
      return { 'isValidSpecialCharEmail': true };
    }
    return null;
  }

  static isAllowedCharectors(control: AbstractControl) {
    var allowedCharectors = /^(?![]+$)[@&;'()_+-=:.\/a-zA-Z0-9 ]+$/;

    if (!isEmpty(control.value) && (!allowedCharectors.test(control.value))) {
      return { 'isAllowedCharectors': true };
    }
    return null;
  }


}

