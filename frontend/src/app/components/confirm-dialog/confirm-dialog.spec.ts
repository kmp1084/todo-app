import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ConfirmDialog, ConfirmDialogData } from './confirm-dialog';

describe('ConfirmDialog', () => {
  let component: ConfirmDialog;
  let fixture: ComponentFixture<ConfirmDialog>;

  const testData: ConfirmDialogData = {
    title: 'Delete task?',
    message: '"Buy milk" will be permanently removed.',
    confirmText: 'Delete',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: testData },
        { provide: MatDialogRef, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exposes the injected dialog data', () => {
    expect(component.data.title).toBe('Delete task?');
    expect(component.data.confirmText).toBe('Delete');
  });
});