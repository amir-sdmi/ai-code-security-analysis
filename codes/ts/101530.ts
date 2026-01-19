import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

const backendUrl = "https://team-knights.dokku.cse.lehigh.edu";
const sessionKey = localStorage.getItem('sessionKey');  //a5PD5eZXWNg5=115632613034941022740
@Component({
    selector: 'profile-page',
    templateUrl: './profilepage.component.html',
    styleUrls: ['./profilepage.component.css']
})

export class ProfilepageComponent implements OnInit {

    ngOnInit(): void {
        this.getProfile();
    }

    // constructor
    constructor(private router: Router) {
    }

    //curl -s http://localhost:8998/users -X PUT -d '{"mUsername": "Sehyoun", 
    //"mEmail": "sej324@lehigh.edu", "mGI": "Sehyoun_GI", "mSO": "Sehyoun_SO", "mNote": "Im backend developer", "sessionKey": "String"}'
    updateProfile() {
        const username = document.getElementById('usernameTextarea') as HTMLInputElement;
        const email = document.getElementById('emailTextarea') as HTMLInputElement;
        const sexuality = document.getElementById('sexualityTextarea') as HTMLInputElement;
        const gender = document.getElementById('genderTextarea') as HTMLInputElement;
        const note = document.getElementById('noteTextarea') as HTMLInputElement;
        // set up an AJAX POST. 
        // When the server replies, the result will go to onSubmitResponse
        const doAjax = async () => {
            await fetch(`${backendUrl}/users`, {
                method: 'PUT',
                body: JSON.stringify({
                    mUsername: username.value,
                    mEmail: email.value,
                    mGI: gender.value,
                    mSO: sexuality.value,
                    mNote: note.value,
                    sessionKey: sessionKey
                }),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8'
                }
            }).then((response) => {
                // If we get an "ok" message, return the json
                if (response.ok) {
                    // redirect to home-page
                    this.router.navigate(['home-page/']);
                    return Promise.resolve(response.json());
                }
                // Otherwise, handle server errors with a detailed popup message
                else {
                    window.alert(`The server replied not ok: ${response.status}\n` + response.statusText);
                }
                return Promise.reject(response);
            }).then((data) => {
                console.log('this is data: ', data);

                //newEntryForm.onSubmitResponse(data);
            }).catch((error) => {
                console.warn('Something went wrong with POST.', error);
                window.alert("Unspecified error, in fetch for submitForm, in NewEntryForm");
            });
        }

        // make the AJAX post and output value or error message to console
        doAjax().then(console.log).catch(console.log);
    }


    getProfile() {
        // Issue an AJAX GET and then pass the result to update(). 
        const doAjax = async () => {
            await fetch(`${backendUrl}/users?sessionKey=${sessionKey}`, {
                method: 'GET',
                headers: {
                    'Content-type': 'application/json; charset=UTF-8'
                },
                cache: 'force-cache'

            }).then((response) => {
                // If we get an "ok" idea, clear the form
                if (response.ok) {
                    console.log("recieved response from server for getUsers");
                    return Promise.resolve(response.json());
                }
                // Otherwise, handle server errors with a detailed popup idea
                else {
                    window.alert(`The server replied not ok: ${response.status}\n` + response.statusText);
                }
                return Promise.reject(response);
            }).then((data) => {
                //data will be:
                console.log('here is data:', data);
                let userData = data.mData;
                console.log('here is data so:', userData.mSO);

                // This function written in part by generating code with ChatGPT3.5 See inputs here https://chat.openai.com/share/6fec5c7b-7cab-44f5-984b-1cd98b5e4d52
                const username = document.getElementById('usernameTextarea') as HTMLInputElement;
                const email = document.getElementById('emailTextarea') as HTMLInputElement;
                const sexuality = document.getElementById('sexualityTextarea') as HTMLInputElement;
                const gender = document.getElementById('genderTextarea') as HTMLInputElement;
                const note = document.getElementById('noteTextarea') as HTMLInputElement;
                username.value = userData.mUsername;
                email.value = userData.mEmail;
                sexuality.value = userData.mSO;
                gender.value = userData.mGI;
                note.value = userData.mNote;

            }).catch((error) => {
                console.warn('Something went wrong with GET.', error);
                console.log("Unspecified error with refresh()");
            });
        }
        // make the AJAX post and output value or error message to console
        doAjax().then(console.log).catch(console.log);
    }
    // Future<User> fetchUsers(String userId, String sessionKey) async{
    //   developer.log('Making web request for user data...');
    //   var url = Uri.parse('https://team-knights.dokku.cse.lehigh.edu/users/$userId?sessionKey=$sessionKey');
    //   var headers = {"Accept":"application/json"};
    //   // garbage user that gets returned if sopmething goes wrong
    //   User garb = User(mId: "", mUsername: 'garbage', mEmail: 'nonExistent', mNote: 'garbage');
    //   var response = await http.get(url, headers: headers);
    //   if(response.statusCode == 200){
    //     final User returnData;
    //     var res = jsonDecode(response.body);
    //     developer.log('json decode: $res');
    //     developer.log('resmdata: ${res['mData']}');
    //     if(res['mData'] is Map){
    //       returnData = User.fromJson(res['mData'] as Map<String,dynamic>);
    //     } else {
    //       developer.log('ERROR: Unexpected json response type (was not user). Using garb');
    //       returnData = garb;
    //     }
    //         developer.log('$returnData');
    //         return returnData;
    //   } else{
    //     throw Exception('Did not receive success status code from request.');
    //   }
    // }
}
