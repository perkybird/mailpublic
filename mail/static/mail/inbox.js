document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // submit
  document.querySelector("#compose-form").addEventListener('submit', send_email);
  
  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-detail-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function view_email(id){
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
      // Print email
      console.log(email);

      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#email-detail-view').style.display = 'block';
      console.log("setting innerHTMl"); //can delete this lline later
      document.querySelector('#email-detail-view').innerHTML = `
      <ul class="list-group">
        <li class="list-group-item"><strong>Sender:</strong> ${email.sender}</li>
        <li class="list-group-item"><strong>Recipient(s):</strong> ${email.recipients}</li>
        <li class="list-group-item"><strong>Subject:</strong> ${email.subject}</li>
        <li class="list-group-item"><strong>Time sent:</strong> ${email.timestamp}</li>
        <li class="list-group-item">${email.body}</li>
    </ul>
      `

      // mark as read
      if(!email.read){
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
              read: true
          })
        })
      }

      // archiving and unarchiving
      const btn_arch = document.createElement('button');
      btn_arch.innerHTML = email.archived ? "Unarchive" : "Archive";
      btn_arch.className = email.archived ? "btn btn-success" : "btn btn-danger"
      btn_arch.addEventListener('click', function() {
          fetch(`/emails/${email.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              archived: !email.archived
            })
          })
          .then(() => {load_mailbox('inbox')})
      });
      document.querySelector('#email-detail-view').append(btn_arch);

      // replying
      const btn_reply = document.createElement('button');
      btn_reply.innerHTML = email.archived = "Reply";
      btn_reply.className = email.archived = "btn btn-primary ml-2";
      btn_reply.addEventListener('click', function() {
        compose_email();

        document.querySelector('#compose-recipients').value = email.sender;
        let subject = email.subject;
        if((subject.split(' ',1)[0]) != "RE:"){
          subject = "RE: " + email.subject;
          console.log('subject doesnt have reply in it already');
        }
        document.querySelector('#compose-subject').value = subject;
        document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote:
        <${email.body}.>
        `;
      })
      document.querySelector('#email-detail-view').append(btn_reply);

});
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //get requested emails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      //loop emails to make div for each
      emails.forEach(singleEmail => {

        console.log(singleEmail);

        // create divs
        const newEmail = document.createElement('div');
        newEmail.className = "list-group-item border-style";
        newEmail.innerHTML = `
          <strong><h6>${singleEmail.sender}</h6></strong>
          <p>${singleEmail.subject}</p>
          <p>${singleEmail.timestamp}</p>
        `;
        // change background colour for when read
        if (singleEmail.read) {
          newEmail.classList.add('read');
          console.log('read');
        } else{
          newEmail.classList.add('unread');
          console.log('unread');
        }
        // when user clicks on email
        newEmail.addEventListener('click', function() {
          view_email(singleEmail.id)
        });
        document.querySelector('#emails-view').append(newEmail);
      })
});
}

function send_email(event){
  event.preventDefault();
  // Store composition fields/email
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

// send composition to backend
fetch('/emails', {
  method: 'POST',
  body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
  })
})
.then(response => response.json())
.then(result => {
    // Print result
    console.log(result);
    load_mailbox('sent');
});
}

