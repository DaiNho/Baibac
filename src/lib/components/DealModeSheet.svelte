<script lang="ts">
	import FingerPicker from './FingerPicker.svelte';

	const props: {
		open: boolean;
		onclose: () => void;
		ondealcard: () => void;
	} = $props();

	let showFingerPicker = $state(false);

	function handleDealCard() {
		props.ondealcard();
		props.onclose();
	}

	function handleFingerPicker() {
		showFingerPicker = true;
	}

	function handleFingerPickerClose() {
		showFingerPicker = false;
	}
</script>

<FingerPicker open={showFingerPicker} onclose={handleFingerPickerClose} />

{#if props.open && !showFingerPicker}
	<div class="game-select-overlay animate__animated animate__fadeIn animate__faster">
		<!-- Ambient glow background -->
		<div class="ambient-glow"></div>

		<!-- Header -->
		<div class="gs-header">
			<button class="gs-back-btn" onclick={props.onclose} aria-label="Quay lại">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M19 12H5M12 5l-7 7 7 7"/>
				</svg>
			</button>
			<div class="gs-header-text">
				<p class="gs-header-title">Chọn kiểu chơi</p>
				<p class="gs-header-sub">Hôm nay chơi gì nào? 🎯</p>
			</div>
		</div>

		<!-- Game cards -->
		<div class="gs-cards">
			<!-- Card 1: Sâm lọ -->
			<button class="gs-card gs-card-sam" onclick={handleDealCard}>
				<div class="gs-card-glow gs-card-glow-sam"></div>
				<div class="gs-card-emoji">🃏</div>
				<div class="gs-card-info">
					<span class="gs-card-name">Sâm lọ</span>
					<span class="gs-card-desc">Đánh bài, ghi điểm từng ván</span>
				</div>
				<div class="gs-card-arrow">›</div>
			</button>

			<!-- Card 2: Tay ải tay ai -->
			<button class="gs-card gs-card-finger" onclick={handleFingerPicker}>
				<div class="gs-card-glow gs-card-glow-finger"></div>
				<div class="gs-card-emoji">👆</div>
				<div class="gs-card-info">
					<span class="gs-card-name">Tay ải tay ai</span>
					<span class="gs-card-desc">Đặt ngón tay để chọn người phát bài</span>
				</div>
				<div class="gs-card-arrow">›</div>
			</button>
		</div>

		<!-- Footer hint -->
		<p class="gs-footer">Nhấn một lựa chọn để bắt đầu</p>
	</div>
{/if}

<style>
	.game-select-overlay {
		position: fixed;
		inset: 0;
		z-index: 200;
		background: var(--background, #0e0e0e);
		display: flex;
		flex-direction: column;
		padding: 0 20px 32px;
		overflow: hidden;
	}

	/* Matches the layout's ambient spotlight */
	.ambient-glow {
		position: absolute;
		inset: 0;
		background: radial-gradient(ellipse at top, oklch(0.7686 0.1647 70.0804 / 0.12) 0%, transparent 65%);
		pointer-events: none;
	}

	/* ── Header ── */
	.gs-header {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 56px 0 32px;
	}

	.gs-back-btn {
		width: 40px;
		height: 40px;
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.08);
		color: rgba(255, 255, 255, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		cursor: pointer;
		transition: background 0.15s, transform 0.1s;
	}
	.gs-back-btn:active {
		background: rgba(255, 255, 255, 0.12);
		transform: scale(0.93);
	}

	.gs-header-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.gs-header-title {
		font-size: 20px;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.9);
		letter-spacing: -0.01em;
	}
	.gs-header-sub {
		font-size: 13px;
		color: rgba(255, 255, 255, 0.35);
	}

	/* ── Cards ── */
	.gs-cards {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		gap: 16px;
		flex: 1;
		justify-content: center;
		max-height: 400px;
		margin: auto 0;
	}

	.gs-card {
		position: relative;
		display: flex;
		align-items: center;
		gap: 18px;
		width: 100%;
		padding: 22px 20px;
		border-radius: 22px;
		border: 1px solid rgba(255, 255, 255, 0.09);
		background: rgba(255, 255, 255, 0.04);
		cursor: pointer;
		overflow: hidden;
		text-align: left;
		transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.2s;
	}
	.gs-card:active {
		transform: scale(0.965);
	}

	/* Glow accent behind each card */
	.gs-card-glow {
		position: absolute;
		width: 200px;
		height: 200px;
		border-radius: 50%;
		right: -60px;
		top: -60px;
		opacity: 0.18;
		pointer-events: none;
		filter: blur(40px);
		transition: opacity 0.2s;
	}
	.gs-card:active .gs-card-glow {
		opacity: 0.28;
	}

	.gs-card-sam {
		border-color: rgba(240, 160, 80, 0.2);
	}
	.gs-card-sam:active {
		border-color: rgba(240, 160, 80, 0.35);
	}
	.gs-card-glow-sam {
		background: radial-gradient(circle, #F0A050, transparent 70%);
	}

	.gs-card-finger {
		border-color: rgba(166, 126, 232, 0.2);
	}
	.gs-card-finger:active {
		border-color: rgba(166, 126, 232, 0.35);
	}
	.gs-card-glow-finger {
		background: radial-gradient(circle, #A67EE8, transparent 70%);
	}

	.gs-card-emoji {
		font-size: 42px;
		line-height: 1;
		flex-shrink: 0;
		filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4));
	}

	.gs-card-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex: 1;
	}
	.gs-card-name {
		font-size: 18px;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.92);
		letter-spacing: -0.01em;
	}
	.gs-card-desc {
		font-size: 13px;
		color: rgba(255, 255, 255, 0.38);
		line-height: 1.4;
	}

	.gs-card-arrow {
		font-size: 24px;
		color: rgba(255, 255, 255, 0.2);
		flex-shrink: 0;
		margin-left: 4px;
	}

	/* ── Footer ── */
	.gs-footer {
		position: relative;
		z-index: 1;
		text-align: center;
		font-size: 12px;
		color: rgba(255, 255, 255, 0.18);
		letter-spacing: 0.03em;
	}
</style>
