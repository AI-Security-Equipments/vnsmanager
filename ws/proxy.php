
// =========================
// File: device_link.php
// Purpose: Choose http/https automatically for a device on port 80/443 and build a link.
// Also auto-fill/read username/password from saved values (localStorage) and optionally open via proxy.
// =========================
?>
<?php
// device_link.php
if (basename(__FILE__) === 'device_link.php') { /* no-op when included */ }
?>
<?php
/*
<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Link al Device</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 20px; }
    .card { border: 1px solid #ddd; border-radius: 12px; padding: 12px; max-width: 720px; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
    label { display:block; margin-top: 8px; font-size: 14px; }
    input, button { width:100%; padding:8px; border:1px solid #ccc; border-radius:8px; }
    .row { display:grid; grid-template-columns: 1fr 1fr; gap:8px; }
    .muted { color:#666; font-size:12px; }
  </style>
</head>
<body>
  <h1>Gestione link al device (porta 80)</h1>
  <div class="card">
    <form method="post">
      <label>IP / Hostname</label>
      <input type="text" name="host" placeholder="192.168.1.50" value="<?= htmlspecialchars($_POST['host'] ?? '') ?>" required />

      <div class="row">
        <div>
          <label>Username</label>
          <input id="u" type="text" name="username" value="<?= htmlspecialchars($_POST['username'] ?? '') ?>" autocomplete="username" />
        </div>
        <div>
          <label>Password</label>
          <input id="p" type="password" name="password" value="<?= htmlspecialchars($_POST['password'] ?? '') ?>" autocomplete="current-password" />
        </div>
      </div>

      <button type="submit" style="margin-top:12px">Genera Link</button>
    </form>

    <?php
    function port_open($host, $port, $timeout=0.5) {
        $fp = @fsockopen($host, $port, $errno, $errstr, $timeout);
        if ($fp) { fclose($fp); return true; }
        return false;
    }

    if (!empty($_POST['host'])) {
        $host = preg_replace('~\s+~','',$_POST['host']);
        $useHttps = port_open($host, 443) ? true : false; // prefer https if 443 reachable
        $scheme = $useHttps ? 'https' : 'http';
        $base = $scheme . '://' . $host . '/';

        // Save creds to session for proxy usage
        session_start();
        $_SESSION['cam_auth'] = [
            'username' => $_POST['username'] ?? '',
            'password' => $_POST['password'] ?? ''
        ];

        echo '<hr />';
        echo '<p><strong>Protocollo scelto:</strong> ' . ($useHttps ? 'HTTPS (443 aperta)' : 'HTTP (fallback)') . '</p>';

        // Avoid embedding creds in the direct URL; offer proxy link that will send Basic Auth from session
        $direct = htmlspecialchars($base);
        $proxy = 'stream.php?url=' . urlencode($base);

        echo '<p><a href="' . $direct . '" target="_blank">Apri direttamente il device</a></p>';
        echo '<p><a href="' . $proxy . '" target="_blank">Apri tramite proxy (riusa user/pass)</a></p>';
    }
    ?>

    <p class="muted">Le credenziali vengono salvate localmente (browser) e anche in sessione server per usarle con il proxy.
    Evitiamo di includerle nell'URL per ragioni di sicurezza.</p>
  </div>

  <script>
  // Salvataggio/lettura automatica di user/password su questa pagina
  const U = document.getElementById('u');
  const P = document.getElementById('p');
  const KEY = 'device_link_auth_v1';
  // Carica se presenti
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (saved.u) U.value = saved.u;
    if (saved.p) P.value = saved.p;
  } catch(e) {}
  // Salva ad ogni modifica
  function save(){ localStorage.setItem(KEY, JSON.stringify({u: U.value, p: P.value})); }
  U.addEventListener('input', save);
  P.addEventListener('input', save);
  </script>
</body>
</html>
*/
