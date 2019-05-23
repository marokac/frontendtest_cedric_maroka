import { Component, OnInit, Input, AfterViewInit, ViewChild, ViewContainerRef, ViewChildren, QueryList, HostListener, ChangeDetectorRef } from '@angular/core';
import { InstitutionalBeneficiariesEnquiryFetchInstitutionalBeneficiariesRequest, InstitutionalBenefificiary, InstitutionalBeneficiariesEnquiryProxyService } from 'app/common/services/proxy-services/institutional-beneficiaries-fetchinstitutional-enquiries-proxy.service';
import { Observable } from 'rxjs/Observable';
import { FormDropdownOption } from 'app/common/ui-components/cb-form/form-dropdown/form-dropdown-option.model';
import { AlrtVO, GetNotificationDetailsProxyService } from 'app/common/services/proxy-services/get-notification-details-proxy.service';
import { FormAutoCompleteComponent } from 'app/common/ui-components/cb-form/form-autocomplete/form-autocomplete.component';
import { Subscription } from 'rxjs';
import { PaymentService } from 'app/process/modules/cb-app/view-beneficiaries/view-payment/payment.service';
import { Translator } from 'angular-translator';
import { Router } from '@angular/router';
import { SessionService } from 'app/common/services/session.service';
import { DatePipe } from '@angular/common';
import { CommonValidators } from 'app/common/validators/validators';
import { ListBranchCodesForBankRequest, ListBankNamesRequest, BankNames, ExternalBankDetailsProxyService, ListBranchCodesForBankResponse, ListBankNamesResponse } from 'app/common/services/proxy-services/external-bank-details-proxy.service';
import { Step } from 'app/common/ui-components/progress-indicator/step.model';
import { RequestHeader } from 'app/process/modules/cb-app/view-pay/view-pay.model';

import { DialogModalService } from 'app/common/ui-components/dialog-modal/dialog-modal.service';

import { ManageLimitsGetUserLimitsResponse } from 'app/common/services/proxy-services/manage-limits-proxy.service';
import { FormGroup, FormBuilder, Validators, AbstractControl, FormControl } from '@angular/forms';
import { ErrorDetail, FormData } from 'app/process/modules/cb-app/view-beneficiaries/view-payment/add-beneficiary/add-payment.model';
import { ViewPaymentService } from 'app/process/modules/cb-app/view-beneficiaries/view-payment/add-beneficiary/add-payment.service';
import { AddPaymentBeneficiaryComponent } from 'app/process/modules/cb-app/view-beneficiaries/view-payment/add-beneficiary/add-payment-stepManager/add-payment-beneficiary.component';
import { AbsaListedResultsComponent } from 'app/process/modules/cb-app/view-beneficiaries/view-payment/add-beneficiary/absa-listed-beneficiary/absa-listed-results/absa-listed-results.component';
import { FormRadioComponent } from 'app/common/ui-components/cb-form/form-radio/form-radio.component';
import { DataLossWarningService } from 'app/common/services/data-loss-warning.service';
import { RegularBeneficiaryManagementListRegularBeneficiariesProxyService } from 'app/common/services/proxy-services/regular-beneficiary-management-proxy.service';
import { LoaderService } from 'app/common/ui-components/custom-loader-spinner/loader.service';
import { BenExistDialogComponent } from 'app/process/modules/cb-app/view-beneficiaries/view-payment/add-beneficiary/ben-exist-dialog/ben-exist-dialog.component';
import { FormRadioGroupComponent } from "app/common/ui-components/cb-form/form-radio-group/radio-group.component";
import { Utils } from 'app/core/utils/utils';
import { InstitutionExistDialogComponentComponent } from 'app/process/modules/cb-app/view-beneficiaries/view-payment/add-beneficiary/institution-exist-dialog-component/institution-exist-dialog-component.component';
import { BeneficiariesFromBranchAndAccountRequest } from 'app/process/modules/cb-app/view-pay/pay/pay.service';
import { ProgressSpinnerService } from 'app/common/ui-components/progress-spinner/progress-spinner.service';
import { ScrollUtilService } from 'app/core/utils/scroll-util.service';
export interface SelectOptions {
  value: string
  label: string
}

class InstitutionRequest implements InstitutionalBeneficiariesEnquiryFetchInstitutionalBeneficiariesRequest {
  searchString: string;
  constructor(searchString: string) {
    this.searchString = searchString;
  }
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
  selector: 'app-absa-listed-details',
  templateUrl: './absa-listed-details.component.html',
  styleUrls: ['./absa-listed-details.component.scss'],
  providers: [ProgressSpinnerService]
})
export class AbsaListedDetailsComponent implements OnInit, AfterViewInit {


  matchFound: boolean = false;
  translations: object = {};
  institutionSubscriptionIndex: any;
  @Input() data: any;
  @Input() switchData: any;
  @ViewChild(FormRadioComponent) formRadioGoup: FormRadioComponent;
  //@ViewChildren(FormRadioComponent) formRadioButtons: QueryList<FormRadioComponent>;
  @ViewChildren(FormRadioGroupComponent) formRadioGroupsWrappers: QueryList<FormRadioGroupComponent>;
  private sourceAccounts$: Observable<FormDropdownOption[]>;
  nofiticationDetails$: Observable<AlrtVO>;
  private autoCompleteComponent: FormAutoCompleteComponent = new FormAutoCompleteComponent(null, null, null);

  translatedLabel = {
    'accountHoldersNameAt': '',
    'accountHolderReferenceAt': '',
    'bankAccount': '',
    's': '',

  };

  steps: Step[] = [new Step({ title: 'Details' }),
  new Step({ title: 'Confirm' }),
  new Step({ title: 'Result' })]

  private utils: Utils;

  alrtVO: AlrtVO;
  allSubcriptions: Subscription[] = [];
  setupForm: FormGroup;
  private formData: FormData;
  public institutionOptions: SelectOptions[] = [];
  public availableInstitionOptions: InstitutionalBenefificiary[];
  public availableBankOptions: BankNames[];
  public bankOptions: SelectOptions[] = [];
  public branchOptions: SelectOptions[] = [];
  radio_focus:any
  requestAttributes = new RequestHeader({});

  isValid: boolean;
  absaListedData: any;
  validationMessages: object = {};
  atInstitutionName = '';
  modifiedInstitutionName: string;
  insertS: string = '\'s';
  bankAccountSelected: string = '';
  bankAccountLabel: string = ''
  slabel: string = ''
  emptyNOP: boolean = false;

  notifyMeth: object = {};
  localCheckDialog : boolean = false;

  formStatus = {
    formErrors: {
      'institutionName': '',
      'bank': '',
      'branchCode': '',
      'accountNumber': '',
      'fromAccount': '',
      'checkboxIIP': '',
      'amount': '',
      'myReference': '',
      'accountHoldersRefNumber': '',
      'accountHoldersName': '',
      'beneficiaryReference': '',
      'notifyMeRadio': '',
      'notifyBeneficiaryRadio': '',
      'saveBeneficiaryRadio': '',
      'paymentTime': '',
      'beneficiaryType': '',
      'notifyMeSMS': '',
      'notifyMeEmail': '',

    },
    submitClicked: false
  };

  constructor(

    private institutionalBeneficiariesService: InstitutionalBeneficiariesEnquiryProxyService,
    private formBuilder: FormBuilder,
    private scrollUtils: ScrollUtilService,
    private payNewService: ViewPaymentService,
    private router: Router,
    private translator: Translator,
    private getNotificationProxyService: GetNotificationDetailsProxyService,
    private session: SessionService,
    private datePipe: DatePipe,
    private externalBankDetailsProxyService: ExternalBankDetailsProxyService,
    public viewContainerRef: ViewContainerRef,
    private dialogModalService: DialogModalService,
    private absaListed: AddPaymentBeneficiaryComponent, private dataLossWarningService: DataLossWarningService,
    private beneficiariesListService: RegularBeneficiaryManagementListRegularBeneficiariesProxyService,
    private loaderService: LoaderService,
    private cdr: ChangeDetectorRef,
    public progressSpinnerService: ProgressSpinnerService
  ) {

    this.requestAttributes.instructionType = 'VP';
    this.requestAttributes.beneficiaryStatusGroup = 'ACTIVE';
    this.requestAttributes.detailsRequired = false;

    this.utils = new Utils();

    this.requestAttributes.sortValues = { sortValueList: [{ sortFieldName: 'beneficiaryNumber', sortDirection: 'ASC' }] };

    //Subscription
    this.payNewService.closeDilogEmitter$.subscribe(dilogData => {
      if (dilogData.massage == "absaListedNext") {
        this.goNext(this.setupForm.value);
      }
    })

  }

  ngOnInit() {

    window.onscroll = null;
    this.payNewService.beneficiaryExist = false;
    this.payNewService.setIsFromAbsalisted(true);
    let absaListedFormData = this.payNewService.getFormData('absaListedBeneficiary');

    this.createSimpleForm();
    this.doTranslations();

    if(this.switchData !== undefined){
      this.setupForm.patchValue(this.switchData)
      this.fetchInstitutionBeneficiaries(this.switchData.institutionName);
      this.onInstitutionChange(this.switchData.institutionName);
      this.notifyMeth = {name:'N'}
      this.ownNOPOnOptionChange(this.notifyMeth);

      this.institutionOptions = [{value:this.switchData.institutionName , label : this.switchData.institutionName}];
    }

    if (absaListedFormData.institutionName !== '' && absaListedFormData.institutionName) this.setupForm.patchValue(absaListedFormData);

    this.payNewService.emitChange('showTabHeads');

    //Listen for institution name change
    this.allSubcriptions.push(this.setupForm.get('institutionName').valueChanges.subscribe(institutionName => {

      if (this.institutionOptions.find(institutionOption => institutionOption.label === institutionName)) {

        if (institutionName !== 'No match found' && institutionName !== 'Geen vuurhoutjie gevind nie') {

          this.atInstitutionName = institutionName;
          this.modifiedInstitutionName = institutionName;
          this.onInstitutionChange(institutionName);

          if (this.modifiedInstitutionName.substr(-1, 1).toUpperCase() !== 'S') {
            this.modifiedInstitutionName += this.insertS
            if (!this.cdr['destroyed']) {
              this.cdr.detectChanges();
            }
          }

        }

      } else {
        this.modifiedInstitutionName = undefined;
        this.atInstitutionName = undefined//this.translations['atThe']
        this.setupForm.controls['branchCode'].setValue('');
        this.setupForm.controls['accountNumber'].setValue('');

      }

    }));

if(this.payNewService.checkDialog){
  this.allSubcriptions.push(this.payNewService.acountEmiter.subscribe(absaListedName => {
    this.absaListedData = absaListedName;
    if (this.absaListedData) {
      this.fetchInstitutionBeneficiaries(this.absaListedData);
      this.setupForm.controls['institutionName'].setValue(this.absaListedData);
      this.institutionOptions=[{value: this.absaListedData, label: this.absaListedData}]
    }

  }))
  this.localCheckDialog = true;
  this.payNewService.checkDialog = false;
}



    //Execute when you not from confirm step or the form is empty
    //TODO: fix the condition
    let nomalData = this.payNewService.getFormData('normalBeneficiary');
    if ((absaListedFormData.institutionName === '' || !absaListedFormData.institutionName) && !this.setupForm.dirty) {


      if (nomalData.notifyMeRadio === '' || !nomalData.notifyMeRadio) {

        //initialize own NOP details with the data from user profile
        //If there are no value entered on normal beneficiary form and you are not from confirm step
        this.initializeNotificationDetails(absaListedFormData);
        this.payNewService.setIsFromNormal(false)

      } else {
        //Use the data from normal beneficiary form
        this.setupForm.controls['notifyMeRadio'].setValue(nomalData.notifyMeRadio);
        this.setupForm.controls['notifyMeSMS'].setValue(nomalData.notifyMeSMS);
        this.setupForm.controls['notifyMeEmail'].setValue(nomalData.notifyMeEmail);
        this.setupForm.controls['notifyMeFaxNumber'].setValue(nomalData.notifyMeFaxNumber);
        this.setupForm.controls['notifyMeFaxCode'].setValue(nomalData.notifyMeFaxCode);
        this.setupForm.controls['myReference'].setValue(nomalData.myReference);

        absaListedFormData = this.payNewService.getFormData('absaListedBeneficiary');
        this.setupRadioGroup(absaListedFormData)
        this.notifyMeth = {name: nomalData.notifyMeRadio}
        this.ownNOPOnOptionChange(this.notifyMeth);
        this.payNewService.setIsFromNormal(false)

      }

    }else if(this.payNewService.getIsFromNormal()){
       //Use the data from normal beneficiary form

       this.payNewService.setIsFromNormal(false)
       this.setupForm.controls['notifyMeRadio'].setValue(nomalData.notifyMeRadio);
       this.setupForm.controls['notifyMeSMS'].setValue(nomalData.notifyMeSMS);
       this.setupForm.controls['notifyMeEmail'].setValue(nomalData.notifyMeEmail);
       this.setupForm.controls['notifyMeFaxNumber'].setValue(nomalData.notifyMeFaxNumber);
       this.setupForm.controls['notifyMeFaxCode'].setValue(nomalData.notifyMeFaxCode);
       this.setupForm.controls['myReference'].setValue(nomalData.myReference);
       const notifyData = this.payNewService.getFormData('absaListedBeneficiary');
       this.notifyMeth = {name: notifyData['notifyMeRadio']}
       this.ownNOPOnOptionChange(this.notifyMeth);
    }
    else{

      this.payNewService.setIsFromNormal(false)
      const notifyData = this.payNewService.getFormData('absaListedBeneficiary');
      this.notifyMeth = {name: notifyData['notifyMeRadio']}
      this.ownNOPOnOptionChange(this.notifyMeth);
    }

    //Set Institution name when user hit back button on step 2 [Confirm step]
    if (absaListedFormData['institutionName'] !== '') {
      this.institutionOptions = this.payNewService.getInstitutionOptions();
    }

  }

  private fetchInstitutionBeneficiary(institute): void {
    const request = new InstitutionRequest(institute)

    this.allSubcriptions.push(this.institutionalBeneficiariesService.fetchInstitutionalBeneficiaries(request)
      .subscribe(
        response => {
          this.setupForm.controls['branchCode'].setValue(response.institutionalBeneficiaries[0].institutionCode);
          this.setupForm.controls['accountNumber'].setValue(response.institutionalBeneficiaries[0].institutionAccountNumber);
        },
        error => console.log('Error fetching Beneficiaries', error)
      ))
  }

  setupRadioGroup(formData?) {
    setTimeout(() => {

      let currentOpt = formData[this.formRadioGoup.data.name]

      if (currentOpt && currentOpt !== 'N') {
        this.formRadioGoup.data.options.forEach(option => {

          if (option.name === currentOpt) {

            //Check the correct radio option
            this.formRadioGoup.currentOption = option;

            let formRadioGroupsWrapper = this.formRadioGroupsWrappers.find(frgw => frgw.data.name === option.inputID)

            //Open the relevent input field
            if (formRadioGroupsWrapper) {
              this.formRadioGoup.currentRadioField = formRadioGroupsWrapper;
            }

          }

        });
      }
    }, 0)
  }

  ngAfterViewInit() {
    this.scrollUtils.scrollTo({setTimeoutValue: 0});

    const formData = this.payNewService.getFormData('absaListedBeneficiary');
    this.setupRadioGroup(formData);
  }

  validateOnBlur(value) {

    var temp = this.setupForm.get(value).value
    temp = temp.trim();
    if (temp !== "") {
      this.trimfield(value)
    }

    if (!this.setupForm.controls[value].valid && this.setupForm.controls[value].touched) {
      const messages = this.validationMessages[value]
      if (messages && value !== "institutionName") {
        this.formStatus.formErrors[value] = '';
        for (const key in this.setupForm.controls[value].errors) {
          this.formStatus.formErrors[value] += messages[key] + ' '
        }

      }
      this.formStatus.submitClicked = true;
      this.setupForm.controls[value].markAsDirty();
      // this.trimfield('accountHoldersName')
    }

  }

  markAllAsDirty() {


    // Mark all fields as dirty to trigger validation
    for (const key in this.setupForm.controls) {
      // if (!(key.indexOf('notifyMe') > -1)) {
      //   this.setupForm.controls[key].markAsDirty()
      // }
      this.setupForm.controls[key].markAsDirty()

    }
    if (this.setupForm.controls['notifyMeRadio'].value === 'F') {
      if (this.setupForm.controls['notifyMeFaxCode'].value === '') {
        this.emptyNOP = true;
      }
    }
    this.onValueChanged();


  }

  onValueChanged(data?: any) {



    if (!this.setupForm) { return; }

    const form = this.setupForm;
    this.payNewService.setFormData(form.value, 'absaListedBeneficiary');

    for (const field in this.formStatus.formErrors) {
      // clear previous error message (if any)
      this.formStatus.formErrors[field] = ''
      const control = form.get(field)

      if (control) {
        if (control.dirty && !control.valid) {
          const messages = this.validationMessages[field]

          // tslint:disable-next-line:forin
          if (messages) {
            for (const key in control.errors) {
              this.formStatus.formErrors[field] += messages[key] + ' '
            }
          }
        }
      }

    }

    for (const key in this.setupForm.controls) {
      let filledControlFound = false;
      if (!(key.indexOf('notifyMe') > -1) && key !== 'saveBeneficiaryRadio' && key !== 'beneficiaryType') {
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
  }

  next(formModel) {
    this.formStatus.submitClicked = true;
    this.markAllAsDirty();
    this.updateValidations();
    if (this.setupForm.valid) {
      this.checkBeneficiariesForBranchAndAccount()
    }
    else{
      this.payNewService.emitChange('scrollAbsaListed');
    }
  }

  checkBeneficiariesForBranchAndAccount() {
    // TODO: account number validation
    const request = new BeneficiariesFromBranchAndAccountRequest(
      this.setupForm.value.accountNumber,
      this.setupForm.value.branchCode
    );

    this.loaderService.startLoading();
    this.allSubcriptions.push(this.payNewService.fetchFromBranchAccount(request).subscribe(
      response => {
        this.loaderService.stopLoading();
        if (response.typeOfBeneficiaryList !== 'N') {

          if (response.typeOfBeneficiaryList === 'D' || response.typeOfBeneficiaryList === 'P') {
            this.openBeneficiaryExistsDialog(response.typeOfBeneficiaryList);
            this.payNewService.beneficiaryExist = true;
          } else {
            this.submitForm();
            this.payNewService.beneficiaryExist = false;
          }
        } else {
          this.submitForm();
          this.payNewService.beneficiaryExist = false;
        }

      },
      error => {
        this.loaderService.stopLoading();
        console.log('error fetching beneficiariesForBranchAndAccount', error);
        this.submitForm();
      }
    ))
  }

  openBeneficiaryExistsDialog(typeOfBeneficiaryList): void {
    console.log('SetupPayNewNewBeneficiaryComponent openBeneficiaryExistsDialog')

    /*
      I("InstitutionalBeneficiary"),
      V("OwnDefinedBeneficiary"),
      O("OnceOffPayment"),
      D("InstitutionalAndOwnDefinedBeneficiary"),
      P("InstitutionalAndOnceOffPaymentBeneficiary"),
      N("None")
    */
    switch (typeOfBeneficiaryList) {
      case 'D': {
        const data = {
          styles: { containerStyle: {
            'width': '75% ',
            'max-width': '767px',
            'min-height': '350px',
            'padding': '0px 0px 0px 0px',
            'height': 'initial' },
        closeIconStyle: {
          'height': '0',
          'margin': '0 0 -22px 0px'
        }
        },
          icon: true
        }
        this.dialogModalService.CustomDialogModal(InstitutionExistDialogComponentComponent,
          this.viewContainerRef,
          data)
          .subscribe((res) => {
            if (this.payNewService.getAddBeneficiaryIndicator() === true) {
              this.payNewService.setAddBeneficiaryIndicator(false);
              //this.payNewService.setTransactionType('pay-new');
              this.submitForm();
            } else if (this.payNewService.getUseExistingBeneficiaryIndicator()) {
              this.payNewService.setUseExistingBeneficiaryIndicator(false);
              this.payNewService.emitChange('step1Cancel');
              //this.payNewService.setTransactionType('once-off');
              // this.submitForm(true);
            }
          });
        break;
      }
      default:
        console.log('typeOfBeneficiaryList = ' + typeOfBeneficiaryList)
        break;
    }
    return;
  }

  submitForm(existingFormData?: boolean) {
    if (existingFormData) {
      this.payNewService.emitChange('AbsaListedStep1Next');
      return false;
    }
    this.formStatus.submitClicked = true;
    this.markAllAsDirty();
    //this.doValidation();
    if (this.setupForm.valid) {
      this.payNewService.setFormData(this.setupForm.value, 'absaListedBeneficiary');
      this.payNewService.emitChange('AbsaListedStep1Next');
    }
    return false;
  }


  goNext(formModel) {

    formModel.beneficiaryType = "AbsaListed";
    this.payNewService.setFormData(formModel, 'absaListedBeneficiary');
    this.payNewService.emitChange('AbsaListedStep1Next');

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

  private initializeNotificationDetails(formData: FormData): void {
    if (formData.notifyMeSMS === '') {

      this.allSubcriptions.push(this.payNewService.nofiticationDetails$.subscribe(
        alrtVO => {
          this.setupForm.controls['notifyMeSMS'].setValue(alrtVO.cellNumber);
          this.setupForm.controls['notifyMeEmail'].setValue(alrtVO.email);
          this.setupForm.controls['notifyMeFaxNumber'].setValue(alrtVO.faxNumber);
          this.setupForm.controls['notifyMeFaxCode'].setValue(alrtVO.faxCode);
          this.setupForm.controls['notifyMeRadio'].setValue(alrtVO.preferredPopMethod);

          // formData = this.payNewService.getFormData('absaListedBeneficiary');
          // this.setupRadioGroup(formData)
          this.ownNOPOnOptionChange(alrtVO.preferredPopMethod);
          return alrtVO;
        },
        error => console.error(' Error ')
      ))
    }
  };

  createSimpleForm() {
    this.formBuilder = new FormBuilder();
    this.setupForm = this.formBuilder.group({
      institutionName: [this.absaListedData===undefined? '': this.absaListedData , [this.validateInstitutionName()] ], //Validate.isNoMatchFound , Validate.noSpecialCharectorsOnName,Validate.noSpecialCharectors
      accountNumber: ['',],
      bank: ['',],
      branchCode: ['',],
      date: [''],
      accountHoldersRefNumber: new FormControl('', { validators: [Validators.required, this.noSpaceLeading(), Validate.noSpecialCharectors], updateOn: 'blur' }),
      accountHoldersName: new FormControl('', { validators: [Validators.required, this.noSpaceLeading(), Validate.noSpecialCharectors], updateOn: 'blur' }),
      myReference: new FormControl('', { validators: [Validators.required, Validators.maxLength(20), this.noSpaceLeading(), Validate.noSpecialCharectors], updateOn: 'blur' }),
      notifyMeRadio: ['N'],
      notifyMeSMS: new FormControl('', { validators: [Validators.required], updateOn: 'blur' }),
      notifyMeEmail: new FormControl('', { validators: [Validators.required], updateOn: 'blur' }),
      notifyMeFaxNumber: new FormControl('', { validators: [Validators.required], updateOn: 'blur' }),
      notifyMeFaxCode: new FormControl('', { validators: [Validators.required], updateOn: 'blur' }),
      paymentTime: [{ value: '', disabled: true }],
      saveBeneficiaryRadio: ['Y'], // Do not delete this value
      beneficiaryType: ['AbsaListed'] // Do not delete this value
    });
    this.allSubcriptions.push(this.setupForm.valueChanges.subscribe(data => this.onValueChanged(data)

    ));

    // this.setupForm.controls.accountHoldersName.valueChanges.subscribe(accountHoldersName =>
    //   this.trimFieldName(accountHoldersName, 'accountHoldersName')
    // )

    this.onValueChanged();
  }

  validateInstitutionName() {
    return (control: AbstractControl) => {

      const institutionName = control.value;

      // if(this.switchData !== undefined){
      //   this.institutionOptions = [{value:this.switchData.institutionName , label : this.switchData.institutionName}];
      // }
      if (!(this.utils.isNullOrEmpty(institutionName))) {
        if(this.localCheckDialog){
          this.institutionOptions = [{value:institutionName , label : institutionName}];
          this.localCheckDialog = false;
        }

        const institutionMatch = this.institutionOptions.filter(
          institutionOption => institutionOption.value === this.setupForm.controls['institutionName'].value);
        if (institutionMatch.length === 0) {
          return { noBeneficiaryNameMatchFound: false };
        }
      } else {
        return { required: false }
      }
    }
  }

  // private getInsName(institute): any {
  //   const request = new InstitutionRequest(institute)
  //   //For getting accurate search result on slow network -- It cancel the previous request
  //   if (this.allSubcriptions.length > 0 && this.institutionSubscriptionIndex) {
  //     if (this.allSubcriptions[this.institutionSubscriptionIndex]) {

  //       this.allSubcriptions[this.institutionSubscriptionIndex].unsubscribe();
  //       this.allSubcriptions.splice(this.institutionSubscriptionIndex, 1)
  //       this.institutionSubscriptionIndex = undefined;
  //     }
  //   }

  //   this.allSubcriptions.push(this.institutionalBeneficiariesService.fetchInstitutionalBeneficiaries(request)
  //     .subscribe(
  //       response => {
  //         if(response !== undefined && response !== null){
  //          var res= response.institutionalBeneficiaries.filter(instName => {
  //             return instName.institutionName=institute;

  //           })
  //           if(res.length!=0){
  //               this.institutionOptions = [{value:this.switchData.institutionName , label : this.switchData.institutionName}];
  //             }
  //         }
  //       },
  //       error => console.log('Error fetching Beneficiaries', error)
  //     ))

  //   this.institutionSubscriptionIndex = this.allSubcriptions.length - 1;

  // }

  noSpaceLeading() {
    return (control: AbstractControl) => {
      const accountHolderName = control.value;

      if (accountHolderName.charAt(0) === ' ') {
        return { isSpace: false }
      }

    }
  }

  trimFieldName(value, fieldValue) {
    let firstNameTrim = value;
    firstNameTrim = firstNameTrim.trim();
    if (this.setupForm !== undefined && firstNameTrim !== '') {
      this.setupForm.controls[fieldValue].setValue(firstNameTrim, { onlySelf: true, emitEvent: false });
    }
  }

  trimfield(refType) {
    var field = this.setupForm.controls[refType].value.trim();
    this.setupForm.controls[refType].setValue(field);
  }

  doTranslations() {
    this.translator.waitForTranslation().then(() => {
      this.translator.observe(['pay.label.fullNameRequired',//0
        'pay.label.isValidBeneficiaryName',//1
        'pay.label.minlength',//2
        'pay.label.maxlength',//3
        'pay.label.bankRequired',//4
        'pay.label.branchCodeRequired',//5
        'common.message.selectAccount',//6
        'common.message.selectAccount',//7
        'pay.label.dateRequired',//8
        'pay.label.accountHoldersNameAt',//9
        'paymentBeneficiaries.addBeneficiaries.validationMessage.accountHoldersNameAtInst',//10
        'paymentBeneficiaries.label.accountHoldersNameRequired',//11
        'pay.label.s',//12
        'paymentBeneficiaries.addBeneficiaries.bankOptions.notFound', //13
        'common.label.atInst',//14
        'pay.label.noMatchFound', // 15
        'pay.label.institutionNameRequired', // 16
        'common.message.contactDetailsExists2', // 17
        'cashSendBeneficiaries.validation.validRef', //18
        'pay.label.paymentMadeByNoSpaces', // 19
        'pay.label.yourRefenceAlphaNumeric', // 20
        'paymentBeneficiaries.addBeneficiaries.validationMessage.reference.required', // 21
        'pay.label.institutionAccountNumberRequired', // 22
        'paymentBeneficiaries.label.accountHoldersNameAtNoSpace', // 23
      ])
        .subscribe((translations) => {
          this.validationMessages = {
            'institutionName': {
              'required': translations[16],
              'noBeneficiaryNameMatchFound': translations[15],

            },
            'accountHoldersName': {
              'required': translations[11],
              'noSpecialCharectors': translations[18],
              'isSpace': translations[19],
            },
            'accountHoldersRefNumber': {
              'required':  translations[22],
              'noSpecialCharectors': translations[18],
              'isSpace': translations[23]
            },
            'myReference': {
              'required': translations[21],
              'noSpecialCharectors': translations[18],
              'isSpace': translations[20],
            },
            'notifyMeSMS': {
              'required': translations[17],
            },
            'notifyMeEmail': {
              'required': translations[17],
            }

          };

          this.translatedLabel.accountHoldersNameAt = translations[9];
          this.translatedLabel.accountHolderReferenceAt = translations[10];
          this.bankAccountSelected = translations[14];
          this.slabel = translations[13];
          this.bankAccountLabel = translations[12];
          this.translatedLabel.bankAccount = this.bankAccountLabel;


          this.insertS = translations[12]
          this.translations['not_found'] = translations[13]

          this.translations['atThe'] = translations[14]

          this.allSubcriptions.push(this.setupForm.valueChanges.subscribe(data => this.onValueChanged(data)));
          this.onValueChanged();
        })
    })
  }

  onInstitutionChange(institutionName) {
    // setTimeout may be temporary. value does not change immediatelly
    setTimeout(() => {

      //Keep institutions before filtering the institutions array
      var tempInstitutions = this.availableInstitionOptions;
      if (this.availableInstitionOptions) {

        this.availableInstitionOptions = this.availableInstitionOptions.filter(institutions => institutions.institutionName === institutionName);

        if (this.availableInstitionOptions.length === 1) {

          // tslint:disable-next-line:no-unused-expression
          this.setupForm.controls['bank'].setValue(this.availableInstitionOptions[0].institutionName);
          this.setupForm.controls['branchCode'].setValue(this.availableInstitionOptions[0].institutionCode);
          this.setupForm.controls['accountNumber'].setValue(this.availableInstitionOptions[0].institutionAccountNumber);
          this.modifiedInstitutionName = institutionName
          this.atInstitutionName = institutionName;



          if (this.modifiedInstitutionName.substr(-1, 1).toUpperCase() !== 'S') {
            this.modifiedInstitutionName += this.insertS
            if (!this.cdr['destroyed']) {
              this.cdr.detectChanges();
            }
          }

        } else if (this.availableInstitionOptions.length > 1) {
          //alert('more than one institution of this name found')
          //TODO: show pop up if there are more than 2 institutionCodes in the list
        }
      }
      //put back the institutions that were found
      this.availableInstitionOptions = tempInstitutions;

    }, 500)
  }
  onInstitutionKeyup(e) {

    e.preventDefault();
    this.fetchInstitutionBeneficiaries(e.target.value);

    // if (this.autoCompleteComponent.isValidKeySelected(e)) {
    //   alert(e.target.value)
    //   this.fetchInstitutionBeneficiaries(e.target.value);
    // }
  }
  private fetchInstitutionBeneficiaries(institute): void {
    const request = new InstitutionRequest(institute)
    //For getting accurate search result on slow network -- It cancel the previous request
    if (this.allSubcriptions.length > 0 && this.institutionSubscriptionIndex) {
      if (this.allSubcriptions[this.institutionSubscriptionIndex]) {

        this.allSubcriptions[this.institutionSubscriptionIndex].unsubscribe();
        this.allSubcriptions.splice(this.institutionSubscriptionIndex, 1)
        this.institutionSubscriptionIndex = undefined;
      }
    }

    this.allSubcriptions.push(this.institutionalBeneficiariesService.fetchInstitutionalBeneficiaries(request)
      .subscribe(
        response => this.buildInstitutionalBeneficiaries(response),
        error => console.log('Error fetching Beneficiaries', error)
      ))

    this.institutionSubscriptionIndex = this.allSubcriptions.length - 1;

  }

  buildInstitutionalBeneficiaries(response) {

      this.institutionOptions = response.institutionalBeneficiaries.map(beneficiary => {
        return { value: beneficiary.institutionName, label: beneficiary.institutionName }
      });


    this.availableInstitionOptions = response.institutionalBeneficiaries;

    //Keep institutionOptions to avoid unnecessary back-services calls when user hit back on confirm step [step 2]
    this.payNewService.setInstitutionOptions(this.institutionOptions);


    if (this.absaListedData)
      this.onInstitutionChange(this.absaListedData);
  }

  ownNOPOnOptionChange(currentOption) {
    this.emptyNOP = false;
    switch (currentOption.name) {
      case 'N':
        //Clear all validators
        this.removeValidators();
        this.updateValidations();
        break;
      case 'S':
        this.removeValidators();
        this.updateValidations();
        this.setValidators('notifyMeSMS')
        break;
      case 'E':
        this.removeValidators();
        this.updateValidations();
        this.setValidators('notifyMeEmail')
        break;
      case 'F':
        this.removeValidators();
        this.updateValidations();
        this.setValidators('notifyMeFaxCode')
        this.setValidators('notifyMeFaxNumber')


        break;
    }
  }

  removeValidators() {
    this.setupForm.get('notifyMeSMS').clearValidators();
    this.setupForm.get('notifyMeEmail').clearValidators();
    this.setupForm.get('notifyMeFaxCode').setValidators([])
    this.setupForm.get('notifyMeFaxNumber').setValidators([])

  }
  updateValidations() {
    this.setupForm.get('notifyMeEmail').updateValueAndValidity();
    this.setupForm.get('notifyMeFaxCode').updateValueAndValidity();
    this.setupForm.get('notifyMeFaxNumber').updateValueAndValidity();
    this.setupForm.get('notifyMeSMS').updateValueAndValidity();
  }

  // trimfield(refType) {
  //   // var field = this.setupForm.controls[refType].value.trim();
  //   // this.setupForm.controls[refType].setValue(field);
  // }

  setValidators(controlName?) {

    for (const key in this.setupForm.controls) {

      if (key.indexOf('notifyMe') > -1) {
        if (key === controlName) {
          this.setupForm.get(controlName).setValidators([Validators.required]);
        }
      }

    }

  }



  removeValidation(controlName) {

  }

  ngOnDestroy() {
    //Memory leak prevention
    this.allSubcriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    this.cdr.detach();
  }

  openDialog(): void {
    const data = {
      styles: { containerStyle: {
        'width': '75% ',
        'max-width': '640px ',
        'padding': '0px 0px 0px 0px',
        'height': 'initial' },
    closeIconStyle: {
      'height': '0',
      'margin': '0 0 -22px 0px'
    }
    },
      icon: true
    }
    this.dialogModalService.CustomDialogModal(InstitutionExistDialogComponentComponent, this.viewContainerRef, data).subscribe((res) => {
      if (this.payNewService.getAddBeneficiaryIndicator() === true) {
        this.payNewService.setAddBeneficiaryIndicator(false);
        this.submitForm();
      } else if (this.payNewService.getUseExistingBeneficiaryIndicator()) {
        this.payNewService.setUseExistingBeneficiaryIndicator(false);
        this.payNewService.emitChange('step1Cancel')
        //this.submitForm(true);
      }
    })
  }

  keyDownFunction(e, formModel) {

    if (e.keyCode === 13) { // enter
      this.next(formModel);
    }

  }

  @HostListener('document:click', ['$event'])
  private onOutsideTooltipClick(event:Event) {
  var element = event.target as HTMLElement;
  if(element.classList.contains('radio-control__input')||element.classList.contains('radio-subfield')){
    this.radio_focus=1;
  }else{
    this.radio_focus=0;
  }

  }

}

const BENEFICIARYNAME_LEADINGSPACES_REGEXP = /^[a-zA-Z0-9!@#$&()\\-`.+,/\"][a-zA-Z0-9!@#$&()\\-`.+,/\"\s]*$/
const test = /^(?![]+$)[@&;\'()_+-=:.\/a-zA-Z0-9 ]+$/
function isEmpty(value: any) {
  return value == null || value.length === 0;
}
export class Validate {

  static isNoMatchFound(control: AbstractControl) {
    if (control.value === 'No match found' || control.value === 'Geen vuurhoutjie gevind nie') {
      return { "isNoMatchFound": true };
    }
    return null;
  }
  static noLeadingSpaces(control: AbstractControl) {

    if (!isEmpty(control.value) && !BENEFICIARYNAME_LEADINGSPACES_REGEXP.test(control.value)) {
      return { 'noLeadingSpaces': true };
    }
    return null;
  }
  static noSpecialCharectorsOnName(control: AbstractControl) {
    if (!(/^[\w()\s.]*$/.test(control.value))) {
      return { 'noSpecialCharectors': true };
    }
    return null;
  }

  static noSpecialCharectors(control: AbstractControl) {

    var BENEFICIARY_NAME_VALIDATION_REGEXP = /^(?![]+$)[@&;\'()_+-=:.\/a-zA-Z0-9 ]+$/;

    if (!isEmptyInputValue(control.value) && (!BENEFICIARY_NAME_VALIDATION_REGEXP.test(control.value))) {
      return { 'noSpecialCharectors': true };
    }
    return null;
  }
}



function isEmptyInputValue(value: any): boolean {
  // we don't check for string here so it also works with arrays
  return value == null || value.length === 0;
}
