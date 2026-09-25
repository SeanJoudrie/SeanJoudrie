/* Launch Check prototype. No backend: every screen after "Narrow it down"
   shows the same labeled example for a student budgeting app. */
(function () {
  'use strict';

  // ---------- Example content ----------

  var EXAMPLE_SUMMARY =
    'Pocket Budget is an iPhone app that helps college students track spending against a monthly budget. ' +
    'People sign up with an email and password. They can link a bank account through Plaid to import transactions, or enter spending by hand. ' +
    'The app stores names, emails, transaction history and budget categories in a Supabase database. Logins are handled by Supabase Auth. ' +
    "I'm not sure whether the transaction data is encrypted. It uses Google Analytics. " +
    'There is a $2.99 a month premium tier for savings goals, paid through Stripe. ' +
    "It will launch on the App Store first. There's no privacy policy or terms yet, and no way to delete an account.";

  var EXAMPLE_ANSWERS = { product: 'ios', category: 'finance', detail: 'bank' };

  // Third question, only for categories with extra rules.
  var DETAILS = {
    finance: {
      label: 'What does it do with money?',
      hint: 'Pick the closest one. Apps that touch bank accounts or move money have the most to check.',
      options: [
        ['tracking', 'Tracks budgets or spending that people type in'],
        ['bank', 'Connects to bank accounts'],
        ['payments', 'Sends or moves money'],
        ['investing', 'Investing or crypto'],
        ['lending', 'Loans or credit']
      ]
    },
    health: {
      label: 'What kind of health data does it handle?',
      hint: 'Medical and mental health details carry extra privacy rules.',
      options: [
        ['fitness', 'Workouts or activity'],
        ['nutrition', 'Food and nutrition'],
        ['mental', 'Mood or mental health'],
        ['medical', 'Symptoms, conditions or medical records']
      ]
    },
    kids: {
      label: 'Who will use it?',
      hint: 'Apps made for children under 13 have their own store rules and privacy laws.',
      options: [
        ['children', 'Children under 13'],
        ['teens', 'Teenagers'],
        ['parents', 'Parents, about their kids']
      ]
    },
    social: {
      label: 'How do people interact?',
      hint: 'Apps where strangers can reach each other need a way to report and block.',
      options: [
        ['public', 'Public posts or comments'],
        ['private', 'Private messages'],
        ['dating', 'Dating or meeting people']
      ]
    },
    education: {
      label: 'Who is it for?',
      hint: 'Tools used in schools, or by children, have extra privacy rules.',
      options: [
        ['adults', 'Adults learning on their own'],
        ['students', 'Students, used through a school'],
        ['children', 'Children under 13']
      ]
    }
  };

  var CATEGORY_CHECKS = {
    finance: 'Extra rules for finance apps',
    health: 'Extra rules for health apps',
    kids: 'Extra rules for apps used by children',
    social: 'Extra rules for apps where people talk to each other',
    education: 'Extra rules for education apps'
  };

  var PRODUCT_NAMES = {
    ios: 'an iPhone or iPad app',
    android: 'an Android app',
    both: 'an app for iPhone and Android',
    web: 'a website or web app',
    extension: 'a browser extension'
  };

  var PRODUCT_CHECKS = {
    ios: 'App Store requirements',
    android: 'Google Play requirements',
    both: 'App Store and Google Play requirements',
    web: 'Requirements for public websites',
    extension: 'Extension store requirements'
  };

  var GAPS = [
    {
      level: 'blocker',
      title: 'No privacy policy',
      why: 'Apple rejects apps that collect personal data without one.'
    },
    {
      level: 'blocker',
      title: 'Bank data may not be protected',
      why: "The summary isn't sure transaction history, the app's most sensitive data, is encrypted."
    },
    {
      level: 'blocker',
      title: 'Premium is sold through Stripe',
      why: 'Apple generally requires its own in-app purchase for subscriptions inside iPhone apps.'
    },
    {
      level: 'blocker',
      title: 'No way to delete an account',
      why: 'Apple requires apps with sign-up to let people delete their account in the app.'
    },
    {
      level: 'before',
      title: 'No terms of service',
      why: "Terms set what users can expect and limit what you're responsible for."
    }
  ];

  var GAP_LEVELS = [
    ['blocker', 'Blocks release'],
    ['before', 'Fix before launch']
  ];

  var CHECKLIST = [
    {
      phase: 'Before you submit',
      tasks: [
        ['Make sure each user can only read their own data.', 'A database that any signed-in user can query is one of the most common gaps in apps built quickly.'],
        ['Encrypt stored bank and transaction data.', 'If it ever leaks, encrypted data is far less harmful to the students who trusted you with it.'],
        ['Write a privacy policy that lists everything you collect, including analytics.', 'Apple rejects apps without one, and it has to match what the app actually does.'],
        ['Write terms of service.', 'They set the rules for using the app and limit what you can be blamed for.'],
        ['Move the premium tier to Apple in-app purchase.', 'Selling it through Stripe inside the app is a common reason for rejection.'],
        ['Add a way to delete an account inside the app.', 'Apple requires it for any app with sign-up.'],
        ["Get approved for live bank connections by your bank-data provider.", 'Providers like Plaid usually review an app before it can connect real accounts.']
      ]
    },
    {
      phase: 'When you submit',
      tasks: [
        ["Fill in the App Store privacy details.", 'They appear on your listing, and they must match your privacy policy and the analytics you use.'],
        ['Add a support link to your listing.', 'Apple asks for one on every app, and it is where users will reach you.'],
        ['Give reviewers a test account with sample data.', "Reviewers can't see features behind a login without one, and will send the app back."]
      ]
    },
    {
      phase: 'After launch',
      tasks: [
        ['Update your privacy policy and privacy details whenever you add a feature that collects new data.', 'A mismatch can get later updates rejected.']
      ]
    }
  ];

  var PROMPT_FALLBACK_NOTE = 'Select the prompt text and copy it';

  // ---------- State ----------

  var state = {
    method: 'summary',
    usedExample: false,
    answers: { product: '', category: '', detail: '' },
    done: {}
  };

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var analyzeTimer = null;

  function $(sel) {
    return document.querySelector(sel);
  }

  function $all(sel) {
    return Array.prototype.slice.call(document.querySelectorAll(sel));
  }

  function icon(path) {
    return '<svg class="icon" viewBox="0 0 20 20" aria-hidden="true">' + path + '</svg>';
  }

  var CHECK_ICON = icon('<path d="M4.75 10.5l3.5 3.5 7-8" />');

  // ---------- Routing ----------

  var VIEWS = ['landing', 'describe', 'narrow', 'analyzing', 'results'];

  function currentView() {
    var name = (location.hash || '').replace(/^#\/?/, '');
    return VIEWS.indexOf(name) > -1 ? name : 'landing';
  }

  function go(name, replace) {
    var hash = name === 'landing' ? '#/' : '#/' + name;
    // replace() keeps the analyzing screen out of history, so Back from
    // results returns to the questions instead of re-running the check.
    if (replace) location.replace(hash);
    else location.hash = hash;
  }

  function render() {
    var name = currentView();
    clearTimeout(analyzeTimer);

    $all('.view').forEach(function (v) {
      v.hidden = v.getAttribute('data-view') !== name;
    });

    if (name === 'narrow') enterNarrow();
    if (name === 'analyzing') enterAnalyzing();
    if (name === 'results') enterResults();

    var titles = {
      landing: "Launch Check: what's left before your app can launch",
      describe: 'Describe your app · Launch Check',
      narrow: 'Narrow it down · Launch Check',
      analyzing: 'Checking your app · Launch Check',
      results: 'Example results · Launch Check'
    };
    document.title = titles[name];

    window.scrollTo(0, 0);
    // Move focus to the new screen's heading so keyboard and screen reader
    // users start at the top of what changed.
    var heading = document.querySelector('[data-view="' + name + '"] h1');
    if (heading && !firstRender) heading.focus({ preventScroll: true });
    firstRender = false;
  }

  var firstRender = true;
  window.addEventListener('hashchange', render);

  // ---------- Step 1: Describe ----------

  var describeForm = $('#describe-form');
  var summaryEl = $('#summary');
  var codeEl = $('#code');
  var consentEl = $('#code-consent');

  function setMethod(method) {
    state.method = method;
    $('#panel-summary').hidden = method !== 'summary';
    $('#panel-code').hidden = method !== 'code';
    $all('input[name="method"]').forEach(function (r) {
      r.checked = r.value === method;
    });
    clearError(summaryEl, '#summary-error');
    clearError(codeEl, '#code-error');
  }

  $all('input[name="method"]').forEach(function (r) {
    r.addEventListener('change', function () {
      setMethod(r.value);
    });
  });

  $('#switch-to-summary').addEventListener('click', function () {
    setMethod('summary');
    $('input[name="method"][value="summary"]').focus();
  });

  consentEl.addEventListener('change', function () {
    codeEl.disabled = !consentEl.checked;
    if (consentEl.checked) {
      clearError(codeEl, '#code-error');
      codeEl.focus();
    }
  });

  $('#use-example').addEventListener('click', function () {
    summaryEl.value = EXAMPLE_SUMMARY;
    state.usedExample = true;
    clearError(summaryEl, '#summary-error');
    summaryEl.focus();
  });

  summaryEl.addEventListener('input', function () {
    if (summaryEl.value !== EXAMPLE_SUMMARY) state.usedExample = false;
    if (summaryEl.value.trim()) clearError(summaryEl, '#summary-error');
  });

  codeEl.addEventListener('input', function () {
    if (codeEl.value.trim()) clearError(codeEl, '#code-error');
  });

  // Copy button
  var copyBtn = $('#copy-prompt');
  var copyLabel = copyBtn.querySelector('[data-copy-label]');
  var copyReset = null;

  function copyWithCommand(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (e) {}
    document.body.removeChild(ta);
    copyBtn.focus();
    return ok;
  }

  // Clipboard API first; opening the file straight from disk can block it,
  // so fall back to the older copy command.
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () {
        if (!copyWithCommand(text)) throw new Error('copy failed');
      });
    }
    return copyWithCommand(text) ? Promise.resolve() : Promise.reject();
  }

  copyBtn.addEventListener('click', function () {
    var text = $('#prompt-text').textContent;
    copyText(text).then(
      function () {
        copyLabel.textContent = 'Copied';
        $('#copy-status').textContent = 'Prompt copied. Paste it into your AI chat.';
      },
      function () {
        // Fall back to selecting the text so the person can copy it themselves.
        var range = document.createRange();
        range.selectNodeContents($('#prompt-text'));
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        copyLabel.textContent = 'Copy prompt';
        $('#copy-status').textContent = PROMPT_FALLBACK_NOTE + ' with your keyboard.';
      }
    );
    clearTimeout(copyReset);
    copyReset = setTimeout(function () {
      copyLabel.textContent = 'Copy prompt';
    }, 3000);
  });

  function showError(field, errorSel, message) {
    var err = $(errorSel);
    err.textContent = message;
    err.hidden = false;
    field.setAttribute('aria-invalid', 'true');
  }

  function clearError(field, errorSel) {
    var err = $(errorSel);
    err.textContent = '';
    err.hidden = true;
    field.removeAttribute('aria-invalid');
  }

  describeForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (state.method === 'summary') {
      if (!summaryEl.value.trim()) {
        showError(summaryEl, '#summary-error', 'Paste the summary your AI wrote, or use the example summary.');
        summaryEl.focus();
        return;
      }
    } else {
      if (!consentEl.checked) {
        showError(codeEl, '#code-error', 'Tick the box above to confirm you understand, or use a summary instead.');
        consentEl.focus();
        return;
      }
      if (!codeEl.value.trim()) {
        showError(codeEl, '#code-error', 'Paste your code, or use a summary instead.');
        codeEl.focus();
        return;
      }
    }
    go('narrow');
  });

  // ---------- Step 2: Narrow ----------

  var productEl = $('#product');
  var categoryEl = $('#category');
  var detailEl = $('#detail');
  var detailField = $('#detail-field');

  function fillDetail(category, selected) {
    var d = DETAILS[category];
    if (!d) {
      detailField.hidden = true;
      detailEl.innerHTML = '';
      state.answers.detail = '';
      return;
    }
    $('#detail-label').textContent = d.label;
    $('#detail-hint').textContent = d.hint;
    var html = '<option value="">Choose one</option>';
    d.options.forEach(function (o) {
      html += '<option value="' + o[0] + '"' + (o[0] === selected ? ' selected' : '') + '>' + o[1] + '</option>';
    });
    detailEl.innerHTML = html;
    detailField.hidden = false;
    clearError(detailEl, '#detail-error');
  }

  function enterNarrow() {
    var prefill = state.usedExample && state.method === 'summary';
    if (prefill && !state.answers.product && !state.answers.category) {
      state.answers = {
        product: EXAMPLE_ANSWERS.product,
        category: EXAMPLE_ANSWERS.category,
        detail: EXAMPLE_ANSWERS.detail
      };
    }
    $('#prefill-note').hidden = !(prefill && state.answers.category === EXAMPLE_ANSWERS.category);
    productEl.value = state.answers.product;
    categoryEl.value = state.answers.category;
    fillDetail(state.answers.category, state.answers.detail);
  }

  productEl.addEventListener('change', function () {
    state.answers.product = productEl.value;
    if (productEl.value) clearError(productEl, '#product-error');
  });

  categoryEl.addEventListener('change', function () {
    state.answers.category = categoryEl.value;
    state.answers.detail = '';
    if (categoryEl.value) clearError(categoryEl, '#category-error');
    fillDetail(categoryEl.value, '');
  });

  detailEl.addEventListener('change', function () {
    state.answers.detail = detailEl.value;
    if (detailEl.value) clearError(detailEl, '#detail-error');
  });

  $('#narrow-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var first = null;
    if (!productEl.value) {
      showError(productEl, '#product-error', 'Choose what you built.');
      first = first || productEl;
    }
    if (!categoryEl.value) {
      showError(categoryEl, '#category-error', 'Choose what your app is mainly about.');
      first = first || categoryEl;
    }
    if (!detailField.hidden && !detailEl.value) {
      showError(detailEl, '#detail-error', 'Choose the closest option.');
      first = first || detailEl;
    }
    if (first) {
      first.focus();
      return;
    }
    go('analyzing');
  });

  // ---------- Analyzing ----------

  function checksFor(answers) {
    var list = [PRODUCT_CHECKS[answers.product] || 'Store requirements', 'Privacy and the data you collect', 'Sign-up, login and accounts'];
    if (CATEGORY_CHECKS[answers.category]) list.push(CATEGORY_CHECKS[answers.category]);
    list.push('Payments and subscriptions');
    return list;
  }

  function enterAnalyzing() {
    var a = state.answers;
    // Arriving here without answers (for example from a bookmark) runs the example.
    if (!a.product || !a.category) a = EXAMPLE_ANSWERS;

    var catName = categoryEl.querySelector('option[value="' + a.category + '"]');
    $('#analyzing-lead').textContent =
      'Working out which extra steps apply to ' + PRODUCT_NAMES[a.product] + ' about ' +
      (catName ? catName.textContent.toLowerCase() : 'your topic') + '.';

    var checks = checksFor(a);
    var listEl = $('#checking-list');
    listEl.innerHTML = checks
      .map(function (c) {
        return '<li data-state="pending"><span class="pending-dot" aria-hidden="true"></span><span>' + c + '</span><span class="state">Waiting</span></li>';
      })
      .join('');

    var items = $all('#checking-list li');
    var status = $('#checking-status');
    var i = 0;
    // About half a second per check: long enough to read, short enough not to feel staged.
    var step = 500;

    function mark(li, s) {
      li.setAttribute('data-state', s);
      var marker = li.firstElementChild;
      var label = li.lastElementChild;
      if (s === 'active') {
        marker.outerHTML = '<span class="spinner" aria-hidden="true"></span>';
        label.textContent = 'Checking';
      } else if (s === 'done') {
        marker.outerHTML = CHECK_ICON;
        label.textContent = 'Done';
      }
    }

    function next() {
      if (i > 0) mark(items[i - 1], 'done');
      if (i >= items.length) {
        status.textContent = 'All checks done. Showing results.';
        analyzeTimer = setTimeout(function () {
          go('results', true);
        }, reduceMotion ? 0 : 300);
        return;
      }
      mark(items[i], 'active');
      status.textContent = 'Checking ' + (i + 1) + ' of ' + items.length + ': ' + checks[i];
      i++;
      analyzeTimer = setTimeout(next, step);
    }
    next();
  }

  // ---------- Results ----------

  var resultsBuilt = false;

  function enterResults() {
    if (resultsBuilt) return updateCount();
    resultsBuilt = true;

    $('#gaps').innerHTML = GAP_LEVELS.map(function (lvl) {
      var items = GAPS.filter(function (g) {
        return g.level === lvl[0];
      });
      return (
        '<section class="gap-group" data-level="' + lvl[0] + '" aria-label="' + lvl[1] + '">' +
        '<h2 class="gap-group__label">' + lvl[1] + ' <span class="muted">' + items.length + '</span></h2>' +
        '<ol class="gaps">' +
        items
          .map(function (g) {
            return '<li class="gap"><h3>' + g.title + '</h3><p>' + g.why + '</p></li>';
          })
          .join('') +
        '</ol></section>'
      );
    }).join('');

    var n = 0;
    $('#checklist').innerHTML = CHECKLIST.map(function (phase) {
      return (
        '<section class="phase"><h3>' + phase.phase + '</h3><ol class="tasks">' +
        phase.tasks
          .map(function (t) {
            n++;
            var id = 'task-' + n;
            return (
              '<li><label class="task" for="' + id + '">' +
              '<input type="checkbox" id="' + id + '" data-task="' + n + '" />' +
              '<span class="task__num" aria-hidden="true">' + n + '.</span>' +
              '<span><span class="task__what">' + t[0] + '</span>' +
              '<span class="task__why">' + t[1] + '</span></span>' +
              '</label></li>'
            );
          })
          .join('') +
        '</ol></section>'
      );
    }).join('');

    $all('#checklist input[type="checkbox"]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        state.done[cb.getAttribute('data-task')] = cb.checked;
        updateCount();
      });
    });
    updateCount();
  }

  function updateCount() {
    var boxes = $all('#checklist input[type="checkbox"]');
    var done = boxes.filter(function (b) {
      return b.checked;
    }).length;
    $('#checklist-count').textContent = done + ' of ' + boxes.length + ' done';
  }

  $('#print').addEventListener('click', function () {
    window.print();
  });

  $('#start-over').addEventListener('click', function () {
    state.usedExample = false;
    state.answers = { product: '', category: '', detail: '' };
    summaryEl.value = '';
    codeEl.value = '';
    consentEl.checked = false;
    codeEl.disabled = true;
    setMethod('summary');
    $all('#checklist input[type="checkbox"]').forEach(function (b) {
      b.checked = false;
    });
  });

  // ---------- Theme ----------

  var themeEl = $('#theme');
  try {
    themeEl.value = localStorage.getItem('lc-theme') || 'system';
  } catch (e) {}

  themeEl.addEventListener('change', function () {
    var v = themeEl.value;
    if (v === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', v);
    try {
      localStorage.setItem('lc-theme', v);
    } catch (e) {}
  });

  // ---------- Start ----------
  setMethod('summary');
  render();
})();
