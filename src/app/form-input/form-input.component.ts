import { Router } from '@angular/router';
import { DialogModalService } from './../../dialog-modal/dialog-modal.service';
import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit, Renderer2 , EventEmitter, Output, HostListener } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { FormInput } from './form-input.model';

@Component({
  selector: 'form-input',
  templateUrl: './form-input.component.html',
  styleUrls: ['./form-input.component.scss'],
})
export class FormInputComponent implements OnInit, AfterViewInit{
  @Input() data: FormInput;
  @Input() parentFormGroup: FormGroup;
  @Input() formStatus: any = {};
  @Input() formGroupName: any
  @Input() autofocus = false;
  @Input() showIcon = true;
  @ViewChild('inputElement') inpElement;
  @Output() focus = new EventEmitter();
  @Output() focusout = new EventEmitter();
  @Output() valueChanged = new EventEmitter<any>();
  @Output() infoLinkClicked = new EventEmitter<any>();

  ariaDescribedBy: string = '';
  ariaLabel: string = '';
  @Input() isVisible: boolean = true;

  constructor(private dialog: DialogModalService, private router: Router, private renderer: Renderer2, private elRef: ElementRef ) {
     //  this.renderer.removeAttribute(this.elRef.nativeElement, 'formGroupName', null)

  }

  ngOnInit() {
    this.ariaDescribedBy = 'err_' + this.data.name + ' ';

    if (this.data.info) {
      this.ariaDescribedBy +=
        this.data.name + '_label ' + this.data.name + '_description';
    }

    if (this.formStatus.formWarnings === undefined) {
      this.formStatus.formWarnings = [];
    }

    if (this.formStatus.formDisplayWarnings === undefined) {
      this.formStatus.formDisplayWarnings = [];
    }

    if (this.data.hideLabel) {
      this.ariaLabel = this.data.label;
    }
  }

  ngAfterViewInit() {
    //Refer to https://github.com/angular/angular/issues/14440
    //IE marks a field as not pristine on load. This fixes that bug until we can update Angular or make sure the version of Angular we have has this issue fixed
    this.parentFormGroup.controls[this.data.name].markAsPristine();
    if (this.autofocus) {
      setTimeout(() => {
       this.inpElement.nativeElement.focus();
      }
      , 10)
    }
  }

  onInputKeyUp(e) {
    this.valueChanged.emit(e);
  }

  onInfoLinkNavKeyDown(e, link: string) {
    if (  e.keyCode === 13 || e.keyCode === 32) {
      e.stopPropagation();
      e.preventDefault();
      if (link) {
        this.router.navigate(['/connected-banking/' + this.data.infoLink.link, this.data.infoLink.parameters], { skipLocationChange: true });
        // this.router.navigate(['/connected-banking/' + link, this.data.infoLink.parameters], { skipLocationChange: true });
      }
      this.infoLinkClicked.emit(e);
    }
  }
  onInfoLinkNavClick(e) {
      e.stopPropagation();
      e.preventDefault();
      this.infoLinkClicked.emit(e);
  }

  onInfoLinkNavClickKeyDown(e) {
    if (  e.keyCode === 13 || e.keyCode === 32) {
      e.stopPropagation();
      e.preventDefault();
      this.infoLinkClicked.emit(e);
    }
  }

  // onInfoLinkNavKeyDown(e, link: string) {
  //   if (  e.keyCode === 13 || e.keyCode === 32) {
  //     e.stopPropagation();
  //     e.preventDefault();
  //     this.router.navigate(['/connected-banking/' + link, this.data.infoLink.parameters], { skipLocationChange: true });
  //   }
  // }

  // @HostListener('window:click', ['$event.target']) onClick(target) {
  //   if(target.tagName && target.tagName === 'BUTTON'){
  //     //target.click();
  //   }
  // }

  trimValue(e) {
    console.log(e);
    // if(e.relatedTarget.tagName === "BUTTON"){
    //   e.stopImmediatePropagation();
    //   e.relatedTarget.click();
    // }
    if (this.data.trim) {
      this.inpElement.nativeElement.value = this.inpElement.nativeElement.value.trim()
      this.valueChanged.emit({formControlName: this.data.name, formControlValue: this.inpElement.nativeElement.value});
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
