module.exports = {
  apps: [
    {
      name: 'e-visa-backend',
      script: './dist/apps/backend/main.js',
      cwd: '/var/www/html/e_visa',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000 // O el puerto que use tu backend
      }
    },
    {
      name: 'e-visa-frontend',
      // Apuntamos al server.js dentro de la carpeta standalone. ¡Esto es clave!
      script: './dist/apps/frontend/.next/standalone/server.js',
      cwd: '/var/www/html/e_visa',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 4000 // O el puerto que use tu frontend
      }
    }
  ]
};