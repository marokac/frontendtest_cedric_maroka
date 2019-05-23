import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionsSubitemsComponent } from './actions-subitems.component';

describe('ActionsSubitemsComponent', () => {
  let component: ActionsSubitemsComponent;
  let fixture: ComponentFixture<ActionsSubitemsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ActionsSubitemsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActionsSubitemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
