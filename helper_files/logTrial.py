#!/usr/bin/python

from datetime import datetime
import sys, cgi, cgitb, os, errno

# log any errors in /pylogs/
cgitb.enable(display=0, logdir='pylogs')

# get form data from JavaScript
formdata = cgi.FieldStorage()

# get subjectID and dataString (JSON stringified array)
subjectID = formdata.getvalue('subjectID', 'subjectID_NULL')
dataString = formdata.getvalue('dataString', 'dataString_NULL')
outDir = formdata.getvalue('outDir', '../data') # 'data' is the default directory

# make directory (and catch the error if it already exists; and throw the error if there is another issue besides it not existing, e.g. file permissions)
try:
    os.makedirs(outDir)
except OSError as e:
    if e.errno != errno.EEXIST:
        raise

# get string of current date and time
now = str(datetime.now())[:19].replace(':','-').replace(' ','_')

# optionally, could make it so that if there were no valid subject id, include date/time, but not otherwise

# write file in /data/ as 'A989SDF67SDFA5_2018-07-09_11-56-41.txt
outputFilename = outDir + '/' + subjectID + '_' + now + '.txt'
with open(outputFilename, 'w') as outputFile:
   outputFile.write(dataString)

# print header and 'Done.' message
sys.stdout.write('Content-type: text/plain; charset=UTF-8\n\n')
sys.stdout.write('Done.')
