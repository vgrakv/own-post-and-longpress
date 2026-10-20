'use strict';

// Adds one switch to the core ACP page "Settings > Reputation & Flags" (where NodeBB's own upvote settings live):
// delete the author's notification when a built-in upvote ("like") is taken back.
// It saves immediately (it does not use that page's Save button) into this plugin's own settings.
(function () {
	const FIELD_ID = 'reactions-delete-notification-on-unvote';

	function addSwitch() {
		const $block = $('#reputation-settings');
		if (!$block.length || $('#' + FIELD_ID).length) {
			return;
		}
		require(['translator', 'alerts'], function (translator, alerts) {
			const keys = [
				'[[reactions:settings.delete-notification-on-unvote]]',
				'[[reactions:settings.delete-notification-on-unvote-help]]',
				'[[reactions:settings.saved-title]]',
				'[[reactions:settings.saved-message]]',
			];
			Promise.all(keys.map(function (key) { return translator.translate(key); })).then(function (text) {
				if ($('#' + FIELD_ID).length) {
					return;
				}
				const $wrap = $('<div class="form-check form-switch mt-3 mb-3"></div>');
				const $input = $('<input type="checkbox" class="form-check-input">').attr('id', FIELD_ID).prop('disabled', true);
				const $label = $('<label class="form-check-label"></label>').attr('for', FIELD_ID).text(text[0]);
				const $help = $('<p class="form-text"></p>').text(text[1]);
				$wrap.append($input, $label, $help);
				$block.append($wrap);

				socket.emit('plugins.reactions.getUnvoteSetting', function (err, res) {
					if (err) {
						return alerts.error(err);
					}
					$input.prop('checked', !!res.enabled).prop('disabled', false);
				});
				$input.on('change', function () {
					const enabled = $input.prop('checked');
					socket.emit('plugins.reactions.setUnvoteSetting', { enabled: enabled }, function (err) {
						if (err) {
							$input.prop('checked', !enabled);
							return alerts.error(err);
						}
						alerts.alert({ type: 'success', alert_id: 'reactions-unvote-saved', title: text[2], message: text[3], timeout: 2500 });
					});
				});
			});
		});
	}

	require(['hooks'], function (hooks) {
		hooks.on('action:ajaxify.end', addSwitch);
	});
	$(addSwitch);
}());
