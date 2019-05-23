import { Component, OnInit, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit } from '@angular/core';

@Component({
  selector: 'actions-subitems',
  templateUrl: './actions-subitems.component.html',
  host: {
    '(window:resize)': 'onWindowResize($event)'
  },
})
export class ActionsSubitemsComponent implements OnInit, AfterViewInit {
  @Input() subitems;
  @ViewChild('dropdown') dropdown;
  @Output() onActionClick = new EventEmitter<Object>();

  constructor(private elRef: ElementRef) { }

  ngOnInit() { }

  ngAfterViewInit() {
    this.positionDropdown();

    // Reposition after a timeout to give elements a chance to be placed
    setTimeout(() => {
      this.positionDropdown();
    }, 500);
  }

  onWindowResize() {
    this.positionDropdown();
  }

  positionDropdown() {
    // Here we calculate how close the dropdown is to the edge of the screen
    // and shift it so it doesn't sit offscreen

    // First, reset the left style prop so we can calculate correctly
    this.dropdown.nativeElement.style.left = '50%';

    let elWidth = this.dropdown.nativeElement.offsetWidth; //Initially used clientWidth, but IE 11 returns 0
    let elRect = this.dropdown.nativeElement.getBoundingClientRect();
    let elLeft = elRect.left;
    let leftShift =  (elLeft + elWidth) - window.innerWidth;

    // Cap the left shift to 0 and above, otherwise we have a dropdown that
    // doesn't align to the tab
    if (leftShift < 0) {
      leftShift = 0;
    }

    this.dropdown.nativeElement.style.left = -(leftShift) + 'px';
  }

  actionClick(e, item) {
    e.preventDefault();
    e.stopPropagation();

    this.onActionClick.emit(item);
  }
}
