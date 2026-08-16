window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-plugin-usage",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		const React = require("react");

		// ── styles ─────────────────────────────────────────────────────────────
		const CSS = `
.du-root{box-sizing:border-box;width:100%;height:100%;min-height:0;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1);flex-direction:column;display:flex;overflow:hidden}
.du-toolbar{position:sticky;top:0;z-index:4;box-sizing:border-box;width:100%;height:32px;border-bottom:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);align-items:center;gap:4px;padding:0 8px;display:flex;flex:none}
.du-title{color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xs-13);flex:none;margin-right:4px}
.du-mode{box-sizing:border-box;height:20px;color:var(--dsw-alias-label-tertiary);cursor:pointer;font:var(--dsw-font-xxs-12);background:transparent;border:0;border-radius:3px;align-items:center;gap:4px;padding:0 7px;display:inline-flex;flex:none}
.du-mode:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}
.du-mode[aria-pressed=true]{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-active)}
.du-mode:focus-visible{outline:1px solid var(--dsw-alias-state-business-primary);outline-offset:1px}
.du-spacer{flex:1;min-width:8px}
.du-now{color:var(--dsw-alias-label-dimmed);font:var(--dsw-font-xxs-12);flex:none;white-space:nowrap}
.du-peak{box-sizing:border-box;height:18px;color:var(--dsw-alias-state-warn-label);font:var(--dsw-font-xxs-12);border:1px solid var(--dsw-alias-state-warn-tertiary);border-radius:9px;align-items:center;padding:0 7px;display:inline-flex;flex:none;white-space:nowrap}
.du-peak[data-off=true]{color:var(--dsw-alias-label-tertiary);border-color:var(--dsw-alias-border-l2)}
.du-scroll{flex:1;min-width:0;min-height:0;padding:10px 14px calc(var(--dsh-composer-height,152px) + 16px);overflow:hidden auto}
.du-section{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-2);margin-bottom:10px;overflow:hidden}
.du-sectionHead{box-sizing:border-box;width:100%;height:28px;border-bottom:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xs-13);align-items:center;justify-content:space-between;padding:0 10px;display:flex;flex:none}
.du-headBtn{box-sizing:border-box;width:100%;height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;font:var(--dsw-font-xs-13);background:transparent;border:0;border-bottom:1px solid var(--dsw-alias-border-l1);align-items:center;justify-content:space-between;padding:0 10px;display:flex;flex:none}
.du-headBtn:hover{background:var(--dsw-alias-interactive-bg-hover)}
.du-headBtn:focus-visible{outline:1px solid var(--dsw-alias-state-business-primary);outline-offset:-1px}
.du-headRight{align-items:center;gap:6px;display:flex}
.du-btn{box-sizing:border-box;height:20px;color:var(--dsw-alias-label-secondary);cursor:pointer;font:var(--dsw-font-xxs-12);background:transparent;border:1px solid var(--dsw-alias-border-l2);border-radius:3px;padding:0 7px;display:inline-flex;align-items:center;gap:4px;flex:none}
.du-btn:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-border-l3)}
.du-btn:focus-visible{outline:1px solid var(--dsw-alias-state-business-primary);outline-offset:1px}
.du-btnDanger:hover{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-secondary)}
.du-exportRow{box-sizing:border-box;align-items:center;gap:6px;padding:6px 12px;border-bottom:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xxs-12);display:flex}
.du-exportRow a{color:var(--dsw-alias-state-business-primary);text-decoration:none}
.du-exportRow a:hover{text-decoration:underline}
.du-overview{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))}
.du-ovCell{box-sizing:border-box;min-width:0;padding:10px 12px;border-right:1px solid var(--dsw-alias-border-l1);flex-direction:column;gap:3px;display:flex}
.du-ovCell:last-child{border-right:0}
.du-ovLabel{color:var(--dsw-alias-label-tertiary);font:var(--dsw-font-xxs-12)}
.du-ovValue{color:var(--dsw-alias-label-primary);font:var(--dsw-font-xs-strong-13);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.du-ovSub{color:var(--dsw-alias-label-dimmed);font:var(--dsw-font-xxs-12);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.du-modelRow{box-sizing:border-box;border-top:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xxs-12);align-items:center;gap:6px;padding:6px 12px;display:flex;overflow:hidden}
.du-modelRow .du-model{color:var(--dsw-alias-label-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.du-dot{width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-state-business-primary);flex:none}
.du-liveDot{width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-state-business-primary);flex:none;animation:du-pulse 1.2s ease-in-out infinite;display:inline-block;margin-right:5px;vertical-align:middle}
@keyframes du-pulse{0%,100%{opacity:1}50%{opacity:.3}}
.du-bars{padding:10px 12px 12px;flex-direction:column;gap:10px;display:flex}
.du-bar{flex-direction:column;gap:4px;display:flex}
.du-barHead{align-items:center;justify-content:space-between;display:flex}
.du-barLabel{color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xxs-12)}
.du-barValue{color:var(--dsw-alias-label-primary);font:var(--dsw-font-xxs-12);font-variant-numeric:tabular-nums}
.du-track{box-sizing:border-box;background:var(--dsw-alias-interactive-bg-hover);border-radius:3px;width:100%;height:6px;position:relative;overflow:hidden}
.du-fill{background:linear-gradient(90deg,#3b7cff 0%,#5f9dff 55%,#8fc0ff 100%);border-radius:3px;height:100%;transition:width .5s ease;position:absolute;top:0;left:0}
.du-table{width:100%;border-collapse:collapse;table-layout:fixed}
.du-table th{box-sizing:border-box;height:26px;color:var(--dsw-alias-label-tertiary);font:var(--dsw-font-xxs-12);font-weight:400;text-align:right;border-bottom:1px solid var(--dsw-alias-border-l1);padding:0 8px;white-space:nowrap;overflow:hidden}
.du-table th:first-child,.du-table td:first-child{text-align:left}
.du-table td{box-sizing:border-box;height:26px;color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xxs-12);text-align:right;border-bottom:1px solid var(--dsw-alias-border-l1);padding:0 8px;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.du-table tr:last-child td{border-bottom:0}
.du-table td.du-tModel{color:var(--dsw-alias-label-primary);text-align:left}
.du-empty{color:var(--dsw-alias-label-caption);font:var(--dsw-font-xs-13);text-align:center;padding:26px 0}
.du-loading{color:var(--dsw-alias-label-caption);font:var(--dsw-font-xs-13);text-align:center;padding:40px 0}
.du-priceBody{padding:8px 10px 10px;flex-direction:column;gap:8px;display:flex}
.du-priceTip{color:var(--dsw-alias-label-dimmed);font:var(--dsw-font-xxs-12);line-height:1.5}
.du-priceActions{display:flex;justify-content:flex-end}
.du-phead{display:grid;grid-template-columns:minmax(120px,1.3fr) 1.1fr 1.1fr 1.5fr auto;gap:8px;align-items:center;padding:4px 4px 6px;color:var(--dsw-alias-label-tertiary);font:var(--dsw-font-xxxs-11)}
.du-prow{display:grid;grid-template-columns:minmax(120px,1.3fr) 1.1fr 1.1fr 1.5fr auto;gap:8px;align-items:center;padding:5px 4px;border-top:1px solid var(--dsw-alias-border-l1)}
.du-pmodel{color:var(--dsw-alias-label-primary);font:var(--dsw-font-xxs-12);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.du-psrc{color:var(--dsw-alias-label-dimmed);font:var(--dsw-font-xxxs-11)}
.du-pcell{color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xxs-12);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.du-pops{display:flex;gap:4px;justify-content:flex-end}
.du-editForm{border:1px solid var(--dsw-alias-border-l1);border-radius:6px;background:var(--dsw-alias-bg-layer-1);padding:8px 10px;flex-direction:column;gap:8px;display:flex;margin-top:8px}
.du-editTitle{color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xxs-12);align-items:center;justify-content:space-between;display:flex}
.du-editGrid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}
.du-editGrid .du-field{min-width:0}
.du-field{flex-direction:column;gap:2px;display:flex;min-width:0}
.du-fieldLabel{color:var(--dsw-alias-label-tertiary);font:var(--dsw-font-xxxs-11);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.du-input{box-sizing:border-box;width:100%;height:22px;color:var(--dsw-alias-label-primary);font:var(--dsw-font-xxs-12);background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:3px;padding:0 6px;outline:none}
.du-input:focus{border-color:var(--dsw-alias-state-business-primary)}
.du-editFoot{display:flex;gap:6px;align-items:center;justify-content:flex-end}
.du-err{color:var(--dsw-alias-state-error-primary);font:var(--dsw-font-xxs-12)}
.du-muted{color:var(--dsw-alias-label-dimmed)}
`;

		// ── helpers ────────────────────────────────────────────────────────────
		function apiGet(path, params) {
			let url = path;
			if (params) {
				const keys = Object.keys(params).filter((k) => params[k] != null && params[k] !== '');
				if (keys.length > 0) {
					url += '?' + keys.map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(String(params[k]))).join('&');
				}
			}
			return fetch(url, { cache: 'no-store' }).then((r) => r.json());
		}
		function apiPost(path, body) {
			return fetch(path, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body || {}),
			}).then((r) => r.json());
		}

		function fmtTokens(n) {
			if (n == null) return '—';
			if (n >= 1e6) return String(Math.round(n / 1e6 * 100) / 100) + 'M';
			if (n >= 1e3) return String(Math.round(n / 1e3 * 100) / 100) + 'K';
			return String(n);
		}
		function fmtMoney(n, cur) {
			if (n == null) return '—';
			if (cur === '¥') {
				if (n >= 100) return '¥' + Math.round(n);
				if (n >= 1) return '¥' + n.toFixed(2);
				return '¥' + n.toFixed(4);
			}
			if (n >= 100) return '$' + Math.round(n);
			if (n >= 1) return '$' + n.toFixed(2);
			return '$' + n.toFixed(4);
		}
		function fmtTime(t) {
			const d = new Date(t);
			const p = function (x) { return (x < 10 ? '0' : '') + x; };
			return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
		}
		// Render a plan price entry: flat card or { off, peak } tiers.
		function goDisplay(g) {
			if (!g) return '—';
			if (g.peak && g.off) {
				return 'off $' + g.off.in + '/' + g.off.cache + '/' + g.off.out + ' · peak $' + g.peak.in + '/' + g.peak.cache + '/' + g.peak.out + ' · quota $' + g.quota;
			}
			return '$' + g.in + '/' + g.cache + '/' + g.out + (g.quota != null ? ' · quota $' + g.quota : '');
		}

		// ── price edit form ────────────────────────────────────────────────────
		function PriceForm(props) {
			const el = React.createElement;
			const form = props.form || {};
			const set = props.set;
			const modelLocked = props.modelLocked;
			function field(key, label) {
				return el('label', { className: 'du-field' },
					el('span', { className: 'du-fieldLabel' }, label),
					el('input', {
						type: 'number', step: 'any',
						className: 'du-input',
						value: form[key] == null ? '' : String(form[key]),
						onChange: function (e) { set(key, e.target.value); }
					})
				);
			}
			return el('div', { className: 'du-editForm' },
				el('div', { className: 'du-editTitle' },
					el('span', null, props.title),
					el('span', { className: 'du-muted' }, 'Unit price per 1M tokens (CNY/USD)')
				),
				el('div', { className: 'du-editGrid' },
					modelLocked
						? null
						: el('label', { className: 'du-field' },
							el('span', { className: 'du-fieldLabel' }, 'Model name'),
							el('input', {
								className: 'du-input',
								value: form.model == null ? '' : String(form.model),
								placeholder: 'e.g. deepseek-v4-flash',
								onChange: function (e) { set('model', e.target.value); }
							})
						),
					field('oPIn', 'Official·Peak input'),
					field('oPCache', 'Official·Peak cache'),
					field('oPOut', 'Official·Peak output'),
					field('oOIn', 'Official·Off input'),
					field('oOCache', 'Official·Off cache'),
					field('oOOut', 'Official·Off output'),
					field('gIn', 'Plan off-peak input'),
					field('gCache', 'Plan off-peak cache'),
					field('gOut', 'Plan off-peak output'),
					field('gPIn', 'Plan peak input'),
					field('gPCache', 'Plan peak cache'),
					field('gPOut', 'Plan peak output'),
					field('gQuota', 'Plan monthly quota')
				),
				el('div', { className: 'du-editFoot' },
					props.error ? el('span', { className: 'du-err' }, props.error) : null,
					el('button', { type: 'button', className: 'du-btn', onClick: props.onCancel }, 'Cancel'),
					el('button', { type: 'button', className: 'du-btn', onClick: props.onSave }, 'Save')
				)
			);
		}

		// ── main view ──────────────────────────────────────────────────────────
		function UsageView(props) {
			const el = React.createElement;
			const sessionId = props.sessionId;
			const hooks = props.hooks || {};
			const useTick = hooks.useUsageTick || function (sel) { return sel(0); };
			const tick = useTick(function (v) { return v; });
			const [data, setData] = React.useState(null);
			const [mode, setMode] = React.useState('auto');
			const [failed, setFailed] = React.useState(false);
			const [showPrice, setShowPrice] = React.useState(false);
			const [priceTable, setPriceTable] = React.useState(null);
			const [editing, setEditing] = React.useState(null);
			const [adding, setAdding] = React.useState(false);
			const [addForm, setAddForm] = React.useState({});
			const [err, setErr] = React.useState(null);
			const [exportInfo, setExportInfo] = React.useState(null);

			React.useEffect(function () {
				if (!sessionId) return;
				let alive = true;
				apiGet('/usage-api/state', { sessionId: sessionId }).then(function (res) {
					if (!alive) return;
					if (res && res.ok) {
						setData(res);
						setFailed(false);
					} else {
						setFailed(true);
					}
				}).catch(function () {
					if (alive) setFailed(true);
				});
				return function () { alive = false; };
			}, [sessionId, tick]);

			React.useEffect(function () {
				if (!sessionId) return;
				let alive = true;
				apiGet('/usage-api/prices', {}).then(function (res) {
					if (alive && res && res.ok) setPriceTable(res);
				}).catch(function () { /* ignore */ });
				return function () { alive = false; };
			}, [sessionId]);

			function refreshPrices() {
				apiGet('/usage-api/prices', {}).then(function (res) {
					if (res && res.ok) setPriceTable(res);
				}).catch(function () { /* ignore */ });
			}
			function switchMode(next) {
				setMode(next);
				apiPost('/usage-api/mode', { mode: next }).then(function (res) {
					if (res && res.ok) setMode(res.mode);
				}).catch(function () { /* ignore */ });
			}
			function ModeBtn(id, label) {
				return el('button', {
					type: 'button',
					className: 'du-mode',
					'aria-pressed': mode === id,
					onClick: function () { switchMode(id); }
				}, label);
			}
			function Bar(label, display, pct) {
				const width = Math.max(0, Math.min(100, pct));
				return el('div', { className: 'du-bar' },
					el('div', { className: 'du-barHead' },
						el('span', { className: 'du-barLabel' }, label),
						el('span', { className: 'du-barValue' }, display)
					),
					el('div', { className: 'du-track' },
						el('div', { className: 'du-fill', style: { width: width + '%' } })
					)
				);
			}
			function doExport() {
				apiGet('/usage-api/export', { sessionId: sessionId, format: 'both' }).then(function (res) {
					if (res && res.ok && res.urls) setExportInfo(res.urls);
					else setExportInfo(null);
				}).catch(function () { setExportInfo(null); });
			}
			function setFormField(formState, key, value) {
				const next = Object.assign({}, formState, {});
				next[key] = value;
				return next;
			}
			function commitPrice(form, key) {
				const model = key || String(form.model || '').trim();
				if (!model) { setErr('Model name required'); return; }
				const numOrNull = function (s) {
					if (s == null || s === '') return null;
					const n = parseFloat(String(s));
					return Number.isFinite(n) ? n : null;
				};
				const off = {
					peak: { in: numOrNull(form.oPIn), cache: numOrNull(form.oPCache), out: numOrNull(form.oPOut) },
					off: { in: numOrNull(form.oOIn), cache: numOrNull(form.oOCache), out: numOrNull(form.oOOut) }
				};
				const gPeak = { in: numOrNull(form.gPIn), cache: numOrNull(form.gPCache), out: numOrNull(form.gPOut) };
				const gOff = { in: numOrNull(form.gIn), cache: numOrNull(form.gCache), out: numOrNull(form.gOut) };
				const quota = numOrNull(form.gQuota);
				const hasOff = off.peak.in != null || off.peak.cache != null || off.peak.out != null || off.off.in != null || off.off.cache != null || off.off.out != null;
				const hasPeak = gPeak.in != null || gPeak.cache != null || gPeak.out != null;
				const hasGo = gOff.in != null || gOff.cache != null || gOff.out != null || hasPeak || quota != null;
				if (!hasOff && !hasGo) { setErr('Fill at least one price group'); return; }
				const payload = { model: model };
				if (hasOff) payload.official = off;
				if (hasGo) {
					payload.go = hasPeak
						? { off: gOff, peak: gPeak, quota: quota }
						: { in: gOff.in, cache: gOff.cache, out: gOff.out, quota: quota };
				}
				apiPost('/usage-api/setprice', payload).then(function (res) {
					if (res && res.ok) {
						setEditing(null);
						setAdding(false);
						setErr(null);
						refreshPrices();
					} else {
						setErr((res && res.error) || 'Save failed');
					}
				}).catch(function () { setErr('Save failed'); });
			}
			function removePrice(key) {
				apiPost('/usage-api/setprice', { model: key, remove: true }).then(function (res) {
					if (res && res.ok) {
						setErr(null);
						refreshPrices();
					} else {
						setErr((res && res.error) || 'Remove failed');
					}
				}).catch(function () { setErr('Remove failed'); });
			}
			function startEdit(row) {
				const c = (priceTable && priceTable.custom && priceTable.custom[row.key]) || {};
				const o = row.official || { peak: {}, off: {} };
				const g = row.go || {};
				// Plan entry may be flat { in, cache, out } or tiered { off, peak }.
				const gOff = g.off || g;
				const gPeak = g.peak || {};
				setErr(null);
				setAdding(false);
				setEditing({
					key: row.key,
					form: {
						model: row.display,
						oPIn: o.peak.in != null ? String(o.peak.in) : '',
						oPCache: o.peak.cache != null ? String(o.peak.cache) : '',
						oPOut: o.peak.out != null ? String(o.peak.out) : '',
						oOIn: o.off.in != null ? String(o.off.in) : '',
						oOCache: o.off.cache != null ? String(o.off.cache) : '',
						oOOut: o.off.out != null ? String(o.off.out) : '',
						gIn: gOff.in != null ? String(gOff.in) : '',
						gCache: gOff.cache != null ? String(gOff.cache) : '',
						gOut: gOff.out != null ? String(gOff.out) : '',
						gPIn: gPeak.in != null ? String(gPeak.in) : '',
						gPCache: gPeak.cache != null ? String(gPeak.cache) : '',
						gPOut: gPeak.out != null ? String(gPeak.out) : '',
						gQuota: g.quota != null ? String(g.quota) : ''
					}
				});
			}
			function startAdd() {
				setErr(null);
				setEditing(null);
				setAddForm({ model: '', oPIn: '', oPCache: '', oPOut: '', oOIn: '', oOCache: '', oOOut: '', gIn: '', gCache: '', gOut: '', gPIn: '', gPCache: '', gPOut: '', gQuota: '' });
				setAdding(true);
			}

			if (!sessionId) return el('div', { className: 'du-loading' }, 'No active session');
			if (failed && !data) return el('div', { className: 'du-loading' }, 'Failed to load usage data');
			if (!data) return el('div', { className: 'du-loading' }, 'Loading usage…');

			const t = data.totals || {};
			const showOff = mode !== 'go';
			const showGo = mode !== 'official';
			const tokenMax = Math.max(t.input || 0, t.output || 0, t.cacheRead || 0, 1);
			const quota = t.goQuota != null && t.goQuota > 0 ? t.goQuota : null;
			const rows = (data.calls || []).slice(0, 100);

			const table = (function () {
				if (!priceTable) return [];
				const keys = new Set();
				const goMap = priceTable.go || {};
				const offMap = priceTable.official || {};
				const customMap = priceTable.custom || {};
				for (const k of Object.keys(goMap)) keys.add(k);
				for (const k of Object.keys(offMap)) keys.add(k);
				for (const k of Object.keys(customMap)) keys.add(k);
				return Array.from(keys).map(function (key) {
					const c = customMap[key];
					return {
						key: key,
						display: (c && c.name) || key,
						isCustom: !!c,
						official: offMap[key] || null,
						go: goMap[key] || null
					};
				}).sort(function (a, b) { return a.display.localeCompare(b.display); });
			})();

			const phead = el('div', { className: 'du-phead' },
				el('span', null, 'Model'),
				el('span', null, 'Official peak in/cache/out'),
				el('span', null, 'Official off in/cache/out'),
				el('span', null, 'Plan in/cache/out · quota'),
				el('span', null, 'Actions')
			);
			const priceRows = table.map(function (row) {
				return el('div', { className: 'du-prow', key: row.key },
					el('div', { className: 'du-pcell' },
						el('div', { className: 'du-pmodel' }, row.display),
						el('div', { className: 'du-psrc' }, row.isCustom ? 'Custom' : 'Built-in')
					),
					el('div', { className: 'du-pcell' }, row.official ? (row.official.peak.in + '/' + row.official.peak.cache + '/' + row.official.peak.out) : '—'),
					el('div', { className: 'du-pcell' }, row.official ? (row.official.off.in + '/' + row.official.off.cache + '/' + row.official.off.out) : '—'),
					el('div', { className: 'du-pcell' }, goDisplay(row.go)),
					el('div', { className: 'du-pops' },
						el('button', { type: 'button', className: 'du-btn', onClick: function () { startEdit(row); } }, 'Edit'),
						row.isCustom
							? el('button', { type: 'button', className: 'du-btn du-btnDanger', onClick: function () { removePrice(row.key); } }, 'Remove')
							: null
					)
				);
			});

			return el('div', { className: 'du-root' },
				el('div', { className: 'du-toolbar' },
					el('span', { className: 'du-title' }, 'Usage'),
					ModeBtn('auto', 'Auto'),
					ModeBtn('official', 'Official'),
					ModeBtn('go', 'Plan'),
					el('span', { className: 'du-spacer' }),
					el('span', { className: 'du-peak', 'data-off': data.peakNow ? 'false' : 'true' },
						data.peakNow ? 'Peak hours' : 'Off-peak'),
					el('span', { className: 'du-now' }, fmtTime(data.now) + ' updated')
				),
				el('div', { className: 'du-scroll' },
					el('div', { className: 'du-section' },
						el('div', { className: 'du-sectionHead' },
							el('span', null, 'Session overview'),
							el('span', { className: 'du-muted' },
								(t.calls || 0) + ' calls · total ' + fmtTokens((t.input || 0) + (t.output || 0) + (t.cacheRead || 0)))
						),
						el('div', { className: 'du-overview' },
							el('div', { className: 'du-ovCell' },
								el('div', { className: 'du-ovLabel' }, 'Input'),
								el('div', { className: 'du-ovValue' }, fmtTokens(t.input)),
								el('div', { className: 'du-ovSub' }, 'cache miss')
							),
							el('div', { className: 'du-ovCell' },
								el('div', { className: 'du-ovLabel' }, 'Output'),
								el('div', { className: 'du-ovValue' }, fmtTokens(t.output)),
								el('div', { className: 'du-ovSub' }, 'incl. reasoning ' + fmtTokens(t.reasoning))
							),
							el('div', { className: 'du-ovCell' },
								el('div', { className: 'du-ovLabel' }, 'Cache hit'),
								el('div', { className: 'du-ovValue' }, fmtTokens(t.cacheRead)),
								el('div', { className: 'du-ovSub' }, 'cache reads')
							),
							el('div', { className: 'du-ovCell' },
								el('div', { className: 'du-ovLabel' }, 'Cost'),
								showOff ? el('div', { className: 'du-ovValue' }, fmtMoney(t.offCost, '¥')) : null,
								showGo ? el('div', { className: 'du-ovValue' }, fmtMoney(t.goCost, '$')) : null,
								el('div', { className: 'du-ovSub' }, (showOff ? 'Official' : '') + (showOff && showGo ? ' · ' : '') + (showGo ? 'Plan' : ''))
							)
						),
						el('div', { className: 'du-modelRow' },
							el('span', { className: 'du-dot' }),
							el('span', { className: 'du-model' }, data.lastModel || '—'),
							el('span', { className: 'du-muted' }, data.lastProvider || '')
						)
					),
					el('div', { className: 'du-section' },
						el('div', { className: 'du-sectionHead' },
							el('span', null, 'Usage distribution'),
							el('span', { className: 'du-muted' }, 'auto refresh · 1s')
						),
						el('div', { className: 'du-bars' },
							Bar('Input', fmtTokens(t.input), (t.input || 0) / tokenMax * 100),
							Bar('Output', fmtTokens(t.output), (t.output || 0) / tokenMax * 100),
							Bar('Cache hit', fmtTokens(t.cacheRead), (t.cacheRead || 0) / tokenMax * 100),
							quota != null
								? Bar('Plan quota', fmtMoney(t.goCost, '$') + ' / $' + quota, (t.goCost || 0) / quota * 100)
								: Bar('Plan quota', '—', 0)
						)
					),
					el('div', { className: 'du-section' },
						el('div', { className: 'du-sectionHead' },
							el('span', null, 'Call details'),
							el('span', { className: 'du-headRight' },
								el('span', { className: 'du-muted' }, 'latest ' + rows.length),
								el('button', { type: 'button', className: 'du-btn', onClick: doExport }, exportInfo ? 'Re-export' : 'Export')
							)
						),
						exportInfo
							? el('div', { className: 'du-exportRow' },
								el('span', null, 'Download:'),
								el('a', { href: exportInfo.csv, download: 'usage.csv' }, 'CSV'),
								el('span', null, '·'),
								el('a', { href: exportInfo.json, download: 'usage.json' }, 'JSON'),
								el('span', { className: 'du-muted' }, ' (links valid for 60s)')
							)
							: null,
						rows.length === 0
							? el('div', { className: 'du-empty' }, 'No model calls yet')
							: el('table', { className: 'du-table' },
								el('thead', null,
									el('tr', null,
										el('th', null, 'Time'),
										el('th', null, 'Model'),
										el('th', null, 'Input'),
										el('th', null, 'Output'),
										el('th', null, 'Cache'),
										showOff ? el('th', null, 'Official') : null,
										showGo ? el('th', null, 'Plan') : null
									)
								),
								el('tbody', null,
									rows.map(function (c, i) {
										return el('tr', { key: i },
											el('td', null, fmtTime(c.t)),
											el('td', { className: 'du-tModel' },
												c.status === 'running'
													? el('span', { className: 'du-liveDot' })
													: null,
												c.model + (c.status === 'running' ? ' generating' : '')
											),
											el('td', null, fmtTokens(c.input)),
											el('td', null, fmtTokens(c.output)),
											el('td', null, fmtTokens(c.cacheRead)),
											showOff ? el('td', null, fmtMoney(c.off, '¥')) : null,
											showGo ? el('td', null, fmtMoney(c.go, '$')) : null
										);
									})
								)
							)
					),
					el('div', { className: 'du-section' },
						el('button', {
							type: 'button',
							className: 'du-headBtn',
							'aria-expanded': showPrice,
							onClick: function () { setShowPrice(!showPrice); }
						},
							el('span', null, 'Price table'),
							el('span', { className: 'du-muted' }, showPrice ? 'Collapse ▴' : 'Expand ▾')
						),
						showPrice
							? el('div', { className: 'du-priceBody' },
								el('div', { className: 'du-priceTip' },
									'Custom prices override the built-in cards and are persisted; historical costs are re-priced immediately. Units: official CNY per 1M tokens (peak = Beijing 09:00-12:00 / 14:00-18:00, 2x off-peak), plan USD per 1M tokens.'
								),
								el('div', { className: 'du-priceActions' },
									el('button', { type: 'button', className: 'du-btn', onClick: startAdd }, '+ Add model')
								),
								table.length === 0
									? el('div', { className: 'du-empty' }, 'Loading price table…')
									: el('div', null,
										phead,
										priceRows
									),
								err ? el('div', { className: 'du-err' }, err) : null,
								editing
									? el(PriceForm, {
										title: 'Edit ' + editing.key,
										form: editing.form,
										modelLocked: true,
										set: function (key, value) {
											setEditing(Object.assign({}, editing, { form: setFormField(editing.form, key, value) }));
										},
										onSave: function () { commitPrice(editing.form, editing.key); },
										onCancel: function () { setEditing(null); setErr(null); }
									})
									: null,
								adding
									? el(PriceForm, {
										title: 'Add model',
										form: addForm,
										modelLocked: false,
										set: function (key, value) {
											setAddForm(setFormField(addForm, key, value));
										},
										onSave: function () { commitPrice(addForm, null); },
										onCancel: function () { setAdding(false); setErr(null); }
									})
									: null
							)
							: null
					)
				)
			);
		}

		// ── plugin entry ────────────────────────────────────────────────────────
		const inject = ['slots', 'timer'];

		function apply(ctx) {
			const slots = ctx.get('slots');
			if (slots === undefined) return;
			const style = document.createElement('style');
			style.dataset.plugin = '@deepseek-ai/dsh-plugin-usage';
			style.dataset.pluginCss = '@deepseek-ai/dsh-plugin-usage/styles';
			style.textContent = CSS;
			ctx.effect(() => {
				document.head.appendChild(style);
				return () => {
					style.remove();
				};
			}, 'usage: styles');

			// Per-second global tick driving every usage view refresh.
			let tick = 0;
			const listeners = new Set();
			ctx.effect(() => {
				const stop = ctx.interval(() => {
					tick += 1;
					const fns = Array.from(listeners);
					for (const fn of fns) {
						try { fn(tick); } catch (e) { /* per-listener */ }
					}
				}, 1000);
				return stop;
			}, 'usage: tick');

			function useUsageTick(select) {
				const [value, setValue] = React.useState(tick);
				React.useEffect(() => {
					listeners.add(setValue);
					return () => {
						listeners.delete(setValue);
					};
				}, []);
				return select(value);
			}

			slots.inject('conversation.view', () => slots.register(
				{ name: 'conversation.view', id: 'usage', order: 11, label: () => '用量' },
				(props) => React.createElement(UsageView, Object.assign({}, props, { hooks: { useUsageTick } }))
			));
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
