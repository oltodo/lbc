#!/bin/sh

echo "Start update :"

br=" "

echo $br
echo "Dump remote db :"
echo $br

cmd1='cd www/lbc'
cmd2='mongodump --db lbc'

ssh oltodo@ks3359727.kimsufi.com "$cmd1; $cmd2"

echo $br
echo "Upload remote dump :"
echo $br

scp -r oltodo@ks3359727.kimsufi.com:www/lbc/dump dumps

echo $br
echo "Restore local db :"
echo $br

mongorestore --drop dumps/dump

echo $br
echo "Backup dump :"
echo $br

from="dumps/dump"
to="dumps/dump-$(date '+%Y-%m-%d-%H-%M-%S')"

echo "$from ==> $to"
mv $from $to

echo $br
echo "Launch a new crawl :"
echo $br

node crawler --execute-search 5228f3c51bb0bc2b7aea9549

echo $br
echo "Dump local db :"
echo $br

mongodump --db lbc

echo $br
echo "Send local db to remote :"
echo $br

scp -r dump oltodo@ks3359727.kimsufi.com:www/lbc/
rm -rf dump

echo $br
echo "Restore remote db :"
echo $br

cmd1='cd www/lbc'
cmd2='mongorestore --drop dump'

ssh oltodo@ks3359727.kimsufi.com "$cmd1; $cmd2"

echo $br
echo "done."