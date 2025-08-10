<?php
// =========================
// File: stream.php
// Purpose: Show camera stream from a given URL with basic resolution controls
// Requirements: PHP 7.4+, cURL enabled
// Security: Stores credentials in session (not in URL). Use HTTPS on this page.
// =========================


/*
stream.php
- Mostra lo stream della cam dall’URL che gli passi e ti consente di impostare la risoluzione (preset 480p/720p/1080p o larghezza/altezza manuale).
- Non mette user:pass nell’URL: salva le credenziali in sessione e le usa su proxy.php.
- Supporta MJPEG (via <img>). Se il flusso è MP4, usa <video>. Per HLS (.m3u8) avvisa che serve Safari o riconfigurare in MJPEG/MP4.
proxy.php

Un relay molto semplice con cURL che inoltra il flusso/il file e, se hai messo user/pass nel form, manda l’Authorization Basic al device senza esporre le credenziali nell’URL del browser.
device_link.php
Ti fa inserire solo host/IP. Prova la porta 443: se è aperta usa https, altrimenti http.
Salva/ricarica automaticamente username e password (localStorage) e anche in sessione server, così puoi aprire:
il link diretto al device (senza credenziali in URL)
oppure aprire via proxy in stream.php riusando user/pass in automatico.
Se vuoi, posso adattare i preset delle risoluzioni alle tue cam specifiche (alcuni firmware usano parametri particolari). Dimmi solo un paio di URL reali che usi di solito e te li mappo nei preset.*/



session_start();

// Helper: sanitize URL (allow only http/https)
function clean_url($u) {
    $u = trim($u ?? '');
    if ($u === '') return '';
    $parts = parse_url($u);
    if (!$parts) return '';
    $scheme = strtolower($parts['scheme'] ?? '');
    if (!in_array($scheme, ['http','https'])) return '';
    // Rebuild URL without user:pass to avoid leaking into HTML
    $host = $parts['host'] ?? '';
    $port = isset($parts['port']) ? ':' . intval($parts['port']) : '';
    $path = $parts['path'] ?? '/';
    $query = isset($parts['query']) ? '?' . $parts['query'] : '';
    return $scheme . '://' . $host . $port . $path . $query;
}

// Persist credentials in session if sent
if (isset($_POST['username']) || isset($_POST['password'])) {
    $_SESSION['cam_auth'] = [
        'username' => $_POST['username'] ?? '',
        'password' => $_POST['password'] ?? ''
    ];
}
$auth = $_SESSION['cam_auth'] ?? ['username' => '', 'password' => ''];

$url = clean_url($_REQUEST['url'] ?? '');

// Resolution handling: apply simple query param adjustments
function apply_resolution($url, $preset, $w, $h) {
    if ($url === '') return '';
    $parts = parse_url($url);
    $query = [];
    if (isset($parts['query'])) parse_str($parts['query'], $query);

    // Common patterns: res, resolution, size, width/height, w/h
    if ($preset === '720p') { $w = 1280; $h = 720; }
    elseif ($preset === '1080p') { $w = 1920; $h = 1080; }
    elseif ($preset === '480p') { $w = 854; $h = 480; }

    if ($w && $h) {
        $query['width'] = $w; $query['height'] = $h; // generic
        $query['w'] = $w; $query['h'] = $h;         // alt
        $query['size'] = $w . 'x' . $h;             // alt
        $query['resolution'] = $w . 'x' . $h;       // alt
        $query['res'] = $h;                         // some firmwares use height-only (best effort)
    }

    $rebuilt = ($parts['scheme'] ?? 'http') . '://' . ($parts['host'] ?? '');
    if (isset($parts['port'])) $rebuilt .= ':' . intval($parts['port']);
    $rebuilt .= $parts['path'] ?? '/';
    if (!empty($query)) $rebuilt .= '?' . http_build_query($query);
    return $rebuilt;
}

$preset = $_POST['preset'] ?? ($_GET['preset'] ?? '');
$w = isset($_POST['width']) ? intval($_POST['width']) : (isset($_GET['width']) ? intval($_GET['width']) : 0);
$h = isset($_POST['height']) ? intval($_POST['height']) : (isset($_GET['height']) ? intval($_GET['height']) : 0);
$finalUrl = apply_resolution($url, $preset, $w, $h);

function stream_type($url) {
    $u = strtolower($url);
    if (str_contains($u, '.m3u8')) return 'hls';
    if (str_contains($u, '.mp4')) return 'mp4';
    if (str_contains($u, 'mjpeg') || str_contains($u, '.mjpg') || str_contains($u, '.cgi')) return 'mjpeg';
    // default assume MJPEG/snapshot style
    return 'mjpeg';
}
$type = stream_type($finalUrl);
?>
<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Cam Stream</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 20px; }
    .wrap { display: grid; grid-template-columns: 1fr 320px; gap: 16px; align-items: start; }
    .panel { border: 1px solid #ddd; border-radius: 12px; padding: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
    .stream { background: #000; aspect-ratio: 16/9; display: grid; place-items: center; border-radius: 12px; overflow: hidden; }
    .stream img, .stream video { width: 100%; height: 100%; object-fit: contain; background: #000; }
    label { display: block; font-size: 14px; margin-top: 8px; }
    input, select, button { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 8px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .muted { color: #666; font-size: 12px; }
    .danger { color: #b00; }
  </style>
</head>
<body>
  <h1>Streaming dalla CAM</h1>
  <div class="wrap">
    <div class="panel">
      <div class="stream" id="streamBox">
        <?php if ($finalUrl): ?>
          <?php if ($type === 'mjpeg'): ?>
            <img id="mjpeg" src="proxy.php?mode=stream&url=<?= htmlspecialchars(urlencode($finalUrl)) ?>" alt="stream" />
          <?php elseif ($type === 'mp4'): ?>
            <video id="mp4" src="proxy.php?mode=file&url=<?= htmlspecialchars(urlencode($finalUrl)) ?>" controls autoplay muted></video>
          <?php else: // hls or unknown ?>
            <div style="color:#fff; padding:12px; text-align:center">HLS non supportato nativamente qui. Usa Safari oppure configura il device per MJPEG/MP4.<br>URL attuale: <?= htmlspecialchars($finalUrl) ?></div>
          <?php endif; ?>
        <?php else: ?>
          <div style="color:#fff">Inserisci un URL e premi Visualizza.</div>
        <?php endif; ?>
      </div>
    </div>

    <div class="panel">
      <form method="post">
        <label>URL sorgente (http/https)</label>
        <input type="url" name="url" required placeholder="http://IP/path" value="<?= htmlspecialchars($url) ?>" />

        <div class="row">
          <div>
            <label>Username (se richiesto)</label>
            <input type="text" name="username" value="<?= htmlspecialchars($auth['username']) ?>" autocomplete="username" />
          </div>
          <div>
            <label>Password</label>
            <input type="password" name="password" value="<?= htmlspecialchars($auth['password']) ?>" autocomplete="current-password" />
          </div>
        </div>

        <label>Preset risoluzione</label>
        <select name="preset">
          <option value="">(nessuno)</option>
          <option value="480p" <?= $preset==='480p'?'selected':'' ?>>480p</option>
          <option value="720p" <?= $preset==='720p'?'selected':'' ?>>720p</option>
          <option value="1080p" <?= $preset==='1080p'?'selected':'' ?>>1080p</option>
        </select>

        <div class="row">
          <div>
            <label>Larghezza (px)</label>
            <input type="number" name="width" min="0" value="<?= $w ?: '' ?>" />
          </div>
          <div>
            <label>Altezza (px)</label>
            <input type="number" name="height" min="0" value="<?= $h ?: '' ?>" />
          </div>
        </div>

        <button type="submit" style="margin-top:12px">Visualizza / Aggiorna</button>
      </form>
      <p class="muted">Suggerimento: molti device accettano parametri come <code>width</code>/<code>height</code>, <code>w</code>/<code>h</code>, <code>size</code>=<em>WxH</em> o <code>resolution</code>=<em>WxH</em>. Questo form li aggiunge tutti per compatibilità.</p>
      <p class="muted danger">Nota sicurezza: le credenziali vengono usate lato server tramite proxy.php per evitare che compaiano nell'URL del browser.</p>
    </div>
  </div>
</body>
</html>

<?php
// =========================
// File: proxy.php
// Purpose: Simple relay for camera streams/files with optional Basic Auth
// =========================
// Save this as proxy.php in the same directory as stream.php
?>
<?php if (basename(__FILE__) === 'proxy.php') { /* this block will not run when included above */ } ?>
<?php
// ------------ proxy.php (standalone) ------------
// Place this content in a separate file named proxy.php
/*
<?php
session_start();
$mode = $_GET['mode'] ?? 'stream'; // 'stream' for MJPEG/snapshot, 'file' for mp4
$raw = $_GET['url'] ?? '';
$url = urldecode($raw);

function bad($code, $msg){ http_response_code($code); header('Content-Type: text/plain'); echo $msg; exit; }

if (!$url || !preg_match('~^https?://~i', $url)) bad(400, 'URL non valido');

$auth = $_SESSION['cam_auth'] ?? ['username'=>'','password'=>''];
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, false); // stream directly
curl_setopt($ch, CURLOPT_HEADER, false);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
curl_setopt($ch, CURLOPT_TIMEOUT, 0); // stream
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

if (!empty($auth['username'])) {
    curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
    curl_setopt($ch, CURLOPT_USERPWD, $auth['username'].':'.$auth['password']);
}

// Forward content-type by peeking the header first
curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($ch, $header) {
    $len = strlen($header);
    $header = trim($header);
    if (stripos($header, 'Content-Type:') === 0) {
        header($header);
    }
    return $len;
});

// Stream out
curl_exec($ch);
if (curl_errno($ch)) {
    bad(502, 'Errore proxy: '.curl_error($ch));
}
curl_close($ch);
?>
*/
