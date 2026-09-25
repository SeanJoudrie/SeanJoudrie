/* Launch Check prototype. No backend: the checklist is built in the browser
   from the answers, using the sourced rules in data.js. Nothing is sent. */
(function () {
  'use strict';

  var DATA = window.LC_DATA;

  // ---------- Example content ----------

  // The sample app: a budgeting app for students, category Finance.
  var EXAMPLE_SUMMARY =
    'Pocket Budget is an iPhone app that helps college students track spending against a monthly budget. ' +
    'People sign up with an email and password. They can link a bank account through Plaid to import transactions, or type spending in by hand. ' +
    'It stores names, emails, transaction history and budget categories in a Supabase database. ' +
    "I'm not sure whether row level security is turned on. It uses Google Analytics. " +
    'There is a $2.99 a month premium tier for savings goals, paid through Stripe. ' +
    'It does not use AI. Users cannot see each other’s budgets and there are no posts or messages. ' +
    'It is for college students, not children. The code is on GitHub. ' +
    "I don't have an Apple developer account, a website, a privacy policy or terms yet.";

  // Answers the sample doesn't state outright, so the example opens straight to results.
  var EXAMPLE_FILL = { kids: 'no', accounts: 'yes', money: 'digital', data: 'supabase', tracking: 'analytics', ai: 'no', ugc: 'no' };

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
      id: 'host',
      label: 'Where does the site live right now?',
      when: function (f) { return f.web; },
      options: [
        ['lovable', 'Lovable'],
        ['bolt', 'Bolt'],
        ['replit', 'Replit'],
        ['vercel', 'Vercel or Netlify'],
        ['own', 'My own domain already'],
        ['none', 'Nowhere yet, or not sure']
      ]
    },
    {
      id: 'kids',
      label: 'Is it made for children under 13, or likely to be used by them?',
      hint: 'Children’s apps have their own privacy law and store rules, even for a simple game.',
      options: [['yes', 'Yes'], ['no', 'No, it’s for teens and adults'], ['unsure', 'Not sure']]
    },
    {
      id: 'accounts',
      label: 'Do people sign up or log in?',
      hint: 'Count it as yes if people type a name or email that gets saved online.',
      options: [['yes', 'Yes'], ['no', 'No'], ['unsure', 'Not sure']]
    },
    {
      id: 'money',
      label: 'Does it charge money?',
      options: [
        ['none', 'No, it’s free'],
        ['digital', 'Yes, subscriptions or purchases that unlock things'],
        ['physical', 'Yes, for physical products or real-world services'],
        ['later', 'Not now, maybe later'],
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
        ['other', 'Another service (like Replit’s database) or its own server'],
        ['unsure', 'Not sure']
      ]
    },
    {
      id: 'tracking',
      label: 'Does it use analytics or show ads?',
      options: [
        ['no', 'Neither'],
        ['analytics', 'Analytics only, like Google Analytics'],
        ['ads', 'Ads, now or planned'],
        ['unsure', 'Not sure']
      ]
    },
    {
      id: 'ai',
      label: 'Does it send what people type or upload to an AI service?',
      hint: 'For example ChatGPT, Claude or Gemini working behind the scenes.',
      options: [['yes', 'Yes'], ['no', 'No'], ['unsure', 'Not sure']]
    },
    {
      id: 'ugc',
      label: 'Can people see things other users post, upload or send?',
      hint: 'Posts, photos, comments, messages, reviews or public high scores.',
      options: [['yes', 'Yes'], ['no', 'No'], ['unsure', 'Not sure']]
    }
  ];

  var HAVES = [
    { id: 'apple', label: 'An Apple Developer account (the $99 a year membership you need to publish)', when: function (f) { return f.ios; } },
    { id: 'google', label: 'A Google Play developer account (the $25 one you need to publish)', when: function (f) { return f.android; } },
    { id: 'website', label: 'Your own web address, like stillwater.app (not a lovable.app or vercel.app one)', when: function () { return true; } },
    { id: 'privacy', label: 'A privacy policy', when: function () { return true; } },
    { id: 'terms', label: 'Terms of service', when: function () { return true; } },
    { id: 'support', label: 'A support email address', when: function () { return true; } }
  ];

  // Things that carry specific legal rules. Ticked on the questions screen.
  var DOES = [
    { id: 'emails', label: 'Sends marketing emails or a newsletter' },
    { id: 'texts', label: 'Sends text messages (SMS)' },
    { id: 'faces', label: 'Scans faces, fingerprints or voices (not just unlocking with Face ID)' },
    { id: 'pixel', label: 'Uses an ad-tracking pixel, like the Meta or TikTok pixel' },
    { id: 'aiclaims', label: 'Its marketing says what AI can do, like “AI-powered” or “AI lawyer”' }
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
      kids: '', accounts: '', money: '', data: '', tracking: '', ai: '', ugc: '', host: '',
      have: {},
      does: {}
    };
  }

  var state = {
    steps: {},
    projectId: '',
    focusStart: '',
    focusIndex: 0,
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

  // Sentence-level checks, so "No payments or subscriptions" doesn't read as
  // yes and "Android later" doesn't read as Android now.
  var NEG = /\b(no|not|don't|doesn't|isn't|aren't|can't|cannot|without|haven't|hasn't|never|none)\b|n't\b/i;
  var LATER = /\b(later|maybe|might|possibly|possible|someday|eventually|future|thinking of|would be|could be)\b/i;

  function sentences(t) {
    return t.split(/(?:[.!?]+\s+|\n+)/).map(function (x) {
      return x.trim();
    }).filter(Boolean);
  }

  function matcher(words) {
    return new RegExp('\\b(?:' + words.join('|') + ')\\b', 'i');
  }

  function find(list, words, test) {
    var re = matcher(words);
    for (var i = 0; i < list.length; i++) {
      if (re.test(list[i]) && test(list[i])) return list[i];
    }
    return '';
  }

  function affirmed(list, words) {
    return find(list, words, function (x) {
      return !NEG.test(x) && !LATER.test(x);
    });
  }

  function mentioned(list, words) {
    return find(list, words, function () {
      return true;
    });
  }

  function negated(list, words) {
    return find(list, words, function (x) {
      return NEG.test(x);
    });
  }

  function clip(x) {
    x = x.replace(/^[-*•\s]+/, '');
    return x.length > 110 ? x.slice(0, 107).trim() + '…' : x;
  }

  function guess(text) {
    var list = sentences(text || '');
    var g = { src: {}, have: {}, does: {} };
    function set(key, value, from) {
      g[key] = value;
      if (from) g.src[key] = clip(from);
    }

    var iosW = ['iphone', 'ipad', 'ios', 'app store', 'swiftui', 'xcode', 'testflight'];
    var androidW = ['android', 'google play', 'play store', 'kotlin'];
    var crossW = ['react native', 'expo', 'flutter', 'capacitor'];
    var webW = ['website', 'web app', 'web only', 'lovable\\.app', 'vercel\\.app', 'netlify\\.app', 'replit\\.app', 'bolt', 'next\\.js', 'nextjs', 'in the browser'];
    var ios = affirmed(list, iosW);
    var android = affirmed(list, androidW);
    if (ios && android) set('product', 'both', ios);
    else if (ios) set('product', 'ios', ios);
    else if (android) set('product', 'android', android);
    else if (affirmed(list, crossW)) set('product', 'both', affirmed(list, crossW));
    else if (mentioned(list, webW)) set('product', 'web', mentioned(list, webW));

    var catFrom;
    if ((catFrom = mentioned(list, ['meditat\\w*', 'mindful\\w*', 'sleep', 'fitness', 'workouts?', 'health', 'therapy', 'mood', 'nutrition', 'calories', 'symptoms?']))) {
      set('category', 'health', catFrom);
      if (mentioned(list, ['symptoms?', 'medical', 'diagnos\\w*', 'medications?'])) g.detail = 'medical';
      else if (mentioned(list, ['meditat\\w*', 'mindful\\w*', 'sleep', 'relax\\w*', 'breath\\w*'])) g.detail = 'mindfulness';
      else if (mentioned(list, ['therapy', 'anxiety', 'depression', 'mood'])) g.detail = 'mental';
      else if (mentioned(list, ['nutrition', 'calories', 'diet'])) g.detail = 'nutrition';
      else if (mentioned(list, ['fitness', 'workouts?', 'exercise'])) g.detail = 'fitness';
    } else if ((catFrom = mentioned(list, ['budget\\w*', 'finance', 'banks?', 'banking', 'invest\\w*', 'crypto', 'loans?', 'expenses?']))) {
      set('category', 'finance', catFrom);
      if (mentioned(list, ['plaid', 'bank accounts?'])) g.detail = 'bank';
      else if (mentioned(list, ['invest\\w*', 'crypto', 'stocks?'])) g.detail = 'investing';
      else g.detail = 'tracking';
    } else if ((catFrom = mentioned(list, ['recipes?', 'cooking', 'meals?', 'restaurants?', 'food']))) {
      set('category', 'food', catFrom);
    } else if ((catFrom = mentioned(list, ['games?', 'puzzles?', 'spelling']))) {
      set('category', 'games', catFrom);
    }

    var from;
    var kidsW = ['kids', 'children', 'child', 'toddlers?', '\\d+[- ]year[- ]olds?', 'ages? \\d+', 'under 13', 'my (?:son|daughter)', 'preschool\\w*', 'elementary'];
    if ((from = affirmed(list, kidsW))) set('kids', 'yes', from);
    else if ((from = mentioned(list, ['adults', 'grown-ups', '18\\+', 'teens and adults']))) set('kids', 'no', from);
    if (from && g.kids === 'yes' && !g.category) set('category', 'kids', from);

    if ((from = affirmed(list, ['sign up', 'signs up', 'sign in', 'log in', 'logs in', 'login', 'accounts?', 'passwords?', 'supabase auth', 'firebase auth']))) set('accounts', 'yes', from);
    else if ((from = negated(list, ['sign up', 'login', 'accounts?']))) set('accounts', 'no', from);

    var paidW = ['subscriptions?', 'premium', 'in-app purchases?', 'paywall', 'charges?', 'unlocks?', 'paid'];
    if ((from = affirmed(list, paidW))) set('money', 'digital', from);
    else if ((from = affirmed(list, ['shop', 'orders?', 'delivery', 'bookings?']))) set('money', 'physical', from);
    else if ((from = find(list, paidW, function (x) { return LATER.test(x) && !/\bno\b/i.test(x.split(/\b(later|maybe)\b/i)[0] || ''); }))) set('money', 'later', from);
    else if ((from = mentioned(list, ["it's free", 'is free', 'free app', 'no payments', "doesn't charge", 'no money']))) set('money', 'none', from);

    if (/\bsupabase\b/i.test(text)) set('data', 'supabase', mentioned(list, ['supabase']));
    else if (/\b(firebase|firestore)\b/i.test(text)) set('data', 'firebase', mentioned(list, ['firebase', 'firestore']));
    else if ((from = mentioned(list, ['localstorage', 'on the device', 'on device', 'stays on the phone']))) set('data', 'device', from);
    else if ((from = affirmed(list, ['database', 'server', 'backend', 'mongodb', 'postgres\\w*']))) set('data', 'other', from);

    var adsW = ['ads', 'adsense', 'admob', 'advertising', 'advertisements?'];
    var analyticsW = ['analytics', 'mixpanel', 'posthog', 'amplitude', 'segment'];
    if ((from = affirmed(list, adsW)) || (from = find(list, adsW, function (x) { return LATER.test(x); }))) set('tracking', 'ads', from);
    else if ((from = affirmed(list, analyticsW))) set('tracking', 'analytics', from);
    else if ((from = negated(list, analyticsW.concat(adsW)))) set('tracking', 'no', from);

    var aiW = ['openai', 'gpt', 'chatgpt', 'claude', 'anthropic', 'gemini', 'ai', 'llm'];
    if ((from = affirmed(list, aiW))) set('ai', 'yes', from);
    else if ((from = negated(list, aiW))) set('ai', 'no', from);

    var ugcW = ['posts?', 'posting', 'comments?', 'comment on', 'chat', 'messages?', 'messaging', 'reviews?', 'leaderboards?', 'high scores?'];
    if ((from = negated(list, ugcW))) set('ugc', 'no', from);
    else if ((from = affirmed(list, ugcW))) set('ugc', 'yes', from);

    // "I'm not sure whether analytics are on" → Not sure.
    var UNSURE = /\b(not sure|unsure|don't know|no idea|unclear|may be|might be)\b/i;
    [['data', ['stor\\w*', 'database', 'firebase', 'saved']], ['tracking', ['analytics', 'ads']], ['ai', ['ai', 'openai', 'gpt']], ['accounts', ['login', 'accounts?', 'sign up']]].forEach(function (pair) {
      var hit = find(list, pair[1], function (x) { return UNSURE.test(x); });
      if (hit && (!g[pair[0]] || g[pair[0]] === 'no' || pair[0] === 'data' && /\bmay be\b/i.test(hit))) set(pair[0], 'unsure', hit);
    });

    if ((from = mentioned(list, ['lovable']))) g.host = 'lovable';
    else if ((from = mentioned(list, ['bolt']))) g.host = 'bolt';
    else if ((from = mentioned(list, ['replit']))) g.host = 'replit';
    else if ((from = mentioned(list, ['vercel']))) g.host = 'vercel';
    else if ((from = mentioned(list, ['netlify']))) g.host = 'netlify';
    if (g.host) g.src.host = clip(from);

    // Legal-risk features, only when the text says the app does them.
    [
      ['emails', ['newsletters?', 'marketing emails?', 'email campaigns?', 'mailchimp', 'convertkit', 'klaviyo', 'promotional emails?']],
      ['texts', ['sms', 'text messages?', 'texts', 'twilio']],
      ['faces', ['face scan\\w*', 'facial', 'selfies?', 'biometric\\w*', 'fingerprints?', 'voiceprints?', 'face recognition']],
      ['pixel', ['meta pixel', 'facebook pixel', 'tiktok pixel', 'ads pixel', 'tracking pixel', 'conversions api']],
      ['aiclaims', ['ai-powered', 'powered by ai', 'ai lawyer', 'ai doctor', 'ai coach', 'ai therapist']]
    ].forEach(function (pair) {
      if (affirmed(list, pair[1])) g.does[pair[0]] = true;
    });

    // "What's already set up": only things the text says exist.
    [
      ['apple', ['apple developer (?:account|program|membership)']],
      ['google', ['(?:google play|play console) (?:developer )?account']],
      ['website', ['custom domain', 'own domain']],
      ['privacy', ['privacy policy']],
      ['terms', ['terms of service', 'terms of use', 'terms and conditions']],
      ['support', ['support (?:email|address)']]
    ].forEach(function (pair) {
      if (affirmed(list, pair[1])) g.have[pair[0]] = true;
    });
    return g;
  }

  function applyGuess(text) {
    if (state.guessedFrom === text) return;
    var g = guess(text);
    var a = freshAnswers();
    Object.keys(g).forEach(function (k) {
      if (k !== 'src') a[k] = g[k];
    });
    state.answers = a;
    state.guessed = g;
    state.guessedFrom = text;
    state.done = {};
  }

  // ---------- Routing ----------

  var VIEWS = ['landing', 'describe', 'narrow', 'details', 'analyzing', 'results', 'next', 'map', 'projects'];
  var firstRender = true;

  function currentView() {
    // Routes are bare tokens (#describe). Older #/describe links still work.
    var name = (location.hash || '').replace(/^#\/?/, '');
    return VIEWS.indexOf(name) > -1 ? name : 'landing';
  }

  function go(name, replace) {
    var hash = name === 'landing' ? '#start' : '#' + name;
    // replace() keeps the analyzing screen out of history, so Back from
    // results returns to the questions instead of re-running the check.
    if (replace) location.replace(hash);
    else location.hash = hash;
  }

  function activeQuestions(a) {
    var f = flags(a);
    return QUESTIONS.filter(function (q) {
      return !q.when || q.when(f);
    });
  }

  function answered(a) {
    return a.product && a.category && activeQuestions(a).every(function (q) {
      return a[q.id];
    });
  }

  function render() {
    if (location.hash === '#example') {
      loadExample();
      return;
    }
    var name = currentView();
    clearTimeout(analyzeTimer);
    document.body.classList.toggle('is-focus', name === 'next');

    // Later screens need earlier answers; send people back to fill them in.
    var hasDescription = describedText() || state.projectId;
    if (['narrow', 'details'].indexOf(name) > -1 && !hasDescription) {
      go('describe', true);
      return;
    }
    if (name === 'details' && !(state.answers.product && state.answers.category)) {
      go('narrow', true);
      return;
    }
    if (['analyzing', 'results', 'next', 'map'].indexOf(name) > -1 && !answered(state.answers)) {
      go(hasDescription ? 'details' : 'describe', true);
      return;
    }

    $all('.view').forEach(function (v) {
      v.hidden = v.getAttribute('data-view') !== name;
    });

    if (name === 'narrow') enterNarrow();
    if (name === 'details') enterDetails();
    if (name === 'analyzing') enterAnalyzing();
    if (name === 'results') enterResults();
    if (name === 'next') enterFocus();
    if (name === 'map') enterMap();
    if (name === 'projects') enterProjects();

    var titles = {
      landing: 'Launch Check',
      describe: 'Describe your app · Launch Check',
      narrow: 'Narrow it down · Launch Check',
      details: 'A few quick questions · Launch Check',
      analyzing: 'Checking your app · Launch Check',
      results: 'Your launch plan · Launch Check',
      next: 'Do this now · Launch Check',
      map: 'Map · Launch Check',
      projects: 'My projects · Launch Check'
    };
    document.title = titles[name];

    window.scrollTo(0, 0);
    // Move focus to the new screen's heading so keyboard and screen reader
    // users start at the top of what changed.
    var heading = document.querySelector('[data-view="' + name + '"] h1:not([hidden])');
    if (name === 'next') heading = focusHeading();
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
    clearError(consentEl, '#code-error');
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
    $('#code-lock').hidden = consentEl.checked;
    if (consentEl.checked) {
      clearError(consentEl, '#code-error');
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
    if (codeEl.value.trim()) clearError(consentEl, '#code-error');
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
        showError(consentEl, '#code-error', 'Tick this box to confirm you understand, or use a summary instead.');
        consentEl.focus();
        return;
      }
      if (!codeEl.value.trim()) {
        showError(consentEl, '#code-error', 'Paste your code in the box below, or use a summary instead.');
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
    $('#prefill-note').textContent = 'We guessed these from your description' +
      (g.src && g.src.product ? ', for example “' + g.src.product + '”' : '') + '. Change anything that’s wrong.';
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
    var qs = activeQuestions(a);
    var anyGuess = qs.some(function (q) {
      return state.guessed[q.id] && a[q.id] === state.guessed[q.id];
    });
    $('#guess-note').hidden = !anyGuess;

    $('#questions').innerHTML = qs.map(function (q) {
      var src = state.guessed.src && state.guessed.src[q.id];
      var showGuess = src && a[q.id] === state.guessed[q.id];
      var name = 'q-' + q.id;
      return (
        '<fieldset class="field question" id="field-' + q.id + '">' +
        '<legend class="field-label">' + q.label + '</legend>' +
        (q.hint ? '<p class="hint hint--above">' + q.hint + '</p>' : '') +
        (showGuess ? '<p class="guess"><strong>Guessed from your description:</strong> “' + esc(src) + '”</p>' : '') +
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

    $('#have-list').innerHTML =
      HAVES.filter(function (h) {
        return h.when(f);
      })
        .map(function (h) {
          return (
            '<label class="check check--row"><input type="checkbox" name="have" value="' + h.id + '"' +
            (a.have[h.id] ? ' checked' : '') + ' /><span>' + h.label + '</span></label>'
          );
        })
        .join('') +
      '<label class="check check--row"><input type="checkbox" name="have" value="none"' +
      (a.have.none ? ' checked' : '') + ' /><span>Nothing yet / I don’t know</span></label>';

    $all('#questions input[type="radio"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var id = r.name.replace('q-', '');
        state.answers[id] = r.value;
        $('#field-' + id).removeAttribute('data-invalid');
        clearError(null, '#' + id + '-error');
      });
    });
    a.does = a.does || {};
    $('#does-list').innerHTML =
      DOES.map(function (d) {
        return (
          '<label class="check check--row"><input type="checkbox" name="does" value="' + d.id + '"' +
          (a.does[d.id] ? ' checked' : '') + ' /><span>' + d.label + '</span></label>'
        );
      }).join('') +
      '<label class="check check--row"><input type="checkbox" name="does" value="none"' +
      (a.does.none ? ' checked' : '') + ' /><span>None of these / I don’t know</span></label>';
    $all('#does-list input').forEach(function (cb) {
      cb.addEventListener('change', function () {
        a.does[cb.value] = cb.checked;
        if (!cb.checked) return;
        $all('#does-list input').forEach(function (o) {
          if (o !== cb && (cb.value === 'none' || o.value === 'none')) {
            o.checked = false;
            a.does[o.value] = false;
          }
        });
      });
    });

    // "Nothing yet / I don't know" and the other boxes rule each other out.
    $all('#have-list input').forEach(function (c) {
      c.addEventListener('change', function () {
        state.answers.have[c.value] = c.checked;
        if (!c.checked) return;
        $all('#have-list input').forEach(function (o) {
          if (o !== c && (c.value === 'none' || o.value === 'none')) {
            o.checked = false;
            state.answers.have[o.value] = false;
          }
        });
      });
    });
  }

  $('#details-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var first = null;
    activeQuestions(state.answers).forEach(function (q) {
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
    var unsure = ['kids', 'accounts', 'tracking', 'ai', 'ugc'].filter(function (k) {
      return a[k] === 'unsure';
    });
    return {
      a: a,
      ios: f.ios,
      android: f.android,
      web: f.web,
      extension: f.extension,
      store: f.ios || f.android,
      site: f.web || f.extension,
      builderHost: ['lovable', 'bolt', 'replit'].indexOf(a.host) > -1,
      accounts: a.accounts === 'yes',
      digital: a.money === 'digital',
      physical: a.money === 'physical',
      cloud: ['supabase', 'firebase', 'other'].indexOf(a.data) > -1,
      tracking: a.tracking === 'analytics' || a.tracking === 'ads',
      ads: a.tracking === 'ads',
      ai: a.ai === 'yes',
      ugc: a.ugc === 'yes',
      unsure: unsure,
      health: a.category === 'health',
      mental: a.detail === 'mental',
      medical: a.detail === 'medical' || a.detail === 'mental',
      kids: a.kids === 'yes' || a.category === 'kids' || a.detail === 'children',
      finance: a.category === 'finance',
      moneyMoving: ['bank', 'payments', 'investing', 'lending'].indexOf(a.detail) > -1,
      have: a.have,
      does: a.does || {}
    };
  }

  // Data fields may be plain values or functions of the context.
  function val(v, c) {
    return typeof v === 'function' ? v(c) : v;
  }

  function buildPlan() {
    var c = context();
    var items = DATA.items
      .filter(function (it) {
        return it.when(c);
      })
      .map(function (it) {
        var gap = val(it.gap, c);
        var sev = val(it.sev, c);
        return {
          id: it.id,
          phase: it.phase,
          branch: it.branch,
          needs: it.needs || [],
          title: val(it.title, c),
          why: val(it.why, c),
          risk: val(it.risk, c) || '',
          steps: val(it.steps, c),
          sources: val(it.sources, c),
          gap: gap,
          // Only real problems count as "Must fix"; required paperwork and
          // build steps are "Required step".
          severity: sev === 'blocker' && !gap ? 'required' : sev,
          _done: !!(it.have && c.have[it.have])
        };
      });
    var gaps = items
      .filter(function (it) {
        return it.gap && !it._done && it.severity === 'blocker';
      })
      .sort(function (x, y) {
        var rx = x.gap.rank != null ? x.gap.rank : 99;
        var ry = y.gap.rank != null ? y.gap.rank : 99;
        return rx - ry;
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

  // ---------- Projects (saved in the browser, synced when signed in) ----------

  var STORE_KEY = 'lc-projects';

  function loadProjects() {
    try {
      var list = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function storeProjects(list) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(list));
    } catch (e) {}
  }

  function newId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (ch) {
      var r = (Math.random() * 16) | 0;
      return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  // "Stillwater is a meditation app…" → "Stillwater".
  function nameFromText(text) {
    var m = (text || '').match(/^\s*(?:\*\*)?([A-Z][\w'&-]*(?: [A-Z][\w'&-]*){0,3})(?:\*\*)?(?::| is | —| -)/);
    return m ? m[1] : '';
  }

  function currentProject() {
    return loadProjects().filter(function (p) {
      return p.id === state.projectId;
    })[0];
  }

  // Code is never stored: only a summary the person chose to paste.
  function saveProject(extra) {
    var list = loadProjects();
    var now = new Date().toISOString();
    var p = currentProject();
    if (!p) {
      p = {
        id: newId(),
        name: nameFromText(state.method === 'summary' ? summaryEl.value : '') || 'My app',
        created_at: now
      };
      list.unshift(p);
      state.projectId = p.id;
    }
    p.summary = state.method === 'summary' ? summaryEl.value.trim() : p.summary || '';
    p.answers = JSON.parse(JSON.stringify(state.answers));
    p.done = JSON.parse(JSON.stringify(state.done));
    p.steps = JSON.parse(JSON.stringify(state.steps));
    p.updated_at = now;
    if (extra) Object.keys(extra).forEach(function (k) {
      p[k] = extra[k];
    });
    list = list.map(function (x) {
      return x.id === p.id ? p : x;
    });
    storeProjects(list);
    sync.push(p);
    return p;
  }

  function openProject(id) {
    var p = loadProjects().filter(function (x) {
      return x.id === id;
    })[0];
    if (!p) return;
    state.projectId = p.id;
    state.answers = Object.assign(freshAnswers(), p.answers || {});
    state.answers.have = state.answers.have || {};
    state.done = p.done || {};
    state.steps = p.steps || {};
    state.guessed = {};
    setMethod('summary');
    summaryEl.value = p.summary || '';
    state.guessedFrom = summaryEl.value.trim();
    go('results');
  }

  function progressOf(p) {
    var saved = { answers: state.answers, done: state.done, steps: state.steps, projectId: state.projectId };
    state.answers = Object.assign(freshAnswers(), p.answers || {});
    state.done = p.done || {};
    state.steps = p.steps || {};
    var plan = buildPlan();
    var total = plan.items.length;
    var done = plan.items.filter(function (it) {
      return isDone(it);
    }).length;
    var must = plan.items.filter(function (it) {
      return it.severity === 'blocker' && !isDone(it);
    }).length;
    state.answers = saved.answers;
    state.done = saved.done;
    state.steps = saved.steps;
    return { total: total, done: done, must: must, context: plan.context };
  }

  function enterProjects() {
    var list = loadProjects();
    $('#projects-lead').textContent = sync.user
      ? 'Saved to your account and synced across devices.'
      : 'Saved in this browser.' + (sync.enabled ? ' Sign in to keep them on every device.' : '');
    renderAccount();
    $('#projects-empty').hidden = list.length > 0;
    $('#project-list').innerHTML = list
      .map(function (p) {
        var pr = progressOf(p);
        var pct = pr.total ? Math.round((pr.done / pr.total) * 100) : 0;
        var when = p.updated_at ? new Date(p.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
        return (
          '<li class="project">' +
          '<div class="project__top"><h2 class="project__name">' + esc(p.name || 'My app') + '</h2>' +
          '<span class="mono project__meta">' + esc(when) + '</span></div>' +
          '<p class="mono project__meta">' + esc(PRODUCT_NAMES[pr.context.a.product] || '') + ' · ' + pr.done + ' of ' + pr.total + ' done · ' +
          pr.must + ' must-fix left</p>' +
          '<div class="meter" aria-hidden="true"><span class="meter__fill" style="width:' + pct + '%"></span></div>' +
          '<div class="project__actions">' +
          '<button type="button" class="button button--signal button--small" data-project-open="' + p.id + '">Continue</button>' +
          '<button type="button" class="button button--secondary button--small" data-project-delete="' + p.id + '">Delete<span class="sr-only"> ' + esc(p.name) + '</span></button>' +
          '</div></li>'
        );
      })
      .join('');
    $all('[data-project-open]').forEach(function (b) {
      b.addEventListener('click', function () {
        openProject(b.getAttribute('data-project-open'));
      });
    });
    $all('[data-project-delete]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-project-delete');
        // Two-step delete, built into the page.
        if (b.getAttribute('data-confirm') !== 'yes') {
          b.setAttribute('data-confirm', 'yes');
          b.firstChild.textContent = 'Tap again to delete';
          return;
        }
        storeProjects(loadProjects().filter(function (p) {
          return p.id !== id;
        }));
        sync.remove(id);
        if (state.projectId === id) state.projectId = '';
        enterProjects();
      });
    });
  }

  // ---------- Results ----------

  var GAP_LIMIT = 5;

  // A task is done when it's ticked as a whole, or when every small step in it is.
  function stepTicks(it) {
    var t = state.steps[it.id] || [];
    return it.steps.map(function (x, i) {
      return !!t[i];
    });
  }

  function isDone(it) {
    if (state.done[it.id] !== undefined) return state.done[it.id];
    if (it._done) return true;
    var t = stepTicks(it);
    return t.length > 0 && t.every(Boolean);
  }

  function stepsDoneIn(it) {
    if (isDone(it)) return it.steps.length;
    return stepTicks(it).filter(Boolean).length;
  }

  function setTaskDone(it, done) {
    state.done[it.id] = done;
    state.steps[it.id] = it.steps.map(function () {
      return done;
    });
  }

  function setStepDone(it, i, done) {
    var t = stepTicks(it);
    t[i] = done;
    state.steps[it.id] = t;
    // The whole task follows its steps.
    state.done[it.id] = t.every(Boolean);
  }

  function stepTotals(items) {
    var total = 0;
    var done = 0;
    items.forEach(function (it) {
      total += it.steps.length;
      done += stepsDoneIn(it);
    });
    return { total: total, done: done };
  }

  function orderedItems(plan) {
    var list = [];
    phasesFor(plan).forEach(function (phase) {
      phase.items.forEach(function (it) {
        it.phaseTitle = phase.title;
        list.push(it);
      });
    });
    return list;
  }

  function enterResults() {
    var project = saveProject();
    var plan = buildPlan();
    var c = plan.context;
    var catName = categoryEl.querySelector('option[value="' + c.a.category + '"]');

    $('#project-name').value = project.name;
    $('#basis').innerHTML =
      esc(PRODUCT_NAMES[c.a.product].replace(/^an? /, '')) + ' about ' + esc(catName ? catName.textContent.toLowerCase() : 'your topic') +
      '. Based on your answers, not your code. <a href="#details">Edit answers</a>';

    var n = plan.gaps.length;
    $('#results-title').textContent =
      n === 0 ? 'Nothing blocking launch' : n === 1 ? '1 thing to fix before launch' : n + ' things to fix before launch';

    var shown = plan.gaps.slice(0, GAP_LIMIT);
    $('#gaps').innerHTML = shown.length
      ? '<ol class="gaps">' +
        shown
          .map(function (g) {
            return (
              '<li><a class="gap" href="#next" data-open="' + g.id + '">' +
              '<span class="gap__text"><span class="gap__title">' + esc(g.gap.title) + '</span>' +
              '<span class="gap__why">' + esc(g.gap.why) + '</span></span>' +
              '<span class="gap__go"><span class="gap__go-label">Do it</span>' + ARROW + '</span></a></li>'
            );
          })
          .join('') +
        '</ol>'
      : '<p class="lead">Your answers don’t show anything that would stop a release. Work through the checklist anyway: it covers what reviewers look at.</p>';

    var more = plan.gaps.length - shown.length;
    $('#gaps-more').hidden = more <= 0;
    $('#gaps-more').textContent = more > 0 ? 'Plus ' + more + ' more marked “Must fix” in the checklist below.' : '';
    renderCost(c);

    $all('[data-checked-date]').forEach(function (el) {
      el.textContent = DATA.checked;
    });

    renderChecklist(plan);
    renderReport(plan);

    $all('[data-open]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        openFocus(a.getAttribute('data-open'));
      });
    });
  }

  function renderReport(plan) {
    var items = plan.items;
    var done = items.filter(isDone).length;
    var st = stepTotals(items);
    var must = items.filter(function (it) {
      return it.severity === 'blocker' && !isDone(it);
    }).length;
    $('#meter-fill').style.width = (st.total ? (st.done / st.total) * 100 : 0) + '%';
    $('#report-stats').innerHTML =
      '<strong>' + done + '</strong> of ' + items.length + ' tasks · <strong>' + st.done + '</strong> of ' + st.total +
      ' small steps · <strong>' + must + '</strong> must-fix left';
    var next = $('#start-next');
    next.firstChild.textContent = st.done === 0 ? 'Start with task 1 ' : done === items.length ? 'Review your tasks ' : 'Do the next task ';
    var note = sync.user
      ? 'Saved to your account (' + esc(sync.user.email || 'signed in') + ').'
      : 'Saved in this browser. <a href="#projects">' + (sync.enabled ? 'Sign in to keep it on every device' : 'See my projects') + '</a>';
    $('#save-note').innerHTML = note;
  }

  $('#project-name').addEventListener('change', function () {
    var name = $('#project-name').value.trim() || 'My app';
    $('#project-name').value = name;
    saveProject({ name: name });
  });

  $('#start-next').addEventListener('click', function (e) {
    e.preventDefault();
    openFocus('');
  });

  var LEVELS = { blocker: 'Must fix', required: 'Required', before: 'Before launch', recommended: 'Recommended', after: 'After launch' };

  // Status is shown as words; only "Must fix" gets color.
  function levelText(it) {
    return it.severity === 'blocker' ? '<span class="flag">Must fix</span>' : LEVELS[it.severity];
  }

  function phasesFor(plan) {
    var c = plan.context;
    return DATA.phases
      .map(function (phase) {
        return {
          id: phase.id,
          title: val(phase.title, c),
          intro: val(phase.intro, c),
          items: plan.items.filter(function (it) {
            return it.phase === phase.id;
          })
        };
      })
      .filter(function (phase) {
        return phase.items.length;
      });
  }

  function taskRow(it) {
    var done = isDone(it);
    var n = it.steps.length;
    return (
      '<li class="task" id="step-' + it.id + '" data-severity="' + it.severity + '"' + (done ? ' data-done="true"' : '') + '>' +
      '<input type="checkbox" data-task="' + it.id + '"' + (done ? ' checked' : '') + ' aria-label="Mark done: ' + esc(it.title) + '" />' +
      '<button type="button" class="task__main" data-focus="' + it.id + '">' +
      '<span class="task__what">' + esc(it.title) + '</span>' +
      '<span class="task__meta">' + (done ? 'Done' : levelText(it)) + (it.risk && !done ? ' · Legal risk' : '') + ' · ' + stepsDoneIn(it) + ' of ' + n + (n === 1 ? ' step' : ' steps') + '</span>' +
      '</button>' +
      '</li>'
    );
  }

  function bindTaskRows(root, rerender) {
    var byId = {};
    buildPlan().items.forEach(function (it) {
      byId[it.id] = it;
    });
    $all(root + ' input[data-task]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        setTaskDone(byId[cb.getAttribute('data-task')], cb.checked);
        saveProject();
        rerender();
      });
    });
    $all(root + ' [data-focus]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openFocus(btn.getAttribute('data-focus'));
      });
    });
  }

  function renderChecklist(plan) {
    var phases = phasesFor(plan);
    $('#phase-nav').innerHTML = phases
      .map(function (phase, i) {
        return '<li><a href="#phase-' + phase.id + '" data-jump="phase-' + phase.id + '">' + (i + 1) + '. ' + esc(phase.title) + '</a></li>';
      })
      .join('');
    $('#checklist').innerHTML = phases
      .map(function (phase, i) {
        var left = phase.items.filter(function (it) {
          return !isDone(it);
        }).length;
        return (
          '<section class="phase" aria-labelledby="phase-' + phase.id + '">' +
          '<h3 id="phase-' + phase.id + '" tabindex="-1"><span>' + (i + 1) + '. ' + esc(phase.title) + '</span>' +
          '<span class="phase__count">' + (left ? left + ' left' : 'All done') + '</span></h3>' +
          '<ol class="tasks">' + phase.items.map(taskRow).join('') + '</ol></section>'
        );
      })
      .join('');
    applyFilter();
    $all('[data-jump]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var h = document.getElementById(a.getAttribute('data-jump'));
        h.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
        h.focus({ preventScroll: true });
      });
    });
    bindTaskRows('#checklist', function () {
      var y = window.scrollY;
      var p = buildPlan();
      renderChecklist(p);
      renderReport(p);
      window.scrollTo(0, y);
    });
    updateCount();
  }

  function applyFilter() {
    var only = $('#must-only').checked;
    $all('#checklist .task').forEach(function (li) {
      li.hidden = only && li.getAttribute('data-severity') !== 'blocker';
    });
    $all('#checklist .phase').forEach(function (sec) {
      sec.hidden = only && !sec.querySelector('.task:not([hidden])');
    });
  }

  $('#must-only').addEventListener('change', applyFilter);

  // Rough money and time, from the sources in data.js.
  function renderCost(c) {
    var rows = [];
    if (c.ios) rows.push(['Apple Developer Program', '$99 a year', 'Usually a day or two to approve; longer for a company']);
    if (c.android) rows.push(['Google Play developer account', '$25 once', 'New personal accounts: a 14-day test with 12 people, then up to 7 days of review']);
    if (!(c.have && c.have.website)) rows.push(['Your own web address', 'About $10–15 a year', 'An hour or two to set up; DNS can take up to a day']);
    if (c.site && c.builderHost) rows.push(['Custom domain on ' + ({ lovable: 'Lovable', bolt: 'Bolt', replit: 'Replit' })[c.a.host], 'Needs a paid plan', '']);
    if (c.a.data === 'supabase') rows.push(['Supabase', 'Free plan to start', 'Free projects pause after a week without activity']);
    if (c.ai) rows.push(['AI provider', 'Pay per use', 'Set a monthly spending limit']);
    if (c.ios) rows.push(['App Store review', 'Free', 'Apple says 90% of submissions are reviewed within 24 hours']);
    $('#cost').innerHTML = rows
      .map(function (r) {
        return '<tr><th scope="row">' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td></tr>';
      })
      .join('');
    $('#cost-section').hidden = !rows.length;
  }

  function updateCount() {
    var boxes = $all('#checklist input[type="checkbox"]');
    var done = boxes.filter(function (b) {
      return b.checked;
    }).length;
    $('#checklist-count').textContent = done + ' of ' + boxes.length + ' tasks done';
  }

  // ---------- Map: the skill tree ----------

  var mapOpen = null;

  function goalFor(c) {
    if (c.ios && c.android) return 'Released on the App Store and Google Play';
    if (c.ios) return 'Released on the App Store';
    if (c.android) return 'Released on Google Play';
    if (c.extension) return 'Published in the Chrome Web Store';
    return 'Live on your own web address';
  }

  // Needs that apply to this plan only; a task is ready when all of them are done.
  function statusOf(it, byId) {
    if (isDone(it)) return 'done';
    var waiting = it.needs.filter(function (id) {
      return byId[id] && !isDone(byId[id]);
    });
    return waiting.length ? 'wait' : 'ready';
  }

  function enterMap() {
    var plan = buildPlan();
    var c = plan.context;
    var items = orderedItems(plan);
    var byId = {};
    items.forEach(function (it, i) {
      it._order = i;
      byId[it.id] = it;
    });

    var done = items.filter(isDone).length;
    var st = stepTotals(items);
    $('#map-title').textContent = goalFor(c);
    $('#goal-stats').innerHTML = '<strong>' + done + '</strong> of ' + items.length + ' tasks · <strong>' + st.done + '</strong> of ' + st.total + ' small steps';
    $('#goal-meter').style.width = (st.total ? (st.done / st.total) * 100 : 0) + '%';

    // Today: everything that isn't waiting on anything, must-fix first.
    var ready = items
      .filter(function (it) {
        return statusOf(it, byId) === 'ready';
      })
      .sort(function (x, y) {
        return (x.severity === 'blocker' ? 0 : 1) - (y.severity === 'blocker' ? 0 : 1) || x._order - y._order;
      });
    $('#ready-list').innerHTML = ready.slice(0, 6).map(taskRow).join('') ||
      '<li class="ready__empty">Nothing is ready right now. Every task left is waiting on another one.</li>';

    // Branches with progress; the weakest one is called out.
    var branches = DATA.branches
      .map(function (br) {
        var list = items.filter(function (it) {
          return it.branch === br.id;
        });
        var d = list.filter(isDone).length;
        return { id: br.id, title: br.title, items: list, done: d, pct: list.length ? d / list.length : 1 };
      })
      .filter(function (br) {
        return br.items.length;
      });
    var open = branches.filter(function (br) {
      return br.done < br.items.length;
    });
    var weakest = open.length
      ? open.reduce(function (m, br) {
          return br.pct < m.pct ? br : m;
        }).id
      : '';
    if (!mapOpen) {
      mapOpen = {};
      var wide = window.matchMedia('(min-width: 860px)').matches;
      branches.forEach(function (br) {
        mapOpen[br.id] = wide || br.id === weakest;
      });
    }

    $('#branches').innerHTML = branches
      .map(function (br) {
        // Depth inside the branch: one more than the deepest task it waits on in the same branch.
        var depth = {};
        function d(it) {
          if (depth[it.id] !== undefined) return depth[it.id];
          depth[it.id] = 0;
          var max = -1;
          it.needs.forEach(function (id) {
            var dep = byId[id];
            if (dep && dep.branch === br.id) max = Math.max(max, d(dep));
          });
          depth[it.id] = max + 1;
          return depth[it.id];
        }
        var nodes = br.items.slice().sort(function (x, y) {
          return d(x) - d(y) || x._order - y._order;
        });
        var isOpen = !!mapOpen[br.id];
        return (
          '<section class="branch' + (br.id === weakest ? ' branch--weakest' : '') + '">' +
          '<h3 class="branch__head"><button type="button" class="branch__toggle" aria-expanded="' + isOpen + '" aria-controls="branch-' + br.id + '" data-branch="' + br.id + '">' +
          '<span class="branch__title">' + esc(br.title) + '</span>' +
          '<span class="branch__count">' + br.done + ' of ' + br.items.length + '</span>' +
          CHEVRON + '</button></h3>' +
          (br.id === weakest ? '<p class="branch__note">Furthest behind</p>' : '') +
          '<div class="meter meter--light" aria-hidden="true"><span class="meter__fill" style="width:' + br.pct * 100 + '%"></span></div>' +
          '<ol class="tree" id="branch-' + br.id + '"' + (isOpen ? '' : ' hidden') + '>' +
          nodes
            .map(function (it) {
              var status = statusOf(it, byId);
              var waitingOn = it.needs
                .filter(function (id) {
                  return byId[id] && !isDone(byId[id]);
                })
                .map(function (id) {
                  var dep = byId[id];
                  return esc(dep.title) + (dep.branch !== br.id ? ' (' + esc(branchName(dep.branch)) + ')' : '');
                });
              var shown = waitingOn.slice(0, 2).join('; ');
              var extra = waitingOn.length - 2;
              var label = status === 'done' ? 'Done' : status === 'ready' ? 'Ready now' :
                'Waiting on: ' + shown + (extra > 0 ? ' and ' + extra + ' more' : '');
              return (
                '<li class="node" data-state="' + status + '" style="--depth:' + Math.min(d(it), 3) + '">' +
                '<button type="button" class="node__head" aria-expanded="false" aria-controls="node-' + it.id + '">' +
                '<span class="node-dot node-dot--' + status + '" aria-hidden="true"></span>' +
                '<span class="node__text"><span class="node__title">' + esc(it.title) + '</span>' +
                '<span class="node__meta">' + label + '</span></span></button>' +
                '<div class="node__body" id="node-' + it.id + '" hidden>' +
                '<p>' + esc(it.why) + '</p>' +
                (it.risk ? '<p class="node__risk"><strong>Legal risk:</strong> ' + esc(it.risk) + '</p>' : '') +
                '<label class="check"><input type="checkbox" data-node="' + it.id + '"' + (status === 'done' ? ' checked' : '') + ' />' +
                '<span>Mark this task done</span></label>' +
                '<button type="button" class="button button--secondary button--small" data-focus="' + it.id + '">Open its ' + it.steps.length + ' steps</button>' +
                '</div></li>'
              );
            })
            .join('') +
          '</ol></section>'
        );
      })
      .join('');

    $all('.branch__toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-branch');
        mapOpen[id] = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', String(mapOpen[id]));
        $('#branch-' + id).hidden = !mapOpen[id];
      });
    });
    $all('.node__head').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', String(open));
        document.getElementById(btn.getAttribute('aria-controls')).hidden = !open;
      });
    });
    var rerender = function (keepId) {
      var y = window.scrollY;
      enterMap();
      window.scrollTo(0, y);
      if (keepId) {
        var head = $('[aria-controls="node-' + keepId + '"]');
        if (head) {
          head.click();
          var box = $('[data-node="' + keepId + '"]');
          if (box) box.focus({ preventScroll: true });
        }
      }
    };
    $all('[data-node]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var id = cb.getAttribute('data-node');
        setTaskDone(byId[id], cb.checked);
        saveProject();
        rerender(id);
      });
    });
    bindTaskRows('#ready-list', function () {
      rerender('');
    });
    $all('#branches [data-focus]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openFocus(btn.getAttribute('data-focus'));
      });
    });
  }

  function branchName(id) {
    var b = DATA.branches.filter(function (x) {
      return x.id === id;
    })[0];
    return b ? b.title : '';
  }

  // ---------- Focus: one task at a time ----------

  var focusItems = [];

  function openFocus(id) {
    state.focusStart = id || '';
    go('next');
  }

  function focusHeading() {
    return $('#focus-cleared').hidden ? $('#focus-title') : $('#focus-cleared h1');
  }

  function enterFocus() {
    focusItems = orderedItems(buildPlan());
    var idx = -1;
    if (state.focusStart) {
      idx = focusItems.map(function (it) {
        return it.id;
      }).indexOf(state.focusStart);
    }
    if (idx < 0) idx = firstUndone(0);
    state.focusStart = '';
    showFocus(idx, '');
  }

  function firstUndone(from) {
    for (var i = from; i < focusItems.length; i++) if (!isDone(focusItems[i])) return i;
    for (var j = 0; j < from; j++) if (!isDone(focusItems[j])) return j;
    return -1;
  }

  function updateFocusProgress() {
    var total = focusItems.length;
    var doneCount = focusItems.filter(isDone).length;
    $('#focus-meter').style.width = (total ? (doneCount / total) * 100 : 0) + '%';
    $('#focus-done').textContent = doneCount + ' done';
  }

  function updateFocusButtons(it) {
    var done = isDone(it);
    $('#focus-complete').querySelector('span').textContent = done ? 'Next' : 'Done, next';
    $('#focus-skip').textContent = done ? 'Mark not done' : 'Skip for now';
    $('#focus-steps-count').textContent = stepsDoneIn(it) + ' of ' + it.steps.length;
    var flag = $('#focus-level');
    flag.textContent = done ? 'Done' : LEVELS[it.severity];
    flag.className = 'card__flag' + (done ? ' card__flag--done' : it.severity === 'blocker' ? ' card__flag--must' : '');
  }

  function showFocus(idx, direction) {
    var total = focusItems.length;
    updateFocusProgress();
    var cleared = idx < 0;
    $('#focus-cleared').hidden = !cleared;
    $('#focus-card').hidden = cleared;
    $('.focus__controls').hidden = cleared;
    if (cleared) {
      $('#focus-count').textContent = total + ' of ' + total;
      return;
    }
    state.focusIndex = idx;
    var it = focusItems[idx];
    $('#focus-count').textContent = 'Task ' + (idx + 1) + ' of ' + total;
    $('#focus-phase').textContent = it.phaseTitle || '';
    $('#focus-title').textContent = it.title;
    $('#focus-why').textContent = it.why;
    $('#focus-risk').hidden = !it.risk;
    $('#focus-risk-text').textContent = it.risk;
    var ticks = stepTicks(it);
    var all = isDone(it);
    $('#focus-steps').innerHTML = it.steps
      .map(function (st, i) {
        return (
          '<li><label class="step"><input type="checkbox" data-step="' + i + '"' + (all || ticks[i] ? ' checked' : '') + ' />' +
          '<span class="step__text">' + st + '</span></label></li>'
        );
      })
      .join('');
    $all('#focus-steps input').forEach(function (cb) {
      cb.addEventListener('change', function () {
        setStepDone(it, +cb.getAttribute('data-step'), cb.checked);
        saveProject();
        updateFocusProgress();
        updateFocusButtons(it);
      });
    });
    $('#focus-sources').innerHTML = it.sources
      .map(function (src) {
        return '<li><a href="' + esc(src.url) + '" target="_blank" rel="noopener">' + esc(src.label) + '<span class="sr-only"> (opens in a new tab)</span></a></li>';
      })
      .join('');
    $('.card__sources').open = false;
    $('#focus-prev').disabled = idx === 0;
    updateFocusButtons(it);
    $('#focus-stage').scrollTop = 0;

    var card = $('#focus-card');
    card.classList.remove('is-leaving-left', 'is-leaving-right', 'is-entering');
    if (direction && !reduceMotion) {
      void card.offsetWidth;
      card.classList.add('is-entering');
    }
  }

  function moveFocus(idx, direction) {
    var card = $('#focus-card');
    var finish = function () {
      showFocus(idx, direction);
      var h = focusHeading();
      if (h) h.focus({ preventScroll: true });
    };
    if (reduceMotion || card.hidden) return finish();
    card.classList.add(direction === 'back' ? 'is-leaving-right' : 'is-leaving-left');
    setTimeout(finish, 150);
  }

  function nextIndex(from) {
    if (from + 1 < focusItems.length) return from + 1;
    return firstUndone(0);
  }

  $('#focus-complete').addEventListener('click', function () {
    var it = focusItems[state.focusIndex];
    if (!isDone(it)) {
      setTaskDone(it, true);
      saveProject();
    }
    // Move on to the next task that isn't done yet, or the cleared screen.
    var n = nextIndex(state.focusIndex);
    if (n > -1 && isDone(focusItems[n])) n = firstUndone(n);
    moveFocus(n, 'next');
  });

  $('#focus-skip').addEventListener('click', function () {
    var it = focusItems[state.focusIndex];
    if (isDone(it)) {
      setTaskDone(it, false);
      saveProject();
      showFocus(state.focusIndex, '');
      return;
    }
    moveFocus(nextIndex(state.focusIndex), 'next');
  });

  $('#focus-prev').addEventListener('click', function () {
    if (state.focusIndex > 0) moveFocus(state.focusIndex - 1, 'back');
  });

  // Swipe: left for the next task, right to go back. Vertical scrolling is untouched.
  (function () {
    var card = $('#focus-card');
    var x0 = null;
    var y0 = null;
    card.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') return;
      x0 = e.clientX;
      y0 = e.clientY;
    });
    card.addEventListener('pointerup', function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0;
      var dy = e.clientY - y0;
      x0 = null;
      if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;
      if (dx < 0) moveFocus(nextIndex(state.focusIndex), 'next');
      else if (state.focusIndex > 0) moveFocus(state.focusIndex - 1, 'back');
    });
    card.addEventListener('pointercancel', function () {
      x0 = null;
    });
  })();

  document.addEventListener('keydown', function (e) {
    if (currentView() !== 'next' || $('#focus-card').hidden) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.altKey || e.metaKey || e.ctrlKey) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      moveFocus(nextIndex(state.focusIndex), 'next');
    } else if (e.key === 'ArrowLeft' && state.focusIndex > 0) {
      e.preventDefault();
      moveFocus(state.focusIndex - 1, 'back');
    }
  });

  // ---------- The sample app ----------

  function loadExample() {
    // Reopen the sample if it's already saved, instead of making a copy each time.
    var existing = loadProjects().filter(function (p) {
      return p.summary === EXAMPLE_SUMMARY;
    })[0];
    if (existing) {
      location.replace('#results');
      openProject(existing.id);
      return;
    }
    state.projectId = '';
    state.done = {};
    state.steps = {};
    setMethod('summary');
    summaryEl.value = EXAMPLE_SUMMARY;
    state.guessedFrom = '';
    applyGuess(EXAMPLE_SUMMARY);
    activeQuestions(state.answers).forEach(function (q) {
      if (!state.answers[q.id]) state.answers[q.id] = EXAMPLE_FILL[q.id] || 'unsure';
    });
    if (!state.answers.product) state.answers.product = 'ios';
    if (!state.answers.category) state.answers.category = 'finance';
    // A couple of things ticked, so the map shows all three states.
    state.done['apple-developer'] = true;
    state.done['support-email'] = true;
    go('results', true);
  }

  // ---------- Copy as text ----------

  // Plain-text version of the plan, for pasting into notes, a doc or an AI chat.
  function planAsText() {
    var plan = buildPlan();
    var lines = [$('#project-name').value + ': ' + $('#results-title').textContent, 'From Launch Check. Checked ' + DATA.checked + '. Not legal advice.', ''];
    if (plan.gaps.length) {
      lines.push('MUST FIX FIRST');
      plan.gaps.forEach(function (g) {
        lines.push('- ' + g.gap.title + ': ' + g.gap.why);
      });
      lines.push('');
    }
    var n = 0;
    phasesFor(plan).forEach(function (phase, pi) {
      lines.push((pi + 1) + '. ' + phase.title.toUpperCase());
      phase.items.forEach(function (it) {
        n++;
        lines.push('');
        lines.push(n + '. [' + (isDone(it) ? 'x' : ' ') + '] ' + it.title + ' (' + LEVELS[it.severity] + ')');
        lines.push('   Why: ' + it.why);
        if (it.risk) lines.push('   Legal risk: ' + it.risk);
        var ticks = stepTicks(it);
        var all = isDone(it);
        it.steps.forEach(function (st, i) {
          var tmp = document.createElement('div');
          tmp.innerHTML = st;
          lines.push('   [' + (all || ticks[i] ? 'x' : ' ') + '] ' + tmp.textContent.replace(/ \(opens in a new tab\)/g, ''));
        });
        it.sources.forEach(function (src) {
          lines.push('   Source: ' + src.label + ' ' + src.url);
        });
      });
      lines.push('');
    });
    return lines.join('\n');
  }

  var copyPlanBtn = $('#copy-plan');
  copyPlanBtn.addEventListener('click', function () {
    var text = planAsText();
    var label = copyPlanBtn.querySelector('span');
    var done = function (msg) {
      label.textContent = msg;
      $('#copy-plan-status').textContent = msg === 'Copied' ? 'Checklist copied as text.' : 'Couldn’t copy. Your browser blocked it.';
      setTimeout(function () {
        label.textContent = 'Copy checklist as text';
      }, 3000);
    };
    var p = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(text) : Promise.reject();
    p.then(
      function () {
        done('Copied');
      },
      function () {
        done(copyWithCommand(text) ? 'Copied' : 'Couldn’t copy');
      }
    );
  });

  $('#start-over').addEventListener('click', function () {
    state.steps = {};
    state.projectId = '';
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

  // ---------- Accounts (Supabase: Google sign-in or an email link) ----------

  var CFG = window.LC_CONFIG || {};
  var sync = {
    enabled: !!(CFG.supabaseUrl && CFG.supabaseKey),
    client: null,
    user: null,
    push: function () {},
    remove: function () {}
  };

  function renderAccount() {
    var box = $('#account-box');
    if (!sync.enabled) {
      box.innerHTML = '';
      return;
    }
    if (sync.user) {
      box.innerHTML =
        '<div class="account__row"><p>Signed in as <strong>' + esc(sync.user.email || 'you') + '</strong>.</p>' +
        '<button type="button" class="button button--secondary button--small" id="sign-out">Sign out</button></div>';
      $('#sign-out').addEventListener('click', function () {
        sync.client.auth.signOut();
      });
      return;
    }
    box.innerHTML =
      '<div class="account__row"><p><strong>Keep your projects on every device.</strong> Sign in and they sync automatically.</p>' +
      '<button type="button" class="button button--primary button--small" id="google-sign-in">Sign in with Google</button></div>' +
      '<form class="account__email" id="email-sign-in" novalidate><label class="field-label" for="sign-in-email">Or get a sign-in link by email</label>' +
      '<div class="account__row"><input type="email" id="sign-in-email" autocomplete="email" placeholder="you@example.com" />' +
      '<button type="submit" class="button button--secondary button--small">Email me a link</button></div>' +
      '<p class="hint" id="email-status" role="status"></p></form>';
    $('#google-sign-in').addEventListener('click', signInGoogle);
    $('#email-sign-in').addEventListener('submit', function (e) {
      e.preventDefault();
      var email = $('#sign-in-email').value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        $('#email-status').textContent = 'Enter an email address like you@example.com.';
        return;
      }
      $('#email-status').textContent = 'Sending…';
      sync.client.auth.signInWithOtp({ email: email, options: { emailRedirectTo: returnUrl() } }).then(function (res) {
        $('#email-status').textContent = res.error ? 'Couldn’t send it: ' + res.error.message : 'Check your inbox for a sign-in link from Launch Check.';
      });
    });
  }

  function returnUrl() {
    return location.origin + location.pathname + '#projects';
  }

  function signInGoogle() {
    sync.client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: returnUrl() } }).then(function (res) {
      if (res.error) alertInPage('Google sign-in isn’t available yet: ' + res.error.message);
    });
  }

  function alertInPage(msg) {
    var box = $('#account-box');
    var p = document.createElement('p');
    p.className = 'error';
    p.setAttribute('role', 'alert');
    p.textContent = msg;
    box.appendChild(p);
  }

  function toRow(p) {
    return {
      id: p.id,
      name: p.name,
      summary: p.summary || '',
      answers: p.answers || {},
      done: p.done || {},
      created_at: p.created_at,
      updated_at: p.updated_at
    };
  }

  // Merge by id; the newer copy wins. Then push anything the server lacks.
  function pullAndMerge() {
    return sync.client
      .from('launch_check_projects')
      .select('id,name,summary,answers,done,created_at,updated_at')
      .then(function (res) {
        if (res.error) return;
        var local = loadProjects();
        var byId = {};
        local.forEach(function (p) {
          byId[p.id] = p;
        });
        var toPush = [];
        res.data.forEach(function (r) {
          var l = byId[r.id];
          if (!l || new Date(r.updated_at) > new Date(l.updated_at)) byId[r.id] = r;
          else if (new Date(l.updated_at) > new Date(r.updated_at)) toPush.push(l);
        });
        var remoteIds = res.data.map(function (r) {
          return r.id;
        });
        local.forEach(function (l) {
          if (remoteIds.indexOf(l.id) < 0) toPush.push(l);
        });
        var merged = Object.keys(byId)
          .map(function (k) {
            return byId[k];
          })
          .sort(function (a, b) {
            return new Date(b.updated_at) - new Date(a.updated_at);
          });
        storeProjects(merged);
        if (toPush.length) sync.client.from('launch_check_projects').upsert(toPush.map(toRow)).then(function () {});
      });
  }

  function updateAuthUi() {
    var btn = $('#auth-button');
    btn.hidden = !sync.enabled;
    btn.textContent = sync.user ? 'Signed in' : 'Sign in';
    $('#footer-note').textContent = sync.user
      ? 'Launch Check prototype. Your projects sync to your account. Not legal advice.'
      : 'Launch Check prototype. Your projects are saved in this browser. Not legal advice.';
    var view = currentView();
    if (view === 'projects') enterProjects();
    if (view === 'results' && answered(state.answers)) renderReport(buildPlan());
  }

  function initAccounts() {
    if (!sync.enabled) return;
    $('#auth-button').addEventListener('click', function () {
      go('projects');
    });
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/dist/umd/supabase.min.js';
    s.onload = function () {
      sync.client = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey);
      var timer = null;
      var pending = {};
      sync.push = function (p) {
        if (!sync.user) return;
        pending[p.id] = toRow(p);
        clearTimeout(timer);
        timer = setTimeout(function () {
          var rows = Object.keys(pending).map(function (k) {
            return pending[k];
          });
          pending = {};
          sync.client.from('launch_check_projects').upsert(rows).then(function () {});
        }, 800);
      };
      sync.remove = function (id) {
        if (sync.user) sync.client.from('launch_check_projects').delete().eq('id', id).then(function () {});
      };
      sync.client.auth.onAuthStateChange(function (event, session) {
        var was = sync.user && sync.user.id;
        sync.user = session ? session.user : null;
        if (sync.user && sync.user.id !== was) pullAndMerge().then(updateAuthUi);
        else updateAuthUi();
      });
    };
    s.onerror = function () {
      sync.enabled = false;
      updateAuthUi();
    };
    document.head.appendChild(s);
    updateAuthUi();
  }

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
  initAccounts();
  render();
})();
