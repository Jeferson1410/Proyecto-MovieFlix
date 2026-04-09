# MATHUASSFLIX 🎬✨

¡Bienvenido a **MATHUASSFLIX**, una experiencia premium de streaming construida con tecnologías modernas y enfocada fuertemente en una interfaz de usuario espectacular!

> Visita el proyecto en vivo: [MATHUASSFLIX en Firebase](https://mathuassflix-pro-final.web.app)

## 🌟 Descripción General

MATHUASSFLIX es una plataforma interactiva de descubrimiento y visualización de Películas y Series. El objetivo principal de este proyecto es deslumbrar al usuario con una experiencia visual moderna, fluida y con una estética que mezcla toques "cyberpunk", neón y *glassmorphism*

Todo el contenido multimedia es impulsado dinámicamente usando **The Movie Database (TMDB) API**, mientras que la autenticación y el hosting de la aplicación recaen de manera segura en **Firebase**

## 🚀 Características Principales

- **Diseño Aesthetic Premium:** Efectos *glassmorphism*, desenfoques (blurs) elegantes, sombras dinámicas y paletas de colores cuidadosamente curadas para una inmersión total
- **Buscador Inteligente (SmartSearch):** Un motor de búsqueda instantáneo, en tiempo real, que escanea por películas, series y actores, manteniéndose siempre listo para la próxima consulta
- **Detalle de Contenido Profundo:** Modales expansivos que muestran descripciones, puntuaciones, tráilers embebidos (CinemaPlayer) y metadatos importantes de la producción, todo en capas organizadas mediante `z-index`.
- **Autenticación (Auth):** Sistema robusto de cuenta de usuarios manejado por Firebase, con modales intuitivos de Login y Registro que mejoran la experiencia con notificaciones "Toast" fluidas y alta visibilidad
- **Responsividad Completa:** Diseño perfectamente adaptable desde pantallas gigantes hasta dispositivos móviles, usando layouts de CSS Grid optimizados al píxel
- **Seguridad Garantizada:** Ocultación de credenciales sensibles (API Keys) a través de un estricto archivo `.env` configurado e ignorado en controles de versiones (.gitignore)

## 🛠️ Tecnologías Empleadas

El proyecto está diseñado sobre una pila tecnológica confiable y rápida:

- **Core & Interfaz:** `React` (con soporte para Hooks y Context) montado sobre `Vite` para una compilación ultrarrápida
- **Estilos:** `CSS3 Puro` / Vainilla para aprovechar la máxima flexibilidad en animaciones suaves y variables de estilo
- **Backend & Auth:** `Firebase` (Authentication, Firestore, Hosting).
- **Consumo de API:** `Axios` conectando a **TMDB API**
- **Iconos y Animaciones:** `Lucide React` y `Framer Motion`

## 📂 Estructura del Proyecto

El corazón de la lógica y diseño se encuentra en la carpeta `Netflix-Personal/src`:

* `components/`: Contenedores independientes y reusables como el Menú de Usuario (UserMenu), Barra de Filtros (FilterBar), Resultados (MovieGrid), entre otros
* `services/`: Lógica centralizada para las llamadas nativas de Firebase y TMDB
* `App.jsx` y `main.jsx`: Archivos de configuración principal de React donde convergen las interacciones

## 💻 Instalación y Despliegue Local

Para ejecutar MATHUASSFLIX en tu máquina local:

1. **Clona este repositorio:**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   ```
2. **Entra al directorio del ecosistema React:**
   ```bash
   cd Proyecto-MovieFlix/Netflix-Personal
   ```
3. **Instala las dependencias:**
   ```bash
   npm install
   ```
4. **Configura las Variables de Entorno:**
   Crea un archivo `.env` dentro de `Netflix-Personal/` que contenga las API Keys requeridas de esta forma:
   ```env
   VITE_TMDB_API_KEY=tu_api_key_de_tmdb
   VITE_FIREBASE_API_KEY=tu_api_key_de_firebase
   VITE_FIREBASE_AUTH_DOMAIN=tu_dominio...
   ...
   ```
5. **Inicia el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

## 🔒 Privacidad y Setup de Repositorio

Asegúrate de no enviar accidentalmente el archivo `.env` ni los logs (`firebase-debug.log`) y dependencias al repositorio, verificando que tu archivo `.gitignore` incluya:
```gitignore
*.env
*.env.*
node_modules/
firebase-debug.log
.firebase/
```

🚀 *Hecho con pasión por la UI/UX y el buen código*