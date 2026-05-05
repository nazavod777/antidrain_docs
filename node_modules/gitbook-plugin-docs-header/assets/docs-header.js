require(['gitbook', 'jquery'], function(gitbook, $) {
    function assetPath(fileName) {
        return '/gitbook/gitbook-plugin-docs-header/' + fileName;
    }

    function rootHref() {
        var basePath = gitbook.state && gitbook.state.basePath ? gitbook.state.basePath : '.';
        return basePath === '.' ? 'index.html' : basePath + '/index.html';
    }

    function isRussianPage() {
        return window.location.pathname.indexOf('/ru/') !== -1;
    }

    function loadingLabel() {
        return isRussianPage() ? 'Загружаем страницу…' : 'Loading page…';
    }

    function setIconLink(rel, href, sizes) {
        var selector = 'link[rel="' + rel + '"]';
        var $link = $(selector).first();

        if ($link.length === 0) {
            $link = $('<link>', { rel: rel });
            $('head').append($link);
        }

        $link.attr('href', href);
        if (sizes) {
            $link.attr('sizes', sizes);
        }
    }

    function bindFavicon() {
        setIconLink('icon', assetPath('favicon.ico'), '64x64');
        setIconLink('apple-touch-icon', assetPath('apple-touch-icon.png'));
    }

    function bindHeaderLogo() {
        var $header = $('.book-header').first();
        if ($header.length === 0) return;

        var title = isRussianPage() ? 'Главная AntiDrain Docs' : 'AntiDrain Docs home';
        var $link = $header.find('.docs-home-link').first();

        if ($link.length === 0) {
            $link = $('<a>', {
                'class': 'docs-home-link',
                'aria-label': title
            });

            $link.append(
                $('<span>', { 'class': 'docs-home-link__mark', 'aria-hidden': 'true' }).append(
                    $('<img>', {
                        src: assetPath('antidrain-mark.png'),
                        alt: '',
                        width: 28,
                        height: 28,
                        draggable: false
                    })
                ),
                $('<span>', { 'class': 'docs-home-link__text' }).text('AntiDrain')
            );

            $header.prepend($link);
        }

        $link.attr({
            href: rootHref(),
            title: title,
            'aria-label': title
        });
        $link.find('img').attr('src', assetPath('antidrain-mark.png'));
    }

    function bindSearchShortcut() {
        var $search = $('#book-search-input');
        if ($search.length === 0 || $search.find('.docs-search-shortcut').length > 0) return;

        var $shortcut = $('<span>', {
            'class': 'docs-search-shortcut',
            'aria-hidden': 'true'
        });

        $shortcut.append($('<kbd>').text('Ctrl'), $('<kbd>').text('K'));
        $search.append($shortcut);
    }

    function bindSocialLinks() {
        var $header = $('.book-header').first();
        if ($header.length === 0) return;

        var $links = $header.find('.docs-social-links').first();
        if ($links.length === 0) {
            $links = $('<nav>', {
                'class': 'docs-social-links',
                'aria-label': 'Social links'
            });

            $links.append(
                socialLink('Telegram', 'https://t.me/bio_nazavod', null, null, null, 'telegram'),
                socialLink('X.com', 'https://x.com/nazavod777', null, null, null, 'x'),
                socialLink('AntiDrain', 'https://antidrain.me', null, null, assetPath('antidrain-mark.png'))
            );

            $header.append($links);
        }
    }

    function socialLink(label, href, iconClass, text, imageSrc, svgName) {
        var $link = $('<a>', {
            'class': 'docs-social-link',
            href: href,
            target: '_blank',
            rel: 'noopener noreferrer',
            title: label,
            'aria-label': label
        });

        if (imageSrc) {
            $link.addClass('docs-social-link--site').append($('<img>', {
                src: imageSrc,
                alt: '',
                width: 18,
                height: 18,
                draggable: false
            }));
            return $link;
        }

        if (svgName === 'telegram') {
            $link.append(svgIcon('telegram'));
            return $link;
        }

        if (svgName === 'x') {
            $link.append(svgIcon('x'));
            return $link;
        }

        if (iconClass) {
            $link.append($('<i>', {
                'class': iconClass,
                'aria-hidden': 'true'
            }));
            return $link;
        }

        $link.addClass('docs-social-link--text').append($('<span>', {
            'aria-hidden': 'true'
        }).text(text));

        return $link;
    }

    function svgIcon(name) {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');

        if (name === 'telegram') {
            path.setAttribute('d', 'M21.8 4.6 18.5 20c-.2 1.1-.9 1.4-1.8.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.3-8.4c.4-.4-.1-.6-.6-.2L5.9 13.5 1 12c-1-.3-1-1 .2-1.5L20.4 3.1c.9-.3 1.7.2 1.4 1.5Z');
        }

        if (name === 'x') {
            path.setAttribute('d', 'M18.9 2h3.3l-7.2 8.2L23.5 22h-6.6l-5.2-6.8L5.8 22H2.5l7.7-8.8L2 2h6.8l4.7 6.2L18.9 2Zm-1.2 17.9h1.8L7.8 4H5.9l11.8 15.9Z');
        }

        svg.appendChild(path);
        return svg;
    }

    function bindSidebarToggle() {
        var $toggle = $('.book-header .btn.pull-left.js-toolbar-action').filter(function() {
            return $(this).find('.fa-align-justify').length > 0;
        }).first();

        if ($toggle.length === 0) return;

        if ($toggle.find('.docs-sidebar-toggle__icon').length === 0) {
            $toggle.addClass('docs-sidebar-toggle');
            $toggle.find('.fa-align-justify').attr('aria-hidden', 'true');
            $toggle.append($('<span>', {
                'class': 'docs-sidebar-toggle__icon',
                'aria-hidden': 'true'
            }));

            $toggle.on('click.docsSidebarToggle', function() {
                window.setTimeout(syncSidebarToggle, 0);
                window.setTimeout(syncSidebarToggle, 220);
            });
        }

        syncSidebarToggle();
        bindSidebarObserver();
    }

    function bindSidebarObserver() {
        var book = $('.book').get(0);
        if (!book || book.__docsSidebarToggleObserver) return;

        book.__docsSidebarToggleObserver = new MutationObserver(syncSidebarToggle);
        book.__docsSidebarToggleObserver.observe(book, {
            attributes: true,
            attributeFilter: ['class']
        });

        $(window).off('resize.docsSidebarToggle').on('resize.docsSidebarToggle', syncSidebarToggle);
    }

    function syncSidebarToggle() {
        var $toggle = $('.book-header .docs-sidebar-toggle').first();
        if ($toggle.length === 0) return;

        var isOpen = $('.book').hasClass('with-summary');
        var label = isRussianPage()
            ? (isOpen ? 'Скрыть боковое меню' : 'Показать боковое меню')
            : (isOpen ? 'Hide Sidebar' : 'Show Sidebar');

        $toggle
            .toggleClass('docs-sidebar-toggle--open', isOpen)
            .toggleClass('docs-sidebar-toggle--closed', !isOpen)
            .attr({
                'aria-label': label,
                title: label
            });
    }

    function bindPageLoader() {
        var $loader = $('.docs-page-loader').first();

        if ($loader.length === 0) {
            $loader = $('<div>', {
                'class': 'docs-page-loader',
                'role': 'status',
                'aria-live': 'polite',
                'aria-label': loadingLabel(),
                hidden: true
            });

            $loader.append(
                $('<span>', { 'class': 'docs-page-loader__spinner', 'aria-hidden': 'true' }),
                $('<span>', { 'class': 'docs-page-loader__label' }).text(loadingLabel())
            );

            $('body').append($loader);
        }

        $loader.attr('aria-label', loadingLabel());
        $loader.find('.docs-page-loader__label').text(loadingLabel());
        bindPageLoaderObserver();
        syncPageLoader();
    }

    function bindPageLoaderObserver() {
        var book = $('.book').get(0);
        if (!book || book.__docsPageLoaderObserver) return;

        book.__docsPageLoaderObserver = new MutationObserver(syncPageLoader);
        book.__docsPageLoaderObserver.observe(book, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    function syncPageLoader() {
        var isLoading = $('.book').hasClass('is-loading');
        var $loader = $('.docs-page-loader').first();

        $('body').toggleClass('docs-page-loading', isLoading);

        if ($loader.length > 0) {
            $loader.prop('hidden', !isLoading);
        }
    }

    function bindPageNavigation() {
        $('.navigation').each(function() {
            var $link = $(this);
            var label = $link.attr('aria-label') || '';
            var isNext = $link.hasClass('navigation-next');
            var fallbackMeta = isRussianPage()
                ? (isNext ? 'Следующая страница' : 'Предыдущая страница')
                : (isNext ? 'Next Page' : 'Previous Page');
            var parsed = parseNavigationLabel(label, fallbackMeta);

            if ($link.find('.docs-page-nav__title').length > 0) {
                $link.find('.docs-page-nav__meta').text(parsed.meta);
                $link.find('.docs-page-nav__title').text(parsed.title);
                return;
            }

            $link.addClass('navigation--enhanced');
            $link.append(
                $('<span>', { 'class': 'docs-page-nav__body' }).append(
                    $('<span>', { 'class': 'docs-page-nav__meta' }).text(parsed.meta),
                    $('<span>', { 'class': 'docs-page-nav__title' }).text(parsed.title)
                )
            );
        });
    }

    function parseNavigationLabel(label, fallbackMeta) {
        var parts = String(label || '').split(':');
        var title = $.trim(parts.slice(1).join(':')) || $.trim(label) || fallbackMeta;
        var meta = fallbackMeta;

        if (/^next page/i.test(label)) meta = isRussianPage() ? 'Следующая страница' : 'Next Page';
        if (/^previous page/i.test(label)) meta = isRussianPage() ? 'Предыдущая страница' : 'Previous Page';

        return {
            meta: meta,
            title: title
        };
    }

    function bindDocsHeader() {
        bindFavicon();
        bindHeaderLogo();
        bindSearchShortcut();
        bindSocialLinks();
        bindSidebarToggle();
        bindPageLoader();
        bindPageNavigation();
    }

    gitbook.events.bind('page.change', bindDocsHeader);
});
