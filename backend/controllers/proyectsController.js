import proyectoModel from '../models/proyectosModelo.js'

class proyectosController {
    constructor() {

    }

    async createProyect(req, res) {
        try {
            const data = await proyectoModel.create(req.body)
            res.status(201).json({ data })
        } catch (error) {
            res.status(500).send(error)
        }
    }

    async getProyects(req, res) {
        try {
            const data = await proyectoModel.getAll()
            res.status(201).json(data)
        } catch (error) {
            res.status(500).send(error)
        }
    }

    async getProyect(req, res) {
        try {
            const { id } = req.params;
            if (!id || id.length !== 24) {  // Los ObjectId tienen 24 caracteres hex
                return res.status(400).json({ error: "ID inválido" });
            }
            const data = await proyectoModel.getOne(id);
            if (!data) {
                return res.status(404).json({ error: "Proyecto no encontrado" });
            }
            res.status(200).json(data);  // 200 es más apropiado que 201 para GET
        } catch (error) {
            res.status(500).send(error.message);
        }
    }


    async updateProyect(req, res) {
        try {
            const { id } = req.params
            if (!id || id.length !== 24) {  // Los ObjectId tienen 24 caracteres hex
                return res.status(400).json({ error: "ID inválido" });
            }
            const data = await proyectoModel.update(id, req.body);
            if (!data) {
                return res.status(404).json({ error: "Proyecto no encontrado" });
            }
            res.status(200).json(data);
        } catch (error) {
            res.status(500).send(error)
        }
    }

    async deleteProyect(req, res) {
        try {
            const { id } = req.params
            if (!id || id.length !== 24) {  // Los ObjectId tienen 24 caracteres hex
                return res.status(400).json({ error: "ID inválido" });
            }
            const data = await proyectoModel.delete(id);
            if (!data) {
                return res.status(404).json({ error: "Proyecto no encontrado" });
            }
            res.status(200).json(data);
        } catch (error) {
            res.status(500).send(error)
        }
    }

}

export default new proyectosController()