<?php
//decrementer for Turk experimental assignments
//called when the subject submits the HIT

#sample query string
#if:
#filename= sm_unstructured_13jan
#to_decrement= unstructured-12
#?to_decrement=unstructured-12&filename=sm_unstructured_13jan

header('Access-Control-Allow-Origin: *'); //in order to call this from JS on turk

if (isset($_GET['filename']) ) {
	$filename = $_GET['filename'];

	#$assignment_dir = 'experiment_files/conds_files/';
	if (isset($_GET['dir'])) {
		$dir_string = $_GET['dir'];
	} else {
		$dir_string = '../condition_files';
	}
	$assignment_dir = $dir_string . "/";

	# try to make the directory
	mkdir($assignment_dir, 0777, true);

	$full_filename = $assignment_dir . $filename;
	$assignment_files =  scandir($assignment_dir);

	if(in_array($filename, $assignment_files)) {
		// echo "File already exists.<br />";
		die("File already exists");
	} else {
		//write a new file with the conds
		$fh = fopen($full_filename, 'w') or die("can't open file");
		fwrite($fh, '');
		fclose($fh);
	}
	echo "Success creating cond file.";
} else {
	echo "filename to add is not set";
}

?>
