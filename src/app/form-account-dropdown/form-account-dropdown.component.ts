import { Component, NgZone, OnInit, Input, ElementRef, forwardRef, OnChanges, AfterViewInit, EventEmitter, Output, ViewChild } from '@angular/core';
import { FormControl, ControlValueAccessor, FormGroup, NG_VALUE_ACCESSOR, NG_VALIDATORS } from '@angular/forms';
import { FormAccountDropdown } from './form-account-dropdown.model';
import { FormAccountDropdownOption } from './form-account-dropdown-option.model';
import { DropdownOptionDisableFilter } from './../../../pipes/dropdownOptionDisableFilter';
import { Utils } from 'app/core/utils/utils'
import { LoaderService } from 'app/common/ui-components/custom-loader-spinner/loader.service';
import { DataLossWarningService } from 'app/common/services/data-loss-warning.service';

@Component({
  selector: 'form-account-dropdown',
  templateUrl: './form-account-dropdown.component.html',
  styleUrls: ['./form-account-dropdown.component.scss'],
  host: {
    '(document:click)': 'onOutsideClick($event)',
    'class': 'form-accountdropdown'
  },
  providers: [
    // tslint:disable-next-line:no-forward-ref
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => FormAccountDropdownComponent), multi: true }
  ]
})
export class FormAccountDropdownComponent implements OnInit, OnChanges, ControlValueAccessor, AfterViewInit {
  @Input() data: FormAccountDropdown // = new FormAccountDropdown();
  @Input() parentFormGroup: FormGroup;
  @Input() formStatus: any = {};
  @Input() autofocus = false;
  @Input() disabledOption = {
    label: '',
    value: '',
    balance: '',
    hasFocus: false,
    accountType: ''
  };
  @Input() disabled = false;
  @Input() enableOnScrollLoad = true;
  @Output() valueChanged = new EventEmitter<any>();
  @Output() focus = new EventEmitter();
  @Output() focusout = new EventEmitter();
  @ViewChild('elementValue') eValue;
  private utils: Utils

  value: string
  private _currentOption: FormAccountDropdownOption;
  accountOptions: any = [];
  dropdownIsOpen: boolean = false;
  ariaDescribedBy: string = '';
  propagateChange: any = () => { };
  validateFn: any = () => { };
  _onTouched: any = () => { };
  loadedOptions: FormAccountDropdownOption[] = [];
  initialLoad = 20;
  batchLoad = 20;
  isLoadingMore: boolean = false;
  hideBalance = false;
  numberOfChanges = 0;

  constructor(private _eref: ElementRef, private loaderService: LoaderService,
               private dataLossWarningService: DataLossWarningService) {
    this.accountOptions = [];
    this.utils = new Utils();
  }

  ngOnInit() {
    this.ariaDescribedBy = 'err_' + this.data.name;

    this.currentOption = this.data.selectedAccount === '' ? { label: this.data.placeholder, value: '', balance: '', accountType: '' } : this.data.selectedAccount;
    if (this.data.selectedAccount !== '') {
      this.propagateChange(this.data.selectedAccount)
    }

    if (this.loadedOptions.length === 1) {
     this.currentOption = this.loadedOptions[0];
     this.parentFormGroup.controls[this.data.name].setValue(this.currentOption, {emitEvent: false});
     this.loadedOptions[0]['highlight'] = true;
     this.dataLossWarningService.setDirtyFlag(false);
    }

    this.hideBalance = this.data.hideBalance;
  }

  ngAfterViewInit() {
    // this.loaderService.templateRenderingStatus.next(true);
    if (this.autofocus) {
      setTimeout(() => {
       this.eValue.nativeElement.focus();
      }, 0)
    }
  }

  ngOnChanges(changes) {
    // console.log('------FormAccountDropdownComponent: ngOnChanges >> ', changes);

    // Noticed that ngOnChanges ran if the component was first initialized with no data, and again afterwards to push "Select Account" at the top.
    // And one more time when the data came through (slow connections)
    if (this.utils.isNullOrEmpty(this.data.options)) {
      return;
    }

    if (!this.enableOnScrollLoad) {
      this.initialLoad = this.data.options.length;
    } else if (this.data.options.length < this.initialLoad) {
      this.initialLoad = this.data.options.length;
    }

    if (this.loadedOptions.length === 0) { // only need to run this once to populate, else leads to duplication of data
      for (let i = 0; i < this.initialLoad; i++) {
        this.loadedOptions.push(this.data.options[i]);
      }
    }

    if (this.accountOptions.length > 0
    &&  this.disabledOption !== this.accountOptions[0].value) {
      this.loadedOptions.push(this.accountOptions[0]);
      this.accountOptions = [];
    }

    // Sometimes the value was present in changes.disabledOption.currentValue and sometimes in changes.disabledOption.currentValue.value
    // Fixed issue where the dropdown was not being manipulated correctly when comiing through from the top nav or from an account tile

    let tmp;
    if (changes.disabledOption) {
      let optionAvailable = false;
      if(this.numberOfChanges !== 0){
       this.loadedOptions.forEach((option) => {
         if(option.value === this.disabledOption.value){
            optionAvailable = true;
         }
       });
       if(!optionAvailable && this.data.selectedAccount.number === '') {
         this.loadedOptions.push(this.disabledOption);
       }
      }
      this.numberOfChanges++;
      if (changes.disabledOption.currentValue) {
        if (changes.disabledOption.currentValue.value) {
          tmp = changes.disabledOption.currentValue.value;
        } else {
          tmp = changes.disabledOption.currentValue;
        }
      }
    }

    if ( !this.utils.isUndefined(tmp)
      && !this.utils.isNullOrEmpty(tmp) ) {
      for (let i = 0; i < this.loadedOptions.length; i++) {
        if (i === this.initialLoad) {
          // console.log('FormAccountDropdownComponent: ngOnChanges and i == initialLoad ', this.initialLoad);
          break;
        }
        if (this.loadedOptions[i]['value'] === tmp) {
          this.accountOptions[0] = this.loadedOptions[i];
          this.loadedOptions.splice(i, 1);
          if (this.loadedOptions.length === 1) {
            this.currentOption = this.loadedOptions[0];
            console.log(this.parentFormGroup.controls[this.data.name].value);
             this.parentFormGroup.controls[this.data.name].setValue(this.loadedOptions[0]);
            this.loadedOptions[0]['highlight'] = true;
            this.dataLossWarningService.setDirtyFlag(false);
          }

          this.disabledOption = tmp;
        }
      }
    }

    if (changes.disabled) {
      this.disabled = changes.disabled.currentValue;
    }
    if (changes.autofocus) {
      this.autofocus = changes.autofocus.currentValue;
    }
  }


  // Implementation of ControlValueAccessor interface, this is to enable the model driven form approach.
  writeValue(value: any) {
    // Usually a form control will initialize with empty value. Set current option to undefined.
    if (this.currentOption && this.currentOption.label) {
      return;
    } else if (value === '') { // Usually a form control will initialize with empty value. Set current option to undefined.
      this.currentOption = undefined;
    } else if (value !== undefined) {
      this.currentOption = value;
    }
  }


  handleUpDown(e, index, option?: FormAccountDropdownOption) {
    if (e.keyCode === 9) { // tab
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    if (e.keyCode === 40 && index !== this.loadedOptions.length - 1) {
      // down presed plus press is not on last item
      if (index !== -1) {
        this.loadedOptions[index]['hasFocus'] = false;
      } else if (!this.dropdownIsOpen && index === -1) {
        this.dropdownIsOpen = true;
      }
      if (index === -1) {
        // this.autofocus = false;
      }
      this.loadedOptions[index + 1]['hasFocus'] = true;
    } else if (e.keyCode === 38 && index > 0) { // up
      // up presed plus press is not on first item
      this.loadedOptions[index]['hasFocus'] = false;
      this.loadedOptions[index - 1]['hasFocus'] = true;
    } else if (e.keyCode === 13 || e.keyCode === 32) { // enter
      if (index === -1) {
        this.dropdownIsOpen = !this.dropdownIsOpen;
      } else {
        this.loadedOptions[index]['hasFocus'] = false;
        this.onOptionClick(e, option);
      }
    }
  }

  registerOnChange(fn) {
    this.propagateChange = fn;
  }

  registerOnTouched(fn) {
    this._onTouched = fn;
  }

  onOptionClick(e, option) {
    e.preventDefault(); // This is to prevent form submit being triggered
    this.currentOption = option;

    // ValueAccessControl propogate change
    this.propagateChange({label: option.label, value: option.value, balance: option.balance, accountType: option.accountType});

    for (let i = 0; i < this.loadedOptions.length; i++) {
      if (this.loadedOptions[i]['value'] === option.value) {
        this.loadedOptions[i]['highlight'] = true;
       } else {
        this.loadedOptions[i]['highlight'] = false;
      }
    }

    this._onTouched();
    this.eValue.nativeElement.focus();
    this.dropdownIsOpen = false;

    this.valueChanged.emit(option);
  }

  onOpenClick(e) {
    e.preventDefault();
    if (!this.disabled) {
      this.dropdownIsOpen = !this.dropdownIsOpen;
    }
  }

  onOutsideClick(e) {
    if (!this._eref.nativeElement.contains(e.target)) {
      this.dropdownIsOpen = false;
    }
  }

  get currentOption() {
    return this._currentOption;
 }

  set currentOption(option) {
    if (option) {
      if (option.label === '') {
        if (!this.data || !this.loadedOptions) {
          option.label = '';
        } else {
         if (this.loadedOptions.find(data => data.value === option.value.value)) {
            option.label = this.loadedOptions.find(data => data.value === option.value.value).label;
            option.balance = this.loadedOptions.find(data => data.balance.value === option.balance.value).balance;
            option.accountType = this.loadedOptions.find(data => data.accountType.value === option.accountType.value).accountType;
         }
        }
      }
    }
    this._currentOption = option;
  }

  onScroll(e) {
    if (this.enableOnScrollLoad) {
      if (!this.isLoadingMore) {
        if (e.target.scrollHeight - e.target.offsetHeight - e.target.scrollTop < 5) {
          this.isLoadingMore = true;
          // console.log('FormAccountDropdownComponent: onScroll and end reached');
          this.loadMore();
        }
      }
    }
  }

  loadMore() {
    // console.log('FormAccountDropdownComponent: loadMore and this.data.options.length >> ', this.data.options.length, ' and this.loadedOptions.length >> ', this.loadedOptions.length);
    if (this.loadedOptions.length < this.data.options.length) {
      // console.log('FormAccountDropdownComponent: loadMore and this.loadedOptions.length < this.data.options.length >> ', this.loadedOptions.length < this.data.options.length);
      const loadedOptionsLength = this.loadedOptions.length;
      let loadTill = loadedOptionsLength + this.batchLoad;
      if (loadTill > this.data.options.length) {
        loadTill = this.data.options.length;
      }
      for (let i = loadedOptionsLength; i < loadTill; i ++) {
        // console.log('FormAccountDropdownComponent: Pushing ', this.data.options[i]);
        this.loadedOptions.push(this.data.options[i]);
        if (i === (loadedOptionsLength + this.batchLoad - 1)) {
          this.isLoadingMore = false;
        }
      }
    }
  }

  mouseEnter(event) {
    // console.log('Textbox is focused', event)
      this.focus.emit(event)
     }
     mouseLeave(event) {
      // console.log('Textbox is focused out', event)
       this.focusout.emit(event)
     }
}
