import { portfolio } from "../index.js";

export const createAllIndexes = async () => {
  const collections = {
    usuarios: portfolio.collection("usuarios")
/*     proyectos: portfolio.collection("proyectos"),
    destinos: portfolio.collection("destinos") */
  };

  const indexRegistry = {
    usuarios: [
      {
        key: { email: 1 },
        options: {
          unique: true,
          name: "email_unique_idx",
          partialFilterExpression: { email: { $exists: true } }
        }
      },
      {
        key: { nombre: 1 },
        options: {
          unique: true,
          name: "nombre_idx"
        }
      },
      {
        key: { createdAt: -1 },
        options: {
          name: "createdAt_desc_idx"
        }
      }
    ]/* ,
    proyectos: [
      {
        key: { nombre: 1 },
        options: {
          unique: true,
          name: "proyecto_nombre_idx"
        }
      },
      {
        key: { estado: 1, prioridad: -1 },
        options: {
          name: "estado_prioridad_compuesto_idx"
        }
      }
    ],
    destinos: [
      {
        key: { pais: 1 },
        options: {
          name: "pais_idx"
        }
      },
      {
        key: { tipo: 1, activo: 1 },
        options: {
          name: "tipo_activo_idx"
        }
      }
    ] */
  };

  const ensureIndex = async (collection, key, options) => {
    const existing = await collection.listIndexes().toArray();
    const found = existing.some(idx => idx.name === options.name);
    if (!found) {
      await collection.createIndex(key, options);
      console.log(`✅ Índice creado: ${options.name}`);
    } else {
      console.log(`ℹ️ Índice ya existe: ${options.name}, omitido`);
    }
  };

  try {
    console.log("🔍 Inicializando índices...");

    for (const [name, indexes] of Object.entries(indexRegistry)) {
      const collection = collections[name];
      for (const { key, options } of indexes) {
        await ensureIndex(collection, key, options);
      }
    }

    console.log("✅ Todos los índices fueron verificados y aplicados\n");
  } catch (error) {
    console.error("❌ Error al crear índices:", error.message);
    throw error;
  }
};