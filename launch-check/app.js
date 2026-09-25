/* Launch Check prototype. No backend: the checklist is built in the browser
   from the answers, using the sourced rules in data.js. Nothing is sent. */
(function () {
  'use strict';

  var DATA = window.LC_DATA;

  // ---------- Example content ----------

  var EXAMPLE_SUMMARY =
    'Stillwater is a meditation app for iPhone for people who want a calm 10-minute routine. ' +
    'People sign up with email and password to save their streaks and favorite sessions. ' +
    'It stores names, emails, session history and mood check-ins in a Supabase database. ' +
    "I'm not sure whether row level security is on. The audio files are in the app. " +
    'It uses Google Analytics. There is a $4.99 a month subscription through Stripe that unlocks all sessions. ' +
    'An AI coach writes a short reflection from the mood check-in using the OpenAI API. ' +
    "Users can't see each other's posts. The code is on GitHub. " +
    "I don't have an Apple developer account, a website, a privacy policy or terms yet.";

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
        ['mindfulness', 'Meditation, sleep or relaxation'],
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

  var QUESTIONS = [
    {
      id: 'accounts',
      label: 'Do people sign up or log in?',
      options: [['yes', 'Yes'], ['no', 'No'], ['unsure', 'Not sure']]
    },
    {
      id: 'money',
      label: 'Does it charge money?',
      options: [
        ['none', 'No, it’s free'],
        ['digital', 'Yes, subscriptions or purchases that unlock things in the app'],
        ['physical', 'Yes, for physical products or real-world services'],
        ['unsure', 'Not sure']
      ]
    },
    {
      id: 'data',
      label: 'Where does it keep people’s data?',
      options: [
        ['device', 'Only on their phone or in their browser'],
        ['supabase', 'Supabase'],
        ['firebase', 'Firebase'],
        ['other', 'Another service or its own server'],
        ['unsure', 'Not sure']
      ]
    },
    {
      id: 'tracking',
      label: 'Does it use analytics or show ads?',
      options: [['yes', 'Yes'], ['no', 'No'], ['unsure', 'Not sure']]
    },
    {
      id: 'ai',
      label: 'Does it send what people type or upload to an AI service?',
      hint: 'For example ChatGPT, Claude or Gemini working behind the scenes.',
      options: [['yes', 'Yes'], ['no', 'No'], ['unsure', 'Not sure']]
    },
    {
      id: 'ugc',
      label: 'Can people see things other users post or send?',
      options: [['yes', 'Yes'], ['no', 'No']]
    }
  ];

  var HAVES = [
    { id: 'apple', label: 'An Apple Developer Program membership', when: function (f) { return f.ios; } },
    { id: 'google', label: 'A Google Play developer account', when: function (f) { return f.android; } },
    { id: 'website', label: 'A website on your own domain', when: function () { return true; } },
    { id: 'privacy', label: 'A privacy policy', when: function () { return true; } },
    { id: 'terms', label: 'Terms of service', when: function () { return true; } },
    { id: 'support', label: 'A support email address', when: function () { return true; } }
  ];

  var PRODUCT_NAMES = {
    ios: 'an iPhone or iPad app',
    android: 'an Android app',
    both: 'an app for iPhone and Android',
    web: 'a website or web app',
    extension: 'a browser extension'
  };

  // ---------- State ----------

  function freshAnswers() {
    return {
      product: '', category: '', detail: '',
      accounts: '', money: '', data: '', tracking: '', ai: '', ugc: '',
      have: {}
    };
  }

  var state = {
    method: 'summary',
    guessedFrom: '',
    answers: freshAnswers(),
    guessed: {},
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

  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function icon(path) {
    return '<svg class="icon" viewBox="0 0 20 20" aria-hidden="true">' + path + '</svg>';
  }

  var CHECK_ICON = icon('<path d="M4.75 10.5l3.5 3.5 7-8" />');
  var CHEVRON = icon('<path d="M5.25 8.25L10 13l4.75-4.75" />');
  var ARROW = icon('<path d="M8.25 5.25L13 10l-4.75 4.75" />');
  var EXTERNAL = icon('<path d="M8.75 4.75h-4v10.5h10.5v-4M11.25 4.75h4v4M15 5l-6 6" />');

  // ---------- Guessing answers from the description ----------
  // A plain keyword guess, shown to the person as a guess to check. It is
  // not analysis, and every guessed answer stays editable.

  function has(text, words) {
    return words.some(function (w) {
      return new RegExp('\\b' + w + '\\b', 'i').test(text);
    });
  }

  function guess(text) {
    var g = {};
    var t = text || '';
    var no = /\b(no|not|don't|doesn't|can't|cannot|without|haven't)\b/i;

    var ios = has(t, ['iphone', 'ipad', 'ios', 'app store', 'swiftui', 'xcode']);
    var android = has(t, ['android', 'google play', 'play store', 'kotlin']);
    if (ios && android) g.product = 'both';
    else if (ios) g.product = 'ios';
    else if (android) g.product = 'android';
    else if (has(t, ['react native', 'expo', 'flutter'])) g.product = 'both';
    else if (has(t, ['website', 'web app', 'next\\.js', 'nextjs', 'browser'])) g.product = 'web';

    if (has(t, ['meditat\\w*', 'mindful\\w*', 'sleep', 'fitness', 'workout\\w*', 'health', 'therapy', 'mood', 'nutrition', 'calorie\\w*', 'symptom\\w*'])) {
      g.category = 'health';
      if (has(t, ['meditat\\w*', 'mindful\\w*', 'sleep', 'relax\\w*', 'breath\\w*'])) g.detail = 'mindfulness';
      else if (has(t, ['symptom\\w*', 'medical', 'diagnos\\w*', 'medication\\w*'])) g.detail = 'medical';
      else if (has(t, ['therapy', 'anxiety', 'depression'])) g.detail = 'mental';
      else if (has(t, ['nutrition', 'calorie\\w*', 'diet', 'food'])) g.detail = 'nutrition';
      else if (has(t, ['fitness', 'workout\\w*', 'exercise'])) g.detail = 'fitness';
    } else if (has(t, ['budget\\w*', 'finance', 'bank\\w*', 'invest\\w*', 'crypto', 'loan\\w*', 'expense\\w*'])) {
      g.category = 'finance';
      if (has(t, ['plaid', 'bank accounts?'])) g.detail = 'bank';
      else if (has(t, ['invest\\w*', 'crypto', 'stock\\w*'])) g.detail = 'investing';
      else g.detail = 'tracking';
    } else if (has(t, ['kids', 'children', 'child'])) {
      g.category = 'kids';
    } else if (has(t, ['game', 'puzzle'])) {
      g.category = 'games';
    }

    if (has(t, ['sign up', 'sign in', 'log in', 'login', 'accounts?', 'passwords?'])) g.accounts = 'yes';

    if (has(t, ['subscriptions?', 'premium', 'in-app purchases?', 'unlocks?', 'paywall'])) g.money = 'digital';
    else if (has(t, ['shop', 'orders?', 'delivery', 'bookings?'])) g.money = 'physical';
    else if (/\b(it's free|is free|no payments|doesn't charge)\b/i.test(t)) g.money = 'none';

    if (has(t, ['supabase'])) g.data = 'supabase';
    else if (has(t, ['firebase', 'firestore'])) g.data = 'firebase';
    else if (has(t, ['localstorage', 'on the device', 'on device', 'stays on the phone'])) g.data = 'device';
    else if (has(t, ['database', 'server', 'backend', 'mongodb', 'postgres\\w*'])) g.data = 'other';

    if (has(t, ['analytics', 'ads', 'admob', 'mixpanel', 'posthog', 'amplitude'])) g.tracking = 'yes';
    if (has(t, ['openai', 'gpt', 'chatgpt', 'claude', 'anthropic', 'gemini', 'ai'])) g.ai = 'yes';

    // "Users can't see each other's posts" should not read as yes.
    var ugcSentence = (t.match(/[^.]*\b(post\w*|comment\w*|chat|messag\w*)\b[^.]*/i) || [''])[0];
    if (ugcSentence) g.ugc = no.test(ugcSentence) ? 'no' : 'yes';

    // "What's already set up": only mark things the text says exist, never
    // anything it says is missing.
    g.have = {};
    [
      ['apple', /apple developer (account|program|membership)/i],
      ['google', /(google play|play console) (developer )?account/i],
      ['website', /\b(website|domain)\b/i],
      ['privacy', /privacy policy/i],
      ['terms', /\bterms\b/i],
      ['support', /support (email|address)/i]
    ].forEach(function (pair) {
      var m = t.match(new RegExp('[^.]*' + pair[1].source + '[^.]*', 'i'));
      if (m && !no.test(m[0])) g.have[pair[0]] = true;
    });
    return g;
  }

  function applyGuess(text) {
    if (state.guessedFrom === text) return;
    var g = guess(text);
    var a = freshAnswers();
    Object.keys(g).forEach(function (k) {
      a[k] = g[k];
    });
    state.answers = a;
    state.guessed = g;
    state.guessedFrom = text;
    state.done = {};
  }

  // ---------- Routing ----------

  var VIEWS = ['landing', 'describe', 'narrow', 'details', 'analyzing', 'results'];
  var firstRender = true;

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

  function answered(a) {
    return a.product && a.category && QUESTIONS.every(function (q) {
      return a[q.id];
    });
  }

  function render() {
    var name = currentView();
    clearTimeout(analyzeTimer);

    // Later screens need earlier answers; send people back to fill them in.
    if (['narrow', 'details', 'analyzing', 'results'].indexOf(name) > -1 && !describedText()) {
      go('describe', true);
      return;
    }
    if (name === 'details' && !(state.answers.product && state.answers.category)) {
      go('narrow', true);
      return;
    }
    if ((name === 'analyzing' || name === 'results') && !answered(state.answers)) {
      go('details', true);
      return;
    }

    $all('.view').forEach(function (v) {
      v.hidden = v.getAttribute('data-view') !== name;
    });

    if (name === 'narrow') enterNarrow();
    if (name === 'details') enterDetails();
    if (name === 'analyzing') enterAnalyzing();
    if (name === 'results') enterResults();

    var titles = {
      landing: "Launch Check: what's left before your app can launch",
      describe: 'Describe your app · Launch Check',
      narrow: 'Narrow it down · Launch Check',
      details: 'A few quick questions · Launch Check',
      analyzing: 'Checking your app · Launch Check',
      results: 'Your launch plan · Launch Check'
    };
    document.title = titles[name];

    window.scrollTo(0, 0);
    // Move focus to the new screen's heading so keyboard and screen reader
    // users start at the top of what changed.
    var heading = document.querySelector('[data-view="' + name + '"] h1');
    if (heading && !firstRender) heading.focus({ preventScroll: true });
    firstRender = false;
  }

  window.addEventListener('hashchange', render);

  // ---------- Step 1: Describe ----------

  var describeForm = $('#describe-form');
  var summaryEl = $('#summary');
  var codeEl = $('#code');
  var consentEl = $('#code-consent');

  function describedText() {
    return state.method === 'summary' ? summaryEl.value.trim() : consentEl.checked ? codeEl.value.trim() : '';
  }

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
    clearError(summaryEl, '#summary-error');
    summaryEl.focus();
  });

  summaryEl.addEventListener('input', function () {
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
        // Select the text so the person can copy it themselves.
        var range = document.createRange();
        range.selectNodeContents($('#prompt-text'));
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        copyLabel.textContent = 'Copy prompt';
        $('#copy-status').textContent = 'Select the prompt text and copy it with your keyboard.';
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
    if (field) field.setAttribute('aria-invalid', 'true');
  }

  function clearError(field, errorSel) {
    var err = $(errorSel);
    if (!err) return;
    err.textContent = '';
    err.hidden = true;
    if (field) field.removeAttribute('aria-invalid');
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
    applyGuess(describedText());
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
    var g = state.guessed;
    $('#prefill-note').hidden = !(g.product || g.category);
    $('#prefill-note').textContent = 'We guessed these from your description. Change anything that’s wrong.';
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
    go('details');
  });

  // ---------- Step 3: Details ----------

  function flags(a) {
    return {
      ios: a.product === 'ios' || a.product === 'both',
      android: a.product === 'android' || a.product === 'both',
      web: a.product === 'web',
      extension: a.product === 'extension'
    };
  }

  function enterDetails() {
    var a = state.answers;
    var f = flags(a);
    var anyGuess = QUESTIONS.some(function (q) {
      return state.guessed[q.id];
    });
    $('#guess-note').hidden = !anyGuess;

    $('#questions').innerHTML = QUESTIONS.map(function (q) {
      var name = 'q-' + q.id;
      return (
        '<fieldset class="field question" id="field-' + q.id + '">' +
        '<legend class="field-label">' + q.label + '</legend>' +
        (q.hint ? '<p class="hint hint--above">' + q.hint + '</p>' : '') +
        '<div class="options">' +
        q.options
          .map(function (o) {
            return (
              '<label class="option"><input type="radio" name="' + name + '" value="' + o[0] + '"' +
              (a[q.id] === o[0] ? ' checked' : '') + ' aria-describedby="' + q.id + '-error" /><span>' + o[1] + '</span></label>'
            );
          })
          .join('') +
        '</div>' +
        '<p class="error" id="' + q.id + '-error" hidden></p>' +
        '</fieldset>'
      );
    }).join('');

    $('#have-list').innerHTML = HAVES.filter(function (h) {
      return h.when(f);
    })
      .map(function (h) {
        return (
          '<label class="check check--row"><input type="checkbox" name="have" value="' + h.id + '"' +
          (a.have[h.id] ? ' checked' : '') + ' /><span>' + h.label + '</span></label>'
        );
      })
      .join('');

    $all('#questions input[type="radio"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var id = r.name.replace('q-', '');
        state.answers[id] = r.value;
        $('#field-' + id).removeAttribute('data-invalid');
        clearError(null, '#' + id + '-error');
      });
    });
    $all('#have-list input').forEach(function (c) {
      c.addEventListener('change', function () {
        state.answers.have[c.value] = c.checked;
      });
    });
  }

  $('#details-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var first = null;
    QUESTIONS.forEach(function (q) {
      if (!state.answers[q.id]) {
        $('#field-' + q.id).setAttribute('data-invalid', 'true');
        showError(null, '#' + q.id + '-error', 'Choose an answer. “Not sure” is fine.');
        first = first || $('#field-' + q.id + ' input');
      }
    });
    if (first) {
      first.focus();
      return;
    }
    go('analyzing');
  });

  // ---------- Building the plan ----------

  function context() {
    var a = state.answers;
    var f = flags(a);
    return {
      a: a,
      ios: f.ios,
      android: f.android,
      web: f.web,
      extension: f.extension,
      store: f.ios || f.android,
      accounts: a.accounts !== 'no',
      digital: a.money === 'digital' || a.money === 'unsure',
      physical: a.money === 'physical',
      cloud: a.data !== 'device',
      tracking: a.tracking !== 'no',
      ai: a.ai !== 'no',
      ugc: a.ugc === 'yes',
      health: a.category === 'health',
      medical: a.detail === 'medical' || a.detail === 'mental',
      kids: a.category === 'kids' || a.detail === 'children',
      finance: a.category === 'finance',
      moneyMoving: ['bank', 'payments', 'investing', 'lending'].indexOf(a.detail) > -1,
      have: a.have
    };
  }

  function buildPlan() {
    var c = context();
    var items = DATA.items.filter(function (it) {
      return it.when(c);
    });
    items.forEach(function (it) {
      it.severity = typeof it.sev === 'function' ? it.sev(c) : it.sev;
      it._done = !!(it.have && c.have[it.have]);
    });
    var gaps = items
      .filter(function (it) {
        return it.gap && !it._done && it.severity === 'blocker';
      })
      .sort(function (x, y) {
        return (x.gap.rank || 99) - (y.gap.rank || 99);
      });
    return { items: items, gaps: gaps, context: c };
  }

  // ---------- Analyzing ----------

  function checksFor(c) {
    var list = [];
    if (c.ios) list.push('App Store requirements');
    if (c.android) list.push('Google Play requirements');
    if (c.web || c.extension) list.push('What every public site needs');
    if (c.cloud) list.push('Where your data lives and who can read it');
    list.push('Privacy policy and terms');
    if (c.accounts) list.push('Sign-up, login and account deletion');
    if (c.a.money !== 'none') list.push('Payments and subscriptions');
    if (c.ai) list.push('Sending data to AI services');
    if (c.health) list.push('Extra rules for health and wellness apps');
    if (c.finance) list.push('Extra rules for finance apps');
    if (c.kids) list.push('Extra rules for apps used by children');
    return list;
  }

  function enterAnalyzing() {
    var c = context();
    var catName = categoryEl.querySelector('option[value="' + c.a.category + '"]');
    $('#analyzing-lead').textContent =
      'Working out which steps apply to ' + PRODUCT_NAMES[c.a.product] + ' about ' +
      (catName ? catName.textContent.toLowerCase() : 'your topic') + '.';

    var checks = checksFor(c);
    var listEl = $('#checking-list');
    listEl.innerHTML = checks
      .map(function (label) {
        return '<li data-state="pending"><span class="pending-dot" aria-hidden="true"></span><span>' + label + '</span><span class="state">Waiting</span></li>';
      })
      .join('');

    var items = $all('#checking-list li');
    var status = $('#checking-status');
    var i = 0;
    // The rules run instantly; the short pause per line is only so people can
    // read what was checked. The whole run stays around two seconds.
    var step = Math.min(350, Math.round(2000 / checks.length));

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
        status.textContent = 'All checks done. Showing your plan.';
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

  var GAP_LIMIT = 5;

  function enterResults() {
    var plan = buildPlan();
    var c = plan.context;
    var catName = categoryEl.querySelector('option[value="' + c.a.category + '"]');

    $('#basis').innerHTML =
      'Based on your answers, not your code. <a href="#/details">Edit answers</a>';
    $('#basis').title = 'For ' + PRODUCT_NAMES[c.a.product] + ' about ' + (catName ? catName.textContent.toLowerCase() : 'your topic');

    var n = plan.gaps.length;
    $('#results-title').textContent =
      n === 0 ? 'Nothing blocking launch that we can see' : n === 1 ? '1 thing to fix before launch' : n + ' things to fix before launch';

    var shown = plan.gaps.slice(0, GAP_LIMIT);
    $('#gaps').innerHTML = shown.length
      ? '<ol class="gaps">' +
        shown
          .map(function (g) {
            return (
              '<li><a class="gap" href="#step-' + g.id + '" data-open="' + g.id + '">' +
              '<span class="gap__text"><span class="gap__title">' + esc(g.gap.title) + '</span>' +
              '<span class="gap__why">' + esc(g.gap.why) + '</span></span>' +
              '<span class="gap__go"><span class="gap__go-label">What to do</span>' + ARROW + '</span></a></li>'
            );
          })
          .join('') +
        '</ol>'
      : '<p class="lead">Your answers don’t show anything that would stop a release. Work through the checklist anyway: it covers what reviewers look at.</p>';

    var more = plan.gaps.length - shown.length;
    $('#gaps-more').hidden = more <= 0;
    $('#gaps-more').textContent = more > 0 ? 'Plus ' + more + ' more marked “Blocks release” in your checklist below.' : '';

    $all('[data-checked-date]').forEach(function (el) {
      el.textContent = DATA.checked;
    });

    renderChecklist(plan);

    $all('[data-open]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        openStep(a.getAttribute('data-open'));
      });
    });
  }

  var LEVELS = { blocker: 'Blocks release', before: 'Before launch', recommended: 'Recommended', after: 'After launch' };

  function renderChecklist(plan) {
    var n = 0;
    var html = DATA.phases
      .map(function (phase) {
        var items = plan.items.filter(function (it) {
          return it.phase === phase.id;
        });
        if (!items.length) return '';
        return (
          '<section class="phase" aria-labelledby="phase-' + phase.id + '">' +
          '<h3 id="phase-' + phase.id + '">' + esc(phase.title) + '</h3>' +
          (phase.intro ? '<p class="phase__intro">' + esc(phase.intro) + '</p>' : '') +
          '<ol class="tasks">' +
          items
            .map(function (it) {
              n++;
              var cb = 'task-' + it.id;
              var checked = state.done[it.id] !== undefined ? state.done[it.id] : it._done;
              return (
                '<li class="task" id="step-' + it.id + '" data-severity="' + it.severity + '" tabindex="-1">' +
                '<input type="checkbox" id="' + cb + '" data-task="' + it.id + '"' + (checked ? ' checked' : '') + ' />' +
                '<span class="task__num" aria-hidden="true">' + n + '.</span>' +
                '<div class="task__body">' +
                '<label class="task__what" for="' + cb + '">' + esc(it.title) + '</label>' +
                '<p class="task__level">' + LEVELS[it.severity] + (it._done ? ' · You said this is done' : '') + '</p>' +
                '<p class="task__why">' + esc(it.why) + '</p>' +
                '<button type="button" class="task__toggle" aria-expanded="false" aria-controls="how-' + it.id + '">' +
                '<span>What to do</span>' + CHEVRON + '</button>' +
                '<div class="task__how" id="how-' + it.id + '" hidden>' +
                '<ol class="how">' +
                it.steps
                  .map(function (s) {
                    return '<li>' + s + '</li>';
                  })
                  .join('') +
                '</ol>' +
                '<p class="sources__label">Sources</p><ul class="sources">' +
                it.sources
                  .map(function (s) {
                    return (
                      '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.label) +
                      '<span class="sr-only"> (opens in a new tab)</span></a></li>'
                    );
                  })
                  .join('') +
                '</ul></div>' +
                '</div></li>'
              );
            })
            .join('') +
          '</ol></section>'
        );
      })
      .join('');
    $('#checklist').innerHTML = html;

    $all('#checklist input[type="checkbox"]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        state.done[cb.getAttribute('data-task')] = cb.checked;
        updateCount();
      });
    });
    $all('.task__toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setOpen(btn, btn.getAttribute('aria-expanded') !== 'true');
      });
    });
    updateCount();
  }

  function setOpen(btn, open) {
    btn.setAttribute('aria-expanded', String(open));
    btn.querySelector('span').textContent = open ? 'Hide steps' : 'What to do';
    document.getElementById(btn.getAttribute('aria-controls')).hidden = !open;
  }

  function openStep(id) {
    var li = document.getElementById('step-' + id);
    if (!li) return;
    var btn = li.querySelector('.task__toggle');
    setOpen(btn, true);
    li.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
    btn.focus({ preventScroll: true });
  }

  function updateCount() {
    var boxes = $all('#checklist input[type="checkbox"]');
    var done = boxes.filter(function (b) {
      return b.checked;
    }).length;
    $('#checklist-count').textContent = done + ' of ' + boxes.length + ' done';
  }

  $('#print').addEventListener('click', function () {
    // Print every step's details, not just the open ones.
    var closed = $all('.task__how[hidden]');
    closed.forEach(function (el) {
      el.hidden = false;
    });
    window.print();
    closed.forEach(function (el) {
      el.hidden = true;
    });
  });

  $('#start-over').addEventListener('click', function () {
    state.answers = freshAnswers();
    state.guessed = {};
    state.guessedFrom = '';
    state.done = {};
    summaryEl.value = '';
    codeEl.value = '';
    consentEl.checked = false;
    codeEl.disabled = true;
    setMethod('summary');
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
