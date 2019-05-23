import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddBeneficiaryTransactionalPanelComponent } from './add-beneficiary-transactional-panel.component';

describe('AddBeneficiaryTransactionalPanelComponent', () => {
  let component: AddBeneficiaryTransactionalPanelComponent;
  let fixture: ComponentFixture<AddBeneficiaryTransactionalPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddBeneficiaryTransactionalPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddBeneficiaryTransactionalPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
