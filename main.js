// @ts-nocheck
/**
 * Accessible Stepper Web Component
 * WCAG 2.2 AA compliant with WAI-ARIA support
 *
 * @example
 * <accessible-stepper current="1" mode="steps">
 *   <div data-step data-label="Account">Step 1 content</div>
 *   <div data-step data-label="Profile">Step 2 content</div>
 *   <div data-step data-label="Review">Step 3 content</div>
 * </accessible-stepper>
 */

const styles = `
  :host {
    --stepper-primary: #0052cc;
    --stepper-complete: #00875a;
    --stepper-inactive: #6b778c;
    --stepper-bg: #fff;
    --stepper-border: #dfe1e6;
    --stepper-focus: #4c9aff;
    --stepper-font: system-ui, -apple-system, sans-serif;
    
    display: block;
    font-family: var(--stepper-font);
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .stepper-nav {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    list-style: none;
    padding: 0;
    margin: 0 0 1.5rem;
    counter-reset: step;
  }

  .stepper-nav li {
    display: flex;
    align-items: center;
    flex: 1;
  }

  .stepper-nav li:not(:last-child)::after {
    content: '';
    flex: 1;
    height: 2px;
    background: var(--stepper-border);
    margin: 0 0.75rem;
  }

  .stepper-nav li.completed:not(:last-child)::after {
    background: var(--stepper-complete);
  }

  .step-marker {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    font-weight: 600;
    font-size: 0.875rem;
    background: var(--stepper-bg);
    border: 2px solid var(--stepper-inactive);
    color: var(--stepper-inactive);
    transition: all 0.2s ease;
    cursor: default;
  }

  .step-marker[data-interactive] {
    cursor: pointer;
  }

  .step-marker[data-interactive]:hover {
    border-color: var(--stepper-primary);
    color: var(--stepper-primary);
  }

  .step-marker:focus-visible {
    outline: 2px solid var(--stepper-focus);
    outline-offset: 2px;
  }

  li.current .step-marker {
    background: var(--stepper-primary);
    border-color: var(--stepper-primary);
    color: #fff;
  }

  li.completed .step-marker {
    background: var(--stepper-complete);
    border-color: var(--stepper-complete);
    color: #fff;
  }

  .step-label {
    display: none;
    margin-left: 0.5rem;
    font-size: 0.875rem;
    color: var(--stepper-inactive);
  }

  li.current .step-label {
    color: var(--stepper-primary);
    font-weight: 500;
  }

  li.completed .step-label {
    color: var(--stepper-complete);
  }

  @media (min-width: 640px) {
    .step-label {
      display: block;
    }
  }

  /* Progress bar mode */
  .progress-container {
    margin-bottom: 1.5rem;
  }

  .progress-text {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }

  .progress-bar {
    height: 0.5rem;
    background: var(--stepper-border);
    border-radius: 0.25rem;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--stepper-primary);
    transition: width 0.3s ease;
  }

  /* Step content */
  .step-content {
    min-height: 8rem;
  }

  .step-content:focus {
    outline: none;
  }

  /* Navigation buttons */
  .stepper-controls {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--stepper-border);
  }

  .stepper-btn {
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .stepper-btn:focus-visible {
    outline: 2px solid var(--stepper-focus);
    outline-offset: 2px;
  }

  .stepper-btn--prev {
    background: var(--stepper-bg);
    border: 1px solid var(--stepper-border);
    color: var(--stepper-inactive);
  }

  .stepper-btn--prev:hover:not(:disabled) {
    border-color: var(--stepper-primary);
    color: var(--stepper-primary);
  }

  .stepper-btn--next {
    background: var(--stepper-primary);
    border: 1px solid var(--stepper-primary);
    color: #fff;
    margin-left: auto;
  }

  .stepper-btn--next:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  .stepper-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/**
 * AccessibleStepper Web Component
 * A WCAG 2.2 AA compliant stepper/wizard component with full keyboard and screen reader support
 * @extends HTMLElement
 */
class AccessibleStepper extends HTMLElement {
  /**
   * List of attributes to observe for changes
   * @returns {string[]} Array of attribute names
   */
  static get observedAttributes() {
    return ['current', 'mode', 'allow-navigation'];
  }

  /**
   * Creates an instance of AccessibleStepper
   */
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    /** @type {number} Current step index (0-based) */
    this._current = 0;
    /** @type {'steps'|'progress'} Display mode */
    this._mode = 'steps';
    /** @type {boolean} Whether users can click completed steps to navigate back */
    this._allowNavigation = false;
    /** @type {HTMLElement|null} Live region for screen reader announcements */
    this._announcer = null;
  }

  /**
   * Called when the element is added to the DOM
   * Initializes the component and sets up event listeners
   */
  connectedCallback() {
    this.render();
    this._announcer = this._createAnnouncer();
    this._setupEventListeners();
    this._showStep(this._current);
  }

  disconnectedCallback() {
    this._removeEventListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case 'current':
        this._current = parseInt(newValue, 10) || 0;
        if (this.shadowRoot.querySelector('.stepper-nav')) {
          this._showStep(this._current);
        }
        break;
      case 'mode':
        this._mode = newValue === 'progress' ? 'progress' : 'steps';
        if (this.isConnected) this.render();
        break;
      case 'allow-navigation':
        this._allowNavigation = newValue !== null && newValue !== 'false';
        if (this.isConnected) this.render();
        break;
    }
  }

  get steps() {
    return Array.from(this.querySelectorAll('[data-step]'));
  }

  get totalSteps() {
    return this.steps.length;
  }

  get currentStep() {
    return this._current;
  }

  set currentStep(value) {
    const step = Math.max(0, Math.min(value, this.totalSteps - 1));
    if (step !== this._current) {
      const oldStep = this._current;
      this._current = step;
      this.setAttribute('current', String(step));
      this._showStep(step, oldStep);
    }
  }

  get progress() {
    return this.totalSteps > 1 ? Math.round((this._current / (this.totalSteps - 1)) * 100) : 100;
  }

  next() {
    if (this._current < this.totalSteps - 1) {
      this.currentStep = this._current + 1;
    }
  }

  previous() {
    if (this._current > 0) {
      this.currentStep = this._current - 1;
    }
  }

  goTo(index) {
    this.currentStep = index;
  }

  render() {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;

    const nav = this._mode === 'progress' ? this._renderProgressBar() : this._renderStepIndicator();

    const content = document.createElement('div');
    content.className = 'step-content';
    content.setAttribute('tabindex', '-1');
    content.innerHTML = '<slot></slot>';

    const controls = this._renderControls();

    this.shadowRoot.innerHTML = '';
    this.shadowRoot.append(styleSheet, nav, content, controls);
  }

  _renderStepIndicator() {
    const ol = document.createElement('ol');
    ol.className = 'stepper-nav';
    ol.setAttribute('role', 'list');
    ol.setAttribute('aria-label', 'Progress');

    this.steps.forEach((step, i) => {
      const label = step.dataset.label || `Step ${i + 1}`;
      const li = document.createElement('li');
      li.dataset.index = i;

      const marker = document.createElement('span');
      marker.className = 'step-marker';
      marker.textContent = i + 1;

      if (this._allowNavigation && i < this._current) {
        marker.setAttribute('tabindex', '0');
        marker.setAttribute('role', 'button');
        marker.setAttribute('data-interactive', '');
        marker.setAttribute('aria-label', `Go to ${label}, completed`);
      }

      const labelSpan = document.createElement('span');
      labelSpan.className = 'step-label';
      labelSpan.textContent = label;
      labelSpan.id = `step-label-${i}`;

      const status = document.createElement('span');
      status.className = 'visually-hidden';

      li.append(marker, labelSpan, status);
      ol.appendChild(li);
    });

    return ol;
  }

  _renderProgressBar() {
    const container = document.createElement('div');
    container.className = 'progress-container';

    const currentLabel = this.steps[this._current]?.dataset.label || `Step ${this._current + 1}`;

    container.innerHTML = `
      <div class="progress-text">
        <span>${currentLabel}</span>
        <span>Step ${this._current + 1} of ${this.totalSteps}</span>
      </div>
      <div class="progress-bar" role="progressbar" 
           aria-valuenow="${this.progress}" 
           aria-valuemin="0" 
           aria-valuemax="100"
           aria-valuetext="Step ${this._current + 1} of ${this.totalSteps}: ${currentLabel}">
        <div class="progress-fill" style="width: ${this.progress}%"></div>
      </div>
    `;

    return container;
  }

  _renderControls() {
    const controls = document.createElement('div');
    controls.className = 'stepper-controls';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'stepper-btn stepper-btn--prev';
    prevBtn.textContent = 'Previous';
    prevBtn.disabled = this._current === 0;

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'stepper-btn stepper-btn--next';
    nextBtn.textContent = this._current === this.totalSteps - 1 ? 'Complete' : 'Next';

    controls.append(prevBtn, nextBtn);
    return controls;
  }

  _createAnnouncer() {
    const announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'visually-hidden';
    this.shadowRoot.appendChild(announcer);
    return announcer;
  }

  _announce(message) {
    if (!this._announcer) return;
    this._announcer.textContent = '';
    requestAnimationFrame(() => {
      this._announcer.textContent = message;
    });
  }

  _showStep(index, previousIndex) {
    this.steps.forEach((step, i) => {
      step.hidden = i !== index;
      step.setAttribute('aria-hidden', String(i !== index));
    });

    const items = this.shadowRoot.querySelectorAll('.stepper-nav li');
    items.forEach((li, i) => {
      li.classList.toggle('completed', i < index);
      li.classList.toggle('current', i === index);

      const status = li.querySelector('.visually-hidden');
      if (status) {
        if (i < index) status.textContent = 'Completed: ';
        else if (i === index) status.textContent = 'Current: ';
        else status.textContent = 'Not completed: ';
      }

      const marker = li.querySelector('.step-marker');
      if (i === index) {
        marker.setAttribute('aria-current', 'step');
      } else {
        marker.removeAttribute('aria-current');
      }
    });

    if (this._mode === 'progress') {
      const progressBar = this.shadowRoot.querySelector('[role="progressbar"]');
      const progressFill = this.shadowRoot.querySelector('.progress-fill');
      const progressText = this.shadowRoot.querySelector('.progress-text');
      const label = this.steps[index]?.dataset.label || `Step ${index + 1}`;

      if (progressBar) {
        progressBar.setAttribute('aria-valuenow', this.progress);
        progressBar.setAttribute(
          'aria-valuetext',
          `Step ${index + 1} of ${this.totalSteps}: ${label}`
        );
      }
      if (progressFill) {
        progressFill.style.width = `${this.progress}%`;
      }
      if (progressText) {
        progressText.innerHTML = `
          <span>${label}</span>
          <span>Step ${index + 1} of ${this.totalSteps}</span>
        `;
      }
    }

    const prevBtn = this.shadowRoot.querySelector('.stepper-btn--prev');
    const nextBtn = this.shadowRoot.querySelector('.stepper-btn--next');
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.textContent = index === this.totalSteps - 1 ? 'Complete' : 'Next';

    const label = this.steps[index]?.dataset.label || `Step ${index + 1}`;
    this._announce(`Step ${index + 1} of ${this.totalSteps}: ${label}`);

    if (previousIndex !== undefined) {
      requestAnimationFrame(() => {
        const content = this.shadowRoot.querySelector('.step-content');
        const firstInput = this.steps[index]?.querySelector('input, select, textarea, button');
        if (firstInput) {
          firstInput.focus();
        } else if (content) {
          content.focus();
        }
      });
    }

    this.dispatchEvent(
      new CustomEvent('stepchange', {
        bubbles: true,
        composed: true,
        detail: {
          current: index,
          previous: previousIndex,
          total: this.totalSteps,
          label,
          progress: this.progress,
        },
      })
    );
  }

  /**
   * Sets up event listeners on the shadow DOM
   * Binds click and keydown handlers to the shadow root
   * @private
   */
  _setupEventListeners() {
    this._handleClick = this._handleClick.bind(this);
    this._handleKeydown = this._handleKeydown.bind(this);

    this.shadowRoot.addEventListener('click', this._handleClick);
    this.shadowRoot.addEventListener('keydown', this._handleKeydown);
  }

  /**
   * Removes event listeners from the shadow DOM
   * Called during component cleanup
   * @private
   */
  _removeEventListeners() {
    this.shadowRoot.removeEventListener('click', this._handleClick);
    this.shadowRoot.removeEventListener('keydown', this._handleKeydown);
  }

  /**
   * Handles click events on navigation buttons and step markers
   * @param {Event} e - The click event
   * @private
   */
  _handleClick(e) {
    const target = /** @type {HTMLElement} */ (e.target);
    if (!target) return;

    // Handle next/complete button click
    if (target.classList.contains('stepper-btn--next')) {
      if (this._current === this.totalSteps - 1) {
        this.dispatchEvent(
          new CustomEvent('complete', {
            bubbles: true,
            composed: true,
            detail: { current: this._current },
          })
        );
      } else {
        this.next();
      }
      return;
    }

    // Handle previous button click
    if (target.classList.contains('stepper-btn--prev')) {
      this.previous();
      return;
    }

    // Handle step marker click (when navigation is allowed)
    if (target.classList.contains('step-marker') && target.hasAttribute('data-interactive')) {
      const li = target.closest('li');
      if (li?.dataset.index) {
        const index = parseInt(li.dataset.index, 10);
        if (!Number.isNaN(index)) {
          this.goTo(index);
        }
      }
    }
  }

  /**
   * Handles keyboard events on interactive step markers
   * Enables Enter and Space key activation for step navigation
   * @param {Event} e - The keyboard event
   * @private
   */
  _handleKeydown(e) {
    const target = /** @type {HTMLElement} */ (e.target);
    const keyEvent = /** @type {KeyboardEvent} */ (e);
    if (!target) return;

    if (target.classList.contains('step-marker') && target.hasAttribute('data-interactive')) {
      if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
        keyEvent.preventDefault();
        target.click();
      }
    }
  }
}

// Register the custom element if not already registered
if (!customElements.get('accessible-stepper')) {
  customElements.define('accessible-stepper', AccessibleStepper);
}

export { AccessibleStepper };
export default AccessibleStepper;
