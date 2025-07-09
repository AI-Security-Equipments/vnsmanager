<?php

class crud
{
    private PDO $db;
    private array $session;
    private string $stable;

    public function __construct(PDO $db, array $session, string $stable)
    {
        $this->db = $db;
        $this->session = $session;
        $this->stable = $stable;
    }

    public function handleRequest(string $action, string $params = '', string $id = ''): string
    {
        return match ($action) {
            'save' => $this->saveRecord($params),
            'delete' => $this->deleteRecord($params),
            default => $this->renderForm($id, $action)
        };
    }

    private function renderForm(string $id, string $action): string
    {
        $stmt = $this->db->prepare("SELECT * FROM column_meta WHERE table_name = :t ORDER BY position");
        $stmt->execute(['t' => $this->stable]);
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $html = '';
        foreach ($columns as $col) {
            $html .= $this->renderInput($col, $id, $action);
        }
        return "<form method='post'>{$html}<button type='submit' class='btn btn-primary'>Save</button></form>";
    }

    private function fetchValue(array $col, string $id, string $action): string
    {
        if (!$id || $action === 'dup') return '';

        $stmt = $this->db->prepare("SELECT {$col['cn']} FROM {$this->stable} WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return htmlspecialchars($row[$col['cn']] ?? '');
    }

    private function renderInput(array $col, string $id, string $action): string
    {
        $name = htmlspecialchars($col['cn'] ?? '');
        $label = ucfirst(str_replace('_', ' ', $name));
        $type = match (strtolower($col['dt'] ?? 'text')) {
            'date' => 'date',
            'datetime' => 'datetime-local',
            'int', 'float', 'decimal' => 'number',
            'text' => 'textarea',
            default => 'text'
        };

        $value = $this->fetchValue($col, $id, $action);
        $props = array_filter(array_map('trim', explode(';', $col['cc'] ?? '')));
        $required = in_array('REQ', $props) ? 'required' : '';
        $readonly = in_array('READONLY', $props) ? 'readonly disabled' : '';
        $maxlength = isset($col['cl']) && is_numeric($col['cl']) ? 'maxlength="' . intval($col['cl']) . '"' : '';
        $pattern = '';
        $extraField = '';

        foreach ($props as $p) {
            if (str_starts_with($p, 'ALIAS:')) {
                $label = trim(str_replace('ALIAS:', '', $p));
            }
            if (str_starts_with($p, 'VARSESSION:')) {
                $key = trim(str_replace('VARSESSION:', '', $p));
                $value = $this->session[$key] ?? $value;
            }
        }

        if (in_array('ENCODE', $props) && $value !== '') {
            $value = $this->decodeValue($value);
        }

        if (in_array('PASSWORD', $props)) {
            $type = 'password';
            $value = '';
        }

        $useAutoSelect = in_array('AUTOLOCK', $props);
        $useDatalist = in_array('AUTO', $props) || preg_grep('/^SQL:.+/', $props);

        if ($useAutoSelect || $useDatalist) {
            $listId = 'list_' . $name;
            $sqlColumn = $name;
            $sqlQuery = null;

            foreach ($props as $p) {
                if (str_starts_with($p, 'SQL:')) {
                    $sqlColumn = trim(str_replace('SQL:', '', $p));
                    $sqlQuery = "SELECT DISTINCT id, value FROM $sqlColumn WHERE domain = :domain ORDER BY value";
                    break;
                }
            }

            if (!$sqlQuery) {
                $sqlQuery = "SELECT DISTINCT $sqlColumn AS id, $sqlColumn AS value FROM {$this->stable} WHERE domain = :domain ORDER BY value";
            }

            $stmt = $this->db->prepare($sqlQuery);
            $stmt->execute(['domain' => $this->session['domain'] ?? 0]);
            $options = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if ($useAutoSelect) {
                $extraField .= "<select class=\"form-select\" name=\"$name\" id=\"$name\" $required $readonly>";
                foreach ($options as $opt) {
                    $val = htmlspecialchars($opt['id']);
                    $labelOpt = htmlspecialchars($opt['value'] ?? $opt['id']);
                    $selected = ($value == $val) ? 'selected' : '';
                    $extraField .= "<option value=\"$val\" $selected>$labelOpt</option>";
                }
                $extraField .= "</select>";
            } else {
                $extraField .= "<input type=\"$type\" class=\"form-control\" name=\"$name\" id=\"$name\" value=\"$value\" $required $readonly $maxlength $pattern list=\"$listId\">";
                $extraField .= "<datalist id=\"$listId\">";
                foreach ($options as $opt) {
                    $val = htmlspecialchars($opt['value'] ?? $opt['id']);
                    $extraField .= "<option value=\"$val\"></option>";
                }
                $extraField .= "</datalist>";
            }
        }

        if (!$extraField) {
            if ($type === 'text' && $maxlength) {
                $pattern = 'pattern=".{1,' . intval($col['cl']) . '}"';
            }
            if ($type === 'textarea') {
                return <<<HTML
<div class="mb-3">
    <label for="$name" class="form-label">$label</label>
    <textarea class="form-control" name="$name" id="$name" $required $readonly $maxlength>$value</textarea>
</div>
HTML;
            }
            $extraField = <<<HTML
<input type="$type" class="form-control" name="$name" id="$name" value="$value" $required $readonly $maxlength $pattern>
HTML;
        }

        return <<<HTML
<div class="mb-3">
    <label for="$name" class="form-label">$label</label>
    $extraField
</div>
HTML;
    }

    private function saveRecord(string $params): string
    {
        parse_str($params, $data);

        foreach ($data as $key => $val) {
            if (stripos($key, 'password') !== false && trim($val) !== '') {
                $salt = bin2hex(random_bytes(16));
                $data[$key . '_Salt'] = $salt;
                $data[$key] = hash('sha256', $val . $salt);
            } elseif (stripos($key, 'password') !== false && trim($val) === '') {
                unset($data[$key]);
            } elseif (stripos($key, 'wysihtml5_mode') !== false) {
                unset($data[$key]);
            } elseif (stripos($key, '_domain') !== false) {
                $data[$key] = $val === '' || $val === '0' ? $this->session['domain'] ?? 0 : $val;
            } elseif (stripos($key, '_itsamu_id') !== false) {
                $data[$key] = $val === '' || $val === '0' ? $this->session['ITSAMU_id'] ?? 0 : $val;
            } elseif (stripos($key, '_lang') !== false) {
                $data[$key] = $val === '' || $val === '0' ? $this->session['lang'] ?? 'it' : $val;
            } elseif (stripos($key, '_from') !== false || stripos($key, '_to') !== false) {
                $data[$key] = $val === '' || $val === '0' ? null : $val;
            } elseif (stripos($key, 'encode') !== false) {
                $data[$key] = $this->encodeValue($val);
            }
        }

        $columns = array_keys($data);
        $placeholders = implode(', ', array_map(fn($col) => ":$col", $columns));
        $updates = implode(', ', array_map(fn($col) => "$col = VALUES($col)", $columns));
        $cols = implode(', ', $columns);

        $sql = "INSERT INTO {$this->stable} ($cols) VALUES ($placeholders) ON DUPLICATE KEY UPDATE $updates";
        $stmt = $this->db->prepare($sql);

        foreach ($data as $key => &$val) {
            $stmt->bindValue(":" . $key, $val);
        }

        $stmt->execute();
        return 'Record saved';
    }

    private function deleteRecord(string $params): string
    {
        parse_str($params, $data);
        $key = array_key_first($data);
        $stmt = $this->db->prepare("DELETE FROM {$this->stable} WHERE $key = :val");
        $stmt->execute(['val' => $data[$key]]);
        return 'Record deleted';
    }

    private function decodeValue(string $cipher): string
    {
        $key = 'b33';
        return str_replace('\\', '', openssl_decrypt($cipher, 'aes-256-cbc', $key));
    }

    private function encodeValue(string $plain): string
    {
        $key = 'b33';
        return openssl_encrypt($plain, 'aes-256-cbc', $key);
    }
}
