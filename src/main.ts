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
const themeToggle = $<HTMLButtonElement>('theme-toggle');

const trackBot = document.getElementById('track-bot') as unknown as SVGGElement | null;
const botMotion = document.getElementById('bot-motion') as unknown as SVGAnimateMotionElement | null;
const trackSvg = document.querySelector<SVGSVGElement>('.track-svg');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const MIN_PASSWORD = 6;

const trackD = document
  .getElementById('race-track')
  ?.getAttribute('d')
  ?.replace(/\s+/g, ' ')
  .trim();

let botAnimation: Animation | undefined;

if (trackBot && trackD && typeof CSS !== 'undefined' && CSS.supports('offset-path', 'path("M0 0")')) {
  botMotion?.remove();
  trackBot.style.setProperty('offset-path', `path("${trackD}")`);
  botAnimation = trackBot.animate(
    [{ offsetDistance: '0%' }, { offsetDistance: '100%' }],
    { duration: 24000, iterations: Infinity, easing: 'linear' },
  );
}

if (reduceMotion) {
  botAnimation?.pause();
  trackSvg?.pauseAnimations();
}

function setBotDur(v: string): void {
  if (botMotion && botMotion.getAttribute('dur') !== v) {
    botMotion.setAttribute('dur', v);
  }
}

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
let botResetTimer: number | undefined;

function clearAlert(): void {
  window.clearTimeout(redirectTimer);
  window.clearTimeout(botResetTimer);
  if (alertBox) {
    alertBox.textContent = '';
    alertBox.className = 'alert-box hidden';
  }
  trackBot?.classList.remove('bot-error', 'bot-success');
  
  if (!reduceMotion) {
    if (botAnimation) {
      botAnimation.playbackRate = 1.0;
      botAnimation.play();
    } else {
      setBotDur('24s');
      trackSvg?.unpauseAnimations();
    }
  }
}

function fail(message: string, field?: HTMLInputElement | null): void {
  window.clearTimeout(botResetTimer);
  if (alertBox) {
    alertBox.textContent = message;
    alertBox.className = 'alert-box alert-error';
  }
  cardBox?.classList.remove('shake');
  void cardBox?.offsetWidth;
  cardBox?.classList.add('shake');

  trackBot?.classList.remove('bot-success');
  trackBot?.classList.add('bot-error');

  if (botAnimation) {
    botAnimation.pause();
  } else {
    trackSvg?.pauseAnimations();
  }

  field?.focus();
}

function succeed(message: string): void {
  window.clearTimeout(botResetTimer);
  if (alertBox) {
    alertBox.textContent = message;
    alertBox.className = 'alert-box alert-success';
  }
  trackBot?.classList.remove('bot-error');
  trackBot?.classList.add('bot-success');

  if (!reduceMotion) {
    if (botAnimation) {
      botAnimation.play();
      botAnimation.playbackRate = 3.0;
      botResetTimer = window.setTimeout(() => {
        if (botAnimation) {
          botAnimation.playbackRate = 1.0;
        }
      }, 4000);
    } else {
      trackSvg?.unpauseAnimations();
      setBotDur('8s');
      botResetTimer = window.setTimeout(() => {
        setBotDur('24s');
      }, 4000);
    }
  }
}

function switchTab(target: 'login' | 'reg'): void {
  clearAlert();
  const isLogin = target === 'login';
  tabLogin?.classList.toggle('active', isLogin);
  tabReg?.classList.toggle('active', !isLogin);
  tabLogin?.setAttribute('aria-selected', String(isLogin));
  tabReg?.setAttribute('aria-selected', String(!isLogin));
  tabLogin?.setAttribute('tabindex', isLogin ? '0' : '-1');
  tabReg?.setAttribute('tabindex', isLogin ? '-1' : '0');
  formLogin?.classList.toggle('hidden', !isLogin);
  formReg?.classList.toggle('hidden', isLogin);
}

tabLogin?.addEventListener('click', () => switchTab('login'));
tabReg?.addEventListener('click', () => switchTab('reg'));

const tabsList = [tabLogin, tabReg];
tabsList.forEach((tab, index) => {
  tab?.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const nextIndex = index === 0 ? 1 : 0;
      const target = nextIndex === 0 ? 'login' : 'reg';
      switchTab(target);
      tabsList[nextIndex]?.focus();
    }
  });
});

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
  if (pass.length < MIN_PASSWORD) {
    fail(`Ключ доступу має містити не менше ${MIN_PASSWORD} символів.`, regPass);
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

const root = document.documentElement;

function syncThemeButton(theme: string): void {
  themeToggle?.setAttribute('aria-pressed', String(theme === 'dark'));
}

syncThemeButton(root.getAttribute('data-theme') || 'light');

themeToggle?.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  try {
    localStorage.setItem('ra_theme', next);
  } catch {}
  syncThemeButton(next);
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem('ra_theme');
  } catch {}
  if (saved) return;
  const next = e.matches ? 'dark' : 'light';
  root.setAttribute('data-theme', next);
  syncThemeButton(next);
});
