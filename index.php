<?php
//Could do with some nice 1. 2. 3. in obvious spots
//if you put two of the same word (text, text) it does some weird duplicat stuff

require('settings_default.php');
require('inc/vars.php');
$set = $settings;
$setup = false;
if(file_exists('settings.php')){
	include('settings.php');
	foreach($settings as $key => $val){
		$set[$key] = $val;
	}
	$setup = true;
}
if(file_exists('../all_settings.php')){
	include('../all_settings.php');
	if(isset($all_settings['Appellatwix'])){
		foreach($all_settings['Appellatwix'] as $key => $val){
			$set[$key] = $val;
		}
		$setup = true;
	}
}
$settings = $set;
$js_settings = array(
	'debug' => $settings['debug'],
	'server_side_blending' => $settings['server_side_blending'],
	'words' => $settings['words'],
	'use_lists' => $use_lists,
	'all_lists' => $all_lists,
);
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title><?php echo $settings['title']; ?></title>
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link href="css/jquery-ui.css" rel="stylesheet">
	<link href="css/jquery-ui.structure.css" rel="stylesheet">
	<link href="css/style.css" rel="stylesheet">

	<link rel="apple-touch-icon" sizes="180x180" href="css/favicon_io/apple-touch-icon.png">
	<link rel="icon" type="image/png" sizes="32x32" href="css/favicon_io/favicon-32x32.png">
	<link rel="icon" type="image/png" sizes="16x16" href="css/favicon_io/favicon-16x16.png">
	<link rel="manifest" href="css/favicon_io/site.webmanifest">

	<meta property="og:title" content="<?php echo $settings['title']; ?>">
  <meta property="og:description" content="Programmatically generates word combinations.">
  <meta property="og:image" content="<?php echo $settings['Appellatwix_site_path']; ?>css/card_img.png">
  <meta property="og:url" content="<?php echo $settings['Appellatwix_site_path']; ?>">
  <meta property="og:type" content="website">

  <meta name="twitter:title" content="<?php echo $settings['title']; ?>">
  <meta name="twitter:description" content="Programmatically generates word combinations.">
  <meta name="twitter:image" content="<?php echo $settings['Appellatwix_site_path']; ?>css/card_img.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:creator" content="@rotterz">
</head>
<body>
	<script>
		var settings = <?php echo json_encode($js_settings); ?>;
	<?php if(!$setup){ ?>
		console.log('You have not created your settings.php file, please copy settings_default.php to settings.php and update it with correct settings.');
	<?php }?>
	</script>

	<div id="synonym_template">
		<h3 class="word"></h3>
		<div class="loader"></div>
		<h4>Words to blend, click to remove:</h4>
		<div class="use_words"></div>
		<h4>Synonyms, click to add more to blending mix:</h4>
		<div class="input_results"></div>
	</div>

	<div id="title_words">
		<div id="title"><h1>Appellatwix</h1> <h3>A Name Generator by <a href="https://z0m.bi" target="_blank">z0m.bi</a></div>

		<div id="words">
			<label for="input_words">Type 2-3 words to blend: <input id="input_words" /></label>
			<button id="search">Get Synonyms</button>
			<button id="blend">Blend</button>
			<button id="clear">Clear</button>
		</div>
	</div>

	<div id="blender_syns">
		<div id="blender" class="container"></div>
		<div id="synonyms"></div>
	</div>

	<script src="js/jquery-3.4.1.min.js"></script>
	<script src="js/jquery-ui.min.js"></script>
	<script src="js/jquery.injectCSS.js"></script>
	<script src="js/combine.class.js"></script>
	<script src="js/script.js"></script>
	<?php if(isset($settings['include_footer']) && $settings['include_footer'] !== ''){
		include($settings['include_footer']);
	} ?>
</body>
</html>
