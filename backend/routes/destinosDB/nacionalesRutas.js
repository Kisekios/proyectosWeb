app.get('/destinos/nacionales', async (req, res) => {
    try {
      const places = await destinosDB.collection('nacionales').find().toArray();
      res.json(places);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });