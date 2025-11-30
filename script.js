// emojiDatabase محمل ديناميكياً من ملف JSON لتسهيل التوسيع
let emojiDatabase = {};
let emojiBaseIndex = {}; // maps base emoji (no suffix) -> array of suggestions

// Category sets used to group the picker entries. Keep these in sync with the DB
const CATEGORY_ORDER = [
    // 1) Faces / People
    { id: 'people_faces', label: 'وجوه ووجوه تعبيرية', items: new Set([
        '😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','😘','🙂','🙃','🤗','🤔','🤨','😐','😑','😶','🙄','😏','😣','😥','😮','🤐','🤑','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','😇','🤓','😢','😡','🤫','🤭','🤥','😬','😴','🤤','🤡','🤖','👻'
    ])},

    // 2) People / Occupations
    { id: 'people_activity', label: 'أشخاص ووظائف', items: new Set([
        '🧑','👨','👩','👶','🧓','👵','👴','🧑‍🏫','🧑‍⚕️','🧑‍💻','🧑‍🔧','🧑‍🍳','🧑‍🎨'
    ])},

    // 3) Animals
    { id: 'animals', label: 'حيوانات', items: new Set([
        '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐵','🐸','🐔','🐧','🐦'
    ])},

    // 4) Nature / Weather
    { id: 'nature', label: 'طبيعة وطقس', items: new Set([
        '🌳','🌲','🌴','🌵','🌞','🌧️','⛄','🔥','🌪️',
        '🌈','🌬️','⛈️','🌩️','🌦️','🌫️','🌊','🌱','🌿','🍂','🍁','🌻','🌸'
    ])},

    // 4) Food & Drink
    { id: 'food', label: 'طعام وشراب', items: new Set([
        '🍔','🍕','🍣','🍜','🍩','🍪','🥐','🍳','🌶️','🧂','🥩','🍤','🍟','🌭','🥪','🌮','🌯','🥗','🥘','🍝','🍱','🍛','🍲','🍰','☕','🍵','🍺','🍷','🍎','🍇','🍌','🥑','🍓','🍉','🍒','🍍','🥝','🍅','🍆','🥦','🥬','🌽','🥕','🍏','🍐','🍊','🍋','🧀','🥖','🥞'
    ])},

    // 5) Sports & Activities
    { id: 'sports', label: 'رياضة وأنشطة', items: new Set([
        '⚽','🏀','🏈','🎾','🏊','🏐','🏉','🎱','🏓','🏸','🏂','⛷️','🥊','🏋️','🧗'
    ])},

    // 6) Travel & Outdoors
    { id: 'travel', label: 'سفر وأنشطة خارجية', items: new Set([
        '🚗','✈️','🚆','🚲','🚌','🚤','🚀','🛳️','🚢','🗺️','🏖️','🏔️','🏕️','🏝️','🏞️','🏟️','🏛️','⛺','🪂','🛶'
    ])},

    // 7) Places / Buildings / Home
    { id: 'places', label: 'أماكن ومبانٍ', items: new Set([
        '🏠','🏡','🏢','🏣','🏥','🏦','🏨','🏪','🏫','⛪','🕌','🛕','🏛️','🏰','🏯','🏗️','🏭','🏬','🏚️'
    ])},

    // 8) Entertainment / Media / Music / Games
    { id: 'entertainment', label: 'ترفيه وميديا', items: new Set([
        '🎮','🎧','🎸','🎤','🎬','🎨','🎭','🎹','🎵','🎶'
    ])},

    // 9) Devices / Tools / Objects
    { id: 'objects', label: 'أجهزة وأدوات', items: new Set([
        '📱','💻','🖨️','🖱️','📚','🧾','📝','🔎','💼','🔔','🔕','📷','🎥','📺','📻','🎁','🕯️','💊','🩺'
    ])},

    // 10) Health / Wellness
    { id: 'health', label: 'صحة ورفاهية', items: new Set([
        '💊','🩺','🧘','💉','🚑','🩹','🦠','🧴','🧬','👩‍⚕️','👨‍⚕️','🥼'
    ])},

    // 11) Flags / Symbols
    { id: 'flags', label: 'أعلام ورموز', items: new Set(['🇦🇺','🇺🇸','🇬🇧','🇨🇦','🇯🇵','🇩🇪','🇫🇷','🇮🇳','🇧🇷','🇪🇬','🏳️‍🌈']) },

    // fallback
    { id: 'other', label: 'أخرى', items: new Set() }
];

// Helper: generate realistic Arabic suggestions for a base emoji when DB contains placeholders
function generateSuggestionsFor(base) {
    const manualMap = {
        '⚠️': ["تحذيرات عامة", "إشعارات أمان", "تحديثات عاجلة"],
        '🍔': ["أفضل مطاعم البرجر", "وصفات برجر منزلية", "تعليقات وتقييمات مطاعم البرجر"],
        '🍕': ["أفضل بيتزا في الجوار", "وصفات بيتزا منزلية", "دليل مطابخ البيتزا المحلية"],
        '🍣': ["مطاعم سوشي موثوقة", "وصفات سوشي سهلة", "تقييمات وتوصيات للسوشي"],
        '☕': ["أفضل المقاهي القريبة", "طرق تحضير القهوة المنزلية", "أنواع حبوب القهوة"],
        '🍩': ["محلات حلويات قريبة", "وصفات دونات منزلية", "حلويات للحفلات"],
        '🚗': ["نصائح صيانة السيارة", "محلات تغيير الزيت", "تأجير سيارات محلي"],
        '✈️': ["حجز طيران رخيص", "متطلبات السفر", "أفضل وجهات السفر"],
        '🏨': ["فنادق موصى بها", "عروض الحجز", "تقييمات الإقامة"],
        '🏖️': ["شواطئ قريبة للعائلة", "أنشطة مائية", "نصائح السلامة على الشاطئ"],
        '⚽': ["نتائج المباريات", "جدول البطولات", "أخبار الفرق"],
        '🎮': ["أحدث الألعاب", "مراجعات ألعاب", "عروض خاصة على الألعاب"],
        '📱': ["أحدث الهواتف", "مقارنات الموديلات", "عروض شراء الهواتف"],
        '💻': ["أفضل الحواسيب المحمولة", "نصائح صيانة الكمبيوتر", "عروض الهاردوير"],
        '📚': ["مقترحات للقراءة", "ملخصات كتب مشهورة", "مكتبات ومصادر للكتب"],
        '🐶': ["تبني كلاب محليًا", "رعاية وتغذية الكلاب", "تدريب الكلاب للمبتدئين"],
        '🐱': ["رعاية القطط", "تطعيمات ونصائح صحية", "أطعمة مقترحة للقطط"],
        '🔥': ["تحذيرات حرائق", "نصائح السلامة من الحريق", "معدات إطفاء موصى بها"],
        '🎉': ["أفكار حفلات", "ديكورات احتفالية", "قوائم تشغيل للحفلات"],
        '🎂': ["محلات كيك مميزة", "وصفات كيك منزلية", "تزيين الكيك بسهولة"],
        '💊': ["معلومات عن الأدوية", "متى تزور الطبيب", "نصائح عامة للصحة"],
        '🩺': ["عيادات قريبة", "نصائح طبية عامة", "كيفية الوقاية من الأمراض"],
        '🔎': ["بحث بالإيموجي — أمثلة", "كيفية استخدام الإيموجي للبحث", "أمثلة بحثية مفيدة"],
        '🏠': ["خدمات عقارية محلية", "نصائح لتزيين المنزل", "صيانة منزلية أساسية"]
    };

    if (manualMap[base]) return manualMap[base].slice();

    // simple heuristics by categories
    const food = ['🍔','🍕','🍣','🍜','🍩','🍪','🥐','🍳','🌶️','🧂','🥩','🍤','🍟','🌭','🥪','🌮','🌯','🥗','🥘','🍝','🍱','🍛','🍲','🍰','☕','🍵','🍺','🍷','🍎','🍇','🍌','🥑','🍓','🍉','🍒','🍍','🥝','🍅','🍆','🥦','🥬','🌽','🥕'];
    const transport = ['🚗','✈️','🚆','🚲','🚌','🚤','🚀','🛳️','🚢'];
    const travel = ['🗺️','🏨','🏖️','🏔️','🏕️','🏝️','🏞️','🏟️','🏛️','🏗️','🏭','🏢','🏬'];
    const sports = ['⚽','🏀','🏈','🎾','🏊','🏐','🏉','🎱','🏓','🏸'];
    const animals = ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐵','🐸','🐔','🐧','🐦'];

    if (food.includes(base)) return [
        `وصفات ${base} شهية`,
        `مطاعم تقدم ${base} بالقرب منك`,
        `طرق إعداد ${base} في المنزل`
    ];
    if (transport.includes(base)) return [
        `حجوزات ومعلومات عن ${base}`,
        `نصائح للسفر باستخدام ${base}`,
        `خدمات وتأجير ${base}`
    ];
    if (travel.includes(base)) return [
        `دليل السفر المتعلق بـ ${base}`,
        `أفضل الأنشطة في ${base}`,
        `حجوزات وإقامة في ${base}`
    ];
    if (sports.includes(base)) return [
        `أخبار ومباريات ${base}`,
        `أماكن لممارسة ${base}`,
        `معلومات وبطولات ${base}`
    ];
    if (animals.includes(base)) return [
        `رعاية ${base}`,
        `تبني ${base}`,
        `معلومات عن ${base}`
    ];

    // fallback
    return [`معلومات عن ${base}`, `اقتراحات مرتبطة بـ ${base}`, `دليل ${base} — أماكن ووصفات ونصائح`];
}

// محاولة تحميل القاعدة من ملف JSON محلي
async function loadEmojiDatabase() {
    try {
        const res = await fetch('emojiDatabase.json');
        if (!res.ok) throw new Error('Failed to fetch');
        emojiDatabase = await res.json();
        // If there's a separate additions file, merge it in so the picker includes everything
        try {
            const addRes = await fetch('emoji_additions.json');
            if (addRes.ok) {
                const additions = await addRes.json();
                for (const k in additions) {
                    if (!emojiDatabase[k]) emojiDatabase[k] = additions[k];
                    else if (Array.isArray(emojiDatabase[k]) && Array.isArray(additions[k])) {
                        emojiDatabase[k] = Array.from(new Set([...emojiDatabase[k], ...additions[k]]));
                    }
                }
            }
        } catch (e) {
            console.warn('emoji_additions.json not available — continuing');
        }
        // build base index to aggregate suggestions for keys like "🍔_180" and base "🍔"
        emojiBaseIndex = {};
        const placeholderRe = /اقتراح\s*\d+/i;
        for (const key in emojiDatabase) {
            const base = key.replace(/_(\d+)$/, '');
            if (!emojiBaseIndex[base]) emojiBaseIndex[base] = new Set();
            const suggestions = Array.isArray(emojiDatabase[key]) ? emojiDatabase[key] : [];
            // if the suggestions look like placeholders, generate realistic ones
            const looksPlaceholder = suggestions.length > 0 && suggestions.every(s => placeholderRe.test(s) || (typeof s === 'string' && s.includes(key)));
            const finalList = looksPlaceholder ? generateSuggestionsFor(base) : suggestions;
            finalList.forEach(s => emojiBaseIndex[base].add(s));
        }
        // convert sets to arrays
        for (const b in emojiBaseIndex) emojiBaseIndex[b] = Array.from(emojiBaseIndex[b]);
        console.log('emojiDatabase loaded, keys:', Object.keys(emojiDatabase).length);
    } catch (err) {
        console.error('تعذر تحميل emojiDatabase.json، سيتم استخدام قاعدة افتراضية بسيطة', err);
        // قاعدة بديلة بسيطة إذا فشل التحميل
        emojiDatabase = {
            '🍔': ['أفضل مطاعم البرجر', 'وصفات برجر صحية', 'أخبار الوجبات السريعة'],
            '📚': ['ملخصات كتب عالمية', 'مواقع تحميل كتب مجانية', 'مكتبات عامة قريبة']
        };
        emojiBaseIndex = {};
        for (const k in emojiDatabase) emojiBaseIndex[k] = emojiDatabase[k].slice();
    }
}

function showSuggestions() {
    const inputElement = document.getElementById('searchInput');
    const suggestionsList = document.getElementById('suggestions');
    const currentInput = inputElement.value.trim();

    // مسح جميع الاقتراحات من القائمة
    suggestionsList.innerHTML = '';

    if (!currentInput) return;
    // استخراج أي إيموجي موجود في المدخل (يدعم تسلسلات ZWJ)
    const emojiRegex = /\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*/gu;
    const found = Array.from(currentInput.matchAll(emojiRegex)).map(m => m[0]);

    if (found.length > 0) {
        // إذا أدخل المستخدم أكثر من إيموجي واحد — أنشئ اقتراحات ذكية مدمجة
        if (found.length >= 2) {
            const bases = found.map(e => e); // user input emojis are already base form
            const suggestionsArrays = bases.map(b => emojiBaseIndex[b] || []);

            // Score & rank candidates for multi-emoji input to pick the best result
            const counts = {}; // suggestion -> how many arrays it appears in
            const allCandidates = new Set();
            suggestionsArrays.forEach(arr => {
                const seen = new Set();
                arr.forEach(s => {
                    allCandidates.add(s);
                    if (!seen.has(s)) {
                        counts[s] = (counts[s] || 0) + 1;
                        seen.add(s);
                    }
                });
            });

            // intersection = items present in all arrays
            const intersection = Array.from(allCandidates).filter(s => counts[s] === suggestionsArrays.length);

            // Generate combined template suggestions (higher priority than single items)
            const templates = [
                (a, b, eA, eB) => `دليل ${eA} و ${eB} — ${a} و ${b}` ,
                (a, b, eA, eB) => `${a} مع ${b} — أفضل الأماكن والوصفات`,
                (a, b, eA, eB) => `أماكن ${eA} و ${eB} الموصى بها: ${a}، ${b}`,
                (a, b, eA, eB) => `${a} و ${b}`
            ];
            const combinedTemplates = [];
            const topLists = suggestionsArrays.map(arr => arr.slice(0, 2));
            for (let i = 0; i < topLists[0].length; i++) {
                for (let j = 0; j < topLists[1].length; j++) {
                    const a = topLists[0][i] || '';
                    const b = topLists[1][j] || '';
                    templates.forEach((t, idx) => {
                        const s = t(a, b, bases[0], bases[1]);
                        if (s && s.trim()) combinedTemplates.push({ text: s, templateIndex: idx });
                    });
                }
            }

            // Build scored list
            const scored = [];
            // include intersection (very high score)
            intersection.forEach(s => {
                const score = 200 + (10 * counts[s]) - Math.min(30, s.length);
                scored.push({ text: s, score });
            });
            // include combined templates (good score)
            combinedTemplates.forEach((ct, i) => {
                const score = 120 - (ct.templateIndex * 5) - Math.min(20, ct.text.length / 2);
                scored.push({ text: ct.text, score });
            });
            // include single candidates ranked by frequency across arrays
            Array.from(allCandidates).forEach(s => {
                const baseScore = (counts[s] || 0) * 30;
                const lenBonus = Math.max(0, 10 - Math.floor(s.length / 6));
                const score = baseScore + lenBonus;
                scored.push({ text: s, score });
            });

            // dedupe by keeping highest score per text
            const bestMap = {};
            scored.forEach(item => {
                if (!bestMap[item.text] || item.score > bestMap[item.text].score) bestMap[item.text] = item;
            });
            const ranked = Object.values(bestMap).sort((a, b) => b.score - a.score).map(x => x.text);

            // show ranked suggestions, highlighting top result
            renderSuggestions(ranked.slice(0, 30), inputElement, suggestionsList, true);
            return;
        }

        // إذا وجد إيموجي مفرد فعّال: استخدم قاعدة الاقتراحات المجمّعة من المفاتيح المتعددة
        const single = found[0];
        const suggestions = emojiBaseIndex[single] || emojiDatabase[single] || [];
        if (suggestions && suggestions.length) {
            renderSuggestions(suggestions.slice(0, 30), inputElement, suggestionsList);
            return;
        }
    }

    // مرونة إضافية: إذا كتب المستخدم نصاً (ليس إيموجي)، ابحث ضمن الاقتراحات النصية
    const results = new Set();
    const q = currentInput.toLowerCase();
    for (const base in emojiBaseIndex) {
        const suggestions = emojiBaseIndex[base] || [];
        suggestions.forEach(s => {
            if (s.toLowerCase().includes(q)) results.add(s);
        });
        if (results.size >= 30) break; // حد معقول للنتائج
    }

    if (results.size > 0) {
        renderSuggestions(Array.from(results).slice(0, 30), inputElement, suggestionsList);
    }
}

function renderSuggestions(suggestions, inputElement, suggestionsList, highlightTop = false) {
    // clear existing and add new suggestion items with staggered reveal
    suggestionsList.innerHTML = '';
    suggestions.forEach((suggestion, idx) => {
        const listItem = document.createElement('li');
        listItem.className = 'suggestion-item';
        listItem.textContent = suggestion;
        if (highlightTop && idx === 0) {
            listItem.classList.add('best-suggestion');
            const badge = document.createElement('span');
            badge.textContent = ' (أفضل نتيجة)';
            badge.className = 'best-badge';
            listItem.appendChild(badge);
        }
        listItem.onclick = function() {
            inputElement.value = suggestion;
            suggestionsList.innerHTML = '';
        };
        suggestionsList.appendChild(listItem);

        // staggered reveal animation
        // small timeout to allow element to be inserted into DOM first
        setTimeout(() => {
            try { listItem.classList.add('reveal'); } catch (e) { /* ignore if removed */ }
        }, idx * 60 + 40);
    });
}

// تحميل القاعدة عند تهيئة الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    const emojiPickerBtn = document.getElementById('emoji-picker-btn');
    const emojiPickerContainer = document.getElementById('emoji-picker-container');
    const searchInput = document.getElementById('searchInput');

    // add a loading state then flip to ready when DB loaded
    document.body.classList.add('app-loading');
    await loadEmojiDatabase();
    populateEmojiPicker();
    // small delay to make the entrance feel smoother
    requestAnimationFrame(() => setTimeout(() => document.body.classList.add('app-ready'), 60));

    // Show loading screen until initialization finishes, then fade-out & reveal container
    try {
        const loadingScreen = document.getElementById('loading-screen');
        const container = document.querySelector('.container');
        const prefersReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Keep the loading screen visible at least this long (ms)
        const minVisible = prefersReduce ? 80 : 700;

        // when DB and UI are ready, hide overlay then reveal content
        const finishAfterReady = async () => {
            // ensure the overlay stays visible for the minVisible time
            await new Promise(res => setTimeout(res, minVisible));

            if (loadingScreen) {
                if (prefersReduce) {
                    loadingScreen.remove();
                    if (container) container.classList.add('is-visible');
                } else {
                    loadingScreen.classList.add('hidden');
                    // wait for the fade-out transition to finish
                    const onFinish = () => {
                        try { loadingScreen.remove(); } catch(e){/*ignore*/}
                        if (container) container.classList.add('is-visible');
                    };
                    loadingScreen.addEventListener('transitionend', onFinish, { once: true });

                    // safety fallback: if transition doesn't fire, reveal after 1300ms
                    setTimeout(() => {
                        if (document.body.contains(loadingScreen)) {
                            loadingScreen.remove();
                            if (container) container.classList.add('is-visible');
                        }
                    }, 1400);
                }
            } else {
                if (container) container.classList.add('is-visible');
            }
        };

        // call the finalization after UI/database ready
        finishAfterReady();

    } catch (e) { /* ignore if container/overlay missing */ }

    function populateEmojiPicker() {
        // clear previous contents (if any)
        emojiPickerContainer.innerHTML = '';

        // take every top-level key and show each key as an individual picker item
        // (we normalize display to the emoji base, but keep items distinct so the picker
        // can show many entries; if there are fewer than targetCount, we repeat
        // entries with variant badges until we reach the target)
        const allKeys = Object.keys(emojiDatabase);
        const totalKeys = allKeys.length;
        // map keys -> visible base emoji (strip suffix) for display
        const entries = allKeys.map(k => ({ key: k, base: k.replace(/_(\d+)$/, '') }));

        // produce a unique set of base emoji sequences (strip suffixes) and use those
        const uniqueBases = Array.from(new Set(entries.map(e => e.base)));
        // choose a representative DB key for each base (first occurrence)
        const keyForBase = new Map();
        for (const e of entries) {
            if (!keyForBase.has(e.base)) keyForBase.set(e.base, e.key);
        }
        const itemsToRender = uniqueBases.map(base => ({ base, key: keyForBase.get(base) }));

        // debug: how many raw keys vs unique base sequences
        console.log('populateEmojiPicker — rawKeys:', totalKeys, 'uniqueBases:', itemsToRender.length);

        // group / sort items by category order so they appear in groups inside the picker
        function getCategoryIndex(base) {
            for (let i = 0; i < CATEGORY_ORDER.length; i++) {
                if (CATEGORY_ORDER[i].items.has(base)) return i;
            }
            return CATEGORY_ORDER.length - 1; // 'other'
        }

        itemsToRender.sort((a, b) => {
            const ai = getCategoryIndex(a.base);
            const bi = getCategoryIndex(b.base);
            if (ai !== bi) return ai - bi;
            // same category — sort by base string then by variant
            if (a.base < b.base) return -1;
            if (a.base > b.base) return 1;
            return (a.variant || 0) - (b.variant || 0);
        });

        // Render as grouped sections with headers (keeps the same items, different order)
        // We'll output one header per category only if there are items in that category
        const groups = {};
        for (let i = 0; i < CATEGORY_ORDER.length; i++) groups[i] = [];

        itemsToRender.forEach(item => {
            const catIdx = getCategoryIndex(item.base);
            groups[catIdx].push(item);
        });

        // append groups in defined order
        for (let i = 0; i < CATEGORY_ORDER.length; i++) {
            const list = groups[i];
            if (!list || list.length === 0) continue;
            // header
            const header = document.createElement('div');
            header.className = 'emoji-group-header';
            header.textContent = CATEGORY_ORDER[i].label;
            emojiPickerContainer.appendChild(header);

            // items
            list.forEach(item => {
                const emojiItem = document.createElement('span');
                emojiItem.className = 'emoji-item';
                emojiItem.textContent = item.base;
                emojiItem.dataset.dbKey = item.key;
                emojiItem.onclick = () => {
                    searchInput.value += item.base;
                    searchInput.focus();
                    showSuggestions();
                };
                emojiPickerContainer.appendChild(emojiItem);
            });
        }

        // (items in the last category of CATEGORY_ORDER are already included in the loop above)
    }

    function toggleEmojiPicker() {
        emojiPickerContainer.classList.toggle('visible');
    }

    emojiPickerBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevents the document click listener from firing immediately
        toggleEmojiPicker();
    });

    // Close picker when clicking outside
    document.addEventListener('click', (e) => {
        if (!emojiPickerContainer.contains(e.target) && emojiPickerContainer.classList.contains('visible')) {
            toggleEmojiPicker();
        }
    });

    // --- floating audio control (top-left) ---
    const floatingAudioBtn = document.getElementById('floating-audio-btn');
    const floatingAudioEl = document.getElementById('bg-audio');
    if (floatingAudioBtn && floatingAudioEl) {
        // lower default playback volume so song is quieter on play
        // Tweak this value (0.0 - 1.0) to taste
        try { floatingAudioEl.volume = 0.35; } catch(e) { /* ignore if not supported */ }
        // toggle play/pause
        function setPlayingState(isPlaying) {
            if (isPlaying) {
                floatingAudioBtn.classList.add('playing');
                floatingAudioBtn.setAttribute('aria-pressed','true');
            } else {
                floatingAudioBtn.classList.remove('playing');
                floatingAudioBtn.setAttribute('aria-pressed','false');
            }
        }

        floatingAudioBtn.addEventListener('click', (ev) => {
            ev.preventDefault();
            // lazy load: ensure audio will be allowed to play when clicked
            if (floatingAudioEl.paused) {
                floatingAudioEl.play().then(() => setPlayingState(true)).catch(()=>{/* autoplay blocked until user interaction */});
            } else {
                floatingAudioEl.pause();
                setPlayingState(false);
            }
        });

        // reflect audio element events into UI
        floatingAudioEl.addEventListener('play', () => setPlayingState(true));
        floatingAudioEl.addEventListener('pause', () => setPlayingState(false));
        floatingAudioEl.addEventListener('ended', () => setPlayingState(false));
    }
});