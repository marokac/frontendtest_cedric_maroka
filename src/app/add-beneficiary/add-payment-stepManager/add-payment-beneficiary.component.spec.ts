import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPaymentBeneficiaryComponent } from './add-payment-beneficiary.component';

describe('AddPaymentBeneficiaryComponent', () => {
  let component: AddPaymentBeneficiaryComponent;
  let fixture: ComponentFixture<AddPaymentBeneficiaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddPaymentBeneficiaryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddPaymentBeneficiaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
