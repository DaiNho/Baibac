<script lang="ts">
	import FingerPicker from '$/lib/components/FingerPicker.svelte';

	let showFingerPicker = $state(false);
</script>

<FingerPicker open={showFingerPicker} onclose={() => (showFingerPicker = false)} />

<!-- App logo / greeting -->
<div class="home-hero animate__animated animate__fadeIn">
	<div class="home-logo">🎴</div>
	<div>
		<h1 class="home-title">Sâm Log</h1>
		<p class="home-sub">Chọn trò chơi để bắt đầu</p>
	</div>
</div>

<!-- Game cards -->
<div class="home-cards animate__animated animate__fadeInUp" style="animation-delay: 0.08s">

	<!-- Card 1: Sâm lọ -->
	<a href="/tables" class="game-card game-card-sam">
		<div class="game-card-glow game-glow-sam"></div>
		<div class="game-card-body">
			<span class="game-card-emoji">🃏</span>
			<div class="game-card-text">
				<span class="game-card-name">Sâm lọ</span>
				<span class="game-card-desc">Ghi điểm · Xếp hạng · Tính tiền</span>
			</div>
		</div>
		<div class="game-card-tag">Bắt đầu →</div>
	</a>

	<!-- Card 2: Tay ải tay ai -->
	<button class="game-card game-card-finger" onclick={() => (showFingerPicker = true)}>
		<div class="game-card-glow game-glow-finger"></div>
		<div class="game-card-body">
			<span class="game-card-emoji">👆</span>
			<div class="game-card-text">
				<span class="game-card-name">Tay ải tay ai</span>
				<span class="game-card-desc">Đặt ngón tay · Chọn người phát bài</span>
			</div>
		</div>
		<div class="game-card-tag">Chơi ngay →</div>
	</button>

</div>

<!-- Footer -->
<p class="home-footer animate__animated animate__fadeIn" style="animation-delay: 0.2s">
	Nhấn một trò để bắt đầu buổi chơi 🎯
</p>

<style>
	/* ── Hero ── */
	.home-hero {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 12px 0 8px;
	}
	.home-logo {
		font-size: 42px;
		line-height: 1;
		filter: drop-shadow(0 4px 16px rgba(240, 160, 80, 0.5));
	}
	.home-title {
		font-size: 26px;
		font-weight: 800;
		color: rgba(255, 255, 255, 0.92);
		letter-spacing: -0.02em;
		line-height: 1.1;
	}
	.home-sub {
		font-size: 13px;
		color: rgba(255, 255, 255, 0.35);
		margin-top: 3px;
	}

	/* ── Cards container ── */
	.home-cards {
		display: flex;
		flex-direction: column;
		gap: 16px;
		flex: 1;
		justify-content: center;
		margin: 12px 0;
	}

	/* ── Game card base ── */
	.game-card {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 16px;
		width: 100%;
		padding: 24px 22px 20px;
		border-radius: 24px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		background: rgba(255, 255, 255, 0.04);
		cursor: pointer;
		overflow: hidden;
		text-align: left;
		text-decoration: none;
		transition:
			transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
			border-color 0.2s,
			background 0.2s;
	}
	.game-card:active {
		transform: scale(0.96);
	}

	/* Glow blob */
	.game-card-glow {
		position: absolute;
		width: 220px;
		height: 220px;
		border-radius: 50%;
		right: -70px;
		bottom: -70px;
		opacity: 0.22;
		pointer-events: none;
		filter: blur(50px);
		transition: opacity 0.2s;
	}
	.game-card:active .game-card-glow {
		opacity: 0.35;
	}

	/* Sam lo – amber/orange */
	.game-card-sam {
		border-color: rgba(240, 160, 80, 0.22);
		background: linear-gradient(135deg, rgba(240, 160, 80, 0.06) 0%, rgba(255,255,255,0.02) 100%);
	}
	.game-card-sam:active {
		border-color: rgba(240, 160, 80, 0.4);
	}
	.game-glow-sam {
		background: radial-gradient(circle, #F0A050, #e8657a, transparent 70%);
	}

	/* Finger – violet/purple */
	.game-card-finger {
		border-color: rgba(166, 126, 232, 0.22);
		background: linear-gradient(135deg, rgba(166, 126, 232, 0.06) 0%, rgba(255,255,255,0.02) 100%);
	}
	.game-card-finger:active {
		border-color: rgba(166, 126, 232, 0.4);
	}
	.game-glow-finger {
		background: radial-gradient(circle, #A67EE8, #5ec9e2, transparent 70%);
	}

	/* Body row: emoji + text */
	.game-card-body {
		display: flex;
		align-items: center;
		gap: 16px;
	}
	.game-card-emoji {
		font-size: 48px;
		line-height: 1;
		flex-shrink: 0;
		filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5));
	}
	.game-card-text {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}
	.game-card-name {
		font-size: 22px;
		font-weight: 800;
		color: rgba(255, 255, 255, 0.92);
		letter-spacing: -0.01em;
	}
	.game-card-desc {
		font-size: 12px;
		color: rgba(255, 255, 255, 0.35);
		letter-spacing: 0.01em;
	}

	/* Tag / CTA */
	.game-card-tag {
		font-size: 13px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.22);
		letter-spacing: 0.02em;
	}

	/* ── Footer ── */
	.home-footer {
		text-align: center;
		font-size: 12px;
		color: rgba(255, 255, 255, 0.16);
		letter-spacing: 0.03em;
		padding-bottom: 4px;
	}
</style>
