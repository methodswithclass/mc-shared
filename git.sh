#!/bin/bash


cd "${0%/*}"

constName1="commitAndPush"
constName2="pushOnly"

message="$1"
remote="$2"
branch="$3"

operation=$constName1


if [[ -z $branch ]]; 
then
	
	operation=$constName2
	message=""
	remote="$1"
	branch="$2"
fi


commit () {

	git add -A && git commit -m $message
}


push() {

	git push $remote $branch
}


checkPush() {


	if [[ -n $remote && -n $branch ]]; 
	then

		push
	fi

}


commitAndPush() {


	echo "commit and push"

	if [[ -n $branch && -n $message && $operation == $constName1 ]]; 
	then

		commit

		checkPush		
	fi

}


pushOnly() {


	echo "push only"

	if [[ $operation == $constName2 ]];
	then

		checkPush
	fi

}




run() {



	if [[ -n $branch && -n $message ]];
	then

		commitAndPush
	else

		pushOnly
	fi

}



run




