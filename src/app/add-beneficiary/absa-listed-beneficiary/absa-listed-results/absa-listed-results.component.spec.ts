import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AbsaListedResultsComponent } from './absa-listed-results.component';

describe('AbsaListedResultsComponent', () => {
  let component: AbsaListedResultsComponent;
  let fixture: ComponentFixture<AbsaListedResultsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AbsaListedResultsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AbsaListedResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
