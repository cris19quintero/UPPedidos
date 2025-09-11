# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list

# 🍔 UTPedidos - Sistema de Pedidos Universitario

Una aplicación web moderna para gestionar pedidos de comida en las cafeterías de la Universidad Tecnológica de Panamá.

## 🚀 Características

- ✅ **Autenticación de usuarios**
- 🏢 **Múltiples cafeterías** (Edificios 1, 2 y 3)
- 🍽️ **Menús dinámicos** organizados por categorías
- 🛒 **Carrito de compras** persistente
- 📱 **Diseño responsive** para móviles y escritorio
- 📦 **Gestión de pedidos** (pendientes y expirados)
- 👤 **Perfil de usuario** editable
- ⏰ **Horarios de atención** claramente definidos

## 🛠️ Tecnologías Utilizadas

- **Frontend:** React 18.2 + Vite
- **Enrutamiento:** React Router v6
- **Estilos:** CSS personalizado con variables CSS
- **Gestión de Estado:** Context API
- **HTTP Client:** Axios
- **Deployment:** Vercel

## 📁 Estructura del Proyecto

```
utpedidos-react/
├── public/
│   ├── images/               # Imágenes de logos, cafeterías, etc.
│   │   ├── logo.png
│   │   ├── logoUTP.png
│   │   ├── cafeteria1.png
│   │   ├── cafeteria2.png
│   │   └── cafeteria3.png
│   └── index.html
├── src/
│   ├── components/           # Componentes reutilizables
│   │   ├── CartModal.jsx
│   │   ├── CafeteriaCard.jsx
│   │   ├── MenuCategory.jsx
│   │   ├── Navbar.jsx
│   │   └── ProtectedRoute.jsx
│   ├── context/              # Context API para estado global
│   │   ├── AuthContext.js
│   │   └── CartContext.js
│   ├── pages/                # Páginas principales
│   │   ├── Login.jsx
│   │   ├── Principal.jsx
│   │   ├── Menu.jsx
│   │   ├── Pedidos.jsx
│   │   └── Perfil.jsx
│   ├── services/             # Servicios y API
│   │   └── api.js
│   ├── styles/               # Archivos CSS
│   │   ├── Login.css
│   │   ├── Menu.css
│   │   └── [otros archivos CSS]
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
├── vercel.json
└── README.md
```

## 🔧 Instalación y Configuración

### Prerrequisitos
- Node.js 16 o superior
- npm o yarn

### Pasos para instalar

1. **Clona el repositorio:**
   ```bash
   git clone [tu-repositorio]
   cd utpedidos-react
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

3. **Configura las imágenes:**
   - Coloca todas las imágenes en la carpeta `public/images/`
   - Asegúrate de tener:
     - `logo.png` (logo de UTPedidos)
     - `logoUTP.png` (logo de la UTP)
     - `cafeteria1.png`, `cafeteria2.png`, `cafeteria3.png`
     - Imágenes de comida (opcional)

4. **Inicia el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

5. **Abre tu navegador en:** `http://localhost:3000`

## 🚀 Deployment en Vercel

### Opción 1: Deploy desde Git (Recomendado)

1. **Sube tu código a GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Ve a [Vercel.com](https://vercel.com)**
3. **Conecta tu repositorio de GitHub**
4. **Vercel detectará automáticamente que es un proyecto Vite**
5. **Haz clic en "Deploy"**

### Opción 2: Deploy manual

1. **Construye el proyecto:**
   ```bash
   npm run build
   ```

2. **Instala Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

3. **Despliega:**
   ```bash
   vercel --prod
   ```

## 📝 Configuración de Variables de Entorno

Si necesitas variables de entorno, crea un archivo `.env` en la raíz del proyecto:

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=UTPedidos
```

## 🎨 Personalización de Estilos

Los colores principales se definen en `src/index.css`:

```css
:root {
  --primary: #7b1fa2;        /* Morado principal */
  --primary-light: #9c27b0;  /* Morado claro */
  --primary-dark: #5e1687;   /* Morado oscuro */
  /* ... otros colores */
}
```

## 🔐 Sistema de Autenticación

Actualmente implementado con datos dummy para desarrollo. Para producción:

1. **Configura un backend** (Node.js, Python, etc.)
2. **Actualiza `src/services/api.js`** con tu endpoint real
3. **Modifica `src/context/AuthContext.js`** para usar la API real

## 🛒 Gestión de Carrito

- Los datos del carrito se persisten en `localStorage`
- Se limpia automáticamente al cerrar sesión
- Soporta múltiples productos de diferentes cafeterías

## 📱 Responsive Design

- **Mobile-first approach**
- **Breakpoints:** 768px para tablets/móviles
- **Menú de hamburguesa** en dispositivos móviles
- **Touch-friendly** botones y elementos

## 🐛 Solución de Problemas Comunes

### Error: "Failed to resolve import"
```bash
npm install
npm run dev
```

### Imágenes no se muestran
- Verifica que estén en `public/images/`
- Usa rutas relativas: `/images/logo.png`

### Error de routing en producción
- Vercel.json ya está configurado para SPA
- Todas las rutas redirigen a index.html

### Carrito no persiste
- Verifica que localStorage esté habilitado
- Revisa la consola para errores de JavaScript

## 🔄 Scripts Disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Construir para producción
npm run preview  # Preview de la build
npm run lint     # Verificar código
```

## 🎯 Próximas Mejoras

- [ ] **Backend real** con base de datos
- [ ] **Sistema de pagos** integrado
- [ ] **Notificaciones push** para pedidos
- [ ] **Sistema de reviews** para productos
- [ ] **Dashboard administrativo**
- [ ] **API REST** completa
- [ ] **Tests unitarios** e integración

## 📧 Contacto y Soporte

Para preguntas o soporte técnico, contacta al equipo de desarrollo.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ve el archivo [LICENSE](LICENSE) para más detalles.

---

⭐ **¡Si te gusta este proyecto, dale una estrella en GitHub!**