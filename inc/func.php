<?php
ini_set("memory_limit","1G");
if(isset($_POST['func']))
{
	require("combine.class.php");
	$combo = new Combine();
	switch ($_POST['func']) {
		case "get_syns":
			echo json_encode($combo->get_syns($_POST['word']));
			break;
		case "blend":
			$combo->set_words($_POST['use_words'], $_POST['word_list']);
			echo json_encode($combo->blend());
			break;
		default:
			echo json_encode(array('error' => 'Something went wrong.'));
	}
}
//for debugging
/*else if(isset($_GET['func']))
{
	require("combine.class.php");
	$combo = new Combine();
	switch ($_GET['func']) {
		case "get_syns":
			echo json_encode($combo->get_syns($_GET['word']));
			break;
		case "blend":

			$data = json_decode('{"word_list":{"analysis":["means_list|test"],"analytical":["means_list|test"],"analyze":["means_list|test"],"ascertain":["means_list|test"],"assay":["means_list|test"],"assayed":["means_list|test"],"assays":["means_list|test"],"assess":["means_list|test"],"assessing":["means_list|test"],"assessment":["means_list|test"],"audition":["means_list|test"],"audits":["means_list|test"],"benchmark":["means_list|test"],"bioassay":["means_list|test"],"certification":["means_list|test"],"challenge":["means_list|test"],"check":["means_list|test"],"checked":["means_list|test"],"checks":["means_list|test"],"confirm":["means_list|test"],"about":["means_list|word"],"adjective":["means_list|word"],"anything":["means_list|word"],"articulate":["means_list|word"],"bible":["means_list|word"],"buzzword":["means_list|word"],"call":["means_list|word"],"comment":["means_list|word"],"concept":["means_list|word"],"conclusion":["means_list|word"],"condition":["means_list|word"],"countersign":["means_list|word"],"credo":["means_list|word"],"designation":["means_list|word"],"discussion":["means_list|word"],"ear":["means_list|word"],"expression":["means_list|word"],"formula":["means_list|word"],"formulate":["means_list|word"],"give-and-take":["means_list|word"]},"use_words":{"test":["analysis","analytical","analyze","ascertain","assay","assayed","assays","assess","assessing","assessment","audition","audits","benchmark","bioassay","certification","challenge","check","checked","checks","confirm"],"word":["about","adjective","anything","articulate","bible","buzzword","call","comment","concept","conclusion","condition","countersign","credo","designation","discussion","ear","expression","formula","formulate","give-and-take"]}}', true);

			//var_dump($data);

			$combo->set_words($data['use_words'], $data['word_list']);
			echo json_encode($combo->blend());
			break;
		default:
			echo json_encode(array('error' => 'Something went wrong.'));
	}
}*/
