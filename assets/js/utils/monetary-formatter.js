class MonetaryFormatter {
  constructor(inputId, options = {}) {
    // PRIVATE PROPERTIES
    this.inputId = inputId;
    this.inputElement = document.getElementById(inputId);
    this.internalValue = '0';
    this.locale = options.locale || 'pt-AO';
    this.currency = options.currency || 'Kz';
    this.decimals = options.decimals !== undefined ? options.decimals : 2;
    this.allowNegative = options.allowNegative || false;
    
    // ✅ NEW PROPERTIES for mathematical operations
    this.operationMode = null;        // 'addition' | 'subtraction' | null
    this.operationBuffer = '0';       // Value being typed after operator
    this.previousValue = '0';         // Value before the operation
    
    // OPTIONAL CALLBACKS
    this.onValueChange = options.onValueChange || null;
    
    // INITIALIZATION
    if (this.inputElement) {
      this._init();
    }
  }
  
  _init() {
    // 1. Define input as readonly
    this.inputElement.setAttribute('readonly', 'true');
    
    // 2. Listener will be added by enable() when needed
    this._boundKeyboardHandler = null;
    this._boundInputHandler = null;
  }
  
  _formatDisplay() {
    // ✅ CRITICAL: Refresh DOM reference before updating
    this._refreshInputReference();
    
    if (!this.inputElement) {
      console.warn(`[MonetaryFormatter] Cannot format display - input ${this.inputId} not in DOM`);
      return;
    }
    
    // ✅ OPERATION MODE: Display two values with operator
    if (this.operationMode) {
      const previousFormatted = this._formatValue(this.previousValue);
      const bufferFormatted = this._formatValue(this.operationBuffer);
      const operator = this.operationMode === 'addition' ? '+' : '−';
      
      this.inputElement.value = `${this.currency} ${previousFormatted} ${operator} ${this.currency} ${bufferFormatted}`;
    } 
    // ✅ NORMAL MODE: Display only one value
    else {
      const formatted = this._formatValue(this.internalValue);
      this.inputElement.value = `${this.currency} ${formatted}`;
    }
  }
  
  // ✅ NEW HELPER: Format a numeric value
  _formatValue(valueString) {
    const value = parseFloat(valueString) || 0;
    return value.toLocaleString(this.locale, {
      minimumFractionDigits: this.decimals,
      maximumFractionDigits: this.decimals
    });
  }
  
  // ✅ NEW METHOD: Start a mathematical operation
  startOperation(operation) {
    if (this.operationMode !== null) {
      console.warn('[MonetaryFormatter] Operation already in progress');
      return;
    }
    
    // Save current value and start operation mode
    this.previousValue = this.internalValue;
    this.operationMode = operation;
    this.operationBuffer = '0';
    
    console.log(`➕ [MonetaryFormatter] Operation started: ${operation}`);
    this._formatDisplay();
  }
  
  // ✅ NEW METHOD: Execute the calculation and return to normal mode
  executeOperation() {
    if (this.operationMode === null) {
      console.warn('[MonetaryFormatter] No operation to execute');
      return;
    }
    
    const prev = parseFloat(this.previousValue) || 0;
    const buffer = parseFloat(this.operationBuffer) || 0;
    
    let result;
    if (this.operationMode === 'addition') {
      result = prev + buffer;
    } else if (this.operationMode === 'subtraction') {
      result = prev - buffer;
      
      // ✅ VALIDATION: Don't allow negative result (if allowNegative = false)
      if (!this.allowNegative && result < 0) {
        console.warn('[MonetaryFormatter] Result would be negative, operation cancelled');
        this.cancelOperation();
        return;
      }
    }
    
    // Update internal value and reset operation state
    this.internalValue = String(result);
    this.operationMode = null;
    this.operationBuffer = '0';
    this.previousValue = '0';
    
    console.log(`✅ [MonetaryFormatter] Operation executed. Result: ${result}`);
    
    this._formatDisplay();
    this._triggerCallback();
  }
  
  // ✅ NEW METHOD: Cancel operation in progress (ESC)
  cancelOperation() {
    if (this.operationMode === null) {
      return;
    }
    
    console.log('❌ [MonetaryFormatter] Operation cancelled');
    
    // Reset operation state
    this.operationMode = null;
    this.operationBuffer = '0';
    this.previousValue = '0';
    
    this._formatDisplay();
  }
  
  keypadInput(value) {
    // ✅ CORRECTION: If in operation mode, type in the buffer
    const targetValue = this.operationMode ? 'operationBuffer' : 'internalValue';
    
    if (value === '.') {
      if (!this[targetValue].includes('.')) {
        this[targetValue] += '.';
      }
    } else if (value === '0') {
      if (this[targetValue] === '0') {
        return;
      } else if (this[targetValue] === '0.') {
        this[targetValue] += value;
      } else if (this[targetValue] === '') {
        this[targetValue] = '0';
      } else {
        this[targetValue] += value;
      }
    } else {
      if (this[targetValue] === '0') {
        this[targetValue] = value;
      } else {
        this[targetValue] += value;
      }
    }
    
    // ✅ Limit decimal places
    if (this[targetValue].includes('.')) {
      const parts = this[targetValue].split('.');
      if (parts[1] && parts[1].length > this.decimals) {
        parts[1] = parts[1].substring(0, this.decimals);
        this[targetValue] = parts[0] + '.' + parts[1];
      }
    }
    
    this._formatDisplay();
    
    // ✅ CORRECTION: Only trigger callback if not in operation mode
    if (!this.operationMode) {
      this._triggerCallback();
    }
  }
  
  backspace() {
    // ✅ CORRECTION: If in operation mode, delete from buffer
    const targetValue = this.operationMode ? 'operationBuffer' : 'internalValue';
    
    if (this[targetValue].length > 0) {
      this[targetValue] = this[targetValue].slice(0, -1);
      
      if (this[targetValue] === '' || this[targetValue] === '.') {
        this[targetValue] = '0';
      }
    }
    
    this._formatDisplay();
    
    // ✅ CORRECTION: Only trigger callback if not in operation mode
    if (!this.operationMode) {
      this._triggerCallback();
    }
  }
  
  clear() {
    // ✅ CORRECTION: Reset EVERYTHING (value + operation)
    this.internalValue = '0';
    this.operationMode = null;
    this.operationBuffer = '0';
    this.previousValue = '0';
    
    this._formatDisplay();
    this._triggerCallback();
  }
  
  handleKeyboard(event) {
    const key = event.key;
    
    // ✅ ADDITION (+)
    if (key === '+') {
      event.preventDefault();
      if (this.operationMode === null) {
        this.startOperation('addition');
      }
      return;
    }
    
    // ✅ SUBTRACTION (-)
    if (key === '-') {
      event.preventDefault();
      if (this.operationMode === null) {
        this.startOperation('subtraction');
      }
      return;
    }
    
    // ✅ ENTER (Execute operation or confirm value)
    if (key === 'Enter') {
      event.preventDefault();
      if (this.operationMode !== null) {
        this.executeOperation();
      }
      return;
    }
    
    // ✅ ESC (Cancel operation)
    if (key === 'Escape') {
      event.preventDefault();
      if (this.operationMode !== null) {
        this.cancelOperation();
      }
      return;
    }
    
    if (/[0-9]/.test(key)) {
      event.preventDefault();
      this.keypadInput(key);
    } else if (key === '.' || key === ',' || key === 'Decimal') {
      event.preventDefault();
      this.keypadInput('.');
    } else if (key === 'Backspace') {
      event.preventDefault();
      this.backspace();
    } else if (key === 'Delete' || key === 'Clear') {
      event.preventDefault();
      this.clear();
    }
  }
  
  getValue() {
    return parseFloat(this.internalValue) || 0;
  }
  
  setValue(newValue) {
    this.internalValue = String(newValue);
    this._formatDisplay();
  }
  
  _triggerCallback() {
    if (this.onValueChange) {
      this.onValueChange(this.getValue());
    }
  }
  
  /**
   * ✅ NEW METHOD: Refresh input element reference from DOM
   * CRITICAL for handling re-rendered elements with same ID
   */
  _refreshInputReference() {
    const currentElement = document.getElementById(this.inputId);
    
    // If element changed (different object), update reference
    if (currentElement !== this.inputElement) {
      console.log(`🔄 [MonetaryFormatter] Input ${this.inputId} reference updated`);
      this.inputElement = currentElement;
    }
    
    if (!this.inputElement) {
      console.warn(`⚠️ [MonetaryFormatter] Input ${this.inputId} not found in DOM`);
    }
  }
  
  /**
   * ✅ CORRECTED: Enable formatting with DOM reference refresh
   */
  enable() {
    // ✅ CRITICAL FIX: Always refresh DOM reference before enabling
    this._refreshInputReference();
    
    if (!this.inputElement) {
      console.error(`❌ [MonetaryFormatter] Cannot enable - input ${this.inputId} not found`);
      return;
    }
    
    // Remove readonly to allow focus and editing
    this.inputElement.removeAttribute('readonly');
    
    // Create bound handlers if they don't exist
    if (!this._boundKeyboardHandler) {
      this._boundKeyboardHandler = (event) => this.handleKeyboard(event);
    }
    
    if (!this._boundInputHandler) {
      // Prevent direct input that bypasses our keyboard handler
      this._boundInputHandler = (event) => {
        event.preventDefault();
        this._formatDisplay();
      };
    }
    
    // ✅ Remove old listeners first (prevent duplicates)
    this.inputElement.removeEventListener('keydown', this._boundKeyboardHandler);
    this.inputElement.removeEventListener('input', this._boundInputHandler);
    this.inputElement.removeEventListener('paste', this._preventPaste);
    
    // ✅ Add fresh listeners to CURRENT element
    this.inputElement.addEventListener('keydown', this._boundKeyboardHandler);
    this.inputElement.addEventListener('input', this._boundInputHandler);
    this.inputElement.addEventListener('paste', this._preventPaste);
    
    console.log(`✅ [MonetaryFormatter] Enabled for ${this.inputId}`);
  }
  
  /**
   * ✅ CORRECTED: Disable formatting with DOM reference refresh
   */
  disable() {
    // ✅ Refresh reference before disabling
    this._refreshInputReference();
    
    if (!this.inputElement) {
      console.warn(`⚠️ [MonetaryFormatter] Cannot disable - input ${this.inputId} not found`);
      return;
    }
    
    // Remove ALL event listeners
    if (this._boundKeyboardHandler) {
      this.inputElement.removeEventListener('keydown', this._boundKeyboardHandler);
    }
    
    if (this._boundInputHandler) {
      this.inputElement.removeEventListener('input', this._boundInputHandler);
    }
    
    this.inputElement.removeEventListener('paste', this._preventPaste);
    
    // Set readonly
    this.inputElement.setAttribute('readonly', 'true');
    
    console.log(`❌ [MonetaryFormatter] Disabled for ${this.inputId}`);
  }
  
  /**
   * Prevent paste events
   */
  _preventPaste(e) {
    e.preventDefault();
  }
  
  /**
   * ✅ CORRECTED: Destroy with cleanup
   */
  destroy() {
    this.disable();
    this._boundKeyboardHandler = null;
    this._boundInputHandler = null;
    this.inputElement = null;
    console.log(`🗑️ [MonetaryFormatter] Destroyed for ${this.inputId}`);
  }
}
