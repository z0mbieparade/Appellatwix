<?php
//settings_default.php
//DO NOT MODIFY THIS FILE, COPY IT TO settings.php AND EDIT THAT ONE.
$settings = array(
  'debug' => false,
  //this only works if debug = true, because it's not currently working either way.
  //if this is true we do the permutations, blending, and mashes on the server side
  //instead, which means we can do more words, but uses more server CPU.
  'server_side_blending' => false,


  //in settings.php you really only need to set these, you can leave the others alone.
  //page title
  'title' => 'Appellatwix - A Name Generator | z0m.bi',
  //CAHrot URL ie: http://z0m.bi/apps/Appellatwix/ (need that last slash)
  'Appellatwix_site_path' => "http://" . $_SERVER['SERVER_NAME'] . '/Appellatwix/',
  //anything to include in the bottom of the page, ie /var/www/html/tracking.html
  'include_footer' => '',
  // add a thesaurus API key from https://www.merriam-webster.com
  'thesaurus_api' => '',
  //words to start with, leave array empty to start without a search
  'words' => array('test', 'word'),
);
