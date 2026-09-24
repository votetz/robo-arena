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
const MIN_PASSWORD = 8;

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

function translateBackendError(message: string): string {
  const normalized = message.trim().toLowerCase();

  if (normalized.includes('invalid credentials') || normalized.includes('unauthorized')) {
    return 'Невірний позивний або ключ доступу.';
  }
  if (normalized.includes('already exists') || normalized.includes('conflict')) {
    if (normalized.includes('email')) {
      return 'Ця електронна пошта вже зареєстрована.';
    }
    if (normalized.includes('username')) {
      return 'Цей позивний вже зайнятий іншим пілотом.';
    }
    return 'Користувач із такими даними вже зареєстрований.';
  }
  if (normalized.includes('not found')) {
    return 'Пілота з такими даними не знайдено.';
  }
  if (normalized.includes('too many requests')) {
    return 'Забагато спроб входу. Зачекайте деякий час.';
  }

  return message || 'Помилка підключення до сервера допуску.';
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

formLogin?.addEventListener('submit', async (e: Event) => {
  e.preventDefault();
  clearAlert();

  const id = loginId?.value.trim() ?? '';
  const pass = loginPass?.value ?? '';

  if (!id || !pass) {
    fail('Заповніть усі поля для авторизації.', !id ? loginId : loginPass);
    return;
  }

  const submitBtn = formLogin.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Вхід...';
  }

  try {
    const data = await api<{
      user: { id: number; email: string; username: string };
      accessToken: string;
      refreshToken: string;
    }>('/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: id, password: pass }),
    });

    setTokens(data.accessToken, data.refreshToken);
    succeed(`Допуск надано! Вітаємо, ${data.user.username}. Перехід...`);
    formLogin.reset();

    redirectTimer = window.setTimeout(() => {
      window.location.href = '/dashboard.html';
    }, 1000);
  } catch (err) {
    const rawError = err instanceof Error ? err.message : '';
    fail(translateBackendError(rawError), loginPass);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Увійти в кабінет';
    }
  }
});

formReg?.addEventListener('submit', async (e: Event) => {
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

  const submitBtn = formReg.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Реєстрація...';
  }

  try {
    const data = await api<{
      user: { id: number; email: string; username: string };
      accessToken: string;
      refreshToken: string;
    }>('/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password: pass }),
    });

    setTokens(data.accessToken, data.refreshToken);
    succeed('Пілота успішно внесено до стартового протоколу!');
    formReg.reset();

    redirectTimer = window.setTimeout(() => {
      switchTab('login');
      if (loginId) loginId.value = email;
      loginPass?.focus();
    }, 1200);
  } catch (err) {
    const rawError = err instanceof Error ? err.message : '';
    fail(translateBackendError(rawError), regEmail);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Зареєструвати пілота';
    }
  }
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

const API_BASE = '/auth';

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('accessToken');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

function setTokens(access: string, refresh: string): void {
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
}

function clearTokens(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem('refreshToken');
  if (!refresh) return null;
  try {
    const data = await api<{ accessToken: string; refreshToken: string }>('/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: refresh }),
    });
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

async function requestWithRefresh<T>(path: string, options: RequestInit = {}): Promise<T> {
  try {
    return await api<T>(path, options);
  } catch (e) {
    if (e instanceof Error && e.message.includes('401')) {
      const newToken = await refreshAccessToken();
      if (newToken) return api<T>(path, options);
    }
    throw e;
  }
}

const savedToken = localStorage.getItem('accessToken');
if (savedToken) {
  try {
    await requestWithRefresh('/me');
    // Don't auto-redirect on login page (root) since dashboard doesn't exist yet
    if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
      window.location.href = '/dashboard.html';
    }
  } catch {
    clearTokens();
  }
}