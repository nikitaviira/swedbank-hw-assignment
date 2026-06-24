import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorBannerComponent } from './error-banner.component';

describe('ErrorBannerComponent', () => {
  let fixture: ComponentFixture<ErrorBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorBannerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorBannerComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should not render when message is null', () => {
    expect(fixture.nativeElement.querySelector('.error-banner')).toBeFalsy();
  });

  it('should not render when message is empty string', () => {
    fixture.componentRef.setInput('message', '');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.error-banner')).toBeFalsy();
  });

  it('should render when message is set', () => {
    fixture.componentRef.setInput('message', 'Something went wrong');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.error-banner')).toBeTruthy();
  });

  it('should display the message text', () => {
    fixture.componentRef.setInput('message', 'Account not found');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.error-banner').textContent).toContain('Account not found');
  });

  it('should have a dismiss button', () => {
    fixture.componentRef.setInput('message', 'Some error');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.dismiss-btn')).toBeTruthy();
  });

  it('should hide banner after dismiss button is clicked', () => {
    fixture.componentRef.setInput('message', 'Some error');
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.dismiss-btn').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.error-banner')).toBeFalsy();
  });

  it('should emit dismissed event when dismiss button is clicked', () => {
    fixture.componentRef.setInput('message', 'Some error');
    fixture.detectChanges();
    const spy = vi.fn();
    fixture.componentInstance.dismissed.subscribe(spy);
    fixture.nativeElement.querySelector('.dismiss-btn').click();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should reappear when message changes after being dismissed', () => {
    fixture.componentRef.setInput('message', 'First error');
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.dismiss-btn').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.error-banner')).toBeFalsy();

    fixture.componentRef.setInput('message', 'Second error');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.error-banner')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.error-banner').textContent).toContain('Second error');
  });

  it('should reappear when the same message is set again after being dismissed', () => {
    fixture.componentRef.setInput('message', 'Some error');
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.dismiss-btn').click();
    fixture.detectChanges();

    fixture.componentRef.setInput('message', null);
    fixture.detectChanges();
    fixture.componentRef.setInput('message', 'Some error');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.error-banner')).toBeTruthy();
  });
});
