import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FormAutoCompleteComponent } from './form-autocomplete.component';

describe('FormAutoCompleteComponent', () => {
  let component: FormAutoCompleteComponent;
  let fixture: ComponentFixture<FormAutoCompleteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FormAutoCompleteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormAutoCompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
