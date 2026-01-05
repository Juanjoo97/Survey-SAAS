import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SurveyResponse } from './survey-response';

describe('SurveyResponse', () => {
  let component: SurveyResponse;
  let fixture: ComponentFixture<SurveyResponse>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SurveyResponse]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SurveyResponse);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
