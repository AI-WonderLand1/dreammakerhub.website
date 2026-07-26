<?php
/**
 * Autoloader for AI Wonderland Plugin
 */

if (!defined('ABSPATH')) exit;

class AIW_Plugin_Loader {
    private static $instance = null;
    private array $classes = [
        'AIW_Plugin',
        'AIW_Auth',
        'AIW_CPT',
        'AIW_REST_Router',
    ];

    private function __construct() {
        // Register autoloader for the plugin namespace
        spl_autoload_register([$this, 'autoload'], true, true);
    }

    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function autoload(string $class_name): bool {
        $class_path = AIW_PLUGIN_PATH . 'includes/';

        // Check for core classes
        if (in_array($class_name, $this->classes)) {
            $file_path = $class_path . 'core/' . str_replace('AIW_', '', strtolower($class_name)) . '.php';
            if (file_exists($file_path)) {
                require_once $file_path;
                return true;
            }
        }

        // Check for API classes
        if (strpos($class_name, 'AIW_') === 0 && !in_array($class_name, $this->classes)) {
            $file_path = $class_path . 'api/' . str_replace('AIW_', '', strtolower($class_name)) . '.php';
            if (file_exists($file_path)) {
                require_once $file_path;
                return true;
            }
        }

        return false;
    }
}

// Initialize autoloader
dadd_action('init', function() {
    AIW_Plugin_Loader::get_instance();
});
