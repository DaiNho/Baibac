<script lang="ts">
	const props: { open: boolean; onclose: () => void } = $props();

	let containerEl: HTMLDivElement | null = $state(null);

	const COLORS = [
		{ bg: '#5B8DEF', glow: 'rgba(91,141,239,0.55)' },
		{ bg: '#E8657A', glow: 'rgba(232,101,122,0.55)' },
		{ bg: '#52C4A0', glow: 'rgba(82,196,160,0.55)' },
		{ bg: '#F0A050', glow: 'rgba(240,160,80,0.55)' },
		{ bg: '#A67EE8', glow: 'rgba(166,126,232,0.55)' },
		{ bg: '#5EC9E2', glow: 'rgba(94,201,226,0.55)' },
		{ bg: '#E87BB0', glow: 'rgba(232,123,176,0.55)' },
		{ bg: '#7CC96B', glow: 'rgba(124,201,107,0.55)' },
		{ bg: '#E8C84A', glow: 'rgba(232,200,74,0.55)' },
		{ bg: '#EE8060', glow: 'rgba(238,128,96,0.55)' },
		{ bg: '#3ECFCF', glow: 'rgba(62,207,207,0.55)' },
		{ bg: '#C45EE0', glow: 'rgba(196,94,224,0.55)' },
		{ bg: '#E0D45E', glow: 'rgba(224,212,94,0.55)' },
		{ bg: '#5EE09A', glow: 'rgba(94,224,154,0.55)' },
		{ bg: '#E05E5E', glow: 'rgba(224,94,94,0.55)' }
	];

	let touches = new Map<number, { x: number; y: number; ci: number }>();
	let phase: 'idle' | 'countdown' | 'picking' | 'done' = 'idle';
	let cdTimer: ReturnType<typeof setTimeout> | null = null;
	let cdVal = 3;
	let usedColors = new Set<number>();
	let cdText = $state('');
	let showCd = $state(false);
	let showStatus = $state(false);
	let showLabel = $state(false);
	let showHint = $state(true);

	function pickColor() {
		if (usedColors.size >= COLORS.length) usedColors.clear();
		let idx: number;
		do {
			idx = Math.floor(Math.random() * COLORS.length);
		} while (usedColors.has(idx));
		usedColors.add(idx);
		return idx;
	}

	function vib(pattern: number | number[]) {
		try {
			if (navigator.vibrate) navigator.vibrate(pattern as any);
		} catch (e) {}
	}

	let pulseVibTimer: ReturnType<typeof setTimeout> | null = null;
	function startPulseVib() {
		stopPulseVib();
		function loop() {
			vib([80, 60]);
			pulseVibTimer = setTimeout(loop, 900);
		}
		loop();
	}
	function stopPulseVib() {
		if (pulseVibTimer) {
			clearTimeout(pulseVibTimer);
			pulseVibTimer = null;
		}
		vib(0);
	}

	function getContainer(): HTMLElement {
		return containerEl!;
	}

	function spawnRipple(x: number, y: number, ci: number) {
		if (!containerEl) return;
		const r = document.createElement('div');
		r.className = 'fp-ripple-el';
		r.style.cssText = `left:${x}px;top:${y}px;background:${COLORS[ci].bg}`;
		containerEl.appendChild(r);
		setTimeout(() => r.remove(), 500);
	}

	function createDot(id: number, x: number, y: number, ci: number) {
		if (!containerEl) return;
		const c = COLORS[ci];
		const wrap = document.createElement('div');
		wrap.className = 'fp-dot';
		wrap.id = 'fp-dot-' + id;
		wrap.style.cssText = `left:${x}px;top:${y}px`;

		const crown = document.createElement('div');
		crown.className = 'fp-crown';
		crown.textContent = '👑';

		const inner = document.createElement('div');
		inner.className = 'fp-dot-inner';
		inner.style.cssText = `background:${c.bg};box-shadow:0 8px 32px ${c.glow}`;
		inner.style.setProperty('--glow', c.glow);

		wrap.appendChild(crown);
		wrap.appendChild(inner);
		containerEl.appendChild(wrap);
		requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('in')));
		spawnRipple(x, y, ci);
	}

	function removeDot(id: number) {
		const el = document.getElementById('fp-dot-' + id);
		if (el) el.remove();
	}

	function moveDot(id: number, x: number, y: number) {
		const el = document.getElementById('fp-dot-' + id);
		if (el) {
			el.style.left = x + 'px';
			el.style.top = y + 'px';
		}
	}

	function setPulsing(on: boolean) {
		if (!containerEl) return;
		containerEl.querySelectorAll('.fp-dot').forEach((d) => {
			on ? d.classList.add('pulsing') : d.classList.remove('pulsing');
		});
	}

	function reset() {
		if (cdTimer) clearTimeout(cdTimer);
		stopPulseVib();
		cdTimer = null;
		cdVal = 3;
		phase = 'idle';
		showCd = false;
		cdText = '';
		showLabel = false;
		showStatus = false;
		setPulsing(false);
		if (containerEl) {
			containerEl.querySelectorAll('.fp-dot').forEach((d) => {
				d.classList.remove('pulsing', 'flash', 'winner', 'loser');
			});
		}
		showHint = touches.size === 0;
	}

	function startCountdown() {
		if (phase === 'countdown') return;
		phase = 'countdown';
		cdVal = 3;
		showCd = true;
		cdText = String(cdVal);
		showHint = false;
		showStatus = true;
		setPulsing(true);
		vib([100, 50, 100, 50, 100]);
		startPulseVib();
		tick();
	}

	function tick() {
		cdTimer = setTimeout(() => {
			cdVal--;
			vib([120, 40, 120]);
			if (cdVal > 0) {
				cdText = String(cdVal);
				tick();
			} else {
				showCd = false;
				showStatus = false;
				setPulsing(false);
				stopPulseVib();
				startPicking();
			}
		}, 1000);
	}

	function startPicking() {
		phase = 'picking';
		vib([0, 150, 60, 150, 60, 200]);
		const ids = Array.from(touches.keys());
		let flashes = 0,
			maxFlashes = 20,
			lastId: number | null = null;

		function flash() {
			if (phase !== 'picking') return;
			if (lastId !== null) {
				const p = document.getElementById('fp-dot-' + lastId);
				if (p) p.classList.remove('flash');
			}
			let id: number;
			do {
				id = ids[Math.floor(Math.random() * ids.length)];
			} while (ids.length > 1 && id === lastId);
			const el = document.getElementById('fp-dot-' + id);
			if (el) el.classList.add('flash');

			const strength = Math.min(30 + flashes * 6, 120);
			vib(strength);

			lastId = id;
			flashes++;
			const delay = 55 + flashes * 13;
			if (flashes < maxFlashes) {
				cdTimer = setTimeout(flash, delay);
			} else {
				cdTimer = setTimeout(() => pickWinner(id, ids), 100);
			}
		}
		flash();
	}

	function pickWinner(winnerId: number, ids: number[]) {
		if (phase !== 'picking') return;
		phase = 'done';
		vib([0, 200, 80, 200, 80, 400]);

		ids.forEach((id) => {
			const el = document.getElementById('fp-dot-' + id);
			if (!el) return;
			el.classList.remove('flash');
			if (id === winnerId) {
				el.classList.add('winner');
			} else {
				el.classList.add('loser');
				setTimeout(() => el.remove(), 380);
			}
		});

		showLabel = true;
	}

	function handleTouchStart(e: TouchEvent) {
		e.preventDefault();

		if (phase === 'done') {
			if (containerEl) containerEl.querySelectorAll('.fp-dot').forEach((d) => d.remove());
			touches.clear();
			usedColors.clear();
			showLabel = false;
			showHint = true;
			phase = 'idle';
			return;
		}

		for (const t of e.changedTouches) {
			const ci = pickColor();
			touches.set(t.identifier, { x: t.clientX, y: t.clientY, ci });
			createDot(t.identifier, t.clientX, t.clientY, ci);
		}
		vib([80, 30, 80]);

		if (phase === 'countdown' || phase === 'picking') {
			if (containerEl) containerEl.querySelectorAll('.fp-dot').forEach((d) => d.remove());
			reset();
			touches.forEach((v, k) => createDot(k, v.x, v.y, v.ci));
			if (touches.size >= 2) startCountdown();
		} else {
			showHint = false;
			if (touches.size >= 2) startCountdown();
		}
	}

	function handleTouchMove(e: TouchEvent) {
		e.preventDefault();
		if (phase === 'done') return;
		for (const t of e.touches) {
			if (touches.has(t.identifier)) {
				const old = touches.get(t.identifier)!;
				touches.set(t.identifier, { ...old, x: t.clientX, y: t.clientY });
				moveDot(t.identifier, t.clientX, t.clientY);
			}
		}
	}

	function handleTouchEnd(e: TouchEvent) {
		e.preventDefault();
		if (phase === 'done') return;

		const wasActive = phase === 'countdown' || phase === 'picking';

		for (const t of e.changedTouches) {
			touches.delete(t.identifier);
			removeDot(t.identifier);
		}

		if (wasActive) {
			if (containerEl) {
				containerEl.querySelectorAll('.fp-dot').forEach((d) => {
					d.className = 'fp-dot in';
				});
			}
			reset();
			if (touches.size >= 2) startCountdown();
			else showHint = touches.size === 0;
		} else {
			if (touches.size < 2) reset();
			if (touches.size === 0) showHint = true;
		}
	}

	function handleTouchCancel(e: TouchEvent) {
		for (const t of e.changedTouches) {
			touches.delete(t.identifier);
			removeDot(t.identifier);
		}
		if (containerEl) containerEl.querySelectorAll('.fp-dot').forEach((d) => d.remove());
		touches.clear();
		stopPulseVib();
		reset();
		showHint = true;
	}

	function handleClose() {
		// cleanup
		if (cdTimer) clearTimeout(cdTimer);
		stopPulseVib();
		touches.clear();
		usedColors.clear();
		phase = 'idle';
		showCd = false;
		showLabel = false;
		showStatus = false;
		showHint = true;
		if (containerEl) containerEl.querySelectorAll('.fp-dot').forEach((d) => d.remove());
		props.onclose();
	}

	// Must attach touch events as non-passive so preventDefault works
	$effect(() => {
		const el = containerEl;
		if (!el || !props.open) return;

		el.addEventListener('touchstart', handleTouchStart, { passive: false });
		el.addEventListener('touchmove', handleTouchMove, { passive: false });
		el.addEventListener('touchend', handleTouchEnd, { passive: false });
		el.addEventListener('touchcancel', handleTouchCancel, { passive: false });

		return () => {
			el.removeEventListener('touchstart', handleTouchStart);
			el.removeEventListener('touchmove', handleTouchMove);
			el.removeEventListener('touchend', handleTouchEnd);
			el.removeEventListener('touchcancel', handleTouchCancel);
		};
	});
</script>

{#if props.open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fp-overlay"
		bind:this={containerEl}
	>
		<!-- Close button -->
		<button class="fp-close-btn" onclick={handleClose} aria-label="Đóng">✕</button>

		<!-- Title -->
		<div class="fp-title">Tay ải tay ai 👇</div>

		<!-- Hint -->
		<div class="fp-hint" class:fp-hidden={!showHint}>
			Đặt ngón tay lên màn hình
			<span class="fp-hint-sub">ít nhất 2 ngón để bắt đầu</span>
		</div>

		<!-- Countdown -->
		<div class="fp-countdown" class:fp-hidden={!showCd}>{cdText}</div>

		<!-- Status -->
		<div class="fp-status" class:fp-visible={showStatus}>Giữ nguyên — đang đếm ngược</div>

		<!-- Label -->
		<div class="fp-label" class:fp-label-show={showLabel}>🎉 Ngón tay được chọn!</div>
	</div>
{/if}

<style>
	.fp-overlay {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background: #111;
		touch-action: none;
		user-select: none;
		overflow: hidden;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
	}

	.fp-close-btn {
		position: fixed;
		top: 20px;
		right: 20px;
		z-index: 10001;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.12);
		border: none;
		color: rgba(255, 255, 255, 0.7);
		font-size: 16px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s;
	}
	.fp-close-btn:active {
		background: rgba(255, 255, 255, 0.22);
	}

	.fp-title {
		position: fixed;
		top: 22px;
		left: 50%;
		transform: translateX(-50%);
		color: rgba(255, 255, 255, 0.35);
		font-size: 14px;
		font-weight: 600;
		letter-spacing: 0.04em;
		pointer-events: none;
		white-space: nowrap;
		z-index: 10001;
	}

	.fp-hint {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: rgba(255, 255, 255, 0.2);
		font-size: 15px;
		text-align: center;
		line-height: 1.85;
		pointer-events: none;
		transition: opacity 0.45s;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}
	.fp-hint-sub {
		font-size: 12px;
		opacity: 0.5;
		letter-spacing: 0.04em;
	}
	.fp-hidden {
		opacity: 0 !important;
		pointer-events: none;
	}

	.fp-countdown {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 130px;
		font-weight: 100;
		color: rgba(255, 255, 255, 0.055);
		pointer-events: none;
	}

	.fp-status {
		position: fixed;
		bottom: 44px;
		left: 50%;
		transform: translateX(-50%);
		color: rgba(255, 255, 255, 0.22);
		font-size: 12px;
		letter-spacing: 0.06em;
		pointer-events: none;
		transition: opacity 0.4s;
		opacity: 0;
		white-space: nowrap;
	}
	.fp-status.fp-visible {
		opacity: 1;
	}

	.fp-label {
		position: fixed;
		bottom: 44px;
		left: 50%;
		transform: translateX(-50%);
		font-size: 13px;
		letter-spacing: 0.05em;
		pointer-events: none;
		color: rgba(255, 255, 255, 0);
		transition: color 0.5s 0.45s;
		white-space: nowrap;
	}
	.fp-label.fp-label-show {
		color: rgba(255, 255, 255, 0.4);
	}

	/* ── Dots injected dynamically ── */
	:global(.fp-ripple-el) {
		position: absolute;
		width: 110px;
		height: 110px;
		border-radius: 50%;
		pointer-events: none;
		animation: fp-ripple 0.45s ease-out forwards;
	}
	@keyframes -global-fp-ripple {
		0% {
			transform: translate(-50%, -50%) scale(0.5);
			opacity: 0.28;
		}
		100% {
			transform: translate(-50%, -50%) scale(1.7);
			opacity: 0;
		}
	}

	:global(.fp-dot) {
		position: absolute;
		width: 110px;
		height: 110px;
		border-radius: 50%;
		transform: translate(-50%, -50%) scale(0.5);
		opacity: 0;
		pointer-events: none;
		transition:
			transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
			opacity 0.2s;
		will-change: transform, opacity;
		z-index: 5;
	}
	:global(.fp-dot.in) {
		transform: translate(-50%, -50%) scale(1);
		opacity: 1;
	}
	:global(.fp-dot-inner) {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		transition:
			transform 0.15s,
			opacity 0.15s;
	}
	:global(.fp-crown) {
		position: absolute;
		top: -26px;
		left: 50%;
		transform: translateX(-50%);
		font-size: 20px;
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.4s 0.35s;
	}
	:global(.fp-dot.winner .fp-crown) {
		opacity: 1;
	}

	@keyframes -global-fp-pulse {
		0% {
			box-shadow: 0 0 0 0 var(--glow);
		}
		70% {
			box-shadow: 0 0 0 18px transparent;
		}
		100% {
			box-shadow: 0 0 0 0 transparent;
		}
	}
	:global(.fp-dot.pulsing .fp-dot-inner) {
		animation: fp-pulse 0.85s ease-out infinite;
	}

	:global(.fp-dot.flash) {
		transform: translate(-50%, -50%) scale(1.12);
		z-index: 10;
	}
	:global(.fp-dot.flash .fp-dot-inner) {
		transform: scale(1.08);
	}

	@keyframes -global-fp-winPop {
		0% {
			transform: translate(-50%, -50%) scale(1.12);
		}
		55% {
			transform: translate(-50%, -50%) scale(1.5);
		}
		80% {
			transform: translate(-50%, -50%) scale(1.33);
		}
		100% {
			transform: translate(-50%, -50%) scale(1.38);
		}
	}
	:global(.fp-dot.winner) {
		animation: fp-winPop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
		z-index: 20;
	}
	:global(.fp-dot.loser) {
		transition:
			transform 0.32s ease,
			opacity 0.32s ease !important;
		transform: translate(-50%, -50%) scale(0.15) !important;
		opacity: 0 !important;
	}
</style>
