/* Author: z0mbie */
/* Live demo: https://z0m.bi/apps/appellatwix/ */
const combo = new Combine({...{
	on_update_word_list: function(word_tab_list)
	{
	//	console.log(word_tab_list)

		let blend_count = 0;

		for(let word in word_tab_list)
		{
			let use_words = word_tab_list[word].use_words.sort();
			if(use_words.length > 0) blend_count++;

			let $use_words = $('.input_word[word=' + word + '] .use_words');
			let $unused_words = $('.input_word[word=' + word + '] .input_results')

			for(let tab_id in word_tab_list[word])
			{
				if(tab_id === 'use' || tab_id === 'use_words') continue;
				$unused_words.find('li[aria-controls="' + tab_id + '"] input').prop('checked', word_tab_list[word][tab_id].use);

				for(let sense_id in word_tab_list[word][tab_id].sense)
				{
					if(sense_id === 'use') continue;
					$unused_words.find('div#' + tab_id + ' input[sense_id=' + sense_id + ']').prop('checked', word_tab_list[word][tab_id].sense[sense_id].use);
				}
			}

			$use_words.find('label.wd').each(function(elem, i)
			{
				let wd = $(this).find('input').attr('wd');
				if(!use_words.includes(wd))
				{
					$(this).remove();

					$unused_words.find('input[wd="' + wd + '"]').each(function()
					{
						$(this).prop('checked', false).parent().show();
					})
				}
			});

			let $first = $use_words.find('label.wd').first();
			let first_wd = $first.find('input').attr('wd');
			let first_wd_i = use_words.indexOf(first_wd);

			let $after = false;
			use_words.forEach(function(wd, i)
			{
				$check = $use_words.find('label.wd input[wd="' + wd + '"]');
				if($check.length === 0)
				{
					let $use_check_wd = $('<input type="checkbox"/>')
					.attr('word', word)
					.attr('wd', wd)
					.prop('checked', true)
					.on('change.use', function()
					{
						let w = $(this).attr('word');
						let wd = $(this).attr('wd');
						if(w !== wd){
							combo.set_words(false, w, null, null, wd);
						} else {
							$(this).prop('checked', true);
						}
					})

					if(wd === word) $use_check_wd.attr('disabled', 'disabled');

					let $wd = $('<label class="wd">' + wd + '</label>').append($use_check_wd);
					if($after)
					{
						$after.after($wd);
					}
					else if(i < first_wd_i || first_wd_i < 0)
					{
						$use_words.prepend($wd);
					}
					else
					{
						$first.after($wd);
					}

					$after = $wd;

					$unused_words.find('input[wd="' + wd + '"]').each(function()
					{
						$(this).prop('checked', true).parent().hide();
					})
				}
				else
				{
					$after = $check.parent();
				}
			})
		}

		if(blend_count > 1)
		{
			$('#blend').css({'display': 'inline-block'});
		}
		else
		{
			$('#blend').hide();
		}
	},
	on_update_mash_list: function(use_mashes)
	{
		let $use_mashes = $('#blender #save_mashes');
		let $unused_mashes = $('#blender #blender_tabs');

		if(use_mashes.length > 0)
		{
			$use_mashes.removeClass('no_mashes');
		}
		else
		{
			$use_mashes.addClass('no_mashes');
		}

		$use_mashes.find('label.mash').each(function(elem, i)
		{
			let comb = $(this).attr('combo');
			if(!use_mashes.includes(comb))
			{
				$(this).remove();

				$unused_mashes.find('label.mash[combo="' + comb + '"] input').each(function()
				{
					$(this).prop('checked', false).parent().show();
				})
			}
		});

		let $first = $use_mashes.find('label.mash').first();
		let first_mash = $first.attr('combo');
		let first_mash_i = use_mashes.indexOf(first_mash);

		let $after = false;
		use_mashes.forEach(function(comb, i)
		{
			$check = $use_mashes.find('label.mash[combo="' + comb + '"] input');
			if($check.length === 0)
			{
				let types = '<div class="types">';
				combo.blend_tree.mashes[comb].types.forEach(function(type)
				{
					types += '<span class="mash_type_' + type + '"></span>';
				})
				types += '</div>';

				let $mash_check = $('<input type="checkbox"/>')
					.on('change.save_mash', function()
					{
						let c = $(this).parent().attr('combo');
						let use = $(this).prop('checked') ? true : false;

						combo.set_mash(use, c);
					}).prop('checked', true);

				var $mash = $('<label class="mash">' + types + '</label>')
					.attr('words', combo.blend_tree.mashes[comb].words.join('|'))
					.attr('combo', combo.blend_tree.mashes[comb].combo)
					.attr('syl_count', combo.blend_tree.mashes[comb].syl_count)
					.addClass(combo.blend_tree.mashes[comb].types).addClass('mash_level_' + combo.blend_tree.mashes[comb].types.length)
					.prop('title', '<b>words:</b> ' + combo.blend_tree.mashes[comb].words.join('|') + '<br /><b>mash type:</b> ' + combo.blend_tree.mashes[comb].types.join(', '))
					.append('<span>' + combo.blend_tree.mashes[comb].parts.join('</span><span>') + '</span>')
					.append($mash_check);

				if($after)
				{
					$after.after($mash);
				}
				else if(i < first_mash_i || first_mash_i < 0)
				{
					$use_mashes.prepend($mash);
				}
				else
				{
					$first.after($mash);
				}

				$after = $mash;

				$unused_mashes.find('label.mash[combo="' + comb + '"]').each(function()
				{
					$(this).hide().find('input').prop('checked', true);
				})
			}
			else
			{
				$after = $check.parent();
			}
		})
	}
}, ...settings});
var typingTimer;
var mash_types = {
	'first_letter': {
		checked: true,
		short: 'first letter',
		long: 'words match by first letter (i.e. monster + mash = monstermash)'
	},
	'syl_match': {
		checked: true,
		short: 'syllable',
		long: 'words match by syllables letter (i.e. frankenstein + squash = frankensquash)'
	},
	'syl_squish': {
		checked: true,
		short: 'syllable squish',
		long: 'words match by syllables letter (i.e. frankenstein + squash = frankensquashsquash)'
	},
	'rhyme': {
		checked: true,
		short: 'rhyme',
		long: 'words matched by rhyming (i.e. beat + defeat = beatdefeat)'
	},
	'rhymeish': {
		checked: true,
		short: 'rhyme-ish',
		long: 'words matched by sort of rhyming with another word (i.e. monster ~= water, so water + mash = watermash)'
	},
	'sounds_like': {
		checked: true,
		short: 'sounds like',
		long: 'words matched sounding like another word (i.e. mash ~= man, so monster + man = monsterman)'
	},
	'iao': {
		checked: true,
		short: 'redup iao',
		long: 'ablaut reduplication i.e. ping-pong, tic-tac-toe'
	},
	'rhyme_redup': {
		checked: true,
		short: 'rhyme redup',
		long: 'rhyme reduplication i.e. beat-defeat, razzle-dazzle, walkie-talkie'
	}
};

//+ word column
var add_input_word = function($after, word)
{
	let $row = $('#synonym_template')
			.clone()
			.removeAttr('id')
			.addClass('input_word container');

	let tip = 'Words directly below are words that will be used when you click "blend". '
				 	+ 'You can remove them by clicking on them, or add more by clicking on the '
					+ 'words in the bottom tabbed section. When you are happy with the selection, click "blend."';

	let $tip = $('<span class="tip"></span>').prop('title', tip);

	$row.find('h3.word').text(word ? word : '').append($tip);

	if($after)
	{
		$after.after($row);
	}
	else
	{
		$('#synonyms').append($row)
	}

	return $row;
}

//search for words/synonym/etc
var search = function()
{
	clear();
	let search_str = $('#input_words').val();
	let search_words = search_str.split(/[\s,]+/);

	if(search_words.length > 3 || search_words.length < 2)
	{
		alert('You must enter 2-3 words!');
		return;
	}

	search_words.forEach(function(word)
	{
		let $row = add_input_word(null, word);
		combo.settings.words.push(word);

		$row.attr('id', 'input_' + word.replace(/[^\w]/gm, '_')).attr('word', word);
		$row.find('.input_results').html('<div class="input_result_tabs"><ul class="input_results_tab_nav"></ul></div>');
		$row.addClass('loading');

		$row.tooltip({
			content: function (callback) {
				callback($(this).prop('title'));
			}
		});
	})

	combo.search(function()
	{
		if(combo.settings.words.length >= 2)
		{
			$('#blend').button('enable');
			$('#blend_server').button('enable');
		}

		combo.settings.words.forEach(function(word)
		{
			var $input_word = $('.input_word#input_' + word.replace(/[^\w]/gm, '_'));
			var $input_tabs = $input_word.find('.input_result_tabs');

			let tab_ids = Object.keys(combo.word_tab_list[word]).filter(function(t)
			{
				return (t !== 'use' && t !== 'use_words');
			}).sort(function(a, b) //sort words so word goes first, then alphabetically the rest, and lastly error tabs
			{
				let a_id = combo.word_tab_list[word][a].id;
				let b_id = combo.word_tab_list[word][b].id;

				let a_fl = combo.word_tab_list[word][a].fl;
				let b_fl = combo.word_tab_list[word][b].fl;

				let priority_a = 0;
				let priority_b = 0;

				if(a_id === word) priority_a = priority_a + 2;
				if(b_id === word) priority_b = priority_b + 2;

				if(a_fl === 'error') priority_a = priority_a - 2;
				if(b_fl === 'error') priority_b = priority_b - 2;

				if(priority_a === priority_b)
				{
					return a_id.localeCompare(b_id)
				}
				else if(priority_a < priority_b)
				{
					return 1;
				}
				else if(priority_a > priority_b)
				{
					return -1;
				}
			});

			for(let i = 0; i < tab_ids.length; i++)
			{
				let tab_id = tab_ids[i];
				var $use_check = $('<input type="checkbox" word="' + word + '"/>').on('change.use', function()
				{
					let use = $(this).prop('checked') ? true : false;
					var w = $(this).attr('word');
					var t = $(this).parent().find('a').attr('href').slice(1);
					combo.set_words(use, w, t);
				}).prop('checked', combo.word_tab_list[word][tab_id].use);

				var $tab = $('<li><a href="#' + tab_id + '"><b>' + combo.word_tab_list[word][tab_id].id + '</b> <i>' + combo.word_tab_list[word][tab_id].fl + '</i></a></li>').append($use_check);
				$input_tabs.find('.input_results_tab_nav').append($tab);

				var $tab_body = $('<div class="tab_body" id="' + tab_id + '"></div>');

				for(var sense_id in combo.word_tab_list[word][tab_id].sense)
				{
					var sense = combo.word_tab_list[word][tab_id].sense[sense_id];

					if(sense.hide) continue;

					var $sense = $('<div class="sense"><div class="def"></div></div>');

					var $use_check_sense = $('<input type="checkbox" checked="checked" word="' + word + '" sense_id="' + sense_id + '" />').on('change.use', function()
					{
						let use = $(this).prop('checked') ? true : false;
						var sid = $(this).attr('sense_id');
						var w = $(this).attr('word');
						var t = $(this).closest('.tab_body').attr('id');
						combo.set_words(use, w, t, sid);
					}).prop('checked', sense.use);

					$sense.find('.def').append($use_check_sense);

					sense.def.forEach(function(def)
					{
						$sense.find('.def').append('<span>' + def + '</span>');
					})

					combo.settings.all_lists.forEach(function(list)
					{
						if(sense[list])
						{
							var $list = $('<div class="list ' + list + '"></div>');
							var title = '';

							switch(list)
							{
								case 'syn_list':
									title = '<i>synonym</i> for <b>' + word + '</b>';
									break;
								case 'rel_list':
									title = '<i>related</i> to <b>' + word + '</b>';
									break;
								case 'near_list':
									title = '<i>similar</i> to <b>' + word + '</b>';
									break;
								case 'phrase_list':
									title = '<i>phrases similar</i> to <b>' + word + '</b> (not used in blending)';
									break;
								case 'ant_list':
									title = '<i>antonym</i> for <b>' + word + '</b> (not used in blending)';
									break;
								case 'means_list':
									title = 'means <b>' + word + '</b>';
									break;
								case 'rhyme_list':
									title = 'means <b>' + word + '</b> and <i>rhymes</i> with another word';
									break;
								case 'rhymeish_list':
									title = 'means <b>' + word + '</b> and <i>sort of rhymes</i> with another word';
									break;
								case 'sounds_like_list':
									title = 'means <b>' + word + '</b> and <i>sounds like</i> another word';
									break;
								case 'err_list':
									title = 'did you mean...?';
									break;
								default:
									break;
							}

							sense[list].sort().forEach(function(wd)
							{
								var $use_check_wd = $('<input type="checkbox"/>')
								.attr('word', word)
								.attr('sense_id', sense_id)
								.attr('wd', wd)
								.on('change.use', function()
								{
									let use = $(this).prop('checked') ? true : false;
									let sid = $(this).attr('sense_id');
									let w = $(this).attr('word');
									let t = $(this).closest('.tab_body').attr('id');
									let wd = $(this).attr('wd');
									combo.set_words(use, w, t, sid, wd);

									if(use)
									{
										$(this).parent().hide();
									}
									else
									{
										$(this).parent().show();
									}
								}).prop('checked', combo.word_tab_list[word].use_words.includes(wd))

								var $wd = $('<label class="wd">' + wd + '</label>').append($use_check_wd);

								if(combo.word_tab_list[word].use_words.includes(wd))
								{
									$wd.hide();
								}
								else
								{
									$wd.show();
								}

								$list.append($wd);
							})

							$sense.append($list);
						}
					})

					$tab_body.append($sense);
				}

				$input_tabs.append($tab_body);
			}

			$input_tabs.tabs().tooltip({
				content: function (callback) {
					callback($(this).prop('title'));
				}
			});

			$input_word.removeClass('loading');
		})
	});
}

//turn blend_tree into visible combos
var pour = function()
{
	combo.blend_tree.permutes.forEach(function(permute)
	{
		var id = permute.join('|');
		var $permute = $('<div class="permute" id="permute_' + id.replace(/[^\w]/gm, '_') + '"></div>');
		$('#blender #blender_tabs').append($permute);
		$('#blender #blender_tabs #blender_tabs_nav').append('<li><a href="#permute_' + id.replace(/[^\w]/gm, '_') + '"><b>' + id + '</b></i></a></li>')
	})

	var mash_order = Object.keys(combo.blend_tree.mashes).sort(function(a, b)
	{
		var a_points = combo.blend_tree.mashes[a].types.length;
		var b_points = combo.blend_tree.mashes[b].types.length;

		if(a_points === b_points)
		{
			return combo.blend_tree.mashes[a].id.localeCompare(combo.blend_tree.mashes[b].id);
		}
		else
		{
			return b_points - a_points;
		}
	})

	mash_order.forEach(function(comb)
	{
		let id = combo.blend_tree.mashes[comb].id.replace(/[^\w]/gm, '_');

		let $permute = $('#blender #blender_tabs').find('div.permute#permute_' + id);

		let types = '<div class="types">';
		combo.blend_tree.mashes[comb].types.forEach(function(type)
		{
			types += '<span class="mash_type_' + type + '"></span>';
		})
		types += '</div>';

		let $mash_check = $('<input type="checkbox"/>')
			.on('change.save_mash', function()
			{
				let comb = $(this).parent().attr('combo');
				let use = $(this).prop('checked') ? true : false;

				combo.set_mash(use, comb);
			});

		var $mash = $('<label class="mash">' + types + '</label>')
			.attr('words', combo.blend_tree.mashes[comb].words.join('|'))
			.attr('combo', combo.blend_tree.mashes[comb].combo)
			.attr('syl_count', combo.blend_tree.mashes[comb].syl_count)
			.addClass(combo.blend_tree.mashes[comb].types).addClass('mash_level_' + combo.blend_tree.mashes[comb].types.length)
			.prop('title', '<b>words:</b> ' + combo.blend_tree.mashes[comb].words.join('|') + '<br /><b>mash type:</b> ' + combo.blend_tree.mashes[comb].types.join(', '))
			.append('<span>' + combo.blend_tree.mashes[comb].parts.join('</span><span>') + '</span>')
			.append($mash_check);

		$permute.append($mash);

		combo.blend_tree.mashes[comb].types.forEach(function(type)
		{
			if($('#blender #combo_checks #filter_check_' + type).length === 0)
			{
				var $filter_check = $('<input type="checkbox" type="' + type + '" id="filter_check_' + type + '" checked="checked" />')
				.attr('title', mash_types[type].long)
				.on('change.filter_type', function()
				{
					var css = {};
					css['.mash.' + type] = {
						display: $(this).prop('checked') ? 'block' : 'none'
					};
					$.injectCSS(css);

					mash_types[type].checked = $(this).prop('checked');
				})
				var $label = $('<label for="filter_check_' + type + '">' + mash_types[type].short + '</label>')
					.prepend($filter_check);

				$('#blender #combo_checks').append($label);
			}
		})

		$('#blender #combo_checks').tooltip({
			content: function (callback) {
				callback($(this).prop('title'));
			}
		});

		if($('#filter').val().trim())
		{
			var filter_regex = new RegExp($('#filter').val().trim(), 'gm');
			if(!combo.blend_tree.mashes[comb].combo.match(filter_regex))
			{
				$mash.hide();
			}
		}
	});

	$('#blender #blender_tabs').tabs().tooltip({
		content: function (callback) {
			callback($(this).prop('title'));
		}
	});

	$('#blender .loading').removeClass('loading');
}

var blend = function(server_side_blending)
{
	if(settings.debug){
		server_side_blending = server_side_blending === undefined ? settings.server_side_blending : server_side_blending;
	} else {
		server_side_blending = false;
	}

	if(combo.settings.words.length < 2)
	{
		alert('Cannot blend, less then 2 words provided.')
		return;
	}

	var $max_syl = $('<input type="number" id="max_syl" placeholder="max syl">').on('change.max_syl', function()
	{
		let max_syls = $(this).val() ? +$(this).val() : 0;
		clearTimeout(typingTimer);
		typingTimer = setTimeout(function()
		{
			$('#blender .mash').each(function()
			{
				if(max_syls > 0 && +$(this).attr('syl_count') > max_syls)
				{
					$(this).addClass('filtered_syl');
				}
				else
				{
					$(this).removeClass('filtered_syl');
				}
			});
		}, 500);
	});

	var $replace = $('<input type="text" id="replace" placeholder="replace|with">').on('keyup.filter', function()
	{
		clearTimeout(typingTimer);
		var replace = $(this).val().trim().split('|');
		if (replace.length === 2)
		{
			typingTimer = setTimeout(function()
			{
				var find_regex = new RegExp(replace[0], 'gm');
				$('#blender .mash').each(function()
				{
					$(this).find('span.replaced').remove();
					if($(this).attr('combo').match(find_regex))
					{
						$(this).addClass('replace')
							.append('<span class="replaced">' + $(this).attr('combo').replace(find_regex, replace[1]) + '</span>')
					}
					else
					{
						$(this).removeClass('replace').find('span.replaced').remove();;
					}
				})
			}, 500);
		}
		else
		{
			$('#blender .mash').removeClass('replace');
		}
	});

	var $filter = $('<input type="text" id="filter" placeholder="filter">').on('keyup.filter', function()
	{
		clearTimeout(typingTimer);

		var filter_by = $(this).val().trim();

		if(filter_by !== '')
		{
			typingTimer = setTimeout(function()
			{
				var filter_regex = new RegExp($('#filter').val().trim(), 'gm');

				$('#blender .mash').each(function()
				{
					if(!$(this).attr('combo').match(filter_regex))
					{
						$(this).addClass('filtered');
					}
					else
					{
						$(this).removeClass('filtered');
					}
				});


			}, 500);
		}
		else
		{
			$('#blender .mash.filtered').each(function()
			{
				$(this).removeClass('filtered');
			});
		}
	});

	var $mods = $('<div id="mods"><h2>Blender</h2></div>').append($max_syl).append($filter).append($replace);

	$('#blender').html('<div class="loading loader"></div><div id="save_mashes" class="no_mashes"></div><div id="blender_tabs"><ul id="blender_tabs_nav"></ul></div>')
		.prepend('<div id="combo_checks"><span id="show_condensed"></span><span id="show_as_list"></span><span id="check_spacer"></span></div>')
		.prepend($mods).css('display', 'flex');

	$('html').addClass('blended');
	$('head style#injectCSSContainer').remove();

	$('#blender #show_as_list').on('click.show_as_list', function()
	{
		$('#blender').addClass('show_as_list')
	})

	$('#blender #show_condensed').on('click.show_condensed', function()
	{
		$('#blender').removeClass('show_as_list')
	})

	combo.blend(
		pour,
		function(error){
			$('#blender').empty().hide();
			$('html').removeClass('blended');
			if(error) alert(error);
		},
		server_side_blending
	);
}

var clear = function()
{
	combo.clear();
	$('#blender').empty().hide();
	$('#synonyms').empty();
	//$('#input_words').val('');
	$('html').removeClass('blended');
	$('head style#injectCSSContainer').remove();
	$('#blend').button().hide();
}

$(document).ready(function()
{
	if(!settings.debug)
	{
		$('#blend_server').remove();
		$('#blend').text('Blend').button().on('click.blend', blend).button('disable');
	}
	else
	{
		$('#blend').button().on('click.blend', function()
		{
			var a = performance.now();
			blend(false);
			var b = performance.now();
			console.log('browser ' + Math.round((b - a)) + 'ms');
		}).button('disable')

		//this really doesn't work great, prolly because the amount of data
		//that needs to be sent over ajax is too much. if we want to do this in
		//the future we're gonna have to do it another way.
		$('#blend_server').button().on('click.blend', function()
		{
			var a = performance.now();
			blend(true);
			var b = performance.now();
			console.log('server ' + Math.round((b - a)) + 'ms');
		}).button('disable')
	}

	if(settings.words && settings.words.length > 0)
	{
		$('#input_words').val(settings.words.join(' '));
	}

	$('#search').button().on('click.search', function()
	{
		search();
	})

	$('#clear').button().on('click.clear', function()
	{
		clear();
		$('#synonyms').empty();
	})
});
