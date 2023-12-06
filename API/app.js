const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use(express.static('imagenes'));

const registros = []; //diccionario apra registros

let carrito = []; // diccionario de carito

const catalogo = { //diccionaro de catalogo
  memoriasRAM: [
    { tipo: 'RAM DDR5', precio: 700, disponibles: 10, imagen: 'ram1.jpg' },
    { tipo: 'RAM DDR4', precio: 400, disponibles: 20, imagen: 'ram2.jpg' },
    { tipo: 'RAM DDR3', precio: 200, disponibles: 15, imagen: 'ram3.jpg' },
  ],
  laptops: [
    { modelo: 'Laptop HP Pavilion i5', precio: 7000, disponibles: 1, imagen: 'lap1.jpg' },
    { modelo: 'Laptop HP Pavilion i5 Touch', precio: 7500, disponibles: 1, imagen: 'lap2.jpg' },
    { modelo: 'Laptop Dell Latitude', precio: 4500, disponibles: 1, imagen: 'lap3.jpg' },
    { modelo: 'Laptop HP Pavilion i7', precio: 10000, disponibles: 1, imagen: 'lap4.jpg' },
  ],
  graficas: [
    { tipo: 'RTX 3060', precio: 5000, disponibles: 1, imagen: 'graf1.jpg' },
    { tipo: 'RTX 3060 ti', precio: 6000, disponibles: 1, imagen: 'graf2.jpg' },
    { tipo: 'RTX 4060 ti', precio: 8000, disponibles: 1, imagen: 'graf3.jpg' },
    { tipo: 'RTX 4000', precio: 5000, disponibles: 1, imagen: 'graf4.jpg' },
  ],
  discosSolidos: [
    { capacidad: '256 GB', precio: 300, disponibles: 5, imagen: 'dis1.jpg' },
    { capacidad: '512 GB', precio: 500, disponibles: 8, imagen: 'dis2.jpg' },
    { capacidad: '1 TB', precio: 700, disponibles: 4, imagen: 'dis3.jpg' },
  ],
};

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html'); // ruta principal en el inedex
});

app.post('/carrito', (req, res) => {  //ruta lamacenamiento del carrito
  const producto = req.body.producto;
  carrito.push(producto);
  res.json({ mensaje: `Producto ${producto.nombre} añadido al carrito` });
});

app.get('/verCarrito', (req, res) => { // ruta para visualizar el carrit 
  const detallesCarrito = carrito.map(producto => {
    const categoria = producto.categoria;
    const productoCatalogo = catalogo[categoria].find(item => item.tipo === producto.tipo || item.modelo === producto.modelo || item.capacidad === producto.capacidad);
    return { nombre: productoCatalogo.tipo || productoCatalogo.modelo || productoCatalogo.capacidad, precio: productoCatalogo.precio, imagen: productoCatalogo.imagen };
  });

  const total = detallesCarrito.reduce((suma, producto) => suma + producto.precio, 0);

  res.json({ productos: detallesCarrito, total: total });
});

app.post('/eliminarProducto', (req, res) => { // ruta para eliminar algun producto de lc carrito
  const productoAEliminar = req.body.producto;

  //  funcion para buscar y eliminar el rproducto espefisico 
  const index = carrito.findIndex(producto => (
    producto.tipo === productoAEliminar.tipo ||
    producto.modelo === productoAEliminar.modelo ||
    producto.capacidad === productoAEliminar.capacidad
  ));

  if (index !== -1) {
    carrito.splice(index, 1);
    res.json({ mensaje: `Producto eliminado del carrito` });
  } else {
    res.json({ mensaje: `El producto no se encontró en el carrito` });
  }
});

app.post('/confirmarPago', (req, res) => { // confirmacion de que se quiere comprar lo espefisicado
  carrito = [];
  res.json({ mensaje: 'Pago confirmado. Gracias por su compra.' });
});

app.get('/catalogo/:categoria', (req, res) => { // ruta para almacenar las categorias de productos 
  const categoria = req.params.categoria;
  res.json(catalogo[categoria]);
  
});
  
app.post('/agregarProducto/:categoria', (req, res) => {
  const categoria = req.params.categoria; //  inventar un neuvo producto con su categoria espefisica 
  const nuevoProducto = req.body;

  if (!catalogo[categoria]) {
    return res.status(404).json({ mensaje: `La categoría ${categoria} no existe en el catálogo.` });
  }

  if (!nuevoProducto || Object.keys(nuevoProducto).length === 0) {
    return res.status(400).json({ mensaje: 'El nuevo producto no tiene propiedades válidas.' });
  }

  // Agregar el nuevo producto a la categoría
  catalogo[categoria].push(nuevoProducto);

  res.json({ mensaje: `Producto agregado a la categoría ${categoria}`, producto: nuevoProducto });
});

app.post('/catalogo/:categoria', (req, res) => { // ruta paa que el nuevo producot
  const categoria = req.params.categoria;              // este en la categoria seleccionada 
  const nuevoProducto = req.body.producto;
  
  // Añadir el nuevo producto al catálogo
  catalogo[categoria].push(nuevoProducto);

  res.json({ mensaje: `Producto ${nuevoProducto.tipo} añadido a la categoría ${categoria}` });
});
app.post('/registrar', (req, res) => {
    const { vendedor, cliente, montoPagar, abonoDado, fecha, concepto, pago } = req.body; // registro del ticket para cliente 
  
    // Verifica si alguno de los campos está indefinido o vacío
    if (!vendedor || !cliente || !montoPagar || !abonoDado || !fecha || !concepto || !pago) {
      return res.status(400).send('Todos los campos son obligatorios');
    }
  
    // Convierte las cantidades a números
    const montoPagarNum = parseFloat(montoPagar);
    const abonoDadoNum = parseFloat(abonoDado);
  
    if (isNaN(montoPagarNum) || isNaN(abonoDadoNum)) {
      return res.status(400).send('El monto a pagar y el abono dado deben ser números válidos');
    }
  
    const total = montoPagarNum - abonoDadoNum;
  
    const registro = {
      vendedor,
      cliente,
      montoPagar: montoPagarNum,
      abonoDado: abonoDadoNum,
      total,                        //campos que se llenaran 
      fecha,
      concepto,
      pago,
    };
    registros.push(registro);
  
    res.redirect('/');
  });

app.get('/registros', (req, res) => {
  res.sendFile(__dirname + '/public/registros.html'); // talbe apra los reisgtos 
});

app.get('/api/registros', (req, res) => {  //  llamar ala ruta donde los registros se almacenaron 
  res.json(registros);
});

app.listen(PORT, () => {
  console.log(`Servidor en ejecución en http://localhost:${PORT}`);  // peurot de la aipi 
});
