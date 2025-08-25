<?php
require_once '../_/start.php';
header('Content-Type: application/json');

class devices {
    public function __construct() {}

    public function _do ($a, $b = NULL) {
        $x = '';
        switch ($a) {
            case 'get_all':    $x = $this->get_all(); break;
            case 'get_device': $x = $this->get_device($b); break;
        }
        echo $x;
    }

    private function normalizeType(string $raw): string {
        $raw = trim($raw);
        $upper = strtoupper($raw);
        if (in_array($upper, ['MAIN','SUBNET','TYPE'])) return $upper;
        if (stripos($raw, 'webcam') !== false) return 'webcam';
        return $raw;
    }

    /** Costruisce URL utili in base ai flag *_conn e IP */
    private function buildUrls(array $dev): array {
        $ip   = $dev['DE_ip'] ?? '';
        $p8080= ($dev['DE_8080_conn'] ?? 'N') === 'Y';
        $http = ($dev['DE_http_conn']  ?? 'N') === 'Y';
        $https= ($dev['DE_https_conn'] ?? 'N') === 'Y';
        $rtsp = ($dev['DE_rtsp_conn']  ?? 'N') === 'Y';
        $rtsps= ($dev['DE_rtsps_conn'] ?? 'N') === 'Y';

        $httpUrl  = ($http && $ip)  ? 'http://'  . $ip . ($p8080 ? ':8080' : '') : '';
        $httpsUrl = ($https && $ip) ? 'https://' . $ip : '';
        $rtspUrl  = ($rtsp  && $ip) ? 'rtsp://'  . $ip : '';
        $rtspsUrl = ($rtsps && $ip) ? 'rtsps://' . $ip : '';

        // per retrocompatibilità: `rtsp` preferisce rtsps se presente
        return [
            'http'  => $httpUrl,
            'https' => $httpsUrl,
            'rtsp'  => $rtspsUrl ?: $rtspUrl,
            'rtsps' => $rtspsUrl
        ];
    }

    /** Nodo virtuale rapido (SUBNET/TYPE) per reuse */
    private function buildDeviceNode(array $d): array {
        return [
            "DE_id"         => $d['id'],
            "DE_ip"         => $d['ip'] ?? '',
            "DE_mac"        => $d['mac'] ?? '',
            "DE_alias"      => $d['alias'] ?? null,
            "DE_vendor"     => $d['vendor'] ?? '',
            "DE_http_conn"  => $d['http_conn']  ?? 'N',
            "DE_8080_conn"  => $d['8080_conn']  ?? 'N',
            "DE_https_conn" => $d['https_conn'] ?? 'N',
            "DE_rtsp_conn"  => $d['rtsp_conn']  ?? 'N',
            "DE_rtsps_conn" => $d['rtsps_conn'] ?? 'N',
            "DE_mqtt_conn"  => $d['mqtt_conn']  ?? 'N',
            "DE_mqtts_conn" => $d['mqtts_conn'] ?? 'N',
            "DE_onvif_conn" => $d['onvif_conn'] ?? 'N',
            "DE_user"       => $d['user'] ?? null,
            "DE_password"   => $d['password'] ?? null,
            "DE_status"     => $d['status'] ?? 'U',
            "DE_type"       => $d['type'] ?? 'unknown',
            "DE_hops"       => $d['hops'] ?? 0,
            "DE_link_to"    => $d['link_to'] ?? 0,
            "DE_gateway"    => $d['gateway'] ?? ''
        ];
    }

    /** Trasforma un record DB in elemento per Cytoscape/render.js */
    private function formatElement(array $dev): array {
        $type = $this->normalizeType($dev['DE_type'] ?? 'unknown');
        $urls = $this->buildUrls($dev);

        return [
            "data" => [
                "id"        => $dev['DE_id'],
                "label"     => $dev['DE_alias'] ?? ($dev['DE_vendor'] ?? ''),
                "alias"     => $dev['DE_alias'] ?? null,              // <— richiesto da render.js
                "type"      => $type,
                "status"    => $dev['DE_status'] ?? 'U',
                "ip"        => $dev['DE_ip'] ?? '',
                "mac"       => $dev['DE_mac'] ?? '',
                // URL già pronti per il frontend
                "https"     => $urls['https'],
                "http"      => $urls['http'],
                "rtsp"      => $urls['rtsp'],
                "rtsps"     => $urls['rtsps'],
                // flag utili (se servono altrove)
                "onvif"     => $dev['DE_onvif_conn'] ?? 'N',
                "mqtt"      => $dev['DE_mqtt_conn']  ?? 'N',
                "mqtts"     => $dev['DE_mqtts_conn'] ?? 'N',
                "hasCreds"  => !empty($dev['DE_user']) && !empty($dev['DE_password']),
                "hops"      => (int)($dev['DE_hops'] ?? 0),
                "link_to"   => $dev['DE_link_to'] ?? 0,
                "priority"  => $this->getPriority($dev),
                "isVirtual" => in_array($type, ['MAIN','SUBNET','TYPE']) ? 1 : 0,
                "onvifUrl"  => (($dev['DE_onvif_conn'] ?? 'N') === 'Y' && !empty($dev['DE_ip']))
                        ? '/vnsmanager/onvif/viewer.php?ip=' . urlencode($dev['DE_ip'])
                        : '',
            ]
        ];
    }

    private function getPriority(array $dev): int {
        $type = strtoupper(trim($dev['DE_type'] ?? ''));
        $hops = (int)($dev['DE_hops'] ?? 0);
        return match (true) {
            $type === 'MAIN' || $hops === 0 => 100,
            $type === 'SUBNET'              => 80,
            $type === 'TYPE'                => 60,
            str_contains($type, 'WEBCAM')   => 50,
            default                         => 40,
        };
    }

    private function buildEdge(string|int $source, string|int $target, int &$edgeId): array {
        return ["data" => [
            "id" => "e".$edgeId++, "source"=>$source, "target"=>$target, "group"=>"edges"
        ]];
    }

    private function get_all(): string {
        global $db;
        $_SESSION["debug"] = 0;
        $rows = $db->doQuery("get_all_devices", []);

        $elements = [];
        $edges = [];
        $edgeId = 0;
        $subnetMap = [];
        $typeMap = [];
        $mainId = null;

        // MAIN (hops==0)
        foreach ($rows as $i => $r) {
            if ((int)($r['DE_hops'] ?? 0) === 0) {
                $r['DE_vendor'] = 'VNS MANAGER';
                $r['DE_type']   = 'MAIN';
                $elements[] = $this->formatElement($r);
                $mainId = $r['DE_id'];
                unset($rows[$i]);
                break;
            }
        }
        $rows = array_values($rows);

        foreach ($rows as $r) {
            $subnet = !empty($r['DE_gateway']) ? str_replace('.', '', $r['DE_gateway']) : null;
            $firstType = $this->normalizeType($r['DE_type'] ?? '');
            $typeKey = ($subnet ?? 'nosub') . '_' . $firstType;

            // SUBNET
            if ($subnet && !isset($subnetMap[$subnet])) {
                $subnetId = "sub" . str_pad(count($subnetMap)+1, 2, '0', STR_PAD_LEFT);
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

            // TYPE
            if ($subnet && !isset($typeMap[$typeKey])) {
                $typeId = "type" . str_pad(count($typeMap)+1, 2, '0', STR_PAD_LEFT);
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

            // DEVICE
            $linkTo = $typeMap[$typeKey] ?? $subnetMap[$subnet] ?? 0;
            $r['DE_link_to'] = $linkTo;

            $elements[] = $this->formatElement($r);
            if ($linkTo) $edges[] = $this->buildEdge($linkTo, $r['DE_id'], $edgeId);
        }

        return json_encode(array_merge($elements, $edges), JSON_PRETTY_PRINT);
    }

    private function get_device($id) {
        global $db;
        $_SESSION["debug"] = false;

        $device  = $db->doQuery("get_single_device", ["id"=>$id])[0] ?? null;
        if (!$device) {
            return json_encode(['ok'=>false,'html'=>'<p class="text-danger">Device non trovato.</p>']);
        }
        $mqtt    = $db->doQuery("get_single_mqtt",   ["id"=>$id])[0] ?? null;
        $onvif   = $db->doQuery("get_single_onvif",  ["id"=>$id])[0] ?? null;
        $actions = $db->doQuery("get_single_action", ["id"=>$id])[0] ?? null;

        $html = include 'device_tabs.php';
        return json_encode([
            'ok'=>true,
            'html'=>$html,
            'label'=>$device['DE_alias'] ?: ($device['DE_vendor'] ?: ($device['DE_type'] ?: 'Device'))
        ]);
    }
}

$CC = new devices();
$uri = trim($_SERVER['QUERY_STRING']);
$parts = explode('/', $uri);

if (in_array('devices', $parts)) {
  if (in_array('get_all', $parts))   $CC->_do('get_all');
  if (in_array('get_device', $parts))$CC->_do('get_device', $_POST['id']??0);
}
exit();
