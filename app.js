const express = require('express');
const ejs = require('ejs');
const multer = require('multer');
const session = require('express-session');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

const users = [
  { username: 'usuario1', password: 'contrasena1' },
  { username: 'usuario2', password: 'contrasena2' }
];

// Configuración de multer para la subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'files'); // Carpeta donde se guardarán los archivos
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Puedes cambiar la forma en que se nombra el archivo si es necesario
  }
});

const upload = multer({ storage: storage });

// Middleware para analizar datos del formulario
app.use(express.urlencoded({ extended: true }));

// Configuración de express-session
app.use(session({
  secret: 'secreto', // Cambia esto por una cadena más segura
  resave: false,
  saveUninitialized: true
}));

// Middleware para verificar si el usuario está autenticado
const authenticateUser = (req, res, next) => {
  if (req.session && req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
};

// Configuración de EJS como motor de plantillas
app.set('view engine', 'ejs');

// Rutas

// Página de inicio
app.get('/', (req, res) => {
  res.render('index', { title: '¡Hola mundo!', user: req.session.user });
});

// Página de autenticación
app.get('/login', (req, res) => {
  res.render('login', { title: 'Iniciar sesión' });
});

// Procesamiento del formulario de autenticación
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Buscar el usuario en la lista de usuarios
  const user = users.find(user => user.username === username && user.password === password);

  // Verifica las credenciales (fijas para estudio)
  if (user) {
    req.session.user = { username: user.username };
    res.redirect('/');
  } else {
    res.render('login', { title: 'Iniciar sesión', error: 'Credenciales inválidas' });
  }
});

// Página de cierre de sesión
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// Página protegida que requiere autenticación
app.get('/protected', authenticateUser, (req, res) => {
  res.render('protected', { title: 'Página protegida', user: req.session.user });
});

// Página "Acerca de nosotros"
app.get('/about', (req, res) => {
  res.render('about', { title: 'Acerca de nosotros' });
});

// Página "Contáctanos"
app.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contáctanos' });
});

// Página "Enviar datos" - Mostrar el formulario
app.get('/submit', (req, res) => {
  res.render('submit', { title: 'Enviar datos' });
});

// Procesamiento del formulario de envío de datos (POST)
app.post('/submit', upload.single('archivo'), (req, res) => {
  // Verificar si se recibió un archivo
  if (!req.file) {
    return res.status(400).send('No se ha proporcionado un archivo');
  }

  // Obtener el archivo y la información del formulario
  const archivo = req.file;
  const formData = req.body;

  // Guardar el archivo en la carpeta 'files'
  const filePath = path.join(__dirname, 'files', archivo.originalname);

  // Usar fs.writeFile en lugar de fs.writeFileSync
  fs.writeFile(filePath, archivo.buffer.toString(), (err) => {
    if (err) {
      console.error('Error al guardar el archivo:', err);
      return res.status(500).send('Error al guardar el archivo');
    }

    // Verificar si el archivo existe después de escribirlo
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        console.error('Error: El archivo no se encuentra en la carpeta "files".');
        return res.status(500).send('Error: El archivo no se encuentra en la carpeta "files".');
      }

      // Archivo guardado correctamente
      console.log('Archivo guardado correctamente');

      // Redirigir a una página de éxito o a donde sea necesario
      res.redirect('/');
    });
  });
});

// Procesamiento del formulario de contacto (POST)
app.post('/contact', (req, res) => {
  const { name, email, comments } = req.body;

  // Construir el objeto de datos
  const data = {
    name,
    email,
    comments,
  };

  // Convertir el objeto de datos a formato de cadena
  const dataString = JSON.stringify(data, null, 2) + '\n';

  // Ruta del archivo de destino
  const filePath = path.join(__dirname, 'public', 'contact_data.txt');

  // Guardar los datos en el archivo
  fs.writeFile(filePath, dataString, { flag: 'a' }, (err) => {
    if (err) {
      console.error('Error al guardar los datos:', err);
      return res.status(500).send('Error al guardar los datos');
    }

    console.log('Datos guardados correctamente');
    res.redirect('/');
  });
});

// Middleware de manejo de errores 404
app.use((req, res, next) => {
  res.status(404).render('404');
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('¡Algo salió mal!');
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`La aplicación está escuchando en http://localhost:${port}`);
});
