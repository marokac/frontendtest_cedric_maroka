import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AbsaListedDetailsComponent } from './absa-listed-details.component';

describe('AbsaListedDetailsComponent', () => {
  let component: AbsaListedDetailsComponent;
  let fixture: ComponentFixture<AbsaListedDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AbsaListedDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AbsaListedDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
