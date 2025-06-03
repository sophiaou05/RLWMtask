<?php
//maker and getter file for Turk experimental assignments
//called when the page loads to get the experimental condition from a file on the langcog server
//or to create such a file if it doesn't exist yet.

#sample query string
#if:
#conds= unstructured-12,12;1515-12,12;2424-12,12;3333-12,12
#filename= sm_unstructured_13jan
#then the query string looks like:
#?conds=unstructured-12,12;1515-12,12;2424-12,12;3333-12,12&filename=sm_unstructured_13jan

header('Access-Control-Allow-Origin: *');
if (isset($_GET['conds'])) {
	$conds_string = $_GET['conds'];
	$conds = explode( ",", $conds_string );

	#$directory = "experiment_files/conds_files/";
	if (isset($_GET['dir'])) {
		$dir_string = $_GET['dir'];
	} else {
		$dir_string = '../condition_files';
	}
	$directory = $dir_string . "/";

	# try to make the directory
	mkdir($directory, 0777, true);

	# loop through the avail cond files with that subjectID, and count the ones that match the valid conditions
	$subj_string = '';
	$filecount_subj = array_fill(0, count($conds), 0);
	if (isset($_GET['subjectID'])) {
		$subj_string = $_GET['subjectID'];
		for($x = 0; $x < count($conds); $x++) {
			$conds_string = $conds[$x];
			$files = glob($directory . $subj_string . "_" . $conds_string);
			if ($files) {
			 $filecount_subj[$x] = count($files);
			}
		}
	}

	# set up condition array keys
	$cond_array_keys = array_keys($filecount_subj);

	# if subjectID has a file (filecount > 0), return that condition (or if there are multiple that are >0 and the same, a random selection of those)
		# else, use a random selection from the conditions with the minimum values
	if (max($filecount_subj) > 0) {
		$array_items = array_keys($filecount_subj, max($filecount_subj),false);
		$rand_item = array_rand($array_items);
	} else {
		# set up the filecount array
		$filecount = array_fill(0, count($conds), 0);
		# count files for each condition
		for($x = 0; $x < count($conds); $x++) {
			$conds_string = $conds[$x];
			$files = glob($directory . "*_" . $conds_string);
			if ($files) {
			 $filecount[$x] = count($files);
			}
		}
		// get random of the min values
		$array_items = array_keys($filecount, min($filecount),false);
		$rand_item = array_rand($array_items);
	}

	# finally return the condition to use
	echo $cond_array_keys[$array_items[$rand_item]];
}
else {
	echo "The necessary parameters are not set";
}
?>
