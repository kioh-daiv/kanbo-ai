/**
 * Configuration file for Kanpo AI Application
 * 漢方AI診断支援システムの設定ファイル
 */

const CONFIG = {
    // API Configuration
    API: {
        // n8n webhook endpoint - 本番環境では実際のURLに変更
        BASE_URL: 'https://x-harumi-office.app.n8n.cloud/webhook-test/cd96acc0-ccfd-44fd-bf7c-27db3f87a203',
        
        // Request timeout in milliseconds
        REQUEST_TIMEOUT_MS: 90000,
        
        // Retry configuration
        MAX_RETRIES: 3,
        RETRY_DELAY_MS: 1000,
        
        // Request headers
        HEADERS: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    },
    
    // Application Information
    APP: {
        NAME: '漢方AI診断支援システム',
        VERSION: '1.0.0',
        DESCRIPTION: '症状を入力して漢方処方の候補を取得する診断支援ツール'
    },
    
    // Data Configuration
    DATA: {
        VERSION: '2024.1',
        MAX_TOP_CHOICES: 3,
        MAX_ALTERNATIVES: 5,
        MAX_FOLLOWUP_QUESTIONS: 3
    },
    
    // Form Validation Rules
    VALIDATION: {
        CHIEF_COMPLAINT: {
            MIN_LENGTH: 1,
            MAX_LENGTH: 200,
            REQUIRED: true
        },
        FREE_TEXT: {
            MAX_LENGTH: 1000
        },
        CONCOMITANT_MEDS: {
            MAX_LENGTH: 500,
            ALLOWED_CHARS: /^[一-龯ひ-ゟァ-ヶー・、，\s\w]*$/
        }
    },
    
    // UI Configuration
    UI: {
        // Language settings
        DEFAULT_LANGUAGE: 'ja',
        SUPPORTED_LANGUAGES: ['ja', 'en'],
        
        // Animation settings
        ANIMATION_DURATION_MS: 500,
        TOAST_DURATION_MS: 5000,
        
        // Mobile breakpoint
        MOBILE_BREAKPOINT: 768,
        
        // Loading states
        LOADING_STATES: {
            SUBMITTING: 'submitting',
            PROCESSING: 'processing',
            RETRYING: 'retrying'
        }
    },
    
    // Symptom Tags Presets
    SYMPTOM_TAGS: [
        // 疼痛関連
        { id: 'pain_head', label_ja: '頭痛', label_en: 'Headache' },
        { id: 'pain_back', label_ja: '腰痛', label_en: 'Back pain' },
        { id: 'pain_joint', label_ja: '関節痛', label_en: 'Joint pain' },
        { id: 'pain_stomach', label_ja: '腹痛', label_en: 'Stomach pain' },
        
        // 消化器系
        { id: 'digestive_nausea', label_ja: '吐き気', label_en: 'Nausea' },
        { id: 'digestive_diarrhea', label_ja: '下痢', label_en: 'Diarrhea' },
        { id: 'digestive_constipation', label_ja: '便秘', label_en: 'Constipation' },
        { id: 'digestive_heartburn', label_ja: '胸やけ', label_en: 'Heartburn' },
        
        // 呼吸器系
        { id: 'respiratory_cough', label_ja: '咳', label_en: 'Cough' },
        { id: 'respiratory_phlegm', label_ja: '痰', label_en: 'Phlegm' },
        { id: 'respiratory_shortness', label_ja: '息切れ', label_en: 'Shortness of breath' },
        
        // 神経系
        { id: 'neurological_insomnia', label_ja: '不眠', label_en: 'Insomnia' },
        { id: 'neurological_anxiety', label_ja: '不安', label_en: 'Anxiety' },
        { id: 'neurological_depression', label_ja: 'うつ', label_en: 'Depression' },
        { id: 'neurological_dizziness', label_ja: 'めまい', label_en: 'Dizziness' },
        
        // 循環器系
        { id: 'cardiovascular_palpitations', label_ja: '動悸', label_en: 'Palpitations' },
        { id: 'cardiovascular_chest_pain', label_ja: '胸痛', label_en: 'Chest pain' },
        
        // 皮膚系
        { id: 'skin_itching', label_ja: 'かゆみ', label_en: 'Itching' },
        { id: 'skin_rash', label_ja: '発疹', label_en: 'Rash' },
        { id: 'skin_dryness', label_ja: '乾燥', label_en: 'Dry skin' },
        
        // 婦人科系
        { id: 'gynecological_irregular', label_ja: '月経不順', label_en: 'Irregular menstruation' },
        { id: 'gynecological_pain', label_ja: '月経痛', label_en: 'Menstrual pain' },
        
        // その他
        { id: 'general_fatigue', label_ja: '疲労', label_en: 'Fatigue' },
        { id: 'general_fever', label_ja: '発熱', label_en: 'Fever' },
        { id: 'general_sweating', label_ja: '発汗', label_en: 'Sweating' },
        { id: 'general_cold_sensitivity', label_ja: '冷え性', label_en: 'Cold sensitivity' }
    ],
    
    // Error Messages
    ERROR_MESSAGES: {
        NETWORK_ERROR: {
            ja: 'ネットワークエラーが発生しました。接続を確認して再試行してください。',
            en: 'Network error occurred. Please check your connection and try again.'
        },
        TIMEOUT_ERROR: {
            ja: 'リクエストがタイムアウトしました。時間をおいて再試行してください。',
            en: 'Request timed out. Please try again after a moment.'
        },
        SERVER_ERROR: {
            ja: 'サーバーエラーが発生しました。しばらくしてから再試行してください。',
            en: 'Server error occurred. Please try again later.'
        },
        VALIDATION_ERROR: {
            ja: '入力内容に問題があります。確認して修正してください。',
            en: 'There is an issue with your input. Please review and correct.'
        },
        UNKNOWN_ERROR: {
            ja: '予期しないエラーが発生しました。',
            en: 'An unexpected error occurred.'
        }
    },
    
    // Success Messages
    SUCCESS_MESSAGES: {
        SUBMISSION_SUCCESS: {
            ja: '診断結果を取得しました。',
            en: 'Diagnosis results retrieved successfully.'
        },
        FOLLOWUP_SUCCESS: {
            ja: '追加情報を反映して結果を更新しました。',
            en: 'Results updated with additional information.'
        }
    },
    
    // Local Storage Keys
    STORAGE_KEYS: {
        SESSION_ID: 'kanpo_ai_session_id',
        FORM_DATA: 'kanpo_ai_form_data',
        LANGUAGE: 'kanpo_ai_language',
        LAST_RESULT: 'kanpo_ai_last_result'
    },
    
    // Session Configuration
    SESSION: {
        // Session expires after 24 hours
        EXPIRY_HOURS: 24,
        // Maximum number of follow-up questions
        MAX_FOLLOWUPS: 5,
        // Auto-save form data interval (milliseconds)
        AUTO_SAVE_INTERVAL: 5000
    },
    
    // Debug Configuration
    DEBUG: {
        ENABLED: false,
        LOG_LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
        CONSOLE_LOGGING: true
    }
};

// Environment-specific overrides
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Development environment
    CONFIG.API.BASE_URL = 'https://x-harumi-office.app.n8n.cloud/webhook-test/cd96acc0-ccfd-44fd-bf7c-27db3f87a203';
    CONFIG.DEBUG.ENABLED = true;
    CONFIG.DEBUG.LOG_LEVEL = 'debug';
} else if (window.location.hostname.includes('staging')) {
    // Staging environment
    CONFIG.API.BASE_URL = 'https://x-harumi-office.app.n8n.cloud/webhook/cd96acc0-ccfd-44fd-bf7c-27db3f87a203';
    CONFIG.DEBUG.ENABLED = true;
}

// Export configuration for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

// Make CONFIG globally available
window.CONFIG = CONFIG;
