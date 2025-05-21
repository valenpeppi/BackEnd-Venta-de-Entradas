class User {
    constructor(nameAndsurname, email, password, dni, birthdate) {
        this.nameAndsurname = nameAndsurname;
        this.email = email;
        this.password = password;
        this.dni = dni;
        this.birthdate = birthdate;
        this.age = this.calculateAge(birthdate);
    }

    calculateAge(birthdate) {
        const birth = new Date(birthdate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }
}

let currentUser = null;

function createUser() {
    const nameAndsurname = document.getElementById("nameAndsurname").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const dni = document.getElementById("dni").value;
    const birthdate = document.getElementById("birthdate").value;
    return new User(nameAndsurname, email, password, dni, birthdate);
}

function readUser(user) {
    return `Nombre y Apellido: ${user.nameAndsurname}
Email: ${user.email}
DNI: ${user.dni}
Fecha de Nacimiento: ${user.birthdate}
Edad: ${user.age}`;
}

function updateUser(user, newEmail, newPassword) {
    user.email = newEmail;
    user.password = newPassword;
    return user;
}

function deleteUser(user) {
    return null;
}

// Lógica de pestañas y eventos
function showTab(tabId) {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
}

function handleCreateUser() {
    currentUser = createUser();
    alert("Usuario creado correctamente.");
}

function handleReadUser() {
    const output = document.getElementById("readResult");
    if (currentUser) {
        output.textContent = readUser(currentUser);
    } else {
        output.textContent = "No hay usuario creado.";
    }
}

function handleUpdateUser() {
    const newEmail = document.getElementById("newEmail").value;
    const newPassword = document.getElementById("newPassword").value;
    const output = document.getElementById("updateResult");

    if (currentUser) {
        currentUser = updateUser(currentUser, newEmail, newPassword);
        output.textContent = "Usuario actualizado correctamente.";
    } else {
        output.textContent = "No hay usuario para actualizar.";
    }
}

function handleDeleteUser() {
    const output = document.getElementById("deleteResult");

    if (currentUser) {
        currentUser = deleteUser(currentUser);
        output.textContent = "Usuario eliminado.";
    } else {
        output.textContent = "No hay usuario para eliminar.";
    }
}

// CRUD TIPO EVENTO

function createTypeEvent() {
    const idTypeEvent = document.getElementById("idTypeEvent").value;
    const nameTypeEvent = document.getElementById("nameTypeEvent").value;
    return { idTypeEvent, nameTypeEvent };
}

function readTypeEvent(typeEvent) {
    return `ID: ${typeEvent.idTypeEvent}
Nombre: ${typeEvent.nameTypeEvent}`;
}

function deleteTypeEvent(typeEvent) {
    // borrar el evento
    return null;
}
