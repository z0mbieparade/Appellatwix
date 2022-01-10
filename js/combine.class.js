class Combine {

  constructor(settings) {
    this.settings = {...{
      on_update_word_list: function(){},
      on_update_mash_list: function(){}
    }, ...settings};
    this.word_list = {}; //all the words found during search
    this.word_tab_list = {}; //the tabs generated on search
    this.blend_tree = {}; //blender variables
    this.use_mashes = [];

    this.max = 20; //for debugging, limits the amount of words used

    this.update_word_list_timer = null;
    this.update_mash_list_timer = null;
  }

  add_word(word, relates_to, list)
  {
    this.word_list[word] = this.word_list[word] || [];

  	var rel = list + '|' + relates_to;

  	if(!this.word_list[word].includes(rel))
  	{
  		this.word_list[word].push(rel)
  	}
  }

  search(search_complete)
  {
    var _this = this;
  	var get_all_words = [];
  	this.settings.words.forEach(function(word)
  	{
  		_this.word_tab_list[word] = {
        use_words: [word],
  			use: true
  		};

  		get_all_words.push(new Promise((resolve) =>
  		{
  			_this.get_syns(word, resolve)
  		}))

  		get_all_words.push(new Promise((resolve) =>
  		{
  			_this.datamuse(
  				'?ml=' + word.replace(/[^\w]/gm, '+'),
  				word, 'means_list', 0, 'Words meaning <b>' + word + '</b>', resolve)
  		}))

  		_this.settings.words.forEach(function(other_word)
  		{
  			if(word !== other_word)
  			{
  				get_all_words.push(new Promise((resolve) =>
  				{
  					_this.datamuse(
  						'?ml=' + other_word.replace(/[^\w]/gm, '+') + '&rel_rhy=' + word.replace(/[^\w]/gm, '+'),
  						other_word, 'rhyme_list', 1, 'Words meaning <b>' + other_word + '</b> that <i>rhyme</i> with other entered words', resolve);
  				}))

  				get_all_words.push(new Promise((resolve) =>
  				{
  					_this.datamuse(
  						'?ml=' + other_word.replace(/[^\w]/gm, '+') + '&rel_nry=' + word.replace(/[^\w]/gm, '+'),
  						other_word, 'rhymeish_list', 2, 'Words meaning <b>' + other_word + '</b> that <i>sort of rhyme</i> with other entered words', resolve);
  				}))

  				get_all_words.push(new Promise((resolve) =>
  				{
  					_this.datamuse(
  						'?ml=' + other_word.replace(/[^\w]/gm, '+') + '&sl=' + word.replace(/[^\w]/gm, '+'),
  						other_word, 'sounds_like_list', 3, 'Words meaning <b>' + other_word + '</b> that <i>sound like</i> other entered words', resolve);
  				}))
  			}
  		})
  	})

  	Promise.all(get_all_words).then(function()
  	{
      _this.settings.words.forEach(function(word){
        for(var tab_id in _this.word_tab_list[word])
  			{
  				if(tab_id === 'use' || tab_id === 'use_words') continue;

          let use = _this.word_tab_list[word][tab_id].id === word && _this.word_tab_list[word][tab_id].fl !== 'error';
  				_this.word_tab_list[word][tab_id].use = use;

          if(_this.word_tab_list[word][tab_id].use)
          {
            _this.set_words(true, word, tab_id);
          }
        }
      });

  		if(search_complete) search_complete();
  	});
  }

  update_word_list()
  {
    let _this = this;
    clearTimeout(this.update_word_list_timer);
    this.update_word_list_timer = setTimeout(function()
    {
      _this.settings.on_update_word_list(_this.word_tab_list);
    }, 100);
  }

  //only to be referenced by set_words
  set_all_words(use, word, tab_id, sense_id, wd)
  {
    if(!word || !this.word_tab_list[word]) return;

    //console.log('set_all_words', use, word, tab_id, sense_id, wd);

    let add_sub_words = [];

    for(let tab in this.word_tab_list[word])
    {
      if(tab === 'use' || tab === 'use_words' || (tab_id && tab_id !== tab)) continue;

      if(!sense_id && !wd)
      {
        this.word_tab_list[word][tab].use = use;
      }

      //console.log('tab', tab, this.word_tab_list[word][tab])

      for(let sense in this.word_tab_list[word][tab].sense)
      {
        if(sense_id === 'use' || (sense_id && sense_id !== sense)) continue;

        if(!wd)
        {
          this.word_tab_list[word][tab].sense[sense].use = use;
        }

        //console.log('sense', sense, this.word_tab_list[word][tab].sense[sense]);

        for(let list in this.word_tab_list[word][tab].sense[sense])
        {
          if(['use', 'def', 'hide'].includes(list)) continue;

          //console.log('list', list, this.word_tab_list[word][tab].sense[sense][list]);

          if(wd && this.word_tab_list[word][tab].sense[sense][list].includes(wd))
          {
            add_sub_words.push(wd);
          }
          else if(!wd)
          {
            add_sub_words = add_sub_words.concat(this.word_tab_list[word][tab].sense[sense][list])
          }
        }
      }
    }

    //console.log('add_sub_words', add_sub_words);

    if(add_sub_words.length > 0)
    {
      //this.word_tab_list[word].use_words = this.word_tab_list[word].use_words || [];

      if(use === true)
      {
        for(let i = 0; i < add_sub_words.length; i++)
        {
          if(!this.word_tab_list[word].use_words.includes(add_sub_words[i]))
          {
            this.word_tab_list[word].use_words.push(add_sub_words[i]);
          }
        }

        if(!this.word_tab_list[word].use_words.includes(word))
        {
          this.word_tab_list[word].use_words.push(word)
        }

        this.word_tab_list[word].use_words.sort();
        //console.log('set_all_words', use, word, this.word_tab_list[word].use_words);
        this.update_word_list();
      }
      else if(use === false)
      {
        for(let i = 0; i < add_sub_words.length; i++)
        {
          let index = this.word_tab_list[word].use_words.indexOf(add_sub_words[i])
          if(index > -1)
          {
            this.word_tab_list[word].use_words.splice(index, 1);
          }
        }

        if(!this.word_tab_list[word].use_words.includes(word))
        {
          this.word_tab_list[word].use_words.push(word)
        }

        this.word_tab_list[word].use_words.sort();
        //console.log('set_all_words', use, word, this.word_tab_list[word].use_words);
        this.update_word_list();
      }
    }
  }

  set_words(use, word, tab_id, sense_id, wd)
  {
    if(!word || !this.word_tab_list[word])
    {
      return; //we need at least a word.
    }

    if(use === true || use === false)
    {
      this.set_all_words(use, word, tab_id, sense_id, wd);
    }
  }

  update_mash_list()
  {
    let _this = this;
    clearTimeout(this.update_mash_list_timer);
    this.update_word_list_timer = setTimeout(function()
    {
      //console.log('update_mash_list', _this.use_mashes);
      _this.settings.on_update_mash_list(_this.use_mashes);
    }, 100);
  }

  set_mash(use, comb)
  {
    //console.log('set_mash', use, comb);
    if(use === true && !this.use_mashes.includes(comb))
    {
      this.use_mashes.push(comb);
      this.use_mashes.sort();
      this.update_mash_list();
    }
    else if(use === false && this.use_mashes.includes(comb))
    {
      let index = this.use_mashes.indexOf(comb);
      this.use_mashes.splice(index, 1);
      this.update_mash_list();
    }
  }

  //get syns from thesaurus for word
  get_syns(word, callback)
  {
    var _this = this;
  	$.ajax({
  		type: "POST",
  		url: 'inc/func.php',
  		data: {func: 'get_syns', word: word},
  		success: function(res)
  		{
  			//try {
  				var result = JSON.parse(res);
  				if(Array.isArray(result) && (typeof result[0] === 'string' || result.length === 0))
  				{
  					var tab_id = 'error-' + word.replace(/[^\w]/gm, '_');

  					_this.word_tab_list[word][tab_id] = {
  						use: false,
  						id: word,
  						fl: 'error',
  						sense: {
  							100: {
  								use: false,
  								def: ['The word you\'ve entered isn\'t in the Merriam-Webster Thesaurus. You can choose one below anyway or re-search.'],
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
  						_this.word_tab_list[word][item.meta.uuid] = {
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

  												_this.word_tab_list[word][item.meta.uuid].sense[s.sn] = {
  													use: false,
  													def: []
  												};

  												for(var key in s)
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
  																		d = d.trim().replace(/\(.*?\)\s/g, '');
  																		_this.word_tab_list[word][item.meta.uuid].sense[s.sn].def.push(d);
  																	}
  																})
  															}
  														})
  													}
  													else if(_this.settings.all_lists.includes(key))
  													{
  														_this.word_tab_list[word][item.meta.uuid].sense[s.sn][key] = [];

  														s[key].forEach(function(wd_arr)
  														{
  															wd_arr.forEach(function(wd)
  															{
  																if(wd.wd)
  																{
  																	var d = wd.wd.trim().replace(/\(.*?\)\s/g, '');
  																	_this.word_tab_list[word][item.meta.uuid].sense[s.sn][key].push(d);
  																}

  																if(wd.wvrs)
  																{
  																	wd.wvrs.forEach(function(other_wd)
  																	{
  																		if(other_wd.wva)
  																		{
  																			var d = other_wd.wva.trim().replace(/\(.*?\)\s/g, '');
  																			_this.word_tab_list[word][item.meta.uuid].sense[s.sn][key].push(d);
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
  			//} catch(e) {
  			//	if (e instanceof SyntaxError) {
  		  //      _this.log_error('get_syns', e, true);
  		  //  } else {
  		  //      _this.log_error('get_syns', e, false);
  		  //  }
  			//}
  		}
  	})
  }

  datamuse(url, word, list, sense_id, def, callback)
  {
    var _this = this;
  	$.getJSON('https://api.datamuse.com/words' + url, function(result)
  	{
  		if(result && result.length > 0)
  		{
  			var tab_id = 'datamuse-' + word.replace(/[^\w]/gm, '_');

  			_this.word_tab_list[word][tab_id] = _this.word_tab_list[word][tab_id] || {
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

  			_this.word_tab_list[word][tab_id].sense[sense_id] = {
  				use: true,
  				def: [def]
  			}

  			_this.word_tab_list[word][tab_id].sense[sense_id][list] = [];

  			result.forEach(function(r)
  			{
  				_this.word_tab_list[word][tab_id].sense[sense_id][list].push(r.word);
  			})

  			callback()
  		}
  		else
  		{
  			callback();
  		}

  	})
  }

  //break string into syllables
  create_syls(word)
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

  make_mash(id, words, mash, org_words)
  {
    var _this = this;
  	org_words = org_words || words.slice();

  	var first_word = words.shift();
  	var second_word = words.shift();

  	mash = mash || {
  		id: id
  	}

    //Ablaut Reduplication: knickknack, zigzag, kittycat, hip-hop.
    //Rhyming Reduplication: boogie-woogie, easy-peasy
    //https://proedit.com/ablaut-reduplication/
    var check_reduplication = function(new_mash)
    {
      new_mash.syl_count = _this.create_syls(new_mash.combo).length;

      let match_iao1 = new_mash.combo.match(/^[^aioe]+i[^aio]+a[^aio]+o[^aio]+$/i);
      let match_iao2 = new_mash.combo.match(/^[^aioe]+i[^aio]+(a|o)[^aio]+$/i);
      let match_iao3 = new_mash.combo.match(/^[^aioe]+a[^aio]+o[^aio]+$/i);

      if(match_iao1 || match_iao2 || match_iao3)
      {
        new_mash.types.push('iao');
      }

      if(!new_mash.types.includes('rhyme_redup'))
      {
        //do some regex rhyme matching
        //this will match stuff like b(eat)-def(eat)
        let match_rhyme1 = (new_mash.parts[0] + '-' + new_mash.parts[1]).match(/^[^aeiou]*([aeiou]+\w{1,5})-?(\w+)(\1)$/i);
        let match_rhyme2 = null;
        let match_rhyme3 = null;

        if(new_mash.parts[2])
        {
          match_rhyme2 = (new_mash.parts[0] + '-' + new_mash.parts[2]).match(/^[^aeiou]*([aeiou]+\w{1,5})-?(\w+)(\1)$/i);
          match_rhyme3 = (new_mash.parts[1] + '-' + new_mash.parts[2]).match(/^[^aeiou]*([aeiou]+\w{1,5})-?(\w+)(\1)$/i);
        }

        if(match_rhyme1 || match_rhyme2 || match_rhyme3)
        {
          new_mash.types.push('rhyme_redup');
        }
      }

      return new_mash;
    }

  	var step_mash = function(options)
  	{
  		var options = $.extend({
  			first_word: first_word,
  			second_word: second_word,
  			first_word_part: first_word,
  			second_word: second_word,
        last_word_part: '',
  			type: null
  		}, options)

  		var new_mash = JSON.parse(JSON.stringify(mash));
  		var new_words = words.slice();

  		new_mash.combo = options.first_word_part + options.second_word_part + options.last_word_part;
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

      if(options.last_word_part)
      {
        new_mash.parts.push(options.last_word_part);
      }

  		if(new_words.length > 0)
  		{
  			new_words.unshift(new_mash.combo);
  			_this.make_mash(id, new_words, new_mash, org_words);
  		}
  		else if(!_this.blend_tree.mashes[new_mash.combo])
  		{
  			_this.blend_tree.mashes[new_mash.combo] = check_reduplication(new_mash);
  		}
  		else if(!_this.blend_tree.mashes[new_mash.combo].types.includes(options.type))
  		{
  			_this.blend_tree.mashes[new_mash.combo].types.push(options.type);
  		}
  	}

  	//mash together words that start with the same letter
  	//i.e. monster + mash = monstermash
  	try{
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
  	}
  	catch(e)
  	{
  		if(_this.settings.debug) console.log(first_word, first_word.slice(0, 1))
  		_this.log_error('make_mash first_letter', e);
  	}


  	//1. mash together words that have a syllable that start with the same letter as another words syllables
  	//i.e. franken|stein + squash -> frankensquash

    //2. mash together words first_word_syl + second_word + first_word_syl[2]
    //i.e. franken|stein + squash -> frankensquashstein

  	var first_word_syl = _this.create_syls(first_word);
  	var second_word_syl = _this.create_syls(second_word);
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

                let last_word_part = first_word.replace(new RegExp('^' + first_word_part, 'i'), '');
                if(last_word_part && last_word_part !== second_word_part)
                {
                  step_mash({
    								first_word: first_word,
    								second_word: second_word,
    								first_word_part: first_word_part,
    								second_word_part: second_word_part,
                    last_word_part: last_word_part,
    								type: 'syl_squish'
    							})
                }
  						}
  					}
  				}
  				catch(e)
  				{
  					if(_this.settings.debug) console.log(first_word_syl, first_word_syl[i + 1], first_word_syl[i + 1].slice(0, 1))
  					_this.log_error('make_mash step_mash syl_match/syl_squish', e);
  				}
  			}
  		})
  	}

  	//mash together words that rhyme/sound like other words in our array
  	//i.e. beat + defeat = beatdefeat
  	org_words.forEach(function(org)
  	{
  		if((_this.word_list[first_word] && _this.word_list[first_word].includes('rhyme_list|' + org)) ||
  			(_this.word_list[second_word] && _this.word_list[second_word].includes('rhyme_list|' + org)))
  		{
  			step_mash({
  				first_word: first_word,
  				second_word: second_word,
  				first_word_part: first_word,
  				second_word_part: second_word,
  				type: 'rhyme'
  			})
  		}

  		if((_this.word_list[first_word] && _this.word_list[first_word].includes('rhymeish_list|' + org)) ||
  			(_this.word_list[second_word] && _this.word_list[second_word].includes('rhymeish_list|' + org)))
  		{
  			step_mash({
  				first_word: first_word,
  				second_word: second_word,
  				first_word_part: first_word,
  				second_word_part: second_word,
  				type: 'rhymeish'
  			})
  		}

  		if((_this.word_list[first_word] && _this.word_list[first_word].includes('sounds_like_list|' + org)) ||
  			(_this.word_list[second_word] && _this.word_list[second_word].includes('sounds_like_list|' + org)))
  		{
  			step_mash({
  				first_word: first_word,
  				second_word: second_word,
  				first_word_part: first_word,
  				second_word_part: second_word,
  				type: 'sounds_like'
  			})
  		}

      //do some regex rhyme matching
      //this will match stuff like b(eat)-def(eat)
      if((first_word + '-' + second_word).match(/^[^aeiou]*([aeiou]+\w{1,5})-?(\w+)(\1)$/i))
      {
        step_mash({
  				first_word: first_word,
  				second_word: second_word,
  				first_word_part: first_word,
  				second_word_part: second_word,
  				type: 'rhyme_redup'
  			})
      }
  	})
  }

  blend(success, error, server_side_blending)
  {
    var _this = this;

    if(_this.settings.debug){
      server_side_blending = server_side_blending === undefined ? this.settings.server_side_blending : server_side_blending;
    } else {
      server_side_blending = false;
    }

  	var keep_blending = true;
  	this.blend_tree = {
  		permutes: [],
  		wheels: {},
  		combos: {},
  		mashes: {}
  	}

  	if(this.settings.words.length < 2)
  	{
  		error('Cannot blend, less then 2 words provided.');
  		return;
  	}

    let use_words = {};
  	let permutation_count = 0;
  	this.settings.words.forEach(function(word)
  	{
      use_words[word] = _this.word_tab_list[word].use_words;

  		if(_this.word_tab_list[word].use_words.length === 0)
  		{
  			keep_blending = false;
        error('No words selected for ' + word + '. Check some checkboxes or pick a different word.');
  			return;
  		}
  		else
  		{
  			permutation_count = (permutation_count === 0 ? _this.word_tab_list[word].use_words.length : permutation_count * _this.word_tab_list[word].use_words.length);
  		}
  	})

  	//technically here we could do a combo non-repeating formula, but since we're
    //only allowing 2-3 words, and i'm lazy...
  	permutation_count = permutation_count * (this.settings.words.length === 2 ? 2 : 6);

  	if(!keep_blending) return;

  	if(_this.settings.debug) console.log(permutation_count, server_side_blending);

  	if(server_side_blending)
  	{
  		$.ajax({
  			type: "POST",
  			url: 'inc/func.php',
  			dataType: 'json',
  			data: {
  				func: 'blend',
  				word_list: _this.word_list,
  				use_words: use_words
  			},
  			success: function(res)
  			{
  				if(!res || res.error)
  				{
  					if(res.error)
  					{
  						error(res.error);
  					}
  					else
  					{
  						error('An error has occured.');
  					}
  				}
  				else
  				{
            _this.blend_tree = res;
  					success();
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

  		permute(_this.settings.words, _this.blend_tree.permutes);

  		//[['monster', 'beast', 'zombie'], ['mash', 'sqush', 'crush']] ->
  		//[['monster', 'mash'], ['monster', 'squish'], ['monster', 'crush'], ['beast', 'mash'] ...]
  		var generate_combos = function(wheels)
  		{
  			var result = [];
  			var max = wheels.length-1;

  			var helper = function(arr, i)
  			{
  				for (var j = 0, l = wheels[i].length; j < l; j++)
  				{
  					var a = arr.slice(0); // clone arr
  					a.push(wheels[i][j]);

  					if (i == max)
  					{
  						result.push(a);
  					}
  					else
  					{
  						helper(a, i + 1);
  					}
  				}
  			}
  			helper([], 0);
  			return result;
  		}

  		var permute_and_mash = function()
  		{
  			_this.blend_tree.permutes.forEach(function(permute)
  			{
  				var id = permute.join('|');
  				_this.blend_tree.wheels[id] = [];

  				permute.forEach(function(word)
  				{
  					try {
  						_this.blend_tree.wheels[id].push(_this.word_tab_list[word].use_words.slice());
  					}
  					catch(e)
  					{
  						if(_this.settings.debug) console.log(word, _this.word_tab_list);
  						_this.log_error('permute_and_mash', e);
  					}

  				})

  				_this.blend_tree.combos[id] = generate_combos(_this.blend_tree.wheels[id]);

  				_this.blend_tree.combos[id].forEach(function(comb)
  				{
  					_this.make_mash(id, comb.slice());
  				})
  			})

  			success();
  		}

  		if(permutation_count > 1000000)
  		{
  			if (confirm('You have a LOT of words selected to blend. (You can uncheck some tabs/sections below to lower the word count) If you continue, this might freeze your browser. Press okay to continue blending, or cancel to stop.'))
  			{
  				permute_and_mash();
  			}
  			else
  			{
  				error();
  			}
  		}
  		else
  		{
  			permute_and_mash();
  		}
  	}
  }

  clear()
  {
    this.settings.words = [];
    this.word_list = {};
    this.word_tab_list = {};
    this.blend_tree = {};
    this.use_mashes = [];
  }

  log_error(location, error, explicit) {
    if(this.settings.debug)
    {
      console.error(location, `[${explicit ? 'EXPLICIT' : 'INEXPLICIT'}] ${error.name}: ${error.message}`);
    }
  }
}
