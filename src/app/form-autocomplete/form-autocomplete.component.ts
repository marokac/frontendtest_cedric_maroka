import { Component, OnInit, AfterViewInit, Input, Output, ElementRef, forwardRef, EventEmitter, ViewChild, ChangeDetectorRef, Renderer2 } from '@angular/core';
import { FormControl, ControlValueAccessor, FormGroup, NG_VALUE_ACCESSOR, NG_VALIDATORS, AbstractControl } from '@angular/forms';
import { FormAutoComplete } from './form-autocomplete.model';
import { FormAutoCompleteOption } from './form-autocomplete-option.model';
import { Router } from '@angular/router';
import { Utils } from 'app/core/utils/utils';

@Component({
  selector: 'form-autocomplete',
  templateUrl: './form-autocomplete.component.html',
  styleUrls: ['./form-autocomplete.component.scss'],
  host: {
    '(document:click)': 'onOutsideClick($event)',
    '(document:touchend)': 'onOutsideClick($event)',
    'class': 'form-autocomplete'
  },
  providers: [
    // tslint:disable-next-line:no-forward-ref
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => FormAutoCompleteComponent), multi: true }
  ]
})
export class FormAutoCompleteComponent implements OnInit, AfterViewInit, ControlValueAccessor {
  @Input() data: FormAutoComplete = new FormAutoComplete();
  @Input() parentFormGroup: FormGroup;
  @Input() formStatus: any = {};
  @Input() autofocus = false;
  @Output() valueChanged = new EventEmitter<object>();
  @Output() inputValueChanged = new EventEmitter<any>();
  @Output() customBlur = new EventEmitter<any>();
  @Output() customFocus = new EventEmitter<any>();
  @Output() customInputClick = new EventEmitter<any>();
  @Output() infoLinkClicked = new EventEmitter<any>();
  @ViewChild('elementValue') eValue;
  @ViewChild('options') eOptions;
  utils: Utils;
  initialOptions: FormAutoCompleteOption[] = [];
  initialOptionsSet = false;

  value: string
  showPlaceholder = true;
  autocompleteIsOpen = false;
  ariaDescribedBy = '';
  disabled = false;
  searchString = '';
  downClicked = false;
  updatedValue = false;
  amountInputValueRight = false;

  propagateChange: any = () => { };
  validateFn: any = () => { };
  onTouched: () => any = () => { };

  checkCurrentOption(): string {
    return this.currentOption() ? this.currentOption().label : this.value;
  }

  currentOption() {
    if (this.data.options) {
      if (this.value.length === 0) {
        this.initialOptionsSet = false;
      }
      return this.data.options.find(option => option.value === this.value)
    }
  }

  constructor(private _eref: ElementRef, 
    private router: Router, 
    private renderer: Renderer2,
    private cdr?: ChangeDetectorRef,) {
    if (this.data === undefined || this.data === null) {
      this.data = new FormAutoComplete();
    }
    this.utils = new Utils();
  }

  ngOnInit() {
    this.updatedValue = false;
    this.disabled = this.data.disabled ? true : false;
    this.ariaDescribedBy = 'err_' + this.data.name;
    this.initialOptionsSet = false;
    this.data.amountInputValueRight = this.data.amountInputValueRight ? true : false;
  }

  ngAfterViewInit() {
    if (this.autofocus) {
      setTimeout(() => {
       this.eValue.nativeElement.focus();
      }
      , 0)
    }
    if (this.parentFormGroup.controls[this.data.name].value !== '') {
      const option = {
        value: this.parentFormGroup.controls[this.data.name].value,
        label: this.parentFormGroup.controls[this.data.name + 'Label'] ?
        this.parentFormGroup.controls[this.data.name + 'Label'].value :
        this.parentFormGroup.controls[this.data.name].value
      }
      this.onOptionClick(null, option);

      if (!this.updatedValue) {
        setTimeout(() => {
          this.eValue.nativeElement.value =
          this.parentFormGroup.controls[this.data.name].value
        }, 0);
      }
    }
    this.cdr.detectChanges();
  }

  // Implementation of ControlValueAccessor interface, this is to enable the model driven form approach.
  writeValue(value: any) {
    this.value = value
    if (this.data.closeOnError) {
      this.autocompleteIsOpen = false;
      this.cdr.detectChanges();
    }
  }

  registerOnChange(fn) {
    this.propagateChange = fn;
    this.cdr.detectChanges();
  }

  registerOnTouched() { }

  onOptionClick(e, option) {
    if (e) {
     e.preventDefault();
      const childElements = e.target.offsetParent.children;
      for (const child of childElements) {
        this.renderer.removeClass(child, 'selected_value');
      }
     this.renderer.addClass(e.target, 'selected_value');
    }

    this.value = option.value;

    // ValueAccessControl propogate change
    this.propagateChange(option.value);
    this.autocompleteIsOpen = false;
    this.downClicked = false;
    // this.disabled = this.parentFormGroup.controls[this.data.name].disabled;
    this.disabled = this.data.disabled ? true : false;

    if (this.currentOption()) {
      this.updateValue(this.currentOption());
    }

    this.parentFormGroup.controls[this.data.name].setValue(option.value);
    

    this.valueChanged.emit({
      selectedFormControl : this.parentFormGroup.controls[this.data.name],
      selectedOption: option
    });

    this.onOutsideClick(e);
    this.eValue.nativeElement.focus();
  }

  onInputChange(e) {
    if (e.srcElement.value.lentgh > 0) {
      this.parentFormGroup.controls[this.data.name].setValue(e.srcElement.value);
    this.inputValueChanged.emit(e.srcElement.value);
    if (this.data.options.filter((option) => option.label === e.target.value).length === 1) {
      this.valueChanged.emit({
        selectedFormControl : this.parentFormGroup.controls[this.data.name],
        selectedOption: this.data.options.find((option) => option.label === e.target.value)
      });
    }

    }
    this.cdr.detectChanges();
  }
  onInputKeyPress(event: any) {
    const  userText = event.target.value.replace(/^\s+/, '').replace(/\s+$/, '');
    const pattern = /\s+$/;
    const inputChar = String.fromCharCode(event.charCode);
    if ( userText === '' ) {
      if (pattern.test(inputChar)) {
      event.preventDefault();
      event.stopPropagation();
      }
    }
  }
  onInputKeyUp(event) {
    if ( this.validateKeyCode (event.keyCode) ) {
      /* Ensures that input blink does not move if none valid keys
      * such as alt prsc are pressed
      */
      this.onInputKeyPress(event);
    } else {
      event.stopPropagation();
    }
  }

  /** If the following keys are pressed then input blink should do nothing.
   * This was initially implemented to stop ctrl > prsc but 
   * other inputs listed were also taken into consideration. The input of 
   * this method is key Code. Note that this method cannot be the same as 
   * search ui component because search and autocomplete might look like 
   * they are the same but their behaviour is different
   */
  validateKeyCode(code) {
    let keyCodes: any[];
    let keyCodeFound: any;
    keyCodes = [
      { name: 'Tab', code: 9 },
      { name: 'Enter', code: 13 },
      { name: 'Shift', code: 16 },
      { name: 'Ctrl', code: 17 },
      { name: 'Alt', code: 18 },
      { name: 'Pause', code: 19 },
      { name: 'Caps Lock', code: 20 },
      { name: 'Escape', code: 27 },
      { name: 'PageUp', code: 33 },
      { name: 'PageDown', code: 34 },
      { name: 'End', code: 35 },
      { name: 'Home', code: 36 },
      { name: 'Print Screen', code: 44 },
      { name: 'Insert', code: 45 },
      { name: 'Insert', code: 45 },
      { name: 'Windows Key', code: 91 },
      { name: 'ContextMenu', code: 93 },
      { name: 'NumLock', code: 144 },
      { name: 'ScrollLock', code: 145 },
      { name: 'Altgr', code: 255 },
      { name: 'F1', code: 112 },
      { name: 'F2', code: 113 },
      { name: 'F3', code: 114 },
      { name: 'F4', code: 115 },
      { name: 'F5', code: 116 },
      { name: 'F6', code: 117 },
      { name: 'F7', code: 118 },
      { name: 'F8', code: 119 },
      { name: 'F9', code: 120 },
      { name: 'F10', code: 121 },
      { name: 'F11', code: 122 },
      { name: 'F12', code: 123 },
    ];

    // Check if users key code exist in the keycode validation list
    keyCodeFound = keyCodes.find(x => x.code === code)

    // If Users key code exists in the list then return false else return true
    // False = Key code Validation failed
    // True = Key code Validation passed
    if (keyCodeFound) {
      return false;
    } else {
      return true
    }
  }

  firstKeyIsSpace (event: any) {
    const  userText = event.target.value.replace(/^\s+/, '').replace(/\s+$/, '');
    const pattern = /\s+$/;
    const inputChar = String.fromCharCode(event.charCode);
    if (event.target.value.length === 0) {
      if ( userText === '' ) {
        if (pattern.test(inputChar)) {
        event.preventDefault();
        return true
        }
      }
    }
    // this.autocompleteIsOpen = false;
    // event.preventDefault();
    // return true
  }


  onInfoLinkNavKeyDown(e, link: string) {
    if (  e.keyCode === 13 || e.keyCode === 32) {
      e.stopPropagation();
      e.preventDefault();
      if (link) {
        this.router.navigate(['/connected-banking/' + link, this.data.infoLink.parameters])
      }
      this.infoLinkClicked.emit(e);
    }
  }
  onInfoLinkNavClick(e) {
      e.stopPropagation();
      e.preventDefault();
      this.infoLinkClicked.emit(e);
  }
  onAutoCompleteFocus(e) {
    e.preventDefault()
    // this.propagateChange
    this.writeValue('');
  }

  onInputBlur(e) {
    this.customBlur.emit({
      event: e,
      selectedFormControl : this.parentFormGroup.controls[this.data.name],
      selectedOption: this.data.options.filter((option) => {
        return option.value === e.target.value
      })[0]
    });
  }

  onInputFocus(e) {
    this.customFocus.emit(e);
  }

  isValidKeySelected(e): boolean {
    return (e.keyCode === 13 || e.keyCode === 32 || // space
      e.keyCode === 8 || // back
      (65 < e.keyCode && e.keyCode < 90) || // alphabets
      (47 < e.keyCode && e.keyCode < 58)); // numbers
  }

  insertBoldText(label: string, index: number, subLabel?: string): any {
    if (this.autocompleteIsOpen) {
      const typedString = this.eValue.nativeElement.value.trim();
      const regexp = new RegExp(typedString, 'ig');
      let finalString = label.replace(regexp, function (match) {
        return '<B>' + match + '</B>';
      });
      if (typeof subLabel !== 'undefined') {
        const finalSubLabel = subLabel.replace(regexp, function (match) {
          return '<B>' + match + '</B>';
        });
        finalString = '<span class=\'two-lines\'>' + finalString + '<br /> <span>' + finalSubLabel + '</span></span>'
      }
      return finalString;
    }
  }



  filterValues() {
    if (!this.initialOptionsSet) {
      this.initialOptionsSet = true;
      this.initialOptions = this.data.options;
    }

    this.data.options = this.initialOptions.filter((option) => {
      return option.label.toLowerCase().indexOf(this.eValue.nativeElement.value.toLowerCase()) !== -1;
    });
    this.data.options = this.data.options;
    this.cdr.detectChanges();
  }

  handleUpDown(e, index, option?: FormAutoCompleteOption) {
    e.preventDefault();
    e.stopPropagation();

    const bTabPressed = e.keyCode === 9 ? true : false;
    const bGoDown = e.keyCode === 40 ? true : false;

    if (bTabPressed && index >= this.data.options.length) { 
      // tab and last item pressed
      this.autocompleteIsOpen = false;
      // e.srcElement.blur();
      return;
    }

    if (bGoDown && (index + 1) !== this.data.options.length) {
      // down presed plus item is not on the last item
      // then focus on the next item
      this.downClicked = true;
      if (index !== -1) {
        this.data.options[index]['hasFocus'] = false;
      }
      index = index + 1;
      this.data.options[index]['hasFocus'] = true;
      this.cdr.detectChanges();
    } else  if (e.keyCode === 38 && index > 0) { // up
      // up presed plus press is not on first item
      this.downClicked = true;
      this.data.options[index]['hasFocus'] = false;
      this.data.options[index - 1]['hasFocus'] = true;
    } else if (e.keyCode === 13 || e.keyCode === 32) { // enter or space
      this.updateValue(option);
      this.disabled = this.data.disabled ? true : false;
    }
  }

  onOptionKeyDown(e, index, option?: FormAutoCompleteOption) {
    if (e.keyCode === 32 || e.keyCode === 13) {
      if (index !== -1) {
        e.stopPropagation();
        this.onOptionClick(e, option)
      }
    } else if ((e.keyCode === 9) 
      && index + 1 === this.data.options.length) { 
      // if tab (9) is pressed on last item then
      // hide list and blur
      e.stopPropagation();
      /*e.preventDefault();*/
      this.autocompleteIsOpen = false;
      e.srcElement.blur();
    }
  }
  
  onInputKeyDown(e) {
    if (this.utils.isValidSearchKeyPressed(e)) {
      this.autocompleteIsOpen = true;
      // TODO: MOVE UP HERE
      if (this.eOptions !== undefined) {
        document.querySelector('.autocomplete__options').scrollTop = 0;
      }
    }
  }

  updateValue(option: FormAutoCompleteOption) {
    if (this.parentFormGroup.controls[this.data.name + 'Label']) {
      this.parentFormGroup.controls[this.data.name + 'Label'].setValue(option.label);
    }
    if (this.parentFormGroup.controls['iipeligible'] && option.iipeligible) {
      this.parentFormGroup.controls['iipeligible'].setValue(option.iipeligible);
    }
    this.eValue.nativeElement.value = option.label;
    if (option.label === '') {
      this.data.options = [];
      this.updatedValue = false;
    } else {
      this.updatedValue = true;
    }
    this.cdr.detectChanges();
  }

  onMainDivKeyUp(e) {
    e.preventDefault();

    if (e.keyCode === 32) { // space
      e.stopPropagation();
      if (this.firstKeyIsSpace(e)) {
        /* if first key pressed is space then autocomplete input blinker should 
          stay on first position within auto-complete input
        */
        this.autocompleteIsOpen = false;
        return false;
      }
    }
    const bGoDown = (e.keyCode === 9 || e.keyCode === 40) ? true : false;

    if (!bGoDown && this.data.filterOptionValues) {
        this.filterValues();
    }
    if (this.disabled) {
      this.autocompleteIsOpen = false;
      return;
    }
    // left (37) or right (39) alt (18) or prsc (44) then do nothing
    if (e.keyCode === 37 || e.keyCode === 39 || e.keyCode === 18 || e.keyCode === 44) { 
      return false;
    }

    // tslint:disable-next-line:no-unused-expression
    if (bGoDown) {
      this.autocompleteIsOpen = true;
      this.handleUpDown(e, -1);
    } else if (e.target.value.length <= 1) {
      this.autocompleteIsOpen = true;
      if (e.target.value === '') {
        if(!this.data.openOnLoad) {
          this.autocompleteIsOpen = false;
          e.preventDefault();
        }
      }
    }
  }

  onInputClick(e) {
    e.stopPropagation();
    e.preventDefault()
    if (this.data.openOnLoad) {
      this.autocompleteIsOpen = true;
      if (this.initialOptionsSet) {
        this.data.options = this.initialOptions;
      }
    }
    this.customInputClick.emit({
      event: e, autocomplete: this
    });
  }

  onAutocompleteClick(e) {
    this.autocompleteIsOpen = false;
  }

  onInputDblClick(e) {
    (this.eValue.nativeElement as HTMLInputElement).select();
  }

  onOutsideClick(e) {
    if (this.currentOption()) {
      this.updateValue(this.currentOption());
    }
    // this.disabled = this.parentFormGroup.controls[this.data.name].disabled;
    this.disabled = this.data.disabled ? true : false;

    if (!e) {
      return;
    }

    if (!this._eref.nativeElement.contains(e.target) && !this.downClicked) {
      this.autocompleteIsOpen = false;
      this.cdr.detectChanges();
    }
  }

}
