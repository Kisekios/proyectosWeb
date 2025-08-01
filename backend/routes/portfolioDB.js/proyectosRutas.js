// Rutas para la base de datos 'portfolio'
  app.get('/portfolio/proyectos', async (req, res) => {
    try {
      const projects = await portfolioDB.collection('proyectos').find().toArray();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });