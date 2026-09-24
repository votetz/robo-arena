export {};

const $ = <T extends HTMLElement>(id: string): T | null =>
  document.getElementById(id) as T | null;

const tabLogin = $<HTMLButtonElement>('tab-login-btn');
const tabReg = $<HTMLButtonElement>('tab-reg-btn');
const formLogin = $<HTMLFormElement>('form-login');
const formReg = $<HTMLFormElement>('form-register');

const loginId = $<HTMLInputElement>('login-email');
const loginPass = $<HTMLInputElement>('login-password');
const regUser = $<HTMLInputElement>('reg-username');
const regEmail = $<HTMLInputElement>('reg-email');
const regPass = $<HTMLInputElement>('reg-password');

const alertBox = $<HTMLDivElement>('auth-alert');
const cardBox = $<HTMLDivElement>('auth-card-box');
const trackBot = $<HTMLDivElement>('track-bot');

const DISPOSABLE_DOMAINS = [
  'tempmail.com', '10minutemail.com', 'guerrillamail.com',
  'mailinator.com', 'trashmail.com', 'yopmail.com', 'temp-mail.org',
];

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

function validateEmail(email: string): string | null {
  if (!EMAIL_RE.test(email)) return 'Введіть коректну адресу електронної пошти.';
  const domain = email.split('@')[1].toLowerCase();
  if ((domain.split('.').pop() ?? '').length < 2) return 'Некоректна доменна зона в email.';
  if (DISPOSABLE_DOMAINS.some((d) => domain === d || domain.endsWith('.' + d))) {
    return 'Тимчасові поштові скриньки заборонено.';
  }
  return null;
}

let redirectTimer: number | undefined;

function clearAlert(): void {
  window.clearTimeout(redirectTimer);
  if (alertBox) {
    alertBox.textContent = '';
    alertBox.className = 'alert-box hidden';
  }
  trackBot?.classList.remove('bot-error', 'bot-success');
}

function fail(message: string, field?: HTMLInputElement | null): void {
  if (alertBox) {
    alertBox.textContent = message;
    alertBox.className = 'alert-box alert-error';
  }
  cardBox?.classList.remove('shake');
  void cardBox?.offsetWidth;
  cardBox?.classList.add('shake');

  trackBot?.classList.remove('bot-success');
  trackBot?.classList.add('bot-error');
  field?.focus();
}

function succeed(message: string): void {
  if (alertBox) {
    alertBox.textContent = message;
    alertBox.className = 'alert-box alert-success';
  }
  trackBot?.classList.remove('bot-error');
  trackBot?.classList.add('bot-success');
}

function switchTab(target: 'login' | 'reg'): void {
  clearAlert();
  const isLogin = target === 'login';
  tabLogin?.classList.toggle('active', isLogin);
  tabReg?.classList.toggle('active', !isLogin);
  tabLogin?.setAttribute('aria-selected', String(isLogin));
  tabReg?.setAttribute('aria-selected', String(!isLogin));
  formLogin?.classList.toggle('hidden', !isLogin);
  formReg?.classList.toggle('hidden', isLogin);
}

tabLogin?.addEventListener('click', () => switchTab('login'));
tabReg?.addEventListener('click', () => switchTab('reg'));

cardBox?.addEventListener('animationend', () => cardBox.classList.remove('shake'));

formLogin?.addEventListener('submit', (e: Event) => {
  e.preventDefault();
  clearAlert();

  const id = loginId?.value.trim() ?? '';
  const pass = loginPass?.value ?? '';

  if (!id || !pass) {
    fail('Заповніть усі поля для авторизації.', !id ? loginId : loginPass);
    return;
  }

  succeed(`Допуск надано! Вітаємо, ${id}. Перехід...`);
});

formReg?.addEventListener('submit', (e: Event) => {
  e.preventDefault();
  clearAlert();

  const username = regUser?.value.trim() ?? '';
  const email = regEmail?.value.trim() ?? '';
  const pass = regPass?.value ?? '';

  if (!username || !email || !pass) {
    fail('Усі поля реєстрації обов’язкові.', !username ? regUser : !email ? regEmail : regPass);
    return;
  }
  if (username.length < 3) {
    fail('Позивний має містити щонайменше 3 символи.', regUser);
    return;
  }
  const emailError = validateEmail(email);
  if (emailError) {
    fail(emailError, regEmail);
    return;
  }
  if (pass.length < 6) {
    fail('Ключ доступу має містити не менше 6 символів.', regPass);
    return;
  }

  succeed('Пілота успішно внесено до стартового протоколу!');
  formReg.reset();

  redirectTimer = window.setTimeout(() => {
    switchTab('login');
    if (loginId) loginId.value = email;
    loginPass?.focus();
  }, 1200);
});
