<?php
/**
 * Main AI Wonderland Plugin Core Class
 */

if (!defined('ABSPATH')) exit;

require_once AIW_PLUGIN_PATH . 'includes/core/class-aiw-cpt.php';
require_once AIW_PLUGIN_PATH . 'includes/core/class-aiw-auth.php';
require_once AIW_PLUGIN_PATH . 'includes/api/class-aiw-rest-controller.php';

class AIW_Plugin {
    public function init() {
        // Initialize Auth
        AIW_Auth::init();

        // Register Custom Post Types
        add_action('init', ['AIW_CPT', 'register']);

        // Register REST API routes
        add_action('rest_api_init', [$this, 'register_rest_routes']);
    }

    public function register_rest_routes() {
        $controller = new AIW_REST_Controller();
        $controller->register_routes();
    }
}
