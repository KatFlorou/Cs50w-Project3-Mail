document.addEventListener('DOMContentLoaded', () => {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Send email 
  document.querySelector('#compose-form').addEventListener('submit', send_email);
  //document.querySelector('#compose-form').addEventListener('submit', () => load_mailbox('sent'));

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#individual-email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}


function send_email(event) {
  
  // Get input
  const compose_recipients = document.querySelector('#compose-recipients').value; 
  const compose_subject = document.querySelector('#compose-subject').value;
  const compose_body = document.querySelector('#compose-body').value;

  // Prevents form from submitting 
  event.preventDefault();

  // Post to emails view
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: compose_recipients,
      subject: compose_subject,
      body: compose_body
    })
  })
  .then(response => response.json())
  .then(result => {
    // Print result
    console.log(result);
     // Redirect to sent mailbox
    load_mailbox('sent');
  })
}


function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#individual-email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  show_mailbox(mailbox);

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
}


function show_mailbox(mailbox) {
  // Fetch mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // For each email create a div and populate it with information
    emails.forEach((email) => {
      const email_container = document.createElement('div');
      email_container.className = 'email_container border rounded p-2 d-flex list-group-item list-group-item-action';
      if (email.read === true) {
        email_container.classList.toggle('list-group-item-dark');
      }
      switch (mailbox) {
        case 'inbox':
          email_container.innerHTML = `<span class="font-weight-bold">${email.sender}</span>  
                                    <span class="pl-4">${email.subject}</span>  
                                    <span class="ml-auto text-secondary">${email.timestamp}</span> 
                                    <button class="ml-1 btn btn-sm btn-outline-primary" onclick="archive_email(${email.id}, event)">Archive</button>`;
          break;
        case 'archive':
          email_container.innerHTML = `<span class="font-weight-bold">${email.sender}</span>  
                                    <span class="pl-4">${email.subject}</span>  
                                    <span class="ml-auto text-secondary">${email.timestamp}</span> 
                                    <button class="ml-1 btn btn-sm btn-outline-primary" onclick="unarchive_email(${email.id}, event)">Unarchive</button>`;
          break;
        case 'sent':
          email_container.innerHTML = `<span class="font-weight-bold">${email.sender}</span>  
                                    <span class="pl-4">${email.subject}</span>  
                                    <span class="ml-auto text-secondary">${email.timestamp}</span>`;
      }
      document.querySelector('#emails-view').append(email_container);
      // Add event listener to each div
      email_container.addEventListener('click', () => show_email(email.id)); 
    }); 
  });
}


function show_email(email_id) {

  // Show individual email and hide other views
  document.querySelector('#individual-email-view').style.display = 'block';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  
  // Clear any previous data
  const previous_item = document.querySelector("#individual-email-view").children;
  if (previous_item.length !== 0) {
    document.querySelector("#individual-email-view").replaceChildren();
  }

  // Fetch specific email
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    // Create and populate the view for the individual email
    const email_sender = document.createElement('p');
    email_sender.innerHTML = `<span class="font-weight-bold">From: </span> ${email.sender}`;
    email_sender.className = 'mb-0';
    const email_receiver = document.createElement('p');
    email_receiver.innerHTML = `<span class="font-weight-bold">To: </span> ${email.recipients}`;
    email_receiver.className = 'mb-0';
    const email_subject = document.createElement('p');
    email_subject.innerHTML = `<span class="font-weight-bold">Subject: </span> ${email.subject}`;
    email_subject.className = 'mb-0';
    const email_time = document.createElement('p');
    email_time.className = 'border-bottom mb-0 pb-2';
    email_time.innerHTML = `<span class="font-weight-bold">Sent on: </span> ${email.timestamp}`;
    const email_body = document.createElement('p');
    email_body.innerHTML = email.body;
    email_body.className = 'pt-2 border-bottom pb-2';
    const reply_button = document.createElement('button');
    reply_button.addEventListener('click', () => reply_email(email));
    reply_button.innerHTML = 'Reply';
    reply_button.className = 'btn btn-sm btn-outline-primary float-right';
    document.querySelector('#individual-email-view').append(email_sender, email_receiver, email_subject, email_time, email_body, reply_button);
    // Update read to true
    return fetch(`/emails/${email_id}`, {
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })
    })
    
  })
  .catch((error) => {
    console.log(error);
  });
}


function archive_email(email_id, event) {
  
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived:true
    })
  })
  // Redirect to user's inbox
  .then(load_mailbox('inbox'));
  // Stop event propagation
  event.stopImmediatePropagation();
 
}


function unarchive_email(email_id, event) {
  
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived:false
    })
  })
  // Redirect to user's inbox
  .then(load_mailbox('inbox'));
  // Stop event propagation
  event.stopImmediatePropagation();
  
}


function reply_email(email) {
 
  // Go to compose view
  compose_email();
  
  // Prefill composition fields
  document.querySelector('#compose-recipients').value = email.sender;
  if (email.subject.slice(0, 3) === 'Re:') {
    document.querySelector('#compose-subject').value = email.subject;
  } else {
    document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
  }
  document.querySelector('#compose-body').value = `On  ${email.timestamp}  ${email.sender}  wrote:                                              
  "${email.body}".
  
  `;

}

