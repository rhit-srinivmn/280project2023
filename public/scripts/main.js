var rhit = rhit || {};

rhit.FB_COLLECTION_EQUATIONLOG = "EquationLog";
rhit.FB_KEY_SUBJECT = "subject";
rhit.FB_KEY_POST = "post";
rhit.FB_KEY_LAST_TOUCHED = "lastTouched";
rhit.FB_KEY_USER = "user";
rhit.FB_KEY_NAME = "name";
rhit.FB_KEY_DATE = "date";
rhit.FB_KEY_COMMENT = "comment";
rhit.FB_KEY_GRADE = "grade";
rhit.fbEquationListManager = null;
rhit.fbSingleEquationManager = null;
rhit.fbAuthManager = null;
var masterAuth = "OSABPm02M4O2JEBEnm0EB9jlHLK2";
var inputEmailEl = "";
var inputPasswordEl = "";


// From: https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

rhit.ListPageController = class {
	constructor() {
		document.querySelector("#menuShowAll").addEventListener("click", (event) => {
			console.log("Show All Posts");

			window.location.href = "/list.html"
		});
		document.querySelector("#menuShowMy").addEventListener("click", (event) => {
			console.log("Show My Posts");
			window.location.href = `/list.html?uid=${rhit.fbAuthManager.uid}`
		});
		document.querySelector("#menuSignOut").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});
		

		// document.querySelector("#submitAddQuote").onclick = (event) => {
		// };

		document.querySelector("#submitAddLog").addEventListener("click", (event) => {
			const subject = document.querySelector("#inputSubject").value;
			const equation = document.querySelector("#inputLog").value;
			const name = document.querySelector("#inputName").value;
			const eqnName = document.querySelector("#inputDate").value;
			const comment = document.querySelector("#inputComment").value;
			const grade = document.querySelector("#inputGrade").value;
			rhit.fbEquationListManager.add(subject, equation, name, eqnName, comment, grade);
		});

		$("#addPostDialog").on("show.bs.modal", (event) => {
			// Pre animation
			document.querySelector("#inputSubject").value = "";
			document.querySelector("#inputLog").value = "";
			document.querySelector("#inputName").value = "";
			document.querySelector("#inputDate").value ="";
			document.querySelector("#inputComment").value = "";
			document.querySelector("#inputGrade").value="";
		});
		$("#addPostDialog").on("shown.bs.modal", (event) => {
			// Post animation
			document.querySelector("#inputSubject").focus();
		});
		document.querySelector("#submitAddFile").addEventListener("click", (event) => {
			event.preventDefault();
			var timestamp = Number(new Date());
			var storageRef = firebase.storage().ref(timestamp.toString());
			var $ = jQuery;
			var file_data = $("#uploadMp4").prop("files")[0];
			storageRef.put(file_data);
		});

		$("#addFileDialog").on("show.bs.modal", (event) => {
			// Pre animation
		});
		$("#addFileDialog").on("shown.bs.modal", (event) => {
			// Post animation
		});

		// Start listening!
		rhit.fbEquationListManager.beginListening(this.updateList.bind(this));

	}


	updateList() {
		console.log("I need to update the list on the page!");
		console.log(`Num Posts = ${rhit.fbEquationListManager.length}`);
		const newList = htmlToElement('<div id="studentLogContainer"></div>');
		for (let i = 0; i < rhit.fbEquationListManager.length; i++) {
			const lg = rhit.fbEquationListManager.getPostAtIndex(i);
			const newCard = this._createCard(lg);
			newCard.onclick = (event) => {
				window.location.href = `/post.html?id=${lg.id}`;
			};
			newList.appendChild(newCard);
		}


		// Remove the old quoteListContainer
		const oldList = document.querySelector("#studentLogContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;
		// Put in the new quoteListContainer
		oldList.parentElement.appendChild(newList);
	}

	_createCard(log) {
		return htmlToElement(`
			<div class="card" style="border-radius: 10%">
				<div class="card-body" style="border-radius: 10%">
					<h6 class="card-subtitle mb-2 text-muted">Name: ${log.name}</h6>
					<h6 class="card-subtitle mb-2 text-muted">Date: ${log.date}</h6>
					<h4 class="card-title">Subject: ${log.subject}</h4>
					<h5 class="card-subtitle mb-2">${log.equation}</h5>
					<h6 class="card-subtitle mb-2">Comment: ${log.comment}</h6>
					<h6 class="card-subtitle mb-2" style="display: hidden">${log.grade}</h6>
				</div>
			</div>`);
	}
	
	

}

rhit.Equation = class {
    constructor(id, subject, equation, name, eqnName, comment, grade) {
        this.id = id;
        this.subject = subject;
        this.equation = equation;
        this.name = name;
        this.eqnName = eqnName;
        this.comment = comment;
        this.grade = grade;
    }
}

rhit.FbEquationListManager = class {
	constructor(uid) {
		this._uid = uid;
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_EQUATIONLOG);
		this._unsubscribe = null;
	}

	add(subject, post, name, date, comment, grade) {
		// Add a new document with a generated id.
		this._ref.add({
			[rhit.FB_KEY_SUBJECT]: subject,
			[rhit.FB_KEY_POST]: equation,
			[rhit.FB_KEY_USER]: rhit.fbAuthManager.uid,
			[rhit.FB_KEY_DATE]: date,
			[rhit.FB_KEY_NAME]: name,
			[rhit.FB_KEY_COMMENT]: comment,
			[rhit.FB_KEY_GRADE]: grade,
			[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now(),
		})
		
			.then(function (docRef) {
				console.log("Document written with ID: ", docRef.id);
			})
			.catch(function (error) {
				console.error("Error adding document: ", error);
			});
	}

	beginListening(changeListener) {
		let query = this._ref.orderBy(rhit.FB_KEY_LAST_TOUCHED, "desc").limit(50);
		if(this._uid){
			query=query.where(rhit.FB_KEY_USER, "==", this._uid)
		}
		this._unsubscribe = query.onSnapshot((querySnapshot) => {
				console.log("Log Update");
				this._documentSnapshots = querySnapshot.docs;
				// querySnapshot.forEach((doc) => {
				// 	console.log(doc.data());
				// });
				changeListener();
			});
	}

	stopListening() {
		this._unsubscribe();
	}

	// update(id, quote, movie) {}
	// delete(id) {}
	get length() {
		return this._documentSnapshots.length;
	}

	getPostAtIndex(index) {
		const docSnapshot = this._documentSnapshots[index];
		const lg = new rhit.Equation(docSnapshot.id,
			docSnapshot.get(rhit.FB_KEY_SUBJECT),
			docSnapshot.get(rhit.FB_KEY_POST),
			docSnapshot.get(rhit.FB_KEY_NAME),
			docSnapshot.get(rhit.FB_KEY_DATE),
			docSnapshot.get(rhit.FB_KEY_COMMENT),
			docSnapshot.get(rhit.FB_KEY_GRADE));
		return lg;
	}
}

rhit.DetailPageController = class {
	constructor() {
		document.querySelector("#menuSignOut").addEventListener("click", (event) =>{
			rhit.fbAuthManager.signOut();
		})

		document.querySelector("#submitEditPost").addEventListener("click", (event) => {
			const subject = document.querySelector("#inputSubject").value;
			const post = document.querySelector("#inputPost").value;
			const name = document.querySelector("#inputName").value;
			const date = document.querySelector("#inputDate").value;
			const comment = document.querySelector("#inputComment").value;
			const grade = document.querySelector("#inputGrade").value;
			rhit.fbSingleEquationManager.update(subject, post, name, date, comment, grade);
		});

		$("#editPostDialog").on("show.bs.modal", (event) => {
			// Pre animation
			document.querySelector("#inputSubject").value = rhit.fbSingleEquationManager.subject;
			document.querySelector("#inputPost").value = rhit.fbSingleEquationManager.post;
			document.querySelector("#inputName").value = rhit.fbSingleEquationManager.name;
			document.querySelector("#inputDate").value = rhit.fbSingleEquationManager.date;
			document.querySelector("#inputComment").value = rhit.fbSingleEquationManager.comment;
			document.querySelector("#inputGrade").value = rhit.fbSingleEquationManager.grade;
		});
		$("#editPostDialog").on("shown.bs.modal", (event) => {
			// Post animation
			document.querySelector("#inputPost").focus();
		});

		document.querySelector("#submitDeletePost").addEventListener("click", event => {
			rhit.fbSingleEquationManager.delete().then(() => {
				console.log("Document successfully deleted!");
				window.location.href = "/list.html";
			}).catch(error => console.error("Error removing document: ", error));
		});

		rhit.fbSingleEquationManager.beginListening(this.updateView.bind(this));
	}
	updateView() {
		document.querySelector("#cardSubject").innerHTML = rhit.fbSingleEquationManager.subject;
		document.querySelector("#cardPost").innerHTML = rhit.fbSingleEquationManager.post;
		document.querySelector("#cardName").innerHTML = rhit.fbSingleEquationManager.name;
		document.querySelector("#cardDate").innerHTML = rhit.fbSingleEquationManager.date;
		document.querySelector("#cardComment").innerHTML = rhit.fbSingleEquationManager.comment;
		document.querySelector("#cardGrade").innerHTML = rhit.fbSingleEquationManager.grade;

		if(rhit.fbSingleEquationManager.user == rhit.fbAuthManager.uid || rhit.fbAuthManager.uid == masterAuth){
			document.querySelector("#cardGrade").style.display = "flex";
			document.querySelector("#menuEdit").style.display = "flex";
			document.querySelector("#menuDelete").style.display = "flex";
			if(rhit.fbSingleEquationManager.grade == "10" || rhit.fbSingleEquationManager.grade == '9'){
				document.body.style.backgroundColor = "green";
			}else if(rhit.fbSingleEquationManager.grade == "7" || rhit.fbSingleEquationManager.grade == '8'){
				document.body.style.backgroundColor = "yellow";
			}else{
				document.body.style.backgroundColor = "red";
			}
		}
		if(rhit.fbAuthManager.uid == masterAuth){
			document.querySelector("#inputComment").style.display = "flex";
			document.querySelector("#inputGrade").style.display = "flex";
		}
	}
}

rhit.FbSingleEquationManager = class {
	constructor(postId) {
		this._documentSnapshot = {};
		this._unsubscribe = null;
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_EQUATIONLOG).doc(postId);
	}

	beginListening(changeListener) {
		this._unsubscribe = this._ref.onSnapshot((doc) => {
			if (doc.exists) {
				console.log("Document data:", doc.data());
				this._documentSnapshot = doc;
				changeListener();
			} else {
				// doc.data() will be undefined in this case
				console.log("No such document!");
				//window.location.href = "/";
			}
		});
	}

	stopListening() {
		this._unsubscribe();
	}

	update(subject, post, name, date, comment, grade) {
		this._ref.update({
				[rhit.FB_KEY_SUBJECT]: subject,
				[rhit.FB_KEY_POST]: post,
				[rhit.FB_KEY_NAME]: name,
				[rhit.FB_KEY_DATE]: date,
				[rhit.FB_KEY_COMMENT]: comment,
				[rhit.FB_KEY_GRADE]: grade,
				[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now(),
			})
			.then(() => {
				console.log("Document successfully updated!");
			})
			.catch(function (error) {
				console.error("Error updating document: ", error);
			});
	}

	delete() {
		return this._ref.delete();
	}

	get subject() {
		return this._documentSnapshot.get(rhit.FB_KEY_SUBJECT);
	}

	get post() {
		return this._documentSnapshot.get(rhit.FB_KEY_POST);
	}
	get user(){
		return this._documentSnapshot.get(rhit.FB_KEY_USER);
	}
	get name(){
		return this._documentSnapshot.get(rhit.FB_KEY_NAME);
	}
	get date(){
		return this._documentSnapshot.get(rhit.FB_KEY_DATE);
	}
	get comment(){
		return this._documentSnapshot.get(rhit.FB_KEY_COMMENT);
	}
	get grade(){
		return this._documentSnapshot.get(rhit.FB_KEY_GRADE);
	}
}
rhit.LoginPageController = class{
	constructor(){
		document.querySelector("#createAccountButton").onclick = (event)=>{
			rhit.fbAuthManager.createAccount();
		}
		document.querySelector("#logInButton").onclick = (event)=>{
			rhit.fbAuthManager.signIn();
		}
		document.querySelector("#signOutButton").onclick = (event)=>{
			rhit.fbAuthManager.signOut();
		}

	}
}

rhit.FbAuthManager = class{
	constructor(){
		this._user = null;
	}
	beginListening(changeListener){
		firebase.auth().onAuthStateChanged((user) => {
			this._user = user;
			changeListener();
		  });
	}
	signIn(){
		const inputEmailEl = document.querySelector("#inputEmail");
		const inputPasswordEl = document.querySelector("#inputPassword");
		console.log(`Log in for email: ${inputEmailEl.value} password: ${inputPasswordEl.value}`);
		firebase.auth().signInWithEmailAndPassword(inputEmailEl.value, inputPasswordEl.value).catch(function(error){
			var errorCode = error.code;
			var errorMessage = error.message;
			console.log("Sign in error", errorCode, errorMessage);
			document.querySelector("#displayHolder").innerHTML = "Invalid Login, there is a sign In error: " + errorMessage;
		});
		  
	}
	signOut(){
		firebase.auth().signOut().catch((error) => {
			console.log('Sign out error');
		  });
	}
	createAccount(){
		const inputEmailEl = document.querySelector("#inputEmail");
		const inputPasswordEl = document.querySelector("#inputPassword");
		console.log(`Create Account for email: ${inputEmailEl.value} password: ${inputPasswordEl.value}`);
		firebase.auth().createUserWithEmailAndPassword(inputEmailEl.value, inputPasswordEl.value).catch(function(error){
			var errorCode = error.code;
			var errorMessage = error.message;
			console.log("Create acct error", errorCode, errorMessage);
			document.querySelector("#displayHolder").innerHTML = "Invalid account creation please try again: " + errorMessage
		});
	}
	get isSignedIn(){
		return !!this._user;
	}
	get uid(){
		return this._user.uid;
	}
}
rhit.checkForRedirects = function(){
	if(document.querySelector("#loginPage") && rhit.fbAuthManager.isSignedIn){
		window.location.href="/list.html";

	}
	if(!document.querySelector("#loginPage") && !rhit.fbAuthManager.isSignedIn){
		window.location.href="/";
	}
}
rhit.initializePage = function(){
	const urlParams = new URLSearchParams(window.location.search);
		if (document.querySelector("#listPage")) {
		console.log("You are on the list page.");
		const uid = urlParams.get("uid");
		document.querySelector("#nameHead").innerHTML = "Hello User: " + rhit.fbAuthManager.uid;
		rhit.fbEquationListManager = new rhit.FbEquationListManager(uid);
		new rhit.ListPageController();
	}
	if (document.querySelector("#detailPage")) {
		console.log("You are on the detail page.");
		document.querySelector("#detailDisplayHolder").innerHTML = "Hello User: " + rhit.fbAuthManager.uid;
		const postId = urlParams.get("id");
		if (!postId) {
			window.location.href = "/";
		}
		rhit.fbSingleEquationManager = new rhit.FbSingleEquationManager(postId);
		new rhit.DetailPageController();
	}
	if(document.querySelector("#loginPage")){
		console.log("You are on the Login page");
		new rhit.LoginPageController();
	}
}
rhit.main = function () {
	console.log("Ready");		
	rhit.fbAuthManager = new rhit.FbAuthManager();
	rhit.fbAuthManager.beginListening(()=>{
		console.log("isSignedIn = ", rhit.fbAuthManager.isSignedIn);
		rhit.checkForRedirects();
		rhit.initializePage();
	});

	};





rhit.main();