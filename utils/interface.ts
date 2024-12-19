interface Student {
    name: String, 
    age: String, 
    class: String, 
    school: String,


    idUsers: String[],
}

interface User {
    name: String, 
    email: String,
    password: String, 
    Phone: String     
    idStudent: String[],
}

interface Notification {
    title: String,
    body: String,
    imageUrl: String,
    status: String,
    date: String,
    time: String
}