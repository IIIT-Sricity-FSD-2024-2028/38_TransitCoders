/**
 * Admin Form Validation Utilities
 */
const Validator = {
    required(value, fieldName) {
        if (!value || value.toString().trim() === '') {
            return fieldName + ' is required';
        }
        return null;
    },

    numeric(value, fieldName) {
        if (value && isNaN(Number(value))) {
            return fieldName + ' must be a number';
        }
        return null;
    },

    duplicateId(value, existingIds, fieldName) {
        if (existingIds.includes(value)) {
            return fieldName + ' already exists';
        }
        return null;
    },

    minLength(value, min, fieldName) {
        if (value && value.length < min) {
            return fieldName + ' must be at least ' + min + ' characters';
        }
        return null;
    },

    /**
     * Validate a form — pass an array of { field, value, rules[] }
     * Returns { valid, errors: { fieldName: errorMsg } }
     */
    validateForm(fields) {
        const errors = {};
        let valid = true;

        fields.forEach(({ field, value, rules }) => {
            for (const rule of rules) {
                const error = rule(value, field);
                if (error) {
                    errors[field] = error;
                    valid = false;
                    break;
                }
            }
        });

        return { valid, errors };
    },

    /**
     * Show inline errors on a form
     */
    showErrors(formEl, errors) {
        // Clear previous
        formEl.querySelectorAll('.form-group').forEach(g => {
            g.classList.remove('has-error');
        });

        Object.keys(errors).forEach(field => {
            const group = formEl.querySelector('[data-field="' + field + '"]');
            if (group) {
                group.classList.add('has-error');
                const errEl = group.querySelector('.form-error');
                if (errEl) errEl.textContent = errors[field];
            }
        });
    },

    clearErrors(formEl) {
        formEl.querySelectorAll('.form-group').forEach(g => {
            g.classList.remove('has-error');
        });
    }
};
