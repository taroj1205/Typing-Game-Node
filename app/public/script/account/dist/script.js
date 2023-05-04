var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
var userInput = document.getElementById('username');
var currentPasswordInput = document.getElementById('current-password');
var newPasswordInput = document.getElementById('new-password');
var confirmPasswordInput = document.getElementById('confirm-password');
var changePasswordButton = document.getElementById('change-password-button');
var changePasswordForm = document.getElementById('change-password-form');
var showSuccessMessage = function () {
    var successMessage = document.createElement('div');
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
    setTimeout(function () {
        successMessage.remove();
    }, 5000);
};
var showFailMessage = function () {
    var failMessage = document.createElement('div');
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
    setTimeout(function () {
        failMessage.remove();
    }, 5000);
};
var checkPasswordsMatch = function () {
    var newPassword = newPasswordInput.value;
    var confirmPassword = confirmPasswordInput.value;
    if (newPassword === confirmPassword) {
        changePasswordButton.disabled = false;
    }
    else {
        changePasswordButton.disabled = true;
    }
};
newPasswordInput.addEventListener('input', checkPasswordsMatch);
confirmPasswordInput.addEventListener('input', checkPasswordsMatch);
var changePassword = function () { return __awaiter(_this, void 0, void 0, function () {
    var username, currentPassword, newPassword, confirmPassword, response, data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                changePasswordButton.disabled = true;
                username = userInput.value;
                currentPassword = currentPasswordInput.value;
                newPassword = newPasswordInput.value;
                confirmPassword = confirmPasswordInput.value;
                if (newPassword !== confirmPassword) {
                    console.error('New passwords do not match');
                    // Show an error message to the user
                    showFailMessage();
                }
                return [4 /*yield*/, fetch('/change-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: username, currentPassword: currentPassword, newPassword: newPassword })
                    })];
            case 1:
                response = _a.sent();
                return [4 /*yield*/, response.json()];
            case 2:
                data = _a.sent();
                if (data.success) {
                    console.log('Password change successful!');
                    showSuccessMessage();
                    // Clear the form inputs
                    changePasswordForm.reset();
                }
                else {
                    console.error('Password change failed:', data.error);
                    // Show an error message to the user
                    showFailMessage();
                }
                changePasswordButton.disabled = false;
                return [2 /*return*/];
        }
    });
}); };
changePasswordForm.addEventListener('submit', function (event) {
    event.preventDefault();
    changePassword();
});
