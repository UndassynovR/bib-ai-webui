<script lang="ts">
	import { fade, fly } from "svelte/transition";
	import {
		BookOpenText,
		Calendar,
		Building,
		MapPin,
		Hash,
		Tag,
		X,
		LoaderCircle,
		CircleAlert,
		TriangleAlert,
		Bookmark,
		Languages,
		Layers,
		Search,
	} from "@lucide/svelte";
	import { bookmarkStore } from "$lib/stores/bookmarkStore.svelte";

	interface Book {
		DOC_ID: number;
		title?: string;
		title_continuation?: string;
		author?: string;
		other_authors?: string;
		year?: number;
		publisher?: string;
		publication_place?: string;
		isbn?: string;
		keywords?: string;
		text_language_code?: string;
		volume?: number;
	}

	const languages: Record<string, string> = {
		rus: "Русский",
		eng: "English",
		kaz: "Қазақша",
	};

	export let book: Book;
	export let onClose: () => void;

	// Reactive bookmark state
	$: bookmarkedIds = bookmarkStore.bookmarks;

	function getAuthors(book: Book): string {
		return (
			[book.author, book.other_authors].filter(Boolean).join(", ") ||
			"Автор не указан"
		);
	}

	async function handleBookmarkClick(docId: number, event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		await bookmarkStore.toggleBookmark(docId);
		bookmarkedIds = bookmarkStore.bookmarks;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Escape") {
			onClose();
		}
	}

	// Map each field to a human-readable search message and filter object
	function searchByField(field: string, value: any) {
		const fieldMap: Record<string, { message: string }> = {
			year: { message: `Книги ${value} года издания` },
			publisher: { message: `Книги издательства "${value}"` },
			publication_place: { message: `Книги, изданные в "${value}"` },
			isbn: { message: `ISBN: ${value}` },
			text_language_code: {
				message: `Книги на языке: ${languages[value] ?? value}`,
			},
			volume: { message: `Книги с объёмом ${value} страниц` },
			keyword: { message: `Книги по теме: "${value}"` },
		};

		const mapped = fieldMap[field];
		if (!mapped) return;

		window.dispatchEvent(
			new CustomEvent("search-filter", {
				detail: { message: mapped.message },
			}),
		);

		onClose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="popup-backdrop"
	onclick={onClose}
	transition:fade={{ duration: 200 }}
	role="presentation"
>
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="popup-modal"
		onclick={(e) => e.stopPropagation()}
		transition:fly={{ y: 20, duration: 300 }}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<!-- Header -->
		<div class="modal-header">
			<div class="flex-1 pr-4">
				<h2 class="modal-title">
					{#if book.title || book.title_continuation}
						{book.title || ""}{book.title_continuation
							? ` [${book.title_continuation}]`
							: ""}
					{:else}
						Без названия
					{/if}
				</h2>
				<p class="modal-subtitle">{getAuthors(book)}</p>
			</div>
			<div class="header-actions">
				<button
					onclick={(e) => handleBookmarkClick(book.DOC_ID, e)}
					class="bookmark-button"
					aria-label={bookmarkStore.isBookmarked(book.DOC_ID)
						? "Удалить из закладок"
						: "Добавить в закладки"}
				>
					<Bookmark
						size={24}
						fill={bookmarkedIds.includes(book.DOC_ID)
							? "currentColor"
							: "none"}
					/>
				</button>
				<button
					onclick={onClose}
					class="close-button"
					aria-label="Закрыть"
				>
					<X size={24} />
				</button>
			</div>
		</div>

		<!-- Content -->
		<div class="modal-content">
			<!-- Description Section -->
			<div>
				<h3 class="section-title">
					<BookOpenText size={20} />
					Описание
				</h3>

				{#await fetch(`/api/descriptions/${book.DOC_ID}`).then( (r) => r.json(), )}
					<div class="loading-state">
						<LoaderCircle class="spinner" size={32} />
						<span class="loading-text"
							>Загрузка описания, это может занять некоторое время</span
						>
					</div>
				{:then data}
					{#if data.failed || !data.description}
						<div class="warning-box">
							<TriangleAlert size={20} />
							<p>Описание недоступно</p>
						</div>
					{:else}
						<p class="description-text">{data.description}</p>
					{/if}
				{:catch error}
					<div class="error-box">
						<CircleAlert size={20} />
						<p>Ошибка загрузки описания</p>
					</div>
				{/await}
			</div>

			<!-- Book Details Grid -->
			<div class="details-section">
				<h3 class="section-title-secondary">Информация о книге</h3>
				<div class="details-grid">
					{#if book.year}
						<button
							class="detail-item detail-item--clickable"
							onclick={() => searchByField("year", book.year)}
							title="Найти книги {book.year} года"
						>
							<Calendar size={20} />
							<div>
								<p class="detail-label">Год издания</p>
								<p class="detail-value">{book.year}</p>
							</div>
							<Search size={14} class="search-hint" />
						</button>
					{/if}

					{#if book.publisher}
						<button
							class="detail-item detail-item--clickable"
							onclick={() =>
								searchByField("publisher", book.publisher)}
							title="Найти книги издательства «{book.publisher}»"
						>
							<Building size={20} />
							<div>
								<p class="detail-label">Издательство</p>
								<p class="detail-value">{book.publisher}</p>
							</div>
							<Search size={14} class="search-hint" />
						</button>
					{/if}

					{#if book.publication_place}
						<button
							class="detail-item detail-item--clickable"
							onclick={() =>
								searchByField(
									"publication_place",
									book.publication_place,
								)}
							title="Найти книги из «{book.publication_place}»"
						>
							<MapPin size={20} />
							<div>
								<p class="detail-label">Место издания</p>
								<p class="detail-value">
									{book.publication_place}
								</p>
							</div>
							<Search size={14} class="search-hint" />
						</button>
					{/if}

					{#if book.isbn}
						<button
							class="detail-item detail-item--clickable"
							onclick={() => searchByField("isbn", book.isbn)}
							title="Найти по ISBN"
						>
							<Hash size={20} />
							<div>
								<p class="detail-label">ISBN</p>
								<p class="detail-value">{book.isbn}</p>
							</div>
							<Search size={14} class="search-hint" />
						</button>
					{/if}

					{#if book.text_language_code}
						<button
							class="detail-item detail-item--clickable"
							onclick={() =>
								searchByField(
									"text_language_code",
									book.text_language_code,
								)}
							title="Найти книги на этом языке"
						>
							<Languages size={20} />
							<div>
								<p class="detail-label">Язык</p>
								<p class="detail-value">
									{languages[book.text_language_code] ??
										book.text_language_code}
								</p>
							</div>
							<Search size={14} class="search-hint" />
						</button>
					{/if}

					{#if book.volume}
						<div class="detail-item">
							<Layers size={20} />
							<div>
								<p class="detail-label">Объем</p>
								<p class="detail-value">{book.volume}</p>
							</div>
						</div>
					{/if}

					{#if book.keywords}
						<div class="detail-item keywords-item">
							<Tag size={20} />
							<div class="flex-1">
								<p class="detail-label">Ключевые слова</p>
								<div class="keywords-container">
									{#each book.keywords.split(",") as keyword}
										<button
											class="keyword-tag keyword-tag--clickable"
											onclick={() =>
												searchByField(
													"keyword",
													keyword.trim(),
												)}
											title="Найти книги по теме «{keyword.trim()}»"
										>
											{keyword.trim()}
										</button>
									{/each}
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	/* Popup Styles */
	.popup-backdrop {
		position: fixed;
		inset: 0;
		background: var(--bg-primary);
		opacity: 0.95;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}

	.popup-modal {
		background: var(--bg-primary);
		border-radius: 12px;
		box-shadow: 0 20px 40px var(--shadow-lg);
		max-width: 48rem;
		width: 100%;
		max-height: 90vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		border: 1px solid var(--border-color);
	}

	.modal-header {
		display: flex;
		align-items: start;
		justify-content: space-between;
		padding: 1.5rem;
		border-bottom: 1px solid var(--border-color);
	}

	.modal-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}

	.modal-subtitle {
		color: var(--text-secondary);
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.bookmark-button {
		flex-shrink: 0;
		color: var(--text-tertiary);
		transition: all 0.3s ease;
		padding: 0.25rem;
		background: transparent;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.bookmark-button:hover {
		color: #4a7dc2;
		transform: scale(1.1);
	}

	.close-button {
		flex-shrink: 0;
		color: var(--text-tertiary);
		transition: color 0.3s ease;
		padding: 0.25rem;
		background: transparent;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-button:hover {
		color: var(--text-secondary);
	}

	.modal-content {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.section-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.section-title :global(svg) {
		color: #4a7dc2;
	}

	.loading-state {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	:global(.spinner) {
		animation: spin 1s linear infinite;
		color: #4a7dc2;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.loading-text {
		margin-left: 0.75rem;
		color: var(--text-secondary);
	}

	.warning-box {
		display: flex;
		align-items: start;
		gap: 0.75rem;
		padding: 1rem;
		background: #fef3cd;
		border: 1px solid #f0d896;
		border-radius: 8px;
		color: #8a6d3b;
	}

	.warning-box :global(svg) {
		flex-shrink: 0;
		margin-top: 0.125rem;
	}

	.error-box {
		display: flex;
		align-items: start;
		gap: 0.75rem;
		padding: 1rem;
		background: #f8d7da;
		border: 1px solid #f1b0b7;
		border-radius: 8px;
		color: #842029;
	}

	.error-box :global(svg) {
		flex-shrink: 0;
		margin-top: 0.125rem;
	}

	.description-text {
		color: var(--text-primary);
		line-height: 1.7;
	}

	.details-section {
		border-top: 1px solid var(--border-color);
		padding-top: 1.5rem;
	}

	.section-title-secondary {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 1rem;
	}

	.details-grid {
		display: grid;
		grid-template-columns: repeat(1, 1fr);
		gap: 1rem;
	}

	@media (min-width: 768px) {
		.details-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.detail-item {
		display: flex;
		align-items: start;
		gap: 0.75rem;
	}

	.keywords-item {
		grid-column: 1 / -1;
	}

	.detail-item :global(svg) {
		color: var(--text-tertiary);
		flex-shrink: 0;
	}

	.detail-label {
		font-size: 0.875rem;
		color: var(--text-tertiary);
	}

	.detail-value {
		color: var(--text-primary);
		font-weight: 500;
	}

	.keywords-container {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.keyword-tag {
		padding: 0.5rem 0.75rem;
		background: var(--bg-tertiary);
		color: var(--text-secondary);
		font-size: 0.875rem;
		border-radius: 9999px;
		border: 1px solid var(--border-color);
	}

	:global(body:has(.popup-backdrop)) {
		overflow: hidden;
	}

	.detail-item--clickable {
		all: unset;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
		border-radius: 0.5rem;
		padding: 0.5rem;
		margin: -0.5rem;
		transition: background-color 0.15s ease;
		width: 100%;
		box-sizing: border-box;
		position: relative;
	}

	.detail-item--clickable:hover {
		background-color: color-mix(in srgb, currentColor 8%, transparent);
	}

	.detail-item--clickable:hover :global(.search-hint) {
		opacity: 1;
	}

	:global(.search-hint) {
		opacity: 0;
		margin-left: auto;
		flex-shrink: 0;
		transition: opacity 0.15s ease;
		color: currentColor;
	}

	.keyword-tag--clickable {
		all: unset;
		cursor: pointer;
		/* inherit your existing .keyword-tag styles */
		display: inline-block;
		border-radius: 9999px;
		padding: 0.2rem 0.6rem;
		font-size: 0.8rem;
		transition: filter 0.15s ease;
	}

	.keyword-tag--clickable:hover {
		filter: brightness(0.85);
	}
</style>
