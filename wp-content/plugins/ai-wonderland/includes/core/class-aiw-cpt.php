<?php
/**
 * AI Wonderland Custom Post Types & Taxonomies
 */

if (!defined('ABSPATH')) exit;

class AIW_CPT {
    public static function register() {
        // Register Custom Post Type: aiw_project
        register_post_type('aiw_project', [
            'labels' => [
                'name' => __('AIW Projects', 'ai-wonderland'),
                'singular_name' => __('AIW Project', 'ai-wonderland'),
            ],
            'public' => false,
            'show_ui' => true,
            'show_in_rest' => true,
            'rest_base' => 'aiw-projects',
            'supports' => ['title', 'editor', 'author', 'custom-fields', 'revisions'],
            'capability_type' => 'post',
            'map_meta_cap' => true,
        ]);

        // Register Custom Post Type: aiw_template
        register_post_type('aiw_template', [
            'labels' => [
                'name' => __('AIW Templates', 'ai-wonderland'),
                'singular_name' => __('AIW Template', 'ai-wonderland'),
            ],
            'public' => true,
            'show_ui' => true,
            'show_in_rest' => true,
            'rest_base' => 'aiw-templates',
            'supports' => ['title', 'editor', 'custom-fields'],
            'capability_type' => 'post',
        ]);

        // Register Custom Post Type: aiw_component
        register_post_type('aiw_component', [
            'labels' => [
                'name' => __('AIW Components', 'ai-wonderland'),
                'singular_name' => __('AIW Component', 'ai-wonderland'),
            ],
            'public' => false,
            'show_ui' => true,
            'show_in_rest' => true,
            'rest_base' => 'aiw-components',
            'supports' => ['title', 'editor', 'custom-fields'],
            'capability_type' => 'post',
        ]);

        // Register Taxonomy: aiw_category
        register_taxonomy('aiw_category', ['aiw_template', 'aiw_component'], [
            'labels' => [
                'name' => __('AIW Categories', 'ai-wonderland'),
                'singular_name' => __('AIW Category', 'ai-wonderland'),
            ],
            'hierarchical' => true,
            'show_in_rest' => true,
            'public' => true,
        ]);
    }
}
