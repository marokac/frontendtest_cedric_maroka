import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InstitutionExistDialogComponentComponent } from './institution-exist-dialog-component.component';

describe('InstitutionExistDialogComponentComponent', () => {
  let component: InstitutionExistDialogComponentComponent;
  let fixture: ComponentFixture<InstitutionExistDialogComponentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InstitutionExistDialogComponentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InstitutionExistDialogComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
