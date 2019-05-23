import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FormAccountDropdownComponent } from './form-account-dropdown.component';

describe('FormAccountDropdownComponent', () => {
  let component: FormAccountDropdownComponent;
  let fixture: ComponentFixture<FormAccountDropdownComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FormAccountDropdownComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormAccountDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
