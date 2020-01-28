/* Author: z0mbie */
/* Live demo: https://z0m.bi/apps/appellatwix/ */

var settings = {
	server_side_blending: true, //if this is true we do the permutations, blending, and mashes on the server side instead, which means we can do more words, but uses more server CPU.
	words: ['monster','mash'],
	use_lists: ['input_list', 'syn_list', 'means_list', 'rhyme_list', 'rel_list', 'near_list', 'rhymeish_list', 'sounds_like_list'],
	all_lists: ['input_list', 'syn_list', 'means_list', 'rhyme_list', 'rel_list', 'near_list', 'rhymeish_list', 'sounds_like_list', 'ant_list', 'phrase_list', 'err_list'],
	mash_types: {
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
	}
}

var word_list = {}; //all the words found during search
var word_tab_list = {}; //the tabs generated on search
var use_words = {}; //all the words we'll be using in the blender
var blend_tree = {}; //blender variables
var typingTimer; 

//add word column
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

	$row.find('.remove_row').button().off('click.remove_row').on('click.remove_row', function()
	{
		if($('#input_body .input_word').length > 1)
		{
			var val = $(this).closest('.input_word').find('.input_field').val().trim();
			settings.words.splice(settings.words.indexOf(val), 1);
			delete word_tab_list[val];
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

var add_word = function(word, relates_to, list)
{
	word_list[word] = word_list[word] || [];

	var rel = list + '|' + relates_to;

	if(!word_list[word].includes(rel))
	{
		word_list[word].push(rel)
	}
}

//get syns from thesaurus for word
var get_syns = function(word, callback)
{
	$.ajax({
		type: "POST",
		url: 'func.php',
		data: {func: 'get_syns', word: word},
		success: function(res)
		{
			var result = JSON.parse(res);
			if(Array.isArray(result) && (typeof result[0] === 'string' || result.length === 0))
			{
				var tab_id = 'error-' + word.replace(/[^\w]/gm, '_');

				word_tab_list[word][tab_id] = {
					use: true,
					id: word,
					fl: 'error',
					sense: {
						100: {
							use: true,
							def: ['The word you\'ve entered isn\'t in the Merriam-Webster Thesaurus. Choose a different word?'],
							err_list: result,
							input_list: [word]
						}
					}
				};
			}
			else
			{
				result.forEach(function(item)
				{
					word_tab_list[word][item.meta.uuid] = {
						use: true,
						id: item.meta.id,
						fl: item.fl,
						sense: {
							100: {
								use: true,
								hide: true,
								def: [],
								input_list: [item.meta.id]
							}
						}
					};

					if(item.def)
					{
						item.def.forEach(function(sseq)
						{
							sseq.sseq.forEach(function(sense)
							{
								sense.forEach(function(ss)
								{
									ss.forEach(function(s)
									{
										if(typeof s === 'object')
										{
											s.sn = s.sn || '0';

											word_tab_list[word][item.meta.uuid].sense[s.sn] = {
												use: true,
												def: []
											};

											for(key in s)
											{
												if(key === 'dt')
												{
													s.dt.forEach(function(def)
													{
														if(def.includes('text'))
														{
															def.forEach(function(d)
															{
																if(d !== 'text')
																{
																	word_tab_list[word][item.meta.uuid].sense[s.sn].def.push(d.trim());
																}
															})
														}
													})
												}
												else if(settings.all_lists.includes(key))
												{
													word_tab_list[word][item.meta.uuid].sense[s.sn][key] = [];

													s[key].forEach(function(wd_arr)
													{
														wd_arr.forEach(function(wd)
														{
															if(wd.wd)
															{
																word_tab_list[word][item.meta.uuid].sense[s.sn][key].push(wd.wd);
															}

															if(wd.wvrs)
															{
																wd.wvrs.forEach(function(other_wd)
																{
																	if(other_wd.wva)
																	{
																		word_tab_list[word][item.meta.uuid].sense[s.sn][key].push(other_wd.wva);
																	}
																})
															}
														})
													})
												}
											}
										}
									})
								})
							})
						})
					}
				})
			}

			callback();
		}
	})
}

var datamuse = function(url, word, list, sense_id, def, callback)
{
	$.getJSON('https://api.datamuse.com/words' + url, function(result)
	{
		if(result && result.length > 0)
		{
			var tab_id = 'datamuse-' + word.replace(/[^\w]/gm, '_');

			word_tab_list[word][tab_id] = word_tab_list[word][tab_id] || {
				use: true,
				id: word,
				fl: 'datamuse',
				sense: {
					100: {
						use: true,
						hide: true,
						def: [],
						input_list: [word]
					}
				}
			}

			word_tab_list[word][tab_id].sense[sense_id] = {
				use: true,
				def: [def]
			}

			word_tab_list[word][tab_id].sense[sense_id][list] = [];

			result.forEach(function(r)
			{
				word_tab_list[word][tab_id].sense[sense_id][list].push(r.word);
			})

			callback()
		}
		else
		{
			callback();
		}

	})
}

var search = function()
{
	clear();

	$('#input_body .input_word').each(function()
	{
		var word = $(this).find('input.input_field').val();

		if(word)
		{
			settings.words.push(word);

			$(this).attr('id', 'input_' + word.replace(/[^\w]/gm, '_')).attr('word', word);
			$(this).find('.input_results').html('<div class="input_result_tabs"><ul class="input_results_tab_nav"></ul></div>');
			$(this).find('.loader').addClass('loading');
		}
		else if($('#input_body .input_word').length > 1)
		{
			$(this).remove();
		}
	})

	var get_all_words = [];

	settings.words.forEach(function(word)
	{
		word_tab_list[word] = {
			use: true
		};

		get_all_words.push(new Promise((resolve) => 
		{
			get_syns(word, resolve)
		}))

		get_all_words.push(new Promise((resolve) => 
		{
			datamuse(
				'?ml=' + word.replace(/[^\w]/gm, '+'), 
				word, 'means_list', 0, 'Words meaning <b>' + word + '</b>', resolve)
		}))

		settings.words.forEach(function(other_word)
		{
			if(word !== other_word)
			{
				get_all_words.push(new Promise((resolve) => 
				{
					datamuse(
						'?ml=' + other_word.replace(/[^\w]/gm, '+') + '&rel_rhy=' + word.replace(/[^\w]/gm, '+'), 
						other_word, 'rhyme_list', 1, 'Words meaning <b>' + other_word + '</b> that <i>rhyme</i> with other entered words', resolve);
				}))

				get_all_words.push(new Promise((resolve) => 
				{
					datamuse(
						'?ml=' + other_word.replace(/[^\w]/gm, '+') + '&rel_nry=' + word.replace(/[^\w]/gm, '+'), 
						other_word, 'rhymeish_list', 2, 'Words meaning <b>' + other_word + '</b> that <i>sort of rhyme</i> with other entered words', resolve);
				}))

				get_all_words.push(new Promise((resolve) => 
				{
					datamuse(
						'?ml=' + other_word.replace(/[^\w]/gm, '+') + '&sl=' + word.replace(/[^\w]/gm, '+'), 
						other_word, 'sounds_like_list', 3, 'Words meaning <b>' + other_word + '</b> that <i>sound like</i> other entered words', resolve);
				}))
			}
		})
	})

	Promise.all(get_all_words).then(function() 
	{
		if(settings.words.length >= 2)
		{
			$('#blend').button('enable');
		}

		settings.words.forEach(function(word)
		{
			var $input_word = $('.input_word#input_' + word.replace(/[^\w]/gm, '_'));
			var $input_tabs = $input_word.find('.input_result_tabs');

			for(var tab_id in word_tab_list[word])
			{
				if(tab_id === 'use') continue;

				word_tab_list[word][tab_id].use = word_tab_list[word][tab_id].id === word;

				var $use_check = $('<input type="checkbox" word="' + word + '"/>').on('change.use', function()
				{
					var w = $(this).attr('word');
					var t = $(this).parent().find('a').attr('href').slice(1);
					word_tab_list[w][t].use = $(this).prop('checked');
				}).prop('checked', word_tab_list[word][tab_id].use);

				var $tab = $('<li><a href="#' + tab_id + '"><b>' + word_tab_list[word][tab_id].id + '</b> <i>' + word_tab_list[word][tab_id].fl + '</i></a></li>').append($use_check);
				$input_tabs.find('.input_results_tab_nav').append($tab);

				var $tab_body = $('<div class="tab_body" id="' + tab_id + '"></div>');

				for(var sense_id in word_tab_list[word][tab_id].sense)
				{
					var sense = word_tab_list[word][tab_id].sense[sense_id];

					if(sense.hide) continue;

					var $sense = $('<div class="sense"><div class="def"></div></div>');

					var $use_check_sense = $('<input type="checkbox" checked="checked" word="' + word + '" sense_id="' + sense_id + '" />').on('change.use', function()
					{
						var sid = $(this).attr('sense_id');
						var w = $(this).attr('word');
						var t = $(this).closest('.tab_body').attr('id');

						word_tab_list[w][t].sense[sid].use = $(this).prop('checked');
					})

					$sense.find('.def').append($use_check_sense);

					sense.def.forEach(function(def)
					{
						$sense.find('.def').append('<span>' + def + '</span>');
					})

					settings.all_lists.forEach(function(list)
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

//break string into syllables
var create_syls = function(word)
{
	var syllable_regex = /[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?/gi;
	var word_syl = [];
	word.split(/\s/gm).filter(function(w)
	{
		return w ? true : false;
	}).forEach(function(w)
	{
		var syl = w.match(syllable_regex);
		if(syl)
		{
			syl = syl.filter(function(s)
			{
				return s.match(/\(|\)/) ? false : true;
			});

			word_syl = word_syl.concat(syl);
		}
	})

	return word_syl;
}

var make_mash = function(id, words, mash, org_words)
{
	org_words = org_words || words.slice();

	var first_word = words.shift();
	var second_word = words.shift();

	mash = mash || {
		id: id
	}

	var step_mash = function(options)
	{
		var options = $.extend({
			first_word: first_word,
			second_word: second_word,
			first_word_part: first_word,
			second_word: second_word,
			type: null
		}, options)

		var new_mash = JSON.parse(JSON.stringify(mash));
		var new_words = words.slice();

		new_mash.combo = options.first_word_part + options.second_word_part;
		if(new_mash.parts)
		{
			new_mash.parts.push(options.second_word_part);
			new_mash.words.push(options.second_word);
			new_mash.types.push(options.type);
		}
		else
		{
			new_mash.parts = [options.first_word_part, options.second_word_part];
			new_mash.words = [options.first_word, options.second_word];
			new_mash.types = [options.type];
		}

		if(new_words.length > 0)
		{
			new_words.unshift(new_mash.combo);
			make_mash(id, new_words, new_mash, org_words);
		}
		else if(!blend_tree.mashes[new_mash.combo])
		{
			blend_tree.mashes[new_mash.combo] = new_mash;
		}
		else if(!blend_tree.mashes[new_mash.combo].types.includes(options.type))
		{
			blend_tree.mashes[new_mash.combo].types.push(options.type);
		}
	}

	//mash together words that start with the same letter 
	//i.e. monster + mash = monstermash
	var first_letter_match = new RegExp('^' + first_word.slice(0, 1), 'i');
	if(second_word.match(first_letter_match))
	{
		step_mash({
			first_word: first_word,
			second_word: second_word,
			first_word_part: first_word,
			second_word_part: second_word,
			type: 'first_letter'
		})
	}

	//mash together words that have a sylable that start with the same letter as another words sylables 
	//i.e. franken|stein + squash -> frankensquash
	var first_word_syl = create_syls(first_word);
	var second_word_syl = create_syls(second_word);
	if(first_word_syl.length > 1)
	{
		var first_word_part = '';
		first_word_syl.forEach(function(fws, i)
		{	
			first_word_part += fws;

			if(first_word_syl[i + 1])
			{
				try 
				{
					var next_syl_first_letter = new RegExp('^' + first_word_syl[i + 1].slice(0, 1), 'i');
					
					var second_word_part = '';
					for(var s = second_word_syl.length - 1; s >= 0; s--)
					{
						var sws = second_word_syl[s];
						second_word_part = sws + second_word_part;

						if(second_word_part.match(next_syl_first_letter))
						{
							step_mash({
								first_word: first_word,
								second_word: second_word,
								first_word_part: first_word_part,
								second_word_part: second_word_part,
								type: 'syl_match'
							})
						}
					}
				}
				catch(e)
				{
					console.log(first_word_syl, first_word_syl[i + 1], first_word_syl[i + 1].slice(0, 1))
					console.error(e)
				}
			}
		})
	}

	//mash together words that rhyme/sound like other words in our array
	//i.e. beat + defeat = beatdefeat
	org_words.forEach(function(org)
	{
		if((word_list[first_word] && word_list[first_word].includes('rhyme_list|' + org)) ||
			(word_list[second_word] && word_list[second_word].includes('rhyme_list|' + org)))
		{
			step_mash({
				first_word: first_word,
				second_word: second_word,
				first_word_part: first_word,
				second_word_part: second_word,
				type: 'rhyme'
			})
		}

		if((word_list[first_word] && word_list[first_word].includes('rhymeish_list|' + org)) ||
			(word_list[second_word] && word_list[second_word].includes('rhymeish_list|' + org)))
		{
			step_mash({
				first_word: first_word,
				second_word: second_word,
				first_word_part: first_word,
				second_word_part: second_word,
				type: 'rhymeish'
			})
		}

		if((word_list[first_word] && word_list[first_word].includes('sounds_like_list|' + org)) ||
			(word_list[second_word] && word_list[second_word].includes('sounds_like_list|' + org)))
		{
			step_mash({
				first_word: first_word,
				second_word: second_word,
				first_word_part: first_word,
				second_word_part: second_word,
				type: 'sounds_like'
			})
		}
	})
}

var pour = function(new_tree)
{
	if(new_tree) blend_tree = new_tree;

	blend_tree.permutes.forEach(function(permute)
	{
		var id = permute.join('|');
		var $permute = $('<div class="permute" id="permute_' + id.replace(/[^\w]/gm, '_') + '"></div>');
		$('#blender #blender_tabs').append($permute);
		$('#blender #blender_tabs #blender_tabs_nav').append('<li><a href="#permute_' + id.replace(/[^\w]/gm, '_') + '"><b>' + id + '</b></i></a></li>')	
	})

	var mash_order = Object.keys(blend_tree.mashes).sort(function(a, b)
	{
		var a_points = blend_tree.mashes[a].types.length;
		var b_points = blend_tree.mashes[b].types.length;

		if(a_points === b_points)
		{
			return blend_tree.mashes[a].id.localeCompare(blend_tree.mashes[b].id);
		}
		else
		{
			return b_points - a_points;
		}
	})
	
	mash_order.forEach(function(combo)
	{
		var id = blend_tree.mashes[combo].id.replace(/[^\w]/gm, '_');

		var $permute = $('#blender #blender_tabs').find('div.permute#permute_' + id);

		var types = '<div class="types">';
		blend_tree.mashes[combo].types.forEach(function(type)
		{
			types += '<span class="mash_type_' + type + '"></span>';
		})
		types += '</div>';

		var $mash = $('<div class="mash" words="' + blend_tree.mashes[combo].words.join('|') + '" combo="' + blend_tree.mashes[combo].combo + '">' + types + '</div>')
			.addClass(blend_tree.mashes[combo].types).addClass('mash_level_' + blend_tree.mashes[combo].types.length)
			.prop('title', '<b>words:</b> ' + blend_tree.mashes[combo].words.join('|') + '<br /><b>mash type:</b> ' + blend_tree.mashes[combo].types.join(', '))
			.append('<span>' + blend_tree.mashes[combo].parts.join('</span><span>') + '</span>');

		$mash.on('click.save_mash', function() //todo this
		{
			if($('#blender #save_mashes').length == 0)
			{
				$('#blender').prepend('<div id="save_mashes" />');
			}

			$('#blender #save_mashes').append($(this));
		})

		$permute.append($mash);

		blend_tree.mashes[combo].types.forEach(function(type)
		{
			if($('#blender #combo_checks #filter_check_' + type).length === 0)
			{
				var $filter_check = $('<input type="checkbox" type="' + type + '" id="filter_check_' + type + '" checked="checked" />')
				.attr('title', settings.mash_types[type].long)
				.on('change.filter_type', function()
				{
					var css = {};
					css['.mash.' + type] = {
						display: $(this).prop('checked') ? 'block' : 'none'
					};
					$.injectCSS(css);

					settings.mash_types[type].checked = $(this).prop('checked');
				})
				var $label = $('<label for="filter_check_' + type + '">' + settings.mash_types[type].short + '</label>')
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
			if(!blend_tree.mashes[combo].combo.match(filter_regex))
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

var blend = function()
{
	var keep_blending = true;
	blend_tree = {
		permutes: [],
		wheels: {},
		combos: {},
		mashes: {}
	}

	if(settings.words.length < 2)
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
		.prepend('<div id="combo_checks" />')
		.prepend($mods).css('display', 'flex');

	$('#header').addClass('blended');
	$('head style#injectCSSContainer').remove();

	var permutation_count = 0;
	settings.words.forEach(function(word)
	{
		use_words[word] = [];

		for(var tab_id in word_tab_list[word])
		{
			if(word_tab_list[word][tab_id].use)
			{
				for(var sense_id in word_tab_list[word][tab_id].sense)
				{
					if(word_tab_list[word][tab_id].sense[sense_id].use)
					{
						settings.use_lists.forEach(function(list)
						{
							if(word_tab_list[word][tab_id].sense[sense_id][list])
							{
								word_tab_list[word][tab_id].sense[sense_id][list].forEach(function(w)
								{
									add_word(w, word, list);

									if(!use_words[word].includes(w))
									{
										use_words[word].push(w);
									}
								})
							}
						})
					}
				}
			}
		}

		if(use_words[word].length === 0)
		{
			keep_blending = false;
			$('#blender').empty().hide();
			$('#header').removeClass('blended');
			alert('No words selected for ' + word + '. Check some checkboxes or pick a different word.');
			return;
		}
		else
		{
			permutation_count = (permutation_count === 0 ? use_words[word].length : permutation_count * use_words[word].length);
		}
	})

	//technically here we could do a combo non-repeating formula, but since we're only allowing 2-3 words, and i'm lazy...
	permutation_count = permutation_count * (settings.words.length === 2 ? 2 : 6);

	console.log(permutation_count)

	if(!keep_blending) return;

	if(settings.server_side_blending)
	{
		$.ajax({
			type: "POST",
			url: 'func.php',
			dataType: 'json',
			data: {
				func: 'blend', 
				word_list: word_list,
				use_words: use_words
			},
			success: function(res)
			{
				console.log('success', res);
				if(!res || res.error)
				{
					$('#blender').empty().hide();
					$('#header').removeClass('blended');
					
					if(res.error) 
					{
						alert(res.error);
					}
					else
					{
						alert('An error has occured.');
					}
				}
				else
				{
					pour(res);
				}
			}
		});
	}
	else
	{
		//['monster', 'mash'] -> [['monster', 'mash'], ['mash', monster]]
		var permute = function(arr, permute_arr, used_items)
		{
			var ch;
			used_items = used_items || [];
			
			arr.forEach(function(item, i)
			{
				ch = arr.splice(i, 1)[0];
				used_items.push(ch);

				if(arr.length === 0)
				{
					permute_arr.push(used_items.slice());
				}

				permute(arr, permute_arr, used_items);
				arr.splice(i, 0, ch);
				used_items.pop();
			})
		}

		permute(settings.words, blend_tree.permutes);

		//[['monster', 'beast', 'zombie'], ['mash', 'sqush', 'crush']] ->
		//[['monster', 'mash'], ['monster', 'squish'], ['monster', 'crush'], ['beast', 'mash'] ...]
		function generate_combos(wheels) 
		{
			var result = [];
			var max = wheels.length-1;

			function helper(arr, i) 
			{
				for (var j = 0, l = wheels[i].length; j < l; j++) 
				{
					var a = arr.slice(0); // clone arr
					a.push(wheels[i][j]);

					if (i==max)
					{
						result.push(a);
					}
					else
					{
						helper(a, i+1);
					}
				}
			}
			helper([], 0);
			return result;
		}

		var permute_and_mash = function()
		{
			blend_tree.permutes.forEach(function(permute)
			{
				var id = permute.join('|');
				blend_tree.wheels[id] = [];

				permute.forEach(function(word)
				{
					try {
						blend_tree.wheels[id].push(use_words[word].slice());
					} 
					catch(e)
					{
						console.log(word, word_tab_list);
						console.error(e);
					}
					
				})

				blend_tree.combos[id] = generate_combos(blend_tree.wheels[id]);

				blend_tree.combos[id].forEach(function(combo)
				{
					make_mash(id, combo.slice());
				})	
			})

			pour();
		}

		if(permutation_count > 1000000)
		{
			if (confirm('You have a LOT of words selected to blend. (You can uncheck some tabs/sections below to lower the word count) If you continue, this might freeze your browser. Press okay to continue blending, or cancel to stop.')) 
			{
				permute_and_mash();
			}
			else
			{
				$('#blender').empty().hide();
				$('#header').removeClass('blended');
			}
		}
		else
		{
			permute_and_mash();
		}
	}
}

var clear = function()
{
	settings.words = [];
	word_list = {};
	word_tab_list = {};
	use_words = {};
	blend_tree = {};

	$('#blender').empty().hide();
	$('#header').removeClass('blended');
	$('head style#injectCSSContainer').remove();
	$('#blend').button().button('disable');
}


$(document).ready(function()
{
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

	$('#blend').button().on('click.blend', function()
	{
		blend();
	}).button('disable')

	$('#clear').button().on('click.clear', function()
	{
		clear();
		$('#input_body').empty();
		add_input_word();
		add_input_word();
	})
});