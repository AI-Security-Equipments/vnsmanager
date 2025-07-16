<?php ob_start(); ?>
<div class="tabs mt-3">
  <div class="d-flex overflow-auto border-bottom mb-2">
    <ul class="nav nav-tabs flex-nowrap">
      <?php foreach (['device','auth','link','cam','mqtt','interactions','advanced'] as $i => $tab): ?>
        <li class="nav-item">
          <a class="nav-link<?= $i === 0 ? ' active' : '' ?>" data-bs-toggle="tab" href="#<?= $tab ?>"><?= ucfirst($tab) ?></a>
        </li>
      <?php endforeach; ?>
    </ul>
  </div>

  <div class="tab-content p-3 border border-top-0 bg-light rounded-bottom">
    <div class="tab-pane fade show active" id="device">
      <h5><?= htmlspecialchars($device['DE_alias'] ?: $device['DE_vendor']) ?></h5>
      <p><?= nl2br(htmlspecialchars($device['DE_notes'] ?? '')) ?></p>
      <p>IP: <?= $device['DE_ip'] ?> | MAC: <?= $device['DE_mac'] ?></p>
    </div>

    <div class="tab-pane fade" id="auth">
      <?= ($device['DE_user'] || $device['DE_password']) 
        ? "<p>User: <strong>{$device['DE_user']}</strong></p><p>Password: " . str_repeat('•', strlen($device['DE_password'])) . "</p>" 
        : "<p class='text-muted'>Nessuna autenticazione configurata.</p>" ?>
    </div>

    <div class="tab-pane fade" id="link">
      <?php
        if ($mqtt) {
          echo "<p><strong>MQTT:</strong></p><ul>";
          foreach ($mqtt as $m) echo "<li>" . htmlspecialchars($m['MQ_topic']) . "</li>";
          echo "</ul>";
        }
        if ($onvif) {
          echo "<p><strong>ONVIF:</strong></p><ul>";
          foreach ($onvif as $o) echo "<li>" . htmlspecialchars($o['ON_capability']) . " — " . htmlspecialchars($o['ON_api_call']) . "</li>";
          echo "</ul>";
        }
        if (!$mqtt && !$onvif) echo "<p class='text-muted'>Nessun link disponibile.</p>";
      ?>
    </div>

    <div class="tab-pane fade" id="cam">
      <?php if (stripos($device['DE_type'], 'cam') !== false): ?>
        <video class="w-100 rounded border mb-2" controls autoplay muted>
          <source src="<?= htmlspecialchars($device['DE_stream_url']) ?>" type="video/mp4">
        </video>
        <div>
          <?php foreach ($onvif as $o) if (stripos($o['ON_capability'], 'PTZ') !== false): ?>
            <button class="btn btn-primary w-100 mb-2"><?= $o['ON_api_call'] ?></button>
          <?php endif; ?>
        </div>
      <?php else: ?>
        <p class="text-muted">Nessuna cam identificata.</p>
      <?php endif; ?>
    </div>

    <div class="tab-pane fade" id="mqtt">
      <?php if ($mqtt): ?>
        <div class="row row-cols-1 row-cols-md-2 g-2">
          <?php foreach ($mqtt as $m): ?>
            <div class="col">
              <div class="card h-100 p-2">
                <div class="fw-bold"><?= htmlspecialchars($m['MQ_command']) ?></div>
                <code><?= htmlspecialchars($m['MQ_payload']) ?></code>
              </div>
            </div>
          <?php endforeach; ?>
        </div>
      <?php else: ?>
        <p class="text-muted">Nessun comando MQTT disponibile.</p>
      <?php endif; ?>
    </div>

    <div class="tab-pane fade" id="interactions">
      <?php if ($actions): ?>
        <ul class="list-unstyled">
          <?php foreach ($actions as $a): ?>
            <li class="mb-1">
              <strong><?= htmlspecialchars($a['AC_name']) ?></strong> (<?= $a['AC_type'] ?>)
              → <code><?= htmlspecialchars($a['AC_payload']) ?></code>
            </li>
          <?php endforeach; ?>
        </ul>
      <?php else: ?>
        <p class="text-muted">Nessuna azione configurata.</p>
      <?php endif; ?>
    </div>

    <div class="tab-pane fade" id="advanced">
      <?php foreach (['Reset'=>'danger','Restart'=>'warning','Update'=>'secondary','Shutdown'=>'dark'] as $label => $style): ?>
        <button class="btn btn-<?= $style ?> w-100 mb-2"><?= $label ?> Device</button>
      <?php endforeach; ?>
    </div>
  </div>
</div>
<?php return ob_get_clean(); ?>
