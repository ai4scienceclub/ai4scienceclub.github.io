import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
	classicThemeIcon,
	darkThemeIcon,
} from './icons';

const validThemes = ['light', 'dark'] as const;
type ThemeName = (typeof validThemes)[number];

@customElement('theme-switcher')
export class ThemeSwitcher extends LitElement {
	static styles = [
		css`
			:host {
				display: block;
			}
			button {
				display: inline-flex;
				align-items: center;
				gap: 0.5rem;
				outline: none;
				background-color: transparent;
				border: 2px solid var(--theme-primary);
				color: var(--theme-on-bg);
				border-radius: 999px;
				padding: 0.25rem 0.75rem;
				cursor: pointer;
				transition: box-shadow var(--theme-transition);
			}
			button:hover {
				box-shadow: 0 0 12px 1px var(--theme-primary);
			}
			button span {
				font-size: var(--font-size-sm);
			}
		`,
	];

	// set the _doc element
	private _doc = document.firstElementChild;

	@property({ type: String })
	theme: string | null = null;

	private _getCurrentTheme() {
		// check for a local storage theme first
		const localStorageTheme = localStorage.getItem('theme');
		if (localStorageTheme === 'default') {
			this._setTheme('light');
			return;
		}

		if (localStorageTheme && this._isValidTheme(localStorageTheme)) {
			this._setTheme(localStorageTheme);
			return;
		}

		this._setTheme('dark');
	}

  firstUpdated() {
    this._getCurrentTheme();
  }

	private _isValidTheme(theme: string): theme is ThemeName {
		return validThemes.includes(theme as ThemeName);
	}

	private _setTheme(theme: ThemeName) {
		this._doc.setAttribute('data-theme', theme);
		const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
		if (favicon) {
			favicon.href =
				theme === 'light'
					? '/assets/images/brand/Icon_white.png'
					: '/assets/images/brand/Icon_black.png';
		}
		localStorage.setItem('theme', theme);
		this.theme = theme;
	}

	private _toggleTheme() {
		const nextTheme: ThemeName = this.theme === 'dark' ? 'light' : 'dark';
		this._setTheme(nextTheme);
	}

	render() {
		const isDark = this.theme === 'dark';
		const nextLabel = isDark ? 'Light' : 'Dark';
		const nextIcon = isDark ? classicThemeIcon : darkThemeIcon;

		return html`
			<button
				@click=${() => this._toggleTheme()}
				title=${`Switch to ${nextLabel} theme`}
				aria-label=${`Switch to ${nextLabel} theme`}
			>
				${nextIcon}
				<span>${nextLabel}</span>
			</button>
		`;
	}
}
