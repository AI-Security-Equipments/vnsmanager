<?php
require_once '../_/start.php';
header('Content-Type: application/json');

class devices {

    public function __construct() {}

    public function _do ($a, $b = NULL) {
      	$x = '';
        switch ($a) {
            case 'get_all':
                $x = $this->get_all();
                break;
            case 'get_device':
                $x = $this->set($b);
                break;
        }
        echo $x;
    }

    // Normalizza il tipo (es. 'webcam', 'unknown', ecc.)
    private function normalizeType(string $raw): string {
        $raw = trim($raw);
        $upper = strtoupper($raw);

        // Mantieni i tipi logici maiuscoli
        if (in_array($upper, ['MAIN', 'SUBNET', 'TYPE'])) {
            return $upper;
        }

        // Normalizza webcam, fallback ad altro tipo
        if (stripos($raw, 'webcam') !== false) return 'webcam';

        return $raw; // o return $raw; se vuoi mantenere come da input
    }

    // Costruisce un array "raw" Device da usare in formatElement()
    private function buildDeviceNode(array $d): array {
        return [
            "DE_id"       => $d['id'],
            "DE_ip"       => $d['ip'] ?? '',
            "DE_mac"      => $d['mac'] ?? '',
            "DE_alias"    => $d['alias'] ?? null,
            "DE_vendor"   => $d['vendor'] ?? '',
            "DE_https"    => $d['https'] ?? 'N',
            "DE_http"     => $d['http'] ?? 'N',
            "DE_rtsp"     => $d['rtsp'] ?? 'N',
            "DE_user"     => $d['user'] ?? null,
            "DE_password" => $d['password'] ?? null,
            "DE_status"   => $d['status'] ?? 'U',
            "DE_type"     => $d['type'] ?? 'unknown',
            "DE_hops"     => $d['hops'] ?? 0,
            "DE_link_to"  => $d['link_to'] ?? 0,
            "DE_gateway"  => $d['gateway'] ?? ''
        ];
    }

    // Prende un nodo "raw" DE_ e restituisce l'elemento formattato per JS (elements[])
    private function formatElement(array $dev): array {
        $type = $this->normalizeType($dev['DE_type']);
        $id   = $dev['DE_id'];
        $parent = null;

        // Assegna parent in base alla gerarchia
        if ($type === 'SUBNET') {
            $parent = 'main'; // il nodo principale ha id fisso 'main'
        } elseif ($type === 'TYPE') {
            $parent = $dev['DE_link_to']; // parent = subnet
        } elseif ($type !== 'TYPE' && $type !== 'SUBNET' && $type !== 'MAIN') {
            $parent = $dev['DE_link_to']; // parent = type
        }

        return [
            "data" => [
                "id"        => $dev['DE_id'],
                "label"     => $dev['DE_alias'] ?? $dev['DE_vendor'],
                "type"      => $this->normalizeType($dev['DE_type']),
                "status"    => $dev['DE_status'],
                "ip"        => $dev['DE_ip'],
                "mac"       => $dev['DE_mac'],
                "https"     => $dev['DE_https'],
                "http"      => $dev['DE_http'],
                "rtsp"      => $dev['DE_rtsp'],
                "hasCreds"  => !empty($dev['DE_user']) && !empty($dev['DE_password']),
                "hops"      => $dev['DE_hops'],
                "link_to"   => $dev['DE_link_to'] ?? 0,
                "priority"  => $this->getPriority($dev),
                "isVirtual" => in_array($type, ['MAIN', 'SUBNET', 'TYPE']) ? 1 : 0
                //"parent"    => $parent
            ]
        ];
    }

    private function getPriority(array $dev): int {
        $type = strtoupper(trim($dev['DE_type'] ?? ''));

        return match (true) {
            $dev['DE_hops'] < 0                 => 100,  // MAIN
            $type === 'SUBNET'                  => 80,
            $type === 'TYPE'                    => 60,
            str_contains($type, 'WEBCAM')       => 50,
            default                             => 40    // DEVICE generico
        };
    }


    // Crea un edge per JS e incrementa automaticamente l'ID
    private function buildEdge(string|int $source, string|int $target, int &$edgeId): array {
        return [
            "data" => [
                "id"     => "e" . $edgeId++,
                "source" => $source,
                "target" => $target,
                "group"  => "edges"
            ]
        ];
    }
    
    private function get_all(): string {
        global $db;
        $rows = $db->doQuery("get_all_devices", []);

        $elements = [];
        $edges = [];
        $edgeId = 0;
        $subnetMap = [];
        $typeMap = [];
        $mainId = null;

        // 1. Trova e inserisci il nodo principale
        foreach ($rows as $i => $r) {
            if ((int)$r['DE_hops'] < 0) {
                $r['DE_vendor'] = 'VNS MANAGER';
                $r['DE_type'] = 'MAIN';
                $elements[] = $this->formatElement($r);
                $mainId = $r['DE_id'];
                unset($rows[$i]);
                break;
            }
        }
        $rows = array_values($rows);

        // 2. Analizza e costruisci i nodi rimanenti
        foreach ($rows as $r) {
            $subnet = $r['DE_gateway'] ? str_replace('.', '', $r['DE_gateway']) : null;
            $typeList = explode('|', $r['DE_type'] ?? '');
            $firstType = $this->normalizeType($r['DE_type'] ?? '');
            $typeKey = $subnet . '_' . $firstType;

            // 2a. Crea Subnet se non esiste
            if ($subnet && !isset($subnetMap[$subnet])) {
                $subnetId = "sub" . str_pad(count($subnetMap) + 1, 2, '0', STR_PAD_LEFT);
                $subnetMap[$subnet] = $subnetId;

                $elements[] = $this->formatElement($this->buildDeviceNode([
                    'id' => $subnetId,
                    'ip' => $r['DE_gateway'] ?? '',
                    'vendor' => 'SUBNET',
                    'type' => 'SUBNET',
                    'link_to' => $mainId
                ]));

                $edges[] = $this->buildEdge($mainId, $subnetId, $edgeId);
            }

            // 2b. Crea TYPE se non esiste
            if ($subnet && !isset($typeMap[$typeKey])) {
                $typeId = "type" . str_pad(count($typeMap) + 1, 2, '0', STR_PAD_LEFT);
                $typeMap[$typeKey] = $typeId;

                $elements[] = $this->formatElement($this->buildDeviceNode([
                    'id' => $typeId,
                    'ip' => $r['DE_gateway'] ?? '',
                    'vendor' => $firstType,
                    'type' => 'TYPE',
                    'link_to' => $subnetMap[$subnet]
                ]));

                $edges[] = $this->buildEdge($subnetMap[$subnet], $typeId, $edgeId);
            }

            // 2c. Inserisci device e collega a TYPE o SUBNET
            $linkTo = $typeMap[$typeKey] ?? $subnetMap[$subnet] ?? 0;
            $r['DE_link_to'] = $linkTo;

            $elements[] = $this->formatElement($r);

            if ($linkTo) {
                $edges[] = $this->buildEdge($linkTo, $r['DE_id'], $edgeId);
            }
        }

        return json_encode(array_merge($elements, $edges), JSON_PRETTY_PRINT);
    }

    private function get_device($id) {
        global $db;
        return json_encode($db->doQuery("get_single_devices", ['id' => $id]));
    }
}
$G = [];
$CC = new devices();

$uri = trim($_SERVER['QUERY_STRING']);
$parts = explode('/', $uri);

if ( in_array('devices', $parts) ) {
  if (in_array('get_all', $parts)) {
    $CC->_do( 'get_all');
  }
  if (in_array('get_device', $parts)) {
   $CC->_do( 'get_device', $_POST['id']??0 );
  }
}
exit();