import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { PromptDialog, PromptDialogData } from './prompt-dialog';

describe('PromptDialog', () => {
  let component: PromptDialog;
  let fixture: ComponentFixture<PromptDialog>;
  let closedWith: unknown;

  const data: PromptDialogData = {
    title: 'New category',
    label: 'Category name',
  };

  beforeEach(async () => {
    closedWith = undefined;

    await TestBed.configureTestingModule({
      imports: [PromptDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close: (v: unknown) => (closedWith = v) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PromptDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('closes with the trimmed value on confirm', () => {
    component.value.set('   Fitness   ');
    component.confirm();
    expect(closedWith).toBe('Fitness');
  });

  it('does not close when the value is blank', () => {
    component.value.set('   ');
    component.confirm();
    expect(closedWith).toBeUndefined();
  });
});