import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login';
import { AuthService } from '../../services/auth';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { throwError } from 'rxjs';
import { By } from '@angular/platform-browser';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [AuthService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show modal on 404 error', () => {
    const errorResponse = { status: 404, error: { message: 'User not found' } };
    spyOn(authService, 'login').and.returnValue(throwError(() => errorResponse));

    component.loginForm.setValue({ email: 'test@example.com', password: 'password123' });
    component.onSubmit();
    fixture.detectChanges();

    expect(component.showErrorModal).toBeTrue();
    expect(component.modalMessage).toContain('Credenciales incorrectas');
    expect(component.loading).toBeFalse();
  });

  it('should show modal on 401 error', () => {
    const errorResponse = { status: 401, error: { message: 'Invalid credentials' } };
    spyOn(authService, 'login').and.returnValue(throwError(() => errorResponse));

    component.loginForm.setValue({ email: 'test@example.com', password: 'wrongpassword' });
    component.onSubmit();
    fixture.detectChanges();

    expect(component.showErrorModal).toBeTrue();
    expect(component.modalMessage).toContain('Credenciales incorrectas');
    expect(component.loading).toBeFalse();
  });

  it('should show inline error on 500 error', () => {
    const errorResponse = { status: 500, error: { message: 'Internal Server Error' } };
    spyOn(authService, 'login').and.returnValue(throwError(() => errorResponse));

    component.loginForm.setValue({ email: 'test@example.com', password: 'password123' });
    component.onSubmit();
    fixture.detectChanges();

    expect(component.showErrorModal).toBeFalse();
    expect(component.error).toBe('Internal Server Error');
    expect(component.loading).toBeFalse();
  });

  it('should show network error message on status 0', () => {
    const errorResponse = { status: 0 };
    spyOn(authService, 'login').and.returnValue(throwError(() => errorResponse));

    component.loginForm.setValue({ email: 'test@example.com', password: 'password123' });
    component.onSubmit();
    fixture.detectChanges();

    expect(component.showErrorModal).toBeFalse();
    expect(component.error).toContain('No se pudo conectar con el servidor');
    expect(component.loading).toBeFalse();
  });

  it('should close modal when close button is clicked', () => {
    component.showErrorModal = true;
    fixture.detectChanges();

    const closeBtn = fixture.debugElement.query(By.css('.btn-secondary'));
    closeBtn.nativeElement.click();
    fixture.detectChanges();

    expect(component.showErrorModal).toBeFalse();
  });
});
