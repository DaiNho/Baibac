<script lang="ts">
	const props: { open: boolean; onclose: () => void } = $props();

	let containerEl: HTMLDivElement | null = $state(null);

	let touches = new Map<number, { x: number; y: number }>();
	let phase: 'idle' | 'countdown' | 'picking' | 'done' = 'idle';
	let cdTimer: ReturnType<typeof setTimeout> | null = null;

	let showHint = $state(true);
	let showLabel = $state(false);
	let pickingFlash = $state(false); // subtle bg pulse during picking

	/* ── Haptics ── */
	function vib(p: number | number[]) {
		try { if (navigator.vibrate) navigator.vibrate(p as any); } catch {}
	}
	let pulseVibTimer: ReturnType<typeof setTimeout> | null = null;
	function startPulseVib() {
		stopPulseVib();
		const loop = () => { vib([70, 55]); pulseVibTimer = setTimeout(loop, 900); };
		loop();
	}
	function stopPulseVib() {
		if (pulseVibTimer) { clearTimeout(pulseVibTimer); pulseVibTimer = null; }
		vib(0);
	}

	/* ── Dot DOM helpers ── */
	function createDot(id: number, x: number, y: number) {
		if (!containerEl) return;
		const wrap = document.createElement('div');
		wrap.className = 'ch-dot';
		wrap.id = 'ch-dot-' + id;
		wrap.style.left = x + 'px';
		wrap.style.top  = y + 'px';

		const ring  = document.createElement('div'); ring.className  = 'ch-ring';
		const inner = document.createElement('div'); inner.className = 'ch-inner';
		wrap.appendChild(ring);
		wrap.appendChild(inner);
		containerEl.appendChild(wrap);
		requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('in')));
	}

	function removeDot(id: number) {
		document.getElementById('ch-dot-' + id)?.remove();
	}

	function moveDot(id: number, x: number, y: number) {
		const el = document.getElementById('ch-dot-' + id);
		if (el) { el.style.left = x + 'px'; el.style.top = y + 'px'; }
	}

	function allDots() {
		return containerEl?.querySelectorAll('.ch-dot') ?? [];
	}

	/* ── State machine ── */
	function reset() {
		if (cdTimer) clearTimeout(cdTimer);
		stopPulseVib();
		cdTimer = null;
		phase = 'idle';
		showLabel = false;
		pickingFlash = false;
		allDots().forEach(d => d.classList.remove('pulsing','flash','winner','loser'));
		showHint = touches.size === 0;
	}

	function startCountdown() {
		if (phase === 'countdown') return;
		phase = 'countdown';
		showHint = false;
		allDots().forEach(d => d.classList.add('pulsing'));
		vib([80, 40, 80, 40, 80]);
		startPulseVib();

		// 1.5 s hold then pick
		cdTimer = setTimeout(() => {
			stopPulseVib();
			allDots().forEach(d => d.classList.remove('pulsing'));
			startPicking();
		}, 1500);
	}

	function startPicking() {
		phase = 'picking';
		pickingFlash = true;
		vib([0, 80, 40, 80, 40, 120]);

		const ids = Array.from(touches.keys());

		// All dots blink together in perfect sync
		allDots().forEach(d => {
			d.classList.add('syncing');
		});

		// After ~3s of gentle breathing, pick a random winner
		cdTimer = setTimeout(() => {
			if (phase !== 'picking') return;
			allDots().forEach(d => d.classList.remove('syncing'));
			const winnerId = ids[Math.floor(Math.random() * ids.length)];
			pickWinner(winnerId, ids);
		}, 3000);
	}

	function pickWinner(winnerId: number, ids: number[]) {
		if (phase !== 'picking') return;
		phase = 'done';
		pickingFlash = false;
		vib([0, 160, 60, 160, 60, 320]);

		ids.forEach(id => {
			const el = document.getElementById('ch-dot-' + id);
			if (!el) return;
			el.classList.remove('syncing', 'flash');
			if (id === winnerId) {
				el.classList.add('winner');
			} else {
				el.classList.add('loser');
				setTimeout(() => el.remove(), 350);
			}
		});
		showLabel = true;
	}

	/* ── Touch handlers ── */
	function handleTouchStart(e: TouchEvent) {
		e.preventDefault();

		// If done phase: ignore new touches (auto-reset will happen on touchend)
		if (phase === 'done') return;

		for (const t of e.changedTouches) {
			// Remove stale dot if id was recycled by the browser
			if (touches.has(t.identifier)) removeDot(t.identifier);
			touches.set(t.identifier, { x: t.clientX, y: t.clientY });
			createDot(t.identifier, t.clientX, t.clientY);
		}
		vib([50, 20, 50]);

		if (phase === 'countdown' || phase === 'picking') {
			allDots().forEach(d => d.remove());
			reset();
			touches.forEach((v, k) => createDot(k, v.x, v.y));
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
				touches.set(t.identifier, { x: t.clientX, y: t.clientY });
				moveDot(t.identifier, t.clientX, t.clientY);
			}
		}
	}

	function handleTouchEnd(e: TouchEvent) {
		e.preventDefault();

		// Always remove lifted fingers from our map
		for (const t of e.changedTouches) {
			touches.delete(t.identifier);
		}

		if (phase === 'done') {
			// Auto-reset as soon as ALL fingers are lifted
			if (e.touches.length === 0) {
				allDots().forEach(d => d.remove());
				touches.clear();
				showLabel = false;
				showHint = true;
				phase = 'idle';
			}
			return;
		}

		// Remove the dot for each lifted finger
		for (const t of e.changedTouches) {
			removeDot(t.identifier);
		}

		const wasActive = phase === 'countdown' || phase === 'picking';
		if (wasActive) {
			allDots().forEach(d => { d.className = 'ch-dot in'; });
			reset();
			if (touches.size >= 2) startCountdown();
			else showHint = touches.size === 0;
		} else {
			if (touches.size < 2) reset();
			if (touches.size === 0) showHint = true;
		}
	}

	function handleTouchCancel(e: TouchEvent) {
		for (const t of e.changedTouches) { touches.delete(t.identifier); removeDot(t.identifier); }
		allDots().forEach(d => d.remove());
		touches.clear(); stopPulseVib(); reset(); showHint = true;
	}

	/* ── Close ── */
	function handleClose() {
		if (cdTimer) clearTimeout(cdTimer);
		stopPulseVib();
		touches.clear();
		phase = 'idle';
		showLabel = false;
		showHint = true;
		allDots().forEach(d => d.remove());
		props.onclose();
	}

	/* ── Non-passive touch listeners ── */
	$effect(() => {
		const el = containerEl;
		if (!el || !props.open) return;
		el.addEventListener('touchstart',  handleTouchStart,  { passive: false });
		el.addEventListener('touchmove',   handleTouchMove,   { passive: false });
		el.addEventListener('touchend',    handleTouchEnd,    { passive: false });
		el.addEventListener('touchcancel', handleTouchCancel, { passive: false });
		return () => {
			el.removeEventListener('touchstart',  handleTouchStart);
			el.removeEventListener('touchmove',   handleTouchMove);
			el.removeEventListener('touchend',    handleTouchEnd);
			el.removeEventListener('touchcancel', handleTouchCancel);
		};
	});
</script>

{#if props.open}
<div
	class="ch-overlay"
	class:ch-picking={pickingFlash}
	bind:this={containerEl}
>
	<!-- Settings / close button (top-right, like Chooser!) -->
	<button class="ch-close" onclick={handleClose} aria-label="Đóng">✕</button>

	<!-- Idle hint – big bold white text centre -->
	{#if showHint}
		<div class="ch-idle">
			<p class="ch-idle-title">NGƯỜI<br/>CHỌN</p>
			<p class="ch-idle-sub">Đặt ngón tay lên màn hình</p>
		</div>
	{/if}

	<!-- Winner result -->
	{#if showLabel}
		<div class="ch-result">
			<p class="ch-result-title">🎉 Đã chọn!</p>
			<p class="ch-result-sub">Nhấn màn hình để chơi lại</p>
		</div>
	{/if}
</div>
{/if}

<style>
/* ══════════════════════════════════════
   CHOOSER!  –  pixel-perfect clone
   Gradient: coral-red → vivid orange
══════════════════════════════════════ */
.ch-overlay {
	position: fixed;
	inset: 0;
	z-index: 9999;
	background: linear-gradient(175deg, #FF4B5C 0%, #FF6B35 50%, #FF9500 100%);
	touch-action: none;
	user-select: none;
	overflow: hidden;
	font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
	transition: background 0.3s;
}
/* subtle brightness shift during picking flash */
.ch-overlay.ch-picking {
	filter: brightness(1.06);
}

/* ── Close / settings button ── */
.ch-close {
	position: fixed;
	top: 54px;
	right: 20px;
	z-index: 10010;
	width: 40px;
	height: 40px;
	border-radius: 50%;
	background: rgba(0, 0, 0, 0.18);
	border: none;
	color: rgba(255,255,255,0.9);
	font-size: 16px;
	font-weight: 700;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: background 0.15s, transform 0.1s;
}
.ch-close:active { background: rgba(0,0,0,0.32); transform: scale(0.9); }

/* ── Idle big text ── */
.ch-idle {
	position: fixed;
	inset: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 10px;
	pointer-events: none;
}
.ch-idle-title {
	font-size: clamp(48px, 15vw, 72px);
	font-weight: 900;
	color: #fff;
	text-align: center;
	line-height: 1.05;
	letter-spacing: -0.02em;
	text-shadow: 0 4px 20px rgba(0,0,0,0.15);
}
.ch-idle-sub {
	font-size: 16px;
	font-weight: 500;
	color: rgba(255,255,255,0.7);
	text-align: center;
}

/* ── Winner result ── */
.ch-result {
	position: fixed;
	bottom: 60px;
	left: 50%;
	transform: translateX(-50%);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;
	animation: ch-result-in 0.4s 0.45s both;
}
@keyframes ch-result-in {
	from { opacity:0; transform: translateX(-50%) translateY(12px); }
	to   { opacity:1; transform: translateX(-50%) translateY(0); }
}
.ch-result-title {
	font-size: 22px;
	font-weight: 900;
	color: #fff;
	text-shadow: 0 2px 12px rgba(0,0,0,0.25);
}
.ch-result-sub {
	font-size: 13px;
	color: rgba(255,255,255,0.65);
	font-weight: 500;
}

/* ════════════════════════════════
   DOTS  –  injected dynamically
════════════════════════════════ */
:global(.ch-dot) {
	position: absolute;
	width: 158px;
	height: 158px;
	border-radius: 50%;
	transform: translate(-50%, -50%) scale(0.15);
	opacity: 0;
	pointer-events: none;
	will-change: transform, opacity;
	transition:
		transform 0.4s cubic-bezier(0.25, 1, 0.5, 1),
		opacity 0.3s ease;
	z-index: 5;
}
:global(.ch-dot.in) {
	transform: translate(-50%, -50%) scale(1);
	opacity: 1;
}

/* White outer ring */
:global(.ch-ring) {
	position: absolute;
	inset: 0;
	border-radius: 50%;
	background: #fff;
	box-shadow: 0 6px 32px rgba(0, 0, 0, 0.18);
	transition: box-shadow 0.6s ease;
}

/* Pale-pink / cream inner fill */
:global(.ch-inner) {
	position: absolute;
	inset: 14px;
	border-radius: 50%;
	background: rgba(255, 220, 205, 0.88);
	transition:
		inset 0.5s ease,
		background 0.5s ease;
}

/* ── Pulsing (countdown hold) ── */
@keyframes -global-ch-pulse {
	0% {
		box-shadow:
			0 6px 32px rgba(0, 0, 0, 0.18),
			0 0 0 0 rgba(255, 255, 255, 0.6);
	}
	65% {
		box-shadow:
			0 6px 32px rgba(0, 0, 0, 0.18),
			0 0 0 22px rgba(255, 255, 255, 0);
	}
	100% {
		box-shadow:
			0 6px 32px rgba(0, 0, 0, 0.18),
			0 0 0 0 rgba(255, 255, 255, 0);
	}
}
:global(.ch-dot.pulsing .ch-ring) {
	animation: ch-pulse 1s ease-out infinite;
}

/* ── Syncing breathe: slow, visible, graceful ── */
@keyframes -global-ch-syncing {
	0%   { transform: translate(-50%,-50%) scale(1);    opacity: 1;    }
	40%  { transform: translate(-50%,-50%) scale(0.78); opacity: 0.55; }
	60%  { transform: translate(-50%,-50%) scale(0.78); opacity: 0.55; }
	100% { transform: translate(-50%,-50%) scale(1);    opacity: 1;    }
}
:global(.ch-dot.syncing) {
	animation: ch-syncing 1.1s ease-in-out infinite;
	transition: none !important;
}

/* ── Winner: gentle grow over 1.2s ── */
@keyframes -global-ch-win {
	0%   { transform: translate(-50%,-50%) scale(1);   }
	35%  { transform: translate(-50%,-50%) scale(1.15); }
	60%  { transform: translate(-50%,-50%) scale(1.42); }
	80%  { transform: translate(-50%,-50%) scale(1.38); }
	100% { transform: translate(-50%,-50%) scale(1.4);  }
}
:global(.ch-dot.winner) {
	animation: ch-win 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
	z-index: 20;
}
:global(.ch-dot.winner .ch-ring) {
	background: #fff;
	box-shadow:
		0 10px 60px rgba(255, 255, 255, 0.5),
		0 4px 24px rgba(0, 0, 0, 0.1);
}
:global(.ch-dot.winner .ch-inner) {
	inset: 0;
	background: #fff;
}

/* ── Loser: gentle shrink & fade ── */
:global(.ch-dot.loser) {
	transition:
		transform 0.55s cubic-bezier(0.4, 0, 0.2, 1),
		opacity  0.5s ease !important;
	transform: translate(-50%,-50%) scale(0.05) !important;
	opacity: 0 !important;
}
</style>
