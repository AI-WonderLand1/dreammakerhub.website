<?php
/**
 * AI Wonderland Theme - Block Theme
 * 
 * @package AI Wonderland
 */

add_action('after_setup_theme', 'aiw_theme_setup');

function aiw_theme_setup() {
    // Basic theme setup
    load_theme_textdomain('ai-wonderland-theme', get_template_directory() . '/languages');
    add_theme_support('automatic-feature-chains', array('editor-styles' => true));
    add_theme_support('editor-styles', ['styles' => 'editor-style.css'], ['inline' => true]);
    add_theme_support('wp-block-templates');
    add_theme_support('template-patching');

    // FSE support
    add_theme_support('full-site-editing');
    add_theme_support('disable-custom-columns');
    add_theme_support('align-wide');
    add_theme_support('responsive-embeds');

    // Block options
    add_theme_support('block-template-part', ['header', 'footer', 'sidebar']);
    add_theme_support('block-patterns');

    // Custom color palette
    add_theme_support('editor-color-palette', aiw_get_color_palette());
    add_theme_support('editor-gradient-presets', aiw_get_gradient_presets());

    // Custom font sizes
    add_theme_support('editor-font-sizes', aiw_get_font_sizes());

    // Custom post types
    add_theme_support('aiw-block-types');

    // Add default block patterns
    add_filter('pre_init', 'aiw_load_block_patterns');
}

function aiw_get_color_palette() {
    return [
        [
            'name' => __('Primary Violet', 'ai-wonderland-theme'),
            'slug' => 'primary',
            'color' => '#7c3aed',
            'ref' => '#7c3aed',
            'alpha' => 1,
        ],
        [
            'name' => __('Secondary Cyan', 'ai-wonderland-theme'),
            'slug' => 'secondary',
            'color' => '#06b6d4',
            'ref' => '#06b6d4',
            'alpha' => 1,
        ],
        [
            'name' => __('Dark Slate', 'ai-wonderland-theme'),
            'slug' => 'dark',
            'color' => '#0f172a',
            'ref' => '#0f172a',
            'alpha' => 1,
        ],
        [
            'name' => __('Light Background', 'ai-wonderland-theme'),
            'slug' => 'light',
            'color' => '#f8fafc',
            'ref' => '#f8fafc',
            'alpha' => 1,
        ],
        [
            'name' => __('Success Green', 'ai-wonderland-theme'),
            'slug' => 'success',
            'color' => '#10b981',
            'ref' => '#10b981',
            'alpha' => 1,
        ],
        [
            'name' => __('Warning Amber', 'ai-wonderland-theme'),
            'slug' => 'warning',
            'color' => '#f59e0b',
            'ref' => '#f59e0b',
            'alpha' => 1,
        ],
        [
            'name' => __('Danger Red', 'ai-wonderland-theme'),
            'slug' => 'danger',
            'color' => '#ef4444',
            'ref' => '#ef4444',
            'alpha' => 1,
        ],
    ];
}

function aiw_get_gradient_presets() {
    return [
        [
            'name' => __('Violet to Cyan', 'ai-wonderland-theme'),
            'slug' => 'violet-cyan',
            'gradient' => 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
        ],
        [
            'name' => __('Slate to Dark', 'ai-wonderland-theme'),
            'slug' => 'slate-dark',
            'gradient' => 'linear-gradient(135deg, #f8fafc 0%, #0f172a 100%)',
        ],
    ];
}

function aiw_get_font_sizes() {
    return [
        [
            'name' => __('Extra Small', 'ai-wonderland-theme'),
            'size' => 0.75,
            'slug' => 'xs',
            'ref' => '0.75rem',
        ],
        [
            'name' => __('Small', 'ai-wonderland-theme'),
            'size' => 0.875,
            'slug' => 'sm',
            'ref' => '0.875rem',
        ],
        [
            'name' => __('Medium', 'ai-wonderland-theme'),
            'size' => 1,
            'slug' => 'base',
            'ref' => '1rem',
        ],
        [
            'name' => __('Large', 'ai-wonderland-theme'),
            'size' => 1.125,
            'slug' => 'lg',
            'ref' => '1.125rem',
        ],
        [
            'name' => __('Extra Large', 'ai-wonderland-theme'),
            'size' => 1.5,
            'slug' => 'xl',
            'ref' => '1.5rem',
        ],
        [
            'name' => __('Extra Extra Large', 'ai-wonderland-theme'),
            'size' => 2.25,
            'slug' => '2xl',
            'ref' => '2.25rem',
        ],
    ];
}

function aiw_load_block_patterns() {
    // Load block patterns from JSON file
    if (file_exists(get_theme_file_path('block-patterns.json'))) {
        add_filter('init', function() {
            $patterns = json_decode(file_get_contents(get_theme_file_path('block-patterns.json')), true);
            if (is_array($patterns)) {
                foreach ($patterns as $pattern_slug => $pattern_data) {
                    register_block_pattern(
                        "ai-wonderland-theme/{$pattern_slug}",
                        $pattern_data
                    );
                }
            }
        });
    }
}

function aiw_is_ai_builder_page(): bool {
    global $post;
    $is_builder_page = (
        is_home() && (
            get_option('show_on_front') === 'page' && get_post(get_option('page_on_front')) &&
            get_post(get_option('page_on_front'))->post_name === 'ai-builder'
        )
    );

    return $is_builder_page;
}

function aiw_theme_enqueue_scripts() {
    wp_enqueue_style('ai-wonderland-style', get_stylesheet_uri(), [], wp_get_theme()->get('Version'), ['media' => 'all']);

    if (aiw_is_ai_builder_page()) {
        wp_enqueue_style('ai-wonderland-builder-style', get_template_directory_uri() . '/build/builder.css', ['ai-wonderland-style'], wp_get_theme()->get('Version'), ['media' => 'all']);
    }
}

add_action('wp_enqueue_scripts', 'aiw_theme_enqueue_scripts');

function aiw_output_header() {
    if (aiw_is_ai_builder_page()) {
        wp_send_json_error('Builder page is a frontend editing page, not for direct output', 200);
        return;
    }
    get_template_part('template-parts/header');
}

function aiw_output_footer() {
    if (aiw_is_ai_builder_page()) {
        wp_send_json_error('Builder page is a frontend editing page, not for direct output', 200);
        return;
    }
    get_template_part('template-parts/footer');
}

function aiw_register_blocks() {
    register_block_type_from_metadata(get_template_directory() . '/blocks/ai-wonderland-component');

    register_block_type('ai-wonderland-theme/aii-component', [
        'title' => __('AI Component', 'ai-wonderland-theme'),
        'category' => 'ai-wonderland',
        'icon' => 'formatquote',
        'keywords' => array('ai', 'component', 'wonderland'),
        'attributes' => [
            'id' => array('type' => 'string'),
            'name' => array('type' => 'string'),
            'props' => array('type' => 'object'),
            'styles' => array('type' => 'object'),
        ],
        'example' => array(
            'attributes' => array(
                'name' => 'Hero Section',
                'title' => 'Welcome to AI Wonderland',
                'props' => array(
                    'title' => 'Welcome to AI Wonderland',
                    'subtitle' => 'Create Amazing Experiences',
                ),
                'styles' => array(
                    'backgroundColor' => 'primary',
                    'padding' => '4rem',
                    'textAlign' => 'center',
                ),
            ),
        ),
        'render_callback' => function($attributes) {
            $id = $attributes['id'] ?? 'aiw-component-' . uniqid();
            $name = $attributes['name'] ?? 'AI Component';
            $props = $attributes['props'] ?? [];
            $styles = $attributes['styles'] ?? [];

            $classes = 'aiw-block aiw-component';
            $style = '';

            if (!empty($styles['backgroundColor'])) {
                $style .= 'background-color: var(--wp--preset--color--' . esc_attr($styles['backgroundColor']) . ');';
            }

            if (!empty($styles['padding'])) {
                $style .= 'padding: var(--wp--preset--spacing--' . esc_attr($styles['padding']) . ');';
            }

            return '<div id="' . esc_attr($id) . '" class="' . esc_attr($classes) . '">
                <div class="aiw-component-container" style="' . esc_attr($style) . '">
                    <h2 class="aiw-component-title">' . esc_html($props['title'] ?? $name) . '</h2>
                    <div class="aiw-component-content">' . ($props['content'] ?? '') . '</div>
                </div>
            </div>';
        },
    ]);

    register_block_type('ai-wonderland-theme/aii-text-generator', [
        'title' => __('AI Text Generator', 'ai-wonderland-theme'),
        'category' => 'ai-wonderland',
        'icon' => 'text',
        'keywords' => array('ai', 'generator', 'text'),
        'attributes' => [
            'prompt' => array('type' => 'string'),
            'generated' => array('type' => 'boolean', 'default' => false),
            'content' => array('type' => 'string'),
            'model' => array('type' => 'string', 'default' => 'gpt-4'),
        ],
        'example' => array(
            'attributes' => array(
                'prompt' => 'Write a futuristic tagline for an AI company',
                'model' => 'gpt-4',
                'content' => 'Future-Forward AI Innovation',
            ),
        ),
        'render_callback' => function($attributes) {
            $prompt = $attributes['prompt'] ?? __('Generate AI text...', 'ai-wonderland-theme');
            $generated = $attributes['generated'] ?? false;
            $content = $attributes['content'] ?? '';
            $model = $attributes['model'] ?? 'gpt-4';

            ob_start();
            ?>
            <div class="aiw-ai-generator-block">
                <div class="aiw-generator-header">
                    <span class="aiw-generator-icon">🤖</span>
                    <span class="aiw-generator-model">Model: <?php echo esc_html($model); ?></span>
                </div>

                <div class="aiw-generator-content">
                    <?php if (!empty($content)): ?>
                        <p class="aiw-generated-text"><?php echo esc_html($content); ?></p>
                    <?php else: ?>
                        <p class="aiw-placeholder-text">AI output will appear here...</p>
                    <?php endif; ?>
                </div>

                <div class="aiw-generator-footer">
                    <span class="aiw-generator-prompt">Prompt: <?php echo esc_html($prompt); ?></span>
                    <button class="aiw-generate-button">
                        <?php echo $generated ? __('Regenerate', 'ai-wonderland-theme') : __('Generate', 'ai-wonderland-theme'); ?>
                    </button>
                </div>
            </div>
            <?php
            return ob_get_clean();
        },
    ]);

    register_block_type('ai-wonderland-theme/aii-builder-bridge', [
        'title' => __('Builder Bridge', 'ai-wonderland-theme'),
        'category' => 'ai-wonderland',
        'icon' => 'editor-code',
        'keywords' => array('ai', 'builder', 'bridge', 'custom'),
        'attributes' => [
            'isSyncing' => array('type' => 'boolean', 'default' => false),
            'lastSync' => array('type' => 'string'),
            'status' => array('type' => 'string', 'default' => 'idle'),
        ],
        'example' => array(
            'attributes' => array(
                'status' => 'syncing',
            ),
        ),
        'render_callback' => function($attributes) {
            $isSyncing = $attributes['isSyncing'] ?? false;
            $status = $attributes['status'] ?? 'idle';
            $lastSync = $attributes['lastSync'] ?? null;

            $statusText = match ($status) {
                'syncing' => __('Syncing with AI Builder...', 'ai-wonderland-theme'),
                'complete' => __('Sync Complete', 'ai-wonderland-theme'),
                'error' => __('Sync Error', 'ai-wonderland-theme'),
                default => __('Ready', 'ai-wonderland-theme'),
            };

            return '<div class="aiw-builder-bridge-block">
                <div class="aiw-bridge-content">
                    <span class="aiw-bridge-icon">🔗</span>
                    <span class="aiw-bridge-status">' . esc_html($statusText) . '</span>
                    ' . ($isSyncing ? '<span class="aiw-syncing-indicator"></span>' : '') . '
                </div>
                <div class="aiw-bridge-meta">
                    ' . ($lastSync ? '<small>Last sync: ' . esc_html($lastSync) . '</small>' : '<small>Not synced yet</small>') . '
                </div>
            </div>';
        },
    ]);
}

add_action('init', 'aiw_register_blocks');

function aiw_enqueue_builder_css() {
    if (aiw_is_ai_builder_page()) {
        wp_register_style('ai-wonderland-builder', get_template_directory_uri() . '/build/builder.css', array('wp-blocks'), wp_get_theme()->get('Version'), true);
        wp_enqueue_style('ai-wonderland-builder');
    }
}

add_action('wp_print_styles', 'aiw_enqueue_builder_css');

function aiw_get_template_part_path(string $slug): string {
    $template_part_path = get_theme_file_path("template-parts/{$slug}.php");
    return !empty($template_part_path) ? $template_part_path : '';
}

function aiw_output_builder_page() {
    if (!aiw_is_ai_builder_page()) {
        return;
    }

    $builder_data = [
        'apiUrl' => get_rest_url(null, 'aiw/v1'),
        'apiKey' => aiw_get_api_key(),
        'builderPage' => true,
        'nonce' => wp_create_nonce('aiw_builder_nonce'),
    ];

    wp_enqueue_script('ai-wonderland-builder-app', get_template_directory_uri() . '/build/builder-app.js', [
        'wp-element',
        'wp-blocks',
        'wp-components',
        'wp-data',
        'wp-api-fetch',
        'wp-url',
    ], wp_get_theme()->get('Version'), true);

    wp_localize_script('ai-wonderland-builder-app', 'aiwConfig', $builder_data);

    echo '<div id="aiw-builder-container"></div>';
}

add_action('wp_body_open', 'aiw_output_builder_page');

add_filter('body_class', function ($classes) {
    if (aiw_is_ai_builder_page()) {
        $classes[] = 'aiw-builder-page';
    }
    return $classes;
});

function aiw_get_api_key(): string {
    $key = get_option('aiw_api_key', '');
    if (is_scalar($key)) {
        return (string) $key;
    }
    return '';
}
