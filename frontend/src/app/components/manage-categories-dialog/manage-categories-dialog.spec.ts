import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageCategoriesDialog } from './manage-categories-dialog';

describe('ManageCategoriesDialog', () => {
  let component: ManageCategoriesDialog;
  let fixture: ComponentFixture<ManageCategoriesDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageCategoriesDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageCategoriesDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
