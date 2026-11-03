/**
 * Fanggao Pet — a cute square-cake mascot that floats above the Harness UI,
 * reflects the current conversation state, and can be dragged anywhere with the
 * mouse (position persists across reloads via localStorage).
 *
 * States (derived from the active Session snapshot):
 *   - running  → the cake runs (bounces, legs swing, speed lines)
 *   - sleeping → the cake lies down and dozes ("Z z z")
 *   - angry    → the cake frowns with a pulsing anger mark
 *
 * Lives in the frame-wide `shell.overlay` slot (always visible, click-through
 * base; this entry opts back into pointer events for dragging).
 */
window.__ModuleLoader__.load({
  id: '@local/fanggao-pet',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const CSS = [
      '.fgp-root{position:fixed;z-index:30;pointer-events:auto;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;line-height:0;}',
      '.fgp-root:active{cursor:grabbing;}',
      '.fgp-svg{display:block;}',
      '.fgp-anim{display:block;}',
      '.fgp-anim--running{animation:fgp-bob .5s ease-in-out infinite;transform-origin:50% 88%;}',
      '.fgp-anim--sleeping{animation:fgp-breathe 2.6s ease-in-out infinite;transform-origin:50% 100%;}',
      '.fgp-anim--angry{animation:fgp-shake .35s ease-in-out infinite;}',
      '@keyframes fgp-bob{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-7px) rotate(3deg)}}',
      '@keyframes fgp-breathe{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}',
      '@keyframes fgp-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-2px)}75%{transform:translateX(2px)}}',
      '.fgp-leg{transform-box:fill-box;transform-origin:50% 0%;}',
      '.fgp-leg--front{animation:fgp-swing-front .5s ease-in-out infinite;}',
      '.fgp-leg--back{animation:fgp-swing-back .5s ease-in-out infinite;}',
      '@keyframes fgp-swing-front{0%,100%{transform:rotate(24deg)}50%{transform:rotate(-24deg)}}',
      '@keyframes fgp-swing-back{0%,100%{transform:rotate(-24deg)}50%{transform:rotate(24deg)}}',
      '.fgp-arm{transform-box:fill-box;transform-origin:50% 0%;}',
      '.fgp-arm--left{animation:fgp-arm-left .5s ease-in-out infinite;}',
      '.fgp-arm--right{animation:fgp-arm-right .5s ease-in-out infinite;}',
      '@keyframes fgp-arm-left{0%,100%{transform:rotate(-28deg)}50%{transform:rotate(28deg)}}',
      '@keyframes fgp-arm-right{0%,100%{transform:rotate(28deg)}50%{transform:rotate(-28deg)}}',
      '.fgp-speed{animation:fgp-speed .5s ease-in-out infinite;}',
      '@keyframes fgp-speed{0%{opacity:0;transform:translateX(8px)}55%{opacity:.85}100%{opacity:0;transform:translateX(-6px)}}',
      '.fgp-z{animation:fgp-z 1.7s ease-in-out infinite;}',
      '.fgp-z--2{animation-delay:.55s;}',
      '.fgp-z--3{animation-delay:1.1s;}',
      '@keyframes fgp-z{0%{opacity:0;transform:translateY(6px) scale(.7)}30%{opacity:1}100%{opacity:0;transform:translateY(-16px) scale(1.15)}}',
      '.fgp-anger{transform-box:fill-box;transform-origin:center;animation:fgp-anger .7s ease-in-out infinite;}',
      '@keyframes fgp-anger{0%,100%{transform:scale(1)}50%{transform:scale(1.3)}}',
    ].join('\n');

    const COLORS = {
      body: '#FBEBC7',
      bodyStroke: '#D7AE77',
      crust: '#F3DCA6',
      leaf: '#7FB069',
      berry: '#E8564F',
      eye: '#5A4632',
      mouth: '#7A4A3B',
      cheek: '#F2A79C',
      cheekAngry: '#F08A80',
      limb: '#F6DFA8',
      limbStroke: '#D7AE77',
      anger: '#E14D45',
      shadow: 'rgba(80, 60, 30, 0.10)',
    };

    // A leg = outlined thigh/shin capsule + an oval foot (shoe) at the bottom.
    function leg(hipX, hipY, which) {
      return h('g', { transform: `translate(${hipX},${hipY})` },
        h('g', { className: `fgp-leg fgp-leg--${which}` },
          h('rect', { x: -4.5, y: 0, width: 9, height: 18, rx: 4.5, fill: COLORS.limb, stroke: COLORS.limbStroke, strokeWidth: 2 }),
          h('ellipse', { cx: 3, cy: 17, rx: 6.5, ry: 4.5, fill: COLORS.limb, stroke: COLORS.limbStroke, strokeWidth: 2 })));
    }

    // An arm = outlined stick + a round hand (mitten) at the tip.
    function arm(x1, y1, x2, y2) {
      return h('g', {},
        h('line', { x1, y1, x2, y2, stroke: COLORS.limbStroke, strokeWidth: 10, strokeLinecap: 'round' }),
        h('line', { x1, y1, x2, y2, stroke: COLORS.limb, strokeWidth: 6.5, strokeLinecap: 'round' }),
        h('circle', { cx: x2, cy: y2, r: 5, fill: COLORS.limb, stroke: COLORS.limbStroke, strokeWidth: 2 }));
    }

    // A side arm: a vertical capsule + round hand anchored at the shoulder on
    // the side of the body. When `swing` is true it pumps in the run cycle
    // (left/right in opposite phase, cross-coordinated with the legs); when
    // false it stays still (sleeping / angry).
    function sideArm(shoulderX, shoulderY, which, swing) {
      return h('g', { transform: `translate(${shoulderX},${shoulderY})` },
        h('g', swing ? { className: `fgp-arm fgp-arm--${which}` } : {},
          h('rect', { x: -4.5, y: 0, width: 9, height: 15, rx: 4.5, fill: COLORS.limb, stroke: COLORS.limbStroke, strokeWidth: 2 }),
          h('circle', { cx: 0, cy: 16, r: 5, fill: COLORS.limb, stroke: COLORS.limbStroke, strokeWidth: 2 })));
    }

    function eye(cx, cy, r) {
      return h('g', {},
        h('circle', { cx, cy, r, fill: COLORS.eye }),
        h('circle', { cx: cx + 1.3, cy: cy - 1.3, r: r * 0.32, fill: '#ffffff' }));
    }

    function blush(cx, cy, rx, ry, angry) {
      return h('ellipse', { cx, cy, rx, ry, fill: angry ? COLORS.cheekAngry : COLORS.cheek });
    }

    function crust(berry) {
      return h('g', {},
        h('rect', { x: 46, y: 54, width: 68, height: 12, rx: 6, fill: COLORS.crust }),
        berry ? h('g', {},
          h('ellipse', { cx: 110, cy: 58, rx: 5.5, ry: 2.6, fill: COLORS.leaf, transform: 'rotate(-24 110 58)' }),
          h('circle', { cx: 118, cy: 61, r: 5, fill: COLORS.berry })) : null);
    }

    function shadow(cx, cy, rx, ry) {
      return h('ellipse', { cx, cy, rx, ry, fill: COLORS.shadow });
    }

    // --- Running pose ---------------------------------------------------------
    function runningPose() {
      return [
        shadow(80, 144, 30, 6),
        leg(96, 120, 'back'),
        leg(64, 120, 'front'),
        h('rect', { x: 44, y: 52, width: 72, height: 72, rx: 16, fill: COLORS.body, stroke: COLORS.bodyStroke, strokeWidth: 2.5 }),
        crust(true),
        sideArm(42, 88, 'left', true),
        sideArm(118, 88, 'right', true),
        h('line', { x1: 62, y1: 83, x2: 70, y2: 85, stroke: COLORS.eye, strokeWidth: 2.5, strokeLinecap: 'round' }),
        h('line', { x1: 98, y1: 83, x2: 90, y2: 85, stroke: COLORS.eye, strokeWidth: 2.5, strokeLinecap: 'round' }),
        eye(68, 94, 5),
        eye(92, 94, 5),
        blush(58, 102, 6, 4, false),
        blush(102, 102, 6, 4, false),
        h('path', { d: 'M73 105 Q80 113 87 105 Z', fill: COLORS.mouth }),
        h('g', { className: 'fgp-speed', stroke: '#C9A15C', strokeWidth: 3.5, strokeLinecap: 'round' },
          h('line', { x1: 22, y1: 96, x2: 33, y2: 96 }),
          h('line', { x1: 14, y1: 108, x2: 27, y2: 108 }),
          h('line', { x1: 24, y1: 84, x2: 33, y2: 84 })),
      ];
    }

    // --- Sleeping pose --------------------------------------------------------
    function sleepingPose() {
      return [
        shadow(80, 146, 36, 6),
        h('rect', { x: 34, y: 84, width: 92, height: 54, rx: 16, fill: COLORS.body, stroke: COLORS.bodyStroke, strokeWidth: 2.5 }),
        h('rect', { x: 36, y: 86, width: 88, height: 10, rx: 5, fill: COLORS.crust }),
        arm(56, 112, 40, 128),
        arm(104, 112, 120, 128),
        h('ellipse', { cx: 66, cy: 134, rx: 7, ry: 4.5, fill: COLORS.limb, stroke: COLORS.limbStroke, strokeWidth: 2 }),
        h('ellipse', { cx: 96, cy: 134, rx: 7, ry: 4.5, fill: COLORS.limb, stroke: COLORS.limbStroke, strokeWidth: 2 }),
        h('path', { d: 'M60 106 Q65 111 70 106', fill: 'none', stroke: COLORS.eye, strokeWidth: 2.5, strokeLinecap: 'round' }),
        h('path', { d: 'M90 106 Q95 111 100 106', fill: 'none', stroke: COLORS.eye, strokeWidth: 2.5, strokeLinecap: 'round' }),
        blush(56, 118, 6, 4, false),
        blush(104, 118, 6, 4, false),
        h('circle', { cx: 80, cy: 120, r: 3, fill: COLORS.mouth }),
        h('g', { fill: '#8BB56F', fontWeight: 'bold', fontFamily: 'Georgia, serif', textAnchor: 'middle' },
          h('text', { className: 'fgp-z', x: 104, y: 66, fontSize: 12 }, 'z'),
          h('text', { className: 'fgp-z fgp-z--2', x: 117, y: 50, fontSize: 16 }, 'Z'),
          h('text', { className: 'fgp-z fgp-z--3', x: 132, y: 34, fontSize: 20 }, 'Z')),
      ];
    }

    // --- Angry pose -----------------------------------------------------------
    function angryPose() {
      return [
        shadow(80, 142, 26, 5),
        h('rect', { x: 44, y: 52, width: 72, height: 72, rx: 16, fill: COLORS.body, stroke: COLORS.bodyStroke, strokeWidth: 2.5 }),
        crust(true),
        sideArm(42, 88, 'left', false),
        sideArm(118, 88, 'right', false),
        leg(96, 122, 'back'),
        leg(64, 122, 'front'),
        h('line', { x1: 60, y1: 82, x2: 72, y2: 87, stroke: COLORS.eye, strokeWidth: 3, strokeLinecap: 'round' }),
        h('line', { x1: 100, y1: 82, x2: 88, y2: 87, stroke: COLORS.eye, strokeWidth: 3, strokeLinecap: 'round' }),
        eye(68, 95, 4.5),
        eye(92, 95, 4.5),
        blush(58, 103, 7, 4.5, true),
        blush(102, 103, 7, 4.5, true),
        h('path', { d: 'M72 108 Q80 99 88 108', fill: 'none', stroke: COLORS.eye, strokeWidth: 2.5, strokeLinecap: 'round' }),
        h('g', { transform: 'translate(112,44)' },
          h('g', { className: 'fgp-anger' },
            h('rect', { x: -4, y: -1.2, width: 8, height: 2.4, rx: 1.2, fill: COLORS.anger }),
            h('rect', { x: -1.2, y: -4, width: 2.4, height: 8, rx: 1.2, fill: COLORS.anger }))),
      ];
    }

    function svgEl(pose) {
      let children;
      if (pose === 'running') children = runningPose();
      else if (pose === 'sleeping') children = sleepingPose();
      else children = angryPose();
      return h('svg', { className: 'fgp-svg', viewBox: '0 0 160 160', width: 88, height: 88 }, children);
    }

    // --- Active-session state ------------------------------------------------
    const EMPTY_SNAPSHOT = Object.freeze({
      running: false,
      lastAgentError: null,
      promptError: null,
      openError: null,
      openState: 'cold',
    });

    function findActiveId(list) {
      if (!list) return undefined;
      const byId = list.byId || {};
      const ids = list.ids || [];
      for (const id of ids) {
        const row = byId[id];
        if (row && ((row.retainedBy && row.retainedBy.mainView) || 0) > 0) return id;
      }
      for (const id of ids) if (byId[id]) return id;
      return undefined;
    }

    // --- Drag helpers ---------------------------------------------------------
    const STORE_KEY = 'fanggao-pet.position';

    function clamp(v, min, max) {
      return Math.min(max, Math.max(min, v));
    }

    function defaultPos() {
      const w = typeof window !== 'undefined' ? window.innerWidth : 900;
      const hgt = typeof window !== 'undefined' ? window.innerHeight : 700;
      return { x: Math.max(8, w - 124), y: Math.max(8, hgt - 140) };
    }

    function loadPos() {
      try {
        if (typeof window === 'undefined') return defaultPos();
        const raw = window.localStorage.getItem(STORE_KEY);
        if (raw) {
          const p = JSON.parse(raw);
          if (typeof p.x === 'number' && typeof p.y === 'number' && Number.isFinite(p.x) && Number.isFinite(p.y)) {
            return { x: p.x, y: p.y };
          }
        }
      } catch (_e) { /* ignore */ }
      return defaultPos();
    }

    function savePos(p) {
      try {
        if (typeof window !== 'undefined') window.localStorage.setItem(STORE_KEY, JSON.stringify(p));
      } catch (_e) { /* ignore */ }
    }

    return {
      inject: ['slots', 'sessions'],
      apply(ctx) {
        const sessions = ctx.sessions;
        const listSubscribe = (fn) => sessions.list.subscribe(fn);
        const listGet = () => sessions.list.getSnapshot();

        function useActiveSnapshot() {
          const list = React.useSyncExternalStore(listSubscribe, listGet);
          const activeId = findActiveId(list);
          const binding = activeId !== undefined ? sessions.binding(activeId) : undefined;
          const session = binding ? binding.session : undefined;

          const subscribe = React.useCallback(
            (fn) => (session ? session.subscribe(fn) : () => {}),
            [session],
          );
          const getSnapshot = React.useCallback(
            () => (session ? session.getSnapshot() : EMPTY_SNAPSHOT),
            [session],
          );
          return React.useSyncExternalStore(subscribe, getSnapshot);
        }

        function FanggaoPet() {
          const snapshot = useActiveSnapshot();
          const running = snapshot.running === true;
          const hasError = !!snapshot.lastAgentError || !!snapshot.promptError || !!snapshot.openError || snapshot.openState === 'error';
          const pose = hasError ? 'angry' : running ? 'running' : 'sleeping';

          const [pos, setPos] = React.useState(loadPos);
          const posRef = React.useRef(pos);
          posRef.current = pos;
          const dragRef = React.useRef(null);

          function onPointerDown(e) {
            if (e.button !== 0) return;
            dragRef.current = { sx: e.clientX, sy: e.clientY, ox: posRef.current.x, oy: posRef.current.y };
            try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_e) { /* ignore */ }
          }
          function onPointerMove(e) {
            const d = dragRef.current;
            if (!d) return;
            const w = typeof window !== 'undefined' ? window.innerWidth : 900;
            const hgt = typeof window !== 'undefined' ? window.innerHeight : 700;
            const next = {
              x: clamp(d.ox + e.clientX - d.sx, 0, w - 60),
              y: clamp(d.oy + e.clientY - d.sy, 0, hgt - 60),
            };
            posRef.current = next;
            setPos(next);
          }
          function endDrag() {
            dragRef.current = null;
            savePos(posRef.current);
          }

          return h('div', {
            className: 'fgp-root',
            style: { left: pos.x, top: pos.y },
            onPointerDown,
            onPointerMove,
            onPointerUp: endDrag,
            onPointerCancel: endDrag,
            role: 'img',
            'aria-label': 'Fanggao Pet 方糕萌宠',
            title: '拖动我 · Drag me',
          },
            h('style', { dangerouslySetInnerHTML: { __html: CSS } }),
            h('div', { className: `fgp-anim fgp-anim--${pose}` }, svgEl(pose)));
        }

        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: 'fanggao-pet',
          order: 0,
        }, FanggaoPet));
      },
    };
  },
});
