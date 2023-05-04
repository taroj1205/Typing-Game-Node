const userInput = document.getElementById('username') as HTMLInputElement;
const currentPasswordInput = document.getElementById('current-password') as HTMLInputElement;
const newPasswordInput = document.getElementById('new-password') as HTMLInputElement;
const confirmPasswordInput = document.getElementById('confirm-password') as HTMLInputElement;
const changePasswordButton = document.getElementById('change-password-button') as HTMLButtonElement;
const changePasswordForm = document.getElementById('change-password-form') as HTMLFormElement;

const showSuccessMessage = () => {
  const successMessage = document.createElement('div');
  successMessage.innerText = 'Password changed successfully.';
  successMessage.style.backgroundColor = 'green';
  successMessage.style.color = 'white';
  successMessage.style.padding = '10px';
  successMessage.style.borderRadius = '5px';
  successMessage.style.position = 'fixed';
  successMessage.style.top = '10px';
  successMessage.style.left = '50%';
  successMessage.style.transform = 'translateX(-50%)';
  document.body.appendChild(successMessage);

  setTimeout(() => {
    successMessage.remove();
  }, 5000);
};

const showFailMessage = () => {
  const failMessage = document.createElement('div');
  failMessage.innerText = 'Password change failed. Username or Password is invalid';
  failMessage.style.backgroundColor = 'red';
  failMessage.style.color = 'white';
  failMessage.style.padding = '10px';
  failMessage.style.borderRadius = '5px';
  failMessage.style.position = 'fixed';
  failMessage.style.top = '10px';
  failMessage.style.left = '50%';
  failMessage.style.transform = 'translateX(-50%)';
  document.body.appendChild(failMessage);

  setTimeout(() => {
    failMessage.remove();
  }, 5000);
};

const checkPasswordsMatch = () => {
  const newPassword = newPasswordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  if (newPassword === confirmPassword) {
    changePasswordButton.disabled = false;
  } else {
    changePasswordButton.disabled = true;
  }
};

newPasswordInput.addEventListener('input', checkPasswordsMatch);
confirmPasswordInput.addEventListener('input', checkPasswordsMatch);

const changePassword = async () => {
  changePasswordButton.disabled = true;
  const username = userInput.value;
  const currentPassword = currentPasswordInput.value;
  const newPassword = newPasswordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (newPassword !== confirmPassword) {
    console.error('New passwords do not match');
    // Show an error message to the user
    showFailMessage();
  }

  const response = await fetch('/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, currentPassword, newPassword }),
  });
  const data = await response.json();

  if (data.success) {
    console.log('Password change successful!');
    showSuccessMessage();
    // Clear the form inputs
    changePasswordForm.reset();
  } else {
    console.error('Password change failed:', data.error);
    // Show an error message to the user
    showFailMessage();
  }
  changePasswordButton.disabled = false;
};

changePasswordForm.addEventListener('submit', (event) => {
  event.preventDefault();
  changePassword();
});