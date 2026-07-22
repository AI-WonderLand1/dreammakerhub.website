<?php
/**
 * Plugin Name: AI Wonderland
 * Plugin URI: https://aiwonderland.io
 * Description: The engine for AI-generated WordPress experiences.
 * Version: 1.0.0
 * Author: AI Wonderland Architect
 * License: GPL2
 */

if (!defined('ABSPATH')) exit;

// Define constants
define('AIW_PLUGIN_PATH', plugin_dir_path(__FILE__));

// Load Core
require_once AIW_PLUGIN_PATH . 'includes/core/class-aiw-plugin.php';

// Initialize Plugin
function run_ai_wonderland() {
    $plugin = new AIW_Plugin();
    $plugin->init();
}
run_ai_wonderland();
