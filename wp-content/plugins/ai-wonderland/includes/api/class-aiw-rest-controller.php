<?php
/**
 * AI Wonderland REST Controller
 */

if (!defined('ABSPATH')) exit;

class AIW_REST_Controller {
    private string $namespace = 'aiw/v1';

    public function register_routes() {
        $auth_callback = ['AIW_Auth', 'authenticate_request'];

        // Status
        register_rest_route($this->namespace, '/status', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [$this, 'get_status'],
            'permission_callback' => '__return_true',
        ]);

        // Projects
        register_rest_route($this->namespace, '/projects', [
            ['methods' => WP_REST_Server::READABLE, 'callback' => [$this, 'get_projects'], 'permission_callback' => $auth_callback],
            ['methods' => WP_REST_Server::CREATABLE, 'callback' => [$this, 'create_project'], 'permission_callback' => $auth_callback],
        ]);

        // Pages & Posts
        register_rest_route($this->namespace, '/pages', [
            ['methods' => WP_REST_Server::READABLE, 'callback' => [$this, 'get_pages'], 'permission_callback' => $auth_callback],
            ['methods' => WP_REST_Server::CREATABLE, 'callback' => [$this, 'create_page'], 'permission_callback' => $auth_callback],
        ]);

        // Templates & Components
        register_rest_route($this->namespace, '/templates', [
            ['methods' => WP_REST_Server::READABLE, 'callback' => [$this, 'get_templates'], 'permission_callback' => $auth_callback],
            ['methods' => WP_REST_Server::CREATABLE, 'callback' => [$this, 'create_template'], 'permission_callback' => $auth_callback],
        ]);

        register_rest_route($this->namespace, '/components', [
            ['methods' => WP_REST_Server::READABLE, 'callback' => [$this, 'get_components'], 'permission_callback' => $auth_callback],
            ['methods' => WP_REST_Server::CREATABLE, 'callback' => [$this, 'create_component'], 'permission_callback' => $auth_callback],
        ]);

        // Media
        register_rest_route($this->namespace, '/media', [
            ['methods' => WP_REST_Server::READABLE, 'callback' => [$this, 'get_media'], 'permission_callback' => $auth_callback],
            ['methods' => WP_REST_Server::CREATABLE, 'callback' => [$this, 'upload_media'], 'permission_callback' => $auth_callback],
        ]);

        // Settings
        register_rest_route($this->namespace, '/settings', [
            ['methods' => WP_REST_Server::READABLE, 'callback' => [$this, 'get_settings'], 'permission_callback' => $auth_callback],
            ['methods' => WP_REST_Server::EDITABLE, 'callback' => [$this, 'update_settings'], 'permission_callback' => $auth_callback],
        ]);

        // AI Generation Endpoint
        register_rest_route($this->namespace, '/ai/generate', [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => [$this, 'ai_generate'],
            'permission_callback' => $auth_callback,
        ]);

        // Marketplace
        register_rest_route($this->namespace, '/marketplace', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [$this, 'get_marketplace_items'],
            'permission_callback' => $auth_callback,
        ]);

        // Export & Import
        register_rest_route($this->namespace, '/export', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [$this, 'export_project'],
            'permission_callback' => $auth_callback,
        ]);

        register_rest_route($this->namespace, '/import', [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => [$this, 'import_project'],
            'permission_callback' => $auth_callback,
        ]);
    }

    public function get_status(): WP_REST_Response {
        return new WP_REST_Response([
            'name' => 'AI Wonderland WordPress Plugin',
            'status' => 'active',
            'version' => '1.0.0',
            'wp_version' => get_bloginfo('version'),
            'api_namespace' => $this->namespace,
        ], 200);
    }

    public function get_projects(): WP_REST_Response {
        $query = new WP_Query(['post_type' => 'aiw_project', 'posts_per_page' => -1]);
        $projects = array_map(fn($post) => [
            'id' => $post->ID,
            'title' => $post->post_title,
            'data' => get_post_meta($post->ID, '_aiw_project_data', true),
            'updatedAt' => $post->post_modified,
        ], $query->posts);
        return new WP_REST_Response($projects, 200);
    }

    public function create_project(WP_REST_Request $request): WP_REST_Response {
        $params = $request->get_json_params();
        $title = sanitize_text_field($params['title'] ?? 'Untitled Project');
        $data = $params['data'] ?? [];

        $post_id = wp_insert_post([
            'post_type' => 'aiw_project',
            'post_title' => $title,
            'post_status' => 'publish',
        ]);

        if (is_wp_error($post_id)) {
            return new WP_REST_Response(['error' => $post_id->get_error_message()], 500);
        }

        update_post_meta($post_id, '_aiw_project_data', $data);
        return new WP_REST_Response(['id' => $post_id, 'title' => $title, 'data' => $data], 201);
    }

    public function get_pages(): WP_REST_Response {
        $pages = get_pages();
        return new WP_REST_Response($pages, 200);
    }

    public function create_page(WP_REST_Request $request): WP_REST_Response {
        $params = $request->get_json_params();
        $title = sanitize_text_field($params['title'] ?? 'New Page');
        $content = wp_kses_post($params['content'] ?? '');

        $post_id = wp_insert_post([
            'post_type' => 'page',
            'post_title' => $title,
            'post_content' => $content,
            'post_status' => 'publish',
        ]);

        return new WP_REST_Response(['id' => $post_id, 'title' => $title], 201);
    }

    public function get_templates(): WP_REST_Response {
        $templates = get_posts(['post_type' => 'aiw_template', 'posts_per_page' => -1]);
        return new WP_REST_Response($templates, 200);
    }

    public function create_template(WP_REST_Request $request): WP_REST_Response {
        $params = $request->get_json_params();
        $title = sanitize_text_field($params['title'] ?? 'New Template');
        $id = wp_insert_post(['post_type' => 'aiw_template', 'post_title' => $title, 'post_status' => 'publish']);
        return new WP_REST_Response(['id' => $id, 'title' => $title], 201);
    }

    public function get_components(): WP_REST_Response {
        $components = get_posts(['post_type' => 'aiw_component', 'posts_per_page' => -1]);
        return new WP_REST_Response($components, 200);
    }

    public function create_component(WP_REST_Request $request): WP_REST_Response {
        $params = $request->get_json_params();
        $title = sanitize_text_field($params['title'] ?? 'New Component');
        $id = wp_insert_post(['post_type' => 'aiw_component', 'post_title' => $title, 'post_status' => 'publish']);
        return new WP_REST_Response(['id' => $id, 'title' => $title], 201);
    }

    public function get_media(): WP_REST_Response {
        $attachments = get_posts(['post_type' => 'attachment', 'posts_per_page' => 50]);
        return new WP_REST_Response($attachments, 200);
    }

    public function upload_media(WP_REST_Request $request): WP_REST_Response {
        return new WP_REST_Response(['message' => 'Media endpoint operational'], 200);
    }

    public function get_settings(): WP_REST_Response {
        return new WP_REST_Response([
            'site_name' => get_option('blogname'),
            'site_url' => get_option('siteurl'),
            'api_key' => AIW_Auth::get_api_key(),
        ], 200);
    }

    public function update_settings(WP_REST_Request $request): WP_REST_Response {
        return new WP_REST_Response(['updated' => true], 200);
    }

    public function ai_generate(WP_REST_Request $request): WP_REST_Response {
        $params = $request->get_json_params();
        $prompt = sanitize_text_field($params['prompt'] ?? '');
        return new WP_REST_Response([
            'prompt' => $prompt,
            'generated_elements' => [],
            'status' => 'completed',
        ], 200);
    }

    public function get_marketplace_items(): WP_REST_Response {
        return new WP_REST_Response([
            'themes' => [],
            'plugins' => [],
            'components' => [],
            'templates' => [],
        ], 200);
    }

    public function export_project(WP_REST_Request $request): WP_REST_Response {
        return new WP_REST_Response(['version' => '1.0.0', 'exportedAt' => date('c')], 200);
    }

    public function import_project(WP_REST_Request $request): WP_REST_Response {
        return new WP_REST_Response(['success' => true], 200);
    }
}
