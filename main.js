(function () {
  'use strict';

  /* Duas camadas de suavização, cada uma resolvendo uma coisa:
       1. o motor de rolagem transforma os saltos de 233px da roda em
          movimento contínuo da página;
       2. a mola do progresso amortece o que sobra antes de virar animação.
     A referência só precisa da segunda porque conta com a rolagem suave
     nativa do navegador; nesta máquina ela está desligada pelo Windows. */

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fino = matchMedia('(pointer:fine)').matches;

  var stack = document.getElementById('stack');
  var spine = document.getElementById('spine');
  var projs = [].slice.call(document.querySelectorAll('.proj'));

  /* Comprimento real de cada traço que se desenha. Medir é obrigatório: chutar
     o valor no CSS deixava a onda de áudio e a moldura do card partidas ao
     meio, porque o comprimento de uma curva é bem maior que o do seu vão. */
  document.querySelectorAll('[data-draw]').forEach(function (el) {
    var L = 100;
    try { if (el.getTotalLength) L = el.getTotalLength(); } catch (e) { /* mantém 100 */ }
    if (L > 0) el.style.setProperty('--len', L.toFixed(1));
  });

  /* ── abertura ─────────────────────────────────────────────────────────
     As peças se montam, a marca voa até a barra e a cortina sai. Tudo tem
     temporizador de segurança: se qualquer etapa falhar, a cortina some
     assim mesmo — uma abertura nunca pode prender o site. */
  (function abertura() {
    var intro = document.getElementById('intro');
    var marca = document.getElementById('marca');
    if (!intro) return;

    var pecas = intro.querySelectorAll('.pc');
    for (var i = 0; i < pecas.length; i++) {
      var L = 60;
      try { L = pecas[i].getTotalLength(); } catch (e) { /* mantém 60 */ }
      pecas[i].style.setProperty('--len', L.toFixed(1));
    }
    if (marca) marca.classList.add('esperando');

    var encerrou = false;
    function encerra() {
      if (encerrou) return;
      encerrou = true;
      if (marca) marca.classList.remove('esperando');
      intro.classList.add('saiu');
      setTimeout(function () { intro.remove(); }, 500);
    }

    /* FLIP: mede onde o logo da barra está e leva a marca grande até lá. */
    function voa() {
      var destino = marca && marca.querySelector('.logo');
      var origem = document.getElementById('intro-logo');
      if (!destino || !origem) { encerra(); return; }
      var a = origem.getBoundingClientRect(), b = destino.getBoundingClientRect();
      if (!a.width || !b.width) { encerra(); return; }
      var escala = b.width / a.width;
      var dx = (b.left + b.width / 2) - (a.left + a.width / 2);
      var dy = (b.top + b.height / 2) - (a.top + a.height / 2);
      intro.classList.add('voa');
      origem.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + escala + ')';
      setTimeout(encerra, 640);
    }

    if (reduce) {
      intro.classList.add('curta');
      setTimeout(encerra, 900);
      addEventListener('pointerdown', encerra, { once: true });
      addEventListener('keydown', encerra, { once: true });
      return;
    }

    var montagem = (pecas.length - 1) * 135 + 1050 + 500;   // escalonamento + peça + respiro
    setTimeout(voa, montagem);
    setTimeout(encerra, montagem + 1800);            // rede de segurança
    addEventListener('pointerdown', encerra, { once: true });
    addEventListener('keydown', encerra, { once: true });
  })();

  /* ── rolagem suave ────────────────────────────────────────────────────
     Medido no equipamento real: passo de 233px por volta da roda, 60fps, e o
     Windows com efeitos de animação desligados. Essa última parte faz o Chrome
     desativar a própria rolagem suave — cada volta TELEPORTA a página 233px,
     mais de um quarto da tela, sem interpolação nenhuma.

     Por isso o motor volta. Antes eu o havia tirado por ver que o site de
     referência não usa nenhum: o que eu não sabia é que ele depende da rolagem
     suave nativa do navegador, que nesta máquina está desligada. Sem o motor,
     nada aqui pode parecer liso.

     Com 60fps confirmados, o risco de o motor ficar pior que o nativo não se
     aplica. Ainda assim ele desiste sozinho se um trecho demorar demais. */
  var rolagem = (function () {
    if (!fino) return null;
    var alvoY = scrollY, atualY = scrollY, andando = false, nosso = false;
    var ATRITO = 0.11;
    var desistiu = false, inicio = 0;

    function teto() { return Math.max(0, document.documentElement.scrollHeight - innerHeight); }
    function abandona() {
      desistiu = true; andando = false;
      removeEventListener('wheel', naRoda, { passive: false });
    }
    function passo(t) {
      if (!inicio) inicio = t;
      if (t - inicio > 1600 && Math.abs(alvoY - atualY) > 30) { abandona(); return; }
      var falta = alvoY - atualY;
      if (Math.abs(falta) < 0.4) { atualY = alvoY; andando = false; inicio = 0; }
      else { atualY += falta * ATRITO; requestAnimationFrame(passo); }
      nosso = true; scrollTo(0, atualY); nosso = false;
    }
    function liga() { if (!andando && !desistiu) { andando = true; requestAnimationFrame(passo); } }

    /* deltaMode 1 = linhas, 2 = páginas. Nesta máquina vem em pixels, mas
       outros equipamentos reportam diferente. */
    function emPixels(e) {
      if (e.deltaMode === 1) return e.deltaY * 18;
      if (e.deltaMode === 2) return e.deltaY * innerHeight;
      return e.deltaY;
    }
    /* O equipamento manda 233px por volta — mais de um quarto da tela de 848px.
       Bom para atravessar a página, péssimo para ler: o texto pula três linhas
       por volta. Com 0.55 o passo cai para ~128px, e uma tela cheia de texto
       passa a levar ~6,6 voltas em vez de 3,6. É a faixa confortável de
       leitura, e é o mesmo passo que a maioria dos mouses entrega de fábrica. */
    var FATOR = 0.55;

    function naRoda(e) {
      if (desistiu || e.ctrlKey || e.defaultPrevented) return;
      e.preventDefault();
      alvoY = Math.max(0, Math.min(teto(), alvoY + emPixels(e) * FATOR));
      liga();
    }
    addEventListener('wheel', naRoda, { passive: false });
    addEventListener('scroll', function () {
      if (!nosso && !andando) { alvoY = atualY = scrollY; }
    }, { passive: true });

    return {
      ativo: function () { return !desistiu; },
      scrollToY: function (y) {
        alvoY = Math.max(0, Math.min(teto(), y));
        liga();
      }
    };
  })();

  /* ── navegação suave por ancoras (funciona em todos os dispositivos) ─── */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (ev) {
      var href = a.getAttribute('href');
      if (!href || href === '#') return;
      var destino = document.querySelector(href);
      if (!destino) return;

      ev.preventDefault();
      var header = document.querySelector('header');
      var offset = (header ? header.offsetHeight : 56) - 6;
      var targetY = href === '#topo' ? 0 : Math.max(0, scrollY + destino.getBoundingClientRect().top - offset);

      if (rolagem && rolagem.ativo()) {
        rolagem.scrollToY(targetY);
      } else {
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      }
    });
  });

  /* ── mola do progresso ────────────────────────────────────────────────
     Segunda camada. O motor acima já entrega posições contínuas, mas o valor
     que alimenta as cenas ainda ganha um amortecimento leve: é o que tira o
     degrau residual e dá o acabamento. Mesmo princípio do useSpring do Framer
     Motion, que a referência usa por cima da rolagem nativa.

     O laço se auto-encerra quando tudo assenta e é religado pelo scroll.
     `raf` é zerado no topo de cada quadro, então nunca fica preso. */

  var molas = [];      // { el, prop, alvo, atual }
  var raf = 0;

  function novaMola(el, prop, k) {
    var m = { el: el, prop: prop, alvo: 0, atual: 0, k: k || PERSEGUE };
    molas.push(m);
    return m;
  }

  /* Mola longa de propósito. Com 0.16 o valor colava no scroll e a cena
     passava junto com a página. Em 0.045 ela fica para trás e SEGUE TOCANDO
     por ~1,2s depois que a rolagem para — é isso que dá tempo de ver a
     animação sem precisar alongar o curso e transformar a página em ladeira. */
  var PERSEGUE = fino ? 0.045 : 0.085;
  var PARADO = 0.0005;

  function limita(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  /* Progresso de um trecho travado: 0 quando a trava encosta no topo,
     1 quando ela termina e a página volta a descer. */
  function progresso(el) {
    var r = el.getBoundingClientRect();
    var curso = r.height - innerHeight;
    return limita(curso > 0 ? -r.top / curso : 0);
  }

  var molaHero = stack ? novaMola(stack, '--p') : null;
  var molaEspinha = null; // a spine é atualizada direto no evento de scroll (sem mola, sem corrida de rAF)
  var molasCena = reduce ? [] : [].slice.call(document.querySelectorAll('[data-anim]')).map(function (el) {
    var m = novaMola(el, '--q');
    m.pin = el.closest('.pin');
    return m;
  });

  var secHero = document.getElementById('scene');
  var trilho = document.getElementById('track');

  /* A spine lê o scroll direto (scrollY), não a posição na tela a cada frame.
     Medir o track por getBoundingClientRect todo quadro fazia o alvo oscilar
     (a ponta "crescia e encolhia aos trancos"); o topo/altura do track são
     medidos uma vez e recalculados só em resize/load. */
  var espTop = 0, espH = 1;
  function medeEspinha() {
    if (!trilho) return;
    var r = trilho.getBoundingClientRect();
    espTop = r.top + window.scrollY;
    espH = r.height || 1;
    /* offsets de scroll para a animação CSS dirigida por scroll() */
    var a = Math.max(0, espTop - innerHeight * 0.62);
    var b = espTop + espH - innerHeight * 0.62;
    document.documentElement.style.setProperty('--spineA', a.toFixed(0) + 'px');
    document.documentElement.style.setProperty('--spineB', b.toFixed(0) + 'px');
  }
  /* A spine é desenhada direto no evento de scroll, lendo o scrollY já comitado
     pelo navegador. Fica fora do loop de molas (rAF) de propósito: antes, o loop
     das molas e o motor de rolagem eram dois rAF independentes e a spine lia a
     posição num instante inconsistente, dando picos de um frame (a ponta
     "crescia e encolhia aos trancos"). No scroll o valor é sempre coerente. */
  function atualizaEspinha() {
    if (!spine) return;
    spine.style.setProperty('--draw',
      limita((window.scrollY + innerHeight * 0.62 - espTop) / espH).toFixed(4));
  }
  medeEspinha(); atualizaEspinha();
  addEventListener('scroll', atualizaEspinha, { passive: true });
  addEventListener('load', function () { medeEspinha(); atualizaEspinha(); });
  setTimeout(function () { medeEspinha(); atualizaEspinha(); }, 600);
  setTimeout(function () { medeEspinha(); atualizaEspinha(); }, 1800);

  function mede() {
    if (molaHero && secHero) molaHero.alvo = progresso(secHero);
    molasCena.forEach(function (m) {
      m.alvo = m.pin ? progresso(m.pin) : 0;
    });
  }

  function quadro() {
    raf = 0;
    mede();
    var assentou = true;
    for (var i = 0; i < molas.length; i++) {
      var m = molas[i];
      m.atual += (m.alvo - m.atual) * (m.k || PERSEGUE);
      if (Math.abs(m.alvo - m.atual) > PARADO) assentou = false;
      else m.atual = m.alvo;
      m.el.style.setProperty(m.prop, m.atual.toFixed(4));
    }
    if (!assentou) raf = requestAnimationFrame(quadro);
  }

  function acorda() { if (!raf) raf = requestAnimationFrame(quadro); }

  addEventListener('scroll', acorda, { passive: true });
  addEventListener('touchmove', acorda, { passive: true });
  addEventListener('resize', function () { medeEspinha(); atualizaEspinha(); acorda(); });
  mede();
  molas.forEach(function (m) { m.atual = m.alvo; m.el.style.setProperty(m.prop, m.atual.toFixed(4)); });
  acorda();

  /* Os blocos de texto entram suavemente na ordem natural de rolagem. */
  var aoEntrar = new IntersectionObserver(function (itens) {
    itens.forEach(function (i) {
      if (i.isIntersecting) { i.target.classList.add('in'); aoEntrar.unobserve(i.target); }
    });
  }, { rootMargin: '0px 0px 40px 0px' });
  document.querySelectorAll('.rise').forEach(function (el) { aoEntrar.observe(el); });

  /* Garantia de segurança para mobile: revela elementos visíveis no scroll sem atrasos ou falhas */
  function revelaVisiveis() {
    document.querySelectorAll('.rise:not(.in)').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < (window.innerHeight || document.documentElement.clientHeight) + 60) {
        el.classList.add('in');
      }
    });
  }
  var revelaAgendado = false;
  function agendaRevela() {
    if (revelaAgendado) return;
    revelaAgendado = true;
    requestAnimationFrame(function () { revelaAgendado = false; revelaVisiveis(); });
  }
  addEventListener('scroll', agendaRevela, { passive: true });
  addEventListener('touchmove', agendaRevela, { passive: true });
  addEventListener('resize', agendaRevela, { passive: true });
  setTimeout(revelaVisiveis, 400);

  /* Os nós da espinha acendem junto com o projeto a que pertencem. */
  var aoEntrarProj = new IntersectionObserver(function (itens) {
    itens.forEach(function (i) { i.target.classList.toggle('lit', i.isIntersecting); });
  }, { rootMargin: '0px 0px -15% 0px' });
  projs.forEach(function (p) { aoEntrarProj.observe(p); });

  /* ── parallax do hero ─────────────────────────────────────────────────
     Única coisa ainda ligada ao ponteiro; desligada com movimento reduzido. */
  if (stack && fino && !reduce) {
    addEventListener('pointermove', function (e) {
      stack.style.setProperty('--mx', (e.clientX / innerWidth - 0.5).toFixed(3));
      stack.style.setProperty('--my', (e.clientY / innerHeight - 0.5).toFixed(3));
    }, { passive: true });
  }

  /* ── cursor ───────────────────────────────────────────────────────────
     O ponto acompanha exato e o anel chega logo atrás, pelo transition.
     Cresce sobre qualquer coisa clicável ou sobre as cenas. */
  (function cursor() {
    var el = document.getElementById('cursor');
    /* Sem trava de movimento reduzido: um cursor é affordance de ponteiro,
       não movimento autônomo. Sob essa preferência ele só perde o atraso. */
    if (!el || !fino) { if (el) el.remove(); return; }
    document.body.classList.add('sem-cursor');
    var alvo = 'a,button,[role="button"],.scn,.gym figure,.stage,.stack-card,.stack-tab,.carousel-btn';

    /* A posição vai por variável, não por transform inline: inline venceria a
       regra do estado de clique e o encolhimento nunca apareceria. */
    addEventListener('pointermove', function (e) {
      el.classList.add('ativo');
      el.style.setProperty('--x', e.clientX + 'px');
      el.style.setProperty('--y', e.clientY + 'px');
      el.classList.toggle('perto', !!(e.target.closest && e.target.closest(alvo)));
    }, { passive: true });

    addEventListener('pointerdown', function () { el.classList.add('clique'); }, { passive: true });
    addEventListener('pointerup', function () { el.classList.remove('clique'); }, { passive: true });
    addEventListener('pointerleave', function () { el.classList.remove('ativo'); }, { passive: true });
  })();

  /* ── carrossel da stack tecnológica ─────────────────────────────────────
     Gerencia navegação por botões, pontos indicadores, arrasto com o mouse/touch,
     filtro por categorias e rotação automática com pausa no hover. */
  (function initStackCarousel() {
    var track = document.getElementById('stack-carousel-track');
    var btnPrev = document.getElementById('stack-prev');
    var btnNext = document.getElementById('stack-next');
    var dotsContainer = document.getElementById('stack-dots');
    var tabsContainer = document.getElementById('stack-tabs');
    if (!track) return;

    var allCards = [].slice.call(track.querySelectorAll('.stack-card'));
    var activeCards = allCards;
    var currentIndex = 0;
    var autoPlayTimer = null;

    // Efeito 3D Tilt nos cards ao passar o mouse
    if (fino && !reduce) {
      allCards.forEach(function(card) {
        card.addEventListener('mousemove', function(e) {
          var rect = card.getBoundingClientRect();
          var x = e.clientX - rect.left;
          var y = e.clientY - rect.top;
          var rx = ((y / rect.height) - 0.5) * -10;
          var ry = ((x / rect.width) - 0.5) * 10;
          card.style.transform = 'perspective(1000px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateY(-5px)';
        });
        card.addEventListener('mouseleave', function() {
          card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
        });
      });
    }

    function getVisibleCount() {
      var w = window.innerWidth;
      if (w < 580) return 1;
      if (w < 860) return 2;
      return 3;
    }

    function getMaxIndex() {
      var visible = getVisibleCount();
      return Math.max(0, activeCards.length - visible);
    }

    function renderDots() {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = '';
      var max = getMaxIndex();
      if (max <= 0) return;

      for (var i = 0; i <= max; i++) {
        (function(index) {
          var dot = document.createElement('span');
          dot.className = 'stack-dot' + (index === currentIndex ? ' active' : '');
          dot.setAttribute('role', 'button');
          dot.setAttribute('tabindex', '0');
          dot.setAttribute('aria-label', 'Ir para o grupo ' + (index + 1));
          dot.addEventListener('click', function() {
            goTo(index);
          });
          dot.addEventListener('keydown', function(ev) {
            if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); goTo(index); }
          });
          dotsContainer.appendChild(dot);
        })(i);
      }
    }

    function update() {
      var max = getMaxIndex();
      if (currentIndex > max) currentIndex = max;
      if (currentIndex < 0) currentIndex = 0;

      if (activeCards.length > 0) {
        var cardWidth = activeCards[0].offsetWidth;
        var gap = 16;
        var moveX = currentIndex * (cardWidth + gap);
        track.style.transform = 'translateX(-' + moveX + 'px)';
      } else {
        track.style.transform = 'translateX(0)';
      }

      var dots = dotsContainer ? [].slice.call(dotsContainer.querySelectorAll('.stack-dot')) : [];
      dots.forEach(function(dot, i) {
        dot.classList.toggle('active', i === currentIndex);
      });

      if (btnPrev) btnPrev.style.opacity = currentIndex === 0 ? '0.4' : '1';
      if (btnNext) btnNext.style.opacity = currentIndex === max ? '0.4' : '1';
    }

    function goTo(index) {
      currentIndex = index;
      update();
    }

    function next() {
      var max = getMaxIndex();
      if (currentIndex >= max) {
        currentIndex = 0;
      } else {
        currentIndex++;
      }
      update();
    }

    function prev() {
      var max = getMaxIndex();
      if (currentIndex <= 0) {
        currentIndex = max;
      } else {
        currentIndex--;
      }
      update();
    }

    if (btnNext) btnNext.addEventListener('click', function() { next(); resetAutoPlay(); });
    if (btnPrev) btnPrev.addEventListener('click', function() { prev(); resetAutoPlay(); });

    // Filtro por categorias
    if (tabsContainer) {
      tabsContainer.addEventListener('click', function(e) {
        var tab = e.target.closest('.stack-tab');
        if (!tab) return;
        var cat = tab.getAttribute('data-cat');

        tabsContainer.querySelectorAll('.stack-tab').forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');

        activeCards = [];
        allCards.forEach(function(card) {
          var cardCats = card.getAttribute('data-cat') || '';
          if (cat === 'all' || cardCats.indexOf(cat) !== -1) {
            card.style.display = '';
            card.style.opacity = '1';
            card.style.transform = 'none';
            activeCards.push(card);
          } else {
            card.style.display = 'none';
          }
        });

        currentIndex = 0;
        renderDots();
        update();
        resetAutoPlay();
      });
    }

    // Suporte a arrasto (drag / swipe)
    var isDragging = false, startX = 0;

    track.addEventListener('mousedown', function(e) {
      isDragging = true;
      startX = e.clientX;
      track.style.transition = 'none';
      stopAutoPlay();
    });

    function endDrag(e) {
      if (!isDragging) return;
      isDragging = false;
      track.style.transition = 'transform 0.5s cubic-bezier(.2,.7,.3,1)';
      var endX = (e.changedTouches ? e.changedTouches[0].clientX : e.clientX);
      var diff = endX - startX;
      if (diff < -40) next();
      else if (diff > 40) prev();
      else update();
      startAutoPlay();
    }

    track.addEventListener('mouseup', endDrag);
    track.addEventListener('mouseleave', function(e) { if (isDragging) endDrag(e); });

    track.addEventListener('touchstart', function(e) {
      isDragging = true;
      startX = e.touches[0].clientX;
      stopAutoPlay();
    }, { passive: true });

    track.addEventListener('touchend', endDrag, { passive: true });

    // Auto Play
    function startAutoPlay() {
      if (reduce) return;
      stopAutoPlay();
      autoPlayTimer = setInterval(next, 4500);
    }

    function stopAutoPlay() {
      if (autoPlayTimer) clearInterval(autoPlayTimer);
    }

    function resetAutoPlay() {
      stopAutoPlay();
      startAutoPlay();
    }

    if (track.parentElement) {
      track.parentElement.addEventListener('mouseenter', stopAutoPlay);
      track.parentElement.addEventListener('mouseleave', startAutoPlay);
    }

    window.addEventListener('resize', function() {
      renderDots();
      update();
    });

    renderDots();
    update();
    startAutoPlay();
  })();

  /* ── contato estilo Awwwards: magnetic buttons & copy toast ─────────── */
  (function initAwwwardsContact() {
    var toast = document.getElementById('toast-copy');
    var toastTimer = null;

    function showToast(msg) {
      if (!toast) return;
      if (msg) toast.textContent = msg;
      toast.classList.add('active');
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(function() {
        toast.classList.remove('active');
      }, 2800);
    }

    // Copiar e-mail ao clicar nos links de e-mail
    ['hero-copy-email', 'link-copy-email'].forEach(function(id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('click', function(e) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          e.preventDefault();
          navigator.clipboard.writeText('morgantaria965@gmail.com')
            .then(function() { showToast('✓ E-mail copiado para a área de transferência!'); })
            .catch(function() { window.location.href = 'mailto:morgantaria965@gmail.com'; });
        }
      });
    });

    // Magnetic Button Effect para links de contato
    if (fino && !reduce) {
      var magneticLinks = document.querySelectorAll('.aww-link, .hero-email-link');
      magneticLinks.forEach(function(el) {
        el.addEventListener('mousemove', function(e) {
          var r = el.getBoundingClientRect();
          var dx = e.clientX - (r.left + r.width / 2);
          var dy = e.clientY - (r.top + r.height / 2);
          el.style.transform = 'translate(' + (dx * 0.18).toFixed(1) + 'px, ' + (dy * 0.18).toFixed(1) + 'px)';
        });
        el.addEventListener('mouseleave', function() {
          el.style.transform = 'translate(0px, 0px)';
        });
      });
    }
  })();

  /* ── Menu Suspenso Mobile ────────────────────────────────────────────── */
  (function initMobileMenu() {
    var toggleBtn = document.getElementById('menu-toggle');
    var menuOverlay = document.getElementById('mobile-menu');
    if (!toggleBtn || !menuOverlay) return;

    var fundo = [document.querySelector('main'), document.querySelector('footer')];
    function trapFocus(e) {
      if (e.key !== 'Tab') return;
      var f = menuOverlay.querySelectorAll('a[href], button');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    function openMenu() {
      menuOverlay.classList.add('active');
      toggleBtn.classList.add('active');
      toggleBtn.setAttribute('aria-expanded', 'true');
      menuOverlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('menu-aberto');
      fundo.forEach(function (el) { if (el) el.setAttribute('aria-hidden', 'true'); });
      menuOverlay.addEventListener('keydown', trapFocus);
      var primeiro = menuOverlay.querySelector('a[href], button');
      if (primeiro) primeiro.focus();
    }

    function closeMenu() {
      menuOverlay.classList.remove('active');
      toggleBtn.classList.remove('active');
      toggleBtn.setAttribute('aria-expanded', 'false');
      menuOverlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('menu-aberto');
      fundo.forEach(function (el) { if (el) el.removeAttribute('aria-hidden'); });
      menuOverlay.removeEventListener('keydown', trapFocus);
      toggleBtn.focus();
    }

    function toggleMenu() {
      var isOpen = menuOverlay.classList.contains('active');
      if (isOpen) closeMenu();
      else openMenu();
    }

    toggleBtn.addEventListener('click', toggleMenu);

    // Fechar menu ao clicar em qualquer link
    menuOverlay.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', closeMenu);
    });

    // Fechar no ESC
    addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && menuOverlay.classList.contains('active')) {
        closeMenu();
      }
    });
  })();
})();



