import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AbsaListedConfirmComponent } from './absa-listed-confirm.component';

describe('AbsaListedConfirmComponent', () => {
  let component: AbsaListedConfirmComponent;
  let fixture: ComponentFixture<AbsaListedConfirmComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AbsaListedConfirmComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AbsaListedConfirmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
