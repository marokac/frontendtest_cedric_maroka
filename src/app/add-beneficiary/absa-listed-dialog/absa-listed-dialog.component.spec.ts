import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewPaymentAbsaListedDialogComponent } from 'app/process/modules/cb-app/view-beneficiaries/view-payment/add-beneficiary/absa-listed-dialog/absa-listed-dialog.component';


describe('ViewPaymentAbsaListedDialogComponent', () => {
  let component: ViewPaymentAbsaListedDialogComponent;
  let fixture: ComponentFixture<ViewPaymentAbsaListedDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewPaymentAbsaListedDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewPaymentAbsaListedDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
