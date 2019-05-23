import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ElementRef, ViewChild, Renderer2  } from '@angular/core';
import { Router } from '@angular/router';
import { MomentModule } from 'angular2-moment';
import { FormControl, FormGroup } from '@angular/forms';
import { ListSearchInput } from './list-search.model';

@Component({
  selector: 'list-search',
  templateUrl: './list-search.component.html',
  styleUrls: ['./list-search.component.scss'],
  providers: []
})


export class ListSearchComponent implements OnInit {
  @Input() data: ListSearchInput;
  @Input() parentFormGroup: FormGroup;
  @Input() formStatus: any = {};
  @Output() search = new EventEmitter();
  @ViewChild('searchBox') searchBox: ElementRef;
  public enableSearch = true;
  public inputFocused = false;
  public cancelButton = false;
  public disableSearch = false
  public clearValue = null;
  public delayTimer: any
  public listSearchBox: any;
  searchDelay: number;
  searchExcuted = false;

  constructor(private renderer: Renderer2) { }

  ngOnInit() {
    this.listSearchBox = this.renderer.selectRootElement('.searchBox');
  }

  onFocus() {
    this.inputFocused =  true;
  }
  onFocusOut() {
    this.inputFocused =  false;
  }
  validateKeyCode(code) {
    // This method validates key codes

    let keyCodes: any[];
    let keyCodeFound: any;
    // User not allowed to enter the following keycodes on the search box
    // The following Key codes are used for validating keyboard inputs from user
    // If user enters any of the codes below the key code validation will fail
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
      { name: 'ArrowLeft', code: 37 },
      { name: 'ArrowUp', code: 38 },
      { name: 'ArrowRight', code: 39 },
      { name: 'ArrowDown', code: 40 },
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

    console.log('keyCodeFound:', keyCodeFound);
    // If Users key code exists in the list then return false else return true
    // False = Key code Validation failed
    // True = Key code Validation passed
    if (keyCodeFound) {
      this.enableSearch = false;
      return false;
    } else {
      this.enableSearch = true
      return true
    }
  }
  startSearch(input) {
    // This method starts the search
    if (this.listSearchBox.value.length > 0) {
      this.search.emit(input)
      this.searchExcuted = true
    }

  }
  updateCloseButton(inputSize) {
    ( inputSize <= 0 ) ? this.cancelButton = false : this.cancelButton = true;
  }
  updateSearch(event, val, keyCode, inputSize) {
    // Remove the special charatcers from search box
    // Prevent the user from entering empty spaces before search

    const  userText = val.replace(/^\s+/, '').replace(/\s+$/, '');

    // If user has pressed space bar
    if (  keyCode === 32 )  {

      if ( inputSize <= 1 || userText === '' ) {
        this.listSearchBox.value = (this.listSearchBox.value).replace(/\s+$/gi, '');
        this.enableSearch = false
        this.updateCloseButton(0);
      } else {
        this.enableSearch = true
        this.searchExcuted = true;
      }
    }

    if (userText === '' && this.searchExcuted) {
      this.enableSearch = false;
      this.cancel()
    }

    // If user has pressed delete or backspace
    if (  (keyCode === 8 || keyCode === 46) && userText === '')  {
      this.listSearchBox.value = (this.listSearchBox.value).replace(/\s+$/gi, '');
      if (this.listSearchBox.value.length === 0 && this.searchExcuted) {
        this.enableSearch = true
        this.searchExcuted = false;
      } else {
        this.enableSearch = false;
        this.searchExcuted = false;
      }
    }

    console.log('userText: ', userText);
    console.log('val: ', val);
    console.log('keyCode: ', keyCode);

  }
  onKeyPress(event: any) {
    // Method: Prevents user from entering empty spaces
    const  userText = this.listSearchBox.value.replace(/^\s+/, '').replace(/\s+$/, '');
    const pattern = /\s+$/;
    const inputChar = String.fromCharCode(event.charCode);
    if (this.listSearchBox.value.length === 0) {
      if ( userText === '' ) {
        if (pattern.test(inputChar)) {
        event.preventDefault();
        }
      }
    }
  }
  cancel() {
    // This method cancels the search
    this.clearValue = '';
    this.clearValue = null;
    this.search.emit('');
    this.cancelButton = false;
    this.searchExcuted = false;
    this.listSearchBox.focus();
  }
  onKeyUp(event: any) {
    event.preventDefault();
    // This Method is triggered when a keyboard key is pressed by the user
    /*
      -----------------------
      Search Process
      -----------------------

      1. Update close button: Hide or show close button
      2. Validate the key codes: Prevent special keys from triggering the search
        2.1 Key code validation Passed: Enable search
          2.1.1 Update seach: Configure the search before execution
      3. start the search
        3.1 Clear the timer first before starting the search
        3.2 Delay the search by 10 seconds then start the search
    */

    // 1. Update close button: Hide or show close button
    this.updateCloseButton(event.target.value.length);
    // 2. Validate the key codes: Prevent special keys from triggering the search
    if ( this.validateKeyCode(event.keyCode) ) {
      // 2.1 Key code Validation Passed: Enable search
      this.enableSearch = true;
      // 2.1.1 Update seach: Configure the search before execution
      if ( event.keyCode === 32 || event.keyCode === 8 || event.keyCode === 46 || event.keyCode === 53) {
        this.updateSearch(event, event.target.value, event.keyCode, event.target.value.length )
      }
    }
    // 3. Start the search
    if (this.enableSearch) {
      // 3.1 Clear the timer first before starting the search
      if (this.searchDelay) {
        window.clearTimeout(this.searchDelay);
      }
      // 3.2 Delay the the search by 10 seconds then start the search
      this.searchDelay = window.setTimeout(() => {
        // if ( event.target.value.length >= this.data.charLimit ) {
          this.startSearch(event.target.value);
        // }
      }, 1000);
    }
  }

}
