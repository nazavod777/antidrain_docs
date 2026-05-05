require([
    'gitbook',
    'jquery'
], function(gitbook, $) {
    var MAX_RESULTS = 15;
    var MAX_SNIPPET_LENGTH = 180;
    var SEARCH_DELAY = 120;
    var pageCache = {};
    var searchTimer = null;
    var searchRun = 0;
    var isOpen = false;
    var CYRILLIC_MAP = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
    };

    function labels(query) {
        var path = window.location.pathname;
        var isRussian = path.indexOf('/ru/') !== -1 || /[а-яё]/i.test(query || '');

        if (isRussian) {
            return {
                search: 'Поиск по документации',
                placeholder: 'Поиск по документации…',
                close: 'Закрыть',
                emptyTitle: 'Начните вводить запрос',
                emptyText: 'Ищите по названию статьи, разделу или точному слову из инструкции.',
                loading: 'Ищем…',
                noResults: 'Ничего не найдено',
                found: 'Найдено',
                results: 'результатов',
                section: 'Где найдено',
                link: 'Ссылка',
                shortcut: 'ESC'
            };
        }

        return {
            search: 'Search Documentation',
            placeholder: 'Search documentation…',
            close: 'Close',
            emptyTitle: 'Start Typing',
            emptyText: 'Search by article title, section, or an exact word from the guide.',
            loading: 'Searching…',
            noResults: 'No Results Found',
            found: 'Found',
            results: 'results',
            section: 'Found In',
            link: 'Link',
            shortcut: 'ESC'
        };
    }

    function bindSearchPolish() {
        var $input = $('#book-search-input input');

        ensurePalette();
        syncLabels();
        hideDefaultResults();

        $input.attr({
            'aria-label': labels().search,
            'autocomplete': 'off',
            'name': 'docs-search',
            'placeholder': labels().placeholder,
            'spellcheck': 'false'
        });

        $input
            .off('focus.searchPolish click.searchPolish keydown.searchPolish')
            .on('focus.searchPolish click.searchPolish', function() {
                openPalette($(this).val());
            })
            .on('keydown.searchPolish', function(event) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    openPalette($(this).val());
                }
            });

        $(document)
            .off('keydown.searchPolishGlobal')
            .on('keydown.searchPolishGlobal', handleGlobalKeydown);

        openFromQueryString();
    }

    function ensurePalette() {
        if ($('.search-command').length > 0) return;

        var $palette = $('<div>', {
            'class': 'search-command',
            'aria-hidden': 'true'
        });
        var $backdrop = $('<div>', { 'class': 'search-command__backdrop' });
        var $dialog = $('<section>', {
            'class': 'search-command__dialog',
            'role': 'dialog',
            'aria-modal': 'true',
            'aria-labelledby': 'search-command-title'
        });
        var $label = $('<label>', {
            'class': 'search-command__label',
            'id': 'search-command-title',
            'for': 'search-command-input'
        }).text(labels().search);
        var $inputWrap = $('<div>', { 'class': 'search-command__input-wrap' });
        var $icon = $('<span>', {
            'class': 'search-command__icon',
            'aria-hidden': 'true'
        });
        var $input = $('<input>', {
            'class': 'search-command__input',
            'id': 'search-command-input',
            'type': 'search',
            'name': 'docs-command-search',
            'autocomplete': 'off',
            'spellcheck': 'false'
        });
        var $esc = $('<kbd>', { 'class': 'search-command__esc' });
        var $status = $('<div>', {
            'class': 'search-command__status',
            'aria-live': 'polite'
        });
        var $list = $('<div>', {
            'class': 'search-command__list',
            'role': 'listbox'
        });

        $inputWrap.append($icon, $input, $esc);
        $dialog.append($label, $inputWrap, $status, $list);
        $palette.append($backdrop, $dialog);
        $('body').append($palette);

        $backdrop.on('click.searchPolish', closePalette);
        $input.on('input.searchPolish', function() {
            scheduleSearch($(this).val());
        });
        $input.on('keydown.searchPolish', handlePaletteKeydown);
        $list.on('mousemove.searchPolish', '.search-command__result', function() {
            setActiveResult($(this));
        });
        $list.on('click.searchPolish', '.search-command__result', function() {
            closePalette();
        });
    }

    function syncLabels(query) {
        var l = labels(query);

        $('.search-command__label').text(l.search);
        $('.search-command__input').attr({
            'aria-label': l.search,
            'placeholder': l.placeholder
        });
        $('.search-command__esc').text(l.shortcut);
    }

    function hideDefaultResults() {
        $('body').removeClass('with-search search-loading');
        $('#book-search-results').removeClass('open no-results');
    }

    function openPalette(query) {
        ensurePalette();
        isOpen = true;

        var safeQuery = normalizeText(query || '');
        var $palette = $('.search-command');
        var $input = $('.search-command__input');

        syncLabels(safeQuery);
        $palette.addClass('is-open').attr('aria-hidden', 'false');
        $('body').addClass('with-search-command');
        $input.val(safeQuery);
        renderEmpty(safeQuery);

        setTimeout(function() {
            $input.focus();
            $input.get(0).setSelectionRange(safeQuery.length, safeQuery.length);
        }, 0);

        if (safeQuery) {
            scheduleSearch(safeQuery);
        }
    }

    function closePalette() {
        isOpen = false;
        clearTimeout(searchTimer);
        $('.search-command').removeClass('is-open').attr('aria-hidden', 'true');
        $('body').removeClass('with-search-command');
        $('#book-search-input input').val('');
        hideDefaultResults();
    }

    function handleGlobalKeydown(event) {
        var key = event.key;
        var target = event.target;
        var isTyping = /input|textarea|select/i.test(target.tagName) || target.isContentEditable;
        var isShortcut = (event.metaKey || event.ctrlKey) && key.toLowerCase() === 'k';

        if (key === 'Escape' && isOpen) {
            event.preventDefault();
            closePalette();
            return;
        }

        if (isShortcut || (!isTyping && key === '/')) {
            event.preventDefault();
            openPalette('');
        }
    }

    function handlePaletteKeydown(event) {
        if (event.key === 'Escape') {
            event.preventDefault();
            closePalette();
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            moveActiveResult(1);
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            moveActiveResult(-1);
            return;
        }

        if (event.key === 'Enter') {
            var $active = $('.search-command__result.is-active').first();
            if ($active.length > 0) {
                event.preventDefault();
                window.location.href = $active.attr('href');
                closePalette();
            }
        }
    }

    function scheduleSearch(query) {
        var safeQuery = normalizeText(query);

        syncLabels(safeQuery);
        clearTimeout(searchTimer);

        if (!safeQuery) {
            renderEmpty(safeQuery);
            return;
        }

        renderLoading(safeQuery);
        searchTimer = setTimeout(function() {
            runSearch(safeQuery);
        }, SEARCH_DELAY);
    }

    function runSearch(query) {
        var currentRun = ++searchRun;

        if (!gitbook.search || !gitbook.search.isInitialized()) {
            setTimeout(function() {
                if (isOpen) runSearch(query);
            }, 120);
            return;
        }

        gitbook.search.query(query, 0, MAX_RESULTS).then(function(response) {
            if (currentRun !== searchRun || !isOpen) return;

            var results = response.results || [];
            if (results.length === 0) {
                renderNoResults(query);
                return;
            }

            renderResults(query, results);
            enrichResults(query, results, currentRun);
        });
    }

    function renderEmpty(query) {
        var l = labels(query);
        var $status = $('.search-command__status');
        var $list = $('.search-command__list');

        $status.empty();
        $list.empty().append(
            $('<div>', { 'class': 'search-command__empty' }).append(
                $('<strong>').text(l.emptyTitle),
                $('<span>').text(l.emptyText)
            )
        );
    }

    function renderLoading(query) {
        var l = labels(query);

        $('.search-command__status').text(l.loading);
        $('.search-command__list').empty().append(
            $('<div>', { 'class': 'search-command__empty' }).append(
                $('<span>').text(l.loading)
            )
        );
    }

    function renderNoResults(query) {
        var l = labels(query);

        $('.search-command__status').text(l.noResults + ' "' + query + '"');
        $('.search-command__list').empty().append(
            $('<div>', { 'class': 'search-command__empty' }).append(
                $('<strong>').text(l.noResults),
                $('<span>').text('"' + query + '"')
            )
        );
    }

    function renderResults(query, results) {
        var l = labels(query);
        var $list = $('.search-command__list').empty();

        $('.search-command__status').text(l.found + ' ' + results.length + ' ' + l.results);

        results.forEach(function(result, index) {
            var href = gitbook.state.basePath + '/' + result.url;
            var card = {
                title: result.title,
                href: href,
                path: displayPath(href),
                breadcrumb: displayBreadcrumb(href, result.title),
                section: result.title,
                snippet: makeSnippet(result.body, query),
                query: query
            };
            var $result = buildResult(card, index);

            if (index === 0) $result.addClass('is-active');
            $list.append($result);
        });
    }

    function enrichResults(query, results, runId) {
        results.forEach(function(result, index) {
            var href = gitbook.state.basePath + '/' + result.url;

            loadPageMatch(href, query, result.title).then(function(match) {
                var $item = $('.search-command__result').eq(index);
                if (runId !== searchRun || !isOpen || $item.length === 0 || $item.attr('data-query') !== query) return;

                if (match) {
                    $item.replaceWith(buildResult({
                        title: result.title,
                        href: match.href,
                        path: displayPath(match.href),
                        breadcrumb: displayBreadcrumb(match.href, result.title, match.section),
                        section: match.section,
                        snippet: match.snippet,
                        query: query
                    }, index, $item.hasClass('is-active')));
                }
            });
        });
    }

    function buildResult(card, index, isActive) {
        var $result = $('<a>', {
            'class': 'search-command__result',
            'href': card.href,
            'role': 'option',
            'data-query': card.query,
            'data-index': index
        });
        var $icon = $('<span>', { 'class': 'search-command__result-icon', 'aria-hidden': 'true' }).text('#');
        var $content = $('<span>', { 'class': 'search-command__result-content' });
        var $breadcrumb = $('<span>', { 'class': 'search-command__result-breadcrumb' }).text(card.breadcrumb || card.path);
        var $title = $('<span>', { 'class': 'search-command__result-title' }).text(card.title);
        var $snippet = $('<span>', { 'class': 'search-command__result-snippet' });
        var $url = $('<span>', { 'class': 'search-command__result-url' }).text(card.path);

        if (isActive) $result.addClass('is-active');

        appendHighlighted($snippet, card.snippet, card.query);
        $content.append($breadcrumb, $title, $snippet, $url);

        $result.append($icon, $content);
        return $result;
    }

    function setActiveResult($item) {
        $('.search-command__result').removeClass('is-active');
        $item.addClass('is-active');
    }

    function moveActiveResult(direction) {
        var $items = $('.search-command__result');
        if ($items.length === 0) return;

        var current = $items.index($('.search-command__result.is-active').first());
        var next = current + direction;

        if (current === -1) next = direction > 0 ? 0 : $items.length - 1;
        if (next < 0) next = $items.length - 1;
        if (next >= $items.length) next = 0;

        setActiveResult($items.eq(next));
        $items.eq(next).get(0).scrollIntoView({ block: 'nearest' });
    }

    function openFromQueryString() {
        var query = getParameterByName('q');
        if (query) {
            openPalette(query);
        }
    }

    function loadPageMatch(href, query, title) {
        var cleanHref = href.split('#')[0];

        if (!pageCache[cleanHref]) {
            pageCache[cleanHref] = $.get(cleanHref).then(function(html) {
                return parsePage(html);
            }, function() {
                return null;
            });
        }

        return pageCache[cleanHref].then(function(page) {
            if (!page) return null;
            return findMatch(page, cleanHref, query, title);
        });
    }

    function parsePage(html) {
        var doc = document.implementation.createHTMLDocument('');
        var $root;

        doc.documentElement.innerHTML = html;
        $root = $(doc).find('.markdown-section').first();
        normalizeParsedHeadingIds($root);

        return {
            $root: $root
        };
    }

    function normalizeParsedHeadingIds($root) {
        var usedIds = {};
        var aliases = {};

        $root.find('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]').each(function() {
            var $heading = $(this);
            var originalId = $heading.attr('id');
            var nextId = originalId;

            if (containsNonAscii(originalId)) {
                nextId = uniqueSlug(slugify($.trim($heading.text())), usedIds);
                aliases[originalId] = nextId;
                $heading.attr('id', nextId);
            } else {
                usedIds[nextId] = true;
            }
        });

        $root.find('a[href^="#"]').each(function() {
            var $link = $(this);
            var id = getIdFromHash($link.attr('href'));
            var nextId = aliases[id];

            if (nextId) {
                $link.attr('href', '#' + encodeURIComponent(nextId));
            }
        });
    }

    function uniqueSlug(baseSlug, usedIds) {
        var slug = baseSlug || 'section';
        var nextSlug = slug;
        var index = 2;

        while (usedIds[nextSlug]) {
            nextSlug = slug + '-' + index;
            index += 1;
        }

        usedIds[nextSlug] = true;
        return nextSlug;
    }

    function slugify(value) {
        var text = String(value || '').toLowerCase();
        var converted = '';
        var index;
        var character;

        for (index = 0; index < text.length; index += 1) {
            character = text.charAt(index);
            converted += CYRILLIC_MAP.hasOwnProperty(character) ? CYRILLIC_MAP[character] : character;
        }

        if (converted.normalize) {
            converted = converted.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
        }

        return converted
            .replace(/&/g, '-and-')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    function containsNonAscii(value) {
        return /[^\x00-\x7F]/.test(String(value || ''));
    }

    function getIdFromHash(hash) {
        var id = String(hash || '').replace(/^#/, '');

        try {
            return decodeURIComponent(id);
        } catch (error) {
            return id;
        }
    }

    function findMatch(page, cleanHref, query, title) {
        var $root = page.$root;
        var $candidates = $root.find('h1, h2, h3, h4, p, li, td, th, blockquote');
        var terms = getSearchTerms(query);
        var element = null;

        $candidates.each(function() {
            var text = normalizeText($(this).text()).toLowerCase();
            if (!element && matchesQuery(text, terms)) {
                element = this;
            }
        });

        if (!element) return null;

        var heading = nearestHeading(element, $root);
        var headingText = heading ? normalizeText($(heading).text()) : title;
        var anchor = heading && $(heading).attr('id') ? '#' + encodeURIComponent($(heading).attr('id')) : '';
        var text = normalizeText($(element).text());

        return {
            href: cleanHref + anchor,
            section: headingText,
            snippet: makeSnippet(text, query)
        };
    }

    function nearestHeading(element, $root) {
        if (/^H[1-6]$/.test(element.tagName)) return element;

        var nearest = null;
        $root.find('h1[id], h2[id], h3[id], h4[id]').each(function() {
            var position = this.compareDocumentPosition(element);
            if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
                nearest = this;
            }
        });

        return nearest;
    }

    function matchesQuery(text, terms) {
        for (var i = 0; i < terms.length; i += 1) {
            if (text.indexOf(terms[i].toLowerCase()) !== -1) return true;
        }

        return false;
    }

    function makeSnippet(text, query) {
        text = normalizeText(text);
        if (!text) return '';

        var lower = text.toLowerCase();
        var terms = getSearchTerms(query);
        var index = -1;
        var term = '';

        for (var i = 0; i < terms.length; i += 1) {
            var nextIndex = lower.indexOf(terms[i].toLowerCase());
            if (nextIndex !== -1 && (index === -1 || nextIndex < index)) {
                index = nextIndex;
                term = terms[i];
            }
        }

        if (index === -1) {
            return trimToLength(text, MAX_SNIPPET_LENGTH);
        }

        var start = Math.max(0, index - 70);
        var end = Math.min(text.length, index + term.length + 100);
        var snippet = text.slice(start, end);

        if (start > 0) snippet = '…' + snippet;
        if (end < text.length) snippet += '…';

        return snippet;
    }

    function appendHighlighted($target, text, query) {
        var terms = getSearchTerms(query);
        var pattern = [];

        terms.forEach(function(term) {
            if (term.length > 1) pattern.push(escapeRegExp(term));
        });

        if (pattern.length === 0) {
            $target.text(text);
            return;
        }

        var regex = new RegExp('(' + pattern.join('|') + ')', 'gi');
        var parts = text.split(regex);

        parts.forEach(function(part) {
            if (!part) return;
            if (regex.test(part)) {
                $('<mark>').text(part).appendTo($target);
            } else {
                $target.append(document.createTextNode(part));
            }
            regex.lastIndex = 0;
        });
    }

    function getSearchTerms(query) {
        var terms = [];
        var trimmed = normalizeText(query);
        var words = trimmed.split(/\s+/);

        if (trimmed.length > 1) terms.push(trimmed);
        words.forEach(function(word) {
            if (word.length > 1 && terms.indexOf(word) === -1) {
                terms.push(word);
            }
        });

        return terms;
    }

    function displayPath(href) {
        var link = document.createElement('a');
        link.href = href;

        var path = decodeURIComponent(link.pathname || '').replace(/^\/+/, '');
        if (!path) path = 'README';
        if (link.hash) path += decodeURIComponent(link.hash);

        return path;
    }

    function displayBreadcrumb(href, title, section) {
        var link = document.createElement('a');
        link.href = href;

        var parts = decodeURIComponent(link.pathname || '')
            .replace(/^\/+/, '')
            .replace(/\.html$/, '')
            .split('/')
            .filter(Boolean)
            .map(function(part) {
                if (part === 'ru') return 'Русский';
                if (part === 'en') return 'English';
                if (part === 'index') return 'AntiDrain Docs';
                return titleCase(part.replace(/-/g, ' '));
            });

        if (parts.length === 0) parts.push('AntiDrain Docs');
        if (title && parts.indexOf(title) === -1) parts.push(title);
        if (section && section !== title && parts.indexOf(section) === -1) parts.push(section);

        return parts.join(' > ');
    }

    function titleCase(text) {
        return normalizeText(text).replace(/\b[a-z]/g, function(letter) {
            return letter.toUpperCase();
        });
    }

    function getParameterByName(name) {
        var url = window.location.href;
        name = name.replace(/[\[\]]/g, '\\$&');
        var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)', 'i');
        var results = regex.exec(url);

        if (!results) return null;
        if (!results[2]) return '';

        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }

    function normalizeText(text) {
        return $.trim(String(text || '').replace(/\s+/g, ' '));
    }

    function trimToLength(text, length) {
        if (text.length <= length) return text;
        return text.slice(0, length).replace(/\s+\S*$/, '') + '…';
    }

    function escapeRegExp(text) {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    gitbook.events.bind('page.change', bindSearchPolish);
    gitbook.events.bind('search.ready', bindSearchPolish);
});
