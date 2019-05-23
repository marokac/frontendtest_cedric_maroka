import { Component, OnInit, Input, HostListener } from '@angular/core';
import { Observable } from "rxjs/Observable";
import { RegularBeneficiaryManagementGetBeneficiariesForBranchAndAccountResponse } from "app/common/services/proxy-services/regular-beneficiary-management-proxy.service";
import { DialogModalService } from "app/common/ui-components/dialog-modal/dialog-modal.service";
import { ActivatedRoute, Router } from "@angular/router";
import { ViewPaymentService } from "app/process/modules/cb-app/view-beneficiaries/view-payment/add-beneficiary/add-payment.service";

import { Tab } from 'app/common/ui-components/tabbed-nav/tab.model';
import { Subscription } from 'rxjs/Subscription';
import { Sort } from '@angular/material';
import { FormGroup, FormControl } from '@angular/forms';
import { DataLossWarningService } from '../../../../../../../common/services/data-loss-warning.service';

@Component({
  selector: 'app-absa-listed-dialog',
  templateUrl: './absa-listed-dialog.component.html',
  styleUrls: ['./absa-listed-dialog.component.scss'],
  providers: []
})
export class ViewPaymentAbsaListedDialogComponent implements OnInit {

  subscription: Subscription
  @Input() accountFromBranch: RegularBeneficiaryManagementGetBeneficiariesForBranchAndAccountResponse;

  setTab: any;
  id: number = null;
  tabsData: Tab[] = [];
  myValue = false;
  selectedAbsaListedPosition: number;
  institutionForm: FormGroup;
  notSelected: boolean = true;
  isNoBeneficiarySelectedError:boolean;
  AbsaListedData;
  sortedData:any
  sortByAcc :boolean
  sortcode:boolean
  sortByName:boolean
  

 
  accountFromBranch$: Observable<RegularBeneficiaryManagementGetBeneficiariesForBranchAndAccountResponse>;
  constructor(private dialogModalService: DialogModalService,
    private payNewService: ViewPaymentService,
    private route: ActivatedRoute,
    private router: Router,
    private dataLossWarningService: DataLossWarningService,
  ) { }

  selectAbsaListedBeneficiary(position,value) {
    this.selectedAbsaListedPosition = position;
    this.isNoBeneficiarySelectedError = false;
    this.notSelected=false;
    this.institutionForm.controls['institution'].setValue(value);
  }

  onModalClose() {
    this.dialogModalService.closeModalDialog();
  }

  gotoAbsaListed() {
  //Get name of the absa-listed beneficiary that user selected
   
    if(this.notSelected){
      this.showNoBeneficiarySelectedError();
      return false;
    }
   else{
    this.dialogModalService.closeModalDialog();
    setTimeout(() => {
      let selectedAbsaListed = this.accountFromBranch.institutionalBeneficiaries[this.selectedAbsaListedPosition].institutionName;
      this.absalist(selectedAbsaListed);
      this.payNewService.emitInstitutionName(selectedAbsaListed);
    }, 0);
  }

  }

  ngOnInit() {
    this.payNewService.checkDialog = true;
    this.sortByAcc=false
    this.sortcode=false
    this.sortByName=false
    this.isNoBeneficiarySelectedError=false;
      this.subscription = this.payNewService.accountFromBranch$.subscribe(
        response => { 
          this.accountFromBranch = response;
          this.AbsaListedData = this.accountFromBranch.institutionalBeneficiaries;
          this.sortRows('institutionName')
          return response;
        },
        error => {
          console.log('Error displaying account from branch');
        }
      )
     this.createSimpleForm();

  }

  createSimpleForm(formData?: FormData) {
    this.institutionForm = new FormGroup({
      institution: new FormControl('')
    });
  }
  ngOnDestroy(){
    this.subscription.unsubscribe();
  }

  absalist(institutionAccountnumber) {
    this.dataLossWarningService.setDirtyFlag(false);
    this.payNewService.emitChange({ move: 'movetoAbasalist2', institution: institutionAccountnumber })
  }

   showNoBeneficiarySelectedError() {
   this.isNoBeneficiarySelectedError = true;
    } 
    
    onCancelClick() {
      this.dataLossWarningService.setDirtyFlag(false);
      this.dialogModalService.closeModalDialog();
      return false;
    }


    columnActiveDirection:any = {
      institutionName:'asc',
      institutionCode: 'asc',
      institutionAccountNumber:'asc',
    }


    sortRows(colName) {
      this.sortstyle(colName)
      switch (this.columnActiveDirection[colName]) {
        case 'asc':
        this.AbsaListedData.sort(function (value1, value2) {
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
        this.AbsaListedData.sort(function(value1, value2) {
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
  
    sortstyle(sortName){
      switch(sortName){
        case'institutionName':{
         this.sortByName = !this.sortByName;
         this.sortcode=false;
         this.sortByAcc=false;
        break;
        }
        case'institutionCode':{
         this.sortcode= !this.sortcode;
         this.sortByName=false;
         this.sortByAcc=false;
         
         break;
        }
        case'institutionAccountNumber':{
         this.sortByAcc= !this.sortByAcc;
         this.sortcode=false;
         this.sortByName=false;
      
         break;
        }
       
      }
     }
}
