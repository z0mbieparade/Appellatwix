<?php
// combine.class.php
class Combine
{
  private $words;
  private $use_words;
  private $word_list;
  private $word_tab_list;
  private $settings;
  private $blend_tree;

  public $mashes;

  public function __construct($words=false)
  {
    require('../settings_default.php');
    require('vars.php');
    $set = $settings;
    if(file_exists('../settings.php')){
    	include('../settings.php');
    	foreach($settings as $key => $val){
    		$set[$key] = $val;
    	}
    }
    if(file_exists('../../all_settings.php')){
    	include('../../all_settings.php');
    	if(isset($all_settings['Appellatwix'])){
    		foreach($all_settings['Appellatwix'] as $key => $val){
    			$set[$key] = $val;
    		}
    	}
    }
    $this->settings = $set;
    $this->settings['use_lists'] = $use_lists;
    $this->settings['all_lists'] = $all_lists;
    if(file_exists(dirname(__FILE__) . '/../settings.php')){
    	include(dirname(__FILE__) . '/../settings.php');
      foreach($this->settings as $key => $val){
        if(isset($settings[$key])){
          $this->settings[$key] = $settings[$key];
        }
      }
    }

    if(is_array($words)){
      $this->settings['words'] = $words;
    }

    $this->word_list = array();
    $this->use_words = array();
  }

  public function set_words($use_words=array(), $word_list=array())
  {
    $this->word_list = $word_list;
    $this->use_words = $use_words;
  }

  private function add_word($word, $relates_to, $list)
  {
    if(!isset($this->word_list[$word])){
      $this->word_list[$word] = array();
    }

  	$rel = $list . '|' . $relates_to;

  	if(!array_search($rel, $this->word_list[$word]))
  	{
      array_push($this->word_list[$word], $rel);
  	}
  }

  //break string into syllables
  public function create_syls($word)
  {
  	$word_syl = array();
  	$words = preg_split('/\s/', $word);

  	foreach($words as $w)
  	{
  		if(isset($w) && $w !== '' && $w !== false && $w !== null)
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

  public function step_mash($options, $words, $mash, $org_words)
  {
  	$mash['combo'] = $options['first_word_part'].$options['second_word_part'];

  	if(isset($mash['parts']))
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
  		$this->make_mash($mash['id'], $words, $mash, $org_words);
  	}
  	else if(!isset($this->mashes[$mash['combo']]))
  	{
  		$this->mashes[$mash['combo']] = $mash;
  	}
  	else if(!in_array($options['type'], $this->mashes[$mash['combo']]['types']))
  	{
  		$this->mashes[$mash['combo']]['types'][] = $options['type'];
  	}
  }

  //mash words together
  public function make_mash($id, $words=array(), $mash=array(), $org_words = null)
  {
  	$org_words = $org_words ? $org_words : $words;

  	$first_word = array_shift($words);
  	$second_word = array_shift($words);

  	$mash['id'] = $id;

  	//mash together words that start with the same letter
  	//i.e. monster + mash = monstermash
  	if(preg_match('/^' . $first_word[0] . '/i', $second_word))
  	{
  		$this->step_mash(array(
  			'first_word' => $first_word,
  			'second_word' => $second_word,
  			'first_word_part' => $first_word,
  			'second_word_part' => $second_word,
  			'type' => 'first_letter'
  		), $words, $mash, $org_words);
  	}

  	//mash together words that have a sylable that start with the same letter as another words sylables
  	//i.e. franken|stein + squash -> frankensquash
  	$first_word_syl = $this->create_syls($first_word);
  	$second_word_syl = $this->create_syls($second_word);
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
  						$this->step_mash(array(
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
  		if(($this->word_list[$first_word] && in_array('rhyme_list|'.$org, $this->word_list[$first_word])) ||
  			($this->word_list[$second_word] && in_array('rhyme_list|'.$org, $this->word_list[$second_word])))
  		{
  			$this->step_mash(array(
  				'first_word' => $first_word,
  				'second_word' => $second_word,
  				'first_word_part' => $first_word,
  				'second_word_part' => $second_word,
  				'type' => 'rhyme'
  			), $words, $mash, $org_words);
  		}

  		if(($this->word_list[$first_word] && in_array('rhymeish_list|'.$org, $this->word_list[$first_word])) ||
  			($this->word_list[$second_word] && in_array('rhymeish_list|'.$org, $this->word_list[$second_word])))
  		{
  			$this->step_mash(array(
  				'first_word' => $first_word,
  				'second_word' => $second_word,
  				'first_word_part' => $first_word,
  				'second_word_part' => $second_word,
  				'type' => 'rhymeish'
  			), $words, $mash, $org_words);
  		}

  		if(($this->word_list[$first_word] && in_array('sounds_like_list|'.$org, $this->word_list[$first_word])) ||
  			($this->word_list[$second_word] && in_array('sounds_like_list|'.$org, $this->word_list[$second_word])))
  		{
  			$this->step_mash(array(
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
  public function permute($arr = array(), $permute_arr = array(), $used_items = array())
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

  		$permute_arr[] = $this->permute($arr, $permute_arr, $used_items);
  		array_splice($arr, $i, 0, $ch);
  		array_pop($used_items);

  		$i++;
  	}

  	return $permute_arr;
  }

  //[['monster', 'beast', 'zombie'], ['mash', 'sqush', 'crush']] ->
  //[['monster', 'mash'], ['monster', 'squish'], ['monster', 'crush'], ['beast', 'mash'] ...]
  function generate_combos($wheels, $arr=array(), $i=0)
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
  			$gen_combo_res = $this->generate_combos($wheels, $copy_arr, ($i + 1));
  			if(is_array($gen_combo_res)) $result = array_merge($gen_combo_res, $result);
  		}
  	}

  	return $result;
  }

  public function blend()
  {
    $keep_blending = true;
  	$this->blend_tree = array(
  		'permutes' => array(),
  		'wheels' => array(),
  		'combos' => array(),
  		'mashes' => array()
  	);

  	if(count($this->settings['words']) < 2)
  	{
  		return array('error' => 'Cannot blend, less then 2 words provided.');
  		return;
  	}

  	$this->blend_tree['permutes'] = $this->permute($this->settings['words']);
  	$keep_blending = true;

    foreach($this->blend_tree['permutes'] as $permute)
    {
      $id = implode('|', $permute);
      $this->blend_tree['wheels'][$id] = array();

      foreach($permute as $word)
      {
        array_push($this->blend_tree['wheels'][$id], $this->use_words[$word]);
      }

      $this->blend_tree['combos'][$id] = $this->generate_combos($this->blend_tree['wheels'][$id]);

      foreach($this->blend_tree['combos'][$id] as $combo)
  		{
  			$this->make_mash($id, $combo);
  		}
    }

  	return array(
      //'words' => $this->settings['words'],
      //'word_list' => $this->use_words,
      //'use_words' => $this->word_list,
  		//'combos' => $this->blend_tree['combos'],
  		//'wheels' => $this->blend_tree['wheels'],
  		'permutes' => $this->blend_tree['permutes'],
  		'mashes' => $this->mashes,
  	);
  }

  public function get_syns($word)
  {
    if(isset($this->settings['thesaurus_api']) && $this->settings['thesaurus_api'] !== '')
    {
      $url = "https://www.dictionaryapi.com/api/v3/references/thesaurus/json/".$word."?key=".$this->settings['thesaurus_api'];
    	$ch = curl_init();
    	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    	curl_setopt($ch, CURLOPT_URL, $url);
    	$result = curl_exec($ch);
    	curl_close($ch);
    	return json_decode($result);
    }
    else
    {
      return array('error' => 'No thesaurus_api key set in settings.php.');
    }
  }

}
