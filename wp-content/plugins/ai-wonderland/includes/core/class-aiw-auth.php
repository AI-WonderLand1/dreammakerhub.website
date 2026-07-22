<?php
/**
 * AIW Authentication Module
 * Handles API Key Authentication and Application Passwords
 */

if (!defined('ABSPATH')) exit;

class AIW_Authentication {
    /**
     * Initialize authentication hooks
     */
    public static function init() {
        add_action('rest_api_init', [self::class, 'register_authentication']);
        add_action('wp_initialize', [self::class, 'init_auth_constants']);

        // Handle JWT authentication
        add_filter('jwt_auth_secret_key', [self::class, 'get_jwt_secret_key']);

        // Add Application Password support
        add_filter('wp_get_application_passwords', [self::class, 'allow_application_passwords_for_api'], 10, 2);
    }

    /**
     * Initialize authentication constants
     */
    public static function init_auth_constants() {
        // Check if API key is present in request
        $provided_key = null;
        if (!empty($_GET['aiw_api_key'])) {
            $provided_key = sanitize_text_field($_GET['aiw_api_key']);
        } elseif (wp_get_server_variable('PHP_AUTH_USER')) {
            // Basic auth support
            $userid = wp_get_server_variable('PHP_AUTH_USER');
            $authenticated_user = get_user_by('login', $userid);
            if ($authenticated_user) {
                $provided_key = AIW_Auth::get_api_key($authenticated_user->ID);
            }
        }

        if ($provided_key) {
            set_current_user($authenticated_user->ID, $authenticated_user->user_login);
        }
    }

    /**
     * Register authentication filter
     */
    public static function register_authentication($api) {
        // Register the custom REST API endpoint protection
        add_action('rest_api_init', function() {
            add_filter('rest_authentication_errors', [self::class, 'protect_aiw_endpoints'], 10, 1);
        });
    }

    /**
     * Protect AIW REST API endpoints
     */
    public static function protect_aiw_endpoints($errors) {
        // Don't apply to public endpoints
        $request = isset($_GET['rest_route']) ? esc_attr($_GET['rest_route']) : '';
        $public_endpoints = [
            '/aiw/v1/status',
        ];

        if (!empty($request) && !in_array($request, $public_endpoints)) {
            if (!self::check_authentication()) {
                $errors = new WP_Error('aiw_no_auth', __('You are not authenticated for this request.', 'ai-wonderland'), ['status' => 401]);
            }
        }

        return $errors;
    }

    /**
     * Check if the request is authenticated
     */
    public static function check_authentication(): bool {
        // Check for API key in request
        $api_key = self::get_api_key_from_request();
        $stored_key = self::get_stored_api_key();

        if (!empty($api_key) && !empty($stored_key) && hash_equals($api_key, $stored_key)) {
            return true;
        }

        // Check for WordPress user authentication
        if (is_user_logged_in() && current_user_can('manage_options')) {
            return true;
        }

        // Check for JWT token (if JWT auth is installed)
        if (function_exists('jwt_auth_check_token')) {
            $token = get_query_var('jwt_token');
            if (!empty($token)) {
                // Your JWT validation logic here
                if (self::validate_jwt_token($token)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Get API key from request
     */
    public static function get_api_key_from_request(): string {
        $key = '';

        // Check query parameters
        if (!empty($_GET['aiw_api_key'])) {
            $key = sanitize_text_field($_GET['aiw_api_key']);
        } elseif (!empty($_SERVER['HTTP_X_AIWS_API_KEY'])) {
            $key = sanitize_text_field($_SERVER['HTTP_X_AIWS_API_KEY']);
        } elseif (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
            $auth = $_SERVER['HTTP_AUTHORIZATION'];
            if (strpos($auth, 'Bearer ') === 0) {
                $key = substr($auth, 7);
            }
        }

        return $key;
    }

    /**
     * Get stored API key from options
     */
    public static function get_stored_api_key(): string {
        $key = get_option('aiw_api_key', '');
        // Ensure we're working with the correct type
        if (is_scalar($key)) {
            return (string) $key;
        }
        return '';
    }

    /**
     * Validate JWT token
     */
    public static function validate_jwt_token(string $token): bool {
        // Your JWT token validation logic here
        // Integration with JWT auth plugin if available
        return false;
    }

    /**
     * Get JWT secret key
     */
    public static function get_jwt_secret_key(string $secret): string {
        return $secret . get_option('aiw_jwt_secret_key', '');
    }

    /**
     * Allow application passwords for API requests
     */
    public static function allow_application_passwords_for_api(array $passwords, int $user_id): array {
        $user = get_userdata($user_id);
        if (!$user) return $passwords;

        // Check if user has the necessary capabilities
        if (in_array('aiw_api_access', $user->roles) || $user->has_cap('manage_options')) {
            return $passwords; // Let WordPress handle application passwords for API users
        }

        return [];
    }
}
