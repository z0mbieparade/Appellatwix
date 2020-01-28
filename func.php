<?php
ini_set("memory_limit","1G");

if(isset($_POST['func']))
{
	switch ($_POST['func']) {
		case "get_syns":
			get_syns($_POST['word']);
			break;
		case "blend":
			$GLOBALS['use_words'] = $_POST['use_words'];
			$GLOBALS['word_list'] = $_POST['word_list'];
			$GLOBALS['mashes'] = array();

			blend();
			break;
		default:
			echo json_encode(array('error' => 'Something went wrong.'));
	}
}

//break string into syllables
function create_syls($word)
{
	$word_syl = array();

	$words = preg_split('/\s/', $word);

	foreach($words as $w)
	{
		if($w !== '' && $w !== false && $w !== null && $w !== undefined)
		{
			$syls = preg_split('/[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?/i', $w);

			foreach($syls as $syl)
			{
				if($syl !== '' && $syl !== false && $syl !== null && $syl !== undefined && !preg_match('/\(|\)/', $syl))
				{
					$word_syl[] = $syl;
				}
			}
		}
	}

	return $word_syl;
}

function step_mash($options, $words, $mash, $org_words)
{
	$mash['combo'] = $options['first_word_part'].$options['second_word_part'];

	if($mash['parts'])
	{
		$mash['parts'][] = $options['second_word_part'];
		$mash['words'][] = $options['second_word'];
		$mash['types'][] = $options['type'];
	}
	else
	{
		$mash['parts'] = array($options['first_word_part'], $options['second_word_part']);
		$mash['words'] = array($options['first_word'], $options['second_word']);
		$mash['types'] = array($options['type']);
	}

	if(count($words) > 0)
	{
		array_unshift($words, $mash['combo']);
		make_mash($mash['id'], $words, $mash, $org_words);
	}
	else if(!$GLOBALS['mashes'][$mash['combo']])
	{
		$GLOBALS['mashes'][$mash['combo']] = $mash;
	}
	else if(!in_array($options['type'], $GLOBALS['mashes'][$mash['combo']]['types']))
	{
		$GLOBALS['mashes'][$mash['combo']]['types'][] = $options['type'];
	}
}

function make_mash($id, $words = array(), $mash = array(), $org_words = null)
{
	$org_words = $org_words ? $org_words : $words;

	$first_word = array_shift($words);
	$second_word = array_shift($words);

	$mash['id'] = $id;

	//mash together words that start with the same letter 
	//i.e. monster + mash = monstermash
	if(preg_match('/^' . $first_word[0] . '/i', $second_word))
	{
		step_mash(array(
			'first_word' => $first_word,
			'second_word' => $second_word,
			'first_word_part' => $first_word,
			'second_word_part' => $second_word,
			'type' => 'first_letter'
		), $words, $mash, $org_words);
	}

	//mash together words that have a sylable that start with the same letter as another words sylables 
	//i.e. franken|stein + squash -> frankensquash
	$first_word_syl = create_syls($first_word);
	$second_word_syl = create_syls($second_word);
	if(count($first_word_syl) > 1)
	{
		$first_word_part = '';
		$i = 1;

		foreach($first_word_syl as $fws)
		{	
			$first_word_part = $first_word_part . $fws;

			if($first_word_syl[$i])
			{	
				$second_word_part = '';
				for ($s = count($second_word_syl) - 1; $s >= 0; --$s) 
				{
					$sws = $second_word_syl[$s];
					$second_word_part = $sws . $second_word_part;

					if(preg_match('/^' . $first_word_syl[$i][0] . '/i', $second_word_part))
					{
						step_mash(array(
							'first_word' => $first_word,
							'second_word' => $second_word,
							'first_word_part' => $first_word_part,
							'second_word_part' => $second_word_part,
							'type' => 'syl_match'
						), $words, $mash, $org_words);
					}
				}
			}

			$i++;
		}
	}

	//mash together words that rhyme/sound like other words in our array
	//i.e. beat + defeat = beatdefeat
	foreach($org_words as $org)
	{
		if(($GLOBALS['word_list'][$first_word] && in_array('rhyme_list|'.$org, $GLOBALS['word_list'][$first_word])) ||
			($GLOBALS['word_list'][$second_word] && in_array('rhyme_list|'.$org, $GLOBALS['word_list'][$second_word])))
		{
			step_mash(array(
				'first_word' => $first_word,
				'second_word' => $second_word,
				'first_word_part' => $first_word,
				'second_word_part' => $second_word,
				'type' => 'rhyme'
			), $words, $mash, $org_words);
		}

		if(($GLOBALS['word_list'][$first_word] && in_array('rhymeish_list|'.$org, $GLOBALS['word_list'][$first_word])) ||
			($GLOBALS['word_list'][$second_word] && in_array('rhymeish_list|'.$org, $GLOBALS['word_list'][$second_word])))
		{
			step_mash(array(
				'first_word' => $first_word,
				'second_word' => $second_word,
				'first_word_part' => $first_word,
				'second_word_part' => $second_word,
				'type' => 'rhymeish'
			), $words, $mash, $org_words);
		}

		if(($GLOBALS['word_list'][$first_word] && in_array('sounds_like_list|'.$org, $GLOBALS['word_list'][$first_word])) ||
			($GLOBALS['word_list'][$second_word] && in_array('sounds_like_list|'.$org, $GLOBALS['word_list'][$second_word])))
		{
			step_mash(array(
				'first_word' => $first_word,
				'second_word' => $second_word,
				'first_word_part' => $first_word,
				'second_word_part' => $second_word,
				'type' => 'sounds_like'
			), $words, $mash, $org_words);
		}
	}
}

//['monster', 'mash'] -> [['monster', 'mash'], ['mash', monster]]
function permute($arr = array(), $permute_arr = array(), $used_items = array())
{
	$ch = null;
	$i = 0;

	foreach($arr as $item)
	{
		$ch = array_splice($arr, $i, 1)[0];
		$used_items[] = $ch;

		if(count($arr) === 0)
		{
			return $used_items;
		}

		$permute_arr[] = permute($arr, $permute_arr, $used_items);
		array_splice($arr, $i, 0, $ch);
		array_pop($used_items);

		$i++;
	}

	return $permute_arr;
}

//[['monster', 'beast', 'zombie'], ['mash', 'sqush', 'crush']] ->
//[['monster', 'mash'], ['monster', 'squish'], ['monster', 'crush'], ['beast', 'mash'] ...]
function generate_combos($wheels, $arr = array(), $i = 0) 
{	
	$result = array();
	$max = count($wheels) - 1;
	foreach($wheels[$i] as $tick)
	{
		$copy_arr = $arr;
		$copy_arr[] = $tick;

		if($i >= $max)
		{
			$result[] = $copy_arr;
		}
		else
		{
			$gen_combo_res = generate_combos($wheels, $copy_arr, ($i + 1));
			if(is_array($gen_combo_res)) $result = array_merge($gen_combo_res, $result);
		}
	}

	return $result;
}

function blend()
{
	$words = array();
	foreach($GLOBALS['use_words'] as $word => $list)
	{
		$words[] = $word;
	}

	$wheels = array();
	$combos = array();
	$permutes = permute($words);
	$keep_blending = true;


	foreach($permutes as $permute)
	{
		$id = implode('|', $permute);
		$wheels[$id] = array();

		foreach($permute as $word)
		{
			$wheels[$id][] = $GLOBALS['use_words'][$word];
		}

		$combos[$id] = generate_combos($wheels[$id]);

		foreach($combos[$id] as $combo)
		{
			make_mash($id, $combo);
		}
	}

	echo json_encode(array(
		//'combos' => $combos,
		//'wheels' => $wheels,
		'permutes' => $permutes,
		'mashes' => $GLOBALS['mashes']
	));
}

function get_syns($word)
{
	require_once 'api_key.php';
	$url = "https://www.dictionaryapi.com/api/v3/references/thesaurus/json/".$word."?key=".$thesaurus_api;
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_URL, $url);
	$result = curl_exec($ch);
	curl_close($ch);
	echo $result;
}