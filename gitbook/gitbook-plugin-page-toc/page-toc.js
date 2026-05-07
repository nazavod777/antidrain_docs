require(['gitbook', 'jquery'], function(gitbook, $) {
    var ACTIVE_CLASS = 'is-active';
    var TOC_SELECTOR = '.page-toc';
    var CONTENT_SELECTOR = '.markdown-section';
    var HEADING_SELECTOR = 'h2[id], h3[id]';
    var SCROLL_SELECTOR = '.body-inner, .book-body';
    var MIN_HEADINGS = 2;
    var TOP_OFFSET = 88;
    var ACTIVE_OFFSET = TOP_OFFSET + 12;
    var clickedActiveId = null;
    var headingIdAliases = {};
    var CYRILLIC_MAP = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
    };

    function getTitle() {
        var path = window.location.pathname;
        return path.indexOf('/ru/') !== -1 ? 'НА ЭТОЙ СТРАНИЦЕ' : 'ON THIS PAGE';
    }

    function removeToc() {
        $(TOC_SELECTOR).remove();
    }

    function buildToc() {
        removeToc();

        var $content = $(CONTENT_SELECTOR).first();
        if ($content.length === 0) return;

        normalizeHeadingIds($content);

        var $headings = $content.find(HEADING_SELECTOR).filter(function() {
            return $.trim($(this).text()).length > 0;
        });

        if ($headings.length < MIN_HEADINGS) return;

        var $toc = $('<aside class="page-toc" aria-label="' + getTitle() + '"></aside>');
        var $title = $('<div class="page-toc__title"></div>').text(getTitle());
        var $nav = $('<nav class="page-toc__nav"></nav>');
        var $list = $('<ol class="page-toc__list"></ol>');

        $headings.each(function() {
            var heading = this;
            var $heading = $(heading);
            var level = heading.tagName.toLowerCase();
            var id = $heading.attr('id');
            var text = $.trim($heading.text());
            var $item = $('<li class="page-toc__item"></li>').addClass('page-toc__item--' + level);
            var $link = $('<a class="page-toc__link"></a>')
                .attr('href', encodeHash(id))
                .text(text);

            $item.append($link);
            $list.append($item);
        });

        $nav.append($list);
        $toc.append($title, $nav);
        $('.book-body').append($toc);

        bindActiveHeadingEvents();
        bindTocClicks();
        normalizeCurrentHash();
        scrollToInitialHash();
        updateActiveHeading();
    }

    function normalizeHeadingIds($content) {
        var usedIds = {};

        headingIdAliases = {};

        $content.find('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]').each(function() {
            var $heading = $(this);
            var originalId = $heading.attr('id');
            var nextId = originalId;

            if (containsNonAscii(originalId)) {
                nextId = uniqueSlug(slugify($.trim($heading.text())), usedIds);
                headingIdAliases[originalId] = nextId;
                $heading.attr('id', nextId);
            } else {
                usedIds[nextId] = true;
            }
        });

        $content.find('a[href^="#"]').each(function() {
            var $link = $(this);
            var id = getIdFromHash($link.attr('href'));
            var nextId = headingIdAliases[id];

            if (nextId) {
                $link.attr('href', encodeHash(nextId));
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

    function bindActiveHeadingEvents() {
        $(window)
            .off('scroll.pageToc resize.pageToc hashchange.pageToc')
            .on('scroll.pageToc resize.pageToc', updateActiveHeading)
            .on('hashchange.pageToc', activateHashHeading);

        $(SCROLL_SELECTOR)
            .off('scroll.pageToc')
            .on('scroll.pageToc', updateActiveHeading);
    }

    function bindTocClicks() {
        $(TOC_SELECTOR)
            .off('click.pageToc', '.page-toc__link')
            .on('click.pageToc', '.page-toc__link', function(event) {
                var id = getIdFromHash($(this).attr('href'));
                var heading = document.getElementById(id);

                if (!heading) return;

                event.preventDefault();
                setActiveHeading(id);
                updateHash(id);
                scrollToHeading(heading, false, id);
            });
    }

    function scrollToInitialHash() {
        var id = resolveHeadingId(getIdFromHash(window.location.hash));
        var heading = id ? document.getElementById(id) : null;

        if (!heading) return;

        setTimeout(function() {
            scrollToHeading(heading, true, id);
            setActiveHeading(id);
        }, 0);
    }

    function scrollToHeading(heading, immediate, activeId) {
        var scroller = getScrollContainer();
        var targetTop = getTargetScrollTop(scroller, heading);
        var prefersReducedMotion = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var nextActiveId = activeId || $(heading).attr('id');

        clickedActiveId = nextActiveId;

        if (immediate || prefersReducedMotion) {
            scroller.scrollTop = targetTop;
            setActiveHeading(nextActiveId);
            return;
        }

        $(scroller).stop().animate({ scrollTop: targetTop }, 180, function() {
            setActiveHeading(nextActiveId);
        });
    }

    function getScrollContainer() {
        var bookBody = $('.book-body').get(0);
        var bodyInner = $('.body-inner').get(0);

        if (bookBody && bookBody.scrollHeight > bookBody.clientHeight) return bookBody;
        if (bodyInner && bodyInner.scrollHeight > bodyInner.clientHeight) return bodyInner;

        return bookBody || bodyInner || document.documentElement;
    }

    function getTargetScrollTop(scroller, heading) {
        var scrollerRect = scroller.getBoundingClientRect();
        var headingRect = heading.getBoundingClientRect();
        var nextTop = scroller.scrollTop + headingRect.top - scrollerRect.top - TOP_OFFSET;

        return Math.max(0, nextTop);
    }

    function updateActiveHeading() {
        var $toc = $(TOC_SELECTOR);
        if ($toc.length === 0) return;

        var activeId = null;
        var scroller = getScrollContainer();
        var $headings = $(CONTENT_SELECTOR).first().find(HEADING_SELECTOR);
        var isAtBottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4;

        if (clickedActiveId && isHeadingInView(document.getElementById(clickedActiveId), scroller)) {
            setActiveHeading(clickedActiveId);
            return;
        }

        clickedActiveId = null;

        if (isAtBottom && $headings.length > 0) {
            setActiveHeading($headings.last().attr('id'));
            return;
        }

        $headings.each(function() {
            if (this.getBoundingClientRect().top <= ACTIVE_OFFSET) {
                activeId = $(this).attr('id');
            }
        });

        if (!activeId) {
            activeId = $headings.first().attr('id');
        }

        setActiveHeading(activeId);
    }

    function activateHashHeading() {
        var id = resolveHeadingId(getIdFromHash(window.location.hash));
        var heading = id ? document.getElementById(id) : null;

        if (!heading) return;

        clickedActiveId = id;
        setActiveHeading(id);
    }

    function isHeadingInView(heading, scroller) {
        if (!heading) return false;

        var scrollerRect = scroller.getBoundingClientRect();
        var headingRect = heading.getBoundingClientRect();

        return headingRect.bottom >= scrollerRect.top + TOP_OFFSET &&
            headingRect.top <= scrollerRect.bottom;
    }

    function setActiveHeading(activeId) {
        var $toc = $(TOC_SELECTOR);

        $toc.find('.page-toc__link').removeClass(ACTIVE_CLASS);
        if (activeId) {
            $toc.find('.page-toc__link').filter(function() {
                return getIdFromHash($(this).attr('href')) === activeId;
            }).addClass(ACTIVE_CLASS);
        }
    }

    function getIdFromHash(hash) {
        var id = String(hash || '').replace(/^#/, '');

        try {
            return decodeURIComponent(id);
        } catch (error) {
            return id;
        }
    }

    function encodeHash(id) {
        return '#' + encodeURIComponent(id);
    }

    function resolveHeadingId(id) {
        var slug;

        if (headingIdAliases[id]) return headingIdAliases[id];

        if (containsNonAscii(id)) {
            slug = slugify(id);
            if (slug && document.getElementById(slug)) return slug;
        }

        return id;
    }

    function normalizeCurrentHash() {
        var id = getIdFromHash(window.location.hash);
        var nextId = resolveHeadingId(id);

        if (id && nextId && nextId !== id && history.replaceState) {
            history.replaceState(null, document.title, encodeHash(nextId));
        }
    }

    function updateHash(id) {
        if (!history.replaceState) return;
        history.replaceState(null, document.title, encodeHash(id));
    }

    gitbook.events.bind('page.change', buildToc);
});
