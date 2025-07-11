<?php
//|--7.6.797--|//
if (session_status() === PHP_SESSION_NONE) { session_start(); }

$_SESSION["debug"] = false;

final class DatabaseManager {
	private PDO $connection;

	public function runQuery(string $queryName, array $params = [], ?int $unescape = 0): array|string|null {
		$this->connection = $this->connect();
		if (!str_contains($queryName, ';')) {
			return $this->executeQuery($queryName, $this->connection, $params, $unescape);
		}
		$queries = explode(';', $queryName);
		foreach ($queries as $index => $q) {
			$this->executeQuery($q, $this->connection, $params[$index] ?? [], $unescape);
		}
		return '';
	}

	private function connect($pdoIndex): PDO {
		$config = $this->getConnectionConfig($pdoIndex);
		try {
			$pdo = new PDO(
				"{$config->lib}:host={$config->host};dbname={$config->db_name}",
				$config->username,
				$config->password
			);
			$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			$pdo->setAttribute(PDO::ATTR_TIMEOUT, 5);
			$pdo->exec("SET NAMES utf8");
			$pdo->exec("SET lc_time_names = 'it_IT'");
			$pdo->exec("SET sql_mode = 'NO_ENGINE_SUBSTITUTION'");
			return $pdo;
		} catch (PDOException $e) {
			$this->debug($e->getMessage());
			throw $e; 
		}
	}

	private function getConnectionConfig($pdoIndex): object {
		$configs = [
			1 => (object)[
				'host'     => 'localhost',
				'db_name'  => 'vnsmanager_device',
				'username' => 'root',
				'password' => '123456',
				'lib'      => 'mysql'
			],
			2 => (object)[
				'host'     => 'localhost',
				'db_name'  => 'vnsmanager',
				'username' => 'root',
				'password' => '123456',
				'lib'      => 'mysql'
			]
		];
		return $configs[$pdoIndex] ?? $configs[1];
	}

	public function doQuery(string $queryName, array $params = [], int $pdoIndex = 1): array|string|null {
		$pdo = $this->connect($pdoIndex);
		$sql = $this->resolveQuery($queryName, $pdo);
		$sql = is_array($params) || is_object($params)
			? $this->mapParams($sql, $this->mergeSessionParams($params))
			: $sql;
		$this->debug($sql);
		try {
			$stmt = $pdo->prepare($sql);
			$stmt->execute();
			if (str_contains($sql, 'LAST_INSERT_ID()')) { return $pdo->lastInsertId(); }
			return $stmt->fetchAll(PDO::FETCH_ASSOC);
		} catch (PDOException $e) {
			$this->debug($e->getMessage());
			return ['error' => $e->getMessage()];
		}
	}

	private function resolveQuery(string $queryName, PDO $pdo): string {
		$stmt = $pdo->prepare("SELECT _do('$queryName') as q;");
		$this->debug("resolveQuery: SELECT _do('$queryName') as q;");
		$stmt->execute();
		$result = $stmt->fetch(PDO::FETCH_ASSOC);
		return $result['q'] ?? '';
	}

	private function mergeSessionParams(array $params = []): array {
		return array_merge([
			'u' => $_SESSION['ITSAMU_id'] ?? 0,
			'd' => $_SESSION['domain'] ?? 0,
			's' => $_SESSION['subdomain'] ?? 0,
			't' => $_SESSION['type'] ?? 0,
			'l' => $_SESSION['lang'] ?? 'EN',
			'k' => $_SESSION['token'] ?? '',
			'i' => $_SESSION['iip'] ?? '',
		], $params);
	}

	private function mapParams(string $sql, array $params): string {
		foreach ($params as $key => $value) {
			if (!is_array($value) && !is_object($value) && $value !== '') {
				$sql = str_replace('{' . $key . '}', addslashes((string)$value), $sql);
			}
		}
		if (str_contains($sql, ';;')) {
			$sql = str_replace("\\'", "'", $sql);
		}
		return $sql;
	}

	private function debug(mixed $data): void {
		if ($_SESSION["debug"] ?? false) {
			var_dump($data);
		}
	}
}

if (!isset($db)) {
	global $db;
	$db = new DatabaseManager();
}
?>
