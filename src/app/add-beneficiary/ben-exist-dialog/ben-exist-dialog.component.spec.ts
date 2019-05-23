import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BenExistDialogComponent } from './ben-exist-dialog.component';

describe('BenExistDialogComponent', () => {
  let component: BenExistDialogComponent;
  let fixture: ComponentFixture<BenExistDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BenExistDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BenExistDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
