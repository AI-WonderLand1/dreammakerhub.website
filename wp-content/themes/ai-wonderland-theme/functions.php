<?php
/**
 * AI Wonderland Theme Functions
 */

if (!defined('ABSPATH')) exit;

function aiw_theme_setup() {
    add_theme_support('wp-block-styles');
    add_theme_support('align-wide');
    add_theme_support('responsive-embeds');
    add_theme_support('editor-styles');
    add_theme_support('post-thumbnails');
}
add_action('after_setup_theme', 'aiw_theme_setup');

function aiw_theme_enqueue_assets() {
    wp_enqueue_style('aiw-theme-style', get_stylesheet_uri(), [], '1.0.0');
}
add_action('wp_enqueue_scripts', 'aiw_theme_enqueue_assets');
