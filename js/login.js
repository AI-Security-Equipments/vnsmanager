// File: /js/login.js

import { router } from './pages.js';
import { post } from './common/net.js';

router.postLoad['login'] = () => {
  const formLogin = document.getElementById('form-login');
  const form2FA = document.getElementById('form-2fa');
  const qrImg = document.getElementById('qr-img');
  const qrText = document.getElementById('qr-code-text');
  const errorBox = document.querySelector('.error');

  formLogin?.classList.remove('d-none');
  form2FA?.classList.add('d-none');
  errorBox?.classList.add('d-none');

  if (formLogin) {
    formLogin.addEventListener('submit', async e => {
      e.preventDefault();
      router.showLoading(true);

      const json = await post('ws/ws_login.php', {
        username: formLogin.user.value.trim(),
        password: formLogin.pass.value
      });

      router.showLoading(false);
        if (json.ok) {
            if (json.step === '2fa') {
            formLogin.classList.add('d-none');
            form2FA.classList.remove('d-none');
            if (qrImg && json.url) qrImg.src = json.url;
            if (qrText && json.code) qrText.textContent = json.code;
            window.loginData = { username: data.username };
            } else {
            location.hash = '#/dashboard';
            }
        } else {
            router.updateAttempts(json.attempts ?? '?');
        }
    });
  }

  if (form2FA) {
    form2FA.addEventListener('submit', async e => {
      e.preventDefault();
      const codeInput = form2FA.querySelector('input[name="code"]');
      const code = codeInput?.value.trim();
      if (!code) return;

      router.showLoading(true);
      try {
        const res = await fetch('ws/ws_2fa.php', {
          method: 'POST',
          body: new URLSearchParams({
            code,
            username: window.loginData?.username || ''
          })
        });
        const json = await res.json();
        router.showLoading(false);

        if (json.ok) {
          location.hash = '#/dashboard';
        } else {
          router.showError(json.error || window.lang['2fa_invalid'] || 'Codice 2FA non valido');
        }
      } catch (err) {
        router.showLoading(false);
        router.showError(window.lang['login_network_error'] || 'Errore di rete');
      }
    });
  }
};
