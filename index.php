<?php
//Could do with some nice 1. 2. 3. in obvious spots

require('settings_default.php');
require('inc/vars.php');
$default_settings = $settings;
$js_settings = array(
	'debug' => $settings['debug'],
	'server_side_blending' => $settings['server_side_blending'],
	'words' => $settings['words'],
	'use_lists' => $use_lists,
	'all_lists' => $all_lists,
);
$setup = false;
if(file_exists('settings.php')){
	include('settings.php');
	$settings = array_merge($default_settings, $settings);
	$setup = true;
	if(isset($settings['debug'])){
		$js_settings['debug'] = $settings['debug'];
	}
	if(isset($settings['server_side_blending'])){
		$js_settings['server_side_blending'] = $settings['server_side_blending'];
	}
	if(isset($settings['words'])){
		$js_settings['words'] = $settings['words'];
	}
}
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
	<div id="input_word_template">
		<div class="input_input">
			<input type="text" class="input_field" placeholder="type a word to search for" />
			<button class="add_input_word round_button">+</button>
			<button class="remove_row round_button">-</button>
		</div>
		<div class="loader"></div>
		<div class="input_results"></div>
	</div>

	<div id="result_type_template">
		<span class="fl"></span>
		<span class="shortdef"></span>
	</div>

	<div id="title"><h1>Appellatwix</h1> <h3>A Name Generator</h3></div>

	<div id="header">
		<div id="settings" class="container">
			<div class="explain">
				<p>Below you can type 2 - 3 words (adding or subtracting words using the <b>+</b> and <b>-</b> buttons.)</p>
				<p>Once you have entered your words, click <b>search</b> to generate synonyms, then click <b>blend</b> to run the name blender.</p>
			</div>

			<div class="buttons">
				<button id="search">Search</button>
				<button id="blend">Blend (Browser)</button>
				<button id="blend_server">Blend (Server)</button>
				<button id="clear">Clear</button>
			</div>
		</div>

		<div id="blender" class="container"></div>
	</div>

	<div id="input_body"></div>

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
