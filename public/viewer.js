/* Proposal viewer — pricing option selection + signature modal */
(function () {
  'use strict';

  var state = {
    selectedOptionId: null,
    signaturePad: null,
    activeTab: 'draw',
  };

  var cfg = window.__PROPOSAL__ || {};

  // ── Pricing selection ─────────────────────────────────────
  window.selectOption = function (optionId) {
    state.selectedOptionId = optionId;

    // Update card visuals
    document.querySelectorAll('.option-card').forEach(function (card) {
      var isSelected = card.dataset.optionId === optionId;
      card.classList.toggle('selected', isSelected);

      // Check mark
      var existing = card.querySelector('.selected-check');
      if (isSelected && !existing) {
        var check = document.createElement('span');
        check.className = 'selected-check';
        check.textContent = '✓';
        card.appendChild(check);
      } else if (!isSelected && existing) {
        existing.remove();
      }
    });

    updateSignButton();
    updateModalSummary();
  };

  function updateSignButton() {
    var btn = document.getElementById('sign-btn');
    var hint = document.getElementById('sign-hint');
    if (!btn) return;

    var needsSelection = cfg.hasOptions && !state.selectedOptionId;
    btn.disabled = needsSelection;
    if (hint) hint.style.display = needsSelection ? 'block' : 'none';
  }

  function updateModalSummary() {
    var el = document.getElementById('modal-summary');
    if (!el) return;
    if (!state.selectedOptionId) { el.textContent = ''; return; }

    var card = document.querySelector('[data-option-id="' + state.selectedOptionId + '"]');
    if (!card) return;
    var name = card.querySelector('.option-name');
    var total = card.querySelector('.option-total');
    el.textContent = name && total
      ? 'You\u2019re signing for: ' + name.textContent + ' \u2014 ' + total.textContent
      : '';
  }

  // ── Modal ─────────────────────────────────────────────────
  window.openSignModal = function () {
    if (cfg.hasOptions && !state.selectedOptionId) return;
    document.getElementById('sign-modal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    updateModalSummary();
    initSignaturePad();
  };

  window.closeSignModal = function () {
    document.getElementById('sign-modal').style.display = 'none';
    document.body.style.overflow = '';
  };

  // Close on overlay click
  document.addEventListener('click', function (e) {
    if (e.target && e.target.id === 'sign-modal') closeSignModal();
  });

  // ── Tabs ──────────────────────────────────────────────────
  window.switchTab = function (tab) {
    state.activeTab = tab;
    document.getElementById('panel-draw').style.display = tab === 'draw' ? 'block' : 'none';
    document.getElementById('panel-type').style.display = tab === 'type' ? 'block' : 'none';
    document.getElementById('tab-draw').classList.toggle('active', tab === 'draw');
    document.getElementById('tab-type').classList.toggle('active', tab === 'type');
    if (tab === 'draw') initSignaturePad();
  };

  // ── Signature pad ─────────────────────────────────────────
  function initSignaturePad() {
    var canvas = document.getElementById('sig-canvas');
    if (!canvas || !window.SignaturePad) return;
    if (state.signaturePad) { state.signaturePad.clear(); return; }
    state.signaturePad = new SignaturePad(canvas, {
      backgroundColor: 'rgba(250,250,250,0)',
      penColor: '#0f0f0f',
    });
    resizeCanvas(canvas, state.signaturePad);
  }

  function resizeCanvas(canvas, pad) {
    var ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d').scale(ratio, ratio);
    if (pad) pad.clear();
  }

  window.clearSignature = function () {
    if (state.signaturePad) state.signaturePad.clear();
  };

  // Typed signature → canvas
  window.updateTypedSig = function () {
    var input = document.getElementById('typed-sig');
    var canvas = document.getElementById('sig-canvas-type');
    if (!input || !canvas) return;
    canvas.style.display = input.value ? 'block' : 'none';
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'italic 40px Georgia, serif';
    ctx.fillStyle = '#0f0f0f';
    ctx.textBaseline = 'middle';
    ctx.fillText(input.value, 24, canvas.height / 2);
  };

  function getSignatureData() {
    if (state.activeTab === 'draw') {
      if (!state.signaturePad || state.signaturePad.isEmpty()) return null;
      return {
        png: state.signaturePad.toDataURL('image/png'),
        svg: state.signaturePad.toDataURL('image/svg+xml'),
      };
    } else {
      var canvas = document.getElementById('sig-canvas-type');
      var input = document.getElementById('typed-sig');
      if (!input || !input.value.trim()) return null;
      return {
        png: canvas.toDataURL('image/png'),
        svg: canvas.toDataURL('image/svg+xml'),
      };
    }
  }

  // ── Submit ────────────────────────────────────────────────
  window.submitSignature = function () {
    var errorEl = document.getElementById('modal-error');
    var submitBtn = document.getElementById('submit-btn');
    errorEl.style.display = 'none';

    var sigData = getSignatureData();
    if (!sigData) {
      showError('Please provide your signature above.');
      return;
    }
    var typedName = (document.getElementById('typed-name').value || '').trim();
    if (!typedName) {
      showError('Please enter your full legal name.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting\u2026';

    fetch('/api/proposals/' + cfg.slug + '/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signature_png: sigData.png,
        signature_svg: sigData.svg,
        typed_name: typedName,
        selected_option_id: state.selectedOptionId || null,
        share_token: cfg.token,
      }),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.ok) {
          window.location.href = data.redirect || '/p/' + cfg.slug + '/signed';
        } else {
          showError(data.error || 'Something went wrong. Please try again.');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Signature';
        }
      })
      .catch(function () {
        showError('Network error. Please check your connection and try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Signature';
      });
  };

  function showError(msg) {
    var el = document.getElementById('modal-error');
    el.textContent = msg;
    el.style.display = 'block';
  }

  // ── Init ──────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    // Auto-select recommended
    if (cfg.recommendedId) {
      selectOption(cfg.recommendedId);
    }
    updateSignButton();
  });
})();
