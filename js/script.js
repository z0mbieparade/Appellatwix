/* Author: z0mbie */
/* Live demo: https://z0m.bi/apps/appellatwix/ */
const combo = new Combine(settings);
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
	}
};

//+ word column
var add_input_word = function($after, word)
{
	$row = $('#input_word_template')
			.clone()
			.removeAttr('id')
			.addClass('input_word container');

	$row.find('input.input_field')
	.val(word ? word : '')
	.on("keyup.search", function(e)
	{
		if (e.keyCode == 13)
		{
			search();
		}
	});

	//add word column
	$row.find('.add_input_word').button().off('click.add_input_word').on('click.add_input_word', function()
	{
		if($('#input_body .input_word').length >= 3)
		{
			alert('Cannot add more than 3 words at a time!')
		}
		else
		{
			add_input_word($(this).closest('.input_word'))
		}
	})

	//remove word column
	$row.find('.remove_row').button().off('click.remove_row').on('click.remove_row', function()
	{
		if($('#input_body .input_word').length > 1)
		{
			var val = $(this).closest('.input_word').find('.input_field').val().trim();
			settings.words.splice(settings.words.indexOf(val), 1);
			delete combo.word_tab_list[val];
			delete use_words[val];
			$(this).closest('.input_word').remove();
		}
	})

	if($after)
	{
		$after.after($row);
	}
	else
	{
		$('#input_body').append($row)
	}
}

//search for words/synonym/etc
var search = function()
{
	clear();

	$('#input_body .input_word').each(function()
	{
		var word = $(this).find('input.input_field').val();

		if(word)
		{
			combo.settings.words.push(word);

			$(this).attr('id', 'input_' + word.replace(/[^\w]/gm, '_')).attr('word', word);
			$(this).find('.input_results').html('<div class="input_result_tabs"><ul class="input_results_tab_nav"></ul></div>');
			$(this).find('.loader').addClass('loading');
		}
		else if($('#input_body .input_word').length > 1)
		{
			$(this).remove();
		}
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

			for(var tab_id in combo.word_tab_list[word])
			{
				if(tab_id === 'use') continue;

				var $use_check = $('<input type="checkbox" word="' + word + '"/>').on('change.use', function()
				{
					var w = $(this).attr('word');
					var t = $(this).parent().find('a').attr('href').slice(1);
					combo.word_tab_list[w][t].use = $(this).prop('checked');
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
						var sid = $(this).attr('sense_id');
						var w = $(this).attr('word');
						var t = $(this).closest('.tab_body').attr('id');

						combo.word_tab_list[w][t].sense[sid].use = $(this).prop('checked');
					})

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
								var $wd = $('<span class="wd">' + wd + '</span>').on('click.switch_word', function()
								{
									$(this).closest('.input_word').find('.input_input input.input_field').val($(this).text());
									search();
								}).prop('title', title)
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

			$input_word.find('.loading').removeClass('loading');
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
		var id = combo.blend_tree.mashes[comb].id.replace(/[^\w]/gm, '_');

		var $permute = $('#blender #blender_tabs').find('div.permute#permute_' + id);

		var types = '<div class="types">';
		combo.blend_tree.mashes[comb].types.forEach(function(type)
		{
			types += '<span class="mash_type_' + type + '"></span>';
		})
		types += '</div>';

		var $mash = $('<div class="mash" words="' + combo.blend_tree.mashes[comb].words.join('|') + '" combo="' + combo.blend_tree.mashes[comb].combo + '">' + types + '</div>')
			.addClass(combo.blend_tree.mashes[comb].types).addClass('mash_level_' + combo.blend_tree.mashes[comb].types.length)
			.prop('title', '<b>words:</b> ' + combo.blend_tree.mashes[comb].words.join('|') + '<br /><b>mash type:</b> ' + combo.blend_tree.mashes[comb].types.join(', '))
			.append('<span>' + combo.blend_tree.mashes[comb].parts.join('</span><span>') + '</span>');

		$mash.on('click.save_mash', function() //todo this
		{
			if($('#blender #save_mashes').length == 0)
			{
				$('#blender').prepend('<div id="save_mashes" />');
			}

			$('#blender #save_mashes').append($(this));
		})

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

	var $mods = $('<div id="mods"><h2>Blender</h2></div>').append($filter).append($replace);

	$('#blender').html('<div class="loading loader"></div><div id="blender_tabs"><ul id="blender_tabs_nav"></ul></div>')
		.prepend('<div id="combo_checks"><span id="show_condensed"></span><span id="show_as_list"></span><span id="check_spacer"></span></div>')
		.prepend($mods).css('display', 'flex');

	$('#header').addClass('blended');
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
			$('#header').removeClass('blended');
			if(error) alert(error);
		},
		server_side_blending
	);
}

var clear = function()
{
	combo.clear();
	$('#blender').empty().hide();
	$('#header').removeClass('blended');
	$('head style#injectCSSContainer').remove();
	$('#blend').button().button('disable');
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
		settings.words.forEach(function(word)
		{
			add_input_word(null, word);
		})
		search();
	}
	else
	{
		add_input_word();
		add_input_word();
	}

	$('#search').button().on('click.search', function()
	{
		search();
	})

	$('#clear').button().on('click.clear', function()
	{
		clear();
		$('#input_body').empty();
		add_input_word();
		add_input_word();
	})
});
