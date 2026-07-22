<?php
/**
 * AI Wonderland API Authentication Layer
 */

if (!defined('ABSPATH')) exit;

class AIW_Auth {
    private const API_KEY_OPTION = 'aiw_api_key';

    public static function init() {
        if (!get_option(self::API_KEY_OPTION)) {
            self::generate_api_key();
        }
    }

    public static function generate_api_key(): string {
        $key = 'aiw_' . wp_generate_password(32, false);
        update_option(self::API_KEY_OPTION, $key);
        return $key;
    }

    public static function get_api_key(): string {
        return (string) get_option(self::API_KEY_OPTION, '');
    }

    public static function authenticate_request(WP_REST_Request $request): bool {
        // Allow logged-in administrators with proper capability
        if (current_user_can('manage_options')) {
            return true;
        }

        // Check Authorization header for Bearer token or X-AIW-Api-Key
        $auth_header = $request->get_header('authorization');
        $api_key_header = $request->get_header('x-aiw-api-key');

        $provided_key = '';
        if (!empty($api_key_header)) {
            $provided_key = $api_key_header;
        } elseif (!empty($auth_header) && str_istartswith($auth_header, 'Bearer ')) {
            $provided_key = substr($auth_header, 7);
        }

        if (!empty($provided_key) && hash_equals(self::get_api_key(), $provided_key)) {
            return true;
        }

        return false;
    }
}
