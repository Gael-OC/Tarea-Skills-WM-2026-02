# Vitrina y PostgreSQL

Abre **index.html** en un navegador para usar la visualización en tema claro. También puedes abrir **oscuro.html** para verla en tema oscuro. Los dos archivos funcionan sin servidor ni conexión a internet: puedes copiar esta carpeta completa para tu presentación.

Selecciona una tabla con los botones, haz clic en un cajón o enfoca la figura y usa las flechas del teclado. La animación respeta la configuración de movimiento reducido del sistema.

Los registros y sus identificadores son ejemplos. El contenido sigue el contrato de datos de Vitrina.

Para modificar la ilustración y regenerar ambas páginas, instala Node.js 20.10 o superior y ejecuta desde esta carpeta:

```sh
node build.mjs --light
node build.mjs
```

La carpeta `kit` contiene las herramientas de dibujo de Anatomy y su licencia.
