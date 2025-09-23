/**
 * Main application logic for Kanpo AI
 * 漢方AI診断支援システムのメインアプリケーション
 */

// Application State Management
const AppState = {
    // Form data
    form: {
        chiefComplaint: '',
        symptomTags: [],
        freeText: '',
        concomitantMeds: '',
        consent: false,
        language: 'ja'
    },
    
    // Session management
    sessionId: null,
    sessionStartTime: null,
    
    // Results data
    result: {
        topChoices: [],
        alternatives: [],
        followUpQuestions: [],
        modelVersion: null,
        dataVersion: null,
        auditInfo: {}
    },
    
    // UI state
    loading: false,
    error: null,
    followups: [],
    lastSubmissionTime: null
};

// Utility Functions
const Utils = {
    // Generate UUID v4
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },
    
    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    },
    
    // Format timestamp
    formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleString('ja-JP');
    },
    
    // Calculate API response time
    calculateResponseTime(startTime) {
        return Date.now() - startTime;
    },
    
    // Validate form data
    validateForm() {
        const errors = [];
        
        // Chief complaint validation
        if (!AppState.form.chiefComplaint.trim()) {
            errors.push({ field: 'chief-complaint', message: CONFIG.ERROR_MESSAGES.VALIDATION_ERROR[AppState.form.language] });
        } else if (AppState.form.chiefComplaint.length > CONFIG.VALIDATION.CHIEF_COMPLAINT.MAX_LENGTH) {
            errors.push({ field: 'chief-complaint', message: `主訴は${CONFIG.VALIDATION.CHIEF_COMPLAINT.MAX_LENGTH}文字以内で入力してください` });
        }
        
        // Free text validation
        if (AppState.form.freeText.length > CONFIG.VALIDATION.FREE_TEXT.MAX_LENGTH) {
            errors.push({ field: 'free-text', message: `詳細症状は${CONFIG.VALIDATION.FREE_TEXT.MAX_LENGTH}文字以内で入力してください` });
        }
        
        // Concomitant medications validation
        if (AppState.form.concomitantMeds && !CONFIG.VALIDATION.CONCOMITANT_MEDS.ALLOWED_CHARS.test(AppState.form.concomitantMeds)) {
            errors.push({ field: 'concomitant-meds', message: '併用薬には漢字、ひらがな、カタカナ、英数字、カンマ、中点のみ使用できます' });
        }
        
        // Consent validation
        if (!AppState.form.consent) {
            errors.push({ field: 'consent-check', message: '利用規約への同意が必要です' });
        }
        
        return errors;
    },
    
    // Save form data to localStorage
    saveFormData() {
        try {
            const formData = {
                chiefComplaint: AppState.form.chiefComplaint,
                symptomTags: AppState.form.symptomTags,
                freeText: AppState.form.freeText,
                concomitantMeds: AppState.form.concomitantMeds,
                consent: AppState.form.consent,
                timestamp: Date.now()
            };
            localStorage.setItem(CONFIG.STORAGE_KEYS.FORM_DATA, JSON.stringify(formData));
        } catch (error) {
            console.warn('Failed to save form data:', error);
        }
    },
    
    // Load form data from localStorage
    loadFormData() {
        try {
            const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.FORM_DATA);
            if (saved) {
                const formData = JSON.parse(saved);
                // Check if data is not too old (24 hours)
                if (Date.now() - formData.timestamp < CONFIG.SESSION.EXPIRY_HOURS * 60 * 60 * 1000) {
                    AppState.form.chiefComplaint = formData.chiefComplaint || '';
                    AppState.form.symptomTags = formData.symptomTags || [];
                    AppState.form.freeText = formData.freeText || '';
                    AppState.form.concomitantMeds = formData.concomitantMeds || '';
                    AppState.form.consent = formData.consent || false;
                    return true;
                }
            }
        } catch (error) {
            console.warn('Failed to load form data:', error);
        }
        return false;
    }
};

// Language Management
const LanguageManager = {
    translations: {
        ja: {
            'title': '漢方AI診断支援システム',
            'subtitle': '症状を入力して漢方処方の候補を取得（試作版のため、結果の検索には時間がかかります）',
            'form-title': '症状入力フォーム',
            'chief-complaint-label': '主訴',
            'chief-complaint-placeholder': '例：腰痛、頭痛、不眠など',
            'chief-complaint-error': '主訴を入力してください',
            'chief-complaint-help': '具体的な症状を簡潔に入力してください',
            'symptom-tags-label': '症状タグ',
            'symptom-tags-help': '該当する症状にチェックを入れてください',
            'free-text-label': '詳細症状',
            'free-text-placeholder': 'その他の症状や経過など詳しく記述してください',
            'concomitant-meds-label': '併用薬',
            'concomitant-meds-placeholder': '例：アスピリン, ロキソニン, 漢方薬など（カンマ区切り）',
            'concomitant-meds-error': '使用できない文字が含まれています',
            'concomitant-meds-help': '現在服用中の薬剤をカンマ区切りで入力',
            'consent-text': '診断支援システムの利用に同意します',
            'terms-link': '利用規約',
            'consent-error': '利用規約への同意が必要です',
            'clear-btn': 'クリア',
            'submit-btn': '診断開始',
            'submit-text': '診断開始',
            'initial-message': '左側のフォームに入力して診断を開始してください',
            'terms-title': '利用規約',
            'error-title': 'エラー',
            'success-title': '成功',
            'disclaimer': '本システムは診断支援ツールです。医師の診断を代替するものではありません。',
            'contact': 'お問い合わせ: x-harumi-office@gmail.com',
            'version': 'バージョン',
            'model': 'モデル',
            'close-btn': '閉じる'
        },
        en: {
            'title': 'Traditional Chinese Medicine AI Diagnostic Support',
            'subtitle': 'Enter symptoms to get Kanpo prescription candidates (Please note that the search results may take some time due to the trial version)',
            'form-title': 'Symptom Input Form',
            'chief-complaint-label': 'Chief Complaint',
            'chief-complaint-placeholder': 'e.g., back pain, headache, insomnia',
            'chief-complaint-error': 'Please enter chief complaint',
            'chief-complaint-help': 'Enter specific symptoms concisely',
            'symptom-tags-label': 'Symptom Tags',
            'symptom-tags-help': 'Check applicable symptoms',
            'free-text-label': 'Detailed Symptoms',
            'free-text-placeholder': 'Describe other symptoms and course in detail',
            'concomitant-meds-label': 'Concomitant Medications',
            'concomitant-meds-placeholder': 'e.g., Aspirin, Loxonin, Kanpo medicines (comma-separated)',
            'concomitant-meds-error': 'Contains invalid characters',
            'concomitant-meds-help': 'Enter current medications separated by commas',
            'consent-text': 'I agree to use the diagnostic support system',
            'terms-link': 'Terms of Service',
            'consent-error': 'Agreement to terms is required',
            'clear-btn': 'Clear',
            'submit-btn': 'Start Diagnosis',
            'submit-text': 'Start Diagnosis',
            'initial-message': 'Please enter information in the form on the left to start diagnosis',
            'terms-title': 'Terms of Service',
            'error-title': 'Error',
            'success-title': 'Success',
            'disclaimer': 'This system is a diagnostic support tool and does not replace physician diagnosis.',
            'contact': 'Contact: x-harumi-office@gmail.com',
            'version': 'Version',
            'model': 'Model',
            'close-btn': 'Close'
        }
    },
    
    // Switch language
    switchLanguage(lang) {
        if (CONFIG.UI.SUPPORTED_LANGUAGES.includes(lang)) {
            AppState.form.language = lang;
            localStorage.setItem(CONFIG.STORAGE_KEYS.LANGUAGE, lang);
            this.updateUI();
        }
    },
    
    // Update UI with current language
    updateUI() {
        const elements = document.querySelectorAll('[data-lang]');
        elements.forEach(element => {
            const key = element.getAttribute('data-lang');
            const translation = this.translations[AppState.form.language][key];
            if (translation) {
                if (element.tagName === 'INPUT' && element.type === 'text') {
                    element.placeholder = translation;
                } else if (element.tagName === 'TEXTAREA') {
                    element.placeholder = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });
        
        // Update symptom tags
        this.updateSymptomTags();
    },
    
    // Update symptom tags with current language
    updateSymptomTags() {
        const container = document.getElementById('symptom-tags-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        CONFIG.SYMPTOM_TAGS.forEach(tag => {
            const col = document.createElement('div');
            col.className = 'col-md-6 col-lg-4';
            
            const formCheck = document.createElement('div');
            formCheck.className = 'form-check symptom-tag';
            
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.className = 'form-check-input';
            input.id = tag.id;
            input.value = tag.id;
            
            const label = document.createElement('label');
            label.className = 'form-check-label';
            label.htmlFor = tag.id;
            label.textContent = AppState.form.language === 'ja' ? tag.label_ja : tag.label_en;
            
            // Check if this tag is selected
            if (AppState.form.symptomTags.includes(tag.id)) {
                input.checked = true;
            }
            
            formCheck.appendChild(input);
            formCheck.appendChild(label);
            col.appendChild(formCheck);
            container.appendChild(col);
        });
    }
};

// API Communication
const APIManager = {
    // Submit initial diagnosis request
    async submitDiagnosis() {
        const payload = {
            session_id: AppState.sessionId,
            chief_complaint: AppState.form.chiefComplaint.trim(),
            symptoms: AppState.form.symptomTags,
            free_text: AppState.form.freeText.trim(),
            concomitant_meds: AppState.form.concomitantMeds.split(',').map(med => med.trim()).filter(med => med),
            lang: AppState.form.language,
            app_version: CONFIG.APP.VERSION
        };
        
        return this.makeRequest('', payload);
    },
    
    // Submit follow-up answers
    async submitFollowup(answers) {
        const payload = {
            session_id: AppState.sessionId,
            answers: answers
        };
        
        return this.makeRequest('', payload, CONFIG.API.FOLLOWUP_URL);
    },
    
    // Make HTTP request with timeout and error handling
    async makeRequest(endpoint, payload, customUrl = null) {
        const startTime = Date.now();
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.API.REQUEST_TIMEOUT_MS);
            
            const baseUrl = customUrl || CONFIG.API.BASE_URL;
            const response = await fetch(baseUrl + endpoint, {
                method: 'POST',
                headers: CONFIG.API.HEADERS,
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Add audit information
            data.auditInfo = {
                responseTime: this.calculateResponseTime(startTime),
                timestamp: Date.now(),
                sessionId: AppState.sessionId
            };
            
            return data;
            
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('TIMEOUT_ERROR');
            } else if (error.message.includes('Failed to fetch')) {
                throw new Error('NETWORK_ERROR');
            } else if (error.message.includes('HTTP 5')) {
                throw new Error('SERVER_ERROR');
            } else {
                throw error;
            }
        }
    },
    
    // Calculate response time
    calculateResponseTime(startTime) {
        return Date.now() - startTime;
    }
};

// UI Rendering
const UIRenderer = {
    // Render prescription cards
    renderPrescriptionCards(choices) {
        if (!choices || choices.length === 0) return '';
        
        return choices.map((choice, index) => `
            <div class="card prescription-card result-card-animate" style="animation-delay: ${index * 0.1}s">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="mb-0 text-prescription">${Utils.escapeHtml(choice.name_jp)}</h6>
                    <div>
                        <span class="badge bg-success score-badge">${Math.round(choice.score * 100)}%</span>
                        <small class="chapter-id">${choice.chapter || ''} ${choice.id || ''}</small>
                    </div>
                </div>
                <div class="card-body">
                    <p class="card-text">${Utils.escapeHtml(choice.why)}</p>
                    
                    ${this.renderCitations(choice.citations)}
                    
                    ${this.renderSafetyNotes(choice.safety_notes)}
                </div>
            </div>
        `).join('');
    },
    
    // Render citations
    renderCitations(citations) {
        if (!citations || citations.length === 0) return '';
        
        return citations.map(citation => `
            <div class="quote-block" aria-label="漢方の引用文献">
                <div class="quote-chinese">${Utils.escapeHtml(citation.zh)}</div>
                <div class="quote-japanese">
                    ${Utils.escapeHtml(citation.ja)}
                    <span class="translation-badge">仮訳</span>
                </div>
                <div class="quote-source">${citation.chapter} - ${citation.id}</div>
            </div>
        `).join('');
    },
    
    // Render safety notes
    renderSafetyNotes(safetyNotes) {
        if (!safetyNotes || safetyNotes.length === 0) return '';
        
        const notesHtml = safetyNotes.map(note => `
            <div class="alert-text">• ${Utils.escapeHtml(note)}</div>
        `).join('');
        
        return `
            <div class="safety-notes">
                <div class="alert-heading">注意事項</div>
                ${notesHtml}
            </div>
        `;
    },
    
    // Render follow-up questions
    renderFollowupQuestions(questions) {
        if (!questions || questions.length === 0) return '';
        
        return `
            <div class="card">
                <div class="card-header">
                    <h6 class="mb-0">追加質問</h6>
                </div>
                <div class="card-body">
                    ${questions.map((question, index) => `
                        <div class="followup-item">
                            <div class="followup-question">${Utils.escapeHtml(question.question)}</div>
                            <div class="followup-options">
                                <div class="followup-option">
                                    <div class="form-check">
                                        <input class="form-check-input" type="radio" name="followup_${question.id}" id="followup_${question.id}_yes" value="yes">
                                        <label class="form-check-label" for="followup_${question.id}_yes">はい</label>
                                    </div>
                                </div>
                                <div class="followup-option">
                                    <div class="form-check">
                                        <input class="form-check-input" type="radio" name="followup_${question.id}" id="followup_${question.id}_no" value="no">
                                        <label class="form-check-label" for="followup_${question.id}_no">いいえ</label>
                                    </div>
                                </div>
                                <div class="followup-option">
                                    <div class="form-check">
                                        <input class="form-check-input" type="radio" name="followup_${question.id}" id="followup_${question.id}_unknown" value="unknown">
                                        <label class="form-check-label" for="followup_${question.id}_unknown">わからない</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                    <button type="button" class="btn btn-primary" id="submit-followup-btn">
                        回答を送信
                    </button>
                </div>
            </div>
        `;
    },
    
    // Render alternatives
    renderAlternatives(alternatives) {
        if (!alternatives || alternatives.length === 0) return '';
        
        return `
            <div class="card">
                <div class="card-header">
                    <h6 class="mb-0">代替案</h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        ${alternatives.map(alt => `
                            <div class="col-md-6 mb-2">
                                <div class="alternative-card">
                                    <div class="alternative-name">${Utils.escapeHtml(alt.name_jp)}</div>
                                    <div class="alternative-score">スコア: ${Math.round(alt.score * 100)}%</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },
    
    // Render audit information
    renderAuditInfo(auditInfo) {
        if (!auditInfo) return '';
        
        return `
            <div class="audit-info">
                <span class="audit-item">応答時間: ${auditInfo.responseTime}ms</span>
                <span class="audit-item">参照件数: ${auditInfo.referenceCount || 0}</span>
                <span class="audit-item">時刻: ${Utils.formatTimestamp(auditInfo.timestamp)}</span>
            </div>
        `;
    },
    
    // Render complete results
    renderResults(result) {
        const resultsArea = document.getElementById('results-area');
        if (!resultsArea) return;
        
        let html = '';
        
        if (result.topChoices && result.topChoices.length > 0) {
            html += this.renderPrescriptionCards(result.topChoices);
        }
        
        if (result.followUpQuestions && result.followUpQuestions.length > 0) {
            html += this.renderFollowupQuestions(result.followUpQuestions);
        }
        
        if (result.alternatives && result.alternatives.length > 0) {
            html += this.renderAlternatives(result.alternatives);
        }
        
        if (result.auditInfo) {
            html += this.renderAuditInfo(result.auditInfo);
        }
        
        resultsArea.innerHTML = html;
    },
    
    // Show loading state
    showLoading() {
        const resultsArea = document.getElementById('results-area');
        if (!resultsArea) return;
        
        resultsArea.innerHTML = `
            <div class="card">
                <div class="card-body results-loading">
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">読み込み中...</span>
                    </div>
                    <p class="mt-3 mb-0">診断結果を取得しています...</p>
                </div>
            </div>
        `;
    },
    
    // Show error state
    showError(error) {
        const resultsArea = document.getElementById('results-area');
        if (!resultsArea) return;
        
        const errorMessage = CONFIG.ERROR_MESSAGES[error] || CONFIG.ERROR_MESSAGES.UNKNOWN_ERROR;
        const message = errorMessage[AppState.form.language] || errorMessage.ja;
        
        resultsArea.innerHTML = `
            <div class="card border-danger">
                <div class="card-body text-center">
                    <i class="bi bi-exclamation-triangle-fill text-danger display-4 mb-3"></i>
                    <h5 class="text-danger">エラーが発生しました</h5>
                    <p class="text-muted">${message}</p>
                    <button type="button" class="btn btn-outline-danger retry-btn" onclick="App.submitForm()">
                        再試行
                    </button>
                </div>
            </div>
        `;
    }
};

// Toast Notifications
const ToastManager = {
    // Show error toast
    showError(message) {
        const toast = document.getElementById('error-toast');
        const toastBody = document.getElementById('error-message');
        if (toast && toastBody) {
            toastBody.textContent = message;
            const bsToast = new bootstrap.Toast(toast);
            bsToast.show();
        }
    },
    
    // Show success toast
    showSuccess(message) {
        const toast = document.getElementById('success-toast');
        const toastBody = document.getElementById('success-message');
        if (toast && toastBody) {
            toastBody.textContent = message;
            const bsToast = new bootstrap.Toast(toast);
            bsToast.show();
        }
    }
};

// Main Application Controller
const App = {
    // Initialize application
    init() {
        this.initializeSession();
        this.loadSavedData();
        this.setupEventListeners();
        this.updateUI();
        
        // Auto-save form data periodically
        setInterval(() => {
            Utils.saveFormData();
        }, CONFIG.SESSION.AUTO_SAVE_INTERVAL);
    },
    
    // Initialize session
    initializeSession() {
        AppState.sessionId = Utils.generateUUID();
        AppState.sessionStartTime = Date.now();
        localStorage.setItem(CONFIG.STORAGE_KEYS.SESSION_ID, AppState.sessionId);
    },
    
    // Load saved data
    loadSavedData() {
        // Load language preference
        const savedLanguage = localStorage.getItem(CONFIG.STORAGE_KEYS.LANGUAGE);
        if (savedLanguage && CONFIG.UI.SUPPORTED_LANGUAGES.includes(savedLanguage)) {
            AppState.form.language = savedLanguage;
        }
        
        // Load form data
        Utils.loadFormData();
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Form submission
        const symptomForm = document.getElementById('symptom-form');
        if (symptomForm) {
            symptomForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitForm();
            });
        }
        
        // Clear button
        const clearBtn = document.getElementById('clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearForm();
            });
        }
        
        // Form input changes - save automatically
        if (symptomForm) {
            const inputs = symptomForm.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    this.updateFormState();
                    Utils.saveFormData();
                });
                
                input.addEventListener('change', () => {
                    this.updateFormState();
                    Utils.saveFormData();
                });
            });
        }
        
        // Follow-up submission (delegated event)
        document.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'submit-followup-btn') {
                this.submitFollowup();
            }
        });
    },
    
    // Update form state from DOM
    updateFormState() {
        const chiefComplaint = document.getElementById('chief-complaint');
        const freeText = document.getElementById('free-text');
        const concomitantMeds = document.getElementById('concomitant-meds');
        const consentCheck = document.getElementById('consent-check');
        
        if (chiefComplaint) AppState.form.chiefComplaint = chiefComplaint.value;
        if (freeText) AppState.form.freeText = freeText.value;
        if (concomitantMeds) AppState.form.concomitantMeds = concomitantMeds.value;
        if (consentCheck) AppState.form.consent = consentCheck.checked;
        
        // Update symptom tags
        AppState.form.symptomTags = [];
        const symptomContainer = document.getElementById('symptom-tags-container');
        if (symptomContainer) {
            const symptomInputs = symptomContainer.querySelectorAll('input[type="checkbox"]:checked');
            symptomInputs.forEach(input => {
                AppState.form.symptomTags.push(input.value);
            });
        }
    },
    
    // Submit form
    async submitForm() {
        this.updateFormState();
        
        // Validate form
        const errors = Utils.validateForm();
        if (errors.length > 0) {
            this.showValidationErrors(errors);
            return;
        }
        
        // Clear previous errors
        this.clearValidationErrors();
        
        // Set loading state
        AppState.loading = true;
        this.updateLoadingState();
        UIRenderer.showLoading();
        
        try {
            // Submit to API
            const result = await APIManager.submitDiagnosis();
            
            // Update state
            AppState.result = result;
            AppState.loading = false;
            AppState.error = null;
            AppState.lastSubmissionTime = Date.now();
            
            // Render results
            UIRenderer.renderResults(result[0].message.content);
            
            // Show success message
            const message = CONFIG.SUCCESS_MESSAGES.SUBMISSION_SUCCESS[AppState.form.language];
            ToastManager.showSuccess(message);
            
        } catch (error) {
            AppState.loading = false;
            AppState.error = error.message;
            
            // Show error
            UIRenderer.showError(error.message);
            ToastManager.showError(error.message);
        }
        
        this.updateLoadingState();
    },
    
    // Submit follow-up answers
    async submitFollowup() {
        // Collect follow-up answers
        const answers = [];
        const followupInputs = document.querySelectorAll('input[name^="followup_"]:checked');
        
        if (followupInputs.length === 0) {
            ToastManager.showError('質問に回答してください');
            return;
        }
        
        followupInputs.forEach(input => {
            const questionId = input.name.replace('followup_', '');
            answers.push({
                id: questionId,
                value: input.value
            });
        });
        
        // Set loading state
        AppState.loading = true;
        this.updateLoadingState();
        UIRenderer.showLoading();
        
        try {
            // Submit follow-up
            const result = await APIManager.submitFollowup(answers);
            
            // Update state
            AppState.result = result;
            AppState.followups = [...AppState.followups, ...answers];
            AppState.loading = false;
            AppState.error = null;
            
            // Render updated results
            UIRenderer.renderResults(result[0].message.content);
            
            // Show success message
            const message = CONFIG.SUCCESS_MESSAGES.FOLLOWUP_SUCCESS[AppState.form.language];
            ToastManager.showSuccess(message);
            
        } catch (error) {
            AppState.loading = false;
            AppState.error = error.message;
            
            // Show error
            UIRenderer.showError(error.message);
            ToastManager.showError(error.message);
        }
        
        this.updateLoadingState();
    },
    
    // Clear form
    clearForm() {
        // Reset form state
        AppState.form = {
            chiefComplaint: '',
            symptomTags: [],
            freeText: '',
            concomitantMeds: '',
            consent: false,
            language: AppState.form.language // Keep language setting
        };
        
        // Clear DOM
        const chiefComplaint = document.getElementById('chief-complaint');
        const freeText = document.getElementById('free-text');
        const concomitantMeds = document.getElementById('concomitant-meds');
        const consentCheck = document.getElementById('consent-check');
        
        if (chiefComplaint) chiefComplaint.value = '';
        if (freeText) freeText.value = '';
        if (concomitantMeds) concomitantMeds.value = '';
        if (consentCheck) consentCheck.checked = false;
        
        // Clear symptom tags
        const symptomContainer = document.getElementById('symptom-tags-container');
        if (symptomContainer) {
            const symptomInputs = symptomContainer.querySelectorAll('input[type="checkbox"]');
            symptomInputs.forEach(input => {
                input.checked = false;
            });
        }
        
        // Reset results
        AppState.result = {
            topChoices: [],
            alternatives: [],
            followUpQuestions: [],
            modelVersion: null,
            dataVersion: null,
            auditInfo: {}
        };
        AppState.followups = [];
        AppState.error = null;
        
        // Clear results area
        const resultsArea = document.getElementById('results-area');
        if (resultsArea) {
            resultsArea.innerHTML = `
                <div class="card">
                    <div class="card-body text-center text-muted">
                        <i class="bi bi-clipboard-data display-4 mb-3"></i>
                        <p class="mb-0">左側のフォームに入力して診断を開始してください</p>
                    </div>
                </div>
            `;
        }
        
        // Clear validation errors
        this.clearValidationErrors();
        
        // Clear saved data
        localStorage.removeItem(CONFIG.STORAGE_KEYS.FORM_DATA);
        
        ToastManager.showSuccess('フォームをクリアしました');
    },
    
    // Show validation errors
    showValidationErrors(errors) {
        errors.forEach(error => {
            const element = document.getElementById(error.field);
            if (element) {
                element.classList.add('is-invalid');
                const feedback = element.parentNode?.querySelector('.invalid-feedback');
                if (feedback) {
                    feedback.textContent = error.message;
                }
            }
        });
    },
    
    // Clear validation errors
    clearValidationErrors() {
        const invalidElements = document.querySelectorAll('.is-invalid');
        invalidElements.forEach(element => {
            element.classList.remove('is-invalid');
        });
    },
    
    // Update loading state
    updateLoadingState() {
        const submitBtn = document.getElementById('submit-btn');
        if (!submitBtn) return; // Exit if button not found
        
        const spinner = submitBtn.querySelector('.spinner-border');
        const submitText = submitBtn.querySelector('[data-lang="submit-text"]');
        
        if (AppState.loading) {
            submitBtn.disabled = true;
            if (spinner) {
                spinner.classList.remove('d-none');
            }
            if (submitText) {
                submitText.textContent = '処理中...';
            }
        } else {
            submitBtn.disabled = false;
            if (spinner) {
                spinner.classList.add('d-none');
            }
            if (submitText) {
                submitText.textContent = LanguageManager.translations[AppState.form.language]['submit-text'];
            }
        }
    },
    
    // Update UI
    updateUI() {
        LanguageManager.updateUI();
        
        // Update version information
        const appVersion = document.getElementById('app-version');
        const modelVersion = document.getElementById('model-version');
        if (appVersion) appVersion.textContent = CONFIG.APP.VERSION;
        if (modelVersion && AppState.result.modelVersion) {
            modelVersion.textContent = AppState.result.modelVersion;
        }
    }
};

// Language switching function (global)
function switchLanguage(lang) {
    LanguageManager.switchLanguage(lang);
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Make App globally available for debugging
window.App = App;
