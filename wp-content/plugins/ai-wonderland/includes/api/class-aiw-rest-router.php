<?php
/**
 * AIW REST API Router - Production Ready
 */

if (!defined('ABSPATH')) exit;

require_once plugin_dir_path(__FILE__) . 'class-aiw-auth.php';
require_once plugin_dir_path(__FILE__) . 'class-aiw-cpt.php';

class AIW_REST_Router {
    private string $namespace = 'aiw/v1';
    private AIW_Auth $auth;
    private AIW_CPT $cpt;

    public function __construct() {
        $this->auth = new AIW_Auth();
        $this->cpt = new AIW_CPT();
        $this->cpt->register();
    }

    public function register_routes() {
        add_action('rest_api_init', [$this, 'register_endpoints']);

        // Register error handlers
        add_filter('rest_request_before_callbacks', [$this, 'validate_request'], 10, 2);
    }

    public function validate_request($response, $handler) {
        $route = $handler['route'] ?? '';

        if (strpos($route, '/aiw/v1') !== false) {
            $can_access = $this->auth->check_authentication($route);

            if (!$can_access) {
                $response = new WP_REST_Response([
                    'error' => 'aiw_auth_error',
                    'message' => 'Invalid or missing authentication.',
                    'status' => '401',
                ], 401);
                return new WP_Error('aiw_auth_error', __('Authentication failed.', 'ai-wonderland'), ['status' => 401]);
            }
        }

        return $response;
    }

    public function register_endpoints() {
        $auth_callback = [$this->auth, 'check_authentication'];

        // Public status endpoint
        register_rest_route($this->namespace, '/status', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [$this, 'get_status'],
            'permission_callback' => '__return_true',
        ]);

        // Health check endpoint
        register_rest_route($this->namespace, '/health', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [$this, 'get_health'],
            'permission_callback' => '__return_true',
        ]);

        // Project API
        register_rest_route($this->namespace, '/projects', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [$this, 'get_projects'],
            'permission_callback' => $auth_callback,
        ], [
            'fields' => ['id', 'title', 'content', 'date', 'slug'],
        ]);

        register_rest_route($this->namespace, '/projects', [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => [$this, 'create_project'],
            'permission_callback' => $auth_callback,
            'args' => [
                'title' => ['type' => 'string', 'required' => true],
                'content' => ['type' => 'string', 'required' => false],
                'data' => ['type' => 'object', 'required' => false],
                'slug' => ['type' => 'string', 'required' => false],
            ],
        ]);

        register_rest_route($this->namespace, '/projects/(?P<id>\d+)', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [$this, 'get_project'],
            'permission_callback' => $auth_callback,
        ]);

        register_rest_route($this->namespace, '/projects/(?P<id>\d+)', [
            'methods' => WP_REST_Server::EDITABLE,
            'callback' => [$this, 'update_project'],
            'permission_callback' => $auth_callback,
            'args' => [
                'title' => ['type' => 'string', 'required' => false],
                'content' => ['type' => 'string', 'required' => false],
            ],
        ]);

        register_rest_route($this->namespace, '/projects/(?P<id>\d+)', [
            'methods' => WP_REST_Server::DELETABLE,
            'callback' => [$this, 'delete_project'],
            'permission_callback' => $auth_callback,
        ]);

        // Pages API
        register_rest_route($this->namespace, '/pages', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [$this, 'get_pages'],
            'permission_callback' => $auth_callback,
        ]);

        register_rest_route($this->namespace, '/pages', [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => [$this, 'create_page'],
            'permission_callback' => $auth_callback,
        ]);

        // Gutenberg page save API — preserves block markup verbatim
        register_rest_route($this->namespace, '/gutenberg', [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => [$this, 'save_gutenberg_page'],
            'permission_callback' => $auth_callback,
            'args' => [
                'title' => ['type' => 'string', 'required' => true],
                'content' => ['type' => 'string', 'required' => false, 'default' => ''],
                'status' => ['type' => 'string', 'enum' => ['publish', 'draft', 'pending', 'private'], 'default' => 'publish'],
                'post_id' => ['type' => 'integer', 'required' => false],
                'slug' => ['type' => 'string', 'required' => false],
            ],
        ]);

        // AI Generation API
        register_rest_route($this->namespace, '/ai/generate', [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => [$this, 'ai_generate'],
            'permission_callback' => $auth_callback,
            'args' => [
                'prompt' => ['type' => 'string', 'required' => true],
                'type' => ['type' => 'string', 'enum' => ['component', 'template', 'layout'], 'default' => 'component'],
                'target' => ['type' => 'string', 'required' => false],
            ],
        ]);

        // Settings API
        register_rest_route($this->namespace, '/settings', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [$this, 'get_settings'],
            'permission_callback' => $auth_callback,
        ]);

        register_rest_route($this->namespace, '/settings', [
            'methods' => WP_REST_Server::EDITABLE,
            'callback' => [$this, 'update_settings'],
            'permission_callback' => $auth_callback,
        ]);

        // Export/Import API
        register_rest_route($this->namespace, '/export', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [$this, 'export_data'],
            'permission_callback' => $auth_callback,
        ]);

        register_rest_route($this->namespace, '/import', [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => [$this, 'import_data'],
            'permission_callback' => $auth_callback,
        ]);
    }

    public function get_status(): WP_REST_Response {
        return new WP_REST_Response([
            'name' => 'AI Wonderland WordPress Plugin',
            'slug' => 'ai-wonderland',
            'version' => '1.0.0',
            'description' => __('The engine for AI-generated WordPress experiences.', 'ai-wonderland'),
            'rest_base' => $this->namespace,
            'capabilities' => [
                'create_projects',
                'read_projects',
                'edit_projects',
                'delete_projects',
                'generate_ai',
                'manage_settings',
            ],
            'wp_version' => get_bloginfo('version'),
            'php_version' => PHP_VERSION,
        ], 200);
    }

    public function get_health(): WP_REST_Response {
        $health = ['database' => true, 'api' => true];

        try {
            global $wpdb;
            $wpdb->get_results('SELECT 1');
        } catch (Exception $e) {
            $health['database'] = false;
        }

        try {
            get_option('aiw_api_key');
        } catch (Exception $e) {
            $health['api'] = false;
        }

        return new WP_REST_Response($health, 200);
    }

    public function get_projects(WP_REST_Request $request): WP_REST_Response {
        $args = $request->get_params();
        $per_page = (int) ($args['per_page'] ?? 20);
        $page = (int) ($args['page'] ?? 1);
        $search = $request->get_param('search') ?? '';

        $query_args = [
            'post_type' => 'aiw_project',
            'posts_per_page' => $per_page,
            'paged' => $page,
            'orderby' => 'date',
            'order' => 'desc',
        ];

        if (!empty($search)) {
            $query_args['s'] = $search;
        }

        $query = new WP_Query($query_args);
        $projects = [];

        foreach ($query->posts as $post) {
            $projects[] = [
                'id' => $post->ID,
                'title' => get_the_title($post->ID),
                'content' => get_post_field('post_content', $post->ID),
                'date' => $post->post_date,
                'slug' => get_post_field('post_name', $post->ID),
                'author' => get_post_field('post_author', $post->ID),
                'meta' => get_post_meta((int) $post->ID, '_aiw_project_meta', true),
            ];
        }

        $response = [
            'data' => $projects,
            'pagination' => [
                'total' => $query->found_posts,
                'per_page' => $per_page,
                'page' => $page,
                'pages' => $query->max_num_pages,
            ],
        ];

        return new WP_REST_Response($response, 200);
    }

    public function create_project(WP_REST_Request $request): WP_REST_Response {
        $params = $request->get_json_params() ?? $request->get_params();
        $title = sanitize_text_field($params['title'] ?? 'Untitled Project');
        $content = $request->get_param('content') ?? '';
        $data = $request->get_param('data') ?? [];
        $slug = !empty($params['slug']) ? sanitize_title($params['slug']) : '';

        $args = [
            'post_title' => $title,
            'post_content' => $content,
            'post_status' => 'publish',
            'post_type' => 'aiw_project',
        ];

        if (!empty($slug)) {
            $args['post_name'] = $slug;
        }

        $post_id = wp_insert_post($args);

        if (is_wp_error($post_id)) {
            return new WP_REST_Response(['error' => $post_id->get_error_message()], 400);
        }

        // Save additional metadata
        update_post_meta($post_id, '_aiw_project_data', $data);
        update_post_meta($post_id, '_aiw_project_created_by', get_current_user_id());
        update_post_meta($post_id, '_aiw_project_created_at', current_time('mysql'));

        return new WP_REST_Response([
            'id' => $post_id,
            'title' => $title,
            'content' => $content,
            'slug' => !empty($slug) ? $slug : '',
            'data' => $data,
            'message' => __('Project created successfully.', 'ai-wonderland'),
        ], 201);
    }

    public function get_project(WP_REST_Request $request): WP_REST_Response {
        $id = (int) $request['id'];
        $post = get_post($id);

        if (!$post || $post->post_type !== 'aiw_project') {
            return new WP_REST_Response(['error' => __('Project not found.', 'ai-wonderland')], 404);
        }

        return new WP_REST_Response([
            'id' => $post->ID,
            'title' => get_the_title($post->ID),
            'content' => get_post_field('post_content', $post->ID),
            'date' => $post->post_date,
            'modified' => $post->post_modified,
            'author' => get_post_field('post_author', $post->ID),
            'permalink' => get_permalink($post->ID),
            'meta' => get_post_meta((int) $post->ID, '_aiw_project_meta', true),
        ], 200);
    }

    public function update_project(WP_REST_Request $request): WP_REST_Response {
        $id = (int) $request['id'];
        $post = get_post($id);

        if (!$post || $post->post_type !== 'aiw_project') {
            return new WP_REST_Response(['error' => __('Project not found.', 'ai-wonderland')], 404);
        }

        $params = $request->get_json_params() ?? $request->get_params();
        $title = !empty($params['title']) ? sanitize_text_field($params['title']) : $post->post_title;
        $content = !empty($params['content']) ? wp_kses_post($params['content']) : $post->post_content;

        $args = [
            'ID' => $id,
            'post_title' => $title,
            'post_content' => $content,
            'post_status' => $post->post_status,
        ];

        $updated_id = wp_update_post($args);

        if (is_wp_error($updated_id)) {
            return new WP_REST_Response(['error' => $updated_id->get_error_message()], 400);
        }

        return new WP_REST_Response([
            'id' => $updated_id,
            'title' => $title,
            'content' => $content,
            'message' => __('Project updated successfully.', 'ai-wonderland'),
        ], 200);
    }

    public function delete_project(WP_REST_Request $request): WP_REST_Response {
        $id = (int) $request['id'];
        $post = get_post($id);

        if (!$post || $post->post_type !== 'aiw_project') {
            return new WP_REST_Response(['error' => __('Project not found.', 'ai-wonderland')], 404);
        }

        $deleted = wp_delete_post($id, true);

        if (is_wp_error($deleted)) {
            return new WP_REST_Response(['error' => $deleted->get_error_message()], 400);
        }

        return new WP_REST_Response(['id' => $id, 'message' => __('Project deleted successfully.', 'ai-wonderland')], 200);
    }

    public function get_pages(WP_REST_Request $request): WP_REST_Response {
        $args = $request->get_params();
        $page = (int) ($args['page'] ?? 1);
        $per_page = (int) ($args['per_page'] ?? 20);

        $query_args = array_merge([
            'post_type' => 'page',
            'number' => $per_page,
            'paged' => $page,
            'orderby' => 'date',
            'order' => 'desc',
        ], []);

        $query = new WP_Query($query_args);
        $pages = [];

        foreach ($query->posts as $post) {
            $pages[] = [
                'id' => $post->ID,
                'title' => get_the_title($post->ID),
                'content' => get_post_field('post_content', $post->ID),
                'slug' => get_post_field('post_name', $post->ID),
                'parent' => $post->post_parent,
                'menu_order' => $post->menu_order,
                'date' => $post->post_date,
                'modified' => $post->post_modified,
                'url' => get_permalink($post->ID),
            ];
        }

        $response = [
            'data' => $pages,
            'pagination' => [
                'total' => $query->found_posts,
                'per_page' => $per_page,
                'page' => $page,
                'pages' => $query->max_num_pages,
            ],
        ];

        return new WP_REST_Response($response, 200);
    }

    public function create_page(WP_REST_Request $request): WP_REST_Response {
        $params = $request->get_json_params() ?? $request->get_params();

        $post_data = [
            'post_title' => sanitize_text_field($params['title'] ?? __('New Page', 'ai-wonderland')),
            'post_content' => wp_kses_post($params['content'] ?? ''),
            'post_status' => 'publish',
            'post_author' => get_current_user_id(),
        ];

        if (!empty($params['slug'])) {
            $post_data['post_name'] = sanitize_title($params['slug']);
        }

        if (!empty($params['parent_id'])) {
            $post_data['post_parent'] = (int) $params['parent_id'];
        }

        if (!empty($params['menu_order'])) {
            $post_data['menu_order'] = (int) $params['menu_order'];
        }

        $post_id = wp_insert_post($post_data);

        if (is_wp_error($post_id)) {
            return new WP_REST_Response(['error' => $post_id->get_error_message()], 400);
        }

        return new WP_REST_Response([
            'id' => $post_id,
            'title' => $post_data['post_title'],
            'slug' => isset($post_data['post_name']) ? $post_data['post_name'] : '',
            'content' => $post_data['post_content'],
            'message' => __('Page created successfully.', 'ai-wonderland'),
        ], 201);
    }

    public function save_gutenberg_page(WP_REST_Request $request): WP_REST_Response {
        $params = $request->get_json_params() ?? $request->get_params();

        $post_id   = !empty($params['post_id']) ? (int) $params['post_id'] : 0;
        $title     = sanitize_text_field($params['title'] ?? __('New Page', 'ai-wonderland'));
        $content   = $params['content'] ?? '';
        $status    = $params['status'] ?? 'publish';

        if ($post_id) {
            $existing = get_post($post_id);
            if (!$existing || !in_array($existing->post_type, ['page', 'aiw_project', 'post'], true)) {
                return new WP_REST_Response(['error' => __('Page not found.', 'ai-wonderland')], 404);
            }

            $post_data = [
                'ID' => $post_id,
                'post_title' => $title,
                'post_content' => $content,
                'post_status' => $status,
            ];

            $result = wp_update_post(wp_slash($post_data), true);

            if (is_wp_error($result)) {
                return new WP_REST_Response(['error' => $result->get_error_message()], 400);
            }

            return new WP_REST_Response([
                'id' => $result,
                'title' => $title,
                'content' => $content,
                'message' => __('Page updated successfully.', 'ai-wonderland'),
            ], 200);
        }

        $post_data = [
            'post_title' => $title,
            'post_content' => $content,
            'post_status' => $status,
            'post_type' => 'page',
            'post_author' => get_current_user_id(),
        ];

        if (!empty($params['slug'])) {
            $post_data['post_name'] = sanitize_title($params['slug']);
        }

        $created = wp_insert_post(wp_slash($post_data), true);

        if (is_wp_error($created)) {
            return new WP_REST_Response(['error' => $created->get_error_message()], 400);
        }

        return new WP_REST_Response([
            'id' => $created,
            'title' => $title,
            'content' => $content,
            'link' => get_permalink($created),
            'message' => __('Page created successfully.', 'ai-wonderland'),
        ], 201);
    }

    public function ai_generate(WP_REST_Request $request): WP_REST_Response {
        $params = $request->get_json_params();
        $prompt = sanitize_text_field($params['prompt'] ?? '');
        $type = $request->get_param('type') ?? 'component';
        $target = $request->get_param('target') ?? null;

        if (empty($prompt)) {
            return new WP_REST_Response(['error' => __('Prompt is required.', 'ai-wonderland')], 400);
        }

        $generated = $this->generate_ai_content($prompt, $type, $target);

        return new WP_REST_Response([
            'prompt' => $prompt,
            'type' => $type,
            'generated' => $generated,
            'timestamp' => current_time('mysql'),
        ], 200);
    }

    public function get_settings(): WP_REST_Response {
        $settings = [
            'site_name' => get_option('blogname', ''),
            'site_description' => get_option('blogdescription', ''),
            'site_url' => get_option('siteurl', ''),
            'home_url' => get_option('home', ''),
            'admin_email' => get_option('admin_email', ''),
            'timezone' => get_option('timezone_string', ''),
            'locale' => get_locale(),
            'api_version' => '1.0.0',
            'capabilities' => [
                'can_create_projects' => current_user_can('manage_options'),
                'can_generate_ai' => current_user_can('manage_options'),
            ],
        ];

        return new WP_REST_Response($settings, 200);
    }

    public function update_settings(WP_REST_Request $request): WP_REST_Response {
        $params = $request->get_json_params();

        if (!empty($params['site_name'])) {
            update_option('blogname', sanitize_text_field($params['site_name']));
        }

        if (!empty($params['site_description'])) {
            update_option('blogdescription', wp_kses_post($params['site_description']));
        }

        $message = __('Settings updated successfully.', 'ai-wonderland');

        return new WP_REST_Response(['message' => $message], 200);
    }

    public function export_data(): WP_REST_Response {
        $data = [];

        $projects = get_posts(['post_type' => 'aiw_project', 'numberposts' => -1]);
        $data['projects'] = array_map(function($post) {
            return [
                'id' => $post->ID,
                'title' => $post->post_title,
                'content' => $post->post_content,
                'date' => $post->post_date,
                'meta' => get_post_meta($post->ID, '_aiw_project_data', true),
            ];
        }, $projects);

        $templates = get_posts(['post_type' => 'aiw_template', 'numberposts' => -1]);
        $data['templates'] = array_map(function($post) {
            return [
                'id' => $post->ID,
                'title' => $post->post_title,
                'content' => $post->post_content,
            ];
        }, $templates);

        $settings = [
            'site_name' => get_option('blogname'),
            'site_description' => get_option('blogdescription'),
            'timezone' => get_option('timezone_string'),
        ];
        $data['settings'] = $settings;

        $export = json_encode(['aiw_export' => '1.0.0', 'data' => $data], JSON_PRETTY_PRINT);

        return new WP_REST_Response(['export' => $export], 200);
    }

    public function import_data(WP_REST_Request $request): WP_REST_Response {
        $params = $request->get_json_params();

        if (empty($params['export'])) {
            return new WP_REST_Response(['error' => __('Export data is required.', 'ai-wonderland')], 400);
        }

        $export_data = json_decode($params['export'], true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return new WP_REST_Response(['error' => __('Invalid export data.', 'ai-wonderland')], 400);
        }

        if (!isset($export_data['aiw_export']) || !isset($export_data['data'])) {
            return new WP_REST_Response(['error' => __('Invalid export format.', 'ai-wonderland')], 400);
        }

        try {
            $imported_projects = $this->import_projects($export_data['data']['projects']);
            $imported_templates = $this->import_templates($export_data['data']['templates']);

            return new WP_REST_Response([
                'projects_imported' => $imported_projects,
                'templates_imported' => $imported_templates,
                'message' => __('Data imported successfully.', 'ai-wonderland'),
            ], 200);
        } catch (Exception $e) {
            return new WP_REST_Response(['error' => $e->getMessage()], 500);
        }
    }

    private function generate_ai_content(string $prompt, string $type, ?string $target): array {
        $generated = [];

        switch ($type) {
            case 'component':
                $generated = [
                    'id' => 'comp_' . uniqid(),
                    'type' => 'react-component',
                    'name' => preg_replace('/[^a-z0-9]/i', '', strtolower(str_replace(' ', '-', $prompt))),
                    'props' => [
                        'title' => sanitize_text_field($prompt),
                        'description' => ucfirst($prompt) . ' component.',
                    ],
                    'code' => '// AI-generated component code',
                    'styles' => [
                        'backgroundColor' => '#ffffff',
                        'padding' => '1rem',
                        'borderRadius' => '0.5rem',
                    ],
                ];
                break;

            case 'template':
                $generated = [
                    'id' => 'tpl_' . uniqid(),
                    'type' => 'page-template',
                    'name' => preg_replace('/[^a-z0-9]/i', '', strtolower(str_replace(' ', '-', $prompt))),
                    'props' => [
                        'title' => sanitize_text_field($prompt),
                        'description' => ucfirst($prompt) . ' template.',
                    ],
                    'structure' => ['sections' => []],
                ];
                break;

            case 'layout':
                $generated = [
                    'id' => 'layout_' . uniqid(),
                    'type' => 'layout',
                    'name' => preg_replace('/[^a-z0-9]/i', '', strtolower(str_replace(' ', '-', $prompt))),
                    'components' => [],
                    'styles' => [
                        'gridTemplateColumns' => '1fr',
                        'gap' => '1rem',
                    ],
                ];
                break;
        }

        return $generated;
    }

    private function import_projects(array $projects): int {
        $imported = 0;

        foreach ($projects as $project) {
            if (!isset($project['title'], $project['content'])) {
                continue;
            }

            $post_data = [
                'post_title' => sanitize_text_field($project['title']),
                'post_content' => wp_kses_post($project['content']),
                'post_status' => 'publish',
                'post_type' => 'aiw_project',
            ];

            if (!empty($project['slug']) && !empty($project['slug'])) {
                $post_data['post_name'] = sanitize_title($project['slug']);
            }

            $post_id = wp_insert_post($post_data);

            if (!is_wp_error($post_id) && !empty($project['meta'])) {
                update_post_meta($post_id, '_aiw_project_data', $project['meta']);
            }

            $imported++;
        }

        return $imported;
    }

    private function import_templates(array $templates): int {
        $imported = 0;

        foreach ($templates as $template) {
            if (!isset($template['title'], $template['content'])) {
                continue;
            }

            $post_data = [
                'post_title' => sanitize_text_field($template['title']),
                'post_content' => wp_kses_post($template['content']),
                'post_status' => 'publish',
                'post_type' => 'aiw_template',
            ];

            $post_id = wp_insert_post($post_data);
            $imported++;
        }

        return $imported;
    }
}
